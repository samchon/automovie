import type { IAutoMovieBuiltBoundary } from "../architecture/IAutoMovieBuiltBoundary";
import type { IAutoMovieBuiltElement } from "../architecture/IAutoMovieBuiltElement";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieModelPart } from "../model/IAutoMovieModelPart";
import type { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";

/**
 * One built environment indexed for a single drawing, schedule or feature
 * derivation.
 *
 * Produced by `indexDrawingDesign` and owned by the derivation that
 * built it. The index reads the environment as it was when indexed, so a caller
 * that edits the environment builds a new one rather than reusing it.
 */
export interface IAutoMovieDrawingDesignIndex {
  /** Every element by id. */
  elements: ReadonlyMap<string, IAutoMovieBuiltElement>;

  /**
   * Every environment-owned model by id.
   *
   * A builder-owned runtime model is absent, which is how a derivation tells an
   * element whose geometry the design does not carry.
   */
  models: ReadonlyMap<string, IAutoMovieModel>;

  /** Every boundary by id. */
  boundaries: ReadonlyMap<string, IAutoMovieBuiltBoundary>;

  /**
   * Column-major world matrix of every element, keyed by element id.
   *
   * Each element stands in its current operating state, the staging
   * `lowerBuiltEnvironment` gives the scene, so a drawn line and the set piece
   * it depicts stand in the same place.
   */
  matrices: ReadonlyMap<string, number[]>;

  /**
   * Triangles of one model part in model-frame metres.
   *
   * Memoized per part object for the index's lifetime, so a model placed many
   * times is tessellated once. Throws as `drawingPartTriangles` does
   * for a malformed mesh. The returned array is shared between calls and must
   * not be mutated.
   */
  partTriangles: (
    model: IAutoMovieModel,
    part: IAutoMovieModelPart,
  ) => readonly IAutoMovieDrawingTriangle[];
}
