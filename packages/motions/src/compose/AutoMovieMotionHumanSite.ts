import type { IAutoMovieRandom } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Where on a target a contact is made, chosen among the places the target
 * allows (#3357): a place drawn by the seed among weighted allowed places,
 * and the place along a vertical handle that leaves the hand comfortable at
 * the end of the move (end-state comfort).
 *
 * End-state comfort: people grasp an object so that the posture at the end
 * of the move is comfortable, so the grasp height on a vertical cylinder
 * falls as the height it is moved to rises (Cohen and Rosenbaum 2004,
 * "Where grasps are made reveals how grasps are planned", Exp Brain Res
 * 157:486; Rosenbaum, Halloran and Cohen 2006). The rule here takes the
 * comfortable end height of the hand as the elbow's height with the upper
 * arm hanging, the forearm level (the body's shoulder height less its upper
 * arm), and grasps where the hand lands there, as far as the handle allows:
 * the grasp falls one for one with the target's height inside the handle
 * and stays at its end beyond it. The slope of one is the rule's, not a
 * measured one: the studies report the inverse relation, and its measured
 * slope is to be read before it becomes a constant (#3357's research list).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both choices, the sources, the comfortable height's derivation and the slope's status.
 * @evidence contracts/development/design.md#principled-representation A weighted allowed place and a band along a handle, the inputs of the two choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records and three functions, the first draft of the site axis.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No place is typed per action: the allowed places and the band are the caller's.
 */
export namespace AutoMovieMotionHumanSite {
  /**
   * An allowed place and how often it is drawn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and range.
   * @evidence contracts/development/design.md#principled-representation An id and a positive weight, a categorical distribution's entry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `draw`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is relative; no total is stored.
   */
  export interface IWeighted {
    /** The place's id among the target's places. */
    id: string;

    /** Its relative weight, positive. */
    weight: number;
  }

  /**
   * A band along a handle's axis, metres from its base.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The two ends of the part of a handle a hand may hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `grasp`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The band is the affordance's; nothing is assumed of its length.
   */
  export interface IBand {
    /** The lowest place a hand may hold, metres from the handle's base. */
    low: number;

    /** The highest, metres from the handle's base; at least `low`. */
    high: number;
  }

  /**
   * One allowed place drawn by its weight.
   *
   * @param sites The allowed places.
   * @param random The draw's stream.
   * @param index The draw's index in the stream.
   * @returns The drawn place's id.
   * @throws {HumanRefusal} A `parameter` refusal on `sites` when none is given or a weight is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is drawn, from what, and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Inverse-transform sampling of a categorical distribution: one uniform number scaled by the total weight, walked through the cumulative weights.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A check, one uniform draw and one cumulative walk.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A place outside the allowed ones cannot be returned; an empty set or a weight that is not positive is refused, never defaulted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the allowed places, once per draw.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments; it coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function draw(
    sites: readonly IWeighted[],
    random: IAutoMovieRandom,
    index: number,
  ): string {
    if (
      sites.length === 0 ||
      sites.some((s: IWeighted): boolean => !(s.weight > 0))
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "sites",
        value: sites.map((s: IWeighted): string => `${s.id}:${s.weight}`),
        reason:
          "a place is drawn among allowed places, each with a positive weight",
        fix: "give at least one allowed place, each with a positive weight",
      });
    const total: number = sites.reduce(
      (sum: number, s: IWeighted): number => sum + s.weight,
      0,
    );
    const u: number = random.float(index) * total;
    let reached: number = 0;
    for (const site of sites) {
      reached += site.weight;
      if (u < reached) return site.id;
    }

    // The uniform number lies below the total, so the walk returns above;
    // the last place answers a rounding at the top end.
    return sites[sites.length - 1]!.id;
  }

  /**
   * The height a body's hand is comfortable at when a move ends: the elbow's
   * height with the upper arm hanging and the forearm level.
   *
   * @param body The body.
   * @returns Metres above the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture the height is read in and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation The body's own shoulder height less its upper arm: the hanging upper arm's elbow, where a level forearm holds the hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One subtraction of two measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No height is typed; both come from the body's measure.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its argument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function comfortable(body: IHumanBody): number {
    return body.measure.shoulderHeight - body.measure.upperArm;
  }

  /**
   * Where along a vertical handle a hand grasps it, by end-state comfort:
   * the handle moved so its base stands at `target`, the hand lands at
   * `comfort` where the band allows, and at the band's nearer end where it
   * does not.
   *
   * @param band The part of the handle a hand may hold.
   * @param target The height the handle's base is moved to, metres.
   * @param comfort The comfortable end height of the hand (`comfortable`), metres.
   * @returns The grasp's place along the handle, metres from its base.
   * @throws {HumanRefusal} A `parameter` refusal on `band` when its low end lies above its high end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, its inputs with their units and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation End-state comfort (Cohen and Rosenbaum 2004): the grasp is chosen for the end posture, the hand at its comfortable height, clamped to the part of the handle that can be held.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check and one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A reversed band is refused, never swapped; the grasp never leaves the band.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function grasp(band: IBand, target: number, comfort: number): number {
    if (!(band.low <= band.high))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "band",
        value: [band.low, band.high],
        reason: "a handle's band runs from its low end up to its high end",
        fix: "give the band's low end at or below its high end",
      });
    return Math.min(band.high, Math.max(band.low, comfort - target));
  }
}
