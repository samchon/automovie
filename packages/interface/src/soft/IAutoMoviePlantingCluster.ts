import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePlantingExtent } from "./IAutoMoviePlantingExtent";
import { IAutoMoviePlantingScaleRange } from "./IAutoMoviePlantingScaleRange";

/**
 * A deterministic arrangement of one planting recipe: a planter group, a green wall, a bed of reeds, a row of potted ferns.
 *
 * Repetition is generated, never hand-duplicated. Every member is a seeded placement of the same recipe, and members are refused rather than overlapped when they cannot honour {@link minSpacing}, so a cluster is a stated arrangement with a stated collision rule instead of a list of coordinates somebody typed.
 *
 * @evidence contracts/common.md#principled-implementation Bounded slot/attempt sampling generates candidates in a world-XZ rectangle; a minSpacing-sized grid checks neighboring accepted points before full TRS emission. Exhaustive-test equivalence requires representable cell indices and finite distance-square arithmetic, while zero spacing bypasses rejection; extreme numeric inputs are not universally certified.
 * @evidence contracts/common.md#clear-and-simple-design One cluster defines recipe repetition and placement variability independently from recursive growth and architecture installation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acceptance depends on earlier accepted slots in stable authored order; exhausted attempts produce counted refusal rather than overlap or an invented requested count.
 * @evidence contracts/common.md#meaningful-documentation Defines count, world anchor and half-extents, safe seed, spacing and attempt bounds, axis scale and normalized-quaternion yaw jitter.
 * @author Samchon
 */
export interface IAutoMoviePlantingCluster {
  /** Stable cluster identity within the production. */
  id: string;

  /** Id of the planting recipe every member grows from. */
  domain: string;

  /** Members to place; an integer of at least 1. */
  count: number;

  /** World centre of the placement rectangle. */
  anchor: IAutoMovieVector3;

  /** Half-extent of the placement rectangle in metres; each `>= 0`. */
  extent: IAutoMoviePlantingExtent;

  /** Deterministic seed; any safe integer. */
  seed: number;

  /**
   * Centre-to-centre distance members must keep, in metres; `>= 0`. A member that cannot be placed within {@link attempts} tries is refused and counted, never squeezed in: a cluster that quietly overlapped would be a cluster whose author was told nothing and whose frames changed anyway.
   */
  minSpacing: number;

  /** Seeded placement attempts per member; an integer of at least 1. */
  attempts: number;

  /** Per-axis scale range every member is drawn from. */
  scale: IAutoMoviePlantingScaleRange;

  /**
   * Seeded turn about world `+y`, in `[0, 1]`. `0` faces every member the same way; `1` turns each anywhere. The turn is blended toward identity as a normalized quaternion interpolation, so a partial jitter is a partial rotation rather than a scaled angle no trigonometry-free derivation could reproduce exactly.
   */
  yawJitter: number;
}
