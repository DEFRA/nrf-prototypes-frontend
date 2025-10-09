import { ROUTES } from '../common/constants/routes.js'
import { FORM_METADATA } from '../common/constants/form-metadata.js'

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler(_request, h) {
    return h.view('home/index', {
      pageTitle: 'Home',
      heading: 'Home',
      startUrl: `/${FORM_METADATA.SLUG}${ROUTES.START}`
    })
  }
}
