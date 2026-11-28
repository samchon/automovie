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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe serialized subject kind and identifier with an optional revision and an embedded `@`.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that serialization omits the suffix when no revision is supplied and retains both delimiters when the identifier contains `@`.
 * @evidence contracts/development/testing.md#independent-expectations Compares against literal `model:hero` and `part:a@b@c` strings.
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
