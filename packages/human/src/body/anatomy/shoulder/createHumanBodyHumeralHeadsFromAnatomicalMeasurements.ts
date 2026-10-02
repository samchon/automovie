import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { admitHumanBodyAnatomicalMeasurements } from "../measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";
import { placeHumanBodyHumeralHead } from "./placeHumanBodyHumeralHead";

/**
 * Resolve only directly specified humeral-head radii from the new anatomy tree.
 *
 * Each side's radius is a physical millimetre target or CT/MRI 3D sphere fit.
 * Absence gives no sphere; it never substitutes an unvalidated intermediate
 * sex prior or treats shoulder skin breadth as a humeral radius. Input
 * admission rejects a radiograph presented as a fitted 3D sphere. The shared
 * placement helper keeps this component's posed rig centre and skin-clearance
 * limitations identical to the legacy CT-backed path. Other anatomical
 * measurements are outside this component's scope and are not consumed here.
 *
 * @evidence contracts/common.md#principled-implementation Only a directly specified sphere-fitted radius yields a head, so absence never invents a prior; the observed and target kinds are routed to the one shared placement helper, and input admission runs first.
 * @evidence contracts/common.md#clear-and-simple-design One function that reads the two sides' radius fields and delegates placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject is special-cased and no default radius is substituted for a missing measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment states that absence gives no sphere, that a radiograph is refused at admission and what limitations the shared helper carries.
 * @evidence contracts/modeling.md#part-identity-and-grouping The function composes at most two heads, one per named upper arm, each placed by the single-head declaration.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres of the measurement are converted to metres exactly once, here, before the shared helper, whose output frame is the body basis frame (Y up, Z forward).
 * @evidenceExclude contracts/modeling.md#parameter-channels The radius is an absolute measured or target quantity, not an offset from a neutral.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits sphere records, not vertices or triangles.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are the named anatomical measurements tree, admitted by `admitHumanBodyAnatomicalMeasurements`, and the only value read is a named sphere-fitted humeral head radius.
 * @author Samchon
 */
export function createHumanBodyHumeralHeadsFromAnatomicalMeasurements(input: {
  measurements: IAutoMovieHumanBodyAnatomicalMeasurements;
  bones: IAutoMovieHumanBodyBuild["bones"];
}): IAutoMovieHumanBodyHumeralHead[] {
  const measurements = admitHumanBodyAnatomicalMeasurements(input.measurements);
  return (["left", "right"] as const).flatMap((side) => {
    const radius =
      measurements[`${side}UpperLimb`]?.upperArm?.humerus
        ?.sphereFittedHeadRadius;
    if (radius === undefined) return [];
    const placement = {
      bone: side === "left" ? "leftUpperArm" : "rightUpperArm",
      bones: input.bones,
    } as const;
    return [
      radius.kind === "observed"
        ? placeHumanBodyHumeralHead({
            ...placement,
            source: "observed",
            observation: radius,
          })
        : placeHumanBodyHumeralHead({
            ...placement,
            source: "target",
            radiusMetres: radius.millimetres / 1000,
          }),
    ];
  });
}
