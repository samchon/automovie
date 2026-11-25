import { samplePracticalSurfaceMaterial } from "@automovie/engine";
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
 */
export function test_unit_engine_film_sample_practical_surface_material(): void {
  const track: IAutoMoviePracticalSurfaceTrack = {
    node: "speaker",
    part: "lamp",
    keys: [
      { time: 0, material: "dark" },
      { time: 0.5, material: "lit" },
    ],
  };
  const shot: Parameters<typeof samplePracticalSurfaceMaterial>[0] = {
    duration: 1,
    practicalSurfaces: [track],
  };
  TestValidator.equals(
    "right-owned key boundaries support reverse seeks",
    [0, 0.25, 0.5, 0.75, 0.25, 1].map((t: number) =>
      samplePracticalSurfaceMaterial(shot, "speaker", "lamp", t),
    ),
    ["dark", "dark", "lit", "lit", "dark", undefined],
  );
  TestValidator.equals(
    "track names both an instance and a part",
    [
      samplePracticalSurfaceMaterial(shot, "spare", "lamp", 0.5),
      samplePracticalSurfaceMaterial(shot, "speaker", "case", 0.5),
    ],
    [undefined, undefined],
  );
}
