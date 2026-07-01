import { createHash } from 'crypto'
import { DATA_CONSENT_TEXT } from './dataConsentContent'

export function getDataConsentContentHash(): string {
  return createHash('sha256').update(DATA_CONSENT_TEXT).digest('hex')
}
