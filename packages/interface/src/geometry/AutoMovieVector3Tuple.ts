/**
 * Three ordered Cartesian components for numerical points, vectors and
 * directions.
 *
 * The containing field owns the frame and units. Solid construction commonly
 * uses millimetres; the Human registered frame points forward along +X and left
 * along +Z, while authored scene positions use metres with forward +Z. Sharing
 * this representation does not convert between those frames or units. The
 * object representation `IAutoMovieVector3` retains its own authored
 * convention.
 *
 * Coordinates are mutable; `Readonly<AutoMovieVector3Tuple>` is the borrowed
 * view. Operations document whether they allocate, retain or change arrays.
 * Numerical callers admit finite values, compatible frames and any required
 * normalization. This type supplies no runtime gate or default coordinates.
 */
export type AutoMovieVector3Tuple = [x: number, y: number, z: number];
