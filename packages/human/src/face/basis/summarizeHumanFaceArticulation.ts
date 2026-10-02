import { Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";

/**
 * State the joint motion one document asks of an articulated basis, in the
 * units a reader checks: degrees of opening, millimetres of mandibular
 * translation against the sagittal budget, and each eye's gaze angle.
 *
 * The connected runtime attaches this to a preview so the editor can print
 * what the joints did beside the crossing census, and a document past the
 * budget fails here with the same named refusal the builder raises, before
 * any geometry is formed. It reads the shaped landmarks through the same
 * rest layer the builder evaluates, so the pivot and centres it reports are
 * the ones the render used. A basis without articulation summarizes to null.
 * This describes the requested motion; it certifies no contact or anatomy.
 *
 * @evidence contracts/common.md#principled-implementation The report reads the same shaped rest landmarks and the same resolver the builder uses, so the pivot and centres it prints are those the render used and a document past the translation budget fails with the same refusal before any geometry is formed. The eye angle is 2 atan2(|vector part|, |w|) of the unit rotation quaternion, the rotation angle of that rotation.
 * @evidence contracts/common.md#clear-and-simple-design One function that resolves weights, landmarks and articulation and reformats them in the units a reader checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It describes the requested motion and certifies nothing, as the docs say.
 * @evidence contracts/common.md#meaningful-documentation States the units, the null result for a basis without articulation and the limits of what is reported.
 * @evidence contracts/modeling.md#spatial-conventions Degrees for angles, metres for translation and pivot, in the basis frame.
 * @evidenceExclude contracts/anatomy.md#parametric-authority summarizeHumanFaceArticulation defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping summarizeHumanFaceArticulation is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels summarizeHumanFaceArticulation defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry summarizeHumanFaceArticulation emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries summarizeHumanFaceArticulation constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation summarizeHumanFaceArticulation owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function summarizeHumanFaceArticulation(
  basis: IAutoMovieHumanFaceBasis,
  document: Pick<IAutoMovieHumanFaceBasisDocument, "shape" | "expression">,
): {
  jaw: {
    degrees: number;
    translationMetres: number;
    budgetMetres: number;
    pivot: [number, number, number];
  };
  eyes: { id: string; degrees: number; translationMetres: number }[];
} | null {
  if (basis.articulation === undefined) return null;
  const state = humanFaceBasisWeights(basis, document);
  const { landmarks } = evaluateHumanFaceRest(basis, state);
  const resolved = resolveHumanFaceArticulation(
    basis.articulation,
    state.weights,
    landmarks,
  );
  return {
    jaw: {
      degrees: resolved.jaw.degrees,
      translationMetres: Vector3.length(resolved.jaw.translation),
      budgetMetres: basis.articulation.jaw.translationLimitMetres,
      pivot: [resolved.jaw.pivot.x, resolved.jaw.pivot.y, resolved.jaw.pivot.z],
    },
    eyes: resolved.eyes.map((eye) => ({
      id: eye.id,
      degrees:
        (2 *
          Math.atan2(
            Math.hypot(eye.rotation.x, eye.rotation.y, eye.rotation.z),
            Math.abs(eye.rotation.w),
          ) *
          180) /
        Math.PI,
      translationMetres: Vector3.length(eye.translation),
    })),
  };
}
