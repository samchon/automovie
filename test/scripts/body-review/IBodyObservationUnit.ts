import type { IBodyObservationFrame } from "./IBodyObservationFrame";

/**
 * One unit of observation the rendered-observation contract asks a body owner
 * to answer for: a part on its own and in the assembled body, a joint seam as
 * the assembled adjacent pair at its permitted extremes, or the whole body in
 * its reference states.
 *
 * `id` names the unit's owner: a displayed part name, a `parent>child` joint
 * pair, or `whole`. `frames` is the complete set derived for that unit, in the
 * order they are drawn; `excluded` lists each extreme that was derived and then
 * left out because the rig's own limits do not admit it, with the reason, so an
 * exclusion is visible in the record instead of silent.
 */
export interface IBodyObservationUnit {
  /** Which kind of owner the unit belongs to. */
  unit: "part" | "joint" | "whole";

  /** The owner's name. */
  id: string;

  /** Every frame the unit needs. */
  frames: IBodyObservationFrame[];

  /** Extremes derived but not admitted by the rig's limits, each with its reason. */
  excluded: { state: string; reason: string }[];
}
