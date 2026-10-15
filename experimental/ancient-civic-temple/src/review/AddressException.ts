
/**
 * A named strip of a wall face that may stay exposed without a boundary address; it remains an
 * inspection question.
 */
export interface AddressException {
  /** Wall identity. */
  wall: string;
  /** Index of the face within the wall's emitted faces. */
  face: number;
  /** World axis the strip's interval is measured on. */
  axis: "x" | "z";
  /** Start of the strip on `axis`. */
  from: number;
  /** End of the strip on `axis`. */
  to: number;
  /** Height above which the strip applies. */
  minY?: number;
  /**
   * Sloped lower edge: before `untilZ` the strip applies only above the line through `atZ, atY`
   * rising by `rise` per metre of z.
   */
  lowerEdge?: { untilZ: number; atZ: number; atY: number; rise: number; };
  /** Observation station that shows the strip. */
  observation: string;
}
