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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation States the joint motion a document requests and names the refusal of an unsupported combination instead of clamping it.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Reads the shaped landmarks, the coupled opening translation and the sagittal budget through the same resolution the builder poses with.
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
