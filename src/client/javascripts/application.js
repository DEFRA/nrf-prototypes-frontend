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

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

initBoundaryFileUpload()

// Initialize FloodMap if #map element exists
// Force rebuild to pick up legend config changes
if (document.getElementById('map')) {
  import('./map/map-init.js')
    .then(() => console.log('FloodMap module loaded'))
    .catch((err) => console.error('Error loading FloodMap module:', err))
}
