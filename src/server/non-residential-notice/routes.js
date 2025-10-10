import { nonResidentialNoticeController } from './controller.js'
import { ROUTES } from '../common/constants/routes.js'
import { FORM_METADATA } from '../common/constants/form-metadata.js'

export const nonResidentialNotice = {
  plugin: {
    name: 'non-residential-notice',
    register: (server) => {
      server.route({
        method: 'GET',
        path: `/${FORM_METADATA.SLUG}${ROUTES.NON_RESIDENTIAL_ERROR}`,
        ...nonResidentialNoticeController
      })
    }
  }
}
