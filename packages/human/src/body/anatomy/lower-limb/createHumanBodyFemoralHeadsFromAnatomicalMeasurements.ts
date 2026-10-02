import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import { placeHumanBodyArticularSphere } from "../articulation/placeHumanBodyArticularSphere";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { admitHumanBodyAnatomicalMeasurements } from "../measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyFemoralHead } from "./IAutoMovieHumanBodyFemoralHead";

/**
 * Place only specified CT/MRI-observed or targeted femoral-head candidates.
 *
 * The femur is owned by each lower limb's thigh. A missing side stays absent;
 * no male, female or intermediate population radius is invented from a skin
 * hip girth. The same finite sphere placement used for humeral heads checks
 * the posed joint. The hip rig centre is not an individual's CT head centre;
 * this result must pass independent centre registration and skin containment
 * before it can count as validated pelvis or contact anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Each side's sphere comes only from that side's admitted sphere-fitted head radius, converted from millimetres to metres, and the posed upper-leg joint of the same side through `placeHumanBodyArticularSphere`, the placement the humeral heads use. A side without a radius yields no head, so no population radius is invented. Precision is that of one division by 1000; the placement refuses a non-finite or non-positive radius.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the two sides that admits the measurements, reads one optional radius each and delegates placement; ownership of the sphere maths stays with the shared placement function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default radius, side special case or fixture exists: the result is a function of the admitted radii and the posed bones alone, and a missing radius is omitted rather than replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the femur is owned by each side's thigh, that a missing side stays absent and no population radius is invented from a skin hip girth, that the rig centre is not an individual's CT head centre, and that registration and skin containment must be validated before a head counts as anatomy.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group: it maps one side's radius measurement to one sphere record, and the femur and pelvis keep their own declarations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes named absolute measurements and no channel that varies a form.
 * @evidence contracts/modeling.md#emitted-geometry At most one sphere record per side that has a radius, so the population follows the number of specified sides and never grows with anything else; a sphere is analytic, so no smaller representation exists.
 * @evidence contracts/modeling.md#spatial-conventions Input radii are millimetres and output radii are metres, the single conversion `radius.millimetres / 1000`; centres are the posed joint positions in the body's Y-up, Z-forward metre frame and are copied unchanged by the placement.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface or volume; whether the sphere sits inside the skin is measured by `measureHumanBodySpheresSkinClearance`.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and draws nothing; the spheres it returns are candidates that no product path displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own: the radius is the caller's target or imaging observation and the centre is the rig's joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function bounds nothing itself: `admitHumanBodyAnatomicalMeasurements` rejects non-finite and non-positive values before use and the placement rejects a missing joint, and containment in the skin is measured separately.
 * @evidence contracts/anatomy.md#parametric-authority The only input is the named sphere-fitted head radius of each side in the closed measurement tree; the centre comes from the rig and no input addresses a vertex, curve or surface patch.
 * @author Samchon
 */
export function createHumanBodyFemoralHeadsFromAnatomicalMeasurements(input: {
  measurements: IAutoMovieHumanBodyAnatomicalMeasurements;
  bones: IAutoMovieHumanBodyBuild["bones"];
}): IAutoMovieHumanBodyFemoralHead[] {
  const measurements = admitHumanBodyAnatomicalMeasurements(input.measurements);
  return (["left", "right"] as const).flatMap((side) => {
    const radius =
      measurements[`${side}LowerLimb`]?.thigh?.femur?.sphereFittedHeadRadius;
    if (radius === undefined) return [];
    const sphere = placeHumanBodyArticularSphere({
      bone: side === "left" ? "leftUpperLeg" : "rightUpperLeg",
      radiusMetres: radius.millimetres / 1000,
      bones: input.bones,
    });
    return [
      radius.kind === "observed"
        ? { ...sphere, source: "observed" as const, observation: { ...radius } }
        : { ...sphere, source: "target" as const },
    ];
  });
}
