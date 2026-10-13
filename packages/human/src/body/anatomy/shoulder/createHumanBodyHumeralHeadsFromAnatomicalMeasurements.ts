import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { admitHumanBodyAnatomicalMeasurements } from "../measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";
import { placeHumanBodyHumeralHead } from "./placeHumanBodyHumeralHead";

/**
 * Resolve only directly specified humeral-head radii from the new anatomy tree.
 *
 * Each side's radius is a physical millimetre target or CT/MRI 3D sphere fit. Absence gives no sphere; it never substitutes an unvalidated intermediate sex prior or treats shoulder skin breadth as a humeral radius. Input admission rejects a radiograph presented as a fitted 3D sphere. The shared placement helper keeps this component's posed rig centre and skin-clearance limitations identical to the legacy CT-backed path. Other anatomical measurements are outside this component's scope and are not consumed here.
 *
 * @evidence contracts/common.md#principled-implementation Runtime anatomical admission precedes side-specific radius selection; target millimeters or observed sphere-fit provenance feed the same posed articular placement.
 * @evidence contracts/common.md#clear-and-simple-design This anatomy-tree entry owns radius lookup and omission while shared admission and placement own quantity validity and joint geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing radii create no spheres and shoulder breadth supplies no substitute; observed imaging must satisfy tomographic sphere-fit admission.
 * @evidence contracts/common.md#meaningful-documentation The prose describes target/observed provenance, omission, admission errors, scope and unresolved posed-center/skin-clearance limits.
 * @evidence contracts/performance.md#efficient-algorithms Full measurement admission traverses the supplied anatomy tree; two constant side lookups then each scan O(B) posed bones through placement.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides share one admitted measurement result and supplied bones; no cross-call result is reused across differing anatomy or pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Admission and placement intermediates are local; at most two head records escape without retaining the caller's bone array.
 * @author Samchon
 */
export function createHumanBodyHumeralHeadsFromAnatomicalMeasurements(input: {
  measurements: IAutoMovieHumanBodyAnatomicalMeasurements;
  bones: IAutoMovieHumanBodyBuild["bones"];
}): IAutoMovieHumanBodyHumeralHead[] {
  const measurements: IAutoMovieHumanBodyAnatomicalMeasurements = admitHumanBodyAnatomicalMeasurements(input.measurements);
  return (["left", "right"] as const).flatMap((side: "left" | "right"): IAutoMovieHumanBodyHumeralHead[] => {
    const radius: IAutoMovieHumanBodyTomographicLength | undefined =
      measurements[`${side}UpperLimb`]?.upperArm?.humerus
        ?.sphereFittedHeadRadius;
    if (radius === undefined) return [];
    const placement: { readonly bone: IAutoMovieHumanBodyHumeralHead["bone"]; readonly bones: IAutoMovieHumanBodyBuild["bones"] } = {
      bone: side === "left" ? "leftUpperArm" : "rightUpperArm",
      bones: input.bones,
    };
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
