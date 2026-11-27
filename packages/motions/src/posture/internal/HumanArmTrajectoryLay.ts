import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryBridge } from "./HumanArmTrajectoryBridge";
import { HumanArmTrajectoryClear as Clear } from "./HumanArmTrajectoryClear";
import { HumanArmTrajectoryEffector } from "./HumanArmTrajectoryEffector";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * One transport of a laid course between two waypoints already laid
 * (`HumanArmTrajectoryLaid.admitted`), on the blend of its ends and the detours
 * laid on it (`HumanArmTrajectoryClear`): the arcs are read on the base of its
 * first waypoint, the arms' own travel. The pace is the law's own on the
 * transport: `UNIT` times its straight arc (no detour) over its seconds, read
 * where it is first laid. The transport's waypoints are written into the
 * course.
 *
 * @param scope The course and what it is read on.
 * @param from The transport's first waypoint.
 * @param to Its last waypoint.
 * @param detours The detours laid on it.
 * @param known The pace read where it was first laid; read here when absent.
 * @returns The share of the path each of its waypoints stands at, its pace and
 *   whether it follows a straight wrist path.
 */
export function HumanArmTrajectoryLay(
  scope: HumanArmTrajectoryLay.IScope,
  from: number,
  to: number,
  detours: readonly Clear.IDetour[],
  known?: number,
): HumanArmTrajectoryLay.ILaid {
  const { context, read, x, times }: HumanArmTrajectoryLay.IScope = scope;
  const shares: number[] = [];
  shares[from] = 0;
  shares[to] = 1;
  const seconds: number = times[to]! - times[from]!;
  if (!(seconds > 0)) return { shares, pace: known ?? 0, effector: false };
  const ends: [readonly number[], readonly number[]][] = x.map(
    (arm: number[][]): [readonly number[], readonly number[]] => [
      arm[from]!,
      arm[to]!,
    ],
  );
  const path = (a: number, share: number): number[] => {
    const out: number[] = mix(ends[a]![0], ends[a]![1], share);
    for (const detour of detours) {
      const w: number = Clear.bump(share, detour.share);
      if (w > 0)
        detour.delta[a]!.forEach((v: number, d: number): void => {
          out[d]! += w * v;
        });
    }
    return out;
  };
  const placed = (
    share: number,
  ): IAutoMovieMotionHumanArmGeometry.IPlaced[] =>
    ends.map(
      (
        _: [readonly number[], readonly number[]],
        a: number,
      ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
        G.placed(
          context.setups[a]!,
          context.frames[a]![from]!,
          M.ranged(context, a, path(a, share)),
          false,
        ),
    );
  const along: number[] = [0];
  let before: IAutoMovieMotionHumanArmGeometry.IPlaced[] = placed(0);
  for (let s: number = 1; s <= ARC; ++s) {
    const now: IAutoMovieMotionHumanArmGeometry.IPlaced[] = placed(s / ARC);
    let step: number = 0;
    now.forEach(
      (arm: IAutoMovieMotionHumanArmGeometry.IPlaced, a: number): void => {
        for (const p of T.SPEED)
          step = Math.max(
            step,
            Vector3.length(
              Vector3.subtract(arm.probes[p]![0], before[a]!.probes[p]![0]),
            ),
          );
      },
    );
    along.push(along[s - 1]! + step);
    before = now;
  }
  const arc: number = along[ARC]!;
  const pace: number = known ?? (M.UNIT * arc) / seconds;

  // A single interval has a pace but no interior waypoint to lay.
  if (to - from === 1) return { shares, pace, effector: false };

  // A straight wrist path is the first option. Its endpoints are
  // expressed in their own carrier frames, so a moving base never
  // changes the path the arm itself takes. The joint arc retains the
  // original pace and is the alternative when the wrist path fails.
  if (known === undefined) {
    const solvers: ReturnType<typeof HumanArmTrajectoryEffector>[] =
      ends.map(
        (
          [p, q],
          a: number,
        ): ReturnType<typeof HumanArmTrajectoryEffector> =>
          HumanArmTrajectoryEffector(
            context.setups[a]!,
            { frame: context.frames[a]![from]!, coordinates: p },
            { frame: context.frames[a]![to]!, coordinates: q },
            read.arms[a]!.sites[from]?.rotation !== undefined
              ? read.arms[a]!.sites[from]!.contact
              : read.arms[a]!.sites[to]?.rotation !== undefined
                ? read.arms[a]!.sites[to]!.contact
                : undefined,
          ),
      );
    const tried: number[][][] | undefined = HumanArmTrajectoryBridge(
      times.slice(from, to + 1),
      ends,
      solvers,
      path,
    );
    if (tried !== undefined) {
      for (let k: number = from + 1; k < to; ++k) {
        shares[k] = AutoMovieEngineMotionSampling.minimumJerkShare((times[k]! - times[from]!) / seconds);
        x.forEach((arm: number[][], a: number): void => {
          arm[k] = M.ranged(context, a, tried[a]![k - from]!);
        });
      }
      return { shares, pace, effector: true };
    }
  }

  // The waypoints on the minimum-jerk time law of the arc (Flash and
  // Hogan 1985): the share of the arc reached at a share `w` of the span
  // is `10 w^3 - 15 w^4 + 6 w^5`, whose peak speed is `M.UNIT` times the
  // arc over the span, the law's own pace on a straight lay. A detour's
  // longer arc, or a base whose own change adds to a probe's step, can
  // pass the pace; the reading below refuses that stretch to the
  // optimiser, which alone may leave the closed form.
  let s: number = 1;
  for (let k: number = from + 1; k < to; ++k) {
    const w: number = (times[k]! - times[from]!) / seconds;
    const reached: number = arc * AutoMovieEngineMotionSampling.minimumJerkShare(w);
    while (s < ARC && along[s]! < reached) ++s;
    const span: number = along[s]! - along[s - 1]!;
    const share: number =
      (s - 1 + (span > 1e-12 ? (reached - along[s - 1]!) / span : 0)) / ARC;
    shares[k] = share;
    x.forEach((arm: number[][], a: number): void => {
      arm[k] = M.ranged(context, a, path(a, share));
    });
  }
  return { shares, pace, effector: false };
}

/** A laid transport's course and result. */
export namespace HumanArmTrajectoryLay {
  /** The course a transport is laid into and what it is read on. */
  export interface IScope {
    /** The context of the course's waypoints. */
    context: M.IContext;

    /** The problem as read (in the mirror image where the first arm is left). */
    read: HumanArmTrajectory.IProblem;

    /** The course's coordinates, each arm's at each waypoint, written into. */
    x: number[][][];

    /** The waypoints' seconds. */
    times: readonly number[];
  }

  /** A laid transport. */
  export interface ILaid {
    /** Each waypoint's progress along this transport. */
    shares: number[];
    /** The original joint arc's speed bound, metres per second. */
    pace: number;
    /** The transport follows a straight wrist path in the carrier frame. */
    effector: boolean;
  }
}

/** A blend of two coordinate lists by a share. */
function mix(p: readonly number[], q: readonly number[], w: number): number[] {
  return p.map((v: number, d: number): number => v + (q[d]! - v) * w);
}

/**
 * The samples a laid transport's arc is read on (provisional: under a degree of
 * any joint's travel apiece on a daily reach).
 */
const ARC: number = 48;