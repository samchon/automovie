import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import { admitHumanBodyAnatomicalMeasurements } from "../measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { placeHumanBodyArticularSphere } from "../articulation/placeHumanBodyArticularSphere";
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
 * @author Samchon
 */
export function createHumanBodyFemoralHeadsFromAnatomicalMeasurements(input: {
  measurements: IAutoMovieHumanBodyAnatomicalMeasurements;
  bones: IAutoMovieHumanBodyBuild["bones"];
}): IAutoMovieHumanBodyFemoralHead[] {
  const measurements = admitHumanBodyAnatomicalMeasurements(input.measurements);
  return (["left", "right"] as const).flatMap((side) => {
    const radius = measurements[`${side}LowerLimb`]?.thigh?.femur?.sphereFittedHeadRadius;
    if (radius === undefined) return [];
    const sphere = placeHumanBodyArticularSphere({
      bone: side === "left" ? "leftUpperLeg" : "rightUpperLeg",
      radiusMetres: radius.millimetres / 1000,
      bones: input.bones,
    });
    return [radius.kind === "observed"
      ? { ...sphere, source: "observed" as const, observation: { ...radius } }
      : { ...sphere, source: "target" as const }];
  });
}
