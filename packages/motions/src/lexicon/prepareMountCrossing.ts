import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  getConstraint,
  minimumJerk,
  physicalShapeGjk,
  physicalShapePairDistance,
  polynomialUnitRoots,
  poseJointCodec,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanMinimumJerkSpline } from "../posture/HumanMinimumJerkSpline";
import { HumanQuinticSegment } from "../posture/HumanQuinticSegment";
import { HumanSequentialConvex } from "../posture/HumanSequentialConvex";
import { HumanSequentialConvexFunctions as Functions } from "../posture/HumanSequentialConvexFunctions";
import { humanRig } from "../posture/humanRig";
import { poseBones } from "../posture/poseBones";
import { prepareHumanAdaptiveKnots } from "../posture/prepareHumanAdaptiveKnots";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crutchHeldLeg } from "./crutchHeldLeg";

/** One model collider placed in the actor's profile frame. */
type Placed = IAutoMovieMotionHumanColliders.IPlaced;
/** The clinical coordinates of one fitted leg. */
type Coordinates = readonly number[];

/**
 * Lay the unloaded far leg around the leading shank and the seat material. The
 * two free proximal coordinates are solved together on the mount clock
 * (Schulman et al. 2014, §4.1); either coordinate alone can exchange one
 * collision for the other. The support leg, root and fixed ends are supplied by
 * the mount. All native geometry and searches are confined to preparation.
 *
 * @param props The two-legged entry and the seat's placed material.
 * @returns A writer of the far leg's joint course on its open airborne span.
 * @see https://doi.org/10.1177/0278364914528132
 */
export function prepareMountCrossing(
  props: prepareMountCrossing.IProps,
): prepareMountCrossing.Write {
  const { body, side, start, end, read, floor, solid } = props;
  const lead: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const hip: AutoMovieHumanoidBone =
    side === "left" ? "leftUpperLeg" : "rightUpperLeg";
  const shin: AutoMovieHumanoidBone =
    side === "left" ? "leftLowerLeg" : "rightLowerLeg";
  const near: AutoMovieHumanoidBone =
    lead === "left" ? "leftLowerLeg" : "rightLowerLeg";
  const foot: AutoMovieHumanoidBone =
    side === "left" ? "leftFoot" : "rightFoot";
  const toes: AutoMovieHumanoidBone =
    side === "left" ? "leftToes" : "rightToes";
  const limb = side === "left" ? "leftLeg" : "rightLeg";
  const chain: readonly AutoMovieHumanoidBone[] = [hip, shin, foot, toes];
  const observed: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    shin,
    near,
    hip,
    foot,
    toes,
  ]);
  const bones = poseBones.prepare(body, observed);
  const shapes = HumanColliders.preparePlaced(body, observed);
  const index = (bone: AutoMovieHumanoidBone): number =>
    body.tangle.parts.findIndex((part) => part.bone === bone);
  const own = index(shin);
  const other = index(near);
  const codec = poseJointCodec(humanRig(body));
  const range = getConstraint(hip, body.bones.get(hip)?.constraint ?? null);
  if (
    own < 0 ||
    other < 0 ||
    range === null ||
    range.flexion === null ||
    range.abduction === null
  )
    return identity;
  const part = body.tangle.parts[own]!;
  const peer = body.tangle.parts[other]!;
  const beyond = Tangle.reference(body.tangle, own, other);
  const reversed = Tangle.reference(body.tangle, other, own);
  const margin = Tangle.BUILT;

  const joints = (pose: IAutoMoviePose): number[] => {
    const angles = poseJointCodec.index(pose);
    return chain.flatMap((bone) => angles.get(bone) ?? [0, 0, 0]);
  };
  const prepare = (time: number, pose: IAutoMoviePose) => {
    const placed = bones(pose);
    const p = placed.get(hip)!;
    const geometry = shapes(placed);
    const far = geometry.find(({ bone }) => bone === shin)!;
    const fixed = geometry.find(({ bone }) => bone === near)!;
    const free = geometry.filter(
      ({ bone }) => bone === shin || bone === foot || bone === toes,
    );
    const sole = HumanFoot.sockets(body, placed, side).map(
      ({ point }) => point,
    );
    const material = solid(time);
    const object = material.shapes.map((shape) =>
      physicalShapeGjk.solid(material.frame, shape),
    );
    const original = joints(pose);
    const origin = p.worldPosition;
    const inverse = Quaternion.inverse(p.worldRotation);
    const parent = Quaternion.multiply(
      p.worldRotation,
      Quaternion.inverse(
        codec.rotation(hip, [original[0]!, original[1]!, original[2]!]),
      ),
    );
    const shift = (
      turn: IAutoMovieQuaternion,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        origin,
        Quaternion.rotateVector(turn, Vector3.subtract(point, origin)),
      );
    const moved = (turn: IAutoMovieQuaternion, collider: Placed): Placed => ({
      ...collider,
      pose: {
        position: shift(turn, collider.pose.position),
        rotation: Quaternion.multiply(turn, collider.pose.rotation),
      },
    });
    const reading = (angles: Coordinates): Coordinates => {
      const turn = Quaternion.multiply(
        Quaternion.multiply(
          parent,
          codec.rotation(hip, [angles[0]!, angles[1]!, original[2]!]),
        ),
        inverse,
      );
      const shank = moved(turn, far);
      const largest = (probe: Float64Array, allowed: Float64Array): number =>
        probe.reduce((max, value, k) => Math.max(max, value - allowed[k]!), 0);
      const primary = largest(Tangle.depths(part.probes, shank, fixed), beyond);
      const secondary = largest(
        Tangle.depths(peer.probes, fixed, shank),
        reversed,
      );
      let contact = Infinity;
      for (const frame of free) {
        const segment = frame === far ? shank : moved(turn, frame);
        for (const shape of segment.shapes) {
          const occupied = physicalShapeGjk.solid(segment.pose, shape);
          for (let i = 0; i < object.length; ++i) {
            const lower = physicalShapeGjk(occupied, object[i]!, margin).lower;
            if (lower >= margin) continue;
            contact = Math.min(
              contact,
              physicalShapePairDistance(
                segment.pose,
                shape,
                material.frame,
                material.shapes[i]!,
              ),
            );
          }
        }
      }
      const ground = Math.min(...sole.map((point) => shift(turn, point).y));
      return [
        primary - margin,
        secondary - margin,
        -Math.min(margin, contact),
        floor - ground,
      ];
    };
    return { original, reading };
  };
  const times = [
    ...new Set([
      start,
      ...crutchHeldLeg.timesteps(start, end),
      ...props.events,
    ]),
  ]
    .filter((time) => time >= start && time <= end)
    .sort((a, b) => a - b);
  const desired = times.map((time) =>
    joints(resolveHumanPosture(body, read(time))),
  );
  const jets = HumanMinimumJerkSpline.derivatives(times, desired);
  const edges = [
    { at: start, outward: -1, knot: 0 },
    { at: end, outward: 1, knot: times.length - 1 },
  ];
  for (const { at, outward, knot } of edges) {
    // The same one-sided rate step as the motion's cut reader
    // (samplePoseVelocity). Also read the second difference at the join.
    const step = Math.min(1e-3, (end - start) / 4, start / 2);
    if (step <= 0) continue;
    const atBoundary = desired[knot]!;
    const one = joints(resolveHumanPosture(body, read(at + outward * step)));
    const two = joints(
      resolveHumanPosture(body, read(at + outward * 2 * step)),
    );
    const first = one.map((angle, i) => wrapDegrees(angle - atBoundary[i]!));
    const second = two.map((angle, i) => wrapDegrees(angle - atBoundary[i]!));
    jets.velocities[knot] = first.map(
      (x, i) => (outward * (4 * x - second[i]!)) / (2 * step),
    );
    jets.accelerations[knot] = first.map(
      (x, i) => (second[i]! - 2 * x) / (step * step),
    );
  }
  const boundary = (i: number): HumanQuinticSegment.IBoundary => ({
    position: desired[i]!,
    velocity: jets.velocities[i]!,
    acceleration: jets.accelerations[i]!,
  });
  const segments = times
    .slice(1)
    .map((until, i) =>
      HumanQuinticSegment.prepare(
        boundary(i),
        boundary(i + 1),
        until - times[i]!,
      ),
    );
  const reference = (t: number) => {
    let low = 0;
    let high = times.length - 1;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (times[middle]! <= t) low = middle;
      else high = middle;
    }
    return {
      knot: low,
      coordinates: HumanQuinticSegment.position(
        segments[low]!,
        t - times[low]!,
      ),
    };
  };
  const count = times.length - 2;
  const rad = Quaternion.DEG2RAD;
  const seed = desired
    .slice(1, -1)
    .flatMap((row) => [row[0]! * rad, row[1]! * rad]);
  const lo = [range.flexion.min * rad, range.abduction.min * rad];
  const hi = [range.flexion.max * rad, range.abduction.max * rad];
  const poseAt = (
    posture: IAutoMovieMotionHumanPosture,
    coordinates: Coordinates,
  ): IAutoMovieMotionHumanPosture => {
    const goals = { ...posture.limbs };
    delete goals[limb];
    const written = { ...posture.joints };
    chain.forEach((bone, i) => {
      written[bone] = [
        coordinates[3 * i]!,
        coordinates[3 * i + 1]!,
        coordinates[3 * i + 2]!,
      ];
    });
    return { ...posture, limbs: goals, joints: written };
  };
  const correction = (x: Coordinates, knot: number, axis: number): number =>
    knot === 0 || knot === times.length - 1
      ? 0
      : (x[2 * (knot - 1) + axis]! - seed[2 * (knot - 1) + axis]!) / rad;
  const hipAt = (
    x: Coordinates,
    i: number,
    share: number,
    angles: Coordinates,
  ): [number, number] => {
    const angle = (axis: number): number =>
      angles[axis]! +
      (1 - share) * correction(x, i, axis) +
      share * correction(x, i + 1, axis);
    return [angle(0), angle(1)];
  };
  // Minimum-jerk corrections between adjacent via points leave the original
  // velocity and acceleration shared at each knot. The solver reads the
  // actual interpolant, and each row touches only the two adjacent hips.
  const probes = times
    .slice(1)
    .flatMap((until, i) => [
      { time: (times[i]! + until) / 2, i, share: 0.5 },
      ...(until === end ? [] : [{ time: until, i, share: 1 }]),
    ]);
  const rows = probes.map(({ time, i, share }) => {
    const { coordinates } = reference(time);
    const frame = prepare(
      time,
      resolveHumanPosture(body, poseAt(read(time), coordinates)),
    );
    return {
      g: (x: Coordinates): Coordinates => {
        const [flexion, abduction] = hipAt(x, i, share, coordinates);
        return [
          ...frame
            .reading([flexion, abduction])
            .map((distance) => distance * 1000),
          lo[0]! - flexion * rad,
          flexion * rad - hi[0]!,
          lo[1]! - abduction * rad,
          abduction * rad - hi[1]!,
        ];
      },
      equality: false,
      variables: [i, i + 1].flatMap((knot) =>
        knot === 0 || knot === times.length - 1
          ? []
          : [2 * (knot - 1), 2 * (knot - 1) + 1],
      ),
    };
  });
  const solved = HumanSequentialConvex.minimise(
    Functions.problem({
      low: Array.from({ length: count }, () => lo).flat(),
      high: Array.from({ length: count }, () => hi).flat(),
      costs: Array.from({ length: count }, (_, i) => ({
        f: (x: Coordinates): number =>
          (x[2 * i]! - seed[2 * i]!) ** 2 +
          (x[2 * i + 1]! - seed[2 * i + 1]!) ** 2,
        full: false,
        variables: [2 * i, 2 * i + 1],
      })),
      constraints: rows,
    }),
    seed,
    HumanSequentialConvex.DEFAULTS,
  );
  // Check every real extremum of the clinical quintics before publishing
  // them. Native posture projection must not become the path's range guard.
  const names = ["flexion", "abduction", "twist"] as const;
  const limits = chain.flatMap((bone) => {
    const constraint = getConstraint(
      bone,
      body.bones.get(bone)?.constraint ?? null,
    );
    return names.map((axis) =>
      constraint === null ? undefined : constraint[axis],
    );
  });
  for (const [i, segment] of segments.entries())
    for (const [axis, nominal] of segment.coefficients.entries()) {
      const range = limits[axis];
      if (range === undefined) continue;
      const from = axis < 2 ? correction(solved.x, i, axis) : 0;
      const delta = axis < 2 ? correction(solved.x, i + 1, axis) - from : 0;
      const coefficients = [
        nominal[0]! + from,
        nominal[1]!,
        nominal[2]!,
        nominal[3]! + 10 * delta,
        nominal[4]! - 15 * delta,
        nominal[5]! + 6 * delta,
      ];
      const extrema = polynomialUnitRoots(
        coefficients
          .slice(1)
          .map((coefficient, power) => coefficient * (power + 1)),
      );
      for (const u of [0, ...extrema, 1]) {
        const angle = coefficients.reduceRight(
          (value, coefficient) => coefficient + u * value,
          0,
        );
        if (
          angle < (range?.min ?? 0) - ROM_TOLERANCE ||
          angle > (range?.max ?? 0) + ROM_TOLERANCE
        )
          throw new HumanRefusal({
            kind: "reach",
            axis: "saddleCrossing",
            value: angle,
            feasible: {
              kind: "range",
              minimum: range?.min ?? 0,
              maximum: range?.max ?? 0,
              unit: "degrees",
            },
            reason:
              "the unloaded leg reaches a joint limit between two prepared crossing poses",
            fix: "give the rider more space beside the seat",
          });
      }
    }
  const write: prepareMountCrossing.Write = (posture, seconds) => {
    if (seconds <= start || seconds >= end) return posture;
    const { knot, coordinates } = reference(seconds);
    const from = times[knot]!;
    const share = minimumJerk.share(
      (seconds - from) / (times[knot + 1]! - from),
    );
    const [flexion, abduction] = hipAt(solved.x, knot, share, coordinates);
    return poseAt(posture, [flexion, abduction, ...coordinates.slice(2)]);
  };
  const admit = (time: number): Coordinates => {
    const posture = write(read(time), time);
    const pose = resolveHumanPosture(body, posture);
    const frame = prepare(time, pose);
    const tested = frame.reading(frame.original);
    const excess = Math.max(...tested);
    if (excess > 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "saddleCrossing",
        value: excess,
        feasible: { kind: "range", minimum: 0, maximum: 0, unit: "m" },
        reason:
          "the unloaded leg cannot pass the other leg and the seat on the prepared course",
        fix: "give the rider more space beside the seat",
      });
    return tested;
  };
  // The adjusted pose is read afresh. Solver status cannot admit a collision.
  // At the edges, the original support is authoritative and unchanged.
  prepareHumanAdaptiveKnots({
    from: start,
    to: end,
    requiredTimes: probes.map(({ time }) => time),
    evaluate: admit,
    tolerance: { kind: "absolute", absolute: margin },
    maxKnots: 4 * (probes.length + 2),
  });
  return write;
}

/** Keep the declared crossing when the body has no admitted pair geometry. */
function identity(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  return posture;
}

/** The material and clock the saddle's unloaded crossing consumes. */
export namespace prepareMountCrossing {
  /** A lower posture at an action second. */
  export type Read = (seconds: number) => IAutoMovieMotionHumanPosture;

  /** The prepared far-leg joints written onto a lower posture. */
  export type Write = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture;

  /** What each crossing reads from its prepared mount. */
  export interface IProps {
    /** The performer and its physical profile. */
    body: IAutoMovieMotionHumanBody;

    /** The airborne leg crossing the seat. */
    side: AutoMovieHumanSide;

    /** The original floor liftoff. */
    start: number;

    /** End of the correction at the leading leg's material support. */
    end: number;

    /** Authored phase changes on the same clock. */
    events: readonly number[];

    /** The lower posture whose support and root remain authoritative. */
    read: Read;

    /** The actual seat model in its frame at an action second. */
    solid(seconds: number): IAutoMovieMotionHumanSeated.IStaticSolid;

    /** The floor beyond the departing sole. */
    floor: number;
  }
}
