// Polyfills for browser environment
// Must be imported before any other modules

import { Buffer } from 'buffer'

// Make Buffer available globally
globalThis.Buffer = Buffer
window.Buffer = Buffer

export { Buffer }
