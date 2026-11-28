import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieFitSubdivisionDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * A direct subdivision fit admits finite source control and limit constraints
 * and whole source-face ordinals.
 *
 * An anchored unit quad keeps its four original controls and sixteen refined
 * quads. Invalid face ordinals, coordinates and optional target payloads are
 * refused at their owning fields before the solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fully anchored control, finite metre and integer domain, and explicit constraint refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Geometry.fitSubdivisionDomain on a typed unit quad and invalid variations. Reads both generated topology and finite equality receipt.
 * @evidence contracts/development/testing.md#independent-expectations Hard anchor equality fixes each original unit-square coordinate. Two quad refinements yield 4×4 faces. NaN and sparse slots have no finite value and fractional ids cannot address any source face.
 */
export function test_engine_geometry_fit_subdivision_domain_admission(): void {
  const fit = AutoMovieEngineGeometry.fitSubdivisionDomain;
  const positions = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
  const props: IAutoMovieFitSubdivisionDomain.IProps = {
    cage: { positions, faces: [[0, 1, 2, 3]] },
    controlPositions: positions,
    anchors: [true, true, true, true],
    limitTargets: [null, null, null, null],
    regionFaces: new Set([0]),
  };
  const solved = fit(props);
  TestValidator.predicate(
    "anchored coarse coordinates and refined level",
    solved.coarseControls.length === positions.length &&
      solved.coarseControls.every(
        (value, index) => Math.abs(value - positions[index]!) <= 1e-12,
      ) &&
      solved.level.topology.faceOffsets.length === 17 &&
      solved.maximumEqualityError <= 1e-12,
  );

  const invalid: [string, IAutoMovieFitSubdivisionDomain.IProps, string][] = [
    [
      "fractional face",
      { ...props, regionFaces: new Set([0.5]) },
      "face is out of range",
    ],
    [
      "nonfinite face",
      { ...props, regionFaces: new Set([NaN]) },
      "face is out of range",
    ],
    [
      "NaN control",
      { ...props, controlPositions: [NaN, ...positions.slice(1)] },
      "control positions must be finite",
    ],
    [
      "sparse control",
      { ...props, controlPositions: new Array<number>(12) },
      "control positions must be finite",
    ],
    [
      "infinite limit target",
      { ...props, limitTargets: [[0, Infinity, 0], null, null, null] },
      "finite metre triple",
    ],
    [
      "incomplete limits",
      { ...props, limitTargets: [null, null, null] },
      "match the source vertex count",
    ],
  ];
  TestValidator.equals(
    "malformed supplied controls and constraints",
    invalid
      .filter(([, input, message]) => !throwsError(() => fit(input), message))
      .map(([name]) => name),
    [],
  );
}
