import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRope,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { poseBones } from "../../posture/internal/poseBones";
import { stuntFallPose } from "../../reaction/internal/stuntFallPose";
import { GymnasticsFlight } from "../../sport/GymnasticsFlight";
import { ropeLine } from "./ropeLine";
import { ropeSwingCourse } from "./ropeSwingCourse";

/**
 * How far the landing may lie from the nearest reachable touchdown, metres
 * (provisional: within a step).
 */
const TOLERANCE: number = 0.3;

/** Seconds to absorb the landing into the stand (provisional). */
const ABSORB: number = 0.35;

/** Seconds the body takes to swing off the take-off onto the rope (provisional). */
const STEP_OFF: number = 0.3;

/** Release instants searched over the forward half swing. */
const SAMPLES: number = 96;

/** Which joints the first displayed hang solves for the rest of the swing. */
const ARM_BONES: readonly AutoMovieHumanoidBone[] = [
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
];

/**
 * Swing on an upright rope and let go onto a landing. The body hangs from the
 * rope's anchor as a pendulum of radius `R`, the anchor-to-hips length at the
 * take-off: `theta(t) = theta0 cos(omega t)`, `omega = sqrt(g / R)` (the
 * small-swing closed form). The hands hold the rope where it reached them at
 * the take-off. At release the hips leave on the tangent with the pendulum's
 * speed and follow the drag-free projectile; the release instant is the one on
 * the forward half swing whose touchdown, at standing hip height over the
 * landing, lies nearest the landing's centre. The body then absorbs into the
 * stand on the landing.
 *
 * @param context The action's context, standing at the take-off holding the
 *   rope's height.
 * @param p The swing.
 * @returns The swing, flight and landing.
 * @throws {HumanRefusal} If the rope cannot reach the take-off or no release
 *   lands within `TOLERANCE` of the landing.
 */
export function ropeSwing(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRope.IParams>,
  p: IAutoMovieMotionHumanRope.ISwing,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const line: ropeLine.ILine = ropeLine.read(context, p.rope, p.line);
  const anchor: IAutoMovieVector3 = line.high;
  const landing: IAutoMovieVector3 = surfaceCentre(
    context,
    p.landing,
    p.surface,
  );
  const entry: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const hips0: IAutoMovieVector3 = entry.get("hips")!.worldPosition;
  const grip: IAutoMovieVector3 = {
    ...hips0,
    y:
      hips0.y +
      (measure.shoulderHeight - measure.hipHeight) +
      0.5 * (measure.upperArm + measure.forearm),
  };
  const hold: number = Vector3.distance(anchor, grip);
  if (hold > line.length)
    throw ropeLine.refusal(
      "line",
      p.line,
      `the rope is ${(hold - line.length).toFixed(3)} m too short to reach the take-off`,
    );

  // The swing's plane holds the anchor and runs toward the landing.
  const level: IAutoMovieVector3 = {
    x: landing.x - anchor.x,
    y: 0,
    z: landing.z - anchor.z,
  };
  const u: IAutoMovieVector3 = Vector3.normalize(level);
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const g: number = AutoMovieGravity.STANDARD;
  const course: ropeSwingCourse.ICourse = ropeSwingCourse(anchor, u, hips0);
  const stood: number = landing.y + measure.hipHeight;

  // Search the forward half swing for the release that lands nearest.
  let best: IRelease | undefined;
  for (let i: number = 1; i < SAMPLES; i++) {
    const t: number = (i / SAMPLES) * course.half;
    const p0: IAutoMovieVector3 = course.at(t);
    const v0: IAutoMovieVector3 = course.velocity(t);
    const disc: number = v0.y * v0.y + 2 * g * (p0.y - stood);
    if (disc < 0) continue;
    const flight: number = (v0.y + Math.sqrt(disc)) / g;
    if (!(flight > 0)) continue;
    const touch: IAutoMovieVector3 = {
      x: p0.x + v0.x * flight,
      y: stood,
      z: p0.z + v0.z * flight,
    };
    const miss: number = Math.hypot(touch.x - landing.x, touch.z - landing.z);
    if (best === undefined || miss < best.miss)
      best = { release: t, flight, miss, from: p0, velocity: v0 };
  }
  if (best === undefined || best.miss > TOLERANCE)
    throw ropeLine.refusal(
      "landing",
      p.landing,
      `no release lands within ${TOLERANCE} m of the landing (nearest ${best === undefined ? "none" : best.miss.toFixed(3) + " m"})`,
    );
  const release: IRelease = best;
  const touchdown: number = release.release + release.flight;
  const duration: number = touchdown + ABSORB;
  const yaw: number = (Math.atan2(u.x, u.z) * 180) / Math.PI;
  const end: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { ...landing },
    yaw,
  );
  const hipsOf = (t: number): IAutoMovieVector3 => {
    if (t <= release.release) return course.at(t);
    const s: number = t - release.release;
    return {
      x: release.from.x + release.velocity.x * s,
      y: release.from.y + release.velocity.y * s - 0.5 * g * s * s,
      z: release.from.z + release.velocity.z * s,
    };
  };

  // The hanging arms reach up the rope; the body leans along it.
  const hangJoints: IAutoMovieMotionHumanPosture["joints"] = {
    ...end.joints,
    leftUpperArm: [170, 15, 0],
    rightUpperArm: [170, 15, 0],
    leftLowerArm: [15, 0, 0],
    rightLowerArm: [15, 0, 0],
  };
  const lean: (toward: IAutoMovieVector3) => number = (
    toward: IAutoMovieVector3,
  ): number => (Math.atan2(Vector3.dot(toward, u), toward.y) * 180) / Math.PI;
  const released: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(anchor, hipsOf(release.release)),
  );
  const shape: (
    hips: IAutoMovieVector3,
    toward: IAutoMovieVector3,
    joints: IAutoMovieMotionHumanPosture["joints"],
  ) => IAutoMovieMotionHumanPosture = (
    hips: IAutoMovieVector3,
    toward: IAutoMovieVector3,
    joints: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture => ({
    root: Vector3.subtract(hips, Vector3.scale(toward, measure.hipHeight)),
    yaw,
    pitch: lean(toward),
    roll: 0,
    joints,
    limbs: {},
  });
  const landed: IAutoMovieMotionHumanPosture = { ...end, limbs: {} };
  const entered: IAutoMovieMotionHumanPosture = {
    ...context.entry.posture,
    limbs: {},
  };

  // Solve the carried hanging arms at the first displayed hang during plan
  // preparation. Reading the film out of order cannot choose another fit.
  const firstHips: IAutoMovieVector3 = course.at(0);
  const firstToward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(anchor, firstHips),
  );
  const hand: IAutoMovieVector3 = Vector3.subtract(
    anchor,
    Vector3.scale(firstToward, hold),
  );
  const elbows: IAutoMovieVector3 = Vector3.add(
    hand,
    Vector3.scale(u, -measure.upperArm),
  );
  const handSide: IAutoMovieVector3 = Vector3.scale(
    perpendicular(u),
    measure.shoulderHalfWidth / 2,
  );
  const hung: IAutoMovieMotionHumanPosture = {
    ...shape(firstHips, firstToward, hangJoints),
    limbs: {
      leftArm: { point: Vector3.add(hand, handSide), bend: elbows },
      rightArm: { point: Vector3.subtract(hand, handSide), bend: elbows },
    },
  };
  const solved: IAutoMovieMotionHumanPosture["joints"] =
    GymnasticsFlight.frozen(body, hung).joints;
  const hungJoints: IAutoMovieMotionHumanPosture["joints"] = { ...hangJoints };
  for (const bone of ARM_BONES) {
    const joint = solved[bone];
    if (joint !== undefined) hungJoints[bone] = joint;
  }
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t >= touchdown)
      return stuntFallPose.blend(
        shape(hipsOf(touchdown), up, end.joints),
        landed,
        minimumJerk.share((t - touchdown) / ABSORB),
      );
    const hips: IAutoMovieVector3 = hipsOf(t);
    if (t > release.release) {
      // In flight the body rights itself and lowers its arms by touchdown.
      const k: number = minimumJerk.share(
        (t - release.release) / (touchdown - release.release),
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] =
        stuntFallPose.blend(
          shape(hips, released, hungJoints),
          shape(hips, up, end.joints),
          k,
        ).joints;
      return shape(
        hips,
        Vector3.normalize(Vector3.lerp(released, up, k)),
        joints,
      );
    }
    // Hanging, the hands on the rope where it reached them at the take-off.
    const toward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(anchor, hips),
    );
    return blendIn(t, shape(hips, toward, { ...hungJoints }));
  };
  // Off the take-off, the body swings onto the rope over `STEP_OFF`.
  const blendIn: (
    t: number,
    hung: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieMotionHumanPosture = (
    t: number,
    hung: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture =>
    t >= STEP_OFF
      ? hung
      : stuntFallPose.blend(entered, hung, minimumJerk.share(t / STEP_OFF));
  return {
    duration,
    events: [
      { name: "release", share: release.release / duration },
      { name: "touchdown", share: touchdown / duration },
    ],
    contacts: [
      {
        part: "leftHand",
        kind: "grip",
        support: { kind: "prop", subject: p.rope },
        from: 0,
        to: release.release / duration,
      },
      {
        part: "rightHand",
        kind: "grip",
        support: { kind: "prop", subject: p.rope },
        from: 0,
        to: release.release / duration,
      },
      {
        part: "leftFoot",
        kind: "bear",
        support: { kind: "prop", subject: p.landing },
        from: touchdown / duration,
        to: 1,
      },
      {
        part: "rightFoot",
        kind: "bear",
        support: { kind: "prop", subject: p.landing },
        from: touchdown / duration,
        to: 1,
      },
    ],
    base: { kind: "standing" },
    posture,
    yields: [],
  };
}

/** The chosen release. */
interface IRelease {
  /** Seconds after the take-off. */
  release: number;

  /** Seconds of flight to touchdown. */
  flight: number;

  /** The touchdown's horizontal miss of the landing's centre, metres. */
  miss: number;

  /** The hips at release, world metres. */
  from: IAutoMovieVector3;

  /** Their velocity at release, metres per second. */
  velocity: IAutoMovieVector3;
}

/** A horizontal unit vector at right angles to a horizontal direction. */
function perpendicular(direction: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: direction.z, y: 0, z: -direction.x };
}

/** The world centre of a fixed prop's surface affordance. */
function surfaceCentre(
  context: IAutoMovieMotionHumanActionContext,
  subject: string,
  id: string,
): IAutoMovieVector3 {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const surface: IAutoMovieAffordance | undefined =
    reader.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === id,
    );
  if (surface === undefined || reader.prop.motion !== undefined)
    throw ropeLine.refusal(
      "surface",
      id,
      `${subject} has no fixed surface ${id}`,
    );
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  return Vector3.add(
    world.position,
    Quaternion.rotateVector(world.rotation, surface.frame.translation),
  );
}
