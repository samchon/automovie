import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieTessellateContourPath64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * A contour strip admits finite saved geometry and reports only representable
 * generated areas.
 *
 * The triangular prism preserves metre positions, saved ordinals, closed rings
 * and an independent wall area. Rotating both starting ordinals changes the
 * first triangle. Repeated strips preserve finite faces and report incidence.
 * Sparse coordinates, nonfinite stations or objectives and malformed starts
 * throw. Tests distinguish collapsed faces, cross-product overflow,
 * square-millimetre conversion overflow and overflow of the whole pair's area.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the valid strip, retained incidence warnings, malformed inputs and the distinct arithmetic limits on a face and a whole pair.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public Curve entry point with authored triangular rings and complete walks. Tests mesh and report values, error messages and omission diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations Six triangles form the side walls of a right triangular prism. Its area is (2 + sqrt(2)) times width times station separation in square millimetres. The chosen magnitudes independently place the projected winding, individual area conversion and pair accumulation on either side of their representable limits.
 */
export function test_engine_geometry_contour_path_admission(): void {
  const tessellate = AutoMovieEngineCurve.tessellateContourPath64;
  const ordinary = contourStrip(1000, 1000);
  const output = tessellate(ordinary);
  const area: number = (2 + Math.SQRT2) * 1e6;
  TestValidator.equals(
    "metre positions and saved face order",
    [output.mesh.positions, output.mesh.indices],
    [
      [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1],
      [0, 3, 1, 4, 1, 3, 1, 4, 2, 5, 2, 4, 2, 5, 0, 3, 0, 5],
    ],
  );
  TestValidator.equals(
    "physical identity and closed lower ring",
    [output.mesh.physicalVertices?.vertices, output.construction[0]],
    [
      [0, 1, 2, 3, 4, 5],
      {
        id: "p",
        points: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 0, 1],
          [0, 0, 0],
        ],
      },
    ],
  );
  const report = output.pairs[0]!;
  TestValidator.predicate(
    "independent side area and objective difference",
    report.firstTriangle === 0 &&
      report.triangles === 6 &&
      report.omittedTriangles === 0 &&
      Math.abs(report.areaMm2 - area) < 1e-8 &&
      Math.abs(report.objectiveDiscrepancyMm2 - (area - 3e6)) < 1e-8 &&
      output.mesh.normals?.length === 18 &&
      output.mesh.normals.every(Number.isFinite),
  );
  const pair = ordinary.pairs[0]!;
  const rotated = tessellate({
    ...ordinary,
    pairs: [{ ...pair, startP: 1, startQ: 1 }],
  });
  TestValidator.equals(
    "rotation of both leading ordinals",
    rotated.mesh.indices,
    [1, 4, 2, 5, 2, 4, 2, 5, 0, 3, 0, 5, 0, 3, 1, 4, 1, 3],
  );
  const repeated = tessellate({
    ...ordinary,
    pairs: [pair, { ...pair, id: "repeat" }],
  });
  TestValidator.predicate(
    "qualified faces survive repetition and empty walks preserve saved positions",
    repeated.pairs[1]?.firstTriangle === 6 &&
      repeated.pairs[1].triangles === 6 &&
      repeated.pairs[1].diagnostics.includes("Repeated generated face") &&
      tessellate({ ...ordinary, pairs: [] }).mesh.positions.length === 18,
  );

  const upper = ordinary.polygons[1]!;
  const sparse = [0, 1000, 0] satisfies AutoMovieVector3Tuple;
  Reflect.deleteProperty(sparse, 0);
  const wrongPoints = (
    point: AutoMovieVector3Tuple,
  ): IAutoMovieTessellateContourPath64.IInput => ({
    ...ordinary,
    polygons: [
      ordinary.polygons[0]!,
      { ...upper, pointsMm: [upper.pointsMm[0]!, point, upper.pointsMm[2]!] },
    ],
  });
  const invalid: [string, IAutoMovieTessellateContourPath64.IInput, string][] =
    [
      [
        "fractional start P",
        { ...ordinary, pairs: [{ ...pair, startP: 0.5 }] },
        "complete finite path",
      ],
      [
        "fractional start Q",
        { ...ordinary, pairs: [{ ...pair, startQ: 0.5 }] },
        "complete finite path",
      ],
      [
        "NaN start",
        { ...ordinary, pairs: [{ ...pair, startP: Number.NaN }] },
        "complete finite path",
      ],
      [
        "infinite objective",
        { ...ordinary, pairs: [{ ...pair, objectiveAreaMm2: Infinity }] },
        "complete finite path",
      ],
      ["infinite station", contourStrip(1000, Infinity), "finite Y-plane"],
      [
        "nonfinite coordinate",
        wrongPoints([Infinity, 1000, 0]),
        "finite Y-plane",
      ],
      ["sparse coordinate", wrongPoints(sparse), "finite Y-plane"],
      [
        "whole pair area overflow",
        contourStrip(1e154, 8e153),
        'Contour pair "strip" area must remain finite',
      ],
    ];
  TestValidator.equals(
    "domain and aggregate refusals",
    invalid
      .filter(
        ([, input, message]) => !throwsError(() => tessellate(input), message),
      )
      .map(([name]) => name),
    [],
  );

  // A positive projected area too small to round to a nonzero binary64 still
  // gives representable side areas when the station separation is one metre.
  for (const [width, height, areaScale] of [
    [1e-170, 1000, 1e-167],
    [1e150, 1e150, 1e300],
  ] as const) {
    const strip = tessellate(contourStrip(width, height));
    TestValidator.predicate(
      "finite strip area",
      strip.pairs[0]?.triangles === 6 &&
        Math.abs(strip.pairs[0].areaMm2 / areaScale - (2 + Math.SQRT2)) <
          1e-14 &&
        strip.mesh.normals?.every(Number.isFinite) === true,
    );
  }

  // The first collapses in the published metre coordinates. The other strips
  // overflow either the cross magnitude or the conversion to square mm.
  for (const [width, height] of [
    [1000, Number.MIN_VALUE],
    [1e200, 1e200],
    [1e150, 1e159],
  ] as const) {
    const omitted = tessellate(contourStrip(width, height));
    const pairReport = omitted.pairs[0]!;
    TestValidator.predicate(
      "unrepresentable face omissions",
      pairReport.triangles === 0 &&
        pairReport.omittedTriangles === 6 &&
        pairReport.areaMm2 === 0 &&
        pairReport.objectiveDiscrepancyMm2 === 3e6 &&
        pairReport.diagnostics.includes(
          "Unrepresentable or collapsed generated triangles omitted",
        ) &&
        omitted.mesh.positions.every(Number.isFinite) &&
        omitted.mesh.normals?.length === 18 &&
        omitted.mesh.normals.every((value: number): boolean => value === 0),
    );
  }
}

function contourStrip(
  widthMm: number,
  heightMm: number,
): IAutoMovieTessellateContourPath64.IInput {
  return {
    topologyDomain: "triangular-contour",
    polygons: [
      {
        id: "p",
        stationMm: 0,
        pointsMm: [
          [0, 0, 0],
          [widthMm, 0, 0],
          [0, 0, widthMm],
        ],
      },
      {
        id: "q",
        stationMm: heightMm,
        pointsMm: [
          [0, heightMm, 0],
          [widthMm, heightMm, 0],
          [0, heightMm, widthMm],
        ],
      },
    ],
    pairs: [
      {
        id: "strip",
        pId: "p",
        qId: "q",
        startP: 0,
        startQ: 0,
        steps: "PQPQPQ",
        objectiveAreaMm2: 3e6,
      },
    ],
  };
}
