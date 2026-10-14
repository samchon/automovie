import {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieCameraClearanceFinding,
  IAutoMovieCameraClearanceReport,
  IAutoMovieCameraClearanceSphere,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleTimes } from "../motion/sampleTimes";
import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * An inclusive world-space axis-aligned box, in metres.
 *
 * @author Samchon
 */
interface IBox {
  /** Smallest corner. */
  min: IAutoMovieVector3;

  /** Largest corner. */
  max: IAutoMovieVector3;
}

/**
 * One current world-space obstacle bound at one fixed-clock instant.
 *
 * @author Samchon
 */
interface IAutoMovieCameraClearanceObstacleState {
  /** Stable resolved scene-node identity. */
  node: string;

  /** Inclusive world-space box holding the obstacle at this instant. */
  bounds: IBox;
}

/**
 * Camera and obstacle state read at one fixed-clock instant.
 *
 * @author Samchon
 */
interface IAutoMovieCameraClearanceSample {
  /** Shot-local sample time in seconds. */
  time: number;

  /** Resolved camera transform at this exact instant. */
  camera: IAutoMovieTransform;

  /** Every current resolved obstacle at this exact instant. */
  obstacles: IAutoMovieCameraClearanceObstacleState[];
}

/**
 * Complete deterministic input for one camera take.
 *
 * @author Samchon
 */
interface IAutoMovieCameraClearanceEvaluation {
  /** Resolved camera identity. */
  camera: string;

  /** Camera-local body and optional parent-rig envelope. */
  envelope: IAutoMovieCameraClearanceEnvelope;

  /** Geometry revision from which the obstacle states were read. */
  revision: string;

  /** Geometry revision that remains current at evaluation time. */
  currentRevision: string;

  /** Endpoint-inclusive fixed-clock samples per second. */
  sampleRate: number;

  /** Shot duration in seconds. */
  duration: number;

  /** State at every base fixed-clock and additional causal-key instant. */
  samples: IAutoMovieCameraClearanceSample[];
}

/** Reject a non-finite coordinate or an inverted box. */
function assertBox (box: IBox, path: string): void {
  const coordinates: number[] = [
    box.min.x,
    box.min.y,
    box.min.z,
    box.max.x,
    box.max.y,
    box.max.z,
  ];
  if (!coordinates.every(Number.isFinite))
    throw new Error(`${path} must contain finite coordinates`);
  if (box.min.x > box.max.x || box.min.y > box.max.y || box.min.z > box.max.z)
    throw new Error(`${path} minimum must not exceed maximum`);
}

/** The smallest box holding both endpoint boxes of one obstacle. */
function unionBoxes (first: IBox, second: IBox): IBox { return ({
  min: {
    x: Math.min(first.min.x, second.min.x),
    y: Math.min(first.min.y, second.min.y),
    z: Math.min(first.min.z, second.min.z),
  },
  max: {
    x: Math.max(first.max.x, second.max.x),
    y: Math.max(first.max.y, second.max.y),
    z: Math.max(first.max.z, second.max.z),
  },
}); }

/**
 * Grow a box by a radius on every side, the box a sphere centre must enter to touch it; this over-covers the rounded corners, which keeps it conservative.
 */
function inflateBox (box: IBox, radius: number): IBox { return ({
  min: {
    x: box.min.x - radius,
    y: box.min.y - radius,
    z: box.min.z - radius,
  },
  max: {
    x: box.max.x + radius,
    y: box.max.y + radius,
    z: box.max.z + radius,
  },
}); }

/**
 * Inclusive segment/box slab test. Equality is collision: a camera body that merely touches a wall or support has no physical clearance.
 */
function segmentIntersectsBox (
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
  box: IBox,
): boolean {
  let lower: number = 0;
  let upper: number = 1;
  for (const axis of ["x", "y", "z"] as const) {
    const delta: number = end[axis] - start[axis];
    if (delta === 0) {
      if (start[axis] < box.min[axis] || start[axis] > box.max[axis])
        return false;
      continue;
    }
    const first: number = (box.min[axis] - start[axis]) / delta;
    const second: number = (box.max[axis] - start[axis]) / delta;
    lower = Math.max(lower, Math.min(first, second));
    upper = Math.min(upper, Math.max(first, second));
    if (lower > upper) return false;
  }
  return true;
}

/** Camera-local sphere centre carried into one resolved camera state. */
function sphereCenter (
  transform: IAutoMovieTransform,
  center: IAutoMovieVector3,
): IAutoMovieVector3 { return Vector3.add(
    transform.translation,
    Quaternion.rotateVector(transform.rotation, {
      x: center.x * transform.scale.x,
      y: center.y * transform.scale.y,
      z: center.z * transform.scale.z,
    }),
  ); }

/**
 * Extra radius covering the arc a rotated local centre sweeps between two camera states: the sagitta `r(1 - cos(θ/2))` of the shortest-path rotation angle `θ`, which is the largest gap between a constant-speed arc point and the chord point at the same interval fraction.
 */
function rotationArcMargin (
  first: IAutoMovieTransform,
  second: IAutoMovieTransform,
  center: IAutoMovieVector3,
): number {
  const a: IAutoMovieQuaternion = Quaternion.normalize(first.rotation);
  const b: IAutoMovieQuaternion = Quaternion.normalize(second.rotation);
  const dot: number = Math.min(
    1,
    Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w),
  );
  const angle: number = 2 * Math.acos(dot);
  const maximumOffset: number = Math.max(
    Vector3.length({
      x: center.x * first.scale.x,
      y: center.y * first.scale.y,
      z: center.z * first.scale.z,
    }),
    Vector3.length({
      x: center.x * second.scale.x,
      y: center.y * second.scale.y,
      z: center.z * second.scale.z,
    }),
  );
  return maximumOffset * (1 - Math.cos(angle / 2));
}

/** Map a sample's obstacles by id, refusing a repeated id or a bad box. */
function obstaclesByNode (
  sample: IAutoMovieCameraClearanceSample,
  sampleIndex: number,
): Map<string, IBox> {
  const result: Map<string, IBox> = new Map();
  sample.obstacles.forEach(
    (
      obstacle: IAutoMovieCameraClearanceObstacleState,
      obstacleIndex: number,
    ): void => {
      if (result.has(obstacle.node))
        throw new Error(
          `$input.samples[${sampleIndex}].obstacles[${obstacleIndex}].node duplicates "${obstacle.node}"`,
        );
      assertBox(
        obstacle.bounds,
        `$input.samples[${sampleIndex}].obstacles[${obstacleIndex}].bounds`,
      );
      result.set(obstacle.node, obstacle.bounds);
    },
  );
  return result;
}

/**
 * Sweep one camera take's body and optional parent-rig spheres over every adjacent pair of samples and report each contact with each obstacle.
 *
 * For each interval, each sphere's centre travels the segment between its two transformed positions, its radius grows by the camera's largest absolute scale component and by the sagitta of the arc the centre sweeps under the interval's shortest-path rotation, and that capsule is tested against each obstacle's union of its two endpoint boxes. Touching counts as contact. A single sample is tested as a stationary sphere. A revision mismatch returns a `stale` report with no samples before any geometry is read.
 *
 * The capsule bound assumes linear camera translation, constant camera scale, constant-speed slerp rotation and obstacles contained by their endpoint-box union. The compiler refines keys and keeps staged camera scale, but the sampler uses normalized lerp below about 3.6 degrees; its deviation is not covered by the slerp sagitta. Direct callers must also supply the constant-scale and endpoint-containment premises. Floating geometry remains numerical, without pixel observation.
 *
 * Findings are ordered by interval, then body before parent rig, then obstacle id in UTF-16 code-unit order, so every host reports the same sequence.
 *
 * @param input - Complete current-revision camera and obstacle sample plan.
 * @returns The take's report: `clear` with no findings, `blocked` with each
 * contact's part, obstacle and inclusive interval, or `stale`.
 * @throws Error when the sample rate or duration is invalid, when the samples
 * omit a fixed-clock instant, leave `[0, duration]` or are not strictly increasing, or when a box is non-finite or inverted, an obstacle id repeats within a sample, or the obstacle id set changes between samples.
 *
 * @evidence contracts/common.md#principled-implementation Uses an inclusive slab test for a swept-sphere capsule against an inflated box; r(1-cos(theta/2)) bounds a constant-speed rotation arc's chord deviation under fixed camera scale. Linear translation and endpoint-contained obstacles are additional premises. Normalized-lerp deviation and unconstrained direct-call scale changes are not certified by that sagitta.
 * @evidence contracts/common.md#clear-and-simple-design One pure evaluator over an explicit sample plan, with box, slab and arc helpers private to it; reading shots, models and violation paths belongs to `compileCameraClearanceReports`, so this function can be checked on hand-built samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no camera or obstacle; malformed plans throw instead of being repaired, contact at exact equality blocks rather than being forgiven by a tolerance, and obstacle order uses the shared `compareCodeUnits` rather than the host locale.
 * @evidence contracts/common.md#meaningful-documentation States the sweep, the radius terms, the contact rule, the single-sample and stale cases, the premises and their limitation, the finding order, the report states and every thrown condition.
 * @evidence contracts/performance.md#efficient-algorithms After sorting obstacle ids and building per-sample maps, visits each interval, sphere part and obstacle with one constant-size slab test. This is O(intervals × parts × obstacles) plus indexing/sort costs; no small obstacle population or measured acceleration comparison is assumed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one take's plan; sharing obstacle states across takes is done by the clearance compiler before calling it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing after return; the per-sample obstacle maps, bounded by samples times obstacles, are locals, and the returned report copies the sample times and holds only its findings.
 */
export function evaluateCameraClearance(
  input: IAutoMovieCameraClearanceEvaluation,
): IAutoMovieCameraClearanceReport {
  if (!(Number.isFinite(input.sampleRate) && input.sampleRate > 0))
    throw new Error("$input.sampleRate must be finite and greater than zero");
  if (!(Number.isFinite(input.duration) && input.duration >= 0))
    throw new Error("$input.duration must be finite and non-negative");

  if (input.revision !== input.currentRevision)
    return {
      camera: input.camera,
      sampleRate: input.sampleRate,
      sampleTimes: [],
      intervals: 0,
      status: "stale",
      findings: [],
    };

  const fixedTimes: number[] = sampleTimes(input.duration, input.sampleRate);
  const suppliedTimes: number[] = input.samples.map(
    (sample: IAutoMovieCameraClearanceSample): number => sample.time,
  );
  const suppliedTimeSet: Set<number> = new Set(suppliedTimes);
  if (
    suppliedTimes.some(
      (time: number): boolean =>
        !Number.isFinite(time) || time < 0 || time > input.duration,
    ) ||
    suppliedTimes.some(
      (time: number, index: number): boolean =>
        index > 0 && time <= suppliedTimes[index - 1]!,
    ) ||
    fixedTimes.some((time: number): boolean => !suppliedTimeSet.has(time))
  )
    throw new Error(
      "$input.samples must contain every endpoint-inclusive fixed-clock instant in strict time order; additional causal instants are allowed",
    );

  const obstacleMaps: Map<string, IBox>[] = input.samples.map(obstaclesByNode);
  for (let index: number = 1; index < obstacleMaps.length; index++) {
    const previous: Map<string, IBox> = obstacleMaps[index - 1]!;
    const current: Map<string, IBox> = obstacleMaps[index]!;
    if (
      previous.size !== current.size ||
      [...previous.keys()].some((node: string): boolean => !current.has(node))
    )
      throw new Error(
        `$input.samples[${index}].obstacles must preserve the current resolved identity set`,
      );
  }
  const nodes: string[] = [...obstacleMaps[0]!.keys()].sort(compareCodeUnits);
  const parts: Array<
    readonly [
      IAutoMovieCameraClearanceFinding["part"],
      IAutoMovieCameraClearanceSphere,
    ]
  > =
    input.envelope.parentRig === null
      ? [["body", input.envelope.body]]
      : [
          ["body", input.envelope.body],
          ["parent-rig", input.envelope.parentRig],
        ];

  const findings: IAutoMovieCameraClearanceFinding[] = [];
  for (
    let index: number = input.samples.length === 1 ? 0 : 1;
    index < input.samples.length;
    index++
  ) {
    const previous: number = Math.max(0, index - 1);
    const first: IAutoMovieCameraClearanceSample = input.samples[previous]!;
    const second: IAutoMovieCameraClearanceSample = input.samples[index]!;
    const scale: number = Math.max(
      Math.abs(first.camera.scale.x),
      Math.abs(first.camera.scale.y),
      Math.abs(first.camera.scale.z),
      Math.abs(second.camera.scale.x),
      Math.abs(second.camera.scale.y),
      Math.abs(second.camera.scale.z),
    );
    for (const [part, sphere] of parts) {
      const start: IAutoMovieVector3 = sphereCenter(first.camera, sphere.center);
      const end: IAutoMovieVector3 = sphereCenter(second.camera, sphere.center);
      const radius: number =
        sphere.radius * scale +
        rotationArcMargin(first.camera, second.camera, sphere.center);
      for (const node of nodes) {
        const obstacle: IBox = unionBoxes(
          obstacleMaps[previous]!.get(node)!,
          obstacleMaps[index]!.get(node)!,
        );
        if (segmentIntersectsBox(start, end, inflateBox(obstacle, radius)))
          findings.push({
            part,
            obstacle: node,
            start: first.time,
            end: second.time,
          });
      }
    }
  }

  return {
    camera: input.camera,
    sampleRate: input.sampleRate,
    sampleTimes: suppliedTimes,
    intervals: Math.max(0, input.samples.length - 1),
    status: findings.length === 0 ? "clear" : "blocked",
    findings,
  };
}
