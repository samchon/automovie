import { HumanArmSeedSpace as Space } from "./HumanArmSeedSpace";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanMersenneTwister as MT } from "./HumanMersenneTwister";
import { HumanRandomSeeds } from "./HumanRandomSeeds";

/**
 * The random restarts of a hold instant's inverse kinematics, tried after the
 * caller's own starts (`HumanArmSeedStarts`): TRAC-IK's remedy for a local
 * solver caught in a local minimum, restarting it from a configuration drawn
 * uniformly within the joints' ranges (Beeson and Ames 2015, "TRAC-IK: An
 * open-source library for improved solving of generic inverse kinematics",
 * IEEE-RAS Humanoids, section II: KDL's Newton solver "restarted with random
 * seeds" until its time runs out). The draws are OMPL's generator's, seeded
 * from its engine's default first seed (`HumanRandomSeeds`), so the restarts
 * are the same on every run, and their count stands in for TRAC-IK's time
 * budget (`RESTARTS`, provisional). Each chart pair is drawn within its disc.
 *
 * @param context The instant's context.
 * @returns Each restart, each arm's coordinates.
 */
export function HumanArmSeedRestarts(context: M.IContext): number[][][] {
  const space: Space.ISpace = Space.sampler(context);
  const rng: MT.IState = MT.create(
    HumanRandomSeeds.next(
      HumanRandomSeeds.create(HumanRandomSeeds.DEFAULT_SEED),
    ),
  );
  return Array.from(
    { length: HumanArmSeedRestarts.RESTARTS },
    (): number[][] => {
      const q: number[] = space.low.map((low: number, i: number): number =>
        MT.uniformReal(rng, low, space.high[i]!),
      );
      for (const disc of space.discs) {
        const r: number = disc.radius * Math.sqrt(MT.uniform01(rng));
        const theta: number = 2 * Math.PI * MT.uniform01(rng);
        q[disc.x] = r * Math.cos(theta);
        q[disc.y] = r * Math.sin(theta);
      }
      return Space.split(q);
    },
  );
}
export namespace HumanArmSeedRestarts {
  /**
   * How many restarts an instant takes past its own starts: provisional, the
   * deterministic count standing in for TRAC-IK's 5 ms time budget.
   */
  export const RESTARTS: number = 8;
}
