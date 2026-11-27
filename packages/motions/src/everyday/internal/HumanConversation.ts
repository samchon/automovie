import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionTarget,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanGaze } from "./HumanGaze";
import { HumanProxemics } from "./HumanProxemics";

/*
 * Where a person in a conversation looks: at the partner's face for seeded
 * glances, away between them, more while listening than while speaking.
 *
 * Acarturk et al. (2021, J Eye Mov Res 14(1):1, mobile eye tracking of mock job
 * interviews) measured both parties: the listening interviewer looked at the
 * face for 3.89 s on average and away for 0.29 s, the speaking interviewee at
 * the face for 1.82 s and away for 0.83 s (Table 3), so a listener spends about
 * 93 % of the time on the partner's face and a speaker about 69 %, more while
 * listening than while speaking as Kendon (1967, Acta Psychol 26:22) and Argyle
 * and Cook (1976) observed. Each participant's gaze alternates glances at the
 * face and looks away, both durations drawn from exponential distributions of
 * those means, the study's standard deviations being about their means. The
 * listener's aversions go diagonally, down and to a seeded side; the speaker's
 * follow the study's mix after a look at the face: right 39 %, left 19 %, down
 * 20 %, diagonal 19 % and up 3 % (Table 5). Each aversion turns the gaze by the
 * eyes' own share of a gaze shift (`HumanGaze.EYES`, under which the head stays
 * put, Freedman 2008), split evenly between aside and down on a diagonal, to a
 * point at the partner's distance, the personal conversation gap (Hall 1966),
 * so the eyes keep their vergence. A turn boundary starts a new glance at the
 * partner, as speakers look up at the end of their turn (Kendon 1967).
 *
 * The result is a gaze layer's requests, so the conversation's gaze never cuts
 * the bodies' actions.
 */
export namespace HumanConversation {
  /*
   * Mean glance and away durations, seconds, by role: the speaking
   * interviewee's and the listening interviewer's (Acarturk et al. 2021, Table
   * 3).
   */
  export const GLANCES: Readonly<Record<GLANCESEntryItem, IGLANCESEntryItem>> =
    {
      speaking: { on: 1.82, away: 0.83 },
      listening: { on: 3.89, away: 0.29 },
    };

  /*
   * Where a speaker's look away goes after a look at the face, as shares of the
   * speaker's aversions (Acarturk et al. 2021, Table 5); a listener's go
   * diagonally.
   */
  export const AVERSIONS: Readonly<Record<AVERSIONSEntryItem, number>> = {
    right: 0.39,
    left: 0.19,
    down: 0.2,
    diagonal: 0.19,
    up: 0.03,
  };

  /*
   * The shared glance planner the Conversation readers apply to each span's
   * selected face: the speaker's and the listener's cadence (`GLANCES`) and the
   * speaker's aversions (`AVERSIONS`), drawn from the participant's stream.
   * On `turns.to` for a span that does not end at a
   * finite second after its start.
   */
  export function glances<Turn extends IAutoMovieMotionHumanConversation.ITurn>(
    subject: string,
    turns: readonly Turn[],
    random: IAutoMovieRandom,
    eyes: number,
    partner: (turn: Turn) => string,
    release: boolean = false,
  ): IAutoMovieMotionHumanGaze.ILayer[] {
    return planGlances(subject, turns, random, eyes, partner, release);
  }
}

/*
 * The alternatives of `AVERSIONSEntryItem`'s site.
 */
type AVERSIONSEntryItem = "right" | "left" | "down" | "diagonal" | "up";

/*
 * The record of `IGLANCESEntryItem`'s site.
 */
type IGLANCESEntryItem = { on: number; away: number };

/*
 * The alternatives of `GLANCESEntryItem`'s site.
 */
type GLANCESEntryItem = "speaking" | "listening";

/*
 * A direction of look away, as `AVERSIONS` names them.
 */
type Aversion = keyof typeof HumanConversation.AVERSIONS;

/*
 * The aversion a uniform draw in [0, 1) picks from the speaker's mix
 * (`AVERSIONS`), by its cumulative shares.
 */
function aversion(u: number): Aversion {
  let sum: number = 0;
  for (const [name, share] of Object.entries(HumanConversation.AVERSIONS) as [
    Aversion,
    number,
  ][]) {
    sum += share;
    if (u < sum) return name;
  }
  return "right";
}

/*
 * A look-away point in the looker's own frame (`x` left, `y` up, `z` forward):
 * the gaze turned by the eyes' share `HumanGaze.EYES` toward the aversion's
 * direction, split evenly between aside and down on a diagonal, at the
 * conversation's distance `AWAY_RANGE`; `side` picks the side of a diagonal (1
 * left, -1 right).
 */
function away(
  eyes: number,
  direction: Aversion,
  side: number,
): IAutoMovieMotionTarget {
  const turn: number = (HumanGaze.EYES * Math.PI) / 180;
  const [left, up]: [number, number] =
    direction === "right"
      ? [-1, 0]
      : direction === "left"
        ? [1, 0]
        : direction === "down"
          ? [0, -1]
          : direction === "up"
            ? [0, 1]
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
/*
 * The record of `IPlanGlancesMean`'s site.
 */
type IPlanGlancesMean = { on: number; away: number };

/*
 * The alternatives of `PlanGlancesRole`'s site.
 */
type PlanGlancesRole = "speaking" | "listening";

/*
 * Apply the shared speaker/listener cadence to each span's selected face.
 */
function planGlances<Turn extends IAutoMovieMotionHumanConversation.ITurn>(
  subject: string,
  turns: readonly Turn[],
  random: IAutoMovieRandom,
  eyes: number,
  partner: (turn: Turn) => string,
  release: boolean = false,
): IAutoMovieMotionHumanGaze.ILayer[] {
  const out: IAutoMovieMotionHumanGaze.ILayer[] = [];
  let draw: number = 0;
  const exponential = (mean: number): number =>
    -mean * Math.log(Math.max(1e-12, 1 - random.float(draw++)));
  for (const turn of turns) {
    // A span must end: its glances are drawn until its end.
    HumanBound.within("turns.to", turn.to, turn.from, Infinity, "s", "both");
    const role: PlanGlancesRole =
      turn.speaker === subject ? "speaking" : "listening";
    const mean: IPlanGlancesMean = HumanConversation.GLANCES[role];
    const face: IAutoMovieMotionTarget = {
      kind: "person",
      subject: partner(turn),
      region: "face",
    };
    let t: number = turn.from;
    let on: boolean = true;
    while (t < turn.to) {
      const target: IAutoMovieMotionTarget = on
        ? face
        : away(
            eyes,
            role === "listening" ? "diagonal" : aversion(random.float(draw++)),
            random.float(draw++) < 0.5 ? 1 : -1,
          );
      const next: number = t + exponential(on ? mean.on : mean.away);

      // If rounding makes a draw shorter than the clock can express,
      // hold the request to the span end to keep its starts strictly ordered.
      const last: boolean = next >= turn.to || next <= t;
      out.push({
        target,
        from: t,
        with: "head",
        ...(release && last ? { to: turn.to } : {}),
      });
      if (last) break;
      t = next;
      on = !on;
    }
  }
  return out;
}

/*
 * How far ahead a look-away point lies, metres: the personal gap people
 * converse at (`HumanProxemics.GAPS.personal`, Hall 1966), the partner's
 * distance, so the eyes keep the vergence they had on the partner's face.
 */
const AWAY_RANGE: number = HumanProxemics.GAPS.personal;
