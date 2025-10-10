import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

import { initBoundaryFileUpload } from './boundary-file-upload.js'

// Initialize GOV.UK Frontend components
createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

// Initialize custom file upload functionality
initBoundaryFileUpload()
