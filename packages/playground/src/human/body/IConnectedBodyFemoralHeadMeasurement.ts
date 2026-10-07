/**
 * One femoral head target sphere read against the posed skin.
 *
 * The radius is the body document's `anatomy` target; the centre is the hip
 * rig joint, not a registered anatomical head centre.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries one femoral head's target radius and skin room for the editor's reading.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the measured femoral head state the reading panel displays.
 * @author Samchon
 */
export interface IConnectedBodyFemoralHeadMeasurement {
  /** The hip rig bone whose centre places the sphere. */
  bone: "leftUpperLeg" | "rightUpperLeg";

  /** The target radius, metres. */
  radiusMetres: number;

  /** Whether the sphere's centre lies inside the closed skin. */
  centerInside: boolean;

  /** Distance from the centre to the nearest skin point, metres. */
  nearestMetres: number;

  /** Skin room around the sphere (negative where it protrudes), metres. */
  clearanceMetres: number;
}
