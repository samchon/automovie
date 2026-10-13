/**
 * One requested femoral-head target sphere's fit against the posed skin. The radius is the document's anatomy target, and the centre is the hip rig origin rather than a registered anatomical head centre. Containment and clearance use the numerical skin owner's capped surface and remain geometric observations.
 *
 * @evidence contracts/common.md#principled-implementation A closed hip-bone identity pairs the requested radius with current skin containment and signed nearest-distance clearance.
 * @evidence contracts/common.md#clear-and-simple-design The record contains the sphere fit; source radius admission and skin query implementation stay with their producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absent target becomes a population estimate, and rig-centred clearance does not assert a resolved hip joint.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies target and rig-centre authority, while members define metre units and signed clearance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This scalar femoral fit schema executes no containment algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record does not coordinate repeated sphere queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no skin surface or native resource.
 *
 * @author Samchon
 */
export interface IConnectedBodyFemoralHeadMeasurement {
  /** The hip rig bone whose centre places the sphere. */
  bone: "leftUpperLeg" | "rightUpperLeg";

  /** The target radius, metres. */
  radiusMetres: number;

  /** Whether the numerical query places the centre inside its capped posed skin. */
  centerInside: boolean;

  /** Distance from the centre to the nearest skin point, metres. */
  nearestMetres: number;

  /** Inside: nearest distance minus radius; outside: negative nearest distance minus radius, in metres. */
  clearanceMetres: number;
}
