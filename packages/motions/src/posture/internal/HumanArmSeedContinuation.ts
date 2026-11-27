import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";

/*
 * A hold instant's inverse kinematics by continuation, for a solution whose
 * basin is narrower than any restart can reach (`HumanArmSeedRestarts`): the
 * site moved in small steps from where the arm at rest puts the hand to the
 * goal, its contact point along the straight line and its attitude along the
 * slerp, and each step solved from the step before (homotopy continuation,
 * Allgower and Georg 1990, "Numerical Continuation Methods", chapter 2: a
 * predictor at the last solution, corrected by the local solver at the next
 * parameter). A hat set on a kneeling partner's crown holds such a solution: no
 * solve started 0.02 of a coordinate's range from it reconverged to it
 * (`NEEDLE`), so a step moves the solution by less than that share of the arm's
 * coordinates. A step the local solver does not meet ends the continuation: the
 * path has left the feasible set.
 * Parameter context: The instant's context, the hold's waypoint its middle.
 * Parameter rest: Each arm's coordinates the continuation starts from.
 * Parameter at: The instant's context with every site moved a share of the way from
 * its start to its goal.
 * Parameter solve: The local solve of a context from each arm's coordinates.
 * Returns: Each arm's coordinates at the goal; none where a step is not met.
 */
export function HumanArmSeedContinuation(
  context: M.IContext,
  rest: readonly (readonly number[])[],
  at: (sites: (M.ISite | undefined)[]) => M.IContext,
  solve: (c: M.IContext, q: readonly (readonly number[])[]) => ISolved,
): number[][] | undefined {
  // Where the arm at rest puts each hand, and the steps the farthest arm
  // needs to cross its coordinates' range at `NEEDLE` a step.
  const goals: (M.ISite | undefined)[] = context.sites.map(
    (sites: readonly (M.ISite | undefined)[]): M.ISite | undefined => sites[1],
  );
  const starts: (IStart | undefined)[] = goals.map(
    (site: M.ISite | undefined, a: number): IStart | undefined => {
      if (site === undefined) return undefined;
      const placed: ReturnType<typeof G.placed> = G.placed(
        context.setups[a]!,
        context.frames[a]![1]!,
        rest[a]!,
      );
      return { point: P.pad(placed, site.contact), rotation: placed.hand };
    },
  );
  const steps: number = Math.ceil(1 / HumanArmSeedContinuation.NEEDLE);
  let q: number[][] = rest.map((v: readonly number[]): number[] => [...v]);
  for (let s: number = 1; s <= steps; ++s) {
    const share: number = s / steps;
    const sites: (M.ISite | undefined)[] = goals.map(
      (site: M.ISite | undefined, a: number): M.ISite | undefined => {
        const start: IStart | undefined = starts[a];
        if (site === undefined || start === undefined) return site;
        return {
          ...site,
          point: AutoMovieEngineVector3.lerp(start.point, site.point, share),
          ...(site.rotation === undefined
            ? {}
            : {
                rotation: AutoMovieEngineQuaternion.slerp(
                  start.rotation,
                  site.rotation,
                  share,
                ),
              }),
        };
      },
    );
    const step: ISolved = solve(at(sites), q);
    if (!step.met) return undefined;
    q = step.x;
  }
  return q;
}
/*
 * Step-size parameter for the inverse-kinematics continuation.
 */
export namespace HumanArmSeedContinuation {
  /*
   * The share of a coordinate's range a needle solution's basin stays within:
   * no solve started 0.02 of the range from the hat-on-crown hold instant's
   * solution (6 trials) reconverged to it.
   */
  export const NEEDLE: number = 0.02;
}

/*
 * A local solve's result.
 */
interface ISolved {
  /*
   * Each arm's coordinates.
   */
  x: number[][];
  /*
   * Whether it meets every term.
   */
  met: boolean;
}

/*
 * Where the arm at rest puts a hand.
 */
interface IStart {
  /*
   * The contact point, world metres.
   */
  point: ReturnType<typeof P.pad>;
  /*
   * The hand's attitude.
   */
  rotation: IAutoMovieQuaternion;
}
