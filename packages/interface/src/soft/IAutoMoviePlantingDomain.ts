import { IAutoMoviePlantingFoliage } from "./IAutoMoviePlantingFoliage";
import { IAutoMoviePlantingGrowth } from "./IAutoMoviePlantingGrowth";
import { IAutoMoviePlantingLimits } from "./IAutoMoviePlantingLimits";
import { IAutoMoviePlantingStructure } from "./IAutoMoviePlantingStructure";
import { IAutoMoviePruningEnvelope } from "./IAutoMoviePruningEnvelope";

/**
 * One deterministic planting recipe: a branching structure, a growth state, a pruning envelope and a foliage rule.
 *
 * There is **no species catalogue** here, and there will not be one. A fern, a ficus, a wall of ivy and an aquatic reed differ by branching angles, ratios, growth direction and leaf density, not by a name the engine would have to recognise; shipping a `"monstera"` preset would be shipping content dressed as capability. What a customer models is theirs. What this record provides is the general parametric law and the deterministic derivation of it.
 *
 * Growth is a state rather than an animation: stage lies in [0,1], and the complete recipe determines the derived structure. The kernel uses seeded path identities without ambient randomness; existing replay tests compare results on one host rather than establishing bit equality on every platform.
 *
 * Authored vectors, rational-circle turns and normalization avoid trigonometric angle sampling. Binary64 rounding and extreme-input overflow or cancellation remain, including bounds and pruning arithmetic; no Windows/POSIX or GPU equality follows merely from this representation.
 *
 * @evidence contracts/common.md#principled-implementation Seeded path-based recursion, growth extension and analytic pruning derive the complete admitted recipe. Vector frames and rational-circle turns avoid trig sampling, but finite derived arithmetic and normalization premises limit extreme inputs; replay is not an independent cross-host bit certificate.
 * @evidence contracts/common.md#clear-and-simple-design Structure, growth, pruning, foliage and caps are independent authored laws rather than species presets or an animation timeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation admits contraction ratios, positive growth span and bounded full-tree cost before derivation; cap overflow throws instead of truncating a plant into an undisclosed shape.
 * @evidence contracts/common.md#meaningful-documentation Defines meter units, safe seed, growth-as-state, optional bare foliage and independent recipe budgets.
 * @author Samchon
 */
export interface IAutoMoviePlantingDomain {
  /** Schema version. */
  version: 1;

  /** Stable identity of this planting recipe. */
  id: string;

  /** All authored lengths are measured in metres. */
  units: "meter";

  /** Deterministic seed; any safe integer. */
  seed: number;

  /** The recursive branching law. */
  structure: IAutoMoviePlantingStructure;

  /** How far along that law this plant has actually grown. */
  growth: IAutoMoviePlantingGrowth;

  /** Recipe-frame centreline pruning envelope; it does not clip stem thickness or leaf cards. */
  pruning: IAutoMoviePruningEnvelope;

  /** The leaf rule, or `null` for a bare structure such as a winter branch. */
  foliage: IAutoMoviePlantingFoliage | null;

  /** Hard caps this recipe promises to stay inside. */
  budget: IAutoMoviePlantingLimits;
}
