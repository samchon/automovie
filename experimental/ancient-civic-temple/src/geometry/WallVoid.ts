/** A real void (opening outline including the frame) defined by a length interval and a vertical interval. */

export interface WallVoid {
  /** Opening identity. */
  id: string;
  /** Start of the void along the wall. */
  from: number;
  /** End of the void along the wall. */
  to: number;
  /** World height of the void's bottom. */
  bottom: number;
  /** World height of the void's top. */
  top: number;
}
