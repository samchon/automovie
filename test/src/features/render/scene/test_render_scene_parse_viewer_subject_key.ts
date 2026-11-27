import { AutoMovieRenderSubjectViewpoint } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `parseViewerSubjectKey` reads "<kind>:<id>[@<revision>]", where the
 * last `@` starts the revision.
 *
 * Scenarios:
 *
 * 1. "model:hero@r2" is model hero at r2; "part:a@b@c" is part "a@b" at "c";
 *    "mesh:x" has no revision.
 * 2. "hero" names no kind, "thing:x" an unknown kind, "model:" no id and
 *    "model:x@" an empty revision.
 */
export function test_render_scene_parse_viewer_subject_key(): void {
  TestValidator.equals(
    "keys",
    ["model:hero@r2", "part:a@b@c", "mesh:x"].map(
      AutoMovieRenderSubjectViewpoint.parseAutoMovieViewerSubjectKey,
    ),
    [
      { kind: "model", id: "hero", revision: "r2" },
      { kind: "part", id: "a@b", revision: "c" },
      { kind: "mesh", id: "x", revision: null },
    ],
  );
  for (const [key, message] of [
    ["hero", "names no kind"],
    ["thing:x", 'unknown kind "thing"'],
    ["model:", "names no id"],
    ["model:x@", "empty revision"],
  ] as const)
    TestValidator.equals(
      key,
      ((): string => {
        try {
          AutoMovieRenderSubjectViewpoint.parseAutoMovieViewerSubjectKey(key);
          return "";
        } catch (error) {
          return error instanceof Error && error.message.includes(message)
            ? message
            : "";
        }
      })(),
      message,
    );
}
