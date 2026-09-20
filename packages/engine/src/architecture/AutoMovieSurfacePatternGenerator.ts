import { IAutoMoviePatternCandidate } from "./IAutoMoviePatternCandidate";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * The author's own module program, run once per lattice cell.
 *
 * This is the whole of what the engine does not decide. Square, running bond,
 * herringbone, chevron, radial, and anything a production invents are all this
 * one function written differently: the engine hands over a cell and takes back
 * whatever modules the author puts in it. Nothing here is a preset, because a
 * catalogue of bonds is content, and content is the customer's.
 *
 * The function must be pure: the same cell must always produce the same
 * modules, or the determinism the rest of the pipeline is built on stops at
 * this boundary.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AutoMovieSurfacePatternGenerator` represents the author's own module program, run once per lattice cell. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence requirements/interior/tolerances-and-imperfections.md#interior-imperfection-authoring-choice Keeps every aesthetic deviation inside the author's pure generator and applies no automatic visual noise or preset.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AutoMovieSurfacePatternGenerator` structures the author's own module program, run once per lattice cell for the system that resolves the declared physical-module pattern deterministically.
 */
export type AutoMovieSurfacePatternGenerator = (cell: {
  /** Integer lattice column along the face's U axis. */
  column: number;
  /** Integer lattice row along the face's V axis. */
  row: number;
  /** The cell's own origin in face-local metres. */
  origin: IAutoMoviePatternPoint;
  /** The zone's lattice period in metres. */
  period: {
    /** Cell pitch along U, in metres. */
    u: number;
    /** Cell pitch along V, in metres. */
    v: number;
  };
}) => readonly IAutoMoviePatternCandidate[];
