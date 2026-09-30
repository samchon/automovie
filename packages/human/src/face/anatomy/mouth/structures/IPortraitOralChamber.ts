/**
 * Interior room beyond the lip vestibule, independently of the visible aperture.
 * The two nonnegative expansions are millimetres along head X and Y. A smooth
 * depth transition preserves the actual rim; the existing posterior cap remains.
 * This is authored enclosure geometry, not measured palate or gingival anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Two nonnegative half-extent expansions and a transition depth describe an interior room beyond the lip vestibule as a smooth widening of the enclosure's rings; the rim and the posterior cap are untouched, so the enlarged room joins the fixed aperture continuously.
 * @evidence contracts/common.md#clear-and-simple-design Three members, one per independent quantity, with no other option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states that the room is authored enclosure geometry and not measured palate or gingival anatomy, and each member states its unit and range.
 * @evidence contracts/modeling.md#parameter-channels Horizontal and vertical expansion are separate channels, each nonnegative with zero as the neutral (no expansion) and positive widening the room symmetrically about the rim's centre in head X or Y; the transition depth sets where the widening reaches full weight and is a third, independent trait.
 * @evidence contracts/modeling.md#spatial-conventions All three members are millimetres along head X, Y and depth, in the same head frame as the lip rim.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a set of dimensions for one enclosure and is not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the enclosure's ring and column counts come from its builder.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; the enclosure that consumes it keeps the exact rim by construction because the weight is zero at the rim.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `assertPortraitOralLining` refuses nonfinite, negative or zero-depth values.
 * @evidence contracts/anatomy.md#parametric-authority Each member is a named extent of a named room in millimetres; none addresses a vertex, curve or patch.
 * @author Samchon
 */
export interface IPortraitOralChamber {
  /** Additional transverse half-extent in mm, finite and nonnegative. */
  horizontalExpansion: number;

  /** Additional vertical half-extent in mm, finite and nonnegative. */
  verticalExpansion: number;

  /** Positive finite depth in mm at which expansion reaches its full weight. */
  transitionDepth: number;
}
