import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import { IAutoMovieFormationLayout } from "./IAutoMovieFormationLayout";

/**
 * A unit-level formation whose members are deterministic derived slots.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `IAutoMovieFormationDesign` as the portable data boundary for the formation unit local variation requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieFormationDesign` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieFormationDesign {
  /**
   * Non-blank stable formation id, unique under portable case folding.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `id` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `id` for the performance formation hierarchy membership command system contract.
   */
  id: string;
  /**
   * Existing model recipe id enforced on every derived slot, including heroes.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `modelRecipe` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `modelRecipe` for the performance formation hierarchy membership command system contract.
   */
  modelRecipe: string;
  /**
   * Integer number of derived slots from 1 through 100,000. Generated output
   * stores bounded chunks and hero exceptions; anonymous slots are regenerated
   * from index and seed and rendered through instancing.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `count` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `count` for the performance formation hierarchy membership command system contract.
   */
  count: number;
  /**
   * Compact layout with only the parameters its algorithm consumes. Line,
   * column and wedge own explicit spacing; arc separation follows radius and
   * angle, while scatter density follows count and radius.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `layout` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `layout` for the performance formation hierarchy membership command system contract.
   */
  layout: IAutoMovieFormationLayout;
  /**
   * Formation origin in world space.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `anchor` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `anchor` for the performance formation hierarchy membership command system contract.
   */
  anchor: IAutoMovieVector3;
  /**
   * Finite world-space heading in degrees.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `facingDeg` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `facingDeg` for the performance formation hierarchy membership command system contract.
   */
  facingDeg: number;
  /**
   * Integer deterministic seed from zero through `MAX_SAFE_INTEGER`.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `seed` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `seed` for the performance formation hierarchy membership command system contract.
   */
  seed: number;
  /**
   * Unique intended formation behaviors for source/review coordination.
   *
   * These labels are not a builder permission boundary and do not prove that
   * source implemented or avoided a motion.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `capabilities` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `capabilities` for the performance formation hierarchy membership command system contract.
   */
  capabilities: AutoMovieFormationCapability[];
  /**
   * Slots promoted to named hero actors.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `heroOverrides` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `heroOverrides` for the performance formation hierarchy membership command system contract.
   */
  heroOverrides: Array<{
    /** Unique zero-based slot strictly below this formation's count. */
    slot: number;
    /** Non-blank actor id, unique among this formation's hero overrides. */
    actor: string;
  }>;
}
