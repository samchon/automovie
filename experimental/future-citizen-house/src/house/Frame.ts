/**
 * Local frame of one straight wall or facade, in world metres.
 *
 * The wall runs along `along` from `a` to `b`, sits on the plane where the other horizontal
 * coordinate equals `plane`, and rises from `floor` to `top`. `position`, `rotation` and `localCut`
 * map world coordinates into this frame.
 */
export type Frame = {
  /** Boundary identity shared with the wall's records and its built elements. */
  id: string;

  /** World horizontal axis the wall runs along. */
  along: "x" | "z";

  /** Sign of the wall's facing direction on the perpendicular axis; facade offsets grow outward along it. */
  normal: 1 | -1;

  /** Coordinate of the wall's centre plane on the axis perpendicular to `along`. */
  plane: number;

  /** Start of the wall's run along `along`. */
  a: number;

  /** End of the wall's run along `along`; greater than `a`. */
  b: number;

  /** World height of the wall's bottom. */
  floor: number;

  /** World height of the wall's top. */
  top: number;

  /** Wall thickness across the plane. */
  depth: number;

  /** Spaces the wall bounds: one for an exterior wall, two for a partition. */
  spaces: string[];
};
