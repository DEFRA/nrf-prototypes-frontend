import Boom from '@hapi/boom'
import { createLogger } from './common/helpers/logging/logger.js'
import { ROUTES } from './common/constants/routes.js'
import { FORM_COMPONENT_NAMES } from './common/constants/form-component-names.js'
import { FORM_METADATA } from './common/constants/form-metadata.js'
import {
  FORM_LIST_IDS,
  FORM_LIST_NAMES,
  BUILDING_TYPES
} from './common/constants/form-lists.js'

const logger = createLogger()

const now = new Date().toISOString()
const user = { id: 'example-user', displayName: 'Example user' }

const author = {
  createdAt: now,
  createdBy: user,
  updatedAt: now,
  updatedBy: user
}

/**
 * Generate a unique reference number for form submissions
 * @returns {string} Reference number in format: NRF-{timestamp}-{random}
 */
function generateReferenceNumber() {
  return `NRF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

const metadata = {
  id: FORM_METADATA.ID,
  slug: FORM_METADATA.SLUG,
  title: 'Nature Restoration Fund Quote',
  organisation: 'Defra',
  teamName: 'NRF Team',
  teamEmail: 'nrf-team@defra.gov.uk',
  submissionGuidance: 'Thank you for your quote request',
  notificationEmail: 'nrf-submissions@defra.gov.uk',
  ...author,
  live: author
}

const definition = {
  name: FORM_METADATA.PROTOTYPE_ID,
  engine: 'V2',
  schema: 2,
  startPage: ROUTES.START,
  pages: [
    {
      title: 'Nature Restoration Fund',
      path: ROUTES.START,
      components: [
        {
          type: 'Markdown',
          content:
            'Find out if you can mitigate your nutrients by paying an NRF levy and get an estimate for how much it might be.',
          options: {},
          schema: {},
          name: FORM_COMPONENT_NAMES.START
        }
      ],
      next: [{ path: ROUTES.UPLOAD }]
    },
    {
      title: 'Draw a red line boundary or upload a shapefile',
      path: ROUTES.UPLOAD,
      controller: 'BoundaryFileUploadController',
      next: [{ path: ROUTES.BUILDINGS }]
    },
    {
      title: '',
      path: ROUTES.BUILDINGS,
      controller: 'BuildingTypesController',
      next: [{ path: ROUTES.WASTE_WATER }]
    },
    {
      title: '',
      path: ROUTES.WASTE_WATER,
      controller: 'NRFQuestionPageController',
      components: [
        {
          type: 'RadiosField',
          title: 'How will your development deal with waste water?',
          name: FORM_COMPONENT_NAMES.WASTE_WATER,
          shortDescription: 'Dealing with waste water',
          hint: '',
          options: {
            required: true
          },
          schema: {},
          list: FORM_LIST_IDS.WASTE_WATER
        }
      ],
      next: [{ path: ROUTES.SUDS }]
    },
    {
      title: '',
      path: ROUTES.SUDS,
      controller: 'NRFQuestionPageController',
      components: [
        {
          type: 'YesNoField',
          title:
            'Are you using any SuDS design details (Sustainable Drainage Systems (reed beds, ponds, swales))?',
          name: FORM_COMPONENT_NAMES.SUDS,
          shortDescription: 'Using any SuDS',
          hint: 'These methods can retain or remove nutrients.',
          options: {
            required: true
          },
          schema: {}
        }
      ],
      next: [{ path: ROUTES.EMAIL }]
    },
    {
      title: '',
      path: ROUTES.EMAIL,
      controller: 'NRFQuestionPageController',
      components: [
        {
          type: 'EmailAddressField',
          title: 'Enter the email address you would like the estimate sent to',
          name: FORM_COMPONENT_NAMES.EMAIL,
          shortDescription: 'Email address',
          hint: '',
          options: {
            required: true
          },
          schema: {}
        }
      ],
      next: [{ path: ROUTES.SUMMARY }]
    },
    {
      title: 'Check your answers',
      path: ROUTES.SUMMARY,
      controller: 'NRFQuoteSummaryController',
      next: []
    }
  ],
  conditions: [],
  sections: [],
  lists: [
    {
      name: FORM_LIST_NAMES.BUILDING_TYPES,
      title: 'List for question trkPwJ',
      type: 'string',
      items: [
        {
          text: BUILDING_TYPES.DWELLING_HOUSE.text,
          value: BUILDING_TYPES.DWELLING_HOUSE.id
        },
        {
          text: BUILDING_TYPES.HOTEL.text,
          value: BUILDING_TYPES.HOTEL.id
        },
        {
          text: BUILDING_TYPES.HMO.text,
          value: BUILDING_TYPES.HMO.id
        },
        {
          text: BUILDING_TYPES.NON_RESIDENTIAL.text,
          value: BUILDING_TYPES.NON_RESIDENTIAL.id
        },
        {
          text: BUILDING_TYPES.RESIDENTIAL_INSTITUTION.text,
          value: BUILDING_TYPES.RESIDENTIAL_INSTITUTION.id
        },
        {
          text: BUILDING_TYPES.SECURE_RESIDENTIAL_INSTITUTION.text,
          value: BUILDING_TYPES.SECURE_RESIDENTIAL_INSTITUTION.id
        }
      ],
      id: FORM_LIST_IDS.BUILDING_TYPES
    },
    {
      name: FORM_LIST_NAMES.WASTE_WATER,
      title: 'List for question nulGtS',
      type: 'string',
      items: [
        {
          text: 'Public waste water treatment works',
          value: 'Public waste water treatment works'
        },
        {
          text: 'On-site system',
          value: 'On-site system'
        }
      ],
      id: FORM_LIST_IDS.WASTE_WATER
    }
  ]
}

const formsService = {
  getFormMetadata: function (slug) {
    if (slug === metadata.slug) {
      return Promise.resolve(metadata)
    }
    throw Boom.notFound(`Form '${slug}' not found`)
  },
  getFormDefinition: function (id) {
    if (id === metadata.id) {
      return Promise.resolve(definition)
    }
    throw Boom.notFound(`Form '${id}' not found`)
  }
}

const outputService = {
  submit: async function (
    context,
    request,
    model,
    emailAddress,
    items,
    submitResponse
  ) {
    logger.info('Output service submit called')

    const referenceNumber = generateReferenceNumber()

    const formData = {}

    if (submitResponse && submitResponse.main) {
      logger.info('Using submitResponse data (V2 format)')
      if (Array.isArray(submitResponse.main)) {
        submitResponse.main.forEach((item) => {
          formData[item.name] = {
            label: item.title || item.name,
            value: item.value
          }
        })
      }
    }

    logger.info({ formData }, 'Form data extracted')

    const simpleSubmission = {
      id: referenceNumber,
      date: new Date().toISOString(),
      formName: 'Nature Restoration Fund Quote',
      formData
    }

    const session = request.yar
    const submissions = session.get('submissions') || []
    submissions.push(simpleSubmission)
    session.set('submissions', submissions)

    logger.info({ submission: simpleSubmission }, 'Submission stored')
    session.set('lastSubmissionId', referenceNumber)

    return {
      title: 'Quote request submitted',
      content: 'Your Nature Restoration Fund quote request has been submitted.'
    }
  }
}

const formSubmissionService = {
  submit: async function (payload, request) {
    logger.info('Form submission service called')

    const reference = generateReferenceNumber()

    return {
      id: reference,
      reference,
      sessionId: payload.sessionId || 'unknown',
      retrievalKey: payload.retrievalKey || 'unknown',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      main: payload.main || [],
      repeaters: payload.repeaters || []
    }
  },

  persistFiles: async function (context, request, model) {
    return Promise.resolve()
  }
}

export default { formsService, outputService, formSubmissionService }
