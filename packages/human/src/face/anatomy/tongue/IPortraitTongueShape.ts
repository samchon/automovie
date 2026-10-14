/**
 * An authored closed lingual body in millimetres, not an MRI reconstruction.
 * Independent dimensions describe the visible body, dorsum and median groove;
 * the two closed endpoints do not model the tongue's actual muscular roots.
 * A named resident material supplies its finish without changing other tissues.
 *
 * @evidence contracts/common.md#principled-implementation Independent millimetre body semiaxes, rise, groove and oral-anchor placement describe the authored closed tongue produced by buildPortraitTongue; assertPortraitTongueShape admits the eight catalogue ranges and groove/body inequality.
 * @evidence contracts/common.md#clear-and-simple-design Shape and material identity remain one component input while the builder owns its surface and the assembly component owns oral placement and containment admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The closed endpoints and numerical ranges are authored geometry conventions rather than reconstructed muscular roots or clinical bounds; nonblank material admission alone does not establish catalogue residency.
 * @evidence contracts/common.md#meaningful-documentation Every geometric member states its millimetre range and body or anchor meaning; prose distinguishes authored geometry and independent finish from anatomical reconstruction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface implements no surface allocation or fit test; tongue producers and assembly admission own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no computation; component construction owns the shape's derived geometry and host bindings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no handle or cache; its caller and component own the input and allocated surface.
 *
 * @author Samchon
 */
export interface IPortraitTongueShape {
  /** Transverse body semiaxis in [5,35] mm. */
  halfWidth: number;

  /** Anterior-to-posterior body length in [20,70] mm. */
  length: number;

  /** Vertical body semiaxis in [2,15] mm. */
  halfThickness: number;

  /** Superior mid-body centreline rise in [0,15] mm at the observed expression. */
  dorsumRise: number;

  /** Median groove depression in [0,3] mm, strictly less than halfThickness. */
  grooveDepth: number;

  /** Gaussian transverse groove scale in [0.2,8] mm. */
  grooveWidth: number;

  /** Inferior placement from the observed lower oral anchor in [0,15] mm. */
  drop: number;

  /** Posterior tip placement from the observed lower oral anchor in [0,30] mm. */
  recess: number;

  /** Nonblank material identity; residency is checked by later model admission. */
  material: string;
}
