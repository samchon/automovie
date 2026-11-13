import {
  createDrinkware,
  createSmoking,
  createSword,
} from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHeld,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEntryState,
  type IHumanProp,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A tool is taken up for its use: picked up with the use named, a sword can
 * then be presented on the line that use needs, where a grasp chosen for the
 * reach alone may leave the blade where the wrist cannot aim it.
 *
 * A sword stands point up before the right hand. It is picked up, then a
 * registered law presents it: the wrist goes ahead of the shoulder and the
 * hand is asked for the rotation that lays the blade's line, from its grip to
 * its point, on a line in the plane the body faces. The reading is the angle
 * between that asked line and the line of the displayed sword at the end.
 *
 * Scenarios, on the average man for the lines `forearm` (level ahead, a
 * thrust's), `oblique` (45 degrees up, a sabre grip's) and `square`
 * (upright, a hammer grip's), and on the small woman for `oblique`; the
 * relation of scenario 2 is read on the average man's `forearm` line, the
 * glass on the average man and the cigarette on the small woman. A planned
 * pick-up with a use costs seconds, and each claim is about the rule, so
 * one body per claim with the opposite build on one line is enough:
 * 1. Picked up with that use, the presented blade lies within 15 degrees of
 *    the asked line: the most a grasp chosen for a use may leave unmet
 *    (`HumanGraspUse.UNMET`, provisional).
 * 2. It lies no farther from the asked line, by more than 1 degree, than
 *    when the same sword is picked up with no use named: naming the use
 *    never makes the use worse.
 * 3. A use whose working point the sword does not declare is refused as an
 *    `affordance` refusal on `use` that lists `point`.
 * 4. A glass at waist height taken up by its body to bring its lip upright
 *    to the mouth (`at: "mouth"`) plans: a grasp exists that also holds
 *    there.
 * 5. A cigarette at waist height before the right shoulder taken up to
 *    bring its mouth end to the lips on the `forearm` line plans: at the
 *    mouth that line runs from the hand back into the face.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pick-up and a presenting action through the public input and reads the displayed sword's line; a grasp that ignores the use, or a missing refusal, fails with the measured angle.
 * @evidence contracts/development/testing.md#independent-expectations The asked line is built in the test from the body's heading; the displayed line comes from the performance's own carry of the prop. The 15 degrees is the contract the parameter states, marked provisional there, and the comparison with the unnamed use is a relation between two runs.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, two lines a quarter turn apart, with and without the use, a working point the prop lacks, and a use at the mouth for a glass and for a cigarette (each must plan; no angle is read there). What a cut or a thrust then does with the blade is the blade tests'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and one archetype and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the staging, the reading and the 5 scenarios with their bounds.
 */
export function test_human_motion_core_grasp_use(): void {
  const complaints: string[] = [];
  const LINES: Readonly<Record<"forearm" | "oblique" | "square", number>> = {
    forearm: 0,
    oblique: 45,
    square: 90,
  };
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;

    // Presents the held sword on a line risen by `rise` degrees from level
    // ahead, and holds it there.
    const present = (rise: number): IHumanActionLaw<never> => ({
      name: "present",
      interrupts: {},
      plan: (context: IHumanActionContext<never>): IHumanActionPlan => {
        const held: AutoMovieMotionHumanHeld.IHeld =
          AutoMovieMotionHumanHeld.of(context, "right", "sword");
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          context.entry.pose,
        );
        const hand: IAutoMovieResolvedBone = bones.get("rightHand")!;
        const shoulder: IAutoMovieVector3 =
          bones.get("rightUpperArm")!.worldPosition;
        const elbow: IAutoMovieVector3 =
          bones.get("rightLowerArm")!.worldPosition;
        const arm: number =
          Vector3.length(Vector3.subtract(elbow, shoulder)) +
          Vector3.length(Vector3.subtract(hand.worldPosition, elbow));
        const lying: IAutoMovieVector3 = Vector3.normalize(
          Quaternion.rotateVector(
            hand.worldRotation,
            Vector3.subtract(
              AutoMovieMotionHumanHeld.point(held, "point").point,
              AutoMovieMotionHumanHeld.point(held, "grip").point,
            ),
          ),
        );
        const asked: IAutoMovieVector3 = line(rise);
        const across: IAutoMovieVector3 = Vector3.cross(lying, asked);
        const turn: IAutoMovieQuaternion =
          Vector3.length(across) < 1e-9
            ? { x: 0, y: 0, z: 0, w: 1 }
            : Quaternion.fromAxisAngle(
                Vector3.normalize(across),
                (Math.acos(
                  Math.max(-1, Math.min(1, Vector3.dot(lying, asked))),
                ) *
                  180) /
                  Math.PI,
              );
        return {
          duration: 0.8,
          events: [],
          contacts: [
            ...context.entry.supports.map(
              (
                support: IHumanEntryState.ISupport,
              ): IHumanActionPlan["contacts"][number] => ({
                ...support,
                from: 0,
                to: 1,
              }),
            ),
            AutoMovieMotionHumanHeld.grip(held),
          ],
          holds: [AutoMovieMotionHumanHeld.hold(context, held)],
          posture: (): ReturnType<IHumanActionPlan["posture"]> => ({
            ...context.entry.posture,
            limbs: {
              ...context.entry.posture.limbs,
              rightArm: {
                point: {
                  x: shoulder.x,
                  y: shoulder.y - 0.1 * arm,
                  z: shoulder.z + 0.6 * arm,
                },
                rotation: Quaternion.normalize(
                  Quaternion.multiply(turn, hand.worldRotation),
                ),
                bend: { x: shoulder.x - 0.2 * arm, y: 0, z: shoulder.z },
                planted: true,
              },
            },
          }),
        };
      },
    });
    const line = (rise: number): IAutoMovieVector3 => ({
      x: 0,
      y: Math.sin((rise * Math.PI) / 180),
      z: Math.cos((rise * Math.PI) / 180),
    });

    // The angle between the displayed sword's line and the asked one at the
    // end of the presenting action, degrees.
    const off = (rise: number, use: object): number => {
      const film: HumanPerformance = new HumanPerformance({
        seed: "grasp",
        laws: [present(rise)],
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
          HumanObject.prop("sword", sword, {
            at: { x: -0.1 * stature, y: 0.62 * stature, z: 0.12 * stature },
            yaw: 0,
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("pickUp", { prop: "sword", handle: "grip", ...use })
          .registered("present").node,
      });
      const frame: IHumanProp.IFrame = film.prop("sword", film.duration);
      const points: IHumanProp["points"] = HumanObject.prop("sword", sword, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
      }).points;
      const shown: IAutoMovieVector3 = Vector3.normalize(
        Quaternion.rotateVector(
          frame.rotation,
          Vector3.subtract(points.point!.point, points.grip!.point),
        ),
      );
      return (
        (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(shown, line(rise))))) *
          180) /
        Math.PI
      );
    };

    for (const [use, rise] of Object.entries(LINES) as [
      "forearm" | "oblique" | "square",
      number,
    ][]) {
      // A planned pick-up with a use costs seconds, so the small woman
      // presents on one line and the relation to the unnamed use is read on
      // one line of the average man: the claim is the rule, not the body.
      if (name === "f-small" && use !== "oblique") continue;
      let named: number;
      let unnamed: number;
      try {
        named = off(rise, { use: { tip: "point", line: use } });
        unnamed =
          name === "m-average" && use === "forearm" ? off(rise, {}) : Infinity;
      } catch (error) {
        complaints.push(
          `${name}: a sword taken up for the ${use} line and presented: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      if (named > 15)
        complaints.push(
          `${name}: taken up for the ${use} line, the presented blade lies ${named.toFixed(1)} degrees off it (${unnamed.toFixed(1)} with no use named), within 15 expected`,
        );
      if (named > unnamed + 1)
        complaints.push(
          `${name}: taken up for the ${use} line the blade lies ${named.toFixed(1)} degrees off it, and ${unnamed.toFixed(1)} with no use named; no worse expected`,
        );
    }

    // 4. A glass taken up to be drunk from, by the average man.
    if (name === "m-average")
      try {
      new HumanPerformance({
        seed: "grasp",
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
          HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
            at: { x: 0.15, y: 0.58 * stature, z: 0.17 * stature },
            yaw: 0,
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "glass",
            handle: "body",
            use: { tip: "lip", line: "square", at: "mouth" },
          }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: a glass taken up to bring its lip upright to the mouth: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 5. A cigarette taken up to bring its mouth end to the lips, by the
    // small woman, on whom it was first refused.
    if (name === "f-small")
      try {
      new HumanPerformance({
        seed: "grasp",
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
          HumanObject.prop(
            "cigarette",
            createSmoking({ kind: "cigarette" }),
            {
              at: {
                x: -body.measure.shoulderHalfWidth,
                y: body.measure.waistHeight,
                z: 0.6 * (body.measure.upperArm + body.measure.forearm),
              },
              yaw: 0,
            },
          ),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "cigarette",
            handle: "grip",
            use: { tip: "mouth", line: "forearm", at: "mouth" },
          }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: a cigarette taken up to bring its mouth end level to the lips: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 3. A working point the sword lacks.
    if (name !== "m-average") continue;
    let thrown: unknown = null;
    try {
      off(0, { use: { tip: "muzzle", line: "forearm" } });
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof Error &&
        thrown.name === "HumanRefusal" &&
        thrown.message.includes("use") &&
        thrown.message.includes("point")
      )
    )
      complaints.push(
        `${name}: a use whose tip the sword lacks: expected a refusal on use listing point, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("a tool is taken up for its use", complaints, []);
}
