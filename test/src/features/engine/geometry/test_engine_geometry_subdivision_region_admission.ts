import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieFitSubdivisionRegions,
  IAutoMovieSubdivisionCage,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Regional subdivision fits admit whole levels and finite local geometry.
 *
 * A single quad has four children at every refinement. A fully anchored region
 * keeps the same fitted output as its uniformly refined square, within the
 * solve tolerance. Fractional levels and faces, nonfinite coordinates and
 * constraints, and a finite cage whose refinement overflows are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the default and requested depths, an independently fixed region and the malformed and unrepresentable geometry cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public region fitter on one authored cage with indexed UVs, empty and anchored region lists and deliberate domain failures. Reads its actual parameter face count, positions, UVs and equality residual.
 * @evidence contracts/development/testing.md#independent-expectations A quad has four children per level, giving 16, 64 and 4096 at depths 2, 3 and 6. Anchoring all coarse controls leaves the original square. Adjacent finite X coordinates greater than half MAX_VALUE overflow their unscaled sum during edge refinement.
 */
export function test_engine_geometry_subdivision_region_admission(): void {
  const fit = AutoMovieEngineGeometry.fitSubdivisionRegions;
  const cage: IAutoMovieSubdivisionCage = {
    positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    faces: [[0, 1, 2, 3]],
    uvs: [0, 0, 1, 0, 1, 1, 0, 1],
    uvFaces: [[0, 1, 2, 3]],
  };
  const ordinary: IAutoMovieFitSubdivisionRegions.IProps = {
    cage,
    regions: [],
  };
  const refined = fit(ordinary);
  const anchored: IAutoMovieFitSubdivisionRegions.IRegion = {
    faces: new Set([0]),
    anchors: new Set([0, 1, 2, 3]),
    samples: new Map(),
    limitTargets: new Map(),
  };
  const fitted = fit({ ...ordinary, regions: [anchored], levels: 2 });
  TestValidator.equals(
    "one quad contributes four children per level",
    [
      refined,
      fit({ ...ordinary, levels: 3 }),
      fit({ ...ordinary, levels: 6 }),
    ].map(({ level }) => level.parameterFaces.length / 4),
    [16, 64, 4096],
  );
  TestValidator.predicate(
    "anchors preserve uniform positions and keep a finite solve receipt",
    fitted.level.positions.length === refined.level.positions.length &&
      fitted.level.positions.every(
        (value: number, i: number): boolean =>
          Math.abs(value - refined.level.positions[i]!) <= 1e-12,
      ) &&
      fitted.maximumEqualityError <= 1e-12 &&
      refined.maximumEqualityError === 0 &&
      fitted.level.uvs?.every(Number.isFinite) === true,
  );
  const invalid: [string, IAutoMovieFitSubdivisionRegions.IProps, string][] = [
    ...[2.5, Number.NaN, Infinity, 1, 7].map(
      (levels): [string, IAutoMovieFitSubdivisionRegions.IProps, string] => [
        String(levels),
        { ...ordinary, levels },
        "integer from 2 to 6",
      ],
    ),
    [
      "fractional face",
      {
        ...ordinary,
        regions: [{ ...anchored, faces: new Set([0.5]) }],
      },
      "disjoint valid source faces",
    ],
    [
      "nonfinite constraint",
      {
        ...ordinary,
        regions: [{ ...anchored, samples: new Map([[0, [0, 0, NaN]]]) }],
      },
      "subdivision cage positions",
    ],
    [
      "nonfinite coordinate",
      {
        ...ordinary,
        cage: { ...cage, positions: [NaN, ...cage.positions.slice(1)] },
      },
      "cage positions[0] must be finite",
    ],
    [
      "nonfinite UV",
      {
        ...ordinary,
        cage: { ...cage, uvs: [NaN, ...cage.uvs!.slice(1)] },
      },
      "cage uvs[0] must be finite",
    ],
    [
      "finite edge sum overflow",
      {
        ...ordinary,
        cage: {
          ...cage,
          positions: [
            1.2e308, 0, 0, 1.3e308, 0, 0, 1.3e308, 1, 0, 1.2e308, 1, 0,
          ],
        },
      },
      "subdivision arithmetic must remain finite",
    ],
  ];
  TestValidator.equals(
    "domain and arithmetic refusals",
    invalid
      .filter(([, input, message]) => !throwsError(() => fit(input), message))
      .map(([name]) => name),
    [],
  );
}
