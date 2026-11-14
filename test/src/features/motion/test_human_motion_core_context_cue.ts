import type { resolveAutoMovieSchedule } from "@automovie/engine";
import {
  HumanChain,
  HumanCue,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A law reads one of the film's cue tracks while it plans: the named
 * instants of a score or of a line, in film seconds, so it can place its
 * own beats on them.
 *
 * The law is a registered one that stands and reads a track through
 * `context.cue`; what it read is kept by the test.
 *
 * Scenarios, on the average man, in a performance given a score of four
 * beats at 120 beats a minute from 0.5 s in common time and a hand-written
 * track of two instants:
 * 1. The score reads as a downbeat and a beat at 0.5 s, then beats at 1,
 *    1.5 and 2 s: half a second apart at 120 beats a minute, the first of a
 *    bar a downbeat.
 * 2. The hand-written track reads as it was written, names and seconds.
 * 3. A track the performance was not given is refused as a `participant`
 *    refusal that names the track, lists the two that exist and is located
 *    at the performer and the action.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers a law through the public input, performs it and compares what its context returned; a reader that returns another track, an action's own events or nothing fails, as does an unknown track that is not refused.
 * @evidence contracts/development/testing.md#independent-expectations The beats' seconds follow from the tempo, 60 / 120 s apart from the first; the hand-written track is its own expectation; the refusal's members follow from what the track's name is.
 * @evidence contracts/development/testing.md#distinguishing-cases A generated track, a hand-written one and a missing one. Syncing an action's start to a cue is `test_human_motion_sync_cues`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and plans three half-second stands; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how the law reads and the 3 scenarios.
 */
export function test_human_motion_core_context_cue(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const written: readonly resolveAutoMovieSchedule.ICue[] = [
    { name: "doorSlam", seconds: 0.8 },
    { name: "thunder", seconds: 1.7 },
  ];
  const read = (track: string): readonly resolveAutoMovieSchedule.ICue[] => {
    let seen: readonly resolveAutoMovieSchedule.ICue[] = [];
    const listen: IHumanActionLaw<stand.IParams> = {
      ...stand,
      name: "listen",
      plan: (context: IHumanActionContext<stand.IParams>): IHumanActionPlan => {
        seen = context.cue(track);
        return stand.plan(context);
      },
    };
    new HumanPerformance({
      seed: "cue",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [listen],
      cues: {
        score: HumanCue.beats({ bpm: 120, from: 0.5, count: 4 }),
        sounds: written,
      },
      composition: HumanChain.subject("a").registered("listen", {
        seconds: 0.5,
      }).node,
    });
    return seen;
  };
  const plain = (
    cues: readonly resolveAutoMovieSchedule.ICue[],
  ): [string, number][] =>
    cues.map((cue: resolveAutoMovieSchedule.ICue): [string, number] => [
      cue.name,
      Number(cue.seconds.toFixed(9)),
    ]);

  // 1. A score's beats.
  TestValidator.equals("a law reads the score's beats", plain(read("score")), [
    ["downbeat", 0.5],
    ["beat", 0.5],
    ["beat", 1],
    ["beat", 1.5],
    ["beat", 2],
  ]);

  // 2. A hand-written track.
  TestValidator.equals(
    "a law reads a hand-written track",
    plain(read("sounds")),
    plain(written),
  );

  // 3. A track that is not there.
  let thrown: unknown = null;
  try {
    read("dialogue");
  } catch (error) {
    thrown = error;
  }
  TestValidator.equals(
    `a missing track is refused${thrown instanceof Error ? ` (${thrown.message})` : ""}`,
    thrown instanceof HumanRefusal
      ? [
          thrown.kind,
          thrown.value,
          thrown.feasible?.kind === "alternatives"
            ? [...thrown.feasible.values].sort((x: string, y: string): number =>
                x.localeCompare(y),
              )
            : null,
          thrown.performer,
          thrown.act,
        ]
      : "no refusal",
    ["participant", "dialogue", ["score", "sounds"], "a", "listen"],
  );
}
