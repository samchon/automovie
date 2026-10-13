import { TestValidator } from "@nestia/e2e";
import { BOX_GEOMETRY_BYTES, instanceSetFixture, modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { rawMeshModelFixture as rawMesh } from "../internal/rawMeshModelFixture";
import { skinnedMeshModelFixture as skinnedMesh } from "../internal/skinnedMeshModelFixture";

/**
 * Loose and skinned mesh storage follows their actual attributes and shared representation use.
 *
 * Scenarios:
 *
 * 1. Raw positions, indexed skin attributes and shared or mixed LOD citations retain their independent costs.
 */
export const test_render_budget_mesh_storage = (): void => {
  const meshed = measure({
    scene: {
      ...sceneFixture(),
      nodes: [
        {
          id: "raw",
          model: "raw-mesh",
          transform: {
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          motion: null,
          pose: null,
        },
        {
          id: "skinned",
          model: "skinned-mesh",
          transform: {
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          motion: null,
          pose: null,
        },
      ],
    },
    models: [...modelsFixture(), rawMesh(), skinnedMesh()],
    instanceSets: [
      instanceSetFixture({
        id: "a-set",
        count: 2,
        chunks: 1,
        model: "prop-model",
      }),
      instanceSetFixture({
        id: "b-set",
        count: 3,
        chunks: 1,
        model: "prop-model",
      }),
    ],
  });

  TestValidator.equals(
    "raw and skinned mesh geometry cost what the documented byte model says",
    {
      raw: meshed.models.find((cost) => cost.model === "raw-mesh"),
      skinned: meshed.models.find((cost) => cost.model === "skinned-mesh"),
      sharedTier: meshed.models.find((cost) => cost.model === "prop-model")
        ?.tier,
      // The same model behind a staged node AND a level-of-detail tier has no
      // single tier to report, so the row reports none rather than the last
      // citation to win the race.
      mixedTier: measure({
        scene: sceneFixture(),
        models: modelsFixture(),
        instanceSets: [
          instanceSetFixture({
            id: "a-set",
            count: 2,
            chunks: 1,
            model: "prop-model",
          }),
        ],
      }).models.find((cost) => cost.model === "prop-model")?.tier,
    },
    {
      raw: {
        model: "raw-mesh",
        tier: null,
        parts: 1,
        vertices: 6,
        triangles: 2,
        materials: [],
        geometryBytes: 6 * 12,
      },
      skinned: {
        model: "skinned-mesh",
        tier: null,
        parts: 2,
        vertices: 4 + 24,
        triangles: 2 + 12,
        materials: ["oak"],
        geometryBytes: 4 * 56 + 6 * 4 + BOX_GEOMETRY_BYTES,
      },
      sharedTier: "near",
      mixedTier: null,
    },
  );
};
