import { AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { handshakeOffer } from "./handshakeOffer";

/*
 * Why two offering arms do not meet, and where the same pair would: the
 * handshake's refusal (`handshakeOffer.point`).
 *
 * A meeting is missed on one bound: the elbows stand farther apart than the two
 * forearms however far forward the upper arms come, or the pump's lowest point
 * lies beyond the reach of a partner's arm bent `handshakeOffer.EXTENDED`
 * however the upper arms are brought back. The refusal names that bound with
 * its measured value, and as its feasible range the band of shoulder gaps at
 * which the pair does meet, found by trying the pair along the same line.
 */
export namespace handshakeReach {
  /*
   * The refusal of a missed meeting: the bound that failed with its measured
   * value, and the band of shoulder gaps at which this pair does shake hands,
   * found by trying the pair at every centimetre of gap along the same line, at
   * the same heights, from `BAND[0]` to `BAND[1]`, taking the run of meeting
   * gaps nearest the gap the partners stand at, and bisecting each end of that
   * run.
   * Parameter a: One partner's body and acting shoulder joint in world metres.
   * Parameter b: The other's.
   * Parameter side: The shaking hand of both.
   * Parameter pump: How far the hands travel below the point after meeting, metres.
   * Parameter miss: The bound the meeting missed.
   * Parameter attempt: The meeting, tried again along the partners' line.
   * Returns: The refusal.
   */
  export function refusal(
    a: handshakeOffer.ISide,
    b: handshakeOffer.ISide,
    side: AutoMovieHumanSide,
    pump: number,
    miss: IMiss,
    attempt: (
      a: handshakeOffer.ISide,
      b: handshakeOffer.ISide,
      side: AutoMovieHumanSide,
      pump: number,
    ) => IAttempt,
  ): IAutoMovieMotionHumanRefusal {
    const span: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b.shoulder, a.shoulder);
    const level: number = Math.hypot(span.x, span.z);
    const along: IAutoMovieVector3 =
      level > 1e-9
        ? { x: span.x / level, y: 0, z: span.z / level }
        : { x: 0, y: 0, z: 1 };
    const meets = (gap: number): boolean =>
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
      ).kind === "met";
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
    // Each end of the run, bisected over its centimetre to 2^-20 of it.
    const edge = (inside: number, outside: number): number =>
      AutoMovieEngineMath.bracketedBisection(
        (gap: number): boolean => !meets(gap),
        outside,
        inside,
        Math.abs(inside - outside) / 2 ** 20,
      );
    const band: IRefusalBand | null =
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
    return new AutoMovieMotionHumanRefusal({
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

  /*
   * A meeting missed, and by which bound.
   */
  export type IMiss = IMiss2 | IMiss3 | IMiss4 | IMiss5 | IMiss6;

  /*
   * A meeting tried: met, or missed on a bound.
   */
  export type IAttempt = IMet | IMissed;

  /*
   * The shoulder gaps a refusal tries for the band a pair meets in, metres:
   * from shoulders almost touching to two long arms in line.
   */
  const BAND: readonly [number, number] = [0.05, 2.5];
}

/*
 * The record of `IMiss6`'s site.
 */
type IMiss6 = {
  bound: "pump";
  gap: number;
  partner: MissPartner;
  distance: number;
  reach: number;
  flexed: number;
};

/*
 * The alternatives of `MissPartner`'s site.
 */
type MissPartner = 0 | 1;

/*
 * The record of `IMiss5`'s site.
 */
type IMiss5 = { bound: "far"; gap: number; elbows: number; forearms: number };

/*
 * The record of `IMiss4`'s site.
 */
type IMiss4 = { bound: "chests"; gap: number; chests: number };

/*
 * The record of `IMiss3`'s site.
 */
type IMiss3 = { bound: "cross"; gap: number };

/*
 * The record of `IMiss2`'s site.
 */
type IMiss2 = { bound: "apart"; gap: number };

/*
 * A meeting tried and met.
 */
type IMet = { kind: "met"; meeting: handshakeOffer.IMeeting };

/*
 * A meeting tried and missed on a bound.
 */
type IMissed = { kind: "missed"; miss: handshakeReach.IMiss };

/*
 * The record of `IRefusalBand`'s site.
 */
type IRefusalBand = { minimum: number; maximum: number };
