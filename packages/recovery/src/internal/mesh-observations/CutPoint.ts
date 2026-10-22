import { V3 } from "./V3";

/**
 * Source edge/plane intersection retained only in private observation extraction.
 *
 * @evidence contracts/common.md#principled-implementation Canonical labels and fraction retain the original physical cutter point; opt-in sourceEdges additionally preserve each original input-edge alias and its own binary64 witness. This is source incidence, not anatomical phase or transverse-jet proof.
 * @evidence contracts/common.md#clear-and-simple-design One private point record groups canonical connectivity and optional original-edge witnesses; cutting emits and ordered observation copies them without another point reconstruction or root selector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No specimen coordinate, replacement point, source normal, expected answer or positional weld is encoded; original aliases remain separate from canonical connectivity.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish registered p/pointMm in mm, canonical labels, original input vertex addresses, dimensionless fractions and omitted opt-in state; representative positions are not asserted to reproduce crossings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 */
export interface CutPoint {
  /** Physical intersection on a source edge in the declared source frame. */
  p: V3;
  /** Ordered canonical connectivity labels of the original supporting edge; representative positions need not reproduce p. */
  a: number;
  /** Larger canonical connectivity label, retained privately without moving the original supporting edge. */
  b: number;
  /** Fraction along the original supporting source edge, oriented to match the a/b labels; interpolating canonical representative positions can differ from p. */
  t: number;

  /** Opt-in original emitted-edge aliases; absent on the original default path. */
  sourceEdges?: Array<{
    /** First original input vertex, not a canonical representative. */
    a: number;

    /** Second original input vertex; equality retains an on-plane vertex. */
    b: number;

    /** Dimensionless crossing fraction in this original edge direction. */
    t: number;

    /** Actual original witness in registered mm, retained independently for aliases. */
    pointMm: V3;
  }>;
}
