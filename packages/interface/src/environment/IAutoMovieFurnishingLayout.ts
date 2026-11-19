/**
 * A rectangular room in which a furnishing kit places its props.
 *
 * The kit's placement frame is at the floor centre, with Y up. All plan
 * dimensions are metres. The producer checks that dimensions and the aisle
 * are finite and positive, and that reserved rectangles and overridden props
 * fit the useful room. Use the room dimensions inside its walls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the floor-centred frame, units, useful room dimensions and admission owner. The members state the aisle default, the keep-out convention and how overrides select placements.
 * @evidence contracts/development/design.md#principled-representation Labelled XZ tuples distinguish room dimensions, keep-out rectangles and positioned props without transcribing the model geometry. Heading is a yaw relative to the host frame in degrees. The producer checks dimensions, finite coordinates, role identities and feasibility at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The common room input serves amenity producers. Reserved rectangles express the approach and swing spaces they must preserve, while named overrides serve selected objects without restating the layout of the rest.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rectangular rooms and keep-outs are the explicit input domain. An override's obstacle check uses its turned bounding box conservatively, and the layout does not certify general navigation or accessibility compliance.
 */
export interface IAutoMovieFurnishingLayout {
  /** Interior width along X and depth along Z. */
  readonly room: readonly [width: number, depth: number];

  /** Width between generated groups and at the room's sides, default 0.915 m. */
  readonly aisle?: number;

  /** Named areas such as a door swing. The XZ coordinates are the rectangle's lower corner in the room frame. */
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
        /** Local XZ position of the model origin. Its underside is placed on the floor. */
        readonly at: readonly [x: number, z: number];

        /** Turn about local +Y in degrees. */
        readonly heading?: number;
      }
    >
  >;
}
