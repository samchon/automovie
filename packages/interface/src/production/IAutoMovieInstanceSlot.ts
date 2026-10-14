import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One exactly regenerated member of a non-formation instance set.
 *
 * @evidence contracts/common.md#principled-implementation instanceSlot derives placement, independent salted variation and weighted prototype selection from the admitted compiled set and slot; explicit transforms override their stated channels after the common selection rules.
 * @evidence contracts/common.md#clear-and-simple-design The member projection supplies reusable recipe identity and final spatial and visual values; enhanced fields appear together when prototypes, lattice, explicit transforms or enhanced variation are declared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy single-prototype output intentionally omits enhanced fields and preserves its established eight-field shape; explicit unavailable prototypes and out-of-range slots refuse rather than falling back.
 * @evidence contracts/common.md#meaningful-documentation Defines deterministic identity, world placement, default scalar versus enhanced full transforms, optional visibility and exact sRGB palette and named traits.
 * @author Samchon
 */
export interface IAutoMovieInstanceSlot {
  /** Zero-based deterministic slot index. */
  slot: number;

  /** Compiler-owned stable instance id. */
  node: string;

  /** Runtime model recipe id. */
  modelRecipe: string;

  /** Selected prototype id; omitted for a legacy single-prototype set. */
  prototype?: string;

  /** Compiler-derived world position in meters. */
  position: IAutoMovieVector3;

  /** Compiler-derived world-space heading in degrees. */
  facingDeg: number;

  /** Positive sampled uniform scale; scale3 supplies the full scale when present. */
  scale: number;

  /** Full world rotation for an enhanced set; absent means heading-only legacy placement. */
  rotation?: IAutoMovieQuaternion;

  /** Full local-axis scale for an enhanced set, replacing the scalar scale for placement. */
  scale3?: IAutoMovieVector3;

  /** Explicit or seeded visibility for an enhanced set; omitted legacy slots are visible. */
  visible?: boolean;

  /** Selected exact sRGB palette value. */
  palette: string;

  /** Seed-derived numeric traits keyed by declared name. */
  traits: Record<string, number>;
}
