// FloodMap initialization for boundary drawing
// Simplified version from fmp-app for NRF prototype
// Using Esri free basemaps (no OS Vector Tile API required)

import { FloodMap } from '/flood-map' // eslint-disable-line import/no-absolute-path
import {
  getEsriToken,
  getRequest,
  getInterceptors,
  getDefraMapConfig,
  setEsriConfig
} from './tokens.js'

const mapDiv = document.getElementById('map')

if (!mapDiv) {
  console.warn('Map container #map not found')
} else {
  console.log('Initializing FloodMap...')

  getDefraMapConfig().then((defraMapConfig) => {
    console.log('Defra map config loaded:', defraMapConfig)

    // Set up base map styles exactly like fmp-app
    const currentYear = new Date().getFullYear()
    const osAttributionHyperlink = `<a href="/os-terms" class="os-credits__link"> Contains OS data &copy; Crown copyright and database rights ${currentYear} </a>`
    const osMasterMapAttributionHyperlink = `<a href="/os-terms" class="os-credits__link">&copy; Crown copyright and database rights ${currentYear} OS ${defraMapConfig.OS_ACCOUNT_NUMBER} </a>`

    // Using Esri free basemaps instead of OS Maps (which requires Vector Tile API access)
    const esriAttribution = '<a href="https://www.esri.com">Esri</a>'

    const mapStyles = {
      outdoor: {
        displayName: 'Topographic',
        basemap: 'topo-vector',
        attribution: esriAttribution,
        digitisingBasemap: 'topo-vector',
        digitisingAttribution: esriAttribution,
        iconUrl: '/assets/images/outdoor-map-icon.jpg'
      },
      dark: {
        displayName: 'Dark Gray',
        basemap: 'dark-gray-vector',
        attribution: esriAttribution,
        digitisingBasemap: 'dark-gray-vector',
        digitisingAttribution: esriAttribution,
        iconUrl: '/assets/images/dark-map-icon.jpg'
      },
      blackAndWhite: {
        displayName: 'Light Gray',
        basemap: 'gray-vector',
        attribution: esriAttribution,
        digitisingBasemap: 'gray-vector',
        digitisingAttribution: esriAttribution,
        iconUrl: '/assets/images/black-and-white-map-icon.jpg'
      }
    }

    const baseMapStyles = Object.entries(mapStyles)
      .map(([name, { basemap, attribution, displayName, iconUrl }]) => ({ name, basemap, attribution, displayName, iconUrl }))

    const digitisingMapStyles = Object.entries(mapStyles)
      .map(([name, { digitisingBasemap: basemap, digitisingAttribution: attribution, displayName, iconUrl }]) => ({ name, basemap, attribution, displayName, iconUrl }))

    console.log('=== DEBUG map-init.js ===')
    console.log('baseMapStyles:', baseMapStyles)
    console.log('baseMapStyles[0]:', baseMapStyles[0])
    console.log('digitisingMapStyles:', digitisingMapStyles)
    console.log('========================')

    try {
      const floodMapOptions = {
        behaviour: 'inline',
        place: 'England',
        zoom: 7.7,
        minZoom: 6,
        maxZoom: 20,
        center: [340367, 322766], // Center of England
        maxExtent: [0, 0, 700000, 1300000],
        height: '600px',
        hasGeoLocation: false,
        framework: 'esri',
        transformSearchRequest: getRequest,
        interceptorsCallback: getInterceptors,
        tokenCallback: getEsriToken,
        styles: baseMapStyles,
        search: {
          label: 'Search for a place',
          isAutocomplete: true,
          isExpanded: false,
          country: 'england'
        },
        legend: {
          isVisible: false
        },
        queryArea: {
          heading: 'Draw site boundary',
          startLabel: 'Add site boundary',
          editLabel: 'Edit site boundary',
          addLabel: 'Add boundary',
          updateLabel: 'Update boundary',
          submitLabel: 'Save boundary',
          helpLabel: 'How to draw a shape',
          keyLabel: 'Site boundary',
          minZoom: 15,
          maxZoom: 21,
          styles: digitisingMapStyles
        }
      }

      console.log('About to create FloodMap with options:', floodMapOptions)
      console.log('options.styles:', floodMapOptions.styles)

      const floodMap = new FloodMap('map', floodMapOptions, (esriMapObjects) => {
        const { esriConfig } = esriMapObjects
        setEsriConfig(esriConfig)
        console.log('ESRI config set:', esriConfig)
      })

      // Listen for ready event
      floodMap.addEventListener('ready', (e) => {
        console.log('FloodMap ready event fired:', e.detail)
      })

      // Listen for changes
      floodMap.addEventListener('change', (e) => {
        console.log('FloodMap change event:', e.detail)
      })

      // Listen for app actions (polygon drawn/updated)
      mapDiv.addEventListener('appaction', (e) => {
        console.log('FloodMap appaction event:', e.detail)
        const { type } = e.detail
        if (type === 'confirmPolygon' || type === 'updatePolygon') {
          console.log('Polygon confirmed/updated')
          // TODO: Extract polygon data and save to form state
        }
      })

      console.log('FloodMap initialization complete')
    } catch (error) {
      console.error('Error initializing FloodMap:', error)
    }
  }).catch((error) => {
    console.error('Error loading defra-map config:', error)
  })
}
