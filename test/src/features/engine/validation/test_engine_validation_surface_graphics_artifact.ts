import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  appendSurfaceGraphicsArtifact
} from "../../../../../packages/engine/src/validation/internal/appendSurfaceGraphicsArtifact";
import type {
  IAutoMovieAffordance,
  IAutoMovieSurfaceGraphic,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Graphics tracks resolve one fixed surface per prop and open on its clock.
 *
 * Scenarios:
 *
 * 1. A rigid surface track with left-inclusive keys is valid.
 * 2. Duplicate pair, unstaged node and missing affordance give distinct paths.
 * 3. A moving surface without a matching articulated carrier is refused.
 *    Absent, late or repeated keys fail on their own fields.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers valid surface keys, duplicate or unresolved targets, missing articulation support and precise clock faults.
 * @evidence contracts/development/testing.md#behavioral-verification Calls appendSurfaceGraphicsArtifact with explicit placement, surface affordance and key records under a one-second shot.
 * @evidence contracts/development/testing.md#independent-expectations A known fixed surface has keys at zero and one half. A hinged surface without a resolved carrier is invalid. Empty keys, repeated zero and time one lie on distinct missing, strict-order and exclusive-tail decisions.
 */
export function test_engine_validation_surface_graphics_artifact(): void {
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const board: IAutoMovieAffordance = {
    id: "face",
    kind: "surface",
    width: 1,
    depth: 1,
    extent: null,
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  const models: NonNullable<
    Parameters<typeof appendSurfaceGraphicsArtifact>[4]
  > = [
    {
      id: "book",
      affordances: [board, { ...board, id: "hinged", rides: "hinge" }],
    },
  ];
  const nodes: Parameters<typeof appendSurfaceGraphicsArtifact>[1] = [
    { id: "panel", model: "book" },
  ];
  const graphic: IAutoMovieSurfaceGraphic = {
    emission: { kind: "printed" },
    background: null,
    layers: [],
  };
  const track: IAutoMovieSurfaceGraphicTrack = {
    node: "panel",
    surface: "face",
    keys: [
      { time: 0, graphic },
      { time: 0.5, graphic },
    ],
  };
  appendSurfaceGraphicsArtifact([track], nodes, 1, collector, models);
  TestValidator.equals(
    "known fixed surface and ordered keys",
    collector.items,
    [],
  );
  appendSurfaceGraphicsArtifact(
    [
      track,
      track,
      { ...track, node: "unknown" },
      { ...track, surface: "absent", keys: [] },
      {
        ...track,
        surface: "hinged",
        keys: [
          { time: 0.5, graphic },
          { time: 0, graphic },
          { time: 0, graphic },
          { time: 1, graphic },
        ],
      },
    ],
    nodes,
    1,
    collector,
    models,
  );
  TestValidator.equals(
    "validation finds every independent owner",
    collector.items.map(({ path }) => path),
    [
      "$input.surfaceGraphics[1].surface",
      "$input.surfaceGraphics[2].node",
      "$input.surfaceGraphics[3].surface",
      "$input.surfaceGraphics[3].keys",
      "$input.surfaceGraphics[4].surface",
      "$input.surfaceGraphics[4].keys[0].time",
      "$input.surfaceGraphics[4].keys[2].time",
      "$input.surfaceGraphics[4].keys[3].time",
    ],
  );
}
