/**
 * One run projected onto XZ for serviceNetworkSchematic; y below means world Z.
 * New mutable point records and the array are caller-owned; the report does not
 * retain source route point objects or validate their numeric values.
 */
export interface IAutoMovieServiceSchematicEdge {
  /** Stable segment identity. */
  id: string;

  /**
   * Node owning the emitting port, or the authored port id when its owner is
   * unresolved.
   */
  from: string;

  /**
   * Node owning the receiving port, or the authored port id when its owner is
   * unresolved.
   */
  to: string;

  /** Projected centre line, in declaration order. */
  points: Array<{
    /** World X coordinate in metres, copied into the plan. */
    x: number;

    /** World Z coordinate in metres; this plan ordinate is not world height. */
    y: number;
  }>;

  /** Developed length of the **unprojected** centre line, in metres. */
  length: number;
}
