import type { AutoMovieLoftContract, IAutoMovieLoftChain, IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { AutoMovieHumanBodyTree } from "../AutoMovieHumanBodyTree";
import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import { AutoMovieHumanFootToeRoots } from "./AutoMovieHumanFootToeRoots";
import type { AutoMovieHumanFootToes } from "./AutoMovieHumanFootToes";

/**
 * The toes joined onto the leg-foot part by the human package's own join
 * logic (`AutoMovieHumanBodyTree`, as the legacy body lane joins every toe
 * onto its foot): each toe a source node folded onto the subtree built so
 * far by a merge join whose trace starts from a search seed on the toe and
 * whose blend is a rolling fold, realized by the engine
 * (`realizeAutoMovieConstruction` through `AutoMovieHumanBodyTree.realize`).
 *
 * Seeds: on each toe's plantar line (`IToe.plantar`), searched from its
 * metatarsal head inside the forefoot (share 0 of its station range) to past
 * its web station (share {@link SEARCH}), so the trace meets the forefoot
 * where the toe leaves it through the forefoot's oblique closure. The trace runs by
 * pseudo-arclength (the arc parameter): the outer toes' roots reach the
 * foot's edges, so their footprints need not encircle their axes and an
 * angle about the axis would turn back along the loop.
 *
 * Folds: each toe's own cap, half the gap to its nearest neighbouring root
 * (`AutoMovieHumanFootToeRoots`, as the legacy lane caps digits and toes, so
 * neighbouring webs' rails never cross), rolled with
 * `AutoMovieHumanFootToeRoots.FOLD` (debt: no published toe-web skin-fold
 * radius was read). The forefoot's closing pole stands distal of the web line
 * by the widest cap plus the fold (`AutoMovieHumanFootToeRoots.poleBeyond`),
 * so every footprint and its fold lie on the forefoot's regular surface.
 * Trace limits are the legacy lane's (64 points per turn, 1e-6 mm, grazing
 * asin 0.01) with a 2 mm chord.
 */
export namespace AutoMovieHumanFootToeTree {
  /** Share of a toe's station range the seed search reaches, from its root inside the forefoot. */
  export const SEARCH: number = 0.7;

  /** The joins' trace limits (the legacy body lane's, 2 mm chord). */
  export const LIMITS: AutoMovieHumanBodyTree.ILimits = { count: 64, tolerance: 1e-6, grazing: Math.asin(0.01), gap: 2 };

  /** The realized foot with its toes. */
  export interface IOutput {
    /** The joined subtree. */
    node: AutoMovieConstructionNode;

    /** The realization: parts' chains, then the folds' blend chains, and the trimmed body; null when it threw. */
    tree: AutoMovieHumanBodyTree.IOutput | null;

    /** The folds' blend chains (named `blend.<toe>.<host>`). */
    blends: IAutoMovieLoftChain[];

    /** Every premise the tree could not keep. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Join the toes onto the leg part and realize the subtree.
   *
   * @param leg The leg-foot view part (millimetres), the host.
   * @param toes The toes with their parts and their web-fold caps.
   */
  export function create(leg: IAutoMovieViewPart, toes: readonly AutoMovieHumanFootToes.IToe[]): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const sources: Map<string, IAutoMovieViewPart> = new Map([[leg.name, leg], ...toes.map((t: AutoMovieHumanFootToes.IToe): [string, IAutoMovieViewPart] => [t.part.name, t.part])]);
    const M: number = AutoMovieHumanConstructionView.METRES;
    let node: AutoMovieConstructionNode = { type: "source", name: leg.name, source: leg.name };
    for (const toe of toes) {
      // The seed line is the toe's plantar line: under the head it lies inside the forefoot, and it leaves the forefoot near the toe's web station, where the closure passes through the toe.
      const phase: number = toe.plantar;
      const width: { type: "fold"; radius: number; cap: number } = { type: "fold", radius: AutoMovieHumanFootToeRoots.FOLD * M, cap: toe.cap * M };
      // The legacy lane's merge join, traced by pseudo-arclength (an outer toe's footprint need not encircle its axis, so the angle about it can turn back).
      node = {
        type: "join",
        kind: "merge",
        name: `blend.${toe.part.name}.${leg.name}`,
        host: node,
        part: { type: "source", name: toe.part.name, source: toe.part.name },
        seed: { type: "search", partFace: toe.part.name, hostFace: leg.name, phase, from: 0, to: SEARCH },
        parameter: { type: "arc" },
        partWidth: width,
        hostWidth: width,
        continuity: "G2",
        count: LIMITS.count,
        rows: Math.max(1, Math.ceil((2 * toe.cap) / LIMITS.gap)),
        tolerance: LIMITS.tolerance * M,
        grazing: LIMITS.grazing,
      };
    }
    let tree: AutoMovieHumanBodyTree.IOutput | null = null;
    try {
      tree = AutoMovieHumanBodyTree.realize(`foot.${leg.name}`, node, LIMITS, diagnostics, sources);
    } catch (error: unknown) {
      diagnostics.push({ producer: "toe.tree", level: 3, contract: "realization", detail: error instanceof Error ? error.message : String(error) });
    }
    const blends: IAutoMovieLoftChain[] = tree === null ? [] : tree.chains.filter((c: IAutoMovieLoftChain): boolean => c.name.startsWith("blend."));
    return { node, tree, blends, diagnostics };
  }
}
