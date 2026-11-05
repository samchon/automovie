import { type AutoMovieConstructionRealization, type AutoMovieLoftContract, type AutoMovieSolidBody, type IAutoMovieLoftChain, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionDiagnostic, IAutoMovieConstructionJoin } from "@automovie/interface";
import { AutoMovieHumanConstructionView } from "./limb/AutoMovieHumanConstructionView";

/**
 * The body's construction tree (#3044, construction step 2; #3047 to #3051)
 * and its realization by the engine (`realizeAutoMovieConstruction`): every
 * part a view node, every fold a merge join whose trace starts at a search
 * seed and whose blend is a rolling fold of the caller's radius, the host
 * always the whole subtree built so far, so a part merges onto the faces its
 * hosts already share. The engine traces, blends and trims; this module
 * requests its operator/boundary records without an unused final skin.
 * Human's surface consumer draws the published body with its own attributes.
 *
 * Publication: the realized body of trimmed faces as the engine published it
 * (`IAutoMovieHumanBodyCalibration.bodies`), its faces the parts' chains and
 * the joins' blend chains, every shared boundary one set of points. A join's
 * curve may cross from the face its seed named onto a neighbouring host face
 * (a leg's fold onto a gluteal mass's blend); the body keeps those crossings,
 * which a per-join merge record on one host face cannot.
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

    /** The realized body of trimmed faces sharing their boundaries, as the calibration publishes it (`IAutoMovieHumanBodyCalibration.bodies`). */
    body: AutoMovieSolidBody.IPublished;
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
   * Realize a subtree's operators and publish its shared boundaries without drawing an unused engine skin.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same engine construction walk and retained blend chains/body boundaries; only the unused final engine skin is not requested.
   * @evidence contracts/common.md#clear-and-simple-design One literal skin:false call supplies the existing chains/body output, with no second construction owner or new cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves every operator diagnostic and its existing producer/level mapping; null engine skin is not a completed-skin or valid-figure certificate.
   * @evidence contracts/common.md#meaningful-documentation States the unskinned request, unchanged millimetre publication and Human's later skin ownership; the positive chord still controls engine preparation and trim solving.
   * @evidence contracts/performance.md#efficient-algorithms Keeps the original loft/join/trim work and boundary copying while avoiding the discarded engine face/fan mesh and metre copies; the Human skin is still generated by its existing consumer, and no measured saving is claimed.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the same realized view/blend chain records and published boundary points that Human's final surface reads, rather than reconstructing them from an unused skin.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned calibration owns chains and boundary data; the temporary realization and unused surface/join-list wrappers release after this call, with no added mesh population, cache or task handle.
   *
   * @param name The construction's name.
   * @param root The subtree.
   * @param limits The trace limits and the skin's chord.
   * @param diagnostics Where every premise the tree could not keep is recorded.
   * @returns The chains and the realized body.
   */
  export function realize(name: string, root: AutoMovieConstructionNode, limits: ILimits, diagnostics: AutoMovieLoftContract.IDiagnostic[]): IOutput {
    const result: AutoMovieConstructionRealization.IWithoutSkin = realizeAutoMovieConstruction({ name, root }, { chord: limits.gap * AutoMovieHumanConstructionView.METRES, skin: false });
    diagnostics.push(
      ...result.diagnostics.map((d: IAutoMovieConstructionDiagnostic): AutoMovieLoftContract.IDiagnostic => ({ producer: `tree.${d.node}`, level: 3, contract: d.contract, detail: d.detail })),
    );
    // Each join's blend as the realization built it, named as its node, a
    // face of the realized body beside the parts' faces.
    return { chains: [...result.chains, ...result.joins.map((j: AutoMovieConstructionRealization.IJoin): IAutoMovieLoftChain => j.blend.chain)], body: result.body };
  }
}
