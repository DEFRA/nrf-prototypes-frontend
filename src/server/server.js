import path from 'path'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import Crumb from '@hapi/crumb'
import plugin from '@defra/forms-engine-plugin'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './common/helpers/content-security-policy.js'
import { context } from '../config/nunjucks/context/context.js'
import services from './forms-service.js'
import { BuildingTypesController } from './forms/controllers/BuildingTypesController.js'
import { NRFQuoteSummaryController } from './forms/controllers/NRFQuoteSummaryController.js'

export async function createServer() {
  setupProxy()
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  })
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    Scooter,
    Crumb,
    contentSecurityPolicy,
    router
  ])

  await server.register({
    plugin,
    options: {
      services,
      controllers: {
        BuildingTypesController,
        NRFQuoteSummaryController
      },
      nunjucks: {
        baseLayoutPath: 'layouts/page.njk',
        paths: [
          'node_modules/govuk-frontend/dist/',
          'src/server/common/templates',
          'src/server/common/components',
          'src/server/forms/views'
        ]
      },
      viewContext: context,
      baseUrl: `http://localhost:${config.get('port')}`
    }
  })

  server.ext('onPreResponse', catchAll)

  return server
}
