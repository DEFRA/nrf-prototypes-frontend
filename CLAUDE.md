# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan, Review, Validate, Repeat

### Before starting work

- Always in plan mode to make a plan
- After get the plan, make sure you Write the plan to .claude/tasks/{CURRENT_DATE_TIME}\_TASK_NAME.md.
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
- If the task require external knowledge or certain package, also research to get latest knowledge (Use Task tool for research)
- Don't over plan it, always think MVP.
- Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing

- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

This is a DEFRA (Department for Environment, Food & Rural Affairs) Node.js frontend application built on the Core Delivery Platform (CDP) template. It uses Hapi.js for the server framework and integrates with `@defra/forms-engine-plugin` v2 for form handling.

## Key Commands

### Development

```bash
npm run dev              # Run in development mode with hot reload
npm run dev:debug        # Run in debug mode with breakpoint support
PORT=3001 npm run dev    # Run on custom port (default: 3000)
```

### Testing

```bash
npm test                 # Run all tests with coverage
npm run test:watch       # Run tests in watch mode
```

### Linting & Formatting

```bash
npm run lint             # Run ESLint and Stylelint
npm run lint:js:fix      # Auto-fix JavaScript linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Production

```bash
npm start                # Run in production mode (builds frontend first)
npm run build:frontend   # Build frontend assets only
```

### Docker

```bash
docker compose up --build -d                                    # Run full stack (app, Redis, MongoDB, LocalStack)
docker build --target development --tag nrf-frontend-starter:development .  # Development image
docker build --tag nrf-frontend-starter .                       # Production image
```

## Architecture

### Server Structure

**Entry Point**: `src/index.js` → `src/server/common/helpers/start-server.js`

**Server Setup** (`src/server/server.js`):

- Creates Hapi server with caching, session management, and security plugins
- Registers core plugins: logging, tracing, CSRF protection (Crumb), CSP
- Registers `@defra/forms-engine-plugin` with custom controllers and services
- Routes defined in `src/server/router.js`

### Core Architectural Patterns

**1. Plugin-Based Architecture**

- Server functionality organized as Hapi plugins
- Each route/feature area (home, about, health) is a separate plugin in `src/server/`
- Forms are handled by the `@defra/forms-engine-plugin` with custom controllers

**2. Configuration Management** (`src/config/config.js`)

- Uses `convict` for environment-based configuration
- Key configs: Redis/memory caching, session management, logging, proxy settings
- Environment-aware defaults (dev vs production)

**3. Session & Caching**

- Server-side caching via Catbox (Redis in production, Memory in dev)
- Configurable via `SESSION_CACHE_ENGINE` env var
- Redis connection: `src/server/common/helpers/redis-client.js`
- Session wrapper: `src/server/common/helpers/session-cache/session-cache.js`

**4. Forms Engine Integration**

- Form definitions stored in `src/server/forms-service.js`
- Custom controllers extend `QuestionPageController` (e.g., `MapDrawingController`)
- Forms use Defra Forms v2 schema with pages, components, conditions, and lists
- Custom views placed in `src/server/forms/views/`
- Services object provides: `formsService`, `outputService`, `formSubmissionService`

### View Layer (Nunjucks)

**Configuration**: `src/config/nunjucks/nunjucks.js`

- Template paths include: `govuk-frontend`, `src/server/common/templates`, `src/server/common/components`
- Shared layout: `src/server/common/templates/layouts/page.njk`
- Custom filters: `src/config/nunjucks/filters/` (e.g., formatCurrency, formatDate)
- Global context: `src/config/nunjucks/context/context.js`

**Forms Engine Override**: Forms plugin gets additional template paths and uses `layouts/page.njk` as base

### Frontend Build (Webpack)

**Entry**: `src/client/javascripts/application.js` and `src/client/stylesheets/application.scss`

- Webpack config: `webpack.config.js`
- Outputs to `.public/` directory (served by `serve-static-files` helper)
- Uses GOV.UK Frontend design system
- SCSS follows ITCSS architecture (variables, core, components, helpers, partials)

### Request Flow

1. Request hits router (`src/server/router.js`)
2. Route handled by controller (e.g., `src/server/home/controller.js`)
3. Controller uses Nunjucks view (e.g., `src/server/home/index.njk`)
4. View extends base layout with context from `src/config/nunjucks/context/context.js`
5. Errors caught by `catchAll` handler in `src/server/common/helpers/errors.js`

### Important Helpers

- **Logging**: `src/server/common/helpers/logging/logger.js` (Pino with ECS format)
- **Proxy**: `src/server/common/helpers/proxy/setup-proxy.js` (Undici ProxyAgent for HTTP requests)
- **Tracing**: Request tracing via `x-cdp-request-id` header
- **Health Check**: `/health` endpoint (required by platform)
- **Metrics**: AWS Embedded Metrics (enabled in production)

## Forms Engine V2 Specifics

### Custom Controllers

- Extend `QuestionPageController` from `@defra/forms-engine-plugin/controllers/QuestionPageController.js`
- Override `viewName` to use custom templates
- Register in `src/server/server.js` under plugin options `controllers` object

### Template File Extensions

**IMPORTANT**: Forms-engine templates **MUST use `.html` extension**, NOT `.njk`.

**Why:**
- The `@defra/forms-engine-plugin` registers its own `@hapi/vision` configuration
- This registration happens AFTER the main app's nunjucks config
- The forms-engine only registers the `html` engine, which overwrites the app's `njk` engine
- Custom form views in `src/server/forms/views/` must be `.html` files

**Example:**
```
✅ src/server/forms/views/nrf-quote-summary.html
❌ src/server/forms/views/nrf-quote-summary.njk
```

**Note**: Regular route views (home, about, error) can still use `.njk` because they're rendered before the forms-engine plugin overwrites the Vision config.

**Technical Details:**
- Forms-engine Vision registration: `node_modules/@defra/forms-engine-plugin/src/server/plugins/engine/vision.ts:38`
- Only registers: `engines: { html: { ... } }`
- Server registration order in `src/server/server.js`:
  1. Main app plugins (including nunjucksConfig with `.njk` support)
  2. Forms-engine plugin (re-registers Vision with only `.html` support)

### Form Definition Structure

- `metadata`: form slug, title, organization, submission details
- `definition`: pages, components, conditions, lists
- Pages have `path`, `components`, `controller` (optional), `condition` (optional)
- Components: RadiosField, TextField, FileUploadField, etc.
- Conditions control page flow based on component values

### Services

- `formsService.getFormMetadata(slug)`: fetch form metadata by slug
- `formsService.getFormDefinition(id)`: fetch form definition by ID
- `outputService.submit(request, formId, result)`: handle form submission
- `formSubmissionService.persistFiles(context, request, model)`: handle file uploads

## Naming Conventions

### File Names

- **kebab-case** for most files: `forms-service.js`, `session-cache.js`, `routes.js`
- **PascalCase** for controllers: `QuotePageController.js`, `MapDrawingController.js`

This convention makes it clear what kind of export to expect from the file.

### Constants

**All constants MUST use SCREAMING_SNAKE_CASE** to maintain consistency across the codebase.

- **Constant objects**: `LEVY_RATES`, `SUBMISSION_STATUS`, `STATUS_CODES`, `ROUTES`, `FORM_IDS`
- **Constant object properties**: `LEVY_RATES.DLL_RATE_PER_HOUSE`, `STATUS_CODES.OK`, `ROUTES.QUOTE`

This convention:

- Makes constants immediately distinguishable from regular variables
- Provides a single source of truth for values used across multiple files
- Prevents brittle hardcoded strings and magic numbers
- Improves maintainability by centralizing value definitions

**Example:**

```javascript
// Good ✅
export const SUBMISSION_STATUS = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  APPROVED: 'Approved'
}

// Bad ❌
export const submissionStatus = {
  pendingPayment: 'Pending Payment',
  paid: 'Paid',
  approved: 'Approved'
}
```

## Node.js Version

Requires Node.js >= 22.16.0 (use `nvm use` to set correct version)

## Testing

- Test framework: Vitest
- Coverage tool: @vitest/coverage-v8
- Tests colocated with source files (`.test.js` suffix)
- Component testing helpers: `src/server/common/test-helpers/component-helpers.js`
- Run with `TZ=UTC` to ensure consistent date/time behavior

## Important Notes

- **Pre-commit Hook**: Runs format:check, lint, and tests via Husky
- **Git Hook Setup**: Runs automatically on `npm install` via `postinstall` script
- **Windows Users**: Run `git config --global core.autocrlf false` to fix line ending issues
- **Proxy Configuration**: Uses `global-agent` with `HTTP_PROXY` env var for outbound requests
- **Security**: HSTS, XSS protection, noSniff, frame protection enabled by default
- **CSRF Protection**: Enabled via @hapi/crumb plugin
