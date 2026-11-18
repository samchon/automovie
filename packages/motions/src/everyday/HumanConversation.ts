import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionTarget,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";

/**
 * Where a person in a conversation looks: at the partner's face for
 * seeded glances, away between them, more while listening than while
 * speaking.
 *
 * Kendon (1967, Acta Psychol 26:22) and Argyle and Cook (1976, Gaze and
 * Mutual Gaze) found that listeners look at the speaker about 75 % of the
 * time and speakers at the listener about 40 %, in glances of a few seconds.
 * Each participant's gaze alternates glances at the partner's face and looks
 * away; glance and away durations are drawn from exponential distributions
 * whose means give those shares: a listener 3 s on and 1 s away, a speaker
 * 2 s on and 3 s away (glance means provisional, chosen inside the few
 * seconds reported, so that `on / (on + away)` is the cited share). A look
 * away goes to a point 25 degrees to a seeded side of the participant's
 * heading and 10 degrees below the eyes; conversing people face each other,
 * so that is beside and below the partner. A turn boundary starts a new glance at the
 * partner, as speakers look up at the end of their turn (Kendon 1967).
 *
 * The result is a gaze layer's requests, so the conversation's gaze never
 * cuts the bodies' actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form evaluation of the cited law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small function per quantity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range inputs throw; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call, or linear in the requests a call builds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The look-away angles' sines, cosine and tangent are computed once for the module; the side, the eye height and every random draw are read per request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanConversation {

  /** Mean glance and away durations, seconds, by role. */
  export const GLANCES: Readonly<
    Record<"speaking" | "listening", { on: number; away: number }>
  > = {
    speaking: { on: 2, away: 3 },
    listening: { on: 3, away: 1 },
  };

  /**
   * A participant's gaze requests through a conversation.
   *
   * @param subject The participant.
   * @param partner The other participant's subject id; the gaze goes to their face.
   * @param turns The turns, in time order.
   * @param random The participant's stream.
   * @param eyes The participant's eye height, metres, so a look away drops below it.
   * @returns Gaze layer requests in time order.
   * @throws {HumanRefusal} For a turn that does not start at a finite film second, at least 0, or does not end at a finite second after its start.
   */
  export function gaze(
    subject: string,
    partner: string,
    turns: readonly IAutoMovieMotionHumanConversation.ITurn[],
    random: IAutoMovieRandom,
    eyes: number,
  ): IAutoMovieMotionHumanGaze.ILayer[] {
    const face: IAutoMovieMotionTarget = {
      kind: "person",
      subject: partner,
      region: "face",
    };
    const out: IAutoMovieMotionHumanGaze.ILayer[] = [];
    let draw: number = 0;
    const exponential: (mean: number) => number = (mean: number): number =>
      -mean * Math.log(Math.max(1e-12, 1 - random.float(draw++)));
    for (const turn of turns) {
      // A turn starts at a finite film second, so its glances, each a draw
      // of a finite duration added to the clock, reach its finite end: a
      // start of minus infinity stays there however much is added.
      HumanBound.least("turns.from", turn.from, 0, "s");
      HumanBound.above("turns.to", turn.to, turn.from, "s");
      const role: "speaking" | "listening" =
        turn.speaker === subject ? "speaking" : "listening";
      const mean: { on: number; away: number } = GLANCES[role];
      let t: number = turn.from;
      let on: boolean = true;
      while (t < turn.to) {
        out.push(
          on
            ? { target: face, from: t, with: "head" }
            : {
                target: away(eyes, random.float(draw++) < 0.5 ? 1 : -1),
                from: t,
                with: "head",
              },
        );
        t += exponential(on ? mean.on : mean.away);
        on = !on;
      }
    }
    return out;
  }

  /**
   * The share of a span a participant's requests spend on the partner's face.
   *
   * @param requests The requests.
   * @param from Span start, film seconds.
   * @param to Span end.
   * @returns The share in [0, 1].
   */
  export function share(
    requests: readonly IAutoMovieMotionHumanGaze.ILayer[],
    from: number,
    to: number,
  ): number {
    let on: number = 0;
    requests.forEach((r: IAutoMovieMotionHumanGaze.ILayer, i: number): void => {
      const a: number = Math.max(from, r.from);
      const b: number = Math.min(to, requests[i + 1]?.from ?? to);
      if (b > a && r.target.kind === "person") on += b - a;
    });
    return on / (to - from);
  }
}

/** A look-away point `AWAY_RANGE` out, `AWAY_ASIDE` degrees to a side of the looker's heading and `AWAY_DOWN` degrees below the eyes, in the looker's own frame. */
function away(eyes: number, side: number): IAutoMovieMotionTarget {
  return {
    kind: "point",
    at: {
      x: side * AWAY_RANGE * AWAY_SINE,
      y: eyes - AWAY_RANGE * AWAY_TANGENT,
      z: AWAY_RANGE * AWAY_COSINE,
    },
    frame: "performer",
  };
}

/** How far ahead a look-away point lies, metres (provisional: past a conversation's gap, so the eyes converge beyond the partner; read from no measured source). */
const AWAY_RANGE: number = 2;

/** How far to the side of the heading a look away turns, degrees (provisional, read from no measured source). */
const AWAY_ASIDE: number = 25;

/** How far below the eyes a look away drops, degrees (provisional, read from no measured source). */
const AWAY_DOWN: number = 10;

/** The sine of `AWAY_ASIDE`. */
const AWAY_SINE: number = Math.sin((AWAY_ASIDE * Math.PI) / 180);

/** The cosine of `AWAY_ASIDE`. */
const AWAY_COSINE: number = Math.cos((AWAY_ASIDE * Math.PI) / 180);

/** The tangent of `AWAY_DOWN`. */
const AWAY_TANGENT: number = Math.tan((AWAY_DOWN * Math.PI) / 180);