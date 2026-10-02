/**
 * An authored closed lingual body in millimetres, not an MRI reconstruction.
 * Independent dimensions describe the visible body, dorsum and median groove;
 * the two closed endpoints do not model the tongue's actual muscular roots.
 * A named resident material supplies its finish without changing other tissues.
 *
 * @evidence contracts/common.md#principled-implementation A closed ellipsoid-like body described by a width and thickness semiaxis, a length, a dorsal rise, a median groove and a placement expresses the visible lingual volume with independent dimensions; the two closed endpoints are a closure of the volume and not the muscular roots, as the type states.
 * @evidence contracts/common.md#clear-and-simple-design Nine members, one per independent dimension, with the material the only non-numerical one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states that the body is authored and not an MRI reconstruction, that the endpoints do not model the roots, and each member states its unit and admitted range.
 * @evidence contracts/modeling.md#spatial-conventions All lengths are millimetres. The body is built in a local frame with the tip at the origin, the root at -length along Z, X transverse and Y superior; drop and recess are then taken from the observed lower oral anchor in the head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type describes the dimensions of one part, the tongue, and is not a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the ring and column counts of the surface are fixed by `portraitTongueRows` and `portraitTongueColumns`.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint by itself; the observation belongs to `buildPortraitTongue` and the component.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `assertPortraitTongueShape` bounds every member with `portraitTongueParameters`.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named lingual dimension in millimetres or a named material identity; none addresses a vertex, curve or patch.
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

  /** Nonempty existing material identity, independent of enamel and vermilion. */
  material: string;
}
