import type { AutoMovieLoftContract, IAutoMovieLoftChain, IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { AutoMovieHumanBodyTree } from "../AutoMovieHumanBodyTree";
import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { AutoMovieHumanHandDigits } from "./AutoMovieHumanHandDigits";

/**
 * The digits joined onto the arm's hand by the human package's own join
 * logic (`AutoMovieHumanBodyTree`, the pattern of the foot's
 * `AutoMovieHumanFootToeTree`): each digit a source node folded onto the
 * subtree built so far by a merge join whose trace starts from a search seed
 * on the digit and whose blend is a rolling fold, realized by the engine.
 *
 * Seeds: on each digit's volar line, searched from its root inside the palm
 * (share 0 of its station range: a finger's root is its metacarpal head, the
 * thumb's its carpometacarpal joint) to {@link SEARCH} of its range, so the
 * trace meets the hand where the digit leaves it. The digit's chart has `u`
 * radial and `v = u x distal`, which is dorsal on the left hand and volar on
 * the right, so the volar line is at `3 pi / 2` on the left and `pi / 2` on
 * the right. The trace runs by pseudo-arclength (the arc parameter): a digit
 * leaving the hand's edge need not have a footprint that encircles its axis.
 *
 * Folds: a finger's web cap is 0.075 of the finger roots' spacing (a
 * quarter of the hand breadth, `AutoMovieHumanHandDigits`), under half the
 * 0.16 of it left between neighbouring roots, so neighbouring webs' rails
 * never cross; the thumb's is twice that over its open first web. The rolling radius is a third of the cap
 * (debt: no published finger-web skin-fold radius was read). Trace limits are
 * the foot's (64 points per turn, 1e-6 mm, grazing asin 0.01, 2 mm chord).
 */
export namespace AutoMovieHumanHandFingerTree {
  /** Share of a digit's station range the seed search reaches, from its root inside the palm. */
  export const SEARCH: number = 0.6;

  /** The joins' trace limits (the foot's toe tree's). */
  export const LIMITS: AutoMovieHumanBodyTree.ILimits = { count: 64, tolerance: 1e-6, grazing: Math.asin(0.01), gap: 2 };

  /** The realized hand with its digits. */
  export interface IOutput {
    /** The joined subtree. */
    node: AutoMovieConstructionNode;

    /** The realization, or null when it threw. */
    tree: AutoMovieHumanBodyTree.IOutput | null;

    /** The folds' blend chains (named `blend.<digit>.<host>`). */
    blends: IAutoMovieLoftChain[];

    /** Every premise the tree could not keep. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * The join node of the digits on a host subtree, for a body tree to compose
   * (the integrator passes its own subtree as `host`).
   *
   * @param host The subtree the digits fold onto (holding the arm part named `hand`).
   * @param hand The arm part's name, the faces the digits meet.
   * @param digits The digits with their parts.
   * @param breadth The hand breadth, mm.
   */
  export function node(host: AutoMovieConstructionNode, hand: string, digits: readonly AutoMovieHumanHandDigits.IDigit[], breadth: number): AutoMovieConstructionNode {
    const M: number = AutoMovieHumanConstructionView.METRES;
    // Neighbouring finger roots stand a quarter breadth apart with radii up to 0.42 of it (`AutoMovieHumanHandDigits`), leaving 0.16 of it between them; each web cap takes under half of that gap.
    const finger: number = (breadth / 4) * 0.075;
    let joined: AutoMovieConstructionNode = host;
    for (const digit of digits) {
      const cap: number = digit.digit === 1 ? 2 * finger : finger;
      const width: { type: "fold"; radius: number; cap: number } = { type: "fold", radius: (cap / 3) * M, cap: cap * M };
      const left: boolean = digit.part.name.endsWith(".left");
      joined = {
        type: "join",
        kind: "merge",
        name: `blend.${digit.part.name}.${hand}`,
        host: joined,
        part: { type: "source", name: digit.part.name, source: digit.part.name },
        seed: { type: "search", partFace: digit.part.name, hostFace: hand, phase: left ? (3 * Math.PI) / 2 : Math.PI / 2, from: 0, to: SEARCH },
        parameter: { type: "arc" },
        partWidth: width,
        hostWidth: width,
        continuity: "G2",
        count: LIMITS.count,
        rows: Math.max(1, Math.ceil((2 * cap) / LIMITS.gap)),
        tolerance: LIMITS.tolerance * M,
        grazing: LIMITS.grazing,
      };
    }
    return joined;
  }

  /**
   * Join the digits onto the arm part alone and realize the subtree.
   *
   * @param arm The arm view part (millimetres), the host.
   * @param digits The digits with their parts.
   * @param breadth The hand breadth, mm.
   */
  export function create(arm: IAutoMovieViewPart, digits: readonly AutoMovieHumanHandDigits.IDigit[], breadth: number): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const sources: Map<string, IAutoMovieViewPart> = new Map([[arm.name, arm], ...digits.map((d: AutoMovieHumanHandDigits.IDigit): [string, IAutoMovieViewPart] => [d.part.name, d.part])]);
    const joined: AutoMovieConstructionNode = node({ type: "source", name: arm.name, source: arm.name }, arm.name, digits, breadth);
    let tree: AutoMovieHumanBodyTree.IOutput | null = null;
    try {
      tree = AutoMovieHumanBodyTree.realize(`hand.${arm.name}`, joined, LIMITS, diagnostics, sources);
    } catch (error: unknown) {
      diagnostics.push({ producer: "finger.tree", level: 3, contract: "realization", detail: error instanceof Error ? error.message : String(error) });
    }
    const blends: IAutoMovieLoftChain[] = tree === null ? [] : tree.chains.filter((c: IAutoMovieLoftChain): boolean => c.name.startsWith("blend."));
    return { node: joined, tree, blends, diagnostics };
  }
}
