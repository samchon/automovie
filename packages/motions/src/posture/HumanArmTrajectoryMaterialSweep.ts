import { Vector3, physicalShapeNearest } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * Find an interior hand-material violation on a free transport beside the
 * body's authored support. Both endpoints must admit the same material pair.
 * A chord in the moving obstacle frame selects a possible encounter second.
 * The reconstructed clinical curve and the body's actual posed digit at that
 * second must also violate the material allowance before the pair gets a row.
 *
 * @param c The original course's setup, samples and authored body reader.
 * @param a The moving arm in the canonical problem.
 * @param k The first waypoint of the free interval.
 * @param from The arm placed at that waypoint.
 * @param to The arm placed at the next waypoint.
 * @param contacts The existing corner-pair readings for this arm.
 * @param coordinates The clinical waypoints used by playback's cubic.
 * @returns Confirmed encounters with their relative-chord correction rows.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the candidate chord, the actual native event and the row admitted by both.
 * @evidence contracts/development/implementation.md#principled-implementation Uses signed relative-chord geometry to select the second, then reconstructs the actual articulated hand and obstacle at that second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The endpoint readings nominate material parts, each part supplies its deepest chord, and its native pose decides whether it contributes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed interior timestamp, body kind or action name participates in selection.
 * @evidence contracts/development/implementation.md#efficient-algorithms Only free intervals and the named own support participate; endpoint margin, relative displacement and enclosing bounds screen corners before exact shape queries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing waypoint pairs and placed arms, the native Hermite interpolator, the authored base reader and the existing convex row formulation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-call part candidates and temporary geometry are released after returning the selected rows.
 */
export function HumanArmTrajectoryMaterialSweep(
  c: M.IContext,
  a: number,
  k: number,
  from: IAutoMovieMotionHumanArmGeometry.IPlaced,
  to: IAutoMovieMotionHumanArmGeometry.IPlaced,
  contacts: M.IEvaluation["pairs"][number],
  coordinates: readonly (readonly number[])[],
): HumanArmTrajectorySweep.ISwept[] {
  const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
  const material: M.IMaterial | undefined = c.material;
  const support: number = material?.parts[a] ?? -1;
  if (
    material === undefined ||
    support < 0 ||
    c.sites[a]![k] !== undefined ||
    c.sites[a]![k + 1] !== undefined
  )
    return [];
  const active: Map<number, P.IPair> = new Map();
  for (const j of [k, k + 1])
    for (const [key, pair] of contacts[j]?.deepest ?? []) {
      if (
        frame.shapes[pair.shape]!.part !== support ||
        pair.short < -P.CUT ||
        frame.owners[pair.probe - G.SURFACE] !== "hand"
      )
        continue;
      if (
        frame.resting.has(frame.shapes[pair.shape]!.part) &&
        c.frames[a]![k + 1]!.resting.has(frame.shapes[pair.shape]!.part)
      )
        continue;
      active.set(key, pair);
    }
  if (active.size === 0) return [];
  const result: HumanArmTrajectorySweep.ISwept[] = [];
  for (const [key, pair] of active) {
    const part: number = frame.segments[pair.probe - G.SURFACE]!;
    const shape = frame.shapes[pair.shape]!;
    const first: number = contacts[k]?.deepest.get(key)?.short ?? Infinity;
    const last: number = contacts[k + 1]?.deepest.get(key)?.short ?? Infinity;
    if (first > T.SKIN + T.TOLERANCE || last > T.SKIN + T.TOLERANCE) continue;
    let worst: number = T.TOLERANCE;
    let witness: HumanArmTrajectorySweep.ISwept | undefined;
    let gap: ReturnType<typeof S.prepareGap> | undefined;
    // HumanArmFrame appends all material corners of each collider together.
    let start: number = pair.probe - G.SURFACE;
    while (start > 0 && frame.segments[start - 1] === part) --start;
    for (let index: number = start; frame.segments[index] === part; ++index) {
      const probe: number = G.SURFACE + index;
      const [point, radius] = from.probes[probe]!;
      const moved = P.relative(c, a, k, pair.shape, to.probes[probe]![0]);
      const travel: number = Vector3.distance(point, moved.point);
      if (
        travel === 0 ||
        Math.min(first, last) + 1000 * travel <= T.SKIN + worst
      )
        continue;
      const lower: number =
        Math.min(
          c.allowed(a, k, probe, pair.shape),
          c.allowed(a, k + 1, probe, pair.shape),
        ) -
        T.SKIN / 1000;
      const centre: IAutoMovieVector3 = Vector3.lerp(point, moved.point, 0.5);
      const margin: number = lower + radius + travel / 2 - worst / 1000;
      if (
        Vector3.distance(centre, shape.centre) - shape.radius > margin ||
        HumanArmShapeBox(shape, centre) > margin
      )
        continue;
      gap ??= S.prepareGap(frame, pair.shape);
      const clear: number = gap(point, moved.point) - radius;
      const short: number = 1000 * (lower - clear);
      if (short > worst) {
        worst = short;
        witness = {
          probe,
          shape: pair.shape,
          to: moved.point,
          turn: moved.turn,
          clear,
          lower,
        };
      }
    }
    if (witness === undefined) continue;
    const [startPoint, radius] = from.probes[witness.probe]!;
    const endPoint: IAutoMovieVector3 = witness.to;
    const nearest = physicalShapeNearest(
      shape.pose,
      shape.shape,
      startPoint,
      endPoint,
    );
    const travel: IAutoMovieVector3 = Vector3.subtract(endPoint, startPoint);
    const u: number =
      Vector3.dot(Vector3.subtract(nearest.at, startPoint), travel) /
      Vector3.dot(travel, travel);
    if (!(u > 0 && u < 1)) continue;
    const seconds: number = c.times[k]! + u * (c.times[k + 1]! - c.times[k]!);
    const actual: IAutoMovieMotionHumanArmGeometry.IFrame = material.frame(
      a,
      seconds,
    );
    const obstacle = actual.shapes[witness.shape];
    if (obstacle?.part !== shape.part || obstacle.bone !== shape.bone) continue;
    const arm: IAutoMovieMotionHumanArmGeometry.IPlaced = G.placed(
      c.setups[a]!,
      actual,
      HumanArmRefine.hermite(c.times, coordinates, seconds),
    );
    const point: IAutoMovieVector3 = arm.probes[witness.probe]![0];
    const clear: number = S.gap(actual, witness.shape, point, point) - radius;
    if (1000 * (witness.lower - clear) > T.TOLERANCE) result.push(witness);
  }
  return result;
}
