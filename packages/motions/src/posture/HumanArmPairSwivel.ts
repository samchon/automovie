import { Quaternion, ROM_TOLERANCE, Vector3, physicalShapeNormal } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes } from "./HumanArmShapes";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

type Angles = readonly [number, number];
type Arm = IAutoMovieMotionHumanArmGeometry.IPlaced;
type OptionalStep = Angles | undefined;
interface IResult {
  x: number[][][];
  evaluation: M.IEvaluation;
}
type OptionalPath = IResult | undefined;
interface IPlane {
  x: number;
  y: number;
  gap: number;
}

/** Nearest point to the origin in a two-dimensional intersection of half-planes. */
function nearest(planes: readonly IPlane[]): OptionalStep {
  let best: OptionalStep;
  let distance: number = Infinity;
  const consider = (x: number, y: number): void => {
    const norm: number = Math.hypot(x, y);
    if (!(norm < distance)) return;
    for (const plane of planes) {
      const left: number = plane.x * x;
      const right: number = plane.y * y;
      const error: number = Number.EPSILON * (Math.abs(left) + Math.abs(right) + plane.gap);
      if (left + right < plane.gap - error) return;
    }
    best = [x, y];
    distance = norm;
  };
  for (let i: number = 0; i < planes.length; ++i) {
    const p: IPlane = planes[i]!;
    const norm: number = p.x * p.x + p.y * p.y;
    if (norm === 0) return undefined;
    consider(p.x * p.gap / norm, p.y * p.gap / norm);
    for (let j: number = 0; j < i; ++j) {
      const q: IPlane = planes[j]!;
      const det: number = p.x * q.y - p.y * q.x;
      if (det !== 0)
        consider((p.gap * q.y - p.y * q.gap) / det, (p.x * q.gap - p.gap * q.x) / det);
    }
  }
  return best;
}

/** Signed clearance derivative for a rigid arm swivelling about its fixed wrist line, metres/radian. */
function speed(axis: IAutoMovieVector3, arm: Arm, point: IAutoMovieVector3, normal: IAutoMovieVector3): number {
  return Vector3.dot(normal, Vector3.cross(axis, Vector3.subtract(point, arm.shoulder)));
}

/**
 * Separate two mutually obstructing planted wrist chains on their two swivel circles.
 * The nearest tangent correction is just a proposal. Every accepted pose satisfies
 * the complete original native predicate after the unchanged ROM projection.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The shoulder-to-wrist axis leaves its wrist fixed (Tolani, Goswami and Badler 2000, section 3.2). The signed distance derivative subtracts the obstacle's rigid velocity from the probe's velocity along the native surface normal. A two-dimensional quadratic minimum is on a face or at the intersection of two faces.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only actual violating collider witnesses generate planes. The unchanged full model validates each correction; no previous frame, clearance proxy or assumed carrier periodicity supplies a result.
 */
export function HumanArmPairSwivel(c: M.IContext, start: number[][][], initial: M.IEvaluation): OptionalPath {
  let path: number[][][] = start;
  let reading: M.IEvaluation = initial;
  const k: number = initial.worst.at;
  while (reading.worst.value > M.TOLERANCE &&
      (reading.worst.term === "crossing" || reading.worst.term === "probe")) {
    const arms: Arm[] = reading.placed.map((frames: Arm[]): Arm => frames[k]!);
    const axes: IAutoMovieVector3[] = arms.map((arm: Arm): IAutoMovieVector3 =>
      Vector3.normalize(Vector3.subtract(arm.wrist, arm.shoulder)));
    const planes: IPlane[] = [];
    for (const hit of reading.crossing[k]!.values()) {
      if (hit.short <= T.SKIN) continue;
      const point: IAutoMovieVector3 = arms[hit.a]!.probes[hit.probe]![0];
      const normal: IAutoMovieVector3 = physicalShapeNormal(hit.shape.pose, hit.shape.shape,
        point, Vector3.normalize(Vector3.subtract(point, hit.shape.centre)));
      const direction: number = hit.a === 0 ? 1 : -1;
      planes.push({
        x: direction * speed(axes[0]!, arms[0]!, point, normal),
        y: -direction * speed(axes[1]!, arms[1]!, point, normal),
        gap: (hit.short - T.SKIN) / 1000,
      });
    }
    for (const [a, arm] of arms.entries()) {
      for (const hit of reading.pairs[a]![k]!.deepest.values()) {
        if (hit.short <= T.SKIN) continue;
        const point: IAutoMovieVector3 = arm.probes[hit.probe]![0];
        const normal: IAutoMovieVector3 = HumanArmShapes.normal(c.frames[a]![k]!, hit.shape, point);
        const v: number = speed(axes[a]!, arm, point, normal);
        planes.push({ x: a === 0 ? v : 0, y: a === 1 ? v : 0, gap: (hit.short - T.SKIN) / 1000 });
      }
    }
    const delta: OptionalStep = nearest(planes);
    if (!delta) return undefined;
    const trial: number[][][] = path.map((frames: number[][], a: number): number[][] => {
      const setup: IAutoMovieMotionHumanArmGeometry.ISetup = c.setups[a]!;
      const parent: IAutoMovieQuaternion = Quaternion.multiply(c.frames[a]![k]!.parent.rotation, setup.rest.upper.rotation);
      const applied: IAutoMovieQuaternion = Quaternion.fromAxisAngle(axes[a]!, delta[a]! / Quaternion.DEG2RAD);
      const local: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(parent), Quaternion.multiply(applied, arms[a]!.upper));
      const next: number[][] = frames.slice();
      next[k] = M.ranged(c, a, G.encode(setup, G.arm(setup, frames[k]!, local)));
      return next;
    });
    const next: M.IEvaluation = M.evaluate(c, trial);
    if (next.worst.value <= M.TOLERANCE) return { x: trial, evaluation: next };
    if (!(next.worst.value < reading.worst.value) ||
        Math.max(Math.abs(delta[0]), Math.abs(delta[1])) <= ROM_TOLERANCE * Quaternion.DEG2RAD)
      return undefined;
    path = trial;
    reading = next;
  }
  return undefined;
}
