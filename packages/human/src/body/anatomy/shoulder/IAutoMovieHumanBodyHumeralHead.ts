import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * One rig-centred spherical humeral articular head in the posed body frame.
 *
 * A sphere-fitted imaging observation or explicit radius target describes an
 * articular component, not the shaft,
 * tubercles or complete humerus. Its centre is the existing rig's posed
 * glenohumeral joint, which has not been verified as an individual's CT
 * humeral-head centre. A separate skin query must establish geometric room.
 */
export type IAutoMovieHumanBodyHumeralHead = {
  /** The upper-arm joint whose posed centre carries this side's head. */
  bone: "leftUpperArm" | "rightUpperArm";

  /** Posed glenohumeral rig centre in metres, Y up and Z forward. */
  center: IAutoMovieVector3;

  /** Articular sphere radius in metres, converted from supplied or prior mm. */
  radiusMetres: number;
} & (
  | { readonly source: "adult-ct-prior" | "target" | "measured" }
  | {
      /** This source records CT/MRI method and posture instead of losing it. */
      readonly source: "observed";
      readonly observation: Extract<
        IAutoMovieHumanBodyTomographicLength,
        { kind: "observed" }
      >;
    }
);
