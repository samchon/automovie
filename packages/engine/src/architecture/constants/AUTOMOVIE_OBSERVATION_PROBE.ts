/**
 * Distance, in metres, a containment probe steps off a boundary face.
 *
 * The envelope heuristic probes one millimetre along authored +Z from the face centroid. This is a fixed observation policy, not a guarantee that the face lies on the volume boundary or that either side of a thin/off-volume/concave feature has the expected containment result.
 */
export const AUTOMOVIE_OBSERVATION_PROBE: number = 1e-3;
