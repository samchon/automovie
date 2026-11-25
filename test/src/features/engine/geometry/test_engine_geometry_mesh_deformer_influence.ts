import { createAutoMovieMeshDeformer } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationField,
  IAutoMovieMeshDeformationInfluence,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";
import { throwsError } from "../../internal/throwsError";

/**
 * A deformer's per-vertex influence (weight and its gradient per metre) scales
 * the displacement and enters the differential by the product rule.
 *
 * Fixture: the unit right triangle with +z normals; unit z displacement within
 * radius 2. The mask f(x) = 0.25 + 0.5 x samples weights 0.25, 0.75, 0.25 with
 * gradient (0.5, 0, 0); the masked height f(x) (1 - x^2 / 4)^3.
 *
 * Scenarios:
 *
 * 1. At x = 0 the height is 0.25 and the slope 0.5 (normal (-0.5, 0, 1)
 *    normalized); at x = 1 the height is 0.75 x 27/64 and the slope -0.75 x
 *    27/32 + 0.5 x 27/64; the samples are unchanged.
 * 2. A zero mask is the identity and a constant unit mask the unmasked result.
 * 3. A local x stretch -2 is refused unmasked ("local surface orientation"); a
 *    constant 0.25 mask admits it, moving x = 1 to 1 - 0.5 x 27/64.
 * 4. No samples, weight -0.01 and weight 1.01 are refused ("Mesh influence").
 * 5. A translation by 2 over radius 1000 at the origin: unmasked and under weight
 *    0.5 with gradient -0.25 it is admitted; with gradient -1 the map reverses
 *    and is refused.
 */
export function test_engine_geometry_mesh_deformer_influence(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    uvs: null,
    skin: null,
  };
  const field: IAutoMovieMeshDeformationField = {
    center: { x: 0, y: 0, z: 0 },
    radius: { x: 2, y: 2, z: 2 },
    displacement: { x: 0, y: 0, z: 1 },
    stretch: { x: 0, y: 0, z: 0 },
  };
  const apply = createAutoMovieMeshDeformer([field]);
  const constant = (weight: number): IAutoMovieMeshDeformationInfluence[] =>
    [0, 1, 2].map(() => ({ weight, gradient: { x: 0, y: 0, z: 0 } }));

  // 1.
  const samples: IAutoMovieMeshDeformationInfluence[] = [0.25, 0.75, 0.25].map(
    (weight: number) => ({
      weight,
      gradient: { x: 0.5, y: 0, z: 0 },
    }),
  );
  const before: string = JSON.stringify(samples);
  const result: IAutoMovieMesh = apply(mesh, samples);
  const slope: number = (-0.75 * 27) / 32 + (0.5 * 27) / 64;
  TestValidator.predicate(
    "heights",
    nclose(result.positions[2]!, 0.25) &&
      nclose(result.positions[5]!, (0.75 * 27) / 64),
  );
  TestValidator.predicate(
    "centre normal",
    nclose(result.normals![0]!, -0.5 / Math.hypot(0.5, 1)) &&
      nclose(result.normals![2]!, 1 / Math.hypot(0.5, 1)),
  );
  TestValidator.predicate(
    "product rule",
    nclose(result.normals![3]!, -slope / Math.hypot(slope, 1)) &&
      nclose(result.normals![5]!, 1 / Math.hypot(slope, 1)),
  );
  TestValidator.equals("samples kept", JSON.stringify(samples), before);

  // 2.
  TestValidator.equals("zero mask", apply(mesh, constant(0)), mesh);
  TestValidator.equals("unit mask", apply(mesh, constant(1)), apply(mesh));

  // 3.
  const reflect = createAutoMovieMeshDeformer([
    {
      ...field,
      displacement: { x: 0, y: 0, z: 0 },
      stretch: { x: -2, y: 0, z: 0 },
    },
  ]);
  TestValidator.predicate(
    "unmasked reflection",
    throwsError((): unknown => reflect(mesh), "local surface orientation"),
  );
  TestValidator.predicate(
    "moderated",
    nclose(reflect(mesh, constant(0.25)).positions[3]!, 1 - (0.5 * 27) / 64),
  );

  // 4.
  for (const [label, influence] of [
    ["none", []],
    ["below 0", constant(-0.01)],
    ["above 1", constant(1.01)],
  ] satisfies [string, IAutoMovieMeshDeformationInfluence[]][])
    TestValidator.predicate(
      label,
      throwsError((): unknown => apply(mesh, influence), "Mesh influence"),
    );

  // 5.
  const translate = createAutoMovieMeshDeformer([
    {
      ...field,
      radius: { x: 1000, y: 1000, z: 1000 },
      displacement: { x: 2, y: 0, z: 0 },
    },
  ]);
  const origin: IAutoMovieMesh = {
    ...mesh,
    positions: [0, 0, 0],
    normals: null,
    indices: [],
  };
  translate(origin);
  translate(origin, [{ weight: 0.5, gradient: { x: -0.25, y: 0, z: 0 } }]);
  TestValidator.predicate(
    "mask reversal",
    throwsError(
      (): unknown =>
        translate(origin, [{ weight: 0.5, gradient: { x: -1, y: 0, z: 0 } }]),
      "local surface orientation",
    ),
  );
}
