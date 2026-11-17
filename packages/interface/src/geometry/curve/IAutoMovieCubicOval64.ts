/** Data and callback contracts shared by the CubicOval64 operations. */
export namespace IAutoMovieCubicOval64 {
  /**
   * Resolve breadthMm/depthMm at a fixed positive breadth/depth ratio using the same Simpson perimeter. Both inputs must be positive finite values; circumference and returned diameters are in millimetres.
   */
  export type IAxesBySimpsonResult = {
    /** Positive lateral support separation of the normalized cubic oval, mm. */
    breadthMm: number;

    /** Positive anterior/posterior support separation of that same oval, mm. */
    depthMm: number;
  };
}
