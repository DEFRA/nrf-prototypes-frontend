import { SummaryPageController } from '@defra/forms-engine-plugin/controllers/SummaryPageController.js'
import { FORM_LIST_NAMES } from '../../common/constants/form-lists.js'
import { ROUTES } from '../../common/constants/routes.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'

export class NRFQuoteSummaryController extends SummaryPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'nrf-quote-summary'
  }

  getBuildingTypesList() {
    return this.model.def.lists.find(
      (list) => list.name === FORM_LIST_NAMES.BUILDING_TYPES
    )
  }

  formatBuildingTypes(state) {
    // Building types are stored under the form ID/slug
    const buildingTypesData = state[FORM_METADATA.PROTOTYPE_ID]

    if (!buildingTypesData) {
      return { types: [], rows: [], total: 0 }
    }

    const buildingTypesList = this.getBuildingTypesList()
    if (!buildingTypesList) {
      return { types: [], rows: [], total: 0 }
    }

    const formattedTypes = []
    const rows = []
    let totalBuildings = 0

    buildingTypesList.items.forEach((item, index) => {
      const fieldName = `buildingType-${index + 1}`
      const quantity = parseInt(buildingTypesData[fieldName], 10) || 0

      // Only include building types with quantity > 0
      if (quantity > 0) {
        formattedTypes.push({
          type: item.text,
          quantity,
          value: item.value
        })
        rows.push([
          {
            text: item.text
          },
          {
            text: quantity.toString(),
            format: 'numeric'
          }
        ])
      }

      totalBuildings += quantity
    })

    return { types: formattedTypes, rows, total: totalBuildings }
  }

  formatBoundaryFile(state) {
    const prototypeData = state[FORM_METADATA.PROTOTYPE_ID]
    const fileData = prototypeData?.[FORM_COMPONENT_NAMES.BOUNDARY_FILE]

    if (!fileData || !fileData.filename) {
      return null
    }

    // Format file size in bytes/KB/MB
    const sizeInBytes = fileData.size || 0
    let formattedSize
    if (sizeInBytes < 1024) {
      formattedSize = `${sizeInBytes} bytes`
    } else if (sizeInBytes < 1024 * 1024) {
      formattedSize = `${(sizeInBytes / 1024).toFixed(2)} KB`
    } else {
      formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
    }

    return {
      filename: fileData.filename,
      size: formattedSize,
      uploadedAt: fileData.uploadedAt
    }
  }

  makeGetRouteHandler() {
    return async (request, context, h) => {
      const { state } = context

      const buildingTypes = this.formatBuildingTypes(state)
      const boundaryFile = this.formatBoundaryFile(state)

      // Call parent to get the summary view model
      const response = await super.makeGetRouteHandler()(request, context, h)

      // If it's a view response, add our custom data
      if (response && response.variety === 'view') {
        const summaryUrl = `/${FORM_METADATA.SLUG}${ROUTES.SUMMARY}`
        const buildingTypesUrl = `/${FORM_METADATA.SLUG}${ROUTES.BUILDINGS}`
        const buildingTypesChangeUrl = `${buildingTypesUrl}?returnUrl=${encodeURIComponent(summaryUrl)}`
        const boundaryFileUrl = `/${FORM_METADATA.SLUG}${ROUTES.UPLOAD}`
        const boundaryFileChangeUrl = `${boundaryFileUrl}?returnUrl=${encodeURIComponent(summaryUrl)}`

        response.source.context.buildingTypes = buildingTypes
        response.source.context.buildingTypesChangeUrl = buildingTypesChangeUrl
        response.source.context.boundaryFile = boundaryFile
        response.source.context.boundaryFileChangeUrl = boundaryFileChangeUrl
      }

      return response
    }
  }
}
