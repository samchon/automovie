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
  readonly room: readonly [width: number, depth: number];

  /** Width between generated groups and at the room's sides, default 0.915 m. */
  readonly aisle?: number;

  /**
   * Named areas such as a door swing. The XZ coordinates are the rectangle's
   * lower corner in the room frame.
   */
  readonly keepClear?: Readonly<
    Record<
      string,
      readonly [x: number, z: number, width: number, depth: number]
    >
  >;

  /** Role-keyed placements measured from the room centre, with default yaw zero. */
  readonly overrides?: Readonly<
    Record<
      string,
      {
        /**
         * Local XZ position of the model origin. Its underside is placed on the
         * floor.
         */
        readonly at: readonly [x: number, z: number];

        /** Turn about local +Y in degrees. */
        readonly heading?: number;
      }
    >
  >;
}
