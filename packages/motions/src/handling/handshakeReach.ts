import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanHand } from "../posture/HumanHand";
import type { handshakeOffer } from "./handshakeOffer";

/**
 * Why two offering arms do not meet, and where the same pair would: the
 * handshake's refusal (`handshakeOffer.point`).
 *
 * A meeting is missed on one bound: the elbows stand farther apart than the
 * two forearms however far forward the upper arms come, or the pump's lowest
 * point lies beyond the reach of a partner's arm bent `handshakeOffer.EXTENDED`
 * however the upper arms are brought back. The refusal names that bound with
 * its measured value, and as its feasible range the band of shoulder gaps at
 * which the pair does meet, found by trying the pair along the same line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds a meeting can miss and how the band is found.
 * @evidence contracts/development/design.md#principled-representation A miss is a closed union of its bounds with their measured values; the band is a range of the refusal contract.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The miss and the refusal, read by `handshakeOffer.point`.
 * @evidence contracts/development/implementation.md#principled-implementation The band is the meeting itself tried at each centimetre of gap along the partners' line and bisected at each end, so it is what the meeting accepts, not an estimate of it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan, two bisections, one refusal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The refusal names the bound that failed and its measured value, never a band the pair already meets.
 * @evidence contracts/development/implementation.md#efficient-algorithms 246 tries and two 20-step bisections, only once a meeting is refused.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The meeting is passed in, so the band and the plan judge by one rule.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure functions that retain nothing.
 */
export namespace handshakeReach {
  /**
   * The refusal of a missed meeting: the bound that failed with its measured
   * value, and the band of shoulder gaps at which this pair does shake
   * hands, found by trying the pair at every centimetre of gap along the
   * same line, at the same heights, from `BAND[0]` to `BAND[1]`, taking the
   * run of meeting gaps nearest the gap the partners stand at, and bisecting
   * each end of that run.
   *
   * @param a One partner's body and acting shoulder joint in world metres.
   * @param b The other's.
   * @param side The shaking hand of both.
   * @param pump How far the hands travel below the point after meeting, metres.
   * @param miss The bound the meeting missed.
   * @param attempt The meeting, tried again along the partners' line.
   * @returns The refusal.
   */
  export function refusal(
    a: handshakeOffer.ISide,
    b: handshakeOffer.ISide,
    side: HumanHand.Side,
    pump: number,
    miss: IMiss,
    attempt: (
      a: handshakeOffer.ISide,
      b: handshakeOffer.ISide,
      side: HumanHand.Side,
      pump: number,
    ) => handshakeOffer.IMeeting | IMiss,
  ): HumanRefusal {
    const span: IAutoMovieVector3 = Vector3.subtract(b.shoulder, a.shoulder);
    const level: number = Math.hypot(span.x, span.z);
    const along: IAutoMovieVector3 =
      level > 1e-9
        ? { x: span.x / level, y: 0, z: span.z / level }
        : { x: 0, y: 0, z: 1 };
    const meets = (gap: number): boolean =>
      !(
        "bound" in
        attempt(
          a,
          {
            body: b.body,
            shoulder: {
              x: a.shoulder.x + along.x * gap,
              y: b.shoulder.y,
              z: a.shoulder.z + along.z * gap,
            },
          },
          side,
          pump,
        )
      );
    // The runs of gaps that meet, each by its first and last centimetre.
    const runs: [number, number][] = [];
    for (let cm: number = BAND[0] * 100; cm <= BAND[1] * 100; cm++)
      if (meets(cm / 100)) {
        const run: [number, number] | undefined = runs.at(-1);
        if (run !== undefined && Math.abs(run[1] - (cm - 1) / 100) < 1e-9)
          run[1] = cm / 100;
        else runs.push([cm / 100, cm / 100]);
      }
    // The run nearest the gap the partners stand at.
    const nearest: [number, number] | undefined = runs
      .slice()
      .sort(
        (x: [number, number], y: [number, number]): number =>
          Math.max(x[0] - miss.gap, miss.gap - x[1]) -
          Math.max(y[0] - miss.gap, miss.gap - y[1]),
      )[0];
    const first: number | undefined = nearest?.[0];
    const last: number | undefined = nearest?.[1];
    const edge = (inside: number, outside: number): number => {
      for (let i: number = 0; i < 20; i++) {
        const middle: number = (inside + outside) / 2;
        if (meets(middle)) inside = middle;
        else outside = middle;
      }
      return inside;
    };
    const band: { minimum: number; maximum: number } | null =
      first === undefined || last === undefined
        ? null
        : {
            minimum: edge(first, first - 0.01),
            maximum: edge(last, last + 0.01),
          };
    const failed: string =
      miss.bound === "apart"
        ? "the two acting shoulders stand at one place"
        : miss.bound === "chests"
          ? `the shoulders stand ${miss.gap.toFixed(3)} m apart, nearer than the ${miss.chests.toFixed(3)} m at which the two chests touch`
          : miss.bound === "cross"
            ? `the shoulders stand ${miss.gap.toFixed(3)} m apart, so near that the arms pass each other`
            : miss.bound === "far"
              ? `the shoulders stand ${miss.gap.toFixed(3)} m apart, and with the upper arms as far forward as they come the elbows stand ${miss.elbows.toFixed(3)} m apart, beyond the two forearms' ${miss.forearms.toFixed(3)} m`
              : `the shoulders stand ${miss.gap.toFixed(3)} m apart, and at the bottom of the pump the ${miss.partner === 0 ? "first" : "second"} partner's palm would lie ${miss.distance.toFixed(3)} m from its shoulder, beyond the ${miss.reach.toFixed(3)} m its arm reaches with the elbow flexed ${miss.flexed} degrees`;
    return new HumanRefusal({
      kind: "reach",
      axis: "partner",
      value: miss.gap,
      feasible:
        band === null
          ? null
          : {
              kind: "range",
              minimum: band.minimum,
              maximum: band.maximum,
              unit: "m",
            },
      reason: `the hands cannot meet: ${failed}${band === null ? "; this pair meets at no gap" : `; this pair shakes hands with the shoulders ${band.minimum.toFixed(3)} to ${band.maximum.toFixed(3)} m apart`}`,
      fix:
        band === null
          ? "pair partners whose arms can meet"
          : miss.gap < band.minimum
            ? `stand the partners farther apart, the shoulders at least ${band.minimum.toFixed(3)} m apart`
            : `bring the partners nearer, the shoulders at most ${band.maximum.toFixed(3)} m apart`,
    });
  }

  /** The shoulder gaps a refusal tries for the band a pair meets in, metres: from shoulders almost touching to two long arms in line. */
  const BAND: readonly [number, number] = [0.05, 2.5];

  /** A meeting missed, and by which bound. */
  export type IMiss =
    | { bound: "apart"; gap: number }
    | { bound: "cross"; gap: number }
    | { bound: "chests"; gap: number; chests: number }
    | { bound: "far"; gap: number; elbows: number; forearms: number }
    | {
        bound: "pump";
        gap: number;
        partner: 0 | 1;
        distance: number;
        reach: number;
        flexed: number;
      };
}
