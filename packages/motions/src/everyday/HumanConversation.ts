import type { IAutoMovieRandom } from "@automovie/engine";
import type { AutoMovieMotionTarget } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanGaze } from "./HumanGaze";

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
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanConversation {
  /** One speaking turn. */
  export interface ITurn {
    /** The speaker's subject id. */
    speaker: string;

    /** Film second the turn starts. */
    from: number;

    /** Film second the turn ends. */
    to: number;
  }

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
   */
  export function gaze(
    subject: string,
    partner: string,
    turns: readonly ITurn[],
    random: IAutoMovieRandom,
    eyes: number,
  ): HumanGaze.ILayer[] {
    const face: AutoMovieMotionTarget = {
      kind: "person",
      subject: partner,
      region: "face",
    };
    const out: HumanGaze.ILayer[] = [];
    let draw: number = 0;
    const exponential = (mean: number): number =>
      -mean * Math.log(Math.max(1e-12, 1 - random.float(draw++)));
    for (const turn of turns) {
      HumanBound.above("turns.to", turn.to, turn.from, "s");
      const role: "speaking" | "listening" =
        turn.speaker === subject ? "speaking" : "listening";
      const mean = GLANCES[role];
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
    requests: readonly HumanGaze.ILayer[],
    from: number,
    to: number,
  ): number {
    let on: number = 0;
    requests.forEach((r: HumanGaze.ILayer, i: number): void => {
      const a: number = Math.max(from, r.from);
      const b: number = Math.min(to, requests[i + 1]?.from ?? to);
      if (b > a && r.target.kind === "person") on += b - a;
    });
    return on / (to - from);
  }
}

/** A look-away point 2 m out, 25 degrees to a side of the looker's heading and 10 degrees below the eyes, in the looker's own frame. */
function away(eyes: number, side: number): AutoMovieMotionTarget {
  const yaw: number = (25 * Math.PI) / 180;
  const pitch: number = (10 * Math.PI) / 180;
  return {
    kind: "point",
    at: {
      x: side * 2 * Math.sin(yaw),
      y: eyes - 2 * Math.tan(pitch),
      z: 2 * Math.cos(yaw),
    },
    frame: "performer",
  };
}
