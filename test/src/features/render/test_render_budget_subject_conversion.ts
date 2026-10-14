import { autoMovieRenderSubjectOfShot } from "@automovie/engine";
import { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  buildingFixture,
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";
import {
  plantingCluster,
  plantingRecipe,
  softPanel,
} from "../internal/softFixtures";

/**
 * The compiled shot conversion preserves every supplied simulated and decoded resource.
 *
 * Scenarios:
 *
 * 1. Absent optional inputs become empty lists; supplied environment, water, cloth, planting and texture records remain reachable.
 *
 * @evidence contracts/testing.md#behavioral-verification Converts a compiled-shot projection through the real adapter and checks empty optional populations, retained instance-set count and supplied environment/water/texture/cloth/planting identities. Dropping any tested supplemental population fails its literal identity assertion.
 * @evidence contracts/testing.md#independent-expectations The authored fixtures supply tower, basin, textures/stone.png, panel and atrium-bed, while omitted inputs specify empty lists. These literal identities and one set are independent expectations; this test checks reachability and does not certify every field of each projected payload.
 * @evidence contracts/testing.md#distinguishing-cases Retains absent versus supplied supplemental arrays and a compiled instance set. Detailed geometry, residency and decoded-resource accounting belong to inventory and storage tests; this adapter case does not validate choreography.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_subject_conversion owns portable synchronous adapter calls on in-memory records. Its reduced compiled fixture covers only fields this adapter reads and no shot execution, viewer, GPU or host is created.
 */
export function test_render_budget_subject_conversion(): void {
  // The compiled shot is read through one conversion, so every evidence path
  // measures the same artifact. The shot choreography plays no part in the
  // conversion, which is why the fixture states only the fields it reads.
  const compiled: IAutoMovieCompiledShotSource = {
    scene: sceneFixture(),
    models: modelsFixture(),
    motions: [],
    eventSamples: [],
    formations: [],
    instanceSets: [instanceSetFixture({ id: "windows", count: 2, chunks: 1 })],
    formationMotions: [],
    formationSlotMotions: [],
    effects: [],
    shot: {},
  } as unknown as IAutoMovieCompiledShotSource;

  TestValidator.equals(
    "a compiled shot converts to a subject, absent optional inputs and all",
    {
      bare: {
        environments: autoMovieRenderSubjectOfShot({ compiled }).environments,
        water: autoMovieRenderSubjectOfShot({ compiled }).waterBodies,
        panels: autoMovieRenderSubjectOfShot({ compiled }).softBodies,
        plantings: autoMovieRenderSubjectOfShot({ compiled }).plantings,
        textures: autoMovieRenderSubjectOfShot({ compiled }).textures,
        sets: autoMovieRenderSubjectOfShot({ compiled }).instanceSets?.length,
      },
      full: {
        environments: autoMovieRenderSubjectOfShot({
          compiled: { ...compiled, builtEnvironments: [buildingFixture()] },
          waterBodies: [
            {
              id: "basin",
              owner: null,
              nodes: [],
              domain: null,
              cells: 1,
              particles: 2,
              material: null,
            },
          ],
          textures: [
            {
              format: "rgba8" as const,
              asset: "textures/stone.png",
              width: 2,
              height: 2,
              mipmapped: false,
            },
          ],
        }).environments?.map(
          (
            environment: NonNullable<
              ReturnType<typeof autoMovieRenderSubjectOfShot>["environments"]
            >[number],
          ): string => environment.id,
        ),
        water: autoMovieRenderSubjectOfShot({
          compiled,
          waterBodies: [
            {
              id: "basin",
              owner: null,
              nodes: [],
              domain: null,
              cells: 1,
              particles: 2,
              material: null,
            },
          ],
        }).waterBodies?.map(
          (
            body: NonNullable<
              ReturnType<typeof autoMovieRenderSubjectOfShot>["waterBodies"]
            >[number],
          ): string => body.id,
        ),
        textures: autoMovieRenderSubjectOfShot({
          compiled,
          textures: [
            {
              format: "rgba8" as const,
              asset: "textures/stone.png",
              width: 2,
              height: 2,
              mipmapped: false,
            },
          ],
        }).textures?.map(
          (
            texture: NonNullable<
              ReturnType<typeof autoMovieRenderSubjectOfShot>["textures"]
            >[number],
          ): string => texture.asset,
        ),
        // Cloth and planting reach the subject the same way water does: the
        // compiled shot does not carry them, so a conversion that dropped them
        // would produce a report that reads complete over an unfurnished room.
        panels: autoMovieRenderSubjectOfShot({
          compiled,
          softBodies: [
            {
              domain: softPanel({ columns: 2, rows: 2 }),
              owner: null,
              material: null,
            },
          ],
        }).softBodies?.map(
          (
            body: NonNullable<
              ReturnType<typeof autoMovieRenderSubjectOfShot>["softBodies"]
            >[number],
          ): string => body.domain.id,
        ),
        plantings: autoMovieRenderSubjectOfShot({
          compiled,
          plantings: [
            {
              domain: plantingRecipe(),
              cluster: plantingCluster(),
              owner: null,
              branchMaterial: null,
              leafMaterial: null,
              branch: null,
              leaf: null,
            },
          ],
        }).plantings?.map(
          (
            planting: NonNullable<
              ReturnType<typeof autoMovieRenderSubjectOfShot>["plantings"]
            >[number],
          ): string => planting.cluster.id,
        ),
      },
    },
    {
      bare: {
        environments: [],
        water: [],
        panels: [],
        plantings: [],
        textures: [],
        sets: 1,
      },
      full: {
        environments: ["tower"],
        water: ["basin"],
        textures: ["textures/stone.png"],
        panels: ["panel"],
        plantings: ["atrium-bed"],
      },
    },
  );
}
