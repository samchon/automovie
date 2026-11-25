import { appendPracticalSurfacesArtifact } from "@automovie/engine/internal";
import type {
  IAutoMovieConstraintViolation,
  IAutoMoviePracticalSurfaceTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * An authored material cue must resolve to one model part on one placement.
 *
 * Scenarios:
 *
 * 1. Keys from the target's own material list resolve inside the shot clock.
 * 2. A duplicate target, an exclusive-tail cue and an unregistered material
 *    produce distinct findings on the offending track.
 */
export function test_unit_engine_validation_practical_surfaces_artifact(): void {
  const track: IAutoMoviePracticalSurfaceTrack = {
    node: "speaker",
    part: "lamp",
    keys: [
      { time: 0, material: "dark" },
      { time: 0.5, material: "lit" },
    ],
  };
  const models: NonNullable<
    Parameters<typeof appendPracticalSurfacesArtifact>[4]
  > = [
    {
      id: "radio",
      origin: "generated",
      skeleton: null,
      parts: [{ id: "lamp" }],
      materials: [{ id: "dark" }, { id: "lit" }],
    },
  ];
  const nodes: Parameters<typeof appendPracticalSurfacesArtifact>[1] = [
    { id: "speaker", model: "radio" },
    { id: "spare", model: "radio" },
  ];
  const violations: IAutoMovieConstraintViolation[] = [];
  appendPracticalSurfacesArtifact([track], nodes, 1, violations, models);
  TestValidator.equals("known target and materials", violations, []);
  appendPracticalSurfacesArtifact(
    [
      track,
      { ...track, keys: [track.keys[0]!, { time: 1, material: "missing" }] },
    ],
    nodes,
    1,
    violations,
    models,
  );
  TestValidator.equals(
    "duplicate, time and material findings are located",
    violations.map(({ kind, path }) => [kind, path]),
    [
      ["type", "$input.practicalSurfaces[1].part"],
      ["range", "$input.practicalSurfaces[1].keys[1].time"],
      ["type", "$input.practicalSurfaces[1].keys[1].material"],
    ],
  );
}
