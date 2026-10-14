import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One explicitly authored instance placement with sparse prototype and appearance overrides.
 *
 * @evidence contracts/common.md#principled-implementation A stable entry id and anchor-relative TRS determine one exact placement; unit quaternion and positive scale preserve the transform domain, while optional prototype, visibility, palette and declared traits override the set's ordinary choices.
 * @evidence contracts/common.md#clear-and-simple-design Required placement coordinates are separate from optional per-entry differences, so an explicit set can reuse its prototype table and default palette without repeating them on every member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing explicit prototype ids throw. Declared trait names, finite overrides, palette encoding and unit rotation are caller premises; instanceSlot merges explicit traits without enforcing their declared names or finiteness. Building admission checks transform coordinates, positive scale and quaternion norm within 1e-6, not those appearance and identity premises.
 * @evidence contracts/common.md#meaningful-documentation Gives set-scoped identity, anchor-relative metre translation, glTF quaternion order, positive scale and omission semantics for prototype, visibility, palette and numeric traits.
 * @author Samchon
 */
export interface IAutoMovieExplicitInstanceTransform {
  /** Stable non-blank identity unique inside the set. */
  id: string;

  /** Translation relative to the set anchor, in meters. */
  translation: IAutoMovieVector3;

  /** Exact unit quaternion in glTF `(x, y, z, w)` order. */
  rotation: IAutoMovieQuaternion;

  /** Strictly positive scale on each local axis. */
  scale: IAutoMovieVector3;

  /** Optional prototype id; omission uses the seeded weighted choice, including the default prototype. */
  prototype?: string;

  /** Omission uses the set's seeded visibility probability, or visible when that probability is also omitted. */
  visible?: boolean;

  /**
   * Optional exact `#RRGGBB` palette override.
   *
   * Decoded from sRGB by `srgbHexToLinearColor` like every other palette entry; see `IAutoMovieInstanceVariation.palette` for how that differs from `IAutoMovieColor`.
   */
  palette?: string;

  /** Optional exact overrides for declared numeric traits. */
  traits?: Record<string, number>;
}
