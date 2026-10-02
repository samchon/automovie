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
 *
 * @evidence contracts/common.md#principled-implementation The record pairs a centre and a metre radius with a closed provenance union, so an observed head keeps its imaging method and posture and a prior or target cannot pose as one.
 * @evidence contracts/common.md#clear-and-simple-design One intersection of a plain record and a two-arm provenance union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only.
 * @evidence contracts/common.md#meaningful-documentation The comment states that it is a head only, that its centre is the rig joint and not a CT head centre, and the frame and unit of each member.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one articular head of one named upper arm; shaft and tubercles are not part of it.
 * @evidence contracts/modeling.md#spatial-conventions Centre and radius are metres in the posed body basis frame, Y up and Z forward, as the member documentation states.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute quantities, not offsets from a neutral.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; the placement function refuses a nonpositive radius and an unposed joint.
 * @evidence contracts/anatomy.md#parametric-authority The radius is a named articular-head measurement and the bone a closed two-value choice; no member addresses geometry.
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
