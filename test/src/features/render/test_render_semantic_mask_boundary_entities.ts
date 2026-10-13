import {
  autoMovieSemanticMaskNodeIndex,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  buildingFixture,
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";

/**
 * Ground, orphan elements and unattached boundaries retain explicit ownership without invented containers.
 *
 * Scenarios:
 * 1. The ground resolves under the canonical renderer node name and keeps its space label.
 * 2. An orphan element and empty boundary retain null owners while a staged wall retains its element identity.
 */
export const test_render_semantic_mask_boundary_entities = (): void => {
  const edged = buildingFixture();

  edged.elements.push({
      id: "orphan",
      kind: "monolith",
      parent: null,
      transform: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      model: null,
      space: null,
    });

  edged.boundaries.push({
      id: "floating",
      kind: "threshold",
      spaces: [],
      elements: [],
    });

  const edge = deriveAutoMovieSemanticMask({
      scene: {
        ...sceneFixture(),
        space: { id: "tower-ground", surfaces: [], walkable: [] },
      },
      models: modelsFixture(),
      environments: [edged],
    });

  const index = autoMovieSemanticMaskNodeIndex(edge);

  TestValidator.equals(
      "a ground, an orphan element and an unattached boundary all resolve",
      {
        ground: index.get("__automovie_space")?.id,
        groundLabel: index.get("__automovie_space")?.label,
        orphan: edge.entries.find((entry) => entry.id === "element:tower/orphan")
          ?.owner,
        floating: edge.entries.find(
          (entry) => entry.id === "boundary:tower/floating",
        )?.owner,
        wallByNode: index.get("tower/hall-wall")?.id,
      },
      {
        ground: "node:tower-ground",
        groundLabel: "space",
        orphan: null,
        floating: null,
        wallByNode: "element:tower/hall-wall",
      },
    );
};
