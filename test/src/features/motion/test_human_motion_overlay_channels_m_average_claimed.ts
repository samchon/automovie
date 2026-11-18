import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanOverlayChannels } from "../internal/motionHumanOverlayChannels";
import { nclose } from "../internal/nclose";

/**
 * A person performs two actions at once on different parts of the body, read
 * on the average man: walking 2 m with and without the `read` task in the
 * right hand over the walk, the claimed arm comes up and is held with the
 * trunk, and a combination no body could perform is refused with both claims
 * named.
 *
 * Scenarios (`motionHumanOverlayChannels` states each with its bound):
 * 1. The reading hand is up and ahead of the chest while the plain walk's
 *    hangs.
 * 2. The reading hand keeps within 3 cm of its distance to the chest.
 * 3. One hand for two tasks, a whole-body action over a walk and a task over
 *    an action that yields nothing are refused as `channel` refusals on `over`.
 * 4. A phone in one hand and a drink in the other plan.
 * 5. An overlay cut at 0 or 0.5 s frees the hand for a carrier starting at 1 s. A cut at 1.5 s leaves a conflict.
 * 6. Either of two same-hand overlays may have zero duration. Positive overlap is refused on the second placement.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the compositions through the public chain and reads displayed joint centres and thrown refusals; an arm left swinging, a hand that drifts from the trunk or a clash that plans fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the reading hand is follows from what holding a sheet up is. The authored cut share times the overlay's two-second plan sets its end, and the authored carrier start determines whether their hand claims overlap.
 * @evidence contracts/development/testing.md#distinguishing-cases The claimed arm, clashes and compatible combinations, including a zero-length cut, a cut before the hand is needed and a cut during a conflict. The other body, the unclaimed channels and the continuity are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Uses the generated average body in the shared overlay suite and in three brief stationary placements. The test runner discovers the exported function.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, its part of the overlay scenarios and their bounds.
 */
export function test_human_motion_overlay_channels_m_average_claimed(): void {
  const complaints: string[] = [];
  motionHumanOverlayChannels.read("m-average", "claimed", complaints);
  TestValidator.equals("an overlay and its carrier", complaints, []);
  checkCutOverlay();
}

/** Isolate channel ownership with stationary laws and authored cut times. */
function checkCutOverlay(): void {
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
          body: motionHumanBody("m-average"),
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
    HumanChain.subject("a").stand({ seconds: 1 });
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
