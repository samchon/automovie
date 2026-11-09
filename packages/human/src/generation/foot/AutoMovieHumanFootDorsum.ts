import {
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
  AutoMovieSolidVector as V,
} from "@automovie/engine";

import type { AutoMovieHumanFootConnection } from "./AutoMovieHumanFootConnection";

/**
 * A replaced dorsal source and the additional physical stations it owns.
 *
 * @evidence contracts/common.md#principled-implementation The actual parent ankle section's sagittal cut replaces the incorrectly interpreted horizontal ankle-cut plateau; the published half-length dorsum anchors the forward transition.
 * @evidence contracts/common.md#clear-and-simple-design Authors only the dorsal outline; FootPart preserves other complete edge functions and unions emission stations separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not refit reference pixels, transfer the heel's rearmost-point height, change the independent ankle tape or reconstruct the side outlines.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes actual connection constraints, published arch site and unchanged forward scalar spans; no full-phase contact or C2 join is claimed.
 * @evidence contracts/performance.md#efficient-algorithms One O(n) dorsal preparation and knot pass retain forward named values without retaining jets derived from the discarded rear law.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the prepared leg contact and existing complete dorsal source rather than constructing another leg or raw loft.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous caller owns the returned O(n) outline and its source definition.
 */
export namespace AutoMovieHumanFootDorsum {
  /** The original constant-height foot chart and its shared ankle contact. */
  export interface IInput {
    /** Original dorsal knots and domain, calibration mm; no neighbouring part is acquired. */
    part: Pick<IAutoMovieViewPart, "front" | "stations">;
    /** Pternion plan position and foot-along direction. */
    heel: V.Vec3;
    /** Unit foot-along direction. */
    along: V.Vec3;
    /** Public foot length, mm. */
    length: number;
    /** Existing axis height, preserved to keep the floor and closing points. */
    height: number;
    /** Williams-McClay dorsum height at half foot length, mm. */
    arch: number;
    /** The actual complete leg source and its sagittal cut. */
    ankle: AutoMovieHumanFootConnection.IAnkle;
  }

  /**
   * Replace the misinterpreted ankle-cut roof and its globally coupled natural
   * jets. Actual ankle contacts, the clinical half-length height and retained
   * forward named heights form one new natural dorsal source. Its intervening
   * function changes; lateral/medial outlines are never resampled here.
   *
   * @evidence contracts/common.md#principled-implementation Actual sagittal contacts, the clinical half-length height and unchanged forward named heights define one natural dorsal source; old natural jets depended on the discarded rear law and are not independent observations.
   * @evidence contracts/common.md#clear-and-simple-design Returns a single replacement dorsal outline with the original parameter owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses reversed or out-of-region contacts instead of moving them; no new global site re-solves all four outlines.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes preserved forward named heights from the newly authored complete dorsal function and independent emission-station responsibility.
   * @evidence contracts/performance.md#efficient-algorithms O(n) preparation and knot reading; no section or realized loft is built.
   * @evidence contracts/performance.md#reuse-equivalent-work The one prepared original supplies every retained value and jet.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary source state dies with this call; only the authored outline survives.
   */
  export function create(input: IInput): IAutoMovieViewPart.IOutline {
    const bottom: number = input.part.stations[0]!;
    const top: number = input.part.stations.at(-1)!;
    const original:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      input.part.front.positive,
      { bottom, top },
    );
    if ("detail" in original) throw new Error(original.detail);
    const knots: IAutoMovieViewPart.IKnot[] = [
      { site: "bottom pole", station: bottom, value: 0 },
    ];
    for (const [index, point] of input.ankle.points.entries()) {
      const station: number = V.dot(V.sub(point, input.heel), input.along);
      if (!(station > knots.at(-1)!.station && station < input.length / 2))
        throw new Error(
          "Actual ankle sagittal contacts must rise between heel and half foot length",
        );
      knots.push({
        site:
          index === 0 ? "ankle posterior contact" : "ankle anterior contact",
        station,
        value: point[1] - input.height,
      });
    }
    knots.push({
      site: "published dorsum at half length",
      station: input.length / 2,
      value: input.arch - input.height,
    });
    for (const knot of original.knots.filter(
      (value: IAutoMovieViewPart.IKnot): boolean =>
        value.station >= 0.55 * input.length,
    )) {
      knots.push({
        site: knot.site,
        station: knot.station,
        value: knot.value,
      });
    }
    return { knots, parameter: original.parameter };
  }
}
