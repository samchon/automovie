import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/** Declared and measured extents kept separate for honest inspection. */
export interface IAutoMovieSubjectBounds {
  /** Authored or builder-declared extent, or null when none exists. */
  declared: IAutoMovieSubjectBox | null;

  /** Extent measured from resident compiled content, or null when empty. */
  content: IAutoMovieSubjectBox | null;

  /** Coordinate basis shared by both non-null boxes. */
  coordinateSpace: "model" | "world";
}
