/**
 * A compact envelope of soft-tissue displacement. Lengths use millimetres.
 * Projection is a surface offset, not a measurement of fat volume or thickness.
 * Zero projection and lift retain the supplied host's existing expression.
 *
 * @evidence contracts/common.md#principled-implementation The record is one compact ellipsoidal envelope: an optional support-centre shift, three support radii, and a forward and an upward peak displacement, all in head millimetres; the domains the type cannot express (finite values, strictly positive radii) are enforced by createPortraitCheekLayer, and the comment states that projection is a surface offset and no measurement of fat volume.
 * @evidence contracts/common.md#clear-and-simple-design Five numbers and one optional shift describe one region, shared by the four masses of IPortraitCheekShape instead of four repeated shapes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration carries no behaviour, special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment and members state the unit, the sign and mirroring of the outward shift, the meaning of each radius, that projection is no fat-volume measurement and that zero projection and lift retain the host expression.
 * @evidence contracts/modeling.md#parameter-channels Projection varies only the forward trait and lift only the upward trait, each zero at neutral and positive forward or up; the three radii set the extent of the support along X, Y and Z and change no displacement; the outward shift is mirrored by the anatomical side of the socket, so the pair is two layers of one shape with an explicit rule and the base form stays symmetric. A support radius changes how far a displacement reaches, so projection and lift effects depend on the radii.
 * @evidence contracts/modeling.md#spatial-conventions Every length is head-frame millimetres with +X anatomical left, +Y up and +Z anterior, stated on the members; the type converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a declaration and defines no part or group; the cheek layer that reads it is the part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type constructs no surface; the layer that reads it adds displacement fields to the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type is a declaration and displays nothing; the layer that reads it is observed by its owner.
 *
 * @author Samchon
 */
export interface IPortraitCheekVolume {
  /**
   * Optional support-centre shift [outward, up, forward] from the bound skin
   * anchor, in mm. Outward is mirrored by the anatomical side; a negative first
   * coordinate moves both cheeks towards the nose. Omission retains the anchor.
   */
  offset?: [number, number, number];

  /** Positive transverse support radius in the head frame. */
  width: number;

  /** Positive vertical support radius in the head frame. */
  height: number;

  /** Positive depth support radius; limits influence through the head. */
  reach: number;

  /** Peak anterior displacement along head Z, in mm. */
  projection: number;

  /** Peak upward displacement along head Y, in mm. */
  lift: number;
}
