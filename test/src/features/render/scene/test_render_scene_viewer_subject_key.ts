import { AutoMovieRenderSubjectViewpoint } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `viewerSubjectKey` writes a subject as "<kind>:<id>" and appends
 * "@<revision>" when it has one.
 *
 * Scenarios:
 *
 * 1. Model hero with no revision is "model:hero".
 * 2. Part "a@b" at "c" is "part:a@b@c".
 */
export function test_render_scene_viewer_subject_key(): void {
  TestValidator.equals(
    "keys",
    [
      AutoMovieRenderSubjectViewpoint.autoMovieViewerSubjectKey({ kind: "model", id: "hero", revision: null }),
      AutoMovieRenderSubjectViewpoint.autoMovieViewerSubjectKey({ kind: "part", id: "a@b", revision: "c" }),
    ],
    ["model:hero", "part:a@b@c"],
  );
}
