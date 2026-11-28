import type {
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { HumanPerformanceLayers } from "../../../../../packages/motions/src/perform/internal/HumanPerformanceLayers";
import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * Placed motions expose only the events in their realized spans.
 *
 * A phased entry starts after a planned reach. It can finish before contact,
 * cut exactly at contact, or play both contacts. The layer clock follows the
 * played contact and can also use an independently authored cue track.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the phased entry, early and exact cuts, repeated contacts and the unaffected film-time track.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the motion instant and layer resolvers with a placed typed segment over a stored body. A read returns film seconds or the refusal's event axis.
 * @evidence contracts/development/testing.md#independent-expectations A plan with time zero 2 and duration 4 puts shares 0.125, 0.5 and 0.75 at 2.5, 4 and 5 seconds. The fixture admits time from 3 through the specified cut, establishing the expected events without reading the resolver.
 */
export async function test_motions_perform_played_cue(): Promise<void> {
  const { state } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const template: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const segment: IAutoMovieMotionHumanSegment = {
    ...template,
    entryTime: 3,
    start: 2,
    end: 6,
    plan: {
      ...template.plan,
      duration: 4,
      events: [
        { name: "reach", share: 0.125 },
        { name: "contact", share: 0.5 },
        { name: "contact", share: 0.75 },
      ],
    },
  };
  const resolve = (
    end: number,
    clipped?: number,
  ): IAutoMovieMotionHumanPerformanceState => ({
    ...state,
    anchors: new Map([["seat", { ...segment, subject: "actor" }]]),
    schedule: {
      duration: 6,
      entries: [{ ...state.schedule.entries[0]!, start: 3, end }],
    },
    clipped:
      clipped === undefined ? new Map() : new Map([[segment.entry, clipped]]),
    cues: { "intended-seat": [{ name: "contact", seconds: 4 }] },
  });
  const full: IAutoMovieMotionHumanPerformanceState = resolve(6);
  const exact: IAutoMovieMotionHumanPerformanceState = resolve(4);
  const early: IAutoMovieMotionHumanPerformanceState = resolve(6, 3.75);
  const contact = (
    self: IAutoMovieMotionHumanPerformanceState,
    index: number,
  ): number =>
    HumanPerformanceLayers.instant(self, {
      of: "seat",
      event: "contact",
      index,
    });

  TestValidator.equals("second played contact", contact(full, 1), 5);
  TestValidator.equals(
    "read first contact after seeking backward",
    contact(full, 0),
    4,
  );
  TestValidator.equals("exactly retained contact", contact(exact, 0), 4);
  TestValidator.error("contact before the admitted entry", () =>
    HumanPerformanceLayers.instant(full, { of: "seat", event: "reach" }),
  );
  TestValidator.error("contact after the exact cut", () => contact(exact, 1));
  let abandoned: boolean = false;
  try {
    contact(early, 0);
  } catch (error: unknown) {
    abandoned =
      error instanceof AutoMovieMotionHumanRefusal &&
      error.axis === "event" &&
      error.feasible?.kind === "alternatives" &&
      !error.feasible.values.includes("contact");
  }
  TestValidator.predicate("an implicit cut abandons the contact", abandoned);

  const layer: IAutoMovieMotionHumanLayer = {
    name: "response",
    apply: (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture,
  };
  const scheduled: IAutoMovieMotionHumanLayer.IScheduled = {
    layer,
    from: { of: "seat", event: "contact" },
    to: 6,
  };
  TestValidator.equals(
    "the layer starts at the played contact",
    HumanPerformanceLayers.window(exact, person, scheduled).from,
    4,
  );
  TestValidator.error("the layer cannot start at the abandoned contact", () =>
    HumanPerformanceLayers.window(early, person, scheduled),
  );
  TestValidator.equals(
    "an authored film cue remains available",
    HumanPerformanceLayers.window(early, person, {
      ...scheduled,
      from: { of: "intended-seat", event: "contact" },
    }).from,
    4,
  );
}
