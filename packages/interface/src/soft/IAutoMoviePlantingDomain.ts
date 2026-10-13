import { IAutoMoviePlantingFoliage } from "./IAutoMoviePlantingFoliage";
import { IAutoMoviePlantingGrowth } from "./IAutoMoviePlantingGrowth";
import { IAutoMoviePlantingLimits } from "./IAutoMoviePlantingLimits";
import { IAutoMoviePlantingStructure } from "./IAutoMoviePlantingStructure";
import { IAutoMoviePruningEnvelope } from "./IAutoMoviePruningEnvelope";

/**
 * One deterministic planting recipe: a branching structure, a growth state, a
 * pruning envelope and a foliage rule.
 *
 * There is **no species catalogue** here, and there will not be one. A fern, a
 * ficus, a wall of ivy and an aquatic reed differ by branching angles, ratios,
 * growth direction and leaf density, not by a name the engine would have to
 * recognise; shipping a `"monstera"` preset would be shipping content dressed
 * as capability. What a customer models is theirs. What this record provides is
 * the general parametric law and the deterministic derivation of it.
 *
 * Growth is a **state**, not an animation:
 * {@link IAutoMoviePlantingGrowth.stage} is a scalar in `[0, 1]` and the derived
 * structure is a pure function of the whole record, so the same plant at the
 * same stage is the same plant on every machine and in every re-render.
 *
 * Nothing in the derivation uses a transcendental function. Branch directions
 * are authored as vectors rather than angles and seeded variation is built from
 * uniform samples and square roots, so only operations IEEE-754 specifies
 * exactly ever touch a coordinate. A plant whose leaves land differently on
 * Windows and POSIX is not a deterministic plant.
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

  /** The volume the plant is kept inside: a clipped hedge, a trained wall. */
  pruning: IAutoMoviePruningEnvelope;

  /** The leaf rule, or `null` for a bare structure such as a winter branch. */
  foliage: IAutoMoviePlantingFoliage | null;

  /** Hard caps this recipe promises to stay inside. */
  budget: IAutoMoviePlantingLimits;
}
