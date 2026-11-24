import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanRefusal } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { diningScene } from "../../internal/diningScene";

/**
 * A stroke on a plate beyond the seated reach is refused, and the same stroke
 * on the diner's own plate is not: the refusal case of
 * `test_motion_dining_utensils_cut` with its adjacent valid case, on m-average
 * right-handed as the original, entered by the minimal chain sit >
 * pickUp(knife) > write (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The steak 1.3 m ahead of the table's near edge: the write is refused on
 *    `reach`, the original's check.
 * 2. The steak on the diner's plate, 0.08 m ahead: the same chain builds without a
 *    refusal, so the refusal is the reach's and not one any stroke from this
 *    entry draws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, the adjacent case, the entry chain and the body.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through `HumanPerformance` and reads the refusal's kind or its absence; an admitted unreachable plate, a refusal of another kind or a refused reachable plate fails.
 * @evidence contracts/development/testing.md#independent-expectations A seated adult's arm does not reach 1.3 m past the table's edge, and the diner's own plate is the scene's staging of a reachable one; the kind is the refusal contract's `reach`.
 * @evidence contracts/development/testing.md#distinguishing-cases A plate beyond against one within the seated reach, the input that changes being only the steak's place; the saw's goal is `test_motion_dining_cut_write_saw`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_cut_write_refusal`.
 */
export function test_motion_dining_cut_write_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const scene: diningScene.ICut = diningScene.cut("right");
  const stroke: (steak: IAutoMovieVector3) => Refused = (
    steak: IAutoMovieVector3,
  ): Refused =>
    everydayTake.refusal((): unknown =>
      diningScene
        .perform(
          "m-average knife and fork-far",
          body,
          scene.props.map(
            (p: IAutoMovieMotionHumanProp): IAutoMovieMotionHumanProp =>
              p.subject === "steak"
                ? everydayTake.prop(
                    "steak",
                    scene.models.steak!,
                    steak,
                    undefined,
                    true,
                  )
                : p,
          ),
          chain(scene),
        )
        .segments("actor"),
    );
  const far: Refused = stroke(diningTable.on(scene.stage, 0, 1.3));
  checks.check(
    `a plate beyond the seated reach is refused on reach (${far === undefined ? "admitted" : `${far.kind}: ${far.message}`})`,
    far !== undefined && far.kind === "reach",
  );
  const near: Refused = stroke(scene.plate);
  checks.check(
    `the diner's own plate is not refused (${near === undefined ? "admitted" : `${near.kind}: ${near.message}`})`,
    near === undefined,
  );
  checks.assert(
    "a stroke beyond the seated reach is refused, one within it is not",
  );
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/** Sit > pickUp(knife) > a short stroke on the steak's top. */
function chain(scene: diningScene.ICut): IAutoMovieMotionHumanChain {
  return HumanChain.subject("actor")
    .sit({ seat: scene.stage.seat, hold: 1 })
    .pickUp({ prop: "knife", handle: "grip", hand: "right", lift: 0.05 })
    .registered("write", {
      tool: "knife",
      tip: "face",
      on: "steak",
      surface: "top",
      stroke: [
        [0, -0.03],
        [0, 0.03],
      ],
      duration: 0.5,
      hand: "right",
    });
}
