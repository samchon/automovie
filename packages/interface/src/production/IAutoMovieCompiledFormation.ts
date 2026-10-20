import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieCompiledFormationHero } from "./IAutoMovieCompiledFormationHero";
import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import { IAutoMovieFormationChunk } from "./IAutoMovieFormationChunk";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Compact generated formation runtime without a persisted row for every anonymous slot. Bounds and centroid describe placement points; projectionRadius is a separate supplied or fallback estimate used for view tests, not a guaranteed model enclosure.
 *
 * @evidence contracts/common.md#principled-implementation Layout, anchor, heading, seed and snapshotted terrain regenerate every slot deterministically; chunk summaries and ordered hero promotions derive from those same positions, while the record digest identifies all compiled inputs and summaries.
 * @evidence contracts/common.md#clear-and-simple-design The runtime stores compact placement laws and bounded chunk summaries instead of every anonymous member; explicit heroes and representation tiers add only the exceptions and view choices consumers need.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Viewer and oracle read the compiled terrain snapshot rather than mutable world design, hero slots leave anonymous batches, and phase seed changes cycle position without inventing an unrelated cadence.
 * @evidence contracts/common.md#meaningful-documentation Gives compact storage ownership, safe seed and count, metre anchor and slot bounds, terrain-order semantics, hero exclusion, LOD inputs, phase-only generation and complete digest coverage.
 */
export interface IAutoMovieCompiledFormation {
  /** Generated formation format. */
  version: 1;

  /** Stable formation design id. */
  id: string;

  /** Exact designed slot count. */
  count: number;

  /** Count remaining in instance batches after hero exclusion. */
  anonymousCount: number;

  /** Model group id the formation design names for every member. */
  model: string;

  /** Exact compact layout algorithm and parameters. */
  layout: IAutoMovieFormationDesign["layout"];

  /** World-space origin. */
  anchor: IAutoMovieVector3;

  /**
   * World terrain under this formation, snapshotted at compile time.
   *
   * A member's height is the ground under that member, so the ground has to travel with the formation: the viewer and the source oracle regenerate slot heights from this snapshot without consulting mutable world design, exactly as a compiled instance set carries the route it follows. Only the surfaces whose extent reaches the formation's own footprint are kept, and their declared order is preserved because the first surface containing a point is the one a member stands on. Empty when the world declared no terrain under the unit, which places every member at the anchor's height.
   */
  ground: IAutoMovieWorldDesign["surfaces"];

  /** World-space base heading in degrees. */
  facingDeg: number;

  /** Full safe-integer design seed. */
  seed: number;

  /** Bounds of all slot placement points, before member-radius expansion. */
  bounds: IAutoMovieFormationBounds;

  /** Binary64 running-mean centroid of all generated slot positions. */
  centroid: IAutoMovieVector3;

  /** Unscaled member-radius estimate in metres for LOD projection: maximum applicable tier estimate, base then 0.5m fallback, with a 0.01m floor. Root centering and geometry coverage depend on the supplied producer. */
  projectionRadius: number;

  /** Bounded independently regenerable slot ranges. */
  chunks: IAutoMovieFormationChunk[];

  /** Explicit hero promotions, ordered by slot. */
  heroes: IAutoMovieCompiledFormationHero[];

  /** Ordered automatic LOD representations. */
  lod: IAutoMovieCompiledFormationLod[];

  /**
   * Deterministic per-slot phase generator contract.
   *
   * Phase is where in its cycle one member stands, never how fast that cycle runs: cadence follows the ground a member's own unit covers under its cues, so a compiled cycle length would be a second answer to a question the cue already answers, and a seeded one would be unrelated to what the unit does.
   */
  phase: {
    /** Domain-separated safe-integer seed. */
    seed: number;
  };

  /** Digest of every field above except this digest. */
  digest: string;
}
