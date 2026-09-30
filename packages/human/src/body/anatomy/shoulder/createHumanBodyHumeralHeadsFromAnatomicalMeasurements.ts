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
