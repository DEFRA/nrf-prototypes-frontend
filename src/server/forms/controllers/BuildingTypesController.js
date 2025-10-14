import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { isPathRelative } from '@defra/forms-engine-plugin/engine/helpers.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'
import {
  FORM_LIST_NAMES,
  BUILDING_TYPES
} from '../../common/constants/form-lists.js'
import { ROUTES } from '../../common/constants/routes.js'

const BUILDING_TYPE_FIELD_PREFIX = 'buildingType-'
const MIN_QUANTITY = 0
const MAX_QUANTITY = 5000

/**
 * Custom controller for the building types page
 * Displays a custom form with inline input/label layout for entering building quantities
 */
export class BuildingTypesController extends QuestionPageController {
  constructor(model, pageDef) {
    super(model, pageDef)
    this.viewName = 'building-types'
  }

  /**
   * Helper to generate field name for a building type by index
   * @param {number} index - 1-based index matching template loop.index
   */
  getBuildingTypeFieldName(index) {
    return `${BUILDING_TYPE_FIELD_PREFIX}${index}`
  }

  /**
   * Helper to check if a field name is a building type field
   * @param {string} fieldName
   */
  isBuildingTypeField(fieldName) {
    return fieldName.startsWith(BUILDING_TYPE_FIELD_PREFIX)
  }

  /**
   * Get the building types list definition from the form model
   */
  getBuildingTypesList() {
    return this.model.def.lists.find(
      (list) => list.name === FORM_LIST_NAMES.BUILDING_TYPES
    )
  }

  /**
   * Validates a single building type field value
   * @param {string} value - The field value to validate
   * @param {string} fieldName - The field name
   * @param {string} buildingTypeName - The human-readable building type name
   * @returns {Object|null} Error object if validation fails, null if valid
   */
  validateBuildingTypeValue(value, fieldName, buildingTypeName) {
    if (value && value.toString().includes('.')) {
      return {
        path: fieldName,
        name: fieldName,
        href: `#${fieldName}`,
        text: `${buildingTypeName}: Please enter a whole number (no decimals)`
      }
    }

    const parsedValue = parseInt(value, 10)

    if (isNaN(parsedValue)) {
      return {
        path: fieldName,
        name: fieldName,
        href: `#${fieldName}`,
        text: `${buildingTypeName}: Please enter a valid number`
      }
    }

    if (parsedValue < MIN_QUANTITY) {
      return {
        path: fieldName,
        name: fieldName,
        href: `#${fieldName}`,
        text: `${buildingTypeName}: Value cannot be negative`
      }
    }

    if (parsedValue > MAX_QUANTITY) {
      return {
        path: fieldName,
        name: fieldName,
        href: `#${fieldName}`,
        text: `${buildingTypeName}: Value cannot exceed ${MAX_QUANTITY.toLocaleString()}`
      }
    }

    return null // Valid
  }

  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)
      const { state } = context
      const buildingTypesList = this.getBuildingTypesList()
      const savedValues = state[FORM_METADATA.PROTOTYPE_ID] || {}

      viewModel.buildingTypes = buildingTypesList?.items || []
      viewModel.submittedValues = {}

      const buildingTypes = buildingTypesList?.items || []
      for (let i = 0; i < buildingTypes.length; i++) {
        const fieldName = this.getBuildingTypeFieldName(i + 1)
        viewModel.submittedValues[fieldName] = savedValues[fieldName] ?? 0
      }

      return h.view(this.viewName, viewModel)
    }
  }

  validateAndCollectPayload(buildingTypesList, payload) {
    const validatedPayload = {}
    const errors = []

    buildingTypesList?.items.forEach((item, index) => {
      const fieldName = this.getBuildingTypeFieldName(index + 1)
      const value = payload[fieldName]
      const validationError = this.validateBuildingTypeValue(
        value,
        fieldName,
        item.text
      )

      if (validationError) {
        errors.push(validationError)
      }

      validatedPayload[fieldName] = value
    })

    return { validatedPayload, errors }
  }

  calculateTotal(validatedPayload) {
    return Object.values(validatedPayload)
      .filter((value) => typeof value === 'string' && value !== '')
      .map((value) => parseInt(value, 10))
      .filter((value) => !isNaN(value))
      .reduce((sum, value) => sum + value, 0)
  }

  checkBuildingTypeMix(buildingTypesList, validatedPayload) {
    let hasNonResidential = false
    let hasResidentialTypes = false

    buildingTypesList?.items.forEach((item, index) => {
      const fieldName = this.getBuildingTypeFieldName(index + 1)
      const quantity = parseInt(validatedPayload[fieldName], 10) || 0

      if (quantity > 0) {
        if (item.value === BUILDING_TYPES.NON_RESIDENTIAL.id) {
          hasNonResidential = true
        } else {
          hasResidentialTypes = true
        }
      }
    })

    return { hasNonResidential, hasResidentialTypes }
  }

  renderErrorView(
    request,
    context,
    h,
    buildingTypesList,
    validatedPayload,
    errors
  ) {
    return h.view(this.viewName, {
      ...this.getViewModel(request, context),
      buildingTypes: buildingTypesList?.items || [],
      submittedValues: validatedPayload,
      errors
    })
  }

  getNextPageRedirect(query) {
    const { returnUrl } = query
    if (returnUrl && isPathRelative(returnUrl)) {
      return returnUrl
    }

    const { next } = this.pageDef
    if (!next || next.length === 0) {
      throw new Error(
        `No next page configured for ${FORM_COMPONENT_NAMES.BUILDING_TYPES}`
      )
    }

    return `/${FORM_METADATA.SLUG}${next[0].path}`
  }

  makePostRouteHandler() {
    return async (request, context, h) => {
      const { payload, query } = request
      const { state } = context
      const buildingTypesList = this.getBuildingTypesList()

      const { validatedPayload, errors } = this.validateAndCollectPayload(
        buildingTypesList,
        payload
      )

      if (errors.length > 0) {
        return this.renderErrorView(
          request,
          context,
          h,
          buildingTypesList,
          validatedPayload,
          errors
        )
      }

      const total = this.calculateTotal(validatedPayload)

      if (total === 0) {
        return this.renderErrorView(
          request,
          context,
          h,
          buildingTypesList,
          validatedPayload,
          [
            {
              path: FORM_COMPONENT_NAMES.BUILDING_TYPES,
              name: FORM_COMPONENT_NAMES.BUILDING_TYPES,
              href: `#${this.getBuildingTypeFieldName(1)}`,
              text: 'Enter at least one building with a value of 1 or more'
            }
          ]
        )
      }

      await this.mergeState(request, state, {
        [FORM_METADATA.PROTOTYPE_ID]: {
          ...state[FORM_METADATA.PROTOTYPE_ID],
          ...validatedPayload
        }
      })

      const { hasNonResidential, hasResidentialTypes } =
        this.checkBuildingTypeMix(buildingTypesList, validatedPayload)

      if (hasNonResidential && !hasResidentialTypes) {
        return h.redirect(
          `/${FORM_METADATA.SLUG}${ROUTES.NON_RESIDENTIAL_ERROR}`
        )
      }

      return h.redirect(this.getNextPageRedirect(query))
    }
  }
}
