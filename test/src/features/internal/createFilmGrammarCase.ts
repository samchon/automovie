import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieGrammarDiagnosticCode } from "../../../../packages/engine/src/film/AutoMovieGrammarDiagnosticCode";
import type { IAutoMovieGrammarCameraObservation } from "../../../../packages/engine/src/film/IAutoMovieGrammarCameraObservation";
import type { IAutoMovieGrammarDiagnostic } from "../../../../packages/engine/src/film/IAutoMovieGrammarDiagnostic";
import type { IAutoMovieGrammarInput } from "../../../../packages/engine/src/film/IAutoMovieGrammarInput";
import type { IAutoMovieGrammarShotObservation } from "../../../../packages/engine/src/film/IAutoMovieGrammarShotObservation";
import { lookRotation } from "../../../../packages/engine/src/film/lookRotation";
import { readFilmGrammar } from "../../../../packages/engine/src/film/readFilmGrammar";

/** Build hand-authored film observations and source readers shared by grammar unit cases. */
export function createFilmGrammarCase(): {
  point(x: number, y: number, z: number): IAutoMovieVector3;
  cameraSample(
    position: IAutoMovieVector3,
    focus?: IAutoMovieVector3,
  ): IAutoMovieGrammarShotObservation["camera"]["start"];
  camera(
    position: IAutoMovieVector3,
    focus?: IAutoMovieVector3,
  ): IAutoMovieGrammarShotObservation["camera"];
  subject(
    id: string,
    start: IAutoMovieVector3,
    end?: IAutoMovieVector3,
    eyeline?: { target: string; point: IAutoMovieVector3 },
  ): IAutoMovieGrammarShotObservation["subjects"][number];
  shot(
    id: string,
    overrides?: Partial<IAutoMovieGrammarShotObservation>,
  ): IAutoMovieGrammarShotObservation;
  reportedGrammar(input: IAutoMovieGrammarInput): IAutoMovieGrammarDiagnostic[];
  codes(shots: readonly IAutoMovieGrammarShotObservation[]): string[];
} {
  function point(x: number, y: number, z: number): IAutoMovieVector3 {
    return {
      x,
      y,
      z,
    };
  }

  function cameraSample(
    position: IAutoMovieVector3,
    focus: IAutoMovieVector3 = point(0, 0.9, 0),
  ): IAutoMovieGrammarShotObservation["camera"]["start"] {
    return {
      position,
      rotation: lookRotation({
        x: focus.x - position.x,
        y: focus.y - position.y,
        z: focus.z - position.z,
      }),
      fovY: 60,
      aspect: 16 / 9,
    };
  }

  function camera(
    position: IAutoMovieVector3,
    focus: IAutoMovieVector3 = point(0, 0.9, 0),
  ): IAutoMovieGrammarShotObservation["camera"] {
    const sample: IAutoMovieGrammarCameraObservation = cameraSample(
      position,
      focus,
    );
    return { start: sample, end: structuredClone(sample) };
  }

  function subject(
    id: string,
    start: IAutoMovieVector3,
    end: IAutoMovieVector3 = start,
    eyeline?: { target: string; point: IAutoMovieVector3 },
  ): IAutoMovieGrammarShotObservation["subjects"][number] {
    return {
      id,
      start,
      end: structuredClone(end),
      height: 1.8,
      // Stated as a point with a height: these observations are hand-built rather
      // than measured, so they carry no horizontal extent to read a width from.
      radius: 0,
      eyeline:
        eyeline === undefined
          ? null
          : {
              target: eyeline.target,
              start: eyeline.point,
              end: eyeline.point,
            },
    };
  }

  function shot(
    id: string,
    overrides: Partial<IAutoMovieGrammarShotObservation> = {},
  ): IAutoMovieGrammarShotObservation {
    return {
      id,
      duration: 2,
      camera: camera(point(0, 0.9, 3)),
      subjects: [subject("hero", point(0, 0, 0))],
      primarySubject: "hero",
      declaredShotSize: null,
      actionAxis: null,
      ...overrides,
    };
  }

  /** The findings no declared exception excepted, the list these cases assert on. */
  function reportedGrammar(
    input: IAutoMovieGrammarInput,
  ): IAutoMovieGrammarDiagnostic[] {
    return readFilmGrammar(input).reported;
  }

  function codes(shots: readonly IAutoMovieGrammarShotObservation[]): string[] {
    return reportedGrammar({ shots }).map(
      (
        diagnostic: IAutoMovieGrammarDiagnostic,
      ): AutoMovieGrammarDiagnosticCode => diagnostic.code,
    );
  }

  return { point, cameraSample, camera, subject, shot, reportedGrammar, codes };
}
