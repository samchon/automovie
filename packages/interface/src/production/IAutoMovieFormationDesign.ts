import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import { IAutoMovieFormationLayout } from "./IAutoMovieFormationLayout";

/** A unit-level formation whose members are deterministic derived slots. */
export interface IAutoMovieFormationDesign {
  /** Non-blank stable formation id, unique under portable case folding. */
  id: string;

  /**
   * Existing model recipe id enforced on every derived slot, including heroes.
   */
  modelRecipe: string;

  /**
   * Integer number of derived slots from 1 through 100,000. Generated output
   * stores bounded chunks and hero exceptions; anonymous slots are regenerated
   * from index and seed and rendered through instancing.
   */
  count: number;

  /**
   * Compact layout with only the parameters its algorithm consumes. Line,
   * column and wedge own explicit spacing; arc separation follows radius and
   * angle, while scatter density follows count and radius.
   */
  layout: IAutoMovieFormationLayout;

  /** Formation origin in world space. */
  anchor: IAutoMovieVector3;

  /** Finite world-space heading in degrees. */
  facingDeg: number;

  /** Integer deterministic seed from zero through `MAX_SAFE_INTEGER`. */
  seed: number;

  /**
   * Unique intended formation behaviors for source/review coordination.
   *
   * These labels are not a builder permission boundary and do not prove that
   * source implemented or avoided a motion.
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
