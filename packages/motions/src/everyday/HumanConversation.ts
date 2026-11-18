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
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed partner, seeded input, eye height in metres and request order.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the documented role cadence to the same partner on every turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Supplies fixed-partner selection to the shared glance planner with the original duration check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses film seconds and the shared documented means for every participant.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in spans and emitted requests with no per-turn index.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares cadence and aversion between dyadic and group planning.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned requests outlive the call.
   */
  export function gaze(
    subject: string,
    partner: string,
    turns: readonly IAutoMovieMotionHumanConversation.ITurn[],
    random: IAutoMovieRandom,
    eyes: number,
  ): IAutoMovieMotionHumanGaze.ILayer[] {
    return glances(
      subject,
      turns,
      random,
      eyes,
      (turn: IAutoMovieMotionHumanConversation.ITurn): string => {
        HumanBound.above("turns.to", turn.to, turn.from, "s");
        return partner;
      },
    );
  }

  /**
   * Plan a participant's gaze from authored turns in a group conversation.
   *
   * At each turn start the listeners look toward the speaker and the speaker
   * looks toward the authored addressee. Auer (2018, doi:10.1075/ais.10.09aue)
   * observed speakers selecting addressees with gaze in three-party
   * interaction. Holler and Kendrick (2015, doi:10.3389/fpsyg.2015.00098)
   * observed unaddressed listeners shifting to the incoming speaker in
   * questions and replies. Here each change starts on the authored boundary.
   * Consecutive spans with one speaker can redirect their address.
   *
   * @param subject The participant whose gaze is being authored.
   * @param participants Distinct nonempty subject IDs, including silent listeners.
   * @param turns Ordered, non-overlapping speaking spans in film seconds.
   * @param random The participant's seeded stream.
   * @param eyes Eye height in metres in the performer's frame.
   * @returns Requests for HumanGaze.layer. The last request of each span releases at its end.
   * @throws When a subject, span, or eye height falls outside the stated bounds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the studied gaze roles, authored timing, units, and consuming gaze layer.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the current speaker or authored addressee by role and uses the existing dyadic cadence provisionally for group glances.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates the roster and spans before delegating cadence to the shared glance planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses scripted boundaries and person targets for every participant. The sources do not set a fixed anticipatory offset for general dialogue.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in participant IDs, spans and emitted requests, with a temporary roster set and the output array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the seeded glance planner and the existing gaze layer. Each request sequence depends on its input spans and stream.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned requests outlive the call.
   */
  export function groupGaze(
    subject: string,
    participants: readonly string[],
    turns: readonly IAutoMovieMotionHumanConversation.IGroupTurn[],
    random: IAutoMovieRandom,
    eyes: number,
  ): IAutoMovieMotionHumanGaze.ILayer[] {
    const roster: Set<string> = new Set(participants);
    if (roster.size !== participants.length || roster.has(""))
      throw new RangeError(
        "conversation participants must be distinct, nonempty subject IDs",
      );
    if (!roster.has(subject))
      throw new RangeError(
        `conversation subject ${subject} is outside the participant roster`,
      );
    HumanBound.above("eyes", eyes, 0, "m");

    let previousEnd: number = 0;
    for (const turn of turns) {
      if (!roster.has(turn.speaker) || !roster.has(turn.addressee))
        throw new RangeError(
          "conversation speaker and addressee must belong to the participant roster",
        );
      if (turn.speaker === turn.addressee)
        throw new RangeError("conversation speaker and addressee must differ");
      HumanBound.least("turns.from", turn.from, previousEnd, "s");
      previousEnd = HumanBound.above("turns.to", turn.to, turn.from, "s");
    }

    return glances(
      subject,
      turns,
      random,
      eyes,
      (turn: IAutoMovieMotionHumanConversation.IGroupTurn): string =>
        turn.speaker === subject ? turn.addressee : turn.speaker,
      true,
    );
  }

  /**
   * The share of a film span in which the requests target a person's face.
   * A request ends at its release or the next request, whichever comes first.
   * This measures authored attention without modeling the layer's physical blend.
   *
   * @param requests Gaze requests in chronological order.
   * @param from Span start, film seconds.
   * @param to Span end, film seconds, greater than from.
   * @returns The share in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the attention interval and the film time measured.
   * @evidence contracts/development/implementation.md#principled-implementation Intersects each person request's effective range with the measurement span, using the same latest-request precedence as the gaze layer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass accumulates durations before normalization.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Measures authored times directly and counts no pose-derived value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in requests with constant auxiliary space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The scalar depends on all intersected requests and the queried span.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The query retains no state.
   */
  export function share(
    requests: readonly IAutoMovieMotionHumanGaze.ILayer[],
    from: number,
    to: number,
  ): number {
    let on: number = 0;
    requests.forEach((r: IAutoMovieMotionHumanGaze.ILayer, i: number): void => {
      const a: number = Math.max(from, r.from);
      const b: number = Math.min(to, r.to ?? to, requests[i + 1]?.from ?? to);
      if (b > a && r.target.kind === "person") on += b - a;
    });
    return on / (to - from);
  }
}

/** A look-away point 2 m out, 25 degrees to a side of the looker's heading and 10 degrees below the eyes, in the looker's own frame. */
function away(eyes: number, side: number): IAutoMovieMotionTarget {
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

/** Apply the shared speaker/listener cadence to each span's selected face. */
function glances<Turn extends IAutoMovieMotionHumanConversation.ITurn>(
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
    const role: "speaking" | "listening" =
      turn.speaker === subject ? "speaking" : "listening";
    const mean: { on: number; away: number } = HumanConversation.GLANCES[role];
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
        : away(eyes, random.float(draw++) < 0.5 ? 1 : -1);
      const next: number = t + exponential(on ? mean.on : mean.away);

      // If rounding makes a group draw shorter than the clock can express,
      // hold the request to the span end to keep its starts strictly ordered.
      const last: boolean = next >= turn.to || (release && next <= t);
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
