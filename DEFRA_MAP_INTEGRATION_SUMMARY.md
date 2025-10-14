# DEFRA Map Integration Summary

**Date**: 2025-10-14
**Status**: ⚠️ Map initializes but tiles not rendering
**Branch**: main (uncommitted changes)

---

## Overview

This document summarizes all attempts to integrate the `@defra/flood-map` component into the nrf-prototypes-frontend application, including referencing the FMP (Flood Map for Planning) example implementation.

---

## Context & Goals

**Original Goal**: Add a map component to the `/upload-boundary` page to allow users to:
- Draw a red line boundary for their development site
- Upload a shapefile as an alternative
- Use the boundary for NRF quote calculations

**Why @defra/flood-map**:
- Official DEFRA component with UK-specific features
- Supports British National Grid (EPSG:27700)
- Includes drawing tools, search, and layer controls
- Designed for UK government services

---

## Reference Implementation: FMP Example

According to the session history, there was a reference to an FMP (Flood Map for Planning) example at `/tmp/forms-example`. This appears to be a working example of @defra/flood-map integrated with a forms application.

**Key things we tried to replicate from FMP example**:
- Map initialization patterns
- Configuration structure
- Integration with forms-engine-plugin
- Nunjucks template structure
- Asset bundling approach

**Note**: The exact location and current availability of this example should be verified.

---

## What We've Implemented

### 1. Added defra-map as Git Submodule

**Command**:
```bash
git submodule add https://github.com/DEFRA/flood-map.git defra-map
```

**Why submodule**: Allows us to:
- Track specific version of @defra/flood-map
- Make local modifications if needed
- Keep upstream updates separate
- Build from source for custom webpack config

**Status**: ✅ Submodule added, but has uncommitted modifications

---

### 2. Installed Dependencies

**Added to package.json**:
```json
{
  "dependencies": {
    "@arcgis/core": "^4.31.3",
    "@turf/distance": "^7.1.0",
    "@turf/helpers": "^7.1.0"
  }
}
```

**Why needed**: @defra/flood-map peer dependencies for Esri mapping SDK and geospatial utilities.

**Status**: ✅ Installed

---

### 3. Created Map Initialization Module

**File**: `src/client/javascripts/map/map-init.js`

**Key Features**:
- Fetches defra-map config from `/defra-map/config` endpoint
- Dynamically imports FloodMap from webpack alias
- Configures map styles (Topographic, Dark Gray, Light Gray)
- Sets up event listeners for map interactions
- Integrates with boundary file upload form

**Configuration Structure**:
```javascript
const mapStyles = {
  outdoor: {
    displayName: 'Topographic',
    basemap: 'topo-vector',  // Esri basemap identifier
    attribution: esriAttribution,
    iconUrl: '/assets/images/outdoor-map-icon.jpg'
  },
  // ... more styles
}

const floodMapOptions = {
  behaviour: 'inline',
  place: 'England',
  zoom: 7.7,
  center: [340367, 322766],  // British National Grid
  framework: 'esri',
  styles: baseMapStyles,
  queryArea: {
    heading: 'Draw site boundary',
    // ... drawing configuration
  }
}
```

**Status**: ✅ Created and configured

---

### 4. Created Server-Side Routes

**File**: `src/server/defra-map/routes.js`

**Endpoints**:

1. **GET `/defra-map/config`** - Returns map configuration:
   ```javascript
   {
     OS_ACCOUNT_NUMBER: process.env.OS_ACCOUNT_NUMBER || 'STUB_ACCOUNT',
     agolServiceUrl: 'https://environment.data.gov.uk/arcgis/rest/services',
     agolVectorTileUrl: 'https://tiles.arcgis.com/tiles',
     layerNameSuffix: '',
     featureLayerNameSuffix: ''
   }
   ```

2. **GET `/esri-token`** - Returns Esri API token:
   ```javascript
   {
     token: '',  // Empty for free basemaps
     expires: Date.now() + 3600000,
     durationMs: 3600000
   }
   ```

**Status**: ✅ Implemented

---

### 5. Updated Content Security Policy

**File**: `src/server/common/helpers/content-security-policy.js`

**Added domains**:
```javascript
connectSrc: [
  'self',
  'wss',
  'data:',
  // Esri/ArcGIS domains
  'https://js.arcgis.com',
  'https://static.arcgis.com',
  'https://tiles.arcgis.com',
  'https://cdn.arcgis.com',
  'https://basemaps.arcgis.com',
  'https://services.arcgisonline.com',
  // DEFRA/OS domains
  'https://api.os.uk',
  'https://environment.data.gov.uk'
]
```

**Why needed**: Allows browser to load:
- Esri SDK files
- Map tile data
- Basemap styles
- DEFRA ArcGIS services

**Status**: ✅ No CSP violations

---

### 6. Configured Webpack

**File**: `webpack.config.js`

**Key Changes**:

1. **Added webpack alias** for defra-map source:
   ```javascript
   resolve: {
     alias: {
       '/flood-map': path.join(dirname, 'defra-map/src/flood-map.js'),
       '/@arcgis-path': path.join(dirname, 'defra-map/node_modules/@arcgis')
     }
   }
   ```

2. **Added defra-map to babel include**:
   ```javascript
   include: [
     path.join(dirname, 'src/client'),
     path.join(dirname, 'defra-map/src')  // Process defra-map source
   ]
   ```

**Why needed**:
- Import from source instead of pre-built bundle
- Allows customization of defra-map
- Single webpack build for entire app

**Status**: ✅ Configured

---

### 7. Updated Boundary Upload Template

**File**: `src/server/forms/views/boundary-file-upload.html`

**Added**:
```html
<div id="map" style="margin-bottom: 2rem;"></div>
```

**Why here**: Boundary file upload page is where users need the map to draw their site boundary.

**Status**: ✅ Map container added

---

### 8. Created Map Styles

**Files**:
- `src/client/stylesheets/components/map/_map-container.scss`
- `src/client/stylesheets/components/map/_map-controls.scss`

**Imported in**: `src/client/stylesheets/components/_index.scss`

**Why needed**: Custom styling for map container and controls to match GOV.UK design system.

**Status**: ✅ Styles created

---

## Modified Files in defra-map Submodule

⚠️ **WARNING**: These changes are in the git submodule and NOT committed!

### 1. Modified Provider for Esri Basemap Support

**File**: `defra-map/src/js/provider/esri-sdk/provider.js`

**Changes** (lines 50-82):
- Added support for both URL-based tiles (OS Maps) AND Esri basemap identifiers
- When `style.basemap` is provided, use `map.basemap` property instead of VectorTileLayer
- Updated ready event handler for basemap-only initialization
- Updated `setStyle()` method to handle basemap switching

**Why needed**:
- Original code only supported URL-based vector tiles (OS Maps)
- Esri free basemaps use identifiers like `'topo-vector'`
- We don't have OS Vector Tile API credentials

**Status**: ⚠️ Modified but not committed

---

### 2. Added Debug Logging

**File**: `defra-map/src/flood-map.js`

**Changes**:
- Added console logs to constructor
- Added comment at top to force webpack rebuild

**Why needed**: Debugging tile rendering issues

**Status**: ⚠️ Modified but not committed, should be removed before commit

---

## Current Problem

### Symptoms

✅ **What Works**:
- Map container renders (600px height, correct width)
- Map UI controls appear (Search, Layers, Key buttons)
- Console shows "FloodMap ready event fired" with NO errors
- Esri SDK loads successfully
- Configuration is correct (basemap identifiers present)
- No CSP violations
- No network errors

❌ **What Doesn't Work**:
- **Map tiles do not render** - just empty gray/white rectangle
- No visible map imagery
- Can't pan or zoom (nothing to see)

### Console Output

```
Initializing FloodMap...
FloodMap module loaded
Defra map config loaded: {OS_ACCOUNT_NUMBER: "STUB_ACCOUNT", ...}
=== DEBUG map-init.js ===
baseMapStyles: [{name: "outdoor", basemap: "topo-vector", ...}]
About to create FloodMap with options: {framework: "esri", styles: [...]}
FloodMap initialization complete
Using Calcite Components 2.13.2
ESRI config set: {apiKey: "", ...}
FloodMap ready event fired: undefined
```

**No errors, but also no tiles.**

### Network Tab

All requests successful:
- `GET /defra-map/config` - 200 OK
- `GET /esri-token` - 200 OK
- Esri SDK assets - 200 OK or 304 (cached)
- Esri basemap style JSON - 200 OK or 304
- **BUT**: No tile image requests (e.g., no requests to basemaps.arcgis.com for actual PNG/JPG tiles)

**This suggests**: Provider isn't actually requesting tiles from Esri

---

## Debugging Attempts

### 1. CSP Issues ✅ FIXED
- **Problem**: Initial CSP blocked Esri domains
- **Solution**: Added all Esri domains to connectSrc
- **Result**: No CSP errors

### 2. API Token Issues ✅ FIXED
- **Problem**: HTTP 498 "Invalid token" errors
- **Solution**: Return empty string (free basemaps don't need auth)
- **Result**: No token errors

### 3. Webpack Caching ⚠️ ATTEMPTED
- **Actions**:
  - Rebuilt defra-map submodule 5+ times
  - Cleared `.public` directory
  - Cleared `node_modules/.cache`
  - Killed and restarted server
  - Forced webpack rebuild with file changes
  - Verified changes in bundle with grep
- **Result**: Changes ARE in bundle, but may not be executing

### 4. Provider Code Execution ❌ UNKNOWN
- **Issue**: Debug logs from `provider.js` don't appear in console
- **Evidence**:
  - Console logs ARE in webpack bundle (grep confirmed)
  - FloodMap constructor runs (map container created)
  - But provider debug logs never fire
- **Hypothesis**:
  - Code path not being reached?
  - Error silently caught?
  - Logs called before DevTools ready?
  - Wrong import/module resolution?

---

## Comparison with FMP Example

**Things we tried to match**:
- ✅ Map configuration structure
- ✅ Webpack alias setup
- ✅ CSP configuration
- ✅ Server-side routes for config/token
- ✅ Template integration

**Potential differences** (to investigate):
- [ ] How FMP example builds defra-map (source vs pre-built?)
- [ ] FMP example's provider configuration
- [ ] Version of @defra/flood-map used in FMP
- [ ] Additional webpack configuration
- [ ] Environment-specific settings

**Action**: Need to compare our implementation against FMP example in detail.

---

## Questions & Unknowns

### About FMP Example
1. Where is the FMP example located? (was it at `/tmp/forms-example`?)
2. Is it still available for reference?
3. What version of @defra/flood-map does it use?
4. Does it use git submodule or npm package?
5. How does it handle the Esri provider?

### About Implementation
1. Should we use pre-built defra-map bundle instead of source?
2. Is the Esri provider the correct choice, or should we use MapLibre?
3. Do we need OS Maps credentials for production?
4. Is there a simpler integration approach we're missing?

### About Tile Rendering
1. Why aren't tile requests being made?
2. Is the basemap property correctly set on the Esri Map object?
3. Is there a required initialization step we're skipping?
4. Does the provider need additional configuration?

---

## Next Steps

### Immediate (When Back from Holiday)

1. **Verify FMP Example Access**
   - Locate the FMP example
   - Compare implementation line-by-line
   - Check for missed configuration

2. **Test in Isolation**
   - Create minimal HTML page
   - Test Esri basemap identifiers work standalone
   - Rule out integration vs API issue

3. **Add Alert-Based Debugging**
   ```javascript
   // In provider.js - impossible to miss
   alert('Provider executing! basemap: ' + style.basemap)
   ```

4. **Check Esri Map Object**
   ```javascript
   // Expose map to window for inspection
   window.debugEsriMap = map
   // Then in console:
   console.log(window.debugEsriMap.basemap)
   console.log(window.debugEsriMap.layers)
   ```

### Short-Term

1. **Try Pre-Built Bundle Approach**
   - Use defra-map's built bundle instead of source
   - Simplifies webpack config
   - May avoid module resolution issues

2. **Test MapLibre Provider**
   - defra-map supports MapLibre as alternative
   - May be simpler than Esri SDK
   - Try switching framework: `framework: 'maplibre'`

3. **Contact DEFRA Team**
   - Ask about FMP example
   - Request working integration example
   - Ask about known Esri provider issues

### Medium-Term

1. **Consider Alternative Approaches**
   - Use standalone Esri SDK (not via defra-map)
   - Use Mapbox GL JS
   - Use Leaflet with plugin
   - Use OpenStreetMap + MapLibre

2. **Obtain OS Maps Credentials**
   - Original provider supports OS Maps
   - May be simpler path if credentials available

---

## Files Changed (Uncommitted)

### Main Repository

```
modified:   package-lock.json
modified:   package.json
modified:   src/client/javascripts/application.js
modified:   src/client/stylesheets/components/_index.scss
modified:   src/config/config.js
modified:   src/server/common/helpers/content-security-policy.js
modified:   src/server/forms/views/boundary-file-upload.html
modified:   src/server/router.js
modified:   webpack.config.js

new:        src/client/javascripts/map/map-init.js
new:        src/client/stylesheets/components/map/_map-container.scss
new:        src/client/stylesheets/components/map/_map-controls.scss
new:        src/server/defra-map/routes.js
new:        webpack.configBuilder.mjs
new:        webpack.submodule.mjs
```

### defra-map Submodule

```
modified:   defra-map/src/js/provider/esri-sdk/provider.js
modified:   defra-map/src/flood-map.js
```

⚠️ **CRITICAL**: Submodule has uncommitted changes. Need to decide:
- Commit changes to fork of defra-map?
- Revert changes and use different approach?
- Keep changes local and document?

---

## Key Resources

### Documentation
- [@defra/flood-map GitHub](https://github.com/DEFRA/flood-map)
- [Esri ArcGIS SDK](https://developers.arcgis.com/javascript/latest/)
- [MapLibre GL JS](https://maplibre.org/)

### Internal
- FMP Example (location TBD)
- NRF Prototypes Frontend repo
- DEFRA Forms Engine Plugin

---

## Summary

We successfully integrated most of @defra/flood-map into the application:
- ✅ Dependencies installed
- ✅ Webpack configured
- ✅ CSP updated
- ✅ Routes created
- ✅ Map initializes
- ❌ **Tiles don't render**

The root cause appears to be that the provider isn't making tile requests to Esri. This could be due to:
1. Modified provider code not executing
2. Incorrect basemap configuration
3. Missing initialization step
4. Esri API compatibility issue

**Most important next step**: Compare implementation against FMP example to identify what we're missing.

---

**Last Updated**: 2025-10-14
**Status**: Parked for holiday
**Owner**: Dan
