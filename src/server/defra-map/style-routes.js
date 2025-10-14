import baseMapDefault from './styles/OS_VTS_27700_Open_Outdoor.json' with { type: 'json' }
import baseMapDark from './styles/OS_VTS_27700_Open_Dark.json' with { type: 'json' }
import baseMapBlackAndWhite from './styles/OS_VTS_27700_Black_and_White.json' with { type: 'json' }
import baseMapBlackAndWhiteOpen from './styles/OS_VTS_27700_Open_Black_and_White.json' with { type: 'json' }
import polygonDefault from './styles/OS_VTS_27700_Outdoor.json' with { type: 'json' }
import polygonDark from './styles/OS_VTS_27700_Dark.json' with { type: 'json' }
import openTile from './styles/open-tile.json' with { type: 'json' }
import vtsTile from './styles/vts-tile.json' with { type: 'json' }

export const mapStyleRoutes = {
  plugin: {
    name: 'map-style-routes',
    async register(server) {
      const options = { tags: ['asset'] }

      server.route({
        method: 'GET',
        path: '/map/styles/open-tile.json',
        handler: () => openTile,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/vts-tile.json',
        handler: () => vtsTile,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/base-map-default',
        handler: () => baseMapDefault,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/base-map-dark',
        handler: () => baseMapDark,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/base-map-black-and-white',
        handler: () => baseMapBlackAndWhite,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/base-map-black-and-white-open',
        handler: () => baseMapBlackAndWhiteOpen,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/polygon-default',
        handler: () => polygonDefault,
        options
      })

      server.route({
        method: 'GET',
        path: '/map/styles/polygon-dark',
        handler: () => polygonDark,
        options
      })
    }
  }
}
