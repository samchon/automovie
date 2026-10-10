import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * One CT/MRI-fitted or targeted femoral articular sphere at the posed hip rig.
 *
 * A radius and present rig centre provide only a joint-head candidate, not
 * the person's fitted femoral-head centre, neck, shaft, acetabulum, cartilage
 * or soft-tissue contact. There is no unvalidated population prior when a
 * side's anatomical radius is absent. Skin clearance must be checked in the
 * posed connected surface before interpreting a candidate as internal.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyFemoralHead = {
  /** Upper-leg rig joint carrying the head on the matching anatomical side. */
  readonly bone: "leftUpperLeg" | "rightUpperLeg";
  /** Posed hip rig centre in metres, Y up and Z forward. */
  readonly center: IAutoMovieVector3;
  /** Sphere-fitted or desired articular radius converted from millimetres. */
  readonly radiusMetres: number;
} & (
  | { readonly source: "target" }
  | {
      readonly source: "observed";
      /** Direct CT/MRI acquisition and posture retained with the radius. */
      readonly observation: Extract<
        IAutoMovieHumanBodyTomographicLength,
        { kind: "observed" }
      >;
    }
);
