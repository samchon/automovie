import type {
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieScheduleCue,
} from "@automovie/interface";
import {
  HumanPerformanceLayers
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceLayers";
import {
  HumanPerformancePlaceTiming
} from "../../../../../packages/motions/src/perform/internal/HumanPerformancePlaceTiming";
import { TestValidator } from "@nestia/e2e";

/** A 4 s plan with its contact at 3 s and events at a quarter, half and end. */
const PLAN: Pick<
  IAutoMovieMotionHumanActionPlan,
  "duration" | "contact" | "events"
> = {
  duration: 4,
  contact: 3,
  events: [
    { name: "a", share: 0.25 },
    { name: "b", share: 0.5 },
    { name: "c", share: 1 },
  ],
};

/** A cue track's names and seconds. */
const listed = (cues: readonly IAutoMovieScheduleCue[]): string =>
  cues
    .map((cue: IAutoMovieScheduleCue): string => `${cue.name}@${cue.seconds}`)
    .join(" ");

/**
 * The schedule's readings of a placed action and a layer:
 * `HumanPerformancePlaceTiming` is the part of a plan left after the share it
 * enters at, with its contact and its later events rescaled onto that part;
 * `HumanPerformanceLayers.instants` names a layer window's onset, full, offset
 * and end, its fade no more than half the window.
 *
 * Scenarios:
 *
 * 1. Entered half way, the plan's 2 s left hold its contact at 1 s, its event at a
 *    half at the start and its end's at the end; the quarter's is gone.
 * 2. Entered past the contact, no contact is left; entered at the end, the end's
 *    event falls at the start of nothing.
 * 3. A window from 1 to 3 s fading 0.5 s is full at 1.5 s and leaves at 2.5 s; a 5
 *    s fade is held to half the window; with none asked the overlay's 0.2 s
 *    fade is used.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The placement cases cover partial entry, expired contact, the zero-length endpoint, and ordinary, capped and default layer fades.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the timing owner with a typed resident plan and three entry shares, then calls layer instants for different fade inputs. It checks the returned duration, contact, retained events and exact named instants.
 * @evidence contracts/development/testing.md#independent-expectations Entering a four-second plan halfway leaves two seconds and moves its three-second contact to one second after entry. At full entry share the end event rebases to share zero. A half-second fade yields full at 1.5 s and offset at 2.5 s in a [1, 3] s window.
 */
export function test_motions_perform_place_timing(): void {
  TestValidator.equals(
    "entered half way",
    HumanPerformancePlaceTiming(PLAN, 0.5),
    {
      duration: 2,
      contact: 1,
      events: [
        { name: "b", share: 0 },
        { name: "c", share: 1 },
      ],
    } satisfies IAutoMovieIntentTiming,
  );
  const late: IAutoMovieIntentTiming = HumanPerformancePlaceTiming(PLAN, 0.8);
  const ended: IAutoMovieIntentTiming = HumanPerformancePlaceTiming(PLAN, 1);
  TestValidator.predicate(
    "entered late",
    late.contact === undefined &&
      ended.duration === 0 &&
      ended.events!.length === 1 &&
      ended.events![0]!.share === 0,
  );
  TestValidator.equals(
    "a layer's instants",
    [
      listed(HumanPerformanceLayers.instants(1, 3, 0.5)),
      listed(HumanPerformanceLayers.instants(1, 3, 5)),
      listed(HumanPerformanceLayers.instants(1, 3, undefined)),
    ],
    [
      "onset@1 full@1.5 offset@2.5 end@3",
      "onset@1 full@2 offset@2 end@3",
      "onset@1 full@1.2 offset@2.8 end@3",
    ],
  );
}
