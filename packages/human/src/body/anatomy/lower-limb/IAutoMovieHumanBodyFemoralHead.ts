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
 * @evidence contracts/common.md#principled-implementation The union on `source` gives a targeted head no observation and requires an observed head to carry the tomographic observation that measured its radius (`Extract<IAutoMovieHumanBodyTomographicLength, { kind: "observed" }>`), so an imaging radius cannot travel without its modality and posture while a target cannot pass as one. `bone`, `center` and `radiusMetres` are the finite sphere placement: a sphere is fully described by a centre and a radius.
 * @evidence contracts/common.md#clear-and-simple-design One sphere placement plus a two-arm provenance union; no derived or optional field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that a radius and a rig centre give only a joint-head candidate and not the fitted femoral-head centre, neck, shaft, acetabulum, cartilage or soft-tissue contact, that no population prior fills an absent radius, and that skin clearance must be checked in the posed surface before a candidate counts as internal; each property comment states its frame, unit or provenance.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one femoral-head candidate of one side: `bone` names the upper-leg joint that carries it. The femur, acetabulum and coxal bone keep their own declarations and none of their shape is copied here.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidence contracts/modeling.md#emitted-geometry A record is one analytic sphere, a centre and a radius, so no smaller representation exists; at most two records exist per body, one for each side whose radius was specified.
 * @evidence contracts/modeling.md#spatial-conventions `center` is the posed hip rig centre in metres in the body's Y-up, Z-forward frame, `radiusMetres` is metres, and the only conversion, from the millimetre measurement, is made once by `createHumanBodyFemoralHeadsFromAnatomicalMeasurements`; an attached observation keeps its own millimetres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface: a sphere meets the skin only through the signed clearance `measureHumanBodySpheresSkinClearance` reports.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits nothing itself: the radius is admitted with the anatomical measurements and the candidate's fit inside the skin is a separate measured clearance.
 * @evidence contracts/anatomy.md#parametric-authority The radius is a named sphere-fitted head measurement and the centre is the rig's own joint, not an input; no member addresses a vertex, curve or surface patch.
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
