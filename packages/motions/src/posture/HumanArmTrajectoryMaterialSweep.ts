import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry, IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * Sweep the hand material in surface pairs that are active at either end.
 * A signed-distance displacement bound rejects a corner chord whose motion
 * cannot spend its endpoint margin. The enclosing box and sphere bound the
 * chord before its exact shape query. The deepest witness of each collider
 * pair carries that corner's material allowance into the convex model.
 */
export function HumanArmTrajectoryMaterialSweep(
  c: M.IContext, a: number, k: number,
  from: IAutoMovieMotionHumanArmGeometry.IPlaced,
  to: IAutoMovieMotionHumanArmGeometry.IPlaced,
  contacts: M.IEvaluation["pairs"][number],
): HumanArmTrajectorySweep.ISwept[] {
  const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
  const active: Map<number, P.IPair> = new Map();
  for (const j of [k, k + 1])
    for (const [key, pair] of contacts[j]?.deepest ?? []) {
      if (pair.short < -P.CUT || frame.owners[pair.probe - G.SURFACE] !== "hand") continue;
      if (frame.resting.has(frame.shapes[pair.shape]!.part) &&
          c.frames[a]![k + 1]!.resting.has(frame.shapes[pair.shape]!.part)) continue;
      active.set(key, pair);
    }
  if (active.size === 0) return [];
  const result: HumanArmTrajectorySweep.ISwept[] = [];
  for (const [key, pair] of active) {
    const part: number = frame.segments[pair.probe - G.SURFACE]!;
    const shape = frame.shapes[pair.shape]!;
    const first: number = contacts[k]?.deepest.get(key)?.short ?? Infinity;
    const last: number = contacts[k + 1]?.deepest.get(key)?.short ?? Infinity;
    let worst: number = 0;
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
      if (travel === 0 || Math.min(first, last) + 1000 * travel <= T.SKIN + worst) continue;
      const lower: number = Math.min(c.allowed(a, k, probe, pair.shape),
        c.allowed(a, k + 1, probe, pair.shape)) - T.SKIN / 1000;
      const centre: IAutoMovieVector3 = Vector3.lerp(point, moved.point, 0.5);
      const margin: number = lower + radius + travel / 2 - worst / 1000;
      if (Vector3.distance(centre, shape.centre) - shape.radius > margin ||
          HumanArmShapeBox(shape, centre) > margin) continue;
      gap ??= S.prepareGap(frame, pair.shape);
      const clear: number = gap(point, moved.point) - radius;
      const short: number = 1000 * (lower - clear);
      if (short > worst) {
        worst = short;
        witness = { probe, shape: pair.shape, to: moved.point, turn: moved.turn, clear, lower };
      }
    }
    if (witness !== undefined) result.push(witness);
  }
  return result;
}
