import type { IAutoMovieScript } from "@automovie/interface";
import { beatCaptions } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `beatCaptions` indexes each beat's caption and enclosing scene slug.
 *
 * Scenarios:
 *
 * 1. A beat under a scene takes the scene's slug; a beat directly under an act
 *    takes none; captions are carried as written.
 * 2. A script with no tree, or a null one, gives an empty index.
 */
export function test_unit_render_scene_beat_captions(): void {
  const base = { temporal: null, interactsWith: [] as string[] };
  const script: IAutoMovieScript = {
    logline: "l",
    theme: "t",
    cast: [],
    beats: [],
    tree: [
      { ...base, id: "act", parent: null, kind: "act", payload: { title: "One", summary: null } },
      {
        ...base,
        id: "scene",
        parent: "act",
        kind: "scene",
        payload: { interiorExterior: "INT", location: "Hall", timeOfDay: "night", description: null },
      },
      {
        ...base,
        id: "b1",
        parent: "scene",
        kind: "beat",
        payload: { beat: "b1", direction: "d", dialogue: [], caption: "Hello" },
      },
      {
        ...base,
        id: "b2",
        parent: "act",
        kind: "beat",
        payload: { beat: "b2", direction: "d", dialogue: [], caption: null },
      },
    ],
  };
  TestValidator.equals("indexed", [...beatCaptions(script)], [
    ["b1", { caption: "Hello", slug: "INT. HALL - NIGHT" }],
    ["b2", { caption: null, slug: null }],
  ]);
  TestValidator.equals("none", beatCaptions({ ...script, tree: null }).size, 0);
  TestValidator.equals(
    "absent",
    beatCaptions({ logline: "l", theme: "t", cast: [], beats: [] }).size,
    0,
  );
}