/**
 * The fixed names of one eye side as the published face declares them: the
 * attachment owner, the articulation centre landmark and its gaze target
 * landmark, and the direction of the head-frame x axis that runs from the
 * medial to the lateral canthus.
 *
 * @author Samchon
 */
export interface IHumanSourceEyeSide {
  /** Anatomical side: left is +X. */
  side: "left" | "right";

  /** Attachment owner and articulation eye ID. */
  owner: "leftEye" | "rightEye";

  /** Eye centre landmark ID (the rotation pivot). */
  center: string;

  /** Gaze target landmark ID in front of the eye. */
  target: string;

  /** +1 when the lateral canthus has the larger x, -1 when the smaller. */
  lateral: 1 | -1;
}
