/**
 * A closed storage volume a room owns and uses through a real opening (coat
 * closet, linen closet): a logical space of its own, never a route node.
 */

export interface IStorageSpace {
  /** Storage space identity. */
  id: string;
  /** World x range. */
  x: readonly [number, number];
  /** Height range. */
  y: readonly [number, number];
  /** World z range. */
  z: readonly [number, number];
}
