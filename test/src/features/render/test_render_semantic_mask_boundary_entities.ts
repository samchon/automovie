import {
  autoMovieSemanticMaskNodeIndex,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Derives and indexes actual ground, orphan element, unattached boundary and staged wall claims, detecting invented containment or missing canonical drawable names.
 * @evidence contracts/testing.md#independent-expectations The authored ground name __automovie_space and declared orphan/null relations supply exact ids and owners; this checks the metadata join convention rather than a rendered pixel or live Three node.
 * @evidence contracts/testing.md#distinguishing-cases Ground ownership contrasts with an orphan element and empty-space boundary, while the ordinary wall retains its element id; normal building ancestry belongs to the semantic-mask ownership unit.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_boundary_entities owns its cases. Portable claim derivation and node-map construction from resident records, without a viewer or mask pass.
 */
export function test_render_semantic_mask_boundary_entities(): void {
  const edged: IAutoMovieBuiltEnvironment = buildingFixture();

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

  const edge: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
    scene: {
      ...sceneFixture(),
      space: { id: "tower-ground", surfaces: [], walkable: [] },
    },
    models: modelsFixture(),
    environments: [edged],
  });

  const index: Map<string, IAutoMovieSemanticMaskEntry> =
    autoMovieSemanticMaskNodeIndex(edge);

  TestValidator.equals(
    "a ground, an orphan element and an unattached boundary all resolve",
    {
      ground: index.get("__automovie_space")?.id,
      groundLabel: index.get("__automovie_space")?.label,
      orphan: edge.entries.find(
        (entry: IAutoMovieSemanticMaskEntry): boolean =>
          entry.id === "element:tower/orphan",
      )?.owner,
      floating: edge.entries.find(
        (entry: IAutoMovieSemanticMaskEntry): boolean =>
          entry.id === "boundary:tower/floating",
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
}
