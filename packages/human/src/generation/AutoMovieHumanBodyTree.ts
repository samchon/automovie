import { type AutoMovieConstructionRealization, type AutoMovieLoftContract, type IAutoMovieLoftChain, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionDiagnostic, IAutoMovieConstructionJoin } from "@automovie/interface";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanConstructionView } from "./limb/AutoMovieHumanConstructionView";
import { AutoMovieHumanMergeEntry } from "./limb/AutoMovieHumanMergeEntry";

/**
 * The body's construction tree (#3044, construction step 2; #3047 to #3051)
 * and its realization by the engine (`realizeAutoMovieConstruction`): every
 * part a view node, every fold a merge join whose trace starts at a search
 * seed and whose blend is a rolling fold of the caller's radius, the host
 * always the whole subtree built so far, so a part merges onto the faces its
 * hosts already share. The engine traces, blends, trims and draws; this
 * module only names the tree and publishes what the engine returns.
 *
 * Publication (the join adapter): the calibration's merge record names the
 * blend, its host chain and its part chain. Each realized join carries its
 * node's name and its seed's faces (`AutoMovieConstructionRealization.IJoin`),
 * so its record is the join's blend on the seed's host face and part face; a
 * curve that crosses onto a neighbouring host face is still recorded on the
 * face its seed named.
 */
export namespace AutoMovieHumanBodyTree {
  /** One fold's join onto the subtree built so far, calibration mm. */
  export interface IFold {
    /** The joined subtree. */
    part: AutoMovieConstructionNode;

    /** The part's face that meets the host. */
    partFace: string;

    /** The host face the seed meets. */
    hostFace: string;

    /** The seed's search: the part face's phase and the shares of its station range to search between. */
    search: { phase: number; from: number; to: number };

    /** The fold's rolling radius, mm. */
    radius: number;

    /** The widest chord either side, mm. */
    cap: number;
  }

  /** The joins' trace limits and sampling, millimetres and radians. */
  export interface ILimits {
    /** Points of each trace per turn and columns of each blend, a multiple of 4 of at least 8. */
    count: number;

    /** Largest distance between the two surfaces at a traced point, mm. */
    tolerance: number;

    /** Least angle between the two tangent planes, radians. */
    grazing: number;

    /** Widest spacing between a blend's rows and the skin's chord, mm. */
    gap: number;
  }

  /** The realized subtree as the calibration publishes it. */
  export interface IOutput {
    /** Every part's chain, then every blend's. */
    chains: IAutoMovieLoftChain[];

    /** Every join's merge record. */
    merges: IAutoMovieHumanBodyCalibration.IMerge[];
  }

  /**
   * A fold's join node on a host subtree.
   *
   * @param host The subtree built so far.
   * @param fold The joined subtree and its fold.
   * @param limits The trace limits.
   * @returns The join node, metres.
   */
  export function join(host: AutoMovieConstructionNode, fold: IFold, limits: ILimits): IAutoMovieConstructionJoin {
    const M: number = AutoMovieHumanConstructionView.METRES;
    const width = { type: "fold" as const, radius: fold.radius * M, cap: fold.cap * M };
    return {
      type: "join",
      kind: "merge",
      name: `blend.${fold.partFace}.${fold.hostFace}`,
      host,
      part: fold.part,
      seed: { type: "search", partFace: fold.partFace, hostFace: fold.hostFace, phase: fold.search.phase, from: fold.search.from, to: fold.search.to },
      parameter: { type: "phase" },
      partWidth: width,
      hostWidth: width,
      continuity: "G2",
      count: limits.count,
      rows: Math.max(1, Math.ceil((2 * fold.cap) / limits.gap)),
      tolerance: limits.tolerance * M,
      grazing: limits.grazing,
    };
  }

  /**
   * Realize a subtree and publish it.
   *
   * @param name The construction's name.
   * @param root The subtree.
   * @param limits The trace limits and the skin's chord.
   * @param diagnostics Where every premise the tree could not keep is recorded.
   * @returns The chains and merge records.
   */
  export function realize(name: string, root: AutoMovieConstructionNode, limits: ILimits, diagnostics: AutoMovieLoftContract.IDiagnostic[]): IOutput {
    const result: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name, root }, { chord: limits.gap * AutoMovieHumanConstructionView.METRES });
    diagnostics.push(
      ...result.diagnostics.map((d: IAutoMovieConstructionDiagnostic): AutoMovieLoftContract.IDiagnostic => ({ producer: `tree.${d.node}`, level: 3, contract: d.contract, detail: d.detail })),
    );
    const chains: IAutoMovieLoftChain[] = [...result.chains];
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = [];
    // Each join's blend as the realization built it (named as its node, on
    // the node's columns), not solved again.
    for (const j of result.joins) {
      const entry: AutoMovieHumanMergeEntry.IEntry = AutoMovieHumanMergeEntry.from(j.hostFace, j.partFace, j.blend, limits.gap, false);
      chains.push(entry.chain);
      merges.push(entry.merge);
    }
    return { chains, merges };
  }
}
