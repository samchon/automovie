import { createBag, createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { motionHumanLaw } from "../../internal/motionHumanLaw";

/**
 * A grip selected while planning a pickup must be one of the grip transforms
 * considered by the following action. Read the captured transform on entry.
 *
 * Scenarios:
 * 1. Observe the candidate attachment frames for a mug with a named use.
 * 2. Match the selected attachment against one entire candidate on entry to the next action.
 * 3. An undeclared working point is refused on use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the prospective and actual closure frames and their observation times.
 * @evidence contracts/development/testing.md#behavioral-verification Picks up a mug by its handle for drinking, records the candidate grip frames and compares the chosen attachment on entry to the next action.
 * @evidence contracts/development/testing.md#independent-expectations Public demand and entry observations must agree on one rigid transform within one micrometre and 0.001 degree, both inside the grip accuracy allowance. Quaternion sign is immaterial.
 * @evidence contracts/development/testing.md#distinguishing-cases The object starts free and finishes held. The handover test owns the transfer between two attached hands.
 * @evidence contracts/development/testing.md#execution-ownership Builds one in-memory performance with one real pickup and a local action observing its entry.
 */
export function test_motion_prehension_grasp_for_use(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const admissions: string[] = checkSupportEntries(body);
  const candidates: IAutoMovieRigidTransform[] = [];
  const points: IAutoMovieMotionHumanStrikingHeld.IPoints = { tip: "lip" };
  const actual: IAutoMovieRigidTransform[] = [];
  const observe: IAutoMovieMotionHumanActionLaw<
    Pick<IAutoMovieMotionHumanPickUp.IParams, "prop">
  > = {
    name: "inspectClosure",
    interrupts: {},
    demands: (
      ahead: IAutoMovieMotionHumanActionLaw.IAhead<
        Pick<IAutoMovieMotionHumanPickUp.IParams, "prop">
      >,
    ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] => {
      candidates.push(ahead.grip.tool(points).held!.frame);
      return [];
    },
    plan: (
      context: IAutoMovieMotionHumanActionContext<
        Pick<IAutoMovieMotionHumanPickUp.IParams, "prop">
      >,
    ): IAutoMovieMotionHumanActionPlan => {
      actual.push(
        AutoMovieMotionHumanStrike.StrikingHeld(
          context,
          "right",
          context.params.prop,
          points,
        ).held!.frame,
      );
      return AutoMovieMotionHumanStance.stand.plan({
        ...context,
        params: { hold: 0.1 },
      });
    },
  };
  const pick = (tip: string, lift: number = 0.1): HumanPerformance =>
    new HumanPerformance({
      seed: "grasp",
      laws: [observe],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("spare", createDrinkware({ kind: "glass" }), {
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
        }),
        HumanObject.prop("mug", createDrinkware({ kind: "mug" }), {
          at: {
            x: -body.measure.shoulderHalfWidth,
            y: body.measure.waistHeight,
            z: 0.6 * (body.measure.upperArm + body.measure.forearm),
          },
          yaw: 0,
        }),
      ],
      composition: HumanChain.subject("a")
        .pickUp({
          prop: "mug",
          handle: "handle",
          lift,
          use: { tip, line: "square" },
        })
        .registered("inspectClosure", { prop: "mug" }).node,
    });
  const lifted: HumanPerformance = pick("lip");
  const segment = lifted.segments("a")[0]!;
  const event = segment.plan.events.find((e) => e.name === "lifted")!;
  const liftAt: number = segment.start + event.share * segment.plan.duration;
  const height: number =
    lifted.prop("mug", liftAt).position.y - lifted.prop("mug", 0).position.y;
  TestValidator.predicate(
    "the authored lift reaches 100 mm within the 10 mm skin allowance",
    height >= 0.09,
  );
  const closed = segment.plan.events.find((e) => e.name === "gripClosed")!;
  const closeTime = segment.start + closed.share * segment.plan.duration;
  const occupiedAt = lifted.prop("mug", 0).position;
  const spareAt = lifted.prop("spare", 0).position;
  TestValidator.predicate(
    "the unowned mug waits for its grip",
    Vector3.distance(occupiedAt, lifted.prop("mug", closeTime / 2).position) <=
      0.001,
  );
  TestValidator.predicate(
    "taking one object leaves its neighbour where it was",
    Vector3.distance(spareAt, lifted.prop("spare", lifted.duration).position) <=
      0.001,
  );
  let overshoot: unknown;
  try {
    pick("lip", 1.2);
  } catch (error) {
    overshoot = error;
  }
  TestValidator.predicate(
    "an impossible lift identifies its height and a smaller alternative: " +
      String(overshoot),
    overshoot instanceof HumanRefusal &&
      overshoot.kind === "reach" &&
      overshoot.axis === "lift" &&
      /lift it less/.test(overshoot.fix ?? ""),
  );
  let failure: unknown;
  try {
    pick("undeclared-affordance");
  } catch (error: unknown) {
    failure = error;
  }
  TestValidator.predicate(
    "an undeclared working point is refused on use",
    failure instanceof HumanRefusal && failure.axis === "use",
  );
  TestValidator.predicate(
    "the following action observed the captured grip",
    actual.length > 0,
  );
  for (const captured of actual) {
    const matched: boolean = candidates.some(
      (candidate: IAutoMovieRigidTransform): boolean => {
        const distance: number = Vector3.length(
          Vector3.subtract(candidate.position, captured.position),
        );
        const relative: ReturnType<typeof Quaternion.multiply> =
          Quaternion.multiply(
            Quaternion.inverse(candidate.rotation),
            captured.rotation,
          );
        return (
          distance <= 1e-6 && Math.abs(relative.w) >= Math.cos(Math.PI / 360000)
        );
      },
    );
    TestValidator.predicate(
      "the same candidate supplies position and rotation",
      matched,
    );
  }
  TestValidator.equals("grasp support branches", admissions, []);
}

/** Measure the external lift and the support retained for a seated, lowered or stepping entry. */
function checkSupportEntries(body: IAutoMovieMotionHumanBody): string[] {
  const issues: string[] = [];
  const actor = HumanChain.subject("a");
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: AutoMovieMotionHumanSeat.seated.popliteal(body), z: -0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const glass = createDrinkware({ kind: "glass" });
  const tote = createBag({ kind: "tote" });
  const arm = body.measure.upperArm + body.measure.forearm;
  const socket = Vector3.length(HumanHand.offset(body, "right", "grip").point);
  const stages = ["seated", "step", "floor"] as const;
  for (const branch of stages) {
    const entry: IAutoMovieMotionHumanChain =
      branch === "seated"
        ? actor.sit({ seat: chair, hold: 0.5 })
        : actor.stand({ hold: 0.3 });
    const still = motionHumanLaw.perform(
      "pickup entry",
      [{ subject: "a", body }],
      entry,
    );
    const shoulder = still
      .bones("a", still.performance.duration)
      .get("rightUpperArm")!.worldPosition;
    const offset = glass.affordance("body").frame.translation;
    const d = arm + socket + body.measure.stature / 8;
    const at: IAutoMovieVector3 =
      branch === "floor"
        ? { x: shoulder.x, y: 0, z: 0.45 }
        : branch === "seated"
          ? {
              x: shoulder.x - offset.x,
              y: chair.at.y,
              z: shoulder.z + arm + socket + 0.1 - offset.z,
            }
          : {
              x: shoulder.x - d / 2 - offset.x,
              y: shoulder.y - offset.y,
              z: shoulder.z + (d * Math.sqrt(3)) / 2 - offset.z,
            };
    const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
      "object",
      branch === "floor" ? tote : glass,
      { at, yaw: 0 },
    );
    const handle = branch === "floor" ? "handle" : "body";
    try {
      const run = motionHumanLaw.perform(
        "pickup entry",
        [{ subject: "a", body }],
        entry.pickUp({ prop: "object", handle }),
        [prop],
      );
      const seg = run.performance.segments("a").at(-1)!;
      const rise = run.performance.prop("object", seg.end).position.y - at.y;
      if (rise < 0.05)
        issues.push(branch + " raised the object only " + rise + " m");
      if (branch === "step") {
        const before = run
          .bones("a", seg.start)
          .get("rightFoot")!.worldPosition;
        const plant = seg.plan.contacts
          .filter((c) => c.part === "rightFoot" && c.kind === "plant")
          .at(1);
        const landed =
          seg.start + (plant?.from ?? 0) * seg.plan.duration + 0.01;
        const after = run.bones("a", landed).get("rightFoot")!.worldPosition;
        const nearer =
          Math.hypot(before.x - at.x, before.z - at.z) -
          Math.hypot(after.x - at.x, after.z - at.z);
        if (nearer < 0.05)
          issues.push("right foot advances only " + nearer + " m");
      } else if (branch === "seated") {
        const before = run.bones("a", seg.start).get("leftFoot")!.worldPosition;
        const after = run.bones("a", seg.end).get("leftFoot")!.worldPosition;
        if (Vector3.distance(before, after) > 0.01)
          issues.push("lean displaced the planted foot");
      }
    } catch (error) {
      issues.push(branch + ": " + String(error));
    }
    if (branch !== "floor") {
      const far = HumanObject.prop("object", glass, {
        at: { ...at, z: shoulder.z + 2 * arm },
        yaw: 0,
      });
      let refusal: unknown;
      try {
        motionHumanLaw.perform(
          "unreachable pickup",
          [{ subject: "a", body }],
          entry.pickUp({ prop: "object", handle }),
          [far],
        );
      } catch (error) {
        refusal = error;
      }
      const fix = branch === "seated" ? /stand/ : /step closer/;
      if (
        !(
          refusal instanceof HumanRefusal &&
          refusal.kind === "reach" &&
          refusal.axis === "prop" &&
          fix.test(refusal.fix ?? "")
        )
      )
        issues.push(branch + " range: " + String(refusal));
    }
  }
  return issues;
}
