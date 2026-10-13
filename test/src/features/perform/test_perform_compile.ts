import type { IAutoMovieKeyframe, IAutoMovieActionCall, IAutoMovieMotion } from "@automovie/interface";
import {
  IAutoMovieActionSynthesizer,
  compilePerformance,
} from "@automovie/engine";

import { TestValidator } from "@nestia/e2e";

import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/** A gesture action: the only verb shape these scenarios need. */
const gesture: (actor: string | string [ ], start: number, repeat?: number) => IAutoMovieActionCall = (
  actor: string | string[],
  start: number,
  repeat?: number,
): IAutoMovieActionCall => ({
  verb: "gesture",
  kind: "wave",
  actor,
  start,
  duration: 1,
  ...(repeat !== undefined ? { repeat } : {}),
});

/** A one-cycle base clip (duration 1), or `null` for the actor named `"skip"`. */
const synth: IAutoMovieActionSynthesizer = (
  _action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null =>
  actor === "skip"
    ? null
    : makeMotion(
        [
          keyframe(0, makePose([joint("spine", { flexion: 0 })])),
          keyframe(1, makePose([joint("spine", { flexion: 20 })])),
        ],
        1,
      );

const times: (m: IAutoMovieMotion) => number [ ] = (m: IAutoMovieMotion): number[] => m.keyframes.map((k: IAutoMovieKeyframe) : number => k.time);

/**
 * `compilePerformance`: the action builder's timeline assembly (the content
 * seam is faked here; rig-specific clips are exercised elsewhere).
 *
 * Scenarios:
 *
 * 1. Empty action list → no performances.
 * 2. A single actor's one action becomes its performance clip, placed at its start
 *    with the synthesised keyframes.
 * 3. Unison (`actor: string[]`) fans the same verb onto each actor's own timeline;
 *    a `null` synthesis (actor `"skip"`) is dropped.
 * 4. `repeat > 1` concatenates the base cycle N times (duration ×N); `repeat` of 1
 *    or undefined leaves a single cycle.
 * 5. Two actions for one actor with a gap arrange into one clip, holding the first
 *    pose across the gap.
 * 6. Prototype-spelled actor ids remain own enumerable performance keys.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compilePerformance with an injected content callback and observes actual actor clips, placement/repeat times and null omission; prototype-spelled ids catch assignment through inherited setters.
 * @evidence contracts/testing.md#independent-expectations One-second authored cycles independently imply endpoint times, repeat durations and gap holds; actor identifiers must retain exact string identity and own-key storage cannot change the ordinary result prototype.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/single/unison actions, null synthesis, omitted/one/two repeats, held gaps and __proto__/constructor/toString actor keys; concurrent envelopes and region-loss behavior remain in owning layer/masked-content tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_perform_compile function is a synchronous portable unit test of the compiler's injected content seam; no foreign method is replaced, asset consumer installed or real render/native host started.
 */
export function test_perform_compile(): void {
  // 1. empty
  const empty: Record<string, IAutoMovieMotion> = compilePerformance([], synth).performances;
  TestValidator.equals("empty → no actors", Object.keys(empty).length, 0);

  // 2. single actor, single action at a start offset
  const one: Record<string, IAutoMovieMotion> = compilePerformance([gesture("a", 0)], synth).performances;
  TestValidator.equals("one actor compiled", Object.keys(one), ["a"]);
  TestValidator.equals(
    "performance id names the actor",
    one.a!.id,
    "perform:a",
  );
  TestValidator.predicate("single cycle spans 1s", nclose(one.a!.duration, 1));
  TestValidator.predicate(
    "placed cycle times 0,1",
    times(one.a!).every((t: number, i: number) : boolean => nclose(t, [0, 1][i]!)),
  );

  // 3. unison + a skipped actor
  const unison: Record<string, IAutoMovieMotion> = compilePerformance(
    [gesture(["a", "b", "skip"], 0)],
    synth,
  ).performances;
  TestValidator.equals(
    "unison fans to the non-skipped actors",
    Object.keys(unison).sort((a: string, b: string) : number => a.localeCompare(b)),
    ["a", "b"],
  );
  TestValidator.equals(
    "skipped actor produces no performance",
    unison.skip,
    undefined,
  );

  // 4. repeat: >1 concatenates, =1 and undefined stay single
  const repeated: IAutoMovieMotion = compilePerformance([gesture("r", 0, 2)], synth).performances
    .r!;
  TestValidator.predicate(
    "repeat 2 doubles the duration",
    nclose(repeated.duration, 2),
  );
  TestValidator.predicate(
    "repeat 2 → times 0,1,2 (seam dropped)",
    times(repeated).every((t: number, i: number) : boolean => nclose(t, [0, 1, 2][i]!)),
  );
  const once: IAutoMovieMotion = compilePerformance([gesture("o", 0, 1)], synth).performances.o!;
  TestValidator.predicate(
    "explicit repeat 1 stays a single cycle",
    nclose(once.duration, 1),
  );

  // 5. two actions, same actor, with a gap → arranged, hold across the gap
  const gapped: IAutoMovieMotion = compilePerformance([gesture("g", 0), gesture("g", 2)], synth)
    .performances.g!;
  TestValidator.predicate(
    "two clips + gap → times 0,1,2,3",
    times(gapped).every((t: number, i: number) : boolean => nclose(t, [0, 1, 2, 3][i]!)),
  );
  TestValidator.predicate(
    "gapped duration is the last placement end",
    nclose(gapped.duration, 3),
  );
  const reserved: Record<string, IAutoMovieMotion> = compilePerformance([gesture(["__proto__", "constructor", "toString"], 0)], synth).performances;
  TestValidator.equals("all exact actor names remain own keys", Object.keys(reserved), ["__proto__", "constructor", "toString"]);
  TestValidator.equals("performance record keeps its ordinary prototype", Object.getPrototypeOf(reserved), Object.prototype);
  for (const actor of ["__proto__", "constructor", "toString"]) {
    TestValidator.predicate(`actor ${actor} has an own clip`, Object.hasOwn(reserved, actor));
    TestValidator.equals(`actor ${actor} keeps its identity`, reserved[actor]!.id, `perform:${actor}`);
  }
}
