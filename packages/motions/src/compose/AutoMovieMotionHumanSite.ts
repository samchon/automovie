import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSite,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Where on a target a contact is made, chosen among the places the target
 * allows: a place drawn by the seed among weighted allowed places, and the
 * place along a vertical handle that leaves the hand comfortable at the end of
 * the move (end-state comfort).
 *
 * End-state comfort: people grasp an object so that the posture at the end of
 * the move is comfortable, so the grasp height on a vertical cylinder falls as
 * the height it is moved to rises (Cohen and Rosenbaum 2004, "Where grasps are
 * made reveals how grasps are planned", Exp Brain Res 157:486; Rosenbaum,
 * Halloran and Cohen 2006). The rule here takes the comfortable end height of
 * the hand as the elbow's height with the upper arm hanging, the forearm level
 * (the body's shoulder height less its upper arm), and grasps where the hand
 * lands there, as far as the handle allows: the grasp falls one for one with
 * the target's height inside the handle and stays at its end beyond it. The
 * slope of one is the rule's, not a measured one: the studies report the
 * inverse relation, and its measured slope is to be read before it becomes a
 * constant (research list).
 */
export namespace AutoMovieMotionHumanSite {
  /**
   * One allowed place drawn by its weight.
   *
   * @param sites The allowed places.
   * @param random The draw's stream.
   * @param index The draw's index in the stream.
   * @returns The drawn place's id.
   * @throws {HumanRefusal} A `parameter` refusal on `sites` when none is given
   *   or a weight is not positive.
   */
  export function draw(
    sites: readonly IAutoMovieMotionHumanSite.IWeighted[],
    random: IAutoMovieRandom,
    index: number,
  ): string {
    if (
      sites.length === 0 ||
      sites.some(
        (s: IAutoMovieMotionHumanSite.IWeighted): boolean => !(s.weight > 0),
      )
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "sites",
        value: sites.map(
          (s: IAutoMovieMotionHumanSite.IWeighted): string =>
            `${s.id}:${s.weight}`,
        ),
        reason:
          "a place is drawn among allowed places, each with a positive weight",
        fix: "give at least one allowed place, each with a positive weight",
      });
    const total: number = sites.reduce(
      (sum: number, s: IAutoMovieMotionHumanSite.IWeighted): number =>
        sum + s.weight,
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
   */
  export function comfortable(body: IAutoMovieMotionHumanBody): number {
    return body.measure.shoulderHeight - body.measure.upperArm;
  }

  /**
   * Where along a vertical handle a hand grasps it, by end-state comfort: the
   * handle moved so its base stands at `target`, the hand lands at `comfort`
   * where the band allows, and at the band's nearer end where it does not.
   *
   * @param band The part of the handle a hand may hold.
   * @param target The height the handle's base is moved to, metres.
   * @param comfort The comfortable end height of the hand (`comfortable`),
   *   metres.
   * @returns The grasp's place along the handle, metres from its base.
   * @throws {HumanRefusal} A `parameter` refusal on `band` when its low end
   *   lies above its high end.
   */
  export function grasp(
    band: IAutoMovieMotionHumanSite.IBand,
    target: number,
    comfort: number,
  ): number {
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
