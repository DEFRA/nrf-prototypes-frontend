import { config } from '../../config/config.js'

// Cache for OS API token
let osTokenCache = null

export const defraMapRoutes = {
  plugin: {
    name: 'defra-map-routes',
    async register(server) {
      // OS Maps token endpoint
      server.route({
        method: 'GET',
        path: '/os-token',
        handler: async (_request, h) => {
          const apiKey = config.get('osMaps.apiKey')
          const apiSecret = config.get('osMaps.apiSecret')

          // Check if we have cached token that's still valid
          if (osTokenCache && osTokenCache.expiresAt > Date.now()) {
            return h
              .response(
                JSON.stringify({
                  access_token: osTokenCache.token,
                  expires_in: Math.floor((osTokenCache.expiresAt - Date.now()) / 1000)
                })
              )
              .type('application/json')
          }

          // Fetch new token from OS API
          try {
            const tokenUrl = 'https://api.os.uk/oauth2/token/v1'
            const formData = new URLSearchParams()
            formData.append('grant_type', 'client_credentials')

            const response = await fetch(tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
              },
              body: formData.toString()
            })

            if (!response.ok) {
              throw new Error(`OS API token request failed: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()

            // Cache the token (subtract 60s for safety margin)
            osTokenCache = {
              token: data.access_token,
              expiresAt: Date.now() + ((data.expires_in - 60) * 1000)
            }

            return h
              .response(
                JSON.stringify({
                  access_token: data.access_token,
                  expires_in: data.expires_in
                })
              )
              .type('application/json')
          } catch (err) {
            server.logger.error('Error fetching OS API token:', err)
            // Return error response
            return h
              .response(
                JSON.stringify({
                  error: 'Failed to fetch OS API token',
                  message: err.message
                })
              )
              .type('application/json')
              .code(500)
          }
        }
      })

      // ESRI token endpoint
      server.route({
        method: 'GET',
        path: '/esri-token',
        handler: async (request, h) => {
          // Esri's free public basemaps don't require an API key
          // Return empty token for free basemap access
          return h
            .response(
              JSON.stringify({
                token: '',
                expires: Date.now() + 3600000,
                durationMs: 3600000
              })
            )
            .type('application/json')
        }
      })

      // Defra map config endpoint
      server.route({
        method: 'GET',
        path: '/defra-map/config',
        handler: async (_request, h) => {
          // Simplified config for prototype
          // TODO: Add real AGOL service URLs and OS account number
          return h
            .response(
              JSON.stringify({
                OS_ACCOUNT_NUMBER: 'STUB_ACCOUNT',
                agolServiceUrl: 'https://environment.data.gov.uk/arcgis/rest/services',
                agolVectorTileUrl: 'https://tiles.arcgis.com/tiles',
                layerNameSuffix: '',
                featureLayerNameSuffix: ''
              })
            )
            .type('application/json')
        }
      })

      // Proxy for OS Maps vector tiles (to avoid CORS)
      server.route({
        method: 'GET',
        path: '/os-proxy/tile/{z}/{y}/{x}.pbf',
        handler: async (request, h) => {
          const { z, y, x } = request.params
          const token = osTokenCache?.token || (await getOsToken()).token

          try {
            const tileUrl = `https://api.os.uk/maps/vector/v1/vts/tile/${z}/${y}/${x}.pbf`
            const response = await fetch(tileUrl, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })

            if (!response.ok) {
              throw new Error(`Tile fetch failed: ${response.status}`)
            }

            const buffer = await response.arrayBuffer()
            return h.response(Buffer.from(buffer))
              .type('application/x-protobuf')
              .header('Content-Encoding', 'gzip')
          } catch (err) {
            server.logger.error(`Error fetching tile ${z}/${y}/${x}:`, err)
            return h.response().code(404)
          }
        }
      })

      // Proxy for OS Maps sprites
      server.route({
        method: 'GET',
        path: '/os-proxy/sprites/{file*}',
        handler: async (request, h) => {
          const file = request.params.file
          const token = osTokenCache?.token || (await getOsToken()).token

          try {
            const spriteUrl = `https://api.os.uk/maps/vector/v1/vts/resources/sprites/${file}`
            const response = await fetch(spriteUrl, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })

            if (!response.ok) {
              throw new Error(`Sprite fetch failed: ${response.status}`)
            }

            const buffer = await response.arrayBuffer()
            const contentType = file.endsWith('.json') ? 'application/json' : 'image/png'

            return h.response(Buffer.from(buffer)).type(contentType)
          } catch (err) {
            server.logger.error(`Error fetching sprite ${file}:`, err)
            return h.response().code(404)
          }
        }
      })

      // Proxy for OS Maps glyphs (fonts)
      server.route({
        method: 'GET',
        path: '/os-proxy/fonts/{fontstack}/{range}.pbf',
        handler: async (request, h) => {
          const { fontstack, range } = request.params
          const token = osTokenCache?.token || (await getOsToken()).token

          try {
            const glyphUrl = `https://api.os.uk/maps/vector/v1/vts/resources/fonts/${fontstack}/${range}.pbf`
            const response = await fetch(glyphUrl, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })

            if (!response.ok) {
              throw new Error(`Glyph fetch failed: ${response.status}`)
            }

            const buffer = await response.arrayBuffer()
            return h.response(Buffer.from(buffer))
              .type('application/x-protobuf')
              .header('Content-Encoding', 'gzip')
          } catch (err) {
            server.logger.error(`Error fetching glyphs ${fontstack}/${range}:`, err)
            return h.response().code(404)
          }
        }
      })
    }
  }
}

// Helper function to get OS token (used by proxy routes)
async function getOsToken() {
  const apiKey = config.get('osMaps.apiKey')
  const apiSecret = config.get('osMaps.apiSecret')

  if (osTokenCache && osTokenCache.expiresAt > Date.now()) {
    return { token: osTokenCache.token }
  }

  const tokenUrl = 'https://api.os.uk/oauth2/token/v1'
  const formData = new URLSearchParams()
  formData.append('grant_type', 'client_credentials')

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    },
    body: formData.toString()
  })

  const data = await response.json()
  osTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in - 60) * 1000)
  }

  return { token: data.access_token }
}
