import { sequenceTimeline } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  type ISelectAutoMoviePlacedChecks,
  observeAutoMoviePlacedScene,
  selectAutoMoviePlacedChecks,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { PerspectiveCamera, Scene } from "three";

import { IDENTITY_TRANSFORM } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

type IReport = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

/**
 * Builds an empty-motion shot with a supplied id and span.
 */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-yard",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}

/**
 * Observe authored track records and continuous steps through a hand-laid cut
 * at exact output frames of a 10 fps film.
 *
 * Scenarios:
 * 1. A non-finite record and a missing required record fail on the live shot that owns their frame.
 * 2. A 0.6 m root jump inside a continuous shot fails, and the same jump at a declared break is excluded.
 * 3. A held prop jumping 0.3 m across a seam that resumes its shot fails.
 * 4. A cut excludes the step, and an entity absent from the incoming shot has no obligation there.
 * 5. A doubled playback rate allows twice the displacement per output frame.
 * 6. Every frame gives the same report forward and in reverse.
 */
export function test_unit_render_inspection_placed_track_checks(): void {
  const sequence: IAutoMovieSequence = {
    id: "yard",
    name: null,
    fps: 10,
    shots: [
      { shot: "walk", trim: { start: 0, duration: 2 }, transition: null },
      { shot: "walk", trim: { start: 2, duration: 1 }, transition: null },
      { shot: "close", trim: null, playbackRate: 2, transition: null },
    ],
  };
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(sequence, [
    shot("walk", 4),
    shot("close", 2),
  ]);
  const at = (x: number) => ({
    kind: "present" as const,
    transform: { ...IDENTITY_TRANSFORM, translation: { x, y: 0, z: 0 } },
  });
  const lantern: ISelectAutoMoviePlacedChecks.ITrack = {
    key: "lantern",
    required: true,
    path: "lantern.transform",
    maxSpeed: 1.5,
    maxAngularSpeed: 1,
    tolerance: { distance: 0.01, angle: 0.01 },
    observe: (id, seconds) =>
      id === "walk"
        ? nclose(seconds, 0.5)
          ? at(NaN)
          : at(seconds + (seconds >= 0.8 ? 1 : 0) + (seconds >= 1.5 ? 0.5 : 0))
        : seconds >= 0.6 - 1e-9
          ? { kind: "missing" }
          : at(seconds),
  };
  const cup: ISelectAutoMoviePlacedChecks.ITrack = {
    key: "cup",
    required: true,
    path: "cup.transform",
    maxSpeed: 0.5,
    observe: (id, seconds) =>
      id === "walk" ? at(seconds >= 2 - 1e-9 ? 5.3 : 5) : null,
  };
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const observe = (frame: number): IReport => {
    const time = { filmSeconds: frame / 10, outputFrame: frame };
    return observeAutoMoviePlacedScene({
      scene,
      camera,
      time,
      checks: selectAutoMoviePlacedChecks({
        scene,
        time,
        fps: 10,
        continuity: {
          sequence,
          timeline,
          discontinuities: [{ shot: "walk", seconds: 0.8 }],
          tracks: [lantern, cup],
        },
      }),
    });
  };
  const failing = (report: IReport, check: string, key: string) =>
    report.findings.filter(
      (finding) => finding.check === check && finding.key === key,
    );
  const status = (report: IReport, check: string, key: string) =>
    report.coverage.find((row) => row.check === check && row.key === key)
      ?.status;
  const distance = (report: IReport, key: string) =>
    failing(report, "transform-continuity", key)[0]?.witness.measurements?.find(
      ({ name }) => name === "distance",
    )?.value;

  TestValidator.predicate(
    "non-finite and missing records fail on the shot that owns their frame",
    () =>
      failing(observe(5), "authored-transform", "lantern").length > 0 &&
      failing(observe(6), "transform-continuity", "lantern").length === 0 &&
      failing(observe(33), "authored-transform", "lantern").length > 0 &&
      failing(observe(32), "authored-transform", "lantern").length === 0,
  );
  const jump = distance(observe(15), "lantern");
  TestValidator.predicate(
    "an undeclared root jump fails and a declared break is excluded",
    () =>
      typeof jump === "number" &&
      nclose(jump, 0.6) &&
      status(observe(8), "transform-continuity", "lantern") === "excluded" &&
      failing(observe(8), "transform-continuity", "lantern").length === 0,
  );
  const seam = distance(observe(20), "cup");
  TestValidator.predicate(
    "a held prop jumping across a resuming seam fails",
    () =>
      typeof seam === "number" &&
      nclose(seam, 0.3) &&
      failing(observe(20), "transform-continuity", "lantern").length === 0,
  );
  const cut = observe(30);
  TestValidator.predicate(
    "a cut excludes the step and an absent entity has no obligation",
    () =>
      status(cut, "transform-continuity", "lantern") === "excluded" &&
      cut.coverage.every((row) => row.key !== "cup"),
  );
  TestValidator.predicate(
    "a doubled rate scales the allowed step by shot time",
    () =>
      status(observe(32), "transform-continuity", "lantern") === "checked" &&
      failing(observe(32), "transform-continuity", "lantern").length === 0,
  );

  const frames: number[] = [5, 6, 8, 15, 20, 30, 32, 33];
  const forward: string[] = frames.map((frame) =>
    JSON.stringify(observe(frame)),
  );
  const reverse: string[] = [...frames]
    .reverse()
    .map((frame) => JSON.stringify(observe(frame)))
    .reverse();
  TestValidator.equals(
    "reverse queries give the forward reports",
    reverse,
    forward,
  );
}
