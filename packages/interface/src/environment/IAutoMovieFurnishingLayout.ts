import type { IAutoMovieFurnishingOverride } from "./IAutoMovieFurnishingOverride";
import type { IAutoMovieFurnishingRectangle } from "./IAutoMovieFurnishingRectangle";
import type { IAutoMovieFurnishingRoomSize } from "./IAutoMovieFurnishingRoomSize";

/**
 * A rectangular room in which a furnishing kit places its props.
 *
 * The kit's placement frame is at the floor centre, with Y up. All plan
 * dimensions are metres. The producer checks that dimensions and the aisle are
 * finite and positive, and that reserved rectangles and overridden props fit
 * the useful room. Use the room dimensions inside its walls.
 */
export interface IAutoMovieFurnishingLayout {
  /** Interior width along X and depth along Z. */
  readonly room: IAutoMovieFurnishingRoomSize;

  /** Width between generated groups and at the room's sides, default 0.915 m. */
  readonly aisle?: number;

  /**
   * Named areas such as a door swing. The XZ coordinates are the rectangle's
   * lower corner in the room frame.
   */
  readonly keepClear?: Readonly<
    Record<string, IAutoMovieFurnishingRectangle>
  >;

  /** Role-keyed placements measured from the room centre, with default yaw zero. */
  readonly overrides?: Readonly<
    Record<string, IAutoMovieFurnishingOverride>
  >;
}
