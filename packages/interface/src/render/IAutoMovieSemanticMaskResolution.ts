import type { IAutoMovieSemanticMaskEntry } from "./IAutoMovieSemanticMaskEntry";

/** A matched mask entry with the reachable ownership prefix above it. */
export interface IAutoMovieSemanticMaskResolution {
  /** The entry that owns the colour. */
  entry: IAutoMovieSemanticMaskEntry;

  /** Reachable owners outward; root, missing link or cycle ends the prefix. */
  ancestors: IAutoMovieSemanticMaskEntry[];
}
