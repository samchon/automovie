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
 * `generateAutoMovieSurfacePattern` calls it rows outermost and columns
 * innermost over the zone's region bounds widened by the zone's `reach`, at most
 * `AUTOMOVIE_MAX_PATTERN_CELLS` cells per zone. Each returned candidate is
 * checked (non-blank id unique in its zone, finite centre, rotation and grain,
 * positive size, every corner within `reach` of the cell origin) and the run
 * throws on the first one that fails.
 *
 * @evidence contracts/common.md#principled-implementation A caller-supplied pure function from one lattice cell to module candidates; the engine enumerates cells over the region bounds widened by `reach` and divided by `period`, so every cell whose modules could touch the region is called exactly once, and the result is deterministic exactly when the function is.
 * @evidence contracts/common.md#clear-and-simple-design A plain function type is the smallest seam that lets any bond be authored without an engine-side preset, and the cell argument carries only the lattice index, origin and period a module program needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Purity is a premise the engine cannot check, so an impure generator would break determinism silently, as the documentation states; what the engine does check is each candidate's id, finiteness, size and reach, throwing on the first violation.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the program is the author's, the purity premise and its consequence, the call order and cell bound, and every check applied to the result; each cell member states its unit and that the period is a fresh copy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A function signature with no body; the engine calls it once per lattice cell, at most one million cells per zone.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature with no body; the engine never memoizes a cell because each cell is visited exactly once per run.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature with no body; the engine keeps none of the returned arrays after copying each candidate's centre and size into a placement.
 * @author Samchon
 */
export type AutoMovieSurfacePatternGenerator = (cell: {
  /** Integer lattice column along the face's U axis. */
  column: number;

  /** Integer lattice row along the face's V axis. */
  row: number;

  /** The cell's own origin in face-local metres. */
  origin: IAutoMoviePatternPoint;

  /** The zone's lattice period in metres, a fresh copy per call. */
  period: {
    /** Cell pitch along U, in metres. */
    u: number;

    /** Cell pitch along V, in metres. */
    v: number;
  };
}) => readonly IAutoMoviePatternCandidate[];
