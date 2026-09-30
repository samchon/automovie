/**
 * One anatomical control on the common refined surface. A displacement is the
 * requested movement at this point, including the influence of all neighbours.
 * It is not the amplitude of another independently added bump.
 *
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
