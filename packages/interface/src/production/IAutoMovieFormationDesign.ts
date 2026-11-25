import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import type { IAutoMovieFormationBlock } from "./IAutoMovieFormationBlock";
import type { IAutoMovieFormationLayout } from "./IAutoMovieFormationLayout";
import type { IAutoMovieModelLod } from "./IAutoMovieModelLod";

/** A unit-level formation whose members are deterministic derived slots. */
export interface IAutoMovieFormationDesign {
  /** Non-blank stable formation id, unique under portable case folding. */
  id: string;

  /** Existing model group id enforced on every derived slot, including heroes. */
  model: string;

  /**
   * Ordered distance tiers for anonymous members; omitted or empty draws
   * `model` as one unbounded `near` tier. Tiers must be ordered `hero`, `near`,
   * `far` with increasing positive distances and an unbounded tier only at the
   * end; compilation drops a `hero` tier because named hero nodes draw
   * themselves.
   */
  lod?: IAutoMovieModelLod[];

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

  /**
   * Blocks of slots in place of the one layout: slot `i` is block `k`'s slot
   * `i` minus the counts of the blocks before it, laid by the block's layout
   * and placed by its offset and facing in the design's frame
   * (`IAutoMovieFormationBlock`); the counts sum to `count`. The one `layout`
   * lays every slot when absent, and a reader that does not know blocks reads
   * the design as that layout.
   */
  blocks?: IAutoMovieFormationBlock[];

  /** Formation origin in world-space meters. */
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
