import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One rig-centred spherical humeral articular head in the posed body frame.
 *
 * A sphere-fitted CT head describes an articular component, not the shaft,
 * tubercles or complete humerus. Its centre is the existing rig's posed
 * glenohumeral joint, which has not been verified as an individual's CT
 * humeral-head centre. A separate skin query must establish geometric room.
 */
export interface IAutoMovieHumanBodyHumeralHead {
  /** The upper-arm joint whose posed centre carries this side's head. */
  bone: "leftUpperArm" | "rightUpperArm";

  /** Posed glenohumeral rig centre in metres, Y up and Z forward. */
  center: IAutoMovieVector3;

  /** Sphere-fitted articular radius in metres, converted from source mm. */
  radiusMetres: number;

  /** Direct anatomical measurement or a prediction within the adult CT cohort. */
  source: "measured" | "adult-ct-prior";
}
