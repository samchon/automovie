import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import { placeHumanBodyArticularSphere } from "../articulation/placeHumanBodyArticularSphere";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { admitHumanBodyAnatomicalMeasurements } from "../measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyFemoralHead } from "./IAutoMovieHumanBodyFemoralHead";
import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * Place only specified CT/MRI-observed or targeted femoral-head candidates.
 *
 * The femur is owned by each lower limb's thigh. A missing side stays absent; no male, female or intermediate population radius is invented from a skin hip girth. The same finite sphere placement used for humeral heads checks the posed joint. The hip rig centre is not an individual's CT head centre; this result must pass independent centre registration and skin containment before it can count as validated pelvis or contact anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Admitted bilateral head radii convert millimetres to metres and use the shared finite sphere placement; centres remain rig candidates.
 * @evidence contracts/common.md#clear-and-simple-design Anatomical admission owns quantity validity while sphere placement owns posed-bone transforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing sides emit nothing; neither hip girth nor sex supplies an invented radius.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes target/observed provenance and requires independent centre registration and containment before validation claims.
 * @evidence contracts/performance.md#efficient-algorithms Admission traverses the supplied measurement tree; exactly two radius lookups and constant-size sphere placements follow.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted tree is reused for both sides within one call; mutable bones and radii prevent persistent result equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each call owns at most two returned candidates and copied observations, with no retained buffers or handles.
 */
export function createHumanBodyFemoralHeadsFromAnatomicalMeasurements(input: {
  measurements: IAutoMovieHumanBodyAnatomicalMeasurements;
  bones: IAutoMovieHumanBodyBuild["bones"];
}): IAutoMovieHumanBodyFemoralHead[] {
  const measurements: IAutoMovieHumanBodyAnatomicalMeasurements = admitHumanBodyAnatomicalMeasurements(input.measurements);
  return (["left", "right"] as const).flatMap((side: AutoMovieHumanBodySide): IAutoMovieHumanBodyFemoralHead[] => {
    const radius: IAutoMovieHumanBodyTomographicLength | undefined =
      measurements[`${side}LowerLimb`]?.thigh?.femur?.sphereFittedHeadRadius;
    if (radius === undefined) return [];
    const sphere: Pick<IAutoMovieHumanBodyFemoralHead, "bone" | "center" | "radiusMetres"> = placeHumanBodyArticularSphere({
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
