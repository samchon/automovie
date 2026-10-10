/**
 * The vermilion margin of the oral fissure on the contact's lips surface: the
 * upper lip's lower edge and the lower lip's upper edge, each an ordered vertex
 * chain from one commissure to the other.
 *
 * The chains are the edges the fissure shows from the front: the lower
 * silhouette of the upper vermilion and the upper silhouette of the lower
 * vermilion, projected onto the plane of the mandibular axis and the opening
 * direction, ordered along the axis and running unbroken to the commissure
 * join. These are the existing resident-vertex registrations. Their source
 * identity and order remain unchanged; closure and gap measurement verify
 * actual performed contact rather than deriving acceptance from registration.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceVertexLipMargin {
  /** Existing undiscriminated resident-vertex registration. */
  kind?: undefined;

  /** The upper vermilion's lower edge, ordered along the mandibular axis. */
  upper: number[];

  /** The lower vermilion's upper edge, ordered along the mandibular axis. */
  lower: number[];
}
