import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
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

import { stand } from "../actions/stand";
import { poseBones } from "../posture/poseBones";
import { ropeLine } from "./ropeLine";

/** How far the landing may lie from the nearest reachable touchdown, metres (provisional: within a step). */
const TOLERANCE: number = 0.3;

/** Seconds to absorb the landing into the stand (provisional). */
const ABSORB: number = 0.35;

/** Release instants searched over the forward half swing. */
const SAMPLES: number = 96;

/**
 * Swing on an upright rope and let go onto a landing. The body hangs from
 * the rope's anchor as a pendulum of radius `R`, the anchor-to-hips length
 * at the take-off: `theta(t) = theta0 cos(omega t)`, `omega = sqrt(g / R)`
 * (the small-swing closed form). The hands hold the rope where it reached
 * them at the take-off. At release the hips leave on the tangent with the
 * pendulum's speed and follow the drag-free projectile; the release instant
 * is the one on the forward half swing whose touchdown, at standing hip
 * height over the landing, lies nearest the landing's centre. The body
 * then absorbs into the stand on the landing.
 *
 * @param context The action's context, standing at the take-off holding the rope's height.
 * @param p The swing.
 * @returns The swing, flight and landing.
 * @throws {HumanRefusal} If the rope cannot reach the take-off or no release lands within `TOLERANCE` of the landing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pendulum, the release rule, the flight, the landing and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The pendulum and the projectile are closed forms; the release is the sampled instant minimising the landing miss.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Geometry, the release search, then one posture writer over three phases.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable landing refuses rather than steering the flight; the constants are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms SAMPLES closed-form evaluations at plan time; constant work per sample.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only its closed-form constants.
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
  const offset: IAutoMovieVector3 = Vector3.subtract(hips0, anchor);
  const radius: number = Vector3.length(offset);
  const theta0: number = Math.atan2(Vector3.dot(offset, u), -offset.y);
  const g: number = AutoMovieGravity.STANDARD;
  const omega: number = Math.sqrt(g / radius);
  const at = (t: number): IAutoMovieVector3 => {
    const theta: number = theta0 * Math.cos(omega * t);
    return Vector3.add(
      anchor,
      Vector3.add(
        Vector3.scale(u, radius * Math.sin(theta)),
        Vector3.scale(up, -radius * Math.cos(theta)),
      ),
    );
  };
  const velocity = (t: number): IAutoMovieVector3 => {
    const theta: number = theta0 * Math.cos(omega * t);
    const rate: number = -theta0 * omega * Math.sin(omega * t);
    return Vector3.add(
      Vector3.scale(u, radius * rate * Math.cos(theta)),
      Vector3.scale(up, radius * rate * Math.sin(theta)),
    );
  };
  const stood: number = landing.y + measure.hipHeight;

  // Search the forward half swing for the release that lands nearest.
  let best: IRelease | undefined;
  for (let i: number = 1; i < SAMPLES; i++) {
    const t: number = (i / SAMPLES) * (Math.PI / omega);
    const p0: IAutoMovieVector3 = at(t);
    const v0: IAutoMovieVector3 = velocity(t);
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
    if (t <= release.release) return at(t);
    const s: number = t - release.release;
    return {
      x: release.from.x + release.velocity.x * s,
      y: release.from.y + release.velocity.y * s - 0.5 * g * s * s,
      z: release.from.z + release.velocity.z * s,
    };
  };

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t >= touchdown) {
      const w: number = minimumJerk.share((t - touchdown) / ABSORB);
      const hips: IAutoMovieVector3 = hipsOf(touchdown);
      const root: IAutoMovieVector3 = Vector3.lerp(
        { ...hips, y: hips.y - measure.hipHeight },
        end.root,
        w,
      );
      return { ...end, root };
    }
    const hips: IAutoMovieVector3 = hipsOf(t);
    const hanging: boolean = t <= release.release;
    // While hanging, the body lies along the rope; in flight it rights itself.
    const toward: IAutoMovieVector3 = hanging
      ? Vector3.normalize(Vector3.subtract(anchor, hips))
      : up;
    const pitch: number = hanging
      ? (Math.atan2(Vector3.dot(toward, u), toward.y) * 180) / Math.PI
      : 0;
    const root: IAutoMovieVector3 = Vector3.subtract(
      hips,
      Vector3.scale(toward, measure.hipHeight),
    );
    const base: IAutoMovieMotionHumanPosture = {
      ...end,
      root,
      yaw,
      pitch,
      limbs: {},
    };
    if (!hanging) return base;
    const hand: IAutoMovieVector3 = Vector3.add(
      anchor,
      Vector3.scale(Vector3.normalize(Vector3.subtract(hips, anchor)), hold),
    );
    // The elbows point back from the swing, below the grip.
    const elbows: IAutoMovieVector3 = Vector3.add(
      hand,
      Vector3.scale(u, -measure.upperArm),
    );
    return {
      ...base,
      limbs: {
        leftArm: {
          point: Vector3.add(
            hand,
            Vector3.scale(perpendicular(u), measure.shoulderHalfWidth / 2),
          ),
          bend: elbows,
        },
        rightArm: {
          point: Vector3.add(
            hand,
            Vector3.scale(perpendicular(u), -measure.shoulderHalfWidth / 2),
          ),
          bend: elbows,
        },
      },
    };
  };
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
