/**
 * One authored lock seated on a facial surface rather than placed in space.
 *
 * A lock that holds its own coordinates is only correct for the face it was
 * authored against: the first shape edit moves the skin and leaves the hair
 * behind. Naming the triangle the lock grows from, and writing the lock in that
 * triangle's own frame, makes the placement a property of the surface, so
 * reevaluation reads the current triangle to carry the lock with the edited skin.
 *
 * The stations are metres relative to the seat, not to the model origin, and
 * the orthonormal frame is its first edge, normal cross edge, and surface normal,
 * in that order. Across vectors use the frame without seat translation.
 * This legacy source representation supplies guides rather than named biological
 * traits. Binding is not simulation: nothing here moves under force, and
 * rebuilding the seat performs no collision solve or intersection admission.
 *
 * @evidence contracts/common.md#principled-implementation Resident part/triangle identity and seat-relative metre stations let resolveHumanFaceGroom reconstruct the frame from current geometry instead of preserving detached world coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Seat weights, stations, width directions and root width describe one lock; the owning groom supplies the population and finish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current consumers check the resident triangle and noncollapsed frame, but this type does not enforce inside-triangle weights, basis metadata or collision freedom and is not the named biological input API.
 * @evidence contracts/common.md#meaningful-documentation Frame order matches the resolver and distinguishes translated station positions from width directions; metre limits remain authored constraints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no triangle lookup or ribbon construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares source-local coordinates without implementing evaluated-frame caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Guide arrays remain caller-owned; this declaration acquires no mesh, texture or worker.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceGroomCard {
  /** Identity of the resident model part the lock is seated on. */
  part: string;

  /** Ordinal of the seating triangle within that part's own index buffer. */
  triangle: number;

  /** Barycentric weights of the seat inside that triangle, first u then v. */
  weights: readonly [number, number];

  /** Two through 32 root-to-tip stations in the seat frame, in metres. */
  guide: readonly (readonly [number, number, number])[];

  /** Width directions paired with the stations, in the same frame. */
  across: readonly (readonly [number, number, number])[];

  /** Positive full root width in metres, no greater than 0.04. */
  width: number;
}
