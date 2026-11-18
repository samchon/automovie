import { createLongGun } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanMusketDrill,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { profileHumanMotion } from "../internal/profileHumanMotion";

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
    drill = profileHumanMotion(
      "displayed-shoulder-carry",
      (): IAutoMovieMotionHumanPerformance =>
        new HumanPerformance({
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
        }),
      ["a"],
      "shoulderArms",
      ["musket"],
    );
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
  const bones: DisplayedBones = drill.bones("a", s);
  const on = (id: "butt" | "muzzle"): IAutoMovieVector3 =>
    Vector3.add(
      carried.position,
      Quaternion.rotateVector(carried.rotation, point(id)),
    );
  const hip: IAutoMovieVector3 = surface(body, bones, "hipLeft");
  const line: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(surface(body, bones, "shoulderLeft"), hip),
  );
  // The butt against the body's side: on the line from the left hip to the
  // left shoulder, as low as the hand holds it.
  const butt: IAutoMovieVector3 = on("butt");
  const rel: IAutoMovieVector3 = Vector3.subtract(butt, hip);
  const aside: number = distanceFromLine(rel, line);
  const piece: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(on("muzzle"), butt),
  );
  const lean: number =
    (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(line, piece)))) * 180) /
    Math.PI;
  const complaints: string[] = [];
  if (!(aside <= HumanVerdicts.SKIN && Vector3.dot(rel, line) >= 0))
    complaints.push(
      `the displayed butt is ${(1000 * aside).toFixed(1)} mm off the hip-to-shoulder line, at ${(1000 * Vector3.dot(rel, line)).toFixed(1)} mm along it`,
    );
  if (!(lean <= bound))
    complaints.push(
      `the displayed piece leans ${lean.toFixed(2)} degrees from the hip-to-shoulder line, ${bound.toFixed(2)} at most`,
    );
  if (complaints.length > 0)
    complaints.push(
      shoulderWitness(
        body,
        bones,
        butt,
        shouldered.plan.posture(s - shouldered.start),
      ),
    );
  TestValidator.equals(
    "the displayed prop lines up with the left side",
    complaints,
    [],
  );
}

/** A normal-entry displayed bone map and the equivalent FK representation. */
type DisplayedBones = ReturnType<IAutoMovieMotionHumanPerformance["bones"]>;

/** The two measured points that define the carried prop's body line. */
type Landmark = "hipLeft" | "shoulderLeft";

/** Place a body surface in the displayed or the independently resolved plan pose. */
function surface(
  body: IAutoMovieMotionHumanBody,
  bones: DisplayedBones,
  id: Landmark,
): IAutoMovieVector3 {
  const region: typeof body.surfaces.regions.hipLeft =
    body.surfaces.regions[id];
  return resolveAutoMovieHumanoidSurfaces.place(region, bones.get(region.bone)!)
    .point;
}

/** Remove a relative point's component along the unit body line. */
function distanceFromLine(
  relative: IAutoMovieVector3,
  line: IAutoMovieVector3,
): number {
  return Vector3.length(
    Vector3.subtract(
      relative,
      Vector3.scale(line, Vector3.dot(relative, line)),
    ),
  );
}

/** Diagnose which frame first diverges, only for a failed display. */
function shoulderWitness(
  body: IAutoMovieMotionHumanBody,
  shown: DisplayedBones,
  butt: IAutoMovieVector3,
  authored: IAutoMovieMotionHumanPosture,
): string {
  const goal: IAutoMovieHumanLimbGoal | undefined = authored.limbs.leftArm;
  if (goal?.contact === undefined || goal.rotation === undefined)
    return "the plan supplies no rotatable left-wrist contact at this sample";
  const raw: DisplayedBones = poseBones(
    body,
    resolveHumanPosture(body, authored),
  );
  const hip: IAutoMovieVector3 = surface(body, raw, "hipLeft");
  const shoulder: IAutoMovieVector3 = surface(body, raw, "shoulderLeft");
  const line: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(shoulder, hip),
  );
  const intended: IAutoMovieVector3 = Vector3.add(
    goal.point,
    Quaternion.rotateVector(goal.rotation, goal.contact),
  );
  const wrist: IAutoMovieResolvedBone = shown.get("leftHand")!;
  const resolved: IAutoMovieVector3 = Vector3.add(
    wrist.worldPosition,
    Quaternion.rotateVector(wrist.worldRotation, goal.contact),
  );
  const mm = (metres: number): string => (1000 * metres).toFixed(1);
  return `plan wrist contact ${mm(distanceFromLine(Vector3.subtract(intended, hip), line))} mm off plan side, display wrist contact ${mm(Vector3.distance(intended, resolved))} mm off its goal, displayed prop point ${mm(Vector3.distance(resolved, butt))} mm off the wrist contact, display hip and shoulder moved ${mm(Vector3.distance(hip, surface(body, shown, "hipLeft")))}/${mm(Vector3.distance(shoulder, surface(body, shown, "shoulderLeft")))} mm`;
}
