/**
 * Identify numerical hair independently of a subject or material colour.
 *
 * The hair ID pass relies on emitted part identity and texture alpha, so its
 * silhouette reflects the visible fibres at the capture camera without
 * inferring hair from a rendered colour. Pure.
 */
export function portraitWebHairMaskPart(id: string): boolean {
  return id.startsWith("numerical-hair:");
}
