import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionTarget,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanGaze } from "./HumanGaze";
import { HumanProxemics } from "./HumanProxemics";

/**
 * Where a person in a conversation looks: at the partner's face for
 * seeded glances, away between them, more while listening than while
 * speaking.
 *
 * Acarturk et al. (2021, J Eye Mov Res 14(1):1, mobile eye tracking of mock
 * job interviews) measured both parties: the listening interviewer looked
 * at the face for 3.89 s on average and away for 0.29 s, the speaking
 * interviewee at the face for 1.82 s and away for 0.83 s (Table 3), so a
 * listener spends about 93 % of the time on the partner's face and a
 * speaker about 69 %, more while listening than while speaking as Kendon
 * (1967, Acta Psychol 26:22) and Argyle and Cook (1976) observed. Each
 * participant's gaze alternates glances at the face and looks away, both
 * durations drawn from exponential distributions of those means, the study's
 * standard deviations being about their means. The listener's aversions go
 * diagonally, down and to a seeded side; the speaker's follow the study's
 * mix after a look at the face: right 39 %, left 19 %, down 20 %, diagonal
 * 19 % and up 3 % (Table 5). Each aversion turns the gaze by the eyes' own
 * share of a gaze shift (`HumanGaze.EYES`, under which the head stays put,
 * Freedman 2008), split evenly between aside and down on a diagonal, to a
 * point at the partner's distance, the personal conversation gap (Hall
 * 1966), so the eyes keep their vergence. A turn boundary starts a new
 * glance at the partner, as speakers look up at the end of their turn
 * (Kendon 1967).
 *
 * The result is a gaze layer's requests, so the conversation's gaze never
 * cuts the bodies' actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form evaluation of the cited law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small function per quantity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range inputs throw; every duration, share and direction is the cited study's, the angle the eyes' share and the range the conversation gap.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call, or linear in the requests a call builds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs; the direction, side, eye height and every random draw are read per request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanConversation {

  /** Mean glance and away durations, seconds, by role: the speaking interviewee's and the listening interviewer's (Acarturk et al. 2021, Table 3). */
  export const GLANCES: Readonly<
    Record<"speaking" | "listening", { on: number; away: number }>
  > = {
    speaking: { on: 1.82, away: 0.83 },
    listening: { on: 3.89, away: 0.29 },
  };

  /** Where a speaker's look away goes after a look at the face, as shares of the speaker's aversions (Acarturk et al. 2021, Table 5); a listener's go diagonally. */
  export const AVERSIONS: Readonly<Record<"right" | "left" | "down" | "diagonal" | "up", number>> = {
    right: 0.39,
    left: 0.19,
    down: 0.2,
    diagonal: 0.19,
    up: 0.03,
  };

  /**
   * A participant's gaze requests through a conversation.
   *
   * @param subject The participant.
   * @param partner The other participant's subject id; the gaze goes to their face.
   * @param turns The turns, in time order.
   * @param random The participant's stream.
   * @param eyes The participant's eye height, metres, the height a look away turns from.
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
                target: away(
                  eyes,
                  role === "listening" ? "diagonal" : aversion(random.float(draw++)),
                  random.float(draw++) < 0.5 ? 1 : -1,
                ),
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

/** A direction of look away, as `AVERSIONS` names them. */
type Aversion = keyof typeof HumanConversation.AVERSIONS;

/** The aversion a uniform draw in [0, 1) picks from the speaker's mix (`AVERSIONS`), by its cumulative shares. */
function aversion(u: number): Aversion {
  let sum: number = 0;
  for (const [name, share] of Object.entries(HumanConversation.AVERSIONS) as [Aversion, number][]) {
    sum += share;
    if (u < sum) return name;
  }
  return "right";
}

/**
 * A look-away point in the looker's own frame (`x` left, `y` up, `z`
 * forward): the gaze turned by the eyes' share `HumanGaze.EYES` toward the
 * aversion's direction, split evenly between aside and down on a diagonal,
 * at the conversation's distance `AWAY_RANGE`; `side` picks the side of a
 * diagonal (1 left, -1 right).
 */
function away(eyes: number, direction: Aversion, side: number): IAutoMovieMotionTarget {
  const turn: number = (HumanGaze.EYES * Math.PI) / 180;
  const [left, up]: [number, number] =
    direction === "right" ? [-1, 0]
      : direction === "left" ? [1, 0]
        : direction === "down" ? [0, -1]
          : direction === "up" ? [0, 1]
            : [side * Math.SQRT1_2, -Math.SQRT1_2];
  return {
    kind: "point",
    at: {
      x: AWAY_RANGE * Math.sin(turn) * left,
      y: eyes + AWAY_RANGE * Math.sin(turn) * up,
      z: AWAY_RANGE * Math.cos(turn),
    },
    frame: "performer",
  };
}

/** How far ahead a look-away point lies, metres: the personal gap people converse at (`HumanProxemics.GAPS.personal`, Hall 1966), the partner's distance, so the eyes keep the vergence they had on the partner's face. */
const AWAY_RANGE: number = HumanProxemics.GAPS.personal;