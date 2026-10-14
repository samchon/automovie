import { TestValidator } from "@nestia/e2e";

import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { rawMeshModelFixture as rawMesh } from "../internal/rawMeshModelFixture";
import {
  BOX_GEOMETRY_BYTES,
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";
import { skinnedMeshModelFixture as skinnedMesh } from "../internal/skinnedMeshModelFixture";

/**
 * Loose and skinned mesh storage follows their actual attributes and shared representation use.
 *
 * Scenarios:
 *
 * 1. Raw positions, indexed skin attributes and shared or mixed LOD citations retain their independent costs.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures authored raw/skinned meshes and shared instance prototypes, asserting complete model-cost records and shared-versus-mixed tier labels, catching omitted attributes, repeated prototype storage or last-citation tier takeover.
 * @evidence contracts/testing.md#independent-expectations Six loose vertices carry only 12-byte positions; the indexed skin block carries four 56-byte vertices plus six four-byte indices and the original box cost. Literal part/vertex/triangle/material counts and near/null tier meanings derive from the authored fixture representation, not measured output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves unindexed raw, indexed skinned plus primitive, two shared prototype sets and a model cited both by a staged node and an LOD tier; other tests own ground/texture storage and budget limits.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_mesh_storage owns these portable inventory calls through numerical fixtures and starts no model loader, renderer, native geometry upload or GPU context.
 */
export function test_render_budget_mesh_storage(): void {
  const meshed: ReturnType<typeof measure> = measure({
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
      raw: meshed.models.find(
        (cost: (typeof meshed.models)[number]): boolean =>
          cost.model === "raw-mesh",
      ),
      skinned: meshed.models.find(
        (cost: (typeof meshed.models)[number]): boolean =>
          cost.model === "skinned-mesh",
      ),
      sharedTier: meshed.models.find(
        (cost: (typeof meshed.models)[number]): boolean =>
          cost.model === "prop-model",
      )?.tier,
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
      }).models.find(
        (cost: (typeof meshed.models)[number]): boolean =>
          cost.model === "prop-model",
      )?.tier,
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
}
