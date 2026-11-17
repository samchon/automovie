/**
 * Three ordered Cartesian components for numerical points, vectors and directions.
 *
 * The containing field owns the frame and units. Solid construction commonly
 * uses millimetres; the Human registered frame points forward along +X and left
 * along +Z, while authored scene positions use metres with forward +Z. Sharing
 * this representation does not convert between those frames or units. The
 * object representation `IAutoMovieVector3` retains its own authored convention.
 *
 * Coordinates are mutable; `Readonly<AutoMovieVector3Tuple>` is the borrowed
 * view. Operations document whether they allocate, retain or change arrays.
 * Numerical callers admit finite values, compatible frames and any required
 * normalization. This type supplies no runtime gate or default coordinates.
 *
 * @evidence contracts/development/design.md#principled-representation A fixed x/y/z tuple preserves Cartesian component order while each field determines its physical units and reference frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Solid-vector algebra, Human geometry and recovery share one tuple owner; object vectors retain their distinct representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Triangle indices, Euler angles, derivative jets and random state words are not Cartesian vectors merely because they have three components.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source frames and units, mutable results and borrowed views, and the numerical caller's validation obligations.
 */
export type AutoMovieVector3Tuple = [x: number, y: number, z: number];
