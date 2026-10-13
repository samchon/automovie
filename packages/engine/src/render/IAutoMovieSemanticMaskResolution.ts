import { IAutoMovieSemanticMaskEntry } from "@automovie/interface";

/** A mask entry with the complete ownership chain above it. */
export interface IAutoMovieSemanticMaskResolution {
  /** The entry that owns the colour. */
  entry: IAutoMovieSemanticMaskEntry;
  /** Owners from the tightest container outward; empty for a root entry. */
  ancestors: IAutoMovieSemanticMaskEntry[];
}
