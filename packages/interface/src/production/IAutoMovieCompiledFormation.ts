import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";
import { IAutoMovieCompiledFormationHero } from "./IAutoMovieCompiledFormationHero";
import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import { IAutoMovieFormationChunk } from "./IAutoMovieFormationChunk";

/**
 * Compact generated formation runtime; it never stores every anonymous slot.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `IAutoMovieCompiledFormation` as the portable data boundary for the formation slot identity requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieCompiledFormation` for the performance formation layout slot assignment system contract.
 */
export interface IAutoMovieCompiledFormation {
  /**
   * Generated formation format.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `version` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `version` for the performance formation layout slot assignment system contract.
   */
  version: 1;

  /**
   * Stable formation design id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `id` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `id` for the performance formation layout slot assignment system contract.
   */
  id: string;

  /**
   * Exact designed slot count.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `count` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `count` for the performance formation layout slot assignment system contract.
   */
  count: number;

  /**
   * Count remaining in instance batches after hero exclusion.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `anonymousCount` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `anonymousCount` for the performance formation layout slot assignment system contract.
   */
  anonymousCount: number;

  /**
   * Base design recipe.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `modelRecipe` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `modelRecipe` for the performance formation layout slot assignment system contract.
   */
  modelRecipe: string;

  /**
   * Exact compact layout algorithm and parameters.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `layout` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `layout` for the performance formation layout slot assignment system contract.
   */
  layout: IAutoMovieFormationDesign["layout"];

  /**
   * World-space origin.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `anchor` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `anchor` for the performance formation layout slot assignment system contract.
   */
  anchor: IAutoMovieVector3;

  /**
   * World terrain under this formation, snapshotted at compile time.
   *
   * A member's height is the ground under that member, so the ground has to
   * travel with the formation: the viewer and the source oracle regenerate slot
   * heights from this snapshot without consulting mutable world design, exactly
   * as a compiled instance set carries the route it follows. Only the surfaces
   * whose extent reaches the formation's own footprint are kept, and their
   * declared order is preserved because the first surface containing a point is
   * the one a member stands on. Empty when the world declared no terrain under
   * the unit, which places every member at the anchor's height.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `ground` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `ground` for the performance formation layout slot assignment system contract.
   */
  ground: IAutoMovieWorldDesign["surfaces"];

  /**
   * World-space base heading in degrees.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `facingDeg` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `facingDeg` for the performance formation layout slot assignment system contract.
   */
  facingDeg: number;

  /**
   * Full safe-integer design seed.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `seed` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `seed` for the performance formation layout slot assignment system contract.
   */
  seed: number;

  /**
   * Exact bounds of all slots.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `bounds` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `bounds` for the performance formation layout slot assignment system contract.
   */
  bounds: IAutoMovieFormationBounds;

  /**
   * Exact arithmetic centroid of all slots.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `centroid` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `centroid` for the performance formation layout slot assignment system contract.
   */
  centroid: IAutoMovieVector3;

  /**
   * Compiler-derived representative member radius used by LOD projection.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `projectionRadius` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `projectionRadius` for the performance formation layout slot assignment system contract.
   */
  projectionRadius: number;

  /**
   * Bounded independently regenerable slot ranges.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `chunks` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `chunks` for the performance formation layout slot assignment system contract.
   */
  chunks: IAutoMovieFormationChunk[];

  /**
   * Explicit hero promotions, ordered by slot.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `heroes` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `heroes` for the performance formation layout slot assignment system contract.
   */
  heroes: IAutoMovieCompiledFormationHero[];

  /**
   * Ordered automatic LOD representations.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `lod` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `lod` for the performance formation layout slot assignment system contract.
   */
  lod: IAutoMovieCompiledFormationLod[];

  /**
   * Deterministic per-slot phase generator contract.
   *
   * Phase is where in its cycle one member stands, never how fast that cycle
   * runs: cadence follows the ground a member's own unit covers under its cues,
   * so a compiled cycle length would be a second answer to a question the cue
   * already answers, and a seeded one would be unrelated to what the unit
   * does.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `phase` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `phase` for the performance formation layout slot assignment system contract.
   */
  phase: {
    /** Domain-separated safe-integer seed. */
    seed: number;
  };

  /**
   * Digest of every field above except this digest.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Exposes `digest` as the portable data boundary for the formation slot identity requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `digest` for the performance formation layout slot assignment system contract.
   */
  digest: AutoMovieContentDigest;
}
