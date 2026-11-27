import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootPrior,
  IAutoMovieHumanFootToeLines,
} from "@automovie/interface";

import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

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
  export function of(
    lines: readonly IAutoMovieHumanFootToeLines.ILine[],
  ): AutoMovieVector3Tuple[][] {
    const prior: IAutoMovieHumanFootPrior.IPrior =
      AutoMovieHumanFootPrior.PRIOR;

    return prior.toes.map(
      (
        t: IAutoMovieHumanFootPrior.IToe,
        k: number,
      ): AutoMovieVector3Tuple[] => {
        const head: AutoMovieVector3Tuple = lines[k]!.head;
        const tip: AutoMovieVector3Tuple = lines[k]!.tip;

        return [
          head,
          ...t.joints.map(
            (f: number): AutoMovieVector3Tuple => G.lerp(head, tip, f),
          ),
          tip,
        ];
      },
    );
  }
}
