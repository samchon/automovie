import {
  type IAutoMovieMesh,
  type IAutoMovieMeshPhysicalVertices,
  type IAutoMovieMeshSkin,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshDeformationInfluence } from "../../../../packages/engine/src/geometry/IAutoMovieMeshDeformationInfluence";
import { createAutoMovieMeshDeformer } from "../../../../packages/engine/src/geometry/createAutoMovieMeshDeformer";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A spatial mask changes the differential of displacement as well as its
 * magnitude. The oracle differentiates f(x)*(1-x²/4)^3 for f=.25+.5*x.
 *
 * Scenarios:
 * 1. At x=0 the masked height is .25 and its slope is .5. At x=1 the
 *    height is .75*27/64 and slope is -.75*27/32+.5*27/64. Normals use
 *    those complete product derivatives, including displacement*mask-gradient.
 * 2. A zero mask is identity, a unit constant mask matches unmasked output,
 *    and invalid sample count, weight or inverse-metre gradient refuses.
 * 3. A mask gradient can reverse a constant-translation map even when the
 *    unfaded field is valid. Its half-strength twin remains oriented, and a
 *    constant mask can moderate a reflected unfaded field into a valid map.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs masked deformation and checks analytic heights and product-rule normals, sample ownership, zero/unit masks, moderated reflection and invalid sample refusals. The existing half-strength translation is observed by nonthrowing execution, while the stronger gradient must refuse orientation reversal.
 * @evidence contracts/testing.md#independent-expectations Differentiating (.25+.5*x)*(1-x*x/4)^3 gives the center and x=1 heights/slopes; normal components follow that planar differential. Constant zero and one masks respectively select identity and compatibility with the unmasked operation, whose parity is not an independent oracle. These samples do not establish orientation everywhere between vertices.
 * @evidence contracts/testing.md#distinguishing-cases Keeps zero/unit and varying masks, positive versus reversing gradient, moderated versus unmasked reflection, sample count, NaN/out-of-range weight and infinite gradient. Unmasked support boundaries, scale overflow and tessellated topology are covered by the other deformation entries.
 * @evidence contracts/testing.md#execution-ownership The named entry directly executes portable deformation source and existing exception assertions on the retained mesh and influence records. It starts no real host, process, browser, GPU or native build, adds no Human fixture and dynamically registers no cases.
 */
export function test_geometry_mesh_deformation_influence(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    uvs: null,
    skin: null,
  };
  const field: {
    center: IAutoMovieVector3;
    radius: IAutoMovieVector3;
    displacement: IAutoMovieVector3;
    stretch: IAutoMovieVector3;
  } = {
    center: { x: 0, y: 0, z: 0 },
    radius: { x: 2, y: 2, z: 2 },
    displacement: { x: 0, y: 0, z: 1 },
    stretch: { x: 0, y: 0, z: 0 },
  };
  const apply: (
    mesh: IAutoMovieMesh,
    influence?: readonly IAutoMovieMeshDeformationInfluence[],
  ) => IAutoMovieMesh = createAutoMovieMeshDeformer([field]);
  const samples: { weight: number; gradient: IAutoMovieVector3 }[] = [
    0.25, 0.75, 0.25,
  ].map((weight: number): { weight: number; gradient: IAutoMovieVector3 } => ({
    weight,
    gradient: { x: 0.5, y: 0, z: 0 },
  }));
  const before: { weight: number; gradient: IAutoMovieVector3 }[] =
    structuredClone(samples);
  const result: IAutoMovieMesh = apply(mesh, samples);
  const slope: number = (-0.75 * 27) / 32 + (0.5 * 27) / 64;
  TestValidator.predicate(
    "masked analytic heights",
    nclose(result.positions[2], 0.25) &&
      nclose(result.positions[5], (0.75 * 27) / 64),
  );
  TestValidator.predicate(
    "mask gradient contributes at field centre",
    nclose(result.normals![0], -0.5 / Math.hypot(0.5, 1)) &&
      nclose(result.normals![2], 1 / Math.hypot(0.5, 1)),
  );
  TestValidator.predicate(
    "product-rule normal away from centre",
    nclose(result.normals![3], -slope / Math.hypot(slope, 1)) &&
      nclose(result.normals![5], 1 / Math.hypot(slope, 1)),
  );
  TestValidator.predicate(
    "influence samples remain owned",
    equalGeometryTestValues(samples, before),
  );
  const constant: (
    weight: number,
  ) => { weight: number; gradient: IAutoMovieVector3 }[] = (
    weight: number,
  ): { weight: number; gradient: IAutoMovieVector3 }[] =>
    Array.from(
      { length: 3 },
      (): { weight: number; gradient: IAutoMovieVector3 } => ({
        weight,
        gradient: { x: 0, y: 0, z: 0 },
      }),
    );
  TestValidator.predicate(
    "zero mask identity",
    equalGeometryTestValues(apply(mesh, constant(0)), mesh),
  );
  TestValidator.predicate(
    "constant unit mask",
    equalGeometryTestValues(apply(mesh, constant(1)), apply(mesh)),
  );
  const moderated: (
    mesh: IAutoMovieMesh,
    influence?: readonly IAutoMovieMeshDeformationInfluence[],
  ) => IAutoMovieMesh = createAutoMovieMeshDeformer([
    {
      ...field,
      displacement: { x: 0, y: 0, z: 0 },
      stretch: { x: -2, y: 0, z: 0 },
    },
  ]);
  TestValidator.predicate(
    "unmasked local reflection refuses",
    throwsError(
      (): IAutoMovieMesh => moderated(mesh),
      "local surface orientation",
    ),
  );
  TestValidator.predicate(
    "only the final composed map is required to preserve orientation",
    nclose(moderated(mesh, constant(0.25)).positions[3], 1 - (0.5 * 27) / 64),
  );
  for (const invalid of [
    [],
    constant(NaN),
    constant(-0.01),
    constant(1.01),
    constant(0.5).map(
      (sample: {
        weight: number;
        gradient: IAutoMovieVector3;
      }): { gradient: IAutoMovieVector3; weight: number } => ({
        ...sample,
        gradient: { x: Infinity, y: 0, z: 0 },
      }),
    ),
  ])
    TestValidator.predicate(
      "invalid differential samples refuse",
      throwsError((): IAutoMovieMesh => apply(mesh, invalid), "Mesh influence"),
    );
  const translation: (
    mesh: IAutoMovieMesh,
    influence?: readonly IAutoMovieMeshDeformationInfluence[],
  ) => IAutoMovieMesh = createAutoMovieMeshDeformer([
    {
      ...field,
      radius: { x: 1000, y: 1000, z: 1000 },
      displacement: { x: 2, y: 0, z: 0 },
    },
  ]);
  const origin: {
    positions: number[];
    normals: null;
    indices: never[];
    physicalVertices?: IAutoMovieMeshPhysicalVertices;
    uvs: number[] | null;
    colors?: number[];
    reliefWeights?: number[];
    skin: IAutoMovieMeshSkin | null;
  } = { ...mesh, positions: [0, 0, 0], normals: null, indices: [] };
  translation(origin);
  translation(origin, [{ weight: 0.5, gradient: { x: -0.25, y: 0, z: 0 } }]);
  TestValidator.predicate(
    "mask derivative reversal refuses",
    throwsError(
      (): IAutoMovieMesh =>
        translation(origin, [{ weight: 0.5, gradient: { x: -1, y: 0, z: 0 } }]),
      "local surface orientation",
    ),
  );
}
