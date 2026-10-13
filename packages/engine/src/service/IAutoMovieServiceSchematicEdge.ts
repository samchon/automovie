/** One run in a plan schematic, projected onto the horizontal plane. */
export interface IAutoMovieServiceSchematicEdge {
  /** Stable segment identity. */
  id: string;
  /** Node the run leaves. */
  from: string;
  /** Node the run enters. */
  to: string;
  /** Projected centre line, in declaration order. */
  points: Array<{ x: number; y: number }>;
  /** Developed length of the **unprojected** centre line, in metres. */
  length: number;
}
