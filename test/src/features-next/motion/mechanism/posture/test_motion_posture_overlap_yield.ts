import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";

/**
 * Concurrent arm tasks can borrow opposite arms on a walk; both cannot own the right arm.
 *
 * Scenarios:
 * 1. Read two placed upper-body tasks on the left and right arms.
 * 2. Move the second task to the occupied right arm and observe the public channel refusal.
 * 3. Cut an overlay at 0, 0.5 or 1.5 s before placing a carrier at 1 s.
 * 4. Back-schedule two same-hand overlays with either duration zero, then with positive overlap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the shared carrier and the single changed ownership input.
 * @evidence contracts/development/testing.md#behavioral-verification Queries actual scheduled overlays and the public channel error.
 * @evidence contracts/development/testing.md#independent-expectations Disjoint arms can be assigned independently. A hand claim spans the authored start and the two-second duration times the cut share, so an empty interval occupies no time.
 * @evidence contracts/development/testing.md#distinguishing-cases Varies the arm, the cut relative to the next carrier, and each overlay duration across zero. The gait overlay test owns displayed continuity.
 * @evidence contracts/development/testing.md#execution-ownership The runner discovers this function, which stages short in-memory compositions on one body.
 */
export function test_motion_posture_overlap_yield(): void {
  const body = motionHumanBody("m-average");
  const make = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "hand-ownership",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .walk({ to: { x: 0, y: 0, z: 3 } })
        .over((part) => part.handToFace({ kind: "phone", hand: "right" }))
        .over((part) => part.handToFace({ kind: "drink", hand: side })).node,
    });
  TestValidator.equals(
    "two distinct arms admit two tasks",
    make("left").overlays("a").length,
    2,
  );
  let error: unknown;
  try {
    make("right").overlays("a");
  } catch (cause) {
    error = cause;
  }
  TestValidator.predicate(
    "two right-arm tasks refuse the overlap",
    error instanceof HumanRefusal &&
      error.kind === "channel" &&
      error.axis === "over",
  );
  checkCutOverlay(body);
}

/** Isolate channel ownership with stationary laws and authored cut times. */
function checkCutOverlay(body: IAutoMovieMotionHumanBody): void {
  const overlay: IAutoMovieMotionHumanActionLaw = {
    name: "testHandOverlay",
    interrupts: {},
    overlay: true,
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 2,
      events: [],
      contacts: [],
      channels: ["rightHand"],
      posture: () => context.entry.posture,
    }),
  };
  const carrier: IAutoMovieMotionHumanActionLaw = {
    name: "testHandCarrier",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      events: [],
      contacts: [],
      yields: ["head"],
      posture: () => context.entry.posture,
    }),
  };

  const perform = (
    composition: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "cut-overlay",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [overlay, carrier],
      cues: {
        hand: [
          { name: "open", seconds: 0 },
          { name: "mark", seconds: 0.5 },
          { name: "take", seconds: 1 },
        ],
      },
      composition: composition.node,
    });

  const stand = (): IAutoMovieMotionHumanChain =>
    HumanChain.subject("a").stand({ hold: 1 });
  const changeCarrier = (share: number): IAutoMovieMotionHumanPerformance =>
    perform(
      stand()
        .over((chain) => chain.registered(overlay.name, {}).until({ share }))
        .registered(carrier.name, {})
        .sync({ of: "hand", event: "take" }),
    );

  for (const end of [0, 0.5]) {
    const film: IAutoMovieMotionHumanPerformance = changeCarrier(end / 2);
    TestValidator.predicate(
      `the hand is free at 1 s after the overlay ends at ${end} s`,
      nclose(film.overlays("a")[0]?.end ?? NaN, end) &&
        nclose(film.segments("a")[1]?.entryTime ?? NaN, 1),
    );
  }

  let refusal: unknown;
  try {
    changeCarrier(0.75);
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "the hand is still occupied when the overlay ends at 1.5 s",
    refusal instanceof HumanRefusal &&
      refusal.kind === "channel" &&
      refusal.axis === "over" &&
      refusal.act === overlay.name,
  );

  const sameHand = (
    first: number,
    second: number,
  ): IAutoMovieMotionHumanPerformance =>
    perform(
      stand().over((chain) =>
        chain
          .registered(overlay.name, {})
          .until({ share: first })
          .sync({ of: "hand", event: "mark" })
          .registered(overlay.name, {})
          .until({ share: second })
          .sync({ of: "hand", event: "open" }),
      ),
    );

  for (const [first, second] of [
    [0, 0.5],
    [0.5, 0],
  ] as const) {
    const film: IAutoMovieMotionHumanPerformance = sameHand(first, second);
    TestValidator.predicate(
      "a zero-span overlay leaves the same hand free for the other overlay",
      nclose(film.overlays("a")[0]?.end ?? NaN, 0.5 + first * 2) &&
        nclose(film.overlays("a")[1]?.end ?? NaN, second * 2),
    );
  }

  refusal = undefined;
  try {
    sameHand(0.5, 0.5);
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "a back-scheduled overlay still conflicts over the shared half-second",
    refusal instanceof HumanRefusal &&
      refusal.kind === "channel" &&
      refusal.axis === "over" &&
      refusal.act === overlay.name &&
      refusal.instance === 2,
  );
}
