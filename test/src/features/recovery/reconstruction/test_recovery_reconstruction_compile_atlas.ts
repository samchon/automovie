import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieCreateEllipticLoftAtlas,
  IAutoMovieRealizeBicubicAtlas64,
} from "@automovie/interface";
import { AutoMovieRecoveryReconstruction } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Checks the Recovery atlas adapter's transfer of the Engine receipt.
 *
 * Scenarios:
 *
 * 1. A saved, one-span elliptical loft yields four owned patches.
 * 2. Recovery keeps the original recipe and returns the tessellation receipt,
 *    primitive ranges and emitted mesh from the Engine owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names owned patch count, recipe identity, realized mesh and realization records.
 * @evidence contracts/development/testing.md#behavioral-verification Creates one typed finite atlas, realizes it through Engine and compares the Recovery adapter's recipe and generated outputs.
 * @evidence contracts/development/testing.md#independent-expectations One span contains one patch per quadrant. Exact Engine and adapter receipt equality tests transfer without relying on approximate pose or mesh comparisons.
 */
export function test_recovery_reconstruction_compile_atlas(): void {
  const source: IAutoMovieCreateEllipticLoftAtlas.IInput = {
    topologyDomain: "recovery-atlas-receipt",
    tolerance: 0.02,
    maxCells: 512,
    maxVertices: 2048,
    loft: {
      spans: [
        {
          interval: { lowerY: 0, upperY: 1 },
          centreX: [0, 0, 0, 0],
          centreZ: [0, 0, 0, 0],
          radiusX: [0.2, 0.2, 0.2, 0.2],
          radiusZ: [0.1, 0.1, 0.1, 0.1],
        },
      ],
    },
  };
  const { geometry }: IAutoMovieCreateEllipticLoftAtlas.IResult =
    AutoMovieEngineGeometry.createEllipticLoftAtlas(source);
  TestValidator.equals("one patch per quadrant", geometry.patches.length, 4);
  const engine: IAutoMovieRealizeBicubicAtlas64.IResult =
    AutoMovieEngineGeometry.realizeBicubicAtlas64(geometry);
  const output = AutoMovieRecoveryReconstruction.compileAtlas(geometry);
  TestValidator.predicate(
    "the reference atlas emits triangles",
    (engine.mesh.indices?.length ?? 0) > 0,
  );
  TestValidator.predicate(
    "recipe retains the coefficient authority",
    output.recipeModel.parts[0]?.geometry === geometry,
  );
  TestValidator.equals(
    "native range records in original order",
    output.primitiveRanges,
    engine.primitiveRanges,
  );
  TestValidator.equals("native realization receipt", output.realization, {
    complete: engine.complete,
    approximationQualified: engine.approximationQualified,
    diagnostics: engine.diagnostics,
    counts: engine.counts,
  });
  TestValidator.equals(
    "native emitted mesh",
    output.compiledModel.parts[0]?.geometry,
    {
      type: "mesh",
      mesh: engine.mesh,
    },
  );
}
