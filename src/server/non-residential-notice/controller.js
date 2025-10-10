import { ROUTES } from '../common/constants/routes.js'
import { FORM_METADATA } from '../common/constants/form-metadata.js'

export const nonResidentialNoticeController = {
  handler: (request, h) => {
    return h.view('non-residential-notice/index', {
      pageTitle: 'Non-residential developments not supported',
      backLink: {
        text: 'Back',
        href: `/${FORM_METADATA.SLUG}${ROUTES.BUILDINGS}`
      }
    })
  }
}
