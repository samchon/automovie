/**
 * One authored lock seated on a facial surface rather than placed in space.
 *
 * A lock that holds its own coordinates is only correct for the face it was
 * authored against: the first shape edit moves the skin and leaves the hair
 * behind. Naming the triangle the lock grows from, and writing the lock in that
 * triangle's own frame, makes the placement a property of the surface, so a
 * widened head or an opened jaw carries its hair without anything recomputing.
 *
 * The stations are metres relative to the seat, not to the model origin, and
 * the frame is the seating triangle's first edge, its surface normal, and their
 * cross product. Binding is not simulation: nothing here moves under force, and
 * a lock that intersects the scalp when seated still intersects it afterwards.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names the rooted guide, width and transverse orientation of one surface-based hair lock.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines head-space guide stations that emit a continuous UV-bearing strip.
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
