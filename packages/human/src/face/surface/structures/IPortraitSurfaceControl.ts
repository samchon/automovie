/**
 * One anatomical control on the common refined surface. A displacement is the
 * requested movement at this point, including the influence of all neighbours.
 * It is not the amplitude of another independently added bump.
 *
 * @evidence contracts/common.md#principled-implementation A control is a named datum vertex, an offset and a total displacement at that point, which is what the interpolating layer solves for; the displacement includes every neighbour's influence and is not another added bump.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record has no behaviour or special case.
 * @evidence contracts/common.md#meaningful-documentation States the deterministic ordering role of the name, the datum, the units and that the displacement is total.
 * @evidence contracts/modeling.md#spatial-conventions Offset and displacement are construction millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSurfaceControl is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitSurfaceControl carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSurfaceControl decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSurfaceControl constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSurfaceControl is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitSurfaceControl carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitSurfaceControl admits, bounds and combines no anatomical value.
 * @author Samchon
 */
export interface IPortraitSurfaceControl {
  /** Unique anatomical responsibility, also fixing deterministic solve order. */
  name: string;

  /** Subject-owned retained vertex used as this point's current datum. */
  anchor: number;

  /** XYZ offset from the datum, in construction millimetres. */
  offset: readonly number[];

  /** Total requested XYZ displacement at the control, in millimetres. */
  displacement: readonly number[];
}
