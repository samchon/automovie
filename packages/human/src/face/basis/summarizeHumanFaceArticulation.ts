import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion as IAutoMovieQuaternionImported,
  IAutoMovieVector3 as IAutoMovieVector3Imported,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceRigidMotion as IAutoMovieHumanFaceRigidMotionImported } from "../../index";
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
 * Jaw translation includes lateral shifts, but budgetMetres is sagittal-only.
 * Eye degrees is the composed quaternion's principal angle, not a gaze sum.
 *
 * @evidence contracts/common.md#principled-implementation Shared channel weights, identity rest landmarks and articulation supply requested figures. Jaw magnitude includes lateral shifts unlike its sagittal-only displayed budget; eye magnitude is a quaternion principal angle, not clinical motion evidence.
 * @evidence contracts/common.md#clear-and-simple-design The reporter delegates weight/rest/motion semantics and projects editor-facing summaries; absent articulation returns null before geometry work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sagittal refusal propagates without display clamping; no gaze sum replaces composed rotation and no measured clinical range is inferred.
 * @evidence contracts/common.md#meaningful-documentation Prose gives units, shaped pivot, null absence, lateral-versus-sagittal populations, principal eye angle and requested-motion limits.
 * @evidence contracts/performance.md#efficient-algorithms Small summary output still pays complete delegated rest copies/scans with active endpoints/correctives, plus registered gaze work; cost is not just the eye count.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared builder algorithms serve this standalone editor request; its document recomputes rest rather than borrowing a potentially different cached builder pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rest/weight/motion intermediates are local and only scalar summaries transfer; no geometry history, subscriber or external resource is retained.
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
  const state: {
    weights: Map<string, number>;
    activations: { target: string; activation: number; shapeOnly: boolean }[];
  } = humanFaceBasisWeights(basis, document);
  const {
    landmarks,
  }: {
    surfaces: number[][];
    landmarks: Record<string, IAutoMovieVector3Imported>;
  } = evaluateHumanFaceRest(basis, state);
  const resolved: {
    motions: Map<string, IAutoMovieHumanFaceRigidMotionImported>;
    jaw: {
      degrees: number;
      translation: IAutoMovieVector3Imported;
      pivot: IAutoMovieVector3Imported;
    };
    eyes: {
      id: string;
      rotation: IAutoMovieQuaternionImported;
      center: IAutoMovieVector3Imported;
      translation: IAutoMovieVector3Imported;
    }[];
  } = resolveHumanFaceArticulation(
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
    eyes: resolved.eyes.map(
      (eye: {
        id: string;
        rotation: IAutoMovieQuaternionImported;
        center: IAutoMovieVector3Imported;
        translation: IAutoMovieVector3Imported;
      }): { id: string; degrees: number; translationMetres: number } => ({
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
      }),
    ),
  };
}
