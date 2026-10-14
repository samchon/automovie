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
 * @evidence contracts/common.md#principled-implementation The common margin reader resolves these ordered resident vertex chains directly on the actual performed lip surface while preserving canonical source witnesses for closure/gap consumers.
 * @evidence contracts/common.md#clear-and-simple-design The legacy undiscriminated representation keeps upper/lower source chains distinct from kind-material facet courses without another free-coordinate trajectory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source chain order does not establish final ordered contact, closure, seal or tissue budget; actual margin/contact owners judge performed geometry rather than promoting registration to acceptance.
 * @evidence contracts/common.md#meaningful-documentation Vermilion edges, commissure direction, mandibular-frame projection and optional-undefined kind explain the actual resident representation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no point read, interpolation or closure solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Native source identity supplies correspondence without caching posed margins here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source arrays retain no contact query or generated geometry.
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
