import { QuestionPageController } from '@defra/forms-engine-plugin/controllers/QuestionPageController.js'
import { isPathRelative } from '@defra/forms-engine-plugin/engine/helpers.js'
import { FORM_METADATA } from '../../common/constants/form-metadata.js'
import { FORM_COMPONENT_NAMES } from '../../common/constants/form-component-names.js'
import {
  FORM_LIST_NAMES,
  BUILDING_TYPES
} from '../../common/constants/form-lists.js'
import { ROUTES } from '../../common/constants/routes.js'

// Field name prefix for building type inputs
const BUILDING_TYPE_FIELD_PREFIX = 'buildingType-'

// Validation constants
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
   * Handle GET requests - display the building types form
   * Populates the form with building types list and any previously saved values
   */
  makeGetRouteHandler() {
    return (request, context, h) => {
      const viewModel = this.getViewModel(request, context)
      const { state } = context

      // Add building types list to view model
      const buildingTypesList = this.getBuildingTypesList()
      viewModel.buildingTypes = buildingTypesList?.items || []

      // Restore previously entered building type values from session state
      const savedValues = state[FORM_METADATA.PROTOTYPE_ID] || {}

      viewModel.submittedValues = {}
      const buildingTypes = buildingTypesList?.items || []
      for (let i = 0; i < buildingTypes.length; i++) {
        const fieldName = this.getBuildingTypeFieldName(i + 1)
        viewModel.submittedValues[fieldName] = savedValues[fieldName] ?? 0
      }

      return h.view(this.viewName, viewModel)
    }
  }

  /**
   * Handle POST requests - validate and save building types
   * Requires at least one building with a quantity > 0
   * Supports returnUrl for redirecting back to summary page
   */
  makePostRouteHandler() {
    return async (request, context, h) => {
      const { payload, query } = request
      const { state } = context

      // Get the list of valid building type fields
      const buildingTypesList = this.getBuildingTypesList()
      const validFieldNames = new Set()
      for (let i = 0; i < (buildingTypesList?.items.length || 0); i++) {
        validFieldNames.add(this.getBuildingTypeFieldName(i + 1))
      }

      // Validate and filter payload to only include valid building type fields
      // This protects against malicious requests with spoofed field names
      const validatedPayload = {}
      const errors = []

      buildingTypesList?.items.forEach((item, index) => {
        const fieldName = this.getBuildingTypeFieldName(index + 1)
        const value = payload[fieldName]

        if (validFieldNames.has(fieldName)) {
          // Check for decimal numbers (user mistake)
          if (value && value.toString().includes('.')) {
            errors.push({
              path: fieldName,
              name: fieldName,
              href: `#${fieldName}`,
              text: `${item.text}: Please enter a whole number (no decimals)`
            })
            validatedPayload[fieldName] = value
            return
          }

          const parsedValue = parseInt(value, 10)

          // Check if value is a valid number
          if (isNaN(parsedValue)) {
            errors.push({
              path: fieldName,
              name: fieldName,
              href: `#${fieldName}`,
              text: `${item.text}: Please enter a valid number`
            })
            validatedPayload[fieldName] = value
            return
          }

          // Check if value is negative
          if (parsedValue < MIN_QUANTITY) {
            errors.push({
              path: fieldName,
              name: fieldName,
              href: `#${fieldName}`,
              text: `${item.text}: Value cannot be negative`
            })
            validatedPayload[fieldName] = value
            return
          }

          // Check if value exceeds maximum
          if (parsedValue > MAX_QUANTITY) {
            errors.push({
              path: fieldName,
              name: fieldName,
              href: `#${fieldName}`,
              text: `${item.text}: Value cannot exceed ${MAX_QUANTITY.toLocaleString()}`
            })
            validatedPayload[fieldName] = value
            return
          }

          validatedPayload[fieldName] = value
        }
      })

      // If there are validation errors, return to form with errors
      if (errors.length > 0) {
        const viewModel = this.getViewModel(request, context)

        viewModel.buildingTypes = buildingTypesList?.items || []
        viewModel.submittedValues = validatedPayload
        viewModel.errors = errors

        return h.view(this.viewName, viewModel)
      }

      // Calculate total number of buildings across all types
      const total = Object.values(validatedPayload)
        .filter((value) => typeof value === 'string' && value !== '')
        .map((value) => parseInt(value, 10))
        .filter((value) => !isNaN(value))
        .reduce((sum, value) => sum + value, 0)

      // Validation: require at least one building
      if (total === 0) {
        const viewModel = this.getViewModel(request, context)

        viewModel.buildingTypes = buildingTypesList?.items || []
        viewModel.submittedValues = validatedPayload
        viewModel.errors = [
          {
            path: FORM_COMPONENT_NAMES.BUILDING_TYPES,
            name: FORM_COMPONENT_NAMES.BUILDING_TYPES,
            href: `#${this.getBuildingTypeFieldName(1)}`,
            text: 'Enter at least one building with a value of 1 or more'
          }
        ]

        return h.view(this.viewName, viewModel)
      }

      // Save building types to session state (before any redirects)
      // Merge with existing prototype data to preserve boundary file upload
      const existingData = state[FORM_METADATA.PROTOTYPE_ID]
      const mergedData = {
        ...existingData,
        ...validatedPayload
      }

      await this.mergeState(request, state, {
        [FORM_METADATA.PROTOTYPE_ID]: mergedData
      })

      // Check if only non-residential development was entered
      let hasNonResidential = false
      let hasResidentialTypes = false

      // Check each building type
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

      // Redirect if only non-residential was entered
      if (hasNonResidential && !hasResidentialTypes) {
        return h.redirect(
          `/${FORM_METADATA.SLUG}${ROUTES.NON_RESIDENTIAL_ERROR}`
        )
      }

      // Support returnUrl for "Change" links from summary page (only allow relative paths for security)
      const returnUrl = query.returnUrl
      if (returnUrl && isPathRelative(returnUrl)) {
        return h.redirect(returnUrl)
      }

      // Default: redirect to next page in form flow
      const { next } = this.pageDef

      if (!next || next.length === 0) {
        throw new Error(
          `No next page configured for ${FORM_COMPONENT_NAMES.BUILDING_TYPES}`
        )
      }

      const fullPath = `/${FORM_METADATA.SLUG}${next[0].path}`

      return h.redirect(fullPath)
    }
  }
}
