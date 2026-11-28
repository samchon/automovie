import { AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMoviePracticalSurfaceTrack } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A practical surface material key is held until its successor on one node and
 * part.
 *
 * Scenarios:
 *
 * 1. Seeking before, at and after the half-second cue returns the held material,
 *    with the same first key on a reverse seek. The shot tail is excluded.
 * 2. Another placement of the same model and an untracked part have no override.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify held material keys, exact cue ownership, reverse seeking, excluded shot tail and node and part specificity.
 * @evidence contracts/development/testing.md#behavioral-verification The test samples a prepared practical material track at times before, on and after the cue in both directions. It uses an adjacent node and another part to verify identity scoping.
 * @evidence contracts/development/testing.md#independent-expectations The half-second key becomes active exactly at its authored time and stays held until the shot's exclusive tail. An otherwise identical placement with a different node ID and a case part outside the target cannot inherit the lamp value.
 */
export function test_engine_film_sample_practical_surface_material(): void {
  const track: IAutoMoviePracticalSurfaceTrack = {
    node: "speaker",
    part: "lamp",
    keys: [
      { time: 0, material: "dark" },
      { time: 0.5, material: "lit" },
    ],
  };
  const shot: Parameters<typeof AutoMovieEngineFilm.samplePracticalSurfaceMaterial>[0] = {
    duration: 1,
    practicalSurfaces: [track],
  };
  TestValidator.equals(
    "right-owned key boundaries support reverse seeks",
    [0, 0.25, 0.5, 0.75, 0.25, 1].map((t: number) =>
      AutoMovieEngineFilm.samplePracticalSurfaceMaterial(shot, "speaker", "lamp", t),
    ),
    ["dark", "dark", "lit", "lit", "dark", undefined],
  );
  TestValidator.equals(
    "track names both an instance and a part",
    [
      AutoMovieEngineFilm.samplePracticalSurfaceMaterial(shot, "spare", "lamp", 0.5),
      AutoMovieEngineFilm.samplePracticalSurfaceMaterial(shot, "speaker", "case", 0.5),
    ],
    [undefined, undefined],
  );
}
