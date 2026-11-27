import { AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/*
 * Find an interior hand-material violation on a free transport beside the
 * body's authored support. Both endpoints must admit the same material pair. A
 * chord in the moving obstacle frame selects a possible encounter second. The
 * reconstructed clinical curve and the body's actual posed digit at that second
 * must also violate the material allowance before the pair gets a row.
 * Parameter c: The original course's setup, samples and authored body reader.
 * Parameter a: The moving arm in the canonical problem.
 * Parameter k: The first waypoint of the free interval.
 * Parameter n: Its last waypoint, the next one read.
 * Parameter from: The arm placed at that waypoint.
 * Parameter to: The arm placed at its last waypoint.
 * Parameter contacts: The existing corner-pair readings for this arm.
 * Parameter coordinates: The clinical waypoints used by playback's quintic.
 * Returns: Confirmed encounters with their relative-chord correction rows.
 */
export function HumanArmTrajectoryMaterialSweep(
  c: M.IContext,
  a: number,
  k: number,
  n: number,
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
    c.sites[a]![n] !== undefined
  )
    return [];
  const active: Map<number, P.IPair> = new Map();
  for (const j of [k, n])
    for (const [key, pair] of contacts[j]?.deepest ?? []) {
      if (
        frame.shapes[pair.shape]!.part !== support ||
        pair.short < -P.CUT ||
        frame.owners[pair.probe - G.SURFACE] !== "hand"
      )
        continue;
      if (
        frame.resting.has(frame.shapes[pair.shape]!.part) &&
        c.frames[a]![n]!.resting.has(frame.shapes[pair.shape]!.part)
      )
        continue;
      active.set(key, pair);
    }
  if (active.size === 0) return [];
  const encounters: IEncounter[] = [];
  for (const [key, pair] of active) {
    const part: number = frame.segments[pair.probe - G.SURFACE]!;
    const shape = frame.shapes[pair.shape]!;
    const first: number = contacts[k]?.deepest.get(key)?.short ?? Infinity;
    const last: number = contacts[n]?.deepest.get(key)?.short ?? Infinity;
    if (first > T.SKIN + T.TOLERANCE || last > T.SKIN + T.TOLERANCE) continue;
    let worst: number = T.TOLERANCE;
    let witness: Omit<HumanArmTrajectorySweep.ISwept, "near"> | undefined;
    const gap: ReturnType<typeof S.prepareGap> = S.prepareGap(
      frame,
      pair.shape,
    );
    // HumanArmFrame appends all material corners of each collider together.
    let start: number = pair.probe - G.SURFACE;
    while (start > 0 && frame.segments[start - 1] === part) --start;
    for (let index: number = start; frame.segments[index] === part; ++index) {
      const probe: number = G.SURFACE + index;
      const [point, radius] = from.probes[probe]!;
      const moved: ReturnType<typeof HumanArmTrajectoryHalfStep.carry> =
        HumanArmTrajectoryHalfStep.carry(
          c,
          a,
          k,
          n,
          pair.shape,
          to.probes[probe]![0],
        );
      const travel: number = AutoMovieEngineVector3.distance(point, moved.point);
      if (
        travel === 0 ||
        Math.min(first, last) + 1000 * travel <= T.SKIN + worst
      )
        continue;
      const lower: number =
        Math.min(
          c.allowed(a, k, probe, pair.shape),
          c.allowed(a, n, probe, pair.shape),
        ) -
        T.SKIN / 1000;
      const centre: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(point, moved.point, 0.5);
      const margin: number = lower + radius + travel / 2 - worst / 1000;
      if (
        AutoMovieEngineVector3.distance(centre, shape.centre) - shape.radius > margin ||
        HumanArmShapeBox(shape, centre) > margin
      )
        continue;
      const clear: number = gap(point, moved.point) - radius;
      const short: number = 1000 * (lower - clear);
      if (short > worst) {
        worst = short;
        witness = {
          probe,
          shape: pair.shape,
          from: k,
          start: point,
          first: { x: 0, y: 0, z: 0, w: 1 },
          other: n,
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
    const nearest = AutoMovieEnginePhysics.physicalShapeNearest(
      shape.pose,
      shape.shape,
      startPoint,
      endPoint,
    );
    const travel: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(endPoint, startPoint);
    const u: number =
      AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(nearest.at, startPoint), travel) /
      AutoMovieEngineVector3.dot(travel, travel);
    if (!(u > 0 && u < 1)) continue;
    const seconds: number = c.times[k]! + u * (c.times[n]! - c.times[k]!);
    encounters.push({
      sweep: { ...witness, near: nearest },
      seconds,
      radius,
      shape,
    });
  }
  if (encounters.length === 0) return [];
  const curve: ReturnType<typeof HumanArmRefine.prepareHermite> =
    HumanArmRefine.prepareHermite(c.times, coordinates);
  const result: HumanArmTrajectorySweep.ISwept[] = [];
  for (const { sweep, seconds, radius, shape } of encounters) {
    const actual: IAutoMovieMotionHumanArmGeometry.IFrame = material.frame(
      a,
      seconds,
    );
    const obstacle: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
      actual.shapes[sweep.shape];
    if (obstacle?.part !== shape.part || obstacle.bone !== shape.bone) continue;
    const arm: IAutoMovieMotionHumanArmGeometry.IPlaced = G.placed(
      c.setups[a]!,
      actual,
      curve(seconds).coordinates,
    );
    const point: IAutoMovieVector3 = arm.probes[sweep.probe]![0];
    const clear: number = S.gap(actual, sweep.shape, point, point) - radius;
    if (1000 * (sweep.lower - clear) > T.TOLERANCE) result.push(sweep);
  }
  return result;
}

/*
 * A relative chord that needs its actual material pose inspected.
 */
interface IEncounter {
  /*
   * The chord's clearance witness and nearest point.
   */
  sweep: HumanArmTrajectorySweep.ISwept;
  /*
   * The instant selected by the chord, seconds.
   */
  seconds: number;
  /*
   * The probe's radius, metres.
   */
  radius: number;
  /*
   * The material collider's identity at the first frame.
   */
  shape: IAutoMovieMotionHumanArmGeometry.IShape;
}
