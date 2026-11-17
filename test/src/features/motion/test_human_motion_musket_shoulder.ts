import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieVector3 } from "@automovie/interface";
import { createLongGun } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";

import { HumanChain, HumanMusketDrill, HumanObject, HumanPerformance, HumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The musket shouldered and recovered by the 1764 Manual Exercise's hands
 * (#3488): taken by its butt in the left hand, carried at the Position of a
 * Soldier under Arms, seized by the right hand, then recovered.
 *
 * Scenarios, the average man:
 * 1. The take, the shoulder, the seize and the recover plan.
 * 2. The shouldered butt rests against the left side, on the line from the
 *    left hip up to the left shoulder within the audit's skin, as low as
 *    the hand holds it ("the Flat of the Butt, to be supported against the
 *    hip-bone", "as low down as can be admitted without constraint").
 * 3. The shouldered piece stands before the left shoulder: its butt-to-muzzle
 *    line within the turn the skin at each end makes over the piece, of the
 *    line from the left hip to the left shoulder ("that it may stand before
 *    the Hollow of the Shoulder").
 *
 * @evidence contracts/development/testing.md#behavioral-verification Shoulders and recovers a real musket archetype through the public chain and reads the displayed musket against the body's own hip and shoulder surfaces; a piece carried in the hand, sloped off the side or refused fails.
 * @evidence contracts/development/testing.md#independent-expectations The posture is the manual's words; the hip and shoulder are the body's surface regions; the bounds are the audit's skin.
 * @evidence contracts/development/testing.md#distinguishing-cases The butt's place and the piece's line.
 * @evidence contracts/development/testing.md#execution-ownership Builds one performance in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Quotes the drill and states the three numbered scenarios with their bounds.
 */
export function test_human_motion_musket_shoulder(): void {
  const musket: ReturnType<typeof createLongGun> = createLongGun({
    kind: "musket",
  });
  const point = (id: "butt" | "muzzle"): IAutoMovieVector3 =>
    musket.affordance(id).frame.translation;
  const length: number = Vector3.length(
    Vector3.subtract(point("muzzle"), point("butt")),
  );
  const bound: number =
    (Math.atan((2 * HumanVerdicts.SKIN) / length) * 180) / Math.PI;
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let drill: IAutoMovieMotionHumanPerformance;
  try {
    drill = new HumanPerformance({
      seed: "recover-drill",
      laws: [
        HumanMusketDrill.takeFirelock,
        HumanMusketDrill.shoulderArms,
        HumanMusketDrill.seize,
        HumanMusketDrill.recover,
      ],
      props: [
        HumanObject.prop("musket", musket, {
          // Its butt within the left hand's reach: before the left
          // shoulder at the waist, a forearm ahead.
          at: Vector3.subtract(
            {
              x: body.measure.shoulderHalfWidth,
              y: body.measure.waistHeight,
              z: body.measure.forearm,
            },
            point("butt"),
          ),
          yaw: 0,
        }),
      ],
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
        .registered("takeFirelock", { prop: "musket" })
        .registered("shoulderArms", { gun: "musket", seconds: 1 })
        .registered("seize", { prop: "musket" })
        .registered("recover", { gun: "musket", seconds: 1 }).node,
    });
  } catch (error) {
    TestValidator.predicate(
      `the drill's take, shoulder, seize and recover plan (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const shouldered = drill.segments("a")[1]!;
  const s: number = shouldered.start + 0.75 * shouldered.plan.duration;
  const carried = drill.prop("musket", s);
  const on = (id: "butt" | "muzzle"): IAutoMovieVector3 =>
    Vector3.add(
      carried.position,
      Quaternion.rotateVector(carried.rotation, point(id)),
    );
  const surface = (id: "hipLeft" | "shoulderLeft"): IAutoMovieVector3 => {
    const region: typeof body.surfaces.regions.hipLeft =
      body.surfaces.regions[id];
    return resolveAutoMovieHumanoidSurfaces.place(
      region,
      drill.bones("a", s).get(region.bone)!,
    ).point;
  };
  const hip: IAutoMovieVector3 = surface("hipLeft");
  const line: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(surface("shoulderLeft"), hip),
  );
  // The butt against the body's side: on the line from the left hip to the
  // left shoulder, as low as the hand holds it.
  const rel: IAutoMovieVector3 = Vector3.subtract(on("butt"), hip);
  const aside: number = Vector3.length(
    Vector3.subtract(rel, Vector3.scale(line, Vector3.dot(rel, line))),
  );
  TestValidator.predicate(
    `the shouldered butt rests against the left side (${(1000 * aside).toFixed(1)} mm off the hip-to-shoulder line)`,
    aside <= HumanVerdicts.SKIN && Vector3.dot(rel, line) >= 0,
  );
  const piece: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(on("muzzle"), on("butt")),
  );
  const lean: number =
    (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(line, piece)))) * 180) /
    Math.PI;
  TestValidator.predicate(
    `the shouldered piece stands before the left shoulder (${lean.toFixed(2)} of ${bound.toFixed(2)} degrees)`,
    lean <= bound,
  );
}
