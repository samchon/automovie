import {
  IAutoMovieCameraIntent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";
import { IAutoMovieNormalizedGrammarShot } from "./IAutoMovieNormalizedGrammarShot";
import { classifyGrammarShotSize } from "./classifyGrammarShotSize";
import { GRAMMAR_EPSILON } from "./constants/GRAMMAR_EPSILON";
import { projectToNdc } from "./projectToNdc";

/**
 * The framing a shot's primary subject measures as at one edited boundary, or
 * null when the shot has no primary subject, the subject's base or top is not
 * in front of the camera, or it fills no measurable part of the frame.
 *
 * The subject's frame occupancy is the larger of two fractions: its projected
 * height over the frame height, and its horizontal radius over the half-width
 * the frame spans at the subject's depth. `classifyGrammarShotSize` turns that
 * fraction into the nearest framing.
 *
 * @param shot Normalized shot whose primary subject is measured.
 * @param boundary Which edited boundary's camera and subject point to read.
 * @returns The measured framing, or null when it cannot be measured.
 *
 * @evidence contracts/common.md#principled-implementation Projects the subject's base and top through `projectToNdc`, the pinhole projection the review and keypoint passes share, so the vertical fill is half the NDC span; the horizontal fill is the radius over `depth · tan(fovY/2) · aspect`, the half-width of the view at the base's depth; both axes are read because `compileCameraMove` places the camera by whichever of height and width binds, so the vertical fill alone would report a wide subject one or two sizes looser than delivered.
 * @evidence contracts/common.md#clear-and-simple-design One measurement shared by the shot-size check, the jump-cut size comparison and both re-establishing checks of `readFilmGrammar`, so they cannot disagree about a shot's size; classification stays with `classifyGrammarShotSize`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, lens or framing is special-cased; a subject behind the lens or filling nothing answers null instead of a guessed size.
 * @evidence contracts/common.md#meaningful-documentation States every null case, how occupancy is formed from the two axes, and which function classifies it.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one map lookup, two projections and one classification over the fixed framing table.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one shot boundary; `readFilmGrammar` memoizes its answer per shot and boundary, which is answered there.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the two projected points and the raised top vector, all released on return.
 */
export function measureGrammarShotSize (
  shot: IAutoMovieNormalizedGrammarShot,
  boundary: "start" | "end",
): IAutoMovieCameraIntent["framing"] | null {
  if (shot.primarySubject === null) return null;
  const subject: IAutoMovieGrammarSubjectObservation = shot.subjectById.get(
    shot.primarySubject,
  )!;
  const camera: IAutoMovieGrammarCameraObservation = shot.camera[boundary];
  const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);
  const point: IAutoMovieVector3 = subject[boundary];
  const base: ReturnType<typeof projectToNdc> = projectToNdc(
    camera,
    point,
    halfY,
    camera.aspect,
  );
  const top: ReturnType<typeof projectToNdc> = projectToNdc(
    camera,
    { ...point, y: point.y + subject.height },
    halfY,
    camera.aspect,
  );
  if (base.depth <= GRAMMAR_EPSILON || top.depth <= GRAMMAR_EPSILON)
    return null;
  const vertical: number = Math.abs(top.ndcY - base.ndcY) / 2;
  const horizontal: number =
    subject.radius / (base.depth * halfY * camera.aspect);
  const occupancy: number = Math.max(vertical, horizontal);
  return occupancy <= GRAMMAR_EPSILON
    ? null
    : classifyGrammarShotSize(occupancy);
}
