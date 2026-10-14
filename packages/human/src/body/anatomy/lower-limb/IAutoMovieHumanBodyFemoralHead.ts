import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * One CT/MRI-fitted or targeted femoral articular sphere at the posed hip rig.
 *
 * A radius and present rig centre provide only a joint-head candidate, not the person's fitted femoral-head centre, neck, shaft, acetabulum, cartilage or soft-tissue contact. There is no unvalidated population prior when a side's anatomical radius is absent. Skin clearance must be checked in the posed connected surface before interpreting a candidate as internal.
 *
 * @evidence contracts/common.md#principled-implementation Metre sphere geometry at a matching posed hip carrier stays paired with target or observed tomographic provenance.
 * @evidence contracts/common.md#clear-and-simple-design An intersection separates common sphere fields from source-discriminated acquisition detail.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent radius supplies no population prior, and rig placement certifies no personal centre, complete femur or contact.
 * @evidence contracts/common.md#meaningful-documentation Members specify side/frame/units, target-versus-observed provenance and registration/clearance limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Femoral candidate typing places no hip sphere or clearance geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source qualification records no reusable posed-head calculation or registration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The femoral head record owns no tessellated sphere or retained imaging payload.
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
  | {
      /** An authored physical radius without a registered imaging acquisition. */
      readonly source: "target";
    }
  | {
      /** A retained acquisition whose posed rig centre still requires independent registration. */
      readonly source: "observed";

      /** Direct CT/MRI acquisition and posture retained with the radius. */
      readonly observation: Extract<
        IAutoMovieHumanBodyTomographicLength,
        { kind: "observed" }
      >;
    }
);
