import Blankie from 'blankie'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    // Hash 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' is to support a GOV.UK frontend script bundled within Nunjucks macros
    // https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy
    defaultSrc: ['self'],
    fontSrc: ['self', 'data:'],
    connectSrc: [
      'self',
      'wss',
      'data:',
      'https://js.arcgis.com',
      'https://static.arcgis.com',
      'https://tiles.arcgis.com',
      'https://cdn.arcgis.com',
      'https://basemaps.arcgis.com',
      'https://services.arcgisonline.com',
      'https://api.os.uk',
      'https://environment.data.gov.uk'
    ],
    mediaSrc: ['self'],
    styleSrc: ['self', "'unsafe-inline'"],
    scriptSrc: [
      'self',
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
    ],
    imgSrc: ['self', 'data:', 'https:'],
    frameSrc: ['self', 'data:'],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self'],
    manifestSrc: ['self'],
    workerSrc: ['self', 'blob:'],
    generateNonces: false
  }
}

export { contentSecurityPolicy }
