import type {
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  HumanPerformanceLayers,
  HumanRefusal,
  HumanSegment,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * How far a placed instant may stand from its closed form, seconds: a share of
 * a duration plus an offset, far above their rounding.
 */
const INSTANT: number = 1e-12;

/**
 * `HumanPerformanceLayers.instant` resolves a scheduled instant: a second as
 * given, a cue track's or a placed layer's named instant, or an anchored
 * action's start, event or end; `window` places a scheduled layer between two
 * instants, refusing an empty window, a channel an action holds there, and an
 * anchor an action already has.
 *
 * A `wave` anchored action enters at 1 s from its zero at 0.8 s, lasts 2 s,
 * peaks at half of it and ends at 2.6 s; a `drums` track beats at 1 and 2 s; a
 * `sway` layer already placed is in from 4 s, and a `later` layer waits.
 *
 * Scenarios:
 *
 * 1. A number is its own second.
 * 2. `drums` beat 1 offset by 0.5 is 2.5 s; beat 0 is 1 s; `sway`'s `full` is its
 *    instant.
 * 3. `wave` alone is its entry plus the offset; its `start` 1 s, `peak` 1.8 s and
 *    `end` 2.6 s, or the clipped end where its entry was cut.
 * 4. Refused: an unknown name, offering the anchors, tracks and placed layers; a
 *    waiting layer; a missing event; an index past a repeated event.
 * 5. `window` places a layer from 1 to 3 s with its fade, publishes an anchored
 *    layer's instants, runs a missing window over the whole film, caps the fade
 *    at half the window and builds a layer the window makes.
 * 6. `window` refuses an empty window, a layer writing the right arm while an
 *    action grips with the right hand there, and an anchor an action has; a
 *    grip outside the window is no conflict.
 */
export async function test_motions_perform_layers(): Promise<void> {
  const { state } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const template: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const wave: IAutoMovieMotionHumanSegment & { subject: string } = {
    ...template,
    subject: "actor",
    entry: 99,
    entryTime: 1,
    start: 0.8,
    end: 2.6,
    plan: {
      ...template.plan,
      duration: 2,
      events: [{ name: "peak", share: 0.5 }],
    },
  };
  const self: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    anchors: new Map([["wave", wave]]),
    cues: {
      drums: [
        { name: "beat", seconds: 1 },
        { name: "beat", seconds: 2 },
      ],
    },
    layered: new Map([
      ["sway", HumanPerformanceLayers.instants(4, 6, 0.5)],
      ["later", []],
    ]),
    clipped: new Map(),
  };
  const at = (
    instant: Parameters<typeof HumanPerformanceLayers.instant>[1],
    within: IAutoMovieMotionHumanPerformanceState = self,
  ): number => HumanPerformanceLayers.instant(within, instant);

  // 1. A number.
  TestValidator.equals("a second", at(1.25), 1.25);

  // 2. Tracks.
  TestValidator.predicate(
    "track instants",
    near(at({ of: "drums", event: "beat", index: 1, offset: 0.5 }), 2.5) &&
      near(at({ of: "drums", event: "beat" }), 1) &&
      near(at({ of: "sway", event: "full" }), 4.5),
  );

  // 3. An anchored action.
  const cut: IAutoMovieMotionHumanPerformanceState = {
    ...self,
    anchors: new Map([["wave", { ...wave, entry: 0 }]]),
    clipped: new Map([[0, 2.2]]),
  };
  TestValidator.predicate(
    "an anchored action's instants",
    near(at({ of: "wave", offset: 0.1 }), 1.1) &&
      near(at({ of: "wave", event: "start" }), 1) &&
      near(at({ of: "wave", event: "peak" }), 1.8) &&
      near(at({ of: "wave", event: "end" }), 2.6) &&
      near(at({ of: "wave", event: "end" }, cut), 2.2),
  );

  // 4. Refusals.
  TestValidator.predicate(
    "refused instants",
    refused(
      () => at({ of: "bell" }),
      (error: HumanRefusal): boolean =>
        error.axis === "of" &&
        error.kind === "participant" &&
        error.feasible?.kind === "alternatives" &&
        error.feasible.values.join() === "wave,drums,sway",
    ) &&
      refused(
        () => at({ of: "later" }),
        (error: HumanRefusal): boolean =>
          error.axis === "of" && error.reason.includes("not placed yet"),
      ) &&
      refused(
        () => at({ of: "wave", event: "bow" }),
        (error: HumanRefusal): boolean =>
          error.axis === "event" &&
          error.feasible?.kind === "alternatives" &&
          error.feasible.values.join() === "start,peak,end",
      ) &&
      refused(
        () => at({ of: "drums", event: "beat", index: 5 }),
        (error: HumanRefusal): boolean =>
          error.axis === "event" && error.value === "beat (index 5)",
      ),
  );

  // 5. Windows.
  const sway: IAutoMovieMotionHumanLayer = {
    name: "sway",
    channels: ["trunk"],
    apply: (posture: IAutoMovieMotionHumanPosture) => posture,
  };
  const free: IAutoMovieMotionHumanSegment.IPerson = {
    ...person,
    segments: [],
  };
  const fresh: IAutoMovieMotionHumanPerformanceState = {
    ...self,
    layered: new Map(),
  };
  const placed = HumanPerformanceLayers.window(fresh, free, {
    layer: sway,
    from: 1,
    to: 3,
    fade: 0.5,
    anchor: "swayed",
  });
  const whole = HumanPerformanceLayers.window(fresh, free, {
    layer: (window: IAutoMovieMotionHumanLayer.IWindow) => ({
      ...sway,
      name: `sway ${window.from}-${window.to}`,
    }),
    fade: 100,
  });
  const fallback = HumanPerformanceLayers.window(fresh, free, {
    layer: sway,
    from: 1,
    to: 1 + 4 * HumanSegment.FADE,
  });
  TestValidator.predicate(
    "placed windows",
    placed.from === 1 &&
      placed.to === 3 &&
      placed.fade === 0.5 &&
      placed.layer === sway &&
      JSON.stringify(fresh.layered.get("swayed")) ===
        JSON.stringify(HumanPerformanceLayers.instants(1, 3, 0.5)) &&
      whole.from === 0 &&
      whole.to === self.schedule.duration &&
      near(whole.fade, self.schedule.duration / 2) &&
      whole.layer.name === `sway 0-${self.schedule.duration}` &&
      near(fallback.fade, HumanSegment.FADE),
  );

  // 6. Window refusals.
  const gripping: IAutoMovieMotionHumanSegment.IPerson = {
    ...person,
    segments: [
      {
        ...template,
        entryTime: 0,
        start: 0,
        end: 2,
        plan: {
          ...template.plan,
          duration: 2,
          contacts: [
            {
              part: "rightHand",
              kind: "grip",
              from: 0.5,
              to: 0.75,
              support: { kind: "prop", subject: "cup" },
            },
          ],
        },
      },
    ],
  };
  const arm: IAutoMovieMotionHumanLayer = { ...sway, channels: ["rightArm"] };
  TestValidator.predicate(
    "refused windows",
    refused(
      () =>
        HumanPerformanceLayers.window(fresh, free, {
          layer: sway,
          from: 2,
          to: 2,
        }),
      (error: HumanRefusal): boolean =>
        error.axis === "layers" && error.kind === "parameter",
    ) &&
      refused(
        () =>
          HumanPerformanceLayers.window(fresh, gripping, {
            layer: arm,
            from: 0,
            to: 1.2,
          }),
        (error: HumanRefusal): boolean =>
          error.kind === "channel" && error.performer === "actor",
      ) &&
      refused(
        () =>
          HumanPerformanceLayers.window(fresh, free, {
            layer: sway,
            from: 0,
            to: 1,
            anchor: "wave",
          }),
        (error: HumanRefusal): boolean =>
          error.axis === "layers" && error.value === "wave",
      ) &&
      HumanPerformanceLayers.window(fresh, gripping, {
        layer: arm,
        from: 1.5,
        to: 3,
      }).from === 1.5 &&
      HumanPerformanceLayers.window(fresh, gripping, {
        layer: sway,
        from: 0,
        to: 3,
      }).to === 3,
  );
}

/** Whether a second is the expected one. */
function near(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= INSTANT;
}

/** Whether a task throws a refusal the check accepts. */
function refused(
  task: () => unknown,
  check: (error: HumanRefusal) => boolean,
): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof HumanRefusal && check(error);
  }
}
