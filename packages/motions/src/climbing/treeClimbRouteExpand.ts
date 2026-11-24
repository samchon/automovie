import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { treeClimbRoute } from "./treeClimbRoute";
import { treeClimbRouteForms } from "./treeClimbRouteForms";
import { treeLimbs } from "./treeLimbs";

/**
 * Expand stances so the holds change a group at a time (taken, feet, hands, let
 * go), and check every one against the branches' loads.
 *
 * @param body The canonical motion body.
 * @param tree The tree.
 * @param stances The stances in order.
 * @returns The support stances, with every staged point by name.
 * @throws {HumanRefusal} If a stance loads a branch past its limit, naming the
 *   branch and the load.
 */
export function treeClimbRouteExpand(
  body: IAutoMovieMotionHumanBody,
  tree: treeLimbs.ITree,
  stances: readonly treeClimbRoute.IStance[],
): treeClimbRoute.IRoute {
  const weight: number = body.massModel.mass * AutoMovieGravity.STANDARD;
  const staged: Map<string, treeClimbRoute.IHold> = new Map();
  const out: IAutoMovieMotionHumanSupport.IStance[] = [];
  const emit = (
    holds: readonly treeClimbRoute.IHold[],
    event: string,
    prefer?: IAutoMovieMotionHumanLieDown.IPose,
  ): void => {
    const share: number = weight / Math.max(1, holds.length);
    for (const hold of holds) {
      staged.set(hold.key, hold);
      if (hold.branch === undefined) continue;
      const branch: treeLimbs.IBranch = tree.branches[hold.branch.index]!;
      const bound: number = treeLimbs.limit(branch, hold.branch.out);
      if (share > bound)
        throw treeLimbs.refusal(
          "branch",
          hold.branch.index,
          `branch ${hold.branch.index} bears ${bound.toFixed(0)} N ${hold.branch.out.toFixed(2)} m out, but the ${hold.part} loads it with ${share.toFixed(0)} N`,
        );
    }
    out.push({
      contacts: holds.map(
        (
          hold: treeClimbRoute.IHold,
        ): IAutoMovieMotionHumanSupport.IContact => ({
          part: hold.part,
          kind: hold.kind,
          target: { kind: "prop", subject: tree.subject, point: hold.key },
        }),
      ),
      seconds: treeClimbRouteForms.BEAT,
      event,
      ...(prefer === undefined ? {} : { prefer }),
    });
  };
  let current: treeClimbRoute.IHold[] = [];
  for (const stance of stances) {
    if (out.length === 0) {
      emit(stance.holds, stance.event, stance.prefer);
      current = [...stance.holds];
      continue;
    }
    const parts: string[] = [
      ...new Set(
        [...current, ...stance.holds].map(
          (hold: treeClimbRoute.IHold): string => hold.part,
        ),
      ),
    ];
    const of = (
      holds: readonly treeClimbRoute.IHold[],
      part: string,
    ): treeClimbRoute.IHold | undefined =>
      holds.find((hold: treeClimbRoute.IHold): boolean => hold.part === part);
    // New holds first, then moves, the feet before the hands as a climber
    // steps before reaching on, then the holds let go.
    const rank: (part: string) => number = (part: string): number =>
      of(current, part) === undefined
        ? 0
        : of(stance.holds, part) === undefined
          ? 3
          : part.endsWith("Foot")
            ? 1
            : 2;
    const changes: string[] = parts
      .filter(
        (part: string): boolean =>
          of(current, part)?.key !== of(stance.holds, part)?.key,
      )
      .sort((a: string, b: string): number => rank(a) - rank(b));
    // The changes of one rank go together: the new holds, then the feet,
    // then the hands, then the holds let go, each group one stance, so a
    // step costs at most four keys whatever the number of limbs it moves.
    const ranks: number[] = [...new Set(changes.map(rank))];
    ranks.forEach((r: number, i: number): void => {
      for (const part of changes.filter(
        (p: string): boolean => rank(p) === r,
      )) {
        const next: treeClimbRoute.IHold | undefined = of(stance.holds, part);
        current = current.filter(
          (hold: treeClimbRoute.IHold): boolean => hold.part !== part,
        );
        if (next !== undefined) current.push(next);
      }
      const last: boolean = i === ranks.length - 1;
      emit(
        current,
        last ? stance.event : `${stance.event}${treeClimbRouteForms.GROUPS[r]}`,
        last ? stance.prefer : undefined,
      );
    });
  }
  return { stances: out, staged };
}
