import { AutoMovieArchetypeChessBoard } from "@automovie/archetypes";
import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import type {
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import {
  AutoMovieRenderSceneLayout,
  AutoMovieRenderSurfaceGraphic,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { appendSurfaceGraphicsArtifact } from "../../../../../packages/engine/src/validation/internal/appendSurfaceGraphicsArtifact";

/**
 * The archived chessboard's playing surface can carry print on its own slab.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the retained board grid, admitted print and actual receiving part.
 * @evidence contracts/development/testing.md#behavioral-verification Validates a printed stock board track and observes the rendered graphic on the mounted board, with all sixty-four archived square sockets.
 * @evidence contracts/development/testing.md#independent-expectations Checks the fixed board spacing and top coordinates and compares the declared surface spans to its actual slab geometry.
 */
export async function test_archetype_chess_board_surface(): Promise<void> {
  const board = AutoMovieArchetypeChessBoard.create({ id: "saved-board" });
  const top = board.affordance("top");
  const slab = board.parts[0]!;
  if (slab.geometry.type !== "primitive" || slab.geometry.shape.type !== "box")
    throw new Error("Expected the stock board's wooden slab.");
  TestValidator.equals("stable board identity", board.id, "saved-board");
  TestValidator.equals("stock slab still uses one part", board.parts.length, 1);
  TestValidator.equals(
    "graphics belong to the board",
    top.materialPart,
    slab.id,
  );
  TestValidator.equals("supported width", top.width, slab.geometry.shape.width);
  TestValidator.equals("supported depth", top.depth, slab.geometry.shape.depth);
  TestValidator.equals("playing height", top.frame.translation.y, 0.015);

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
  const near = (label: string, actual: number, expected: number): void =>
    TestValidator.predicate(label, Math.abs(actual - expected) <= 1e-9);
  TestValidator.equals(
    "one surface and 64 squares",
    board.affordances!.length,
    65,
  );
  files.forEach((file, x): void =>
    ranks.forEach((rank, z): void => {
      const square = board.affordance(`${file}${rank}`);
      TestValidator.equals(
        "piece placement uses a socket",
        square.kind,
        "socket",
      );
      near("saved square X", square.frame.translation.x, (x - 3.5) * 0.055);
      near("saved square Z", square.frame.translation.z, (z - 3.5) * 0.055);
      near("square stays on slab", square.frame.translation.y, 0.015);
    }),
  );

  const node = "table-board";
  const track: IAutoMovieSurfaceGraphicTrack = {
    node,
    surface: "top",
    keys: [
      {
        time: 0,
        graphic: {
          emission: { kind: "printed" },
          background: { r: 0.6, g: 0.46, b: 0.3, a: null, hex: null },
          layers: [],
        },
      },
    ],
  };
  const modelNode: IAutoMovieScene["nodes"][number] = {
    id: node,
    model: board.id,
    transform: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    motion: null,
    pose: null,
  };
  const scene: IAutoMovieScene = {
    id: "table",
    name: null,
    lights: [],
    cameras: [],
    nodes: [modelNode],
  };
  const collector = new AutoMovieEngineViolationCollector();
  appendSurfaceGraphicsArtifact([track], scene.nodes, 1, collector, [board]);
  TestValidator.equals(
    "print is admitted on the stock board",
    collector.items,
    [],
  );

  const built = AutoMovieRenderSceneLayout.buildModel(board);
  const prepared = await AutoMovieRenderSurfaceGraphic.prepare({
    shot: { duration: 1, surfaceGraphics: [track] },
    scene,
    models: [board],
    resolveNode: () => built,
  });
  try {
    const graphic = built.object.getObjectByName(`surface-graphic:${node}/top`);
    if (graphic === undefined)
      throw new Error("Expected a mounted print group.");
    TestValidator.predicate(
      "the print rides the fixed board",
      graphic.parent === built.object,
    );
    near(
      "the print uses the playing height",
      graphic.position.y,
      top.frame.translation.y,
    );
    near(
      "the visible graphic lifts above the board",
      graphic.children[0]!.position.y,
      0.0005,
    );
  } finally {
    prepared.dispose();
  }
}
