import {
  IAutoMovieCameraIntent,
  type IAutoMovieGrammarCameraObservation,
  type IAutoMovieGrammarSubjectObservation,
  type IAutoMovieNormalizedGrammarShot,
  type IAutoMovieProjectToNdc,
  IAutoMovieVector3,
} from "@automovie/interface";

import { classifyGrammarShotSize } from "./classifyGrammarShotSize";
import { GRAMMAR_EPSILON } from "../constants/GRAMMAR_EPSILON";
import { projectToNdc } from "./projectToNdc";

/**
 * The framing a shot's primary subject measures as at one edited boundary, or
 * null when the shot has no primary subject, the subject's base or top is not
 * in front of the camera, or its derived occupancy is non-finite or
 * negligible.
 *
 * The subject's frame occupancy is the larger of two fractions: its projected
 * height over the frame height, and its horizontal radius over the half-width
 * the frame spans at the subject's depth. `classifyGrammarShotSize` turns that
 * fraction into the nearest framing.
 *
 * @param shot Normalized shot whose primary subject is measured.
 * @param boundary Which edited boundary's camera and subject point to read.
 * @returns The measured framing, or null when it cannot be measured.
 */
export function measureGrammarShotSize(
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
  const base: IAutoMovieProjectToNdc.IResult = projectToNdc(
    camera,
    point,
    halfY,
    camera.aspect,
  );
  const top: IAutoMovieProjectToNdc.IResult = projectToNdc(
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
