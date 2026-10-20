import {
  AutoMovieHumanoidBone,
  IAutoMovieBody,
  IAutoMovieBone,
  IAutoMovieCapsuleProxy,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { resolvePose } from "../kinematics/resolvePose";
import { IAutoMovieClosestSegmentPoints } from "../math/IAutoMovieClosestSegmentPoints";
import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";
import { sampleMotion } from "../motion/sampleMotion";
import { sampleTimes } from "../motion/sampleTimes";
import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";
import { suggestCollisionResponse } from "../physics/suggestCollisionResponse";
import { IAutoMovieBodyCollisionResult } from "./IAutoMovieBodyCollisionResult";
import { IAutoMovieCollisionActor } from "./IAutoMovieCollisionActor";
import { ViolationCollector } from "./ViolationCollector";
import { fkReachableBones } from "./fkReachableBones";
import { validateCapsule } from "./validateCapsule";

const DEFAULT_SAMPLE_RATE: number = 24;

const DEFAULT_MASS: number = 70; // kg: an unspecified body defaults to a human mass

const DEFAULT_RESTITUTION: number = 0.2;

const DEFAULT_HARDNESS: number = 0.5;

const DEFAULT_PENETRABILITY: number = 0.3;

const DEFAULT_GAIN: number = 0.05; // recoil flexion degrees per unit impulse

const FALLBACK_NORMAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

interface IPenetration {
  frame: number;
  time: number;
  from: AutoMovieHumanoidBone;
  otherFrom: AutoMovieHumanoidBone;
  depth: number;
  pointA: IAutoMovieVector3;
  pointB: IAutoMovieVector3;
}

/**
 * Sample two capsule-proxy actors and return overlap advice, contact events and an optional response.
 *
 * @evidence contracts/common.md#principled-implementation Finite positive sample rate and canonical reachable-capsule admission precede endpoint-inclusive pose sampling; every capsule pair uses shared closest-segment distance and strict summed-radius penetration, then one deepest contact seeds the response.
 * @evidence contracts/common.md#clear-and-simple-design Pose/FK, distance and impact-response owners remain shared, while this detector owns sampled cross-body population and warning/event correspondence; runtime repository consumers are portable tests rather than an installed film collision host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid capsules return structural findings before sampling, and physicsIntent suppresses advice while preserving contacts. Sampling is not continuous collision proof; final truncated-interval velocity still multiplies displacement by nominal rate, and derived numeric failures can propagate.
 * @evidence contracts/common.md#meaningful-documentation States sample-clock scope, shortest actor duration, default response-body quantities, strict penetration, deepest tie order and uncorrected final-interval velocity approximation.
 * @evidence contracts/performance.md#efficient-algorithms For F frames, J resolved bones and A/B capsules, pose maps cost O(F*J), pair checks O(F*A*B), and deepest-contact sorting O(E log E) for E penetrations; storage is O(F*J+E).
 * @evidence contracts/performance.md#reuse-equivalent-work Each actor pose resolves once per frame and its map serves all capsule pairs; one retained penetration list supplies events, warnings and deepest response without a cross-call motion cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local pose maps and penetration rows are discarded; fresh events, validation and response transfer to the caller without retaining sampled poses or owning a physics/render task.
 */
export const detectBodyCollision: (props: {
  a: IAutoMovieCollisionActor;
  b: IAutoMovieCollisionActor;
  sampleRate?: number | undefined;
  physicsIntent?: string | undefined;
  gainDegPerImpulse?: number | undefined;
  path?: string | undefined;
}) => IAutoMovieBodyCollisionResult = (props: {
  a: IAutoMovieCollisionActor;
  b: IAutoMovieCollisionActor;
  sampleRate?: number;
  physicsIntent?: string;
  gainDegPerImpulse?: number;
  path?: string;
}): IAutoMovieBodyCollisionResult => {
  const collector: ViolationCollector = new ViolationCollector();
  const path: string = props.path ?? "$input";
  const sampleRate: number =
    props.sampleRate === undefined ? DEFAULT_SAMPLE_RATE : props.sampleRate;
  const gain: number =
    props.gainDegPerImpulse === undefined
      ? DEFAULT_GAIN
      : props.gainDegPerImpulse;
  const suppressed: boolean = props.physicsIntent !== undefined;

  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    collector.push(
      "range",
      `${path}.sampleRate`,
      `sampleRate must be a finite number > 0, but was ${sampleRate}`,
      sampleRate,
    );
    return { validation: collector.toValidation(), events: [], response: null };
  }

  // Validate every capsule against its actor's rig before sampling, the same
  // precondition validateSelfIntersection enforces on itself. A malformed
  // capsule (bone not on the rig, FK-unreachable, non-distinct endpoints, bad
  // radius) resolves to an undefined world position and a NaN distance (or
  // crashes outright, #1056), and `NaN < minimum` is false, so an unguarded
  // run would drop the overlap in silence. These are structural errors, not
  // physics warnings: return before sampling.
  const topologyA: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.a.skeleton,
  );
  const topologyB: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.b.skeleton,
  );
  const capsulesValid: boolean = [
    validateActorCapsules(props.a, `${path}.a`, topologyA, collector),
    validateActorCapsules(props.b, `${path}.b`, topologyB, collector),
  ].every(Boolean);
  if (!capsulesValid)
    return { validation: collector.toValidation(), events: [], response: null };

  const duration: number = Math.min(
    props.a.motion.duration,
    props.b.motion.duration,
  );
  const times: number[] = sampleTimes(duration, sampleRate);
  const mapsA: Map<AutoMovieHumanoidBone, IAutoMovieVector3>[] = times.map(
    (time: number): Map<AutoMovieHumanoidBone, IAutoMovieVector3> =>
      resolveMap(props.a, time, topologyA),
  );
  const mapsB: Map<AutoMovieHumanoidBone, IAutoMovieVector3>[] = times.map(
    (time: number): Map<AutoMovieHumanoidBone, IAutoMovieVector3> =>
      resolveMap(props.b, time, topologyB),
  );

  const penetrations: IPenetration[] = [];
  times.forEach((time: number, frame: number): void => {
    props.a.capsules.forEach((ca: IAutoMovieCapsuleProxy): void => {
      props.b.capsules.forEach((cb: IAutoMovieCapsuleProxy): void => {
        const closest: IAutoMovieClosestSegmentPoints =
          closestPointsBetweenSegments(
            mapsA[frame]!.get(ca.from)!,
            mapsA[frame]!.get(ca.to)!,
            mapsB[frame]!.get(cb.from)!,
            mapsB[frame]!.get(cb.to)!,
          );
        const minimum: number = ca.radius + cb.radius;
        if (closest.distance < minimum)
          penetrations.push({
            frame,
            time,
            from: ca.from,
            otherFrom: cb.from,
            depth: minimum - closest.distance,
            pointA: closest.pointA,
            pointB: closest.pointB,
          });
      });
    });
  });

  const events: IAutoMovieInteractionEvent[] = penetrations.map(
    (
      pen: IPenetration,
      i: number,
    ): {
      id: string;
      kind: "contact";
      source: "sampledProximity";
      time: number;
      actor: string;
      target: string;
      object: null;
      point: IAutoMovieVector3;
      actionIndex: null;
      reaction: null;
    } => ({
      id: `contact:${i}`,
      kind: "contact",
      source: "sampledProximity",
      time: pen.time,
      actor: props.a.node,
      target: props.b.node,
      object: null,
      point: Vector3.scale(Vector3.add(pen.pointA, pen.pointB), 0.5),
      actionIndex: null,
      reaction: null,
    }),
  );

  if (suppressed || penetrations.length === 0)
    return { validation: collector.toValidation(), events, response: null };

  penetrations.forEach((pen: IPenetration, i: number): void => {
    collector.warn(
      "physics",
      `${path}.contacts[${i}].distance`,
      `bodies "${props.a.node}" and "${props.b.node}" overlap by ${round(pen.depth)}m at t=${round(pen.time)}s`,
      pen.depth,
      pen.depth,
    );
  });

  const response: IAutoMovieCollisionResponse = suggestResponse(
    props,
    penetrations,
    sampleRate,
    mapsA,
    mapsB,
    gain,
  );
  return { validation: collector.toValidation(), events, response };
};

/**
 * Validate every capsule of one actor against its own rig, one violation per
 * fault (all capsules are checked so a correction round sees them together).
 * Returns whether the actor's capsules are all usable.
 */
const validateActorCapsules: (
  actor: IAutoMovieCollisionActor,
  path: string,
  topology: IAutoMovieSkeletonTopology,
  collector: ViolationCollector,
) => boolean = (
  actor: IAutoMovieCollisionActor,
  path: string,
  topology: IAutoMovieSkeletonTopology,
  collector: ViolationCollector,
): boolean => {
  const bones: Set<AutoMovieHumanoidBone> = new Set(
    actor.skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const reachable: Set<AutoMovieHumanoidBone> = fkReachableBones(
    actor.skeleton,
    topology,
  );
  let valid: boolean = true;
  actor.capsules.forEach(
    (capsule: IAutoMovieCapsuleProxy, index: number): void => {
      if (
        !validateCapsule(
          capsule,
          `${path}.capsules[${index}]`,
          bones,
          reachable,
          collector,
        )
      )
        valid = false;
    },
  );
  return valid;
};

const suggestResponse: (
  props: { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor },
  penetrations: IPenetration[],
  rate: number,
  mapsA: readonly ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>[],
  mapsB: readonly ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>[],
  gain: number,
) => IAutoMovieCollisionResponse = (
  props: {
    a: IAutoMovieCollisionActor;
    b: IAutoMovieCollisionActor;
  },
  penetrations: IPenetration[],
  rate: number,
  mapsA: ReadonlyArray<ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>>,
  mapsB: ReadonlyArray<ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>>,
  gain: number,
): IAutoMovieCollisionResponse => {
  const deepest: IPenetration = [...penetrations].sort(
    (x: IPenetration, y: IPenetration): number => y.depth - x.depth,
  )[0]!;
  const prev: number = Math.max(0, deepest.frame - 1);
  const velA: IAutoMovieVector3 = velocity(
    mapsA,
    deepest.frame,
    prev,
    deepest.from,
    rate,
  );
  const velB: IAutoMovieVector3 = velocity(
    mapsB,
    deepest.frame,
    prev,
    deepest.otherFrom,
    rate,
  );

  const rawNormal: IAutoMovieVector3 = Vector3.subtract(
    deepest.pointB,
    deepest.pointA,
  );
  const normal: IAutoMovieVector3 =
    Vector3.dot(rawNormal, rawNormal) > 0 ? rawNormal : FALLBACK_NORMAL;

  return suggestCollisionResponse({
    a: impactBody(props.a.body, velA),
    b: impactBody(props.b.body, velB),
    normal,
    gainDegPerImpulse: gain,
    chain: [deepest.otherFrom],
    skeleton: props.b.skeleton,
  });
};

const velocity: (
  maps: readonly ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>[],
  frame: number,
  prev: number,
  bone: AutoMovieHumanoidBone,
  rate: number,
) => IAutoMovieVector3 = (
  maps: ReadonlyArray<ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>>,
  frame: number,
  prev: number,
  bone: AutoMovieHumanoidBone,
  rate: number,
): IAutoMovieVector3 =>
  Vector3.scale(
    Vector3.subtract(maps[frame]!.get(bone)!, maps[prev]!.get(bone)!),
    rate,
  );

const impactBody: (
  body: IAutoMovieBody | null,
  vel: IAutoMovieVector3,
) => {
  mass: number;
  velocity: IAutoMovieVector3;
  restitution: number;
  hardness: number;
  penetrability: number;
} = (
  body: IAutoMovieBody | null,
  vel: IAutoMovieVector3,
): {
  mass: number;
  velocity: IAutoMovieVector3;
  restitution: number;
  hardness: number;
  penetrability: number;
} => ({
  mass: body === null ? DEFAULT_MASS : body.mass,
  velocity: vel,
  restitution: body === null ? DEFAULT_RESTITUTION : body.restitution,
  hardness: DEFAULT_HARDNESS,
  penetrability: DEFAULT_PENETRABILITY,
});

const resolveMap: (
  actor: IAutoMovieCollisionActor,
  time: number,
  topology: IAutoMovieSkeletonTopology,
) => Map<AutoMovieHumanoidBone, IAutoMovieVector3> = (
  actor: IAutoMovieCollisionActor,
  time: number,
  topology: IAutoMovieSkeletonTopology,
): Map<AutoMovieHumanoidBone, IAutoMovieVector3> =>
  new Map(
    resolvePose(
      sampleMotion(actor.motion, time).pose,
      actor.skeleton,
      actor.jointAxes,
      actor.restFrames,
      topology,
    ).map(
      (
        bone: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieVector3] => [
        bone.bone,
        bone.worldPosition,
      ],
    ),
  );

const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
