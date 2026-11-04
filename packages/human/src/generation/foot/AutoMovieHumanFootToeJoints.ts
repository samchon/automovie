import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";

type Vec3 = G.Vec3;

/**
 * The joints of each toe along its line: its phalanges' spans. The hallux has
 * two phalanges (the metatarsophalangeal joint, one interphalangeal joint, the
 * tip); each lesser toe has three (MTP, proximal and distal interphalangeal
 * joints, tip). The joints stand at the prior's shares of the line from the
 * metatarsal head to the tip, a convention awaiting measured phalanx lengths;
 * the skeleton places the toe bones on them.
 */
export namespace AutoMovieHumanFootToeJoints {
  /**
   * The joints of each toe from its metatarsal head to its tip, hallux first.
   *
   * @param lines The toes' lines.
   */
  export function of(lines: readonly AutoMovieHumanFootToeLines.ILine[]): Vec3[][] {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;

    return prior.toes.map((t: AutoMovieHumanFootPrior.IToe, k: number): Vec3[] => {
      const head: Vec3 = lines[k]!.head;
      const tip: Vec3 = lines[k]!.tip;

      return [head, ...t.joints.map((f: number): Vec3 => G.lerp(head, tip, f)), tip];
    });
  }
}
