/**
 * A named point of a basis's skin, face or body: one vertex of one surface.
 *
 * Measurement rules and garments refer to skin points by name, never by
 * vertex number, because vertex numbers belong to one basis's topology: the
 * same index names a different place on another basis. Each basis states
 * where its own named points are. A rule naming a point the basis does not
 * declare refuses by that name.
 *
 * @evidence contracts/common.md#principled-implementation One surface ordinal and vertex ordinal register a named anatomical skin point within a basis topology.
 * @evidence contracts/common.md#clear-and-simple-design The basis owns the ordinal binding while measurement rules consume the name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names are resolved per basis instead of assuming a vertex index is anatomical identity across bodies.
 * @evidence contracts/common.md#meaningful-documentation The prose states topology ownership and refusal for undeclared names.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The named skin landmark binding has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The named skin landmark binding schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The named skin landmark binding declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinLandmark {
  /** Index into the basis's surfaces. */
  surface: number;

  /** Index of the vertex in that surface. */
  vertex: number;
}
