import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";
import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import { IAutoMovieInstanceChunk } from "./IAutoMovieInstanceChunk";

/**
 * Compact generated runtime for a non-formation instance set.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `IAutoMovieCompiledInstanceSet` as the portable data boundary for the formation membership requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieCompiledInstanceSet` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieCompiledInstanceSet {
  /**
   * Generated instance-set format.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `version` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `version` for the performance formation hierarchy membership command system contract.
   */
  version: 1;
  /**
   * Stable world-design id.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `id` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `id` for the performance formation hierarchy membership command system contract.
   */
  id: string;
  /**
   * Exact designed slot count.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `count` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `count` for the performance formation hierarchy membership command system contract.
   */
  count: number;
  /**
   * Base design recipe.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `modelRecipe` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `modelRecipe` for the performance formation hierarchy membership command system contract.
   */
  modelRecipe: string;
  /**
   * Resolved prototype runtimes; omitted for a legacy single-prototype set.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `prototypes` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `prototypes` for the performance formation hierarchy membership command system contract.
   */
  prototypes?: IAutoMovieCompiledInstancePrototype[];
  /**
   * Exact compact placement law.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `layout` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `layout` for the performance formation hierarchy membership command system contract.
   */
  layout: IAutoMovieInstanceSetDesign["layout"];
  /**
   * Resolved route geometry for `along-route`, or null for local layouts.
   *
   * The viewer and source oracle regenerate slots from this snapshot without
   * consulting mutable world design.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `route` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `route` for the performance formation hierarchy membership command system contract.
   */
  route: IAutoMovieWorldDesign["routes"][number] | null;
  /**
   * World-space origin for local layouts.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `anchor` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `anchor` for the performance formation hierarchy membership command system contract.
   */
  anchor: IAutoMovieVector3;
  /**
   * World-space base heading in degrees.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `facingDeg` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `facingDeg` for the performance formation hierarchy membership command system contract.
   */
  facingDeg: number;
  /**
   * Full safe-integer design seed.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `seed` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `seed` for the performance formation hierarchy membership command system contract.
   */
  seed: number;
  /**
   * Exact seed-derived visual and semantic variation law.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `variation` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `variation` for the performance formation hierarchy membership command system contract.
   */
  variation: IAutoMovieInstanceSetDesign["variation"];
  /**
   * Exact bounds of all generated slots.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `bounds` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `bounds` for the performance formation hierarchy membership command system contract.
   */
  bounds: IAutoMovieFormationBounds;
  /**
   * Exact arithmetic centroid of all generated slots.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `centroid` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `centroid` for the performance formation hierarchy membership command system contract.
   */
  centroid: IAutoMovieVector3;
  /**
   * Compiler-derived representative radius used by viewer culling.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `projectionRadius` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `projectionRadius` for the performance formation hierarchy membership command system contract.
   */
  projectionRadius: number;
  /**
   * Bounded independently regenerable slot ranges.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `chunks` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `chunks` for the performance formation hierarchy membership command system contract.
   */
  chunks: IAutoMovieInstanceChunk[];
  /**
   * Ordered automatic LOD representations.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `lod` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `lod` for the performance formation hierarchy membership command system contract.
   */
  lod: IAutoMovieCompiledFormationLod[];
  /**
   * Digest of every field above except this digest.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `digest` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `digest` for the performance formation hierarchy membership command system contract.
   */
  digest: AutoMovieContentDigest;
}
