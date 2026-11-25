import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  getConstraint,
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
import { boundMountKnotJets } from "./boundMountKnotJets";
import { crutchHeldLeg } from "./crutchHeldLeg";

/** One model collider placed in the actor's profile frame. */
type Placed = IAutoMovieMotionHumanColliders.IPlaced;
/** The clinical coordinates of one fitted leg. */
type Coordinates = readonly number[];

/** Proximal flexion/abduction and unloaded knee flexion in a leg tuple. */
const CONTROLLED: readonly number[] = [0, 1, 3];

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
  const hipRange = getConstraint(hip, body.bones.get(hip)?.constraint ?? null);
  const kneeRange = getConstraint(
    shin,
    body.bones.get(shin)?.constraint ?? null,
  );
  if (
    own < 0 ||
    other < 0 ||
    hipRange === null ||
    hipRange.flexion === null ||
    hipRange.abduction === null ||
    kneeRange === null ||
    kneeRange.flexion === null
  )
    return identity;
  const freeRanges = [hipRange.flexion, hipRange.abduction, kneeRange.flexion];
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
    const knee = placed.get(shin)!;
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
    const kneeInverse = Quaternion.inverse(knee.worldRotation);
    const kneeParent = Quaternion.multiply(
      knee.worldRotation,
      Quaternion.inverse(
        codec.rotation(shin, [original[3]!, original[4]!, original[5]!]),
      ),
    );
    const shift = (
      turn: IAutoMovieQuaternion,
      pivot: IAutoMovieVector3,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        pivot,
        Quaternion.rotateVector(turn, Vector3.subtract(point, pivot)),
      );
    const compound = (angles: Coordinates) => {
      const hipTurn = Quaternion.multiply(
        Quaternion.multiply(
          parent,
          codec.rotation(hip, [angles[0]!, angles[1]!, original[2]!]),
        ),
        inverse,
      );
      const kneeTurn = Quaternion.multiply(
        Quaternion.multiply(
          kneeParent,
          codec.rotation(shin, [angles[2]!, original[4]!, original[5]!]),
        ),
        kneeInverse,
      );
      const point = (world: IAutoMovieVector3): IAutoMovieVector3 =>
        shift(hipTurn, origin, shift(kneeTurn, knee.worldPosition, world));
      const rotation = Quaternion.multiply(hipTurn, kneeTurn);
      const collider = (placed: Placed): Placed => ({
        ...placed,
        pose: {
          position: point(placed.pose.position),
          rotation: Quaternion.multiply(rotation, placed.pose.rotation),
        },
      });
      return { point, collider };
    };
    const reading = (angles: Coordinates): Coordinates => {
      const warped = compound(angles);
      const shank = warped.collider(far);
      const largest = (probe: Float64Array, allowed: Float64Array): number =>
        probe.reduce((max, value, k) => Math.max(max, value - allowed[k]!), 0);
      const primary = largest(Tangle.depths(part.probes, shank, fixed), beyond);
      const secondary = largest(
        Tangle.depths(peer.probes, fixed, shank),
        reversed,
      );
      let contact = Infinity;
      for (const frame of free) {
        const segment = frame === far ? shank : warped.collider(frame);
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
      const ground = Math.min(...sole.map((point) => warped.point(point).y));
      return [
        primary - margin,
        secondary - margin,
        -Math.min(margin, contact),
        floor - ground,
      ];
    };
    return { original, reading };
  };
  // Match the existing arm-course clock's nanosecond coalescing, keeping
  // the mount's authored event when a uniform waypoint rounds beside it.
  const events = [...new Set([start, ...props.events, end])].filter(
    (time) => time >= start && time <= end,
  );
  const times = [
    ...events,
    ...crutchHeldLeg
      .timesteps(start, end)
      .filter(
        (time) =>
          time > start &&
          time < end &&
          events.every((event) => Math.abs(event - time) > 1e-9),
      ),
  ].sort((a, b) => a - b);
  const desired = times.map((time) =>
    joints(resolveHumanPosture(body, read(time))),
  );
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
  const bounded = boundMountKnotJets({
    times,
    positions: desired,
    jets,
    limits,
  });
  const boundary = (i: number): HumanQuinticSegment.IBoundary => ({
    position: desired[i]!,
    velocity: bounded.velocities[i]!,
    acceleration: bounded.accelerations[i]!,
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
  const segmentAt = (t: number): number => {
    let low = 0;
    let high = times.length - 1;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (times[middle]! <= t) low = middle;
      else high = middle;
    }
    return low;
  };
  const reference = (t: number): number[] => {
    const i = segmentAt(t);
    return HumanQuinticSegment.position(segments[i]!, t - times[i]!);
  };
  const count = times.length - 2;
  const rad = Quaternion.DEG2RAD;
  const controls = CONTROLLED.length;
  const seed = desired
    .slice(1, -1)
    .flatMap((row) => CONTROLLED.map((axis) => row[axis]! * rad));
  const lo = freeRanges.map((range) => range.min * rad);
  const hi = freeRanges.map((range) => range.max * rad);
  // Convert angular violations to an upper bound on end-effector displacement,
  // then express every row in units of the same material allowance.
  const lever = body.measure.thigh + body.measure.shank;
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
  const correction = (
    x: Coordinates,
    knot: number,
    control: number,
  ): number => {
    if (knot === 0 || knot === times.length - 1) return 0;
    const i = controls * (knot - 1) + control;
    return (x[i]! - seed[i]!) / rad;
  };
  const activeAt = (
    x: Coordinates,
    knot: number,
    share: number,
    angles: Coordinates,
  ): number[] =>
    CONTROLLED.map(
      (axis, control) =>
        angles[axis]! +
        (1 - share) * correction(x, knot, control) +
        share * correction(x, knot + 1, control),
    );
  // Minimum-jerk corrections between adjacent via points leave the original
  // velocity and acceleration shared at each knot. The solver reads the
  // actual interpolant, and each row touches only the two adjacent fit knots.
  const probes = times
    .slice(1)
    .flatMap((until, i) => [
      { time: (times[i]! + until) / 2, i, share: 0.5 },
      ...(until === end ? [] : [{ time: until, i, share: 1 }]),
    ]);
  const variablesOf = (interior: number): number[] =>
    CONTROLLED.map((_, control) => controls * interior + control);
  const rows = probes.map(({ time, i, share }) => {
    const coordinates = reference(time);
    const frame = prepare(
      time,
      resolveHumanPosture(body, poseAt(read(time), coordinates)),
    );
    return {
      g: (x: Coordinates): Coordinates => {
        const angles = activeAt(x, i, share, coordinates);
        return [
          ...frame.reading(angles).map((distance) => distance / margin),
          ...angles.flatMap((degrees, control) => {
            const angle = degrees * rad;
            return [
              ((lo[control]! - angle) * lever) / margin,
              ((angle - hi[control]!) * lever) / margin,
            ];
          }),
        ];
      },
      equality: false,
      variables: (share === 1 ? [i + 1] : [i, i + 1]).flatMap((knot) =>
        knot === 0 || knot === times.length - 1 ? [] : variablesOf(knot - 1),
      ),
    };
  });
  const solved = HumanSequentialConvex.minimise(
    Functions.problem({
      low: Array.from({ length: count }, () => lo).flat(),
      high: Array.from({ length: count }, () => hi).flat(),
      costs: Array.from({ length: count }, (_, i) => {
        const variables = variablesOf(i);
        return {
          f: (x: Coordinates): number =>
            variables.reduce((sum, v) => sum + (x[v]! - seed[v]!) ** 2, 0),
          full: false,
          variables,
        };
      }),
      constraints: rows,
    }),
    seed,
    HumanSequentialConvex.DEFAULTS,
  );
  // Check every real extremum of the clinical quintics before publishing
  // them. Native posture projection must not become the path's range guard.
  const finished: HumanQuinticSegment.ISegment[] = segments.map(
    (segment, i) => ({
      duration: segment.duration,
      coefficients: segment.coefficients.map((nominal, axis) => {
        const range = limits[axis];
        if (range === undefined) return nominal;
        const control = CONTROLLED.indexOf(axis);
        const from = control < 0 ? 0 : correction(solved.x, i, control);
        const delta =
          control < 0 ? 0 : correction(solved.x, i + 1, control) - from;
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
        return coefficients;
      }),
    }),
  );
  const write: prepareMountCrossing.Write = (posture, seconds) => {
    if (seconds <= start || seconds >= end) return posture;
    const i = segmentAt(seconds);
    return poseAt(
      posture,
      HumanQuinticSegment.position(finished[i]!, seconds - times[i]!),
    );
  };
  const admit = (time: number): Coordinates => {
    const posture = write(read(time), time);
    const pose = resolveHumanPosture(body, posture);
    const frame = prepare(time, pose);
    const tested = frame.reading(
      CONTROLLED.map((axis) => frame.original[axis]!),
    );
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

    /** The far foot's original arrival on its material support. */
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
