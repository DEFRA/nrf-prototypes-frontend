import Boom from '@hapi/boom'
import { createLogger } from './common/helpers/logging/logger.js'
import { ROUTES } from './common/constants/routes.js'
import { FORM_IDS } from './common/constants/form-ids.js'

const logger = createLogger()

const now = new Date()
const user = { id: 'example-user', displayName: 'Example user' }

const author = {
  createdAt: now,
  createdBy: user,
  updatedAt: now,
  updatedBy: user
}

const metadata = {
  id: 'nrf-quote-01',
  slug: 'nrf-quote',
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
  name: 'nrf-quote-prototype-01',
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
          name: 'jGUXtq',
          id: '8f9a1e3f-d537-43e6-a9aa-e72aa241b268'
        }
      ],
      next: [{ path: ROUTES.UPLOAD }],
      id: 'd3dff5e8-92b8-4ce6-a141-dc27eb0925cb'
    },
    {
      title: 'Draw a red line boundary or upload a shapefile (optional)',
      path: ROUTES.UPLOAD,
      components: [
        {
          type: 'FileUploadField',
          title: 'Draw a red line boundary or upload a shapefile (optional)',
          name: FORM_IDS.RED_LINE_BOUNDARY,
          shortDescription: 'Red line boundary',
          hint: 'Use the map to draw a red line boundary for where your development might be. If you already have a shapefile you can upload it for your Nature Restoration Fund levy estimate.',
          options: {
            required: false,
            accept: '.shp,.kml,.geojson,.json'
          },
          schema: {},
          id: '3193a034-0138-4ae9-861c-9ebc0bdc8a50'
        }
      ],
      next: [{ path: ROUTES.BUILDINGS }],
      id: 'b3c5b33f-e5fd-4471-bbde-97fc7b3f33b0'
    },
    {
      title: '',
      path: ROUTES.BUILDINGS,
      components: [
        {
          type: 'CheckboxesField',
          title:
            'Enter the number of each type of building that might be included in this development',
          name: FORM_IDS.BUILDING_TYPES,
          shortDescription: 'Building type counts',
          hint: 'Enter numbers in each box, enter a zero if you are not building that type.',
          list: 'e8715dc7-1fd6-429f-a9b5-9b2fa7dc533d',
          options: {
            required: true
          },
          schema: {},
          id: 'f7b23fc4-4354-4dc5-adcf-d44ee3cfe4d9'
        }
      ],
      next: [{ path: ROUTES.WASTE_WATER }],
      id: 'a89f8a02-00f8-491b-b849-27d57decf93c'
    },
    {
      title: '',
      path: ROUTES.WASTE_WATER,
      components: [
        {
          type: 'RadiosField',
          title: 'How will your development deal with waste water?',
          name: FORM_IDS.WASTE_WATER,
          shortDescription: 'Dealing with waste water',
          hint: '',
          options: {
            required: true
          },
          schema: {},
          list: '5e0a63ad-8c7f-4dd8-9446-164a4c6567c2',
          id: 'fac4adad-5fec-4415-b16b-73601d481472'
        }
      ],
      next: [{ path: ROUTES.SUDS }],
      id: '06bf4ae3-c206-429f-9e76-3ea984278088'
    },
    {
      title: '',
      path: ROUTES.SUDS,
      components: [
        {
          type: 'YesNoField',
          title:
            'Are you using any SuDS design details (Sustainable Drainage Systems (reed beds, ponds, swales)?',
          name: FORM_IDS.SUDS,
          shortDescription: 'Using any SuDS',
          hint: 'These methods can retain or remove nutrients.',
          options: {
            required: true
          },
          schema: {},
          id: '4379db91-e7a7-48e5-9b84-c897d4478446'
        }
      ],
      next: [{ path: ROUTES.EMAIL }],
      id: '9e271249-afcc-4a84-a769-b6b1f0f3679d'
    },
    {
      title: '',
      path: ROUTES.EMAIL,
      components: [
        {
          type: 'EmailAddressField',
          title: 'Enter the email address you would like the estimate sent to',
          name: FORM_IDS.EMAIL,
          shortDescription: 'Email address',
          hint: '',
          options: {
            required: true
          },
          schema: {},
          id: 'ed2d680e-f300-4afe-a2b2-bd77fc9c6529'
        }
      ],
      next: [{ path: ROUTES.SUMMARY }],
      id: '75d5ffb9-af98-4f81-a9e9-cd90b95a1cf6'
    },
    {
      id: '449a45f6-4541-4a46-91bd-8b8931b07b50',
      title: 'Check your answers',
      path: ROUTES.SUMMARY,
      controller: 'SummaryPageController',
      next: []
    }
  ],
  conditions: [],
  sections: [],
  lists: [
    {
      name: 'eYJZxu',
      title: 'List for question trkPwJ',
      type: 'string',
      items: [
        {
          id: 'feb7a6c7-7932-4983-9e1b-3e4e8ce22d6b',
          text: 'Dwelling house',
          value: 'Dwelling house'
        },
        {
          id: '6a3ca9ab-8c9d-4049-a9e7-9a0643539c53',
          text: 'Hotel',
          value: 'Hotel'
        },
        {
          id: '1855cb0e-f2b4-4124-94d5-e76b68d0ae9c',
          text: 'House of multiple occupation (HMO)',
          value: 'House of multiple occupation (HMO)'
        },
        {
          id: '465652d0-2274-44e4-9a4c-f5eef8b4bc79',
          text: 'Non-residential development',
          value: 'Non-residential development'
        },
        {
          id: '6687a9e7-397e-45f8-aa6c-419b70fd5466',
          text: 'Residential institution',
          value: 'Residential institution'
        },
        {
          id: '4248ff45-fd15-487d-92c9-bb609698c125',
          text: 'Secure residential institution',
          value: 'Secure residential institution'
        }
      ],
      id: 'e8715dc7-1fd6-429f-a9b5-9b2fa7dc533d'
    },
    {
      name: 'ctFVad',
      title: 'List for question nulGtS',
      type: 'string',
      items: [
        {
          id: 'dbfcee1c-6834-43f2-94fa-bd9552e9d88e',
          text: 'Public waste water treatment works',
          value: 'Public waste water treatment works'
        },
        {
          id: 'bdf0d8da-6d67-434f-a226-624fbee3d3b8',
          text: 'On-site system',
          value: 'On-site system'
        }
      ],
      id: '5e0a63ad-8c7f-4dd8-9446-164a4c6567c2'
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

    const referenceNumber = `NRF-${Date.now()}`

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

    const reference = `NRF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

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
