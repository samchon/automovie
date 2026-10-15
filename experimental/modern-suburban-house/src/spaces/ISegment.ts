/** One boundary segment of a wall: a rectangle of its face between one pair of spaces. */
export interface ISegment {
  /** Range along the wall. */
  u: [number, number];
  /** Height range. */
  y: [number, number];
  /** The spaces on either side of the segment. */
  sides: readonly [string, string];
}
