import { createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarry,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanVerdicts } from "@automovie/motions";
import { AutoMovieMotionManner } from "@automovie/motions/internal";

import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { motionHumanLaw } from "../../../internal/motionHumanLaw";

/**
 * A one-handed carry preserves its hand attachment across a gait support change
 * while the planted foot stays put.
 *
 * Scenarios:
 *
 * 1. Observe the original left-sided weary carry's published skate verdict on the
 *    average body.
 * 2. Pick up a mug before the same carry and inspect its wrist-relative transform
 *    on both sides of a support change.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A one-handed carry preserves its hand attachment across a gait support change while the planted foot stays put.
 * @evidence contracts/development/testing.md#independent-expectations A planted toe may move at most the original 50 mm skate allowance; a rigid hand attachment preserves its local translation to 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Observe the original left-sided weary carry's published skate verdict on the average body. Pick up a mug before the same carry and inspect its wrist-relative transform on both sides of a support change.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_hold_on_step(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const params: IAutoMovieMotionHumanCarry.IParams = {
    to: { x: 0, y: 0, z: 2.5 },
    load: 0.15,
    kind: "oneHand",
    hand: "left",
    manner: AutoMovieMotionManner.PRESETS.weary,
  };
  const actor: IAutoMovieMotionHumanChain = HumanChain.subject("a");
  const plain: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "recompose-travel",
    [{ subject: "a", body }],
    actor.carry(params),
  );
  const all: motionComplaints.IGatherer = motionComplaints();
  const verdict: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts(
    plain.performance,
  );
  all.check(HumanVerdicts.describe(verdict), verdict.clean);
  const mug: IAutoMovieMotionHumanProp = HumanObject.prop(
    "mug",
    createDrinkware({ kind: "mug" }),
    {
      at: {
        x: body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    },
  );
  try {
    const held: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "recompose-travel",
      [{ subject: "a", body }],
      HumanChain.subject("a")
        .pickUp({ prop: "mug", handle: "handle", hand: "left" })
        .carry(params),
      [mug],
    );
    const span: IAutoMovieMotionHumanSegment =
      held.performance.segments("a")[1]!;
    const plant: OptionalContact = span.plan.contacts.find(
      (w) =>
        w.support.kind === "ground" &&
        w.kind === "plant" &&
        w.from > 0 &&
        w.from < 1,
    );
    if (plant === undefined)
      throw new Error("the carry declared no support exchange");
    const time: number = span.start + plant.from * span.plan.duration;
    const step: number = Math.min(1 / 24, time - span.start, span.end - time);
    const inHand = (t: number): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = held.bones("a", t).get("leftHand")!;
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(
          held.performance.prop("mug", t).position,
          hand.worldPosition,
        ),
      );
    };
    all.check(
      "the supported mug stays with the left hand through the support exchange",
      Vector3.distance(inHand(time - step), inHand(time + step)) <= 0.001,
    );
  } catch (error: unknown) {
    all.check(`loaded public hand attachment: ${String(error)}`, false);
  }
  all.assert("a step carries the load through the change of support");
}

/** A support interval when the gait declares one. */
type OptionalContact = IAutoMovieMotionHumanContactWindow | undefined;
