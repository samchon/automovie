import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import { IAutoMovieFormationLayout } from "./IAutoMovieFormationLayout";

/**
 * A unit-level formation whose members are deterministic derived slots.
 *
 * @evidence contracts/common.md#principled-implementation A count, layout, world anchor, heading and safe-integer seed define reproducible member positions; production design validation admits layout capacity, recipe identity and unique hero slots before materialization.
 * @evidence contracts/common.md#clear-and-simple-design Compact shared placement is separated from sparse hero overrides and source-authored motion; capability labels coordinate review without becoming executable behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every slot including heroes uses the declared model recipe, and capability labels confer no permission or proof; no per-member array or guessed behavior replaces the authored design.
 * @evidence contracts/common.md#meaningful-documentation Defines count and seed bounds, layout units, shared recipe ownership, portable identity and the non-authorizing capability and hero semantics.
 * @author Samchon
 */
export interface IAutoMovieFormationDesign {
  /** Non-blank stable formation id, unique under portable case folding. */
  id: string;

  /**
   * Existing model recipe id enforced on every derived slot, including heroes.
   */
  modelRecipe: string;

  /**
   * Integer number of derived slots from 1 through 100,000. Generated output stores bounded chunks and hero exceptions; anonymous slots are regenerated from index and seed and rendered through instancing.
   */
  count: number;

  /**
   * Compact layout with only the parameters its algorithm consumes. Line, column and wedge own explicit spacing; arc separation follows radius and angle, while scatter density follows count and radius.
   */
  layout: IAutoMovieFormationLayout;

  /** Formation origin in world-space meters. */
  anchor: IAutoMovieVector3;

  /** Finite world-space heading in degrees. */
  facingDeg: number;

  /** Integer deterministic seed from zero through `MAX_SAFE_INTEGER`. */
  seed: number;

  /**
   * Unique intended formation behaviors for source/review coordination.
   *
   * These labels are not a builder permission boundary and do not prove that source implemented or avoided a motion.
   */
  capabilities: AutoMovieFormationCapability[];

  /** Slots promoted to named hero actors. */
  heroOverrides: Array<{
    /** Unique zero-based slot strictly below this formation's count. */
    slot: number;

    /** Non-blank actor id, unique among this formation's hero overrides. */
    actor: string;
  }>;
}
