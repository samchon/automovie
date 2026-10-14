import { autoMovieDrawingCellSection, autoMovieDrawingCellVolume, autoMovieDrawingFrame, autoMovieDrawingPolygonArea, deriveAutoMovieDrawing } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieHalfSpacePlane, IAutoMovieDrawing, IAutoMovieDrawingFrame, IAutoMovieDrawingGap, IAutoMovieDrawingPoint, IAutoMovieDrawingRegion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingCell, drawingView } from "./drawingFixtures";
import { namedFacts, nclose } from "./predicates";

/** Original quantity-report scenarios 6 and 7, preserving authored cell probes and section observations. */
export function test02DrawingQuantityGeometry(
  environment: IAutoMovieBuiltEnvironment,
  unboundedCell: (environment: IAutoMovieBuiltEnvironment) => IAutoMovieBuiltEnvironment,
): void {
  // 6. Cell volume.
  const box: (min: [number, number, number], max: [number, number, number]) => IAutoMovieHalfSpacePlane[] = (
    min: [number, number, number],
    max: [number, number, number],
  ): IAutoMovieHalfSpacePlane[] =>
    drawingCell(
      "probe",
      { x: min[0], y: min[1], z: min[2] },
      { x: max[0], y: max[1], z: max[2] },
    ).planes;
  TestValidator.equals(
    "a convex cell's volume is the volume of the solid it bounds",
    namedFacts([
      [
        "a 2 by 3 by 4 box is 24 cubic metres",
        () : boolean =>
          nclose(autoMovieDrawingCellVolume(box([0, 0, 0], [2, 3, 4]))!, 24),
      ],
      [
        "the same box written with unnormalized normals is the same volume",
        () : boolean =>
          nclose(
            autoMovieDrawingCellVolume(
              box([0, 0, 0], [2, 3, 4]).map((plane: IAutoMovieHalfSpacePlane) : { normal: { x: number; y: number; z: number; }; offset: number; } => ({
                normal: {
                  x: plane.normal.x * 5,
                  y: plane.normal.y * 5,
                  z: plane.normal.z * 5,
                },
                offset: plane.offset * 5,
              })),
            )!,
            24,
          ),
      ],
      [
        "a repeated face is redundant, not a second face",
        () : boolean =>
          nclose(
            autoMovieDrawingCellVolume([
              ...box([0, 0, 0], [2, 3, 4]),
              { normal: { x: 1, y: 0, z: 0 }, offset: 2 },
            ])!,
            24,
          ),
      ],
      [
        "a plane touching only one edge bounds no face and adds no cone",
        () : boolean =>
          nclose(
            autoMovieDrawingCellVolume([
              ...box([0, 0, 0], [2, 2, 2]),
              // Through the whole x = 2, y = 2 edge and nothing else.
              { normal: { x: 1, y: 1, z: 0 }, offset: 4 },
            ])!,
            8,
          ),
      ],
      [
        "a corner cut off a unit cube removes exactly a sixth of it",
        () : boolean =>
          nclose(
            autoMovieDrawingCellVolume([
              ...box([0, 0, 0], [1, 1, 1]),
              // x + y + z <= 2 slices the corner at (1, 1, 1); the piece it
              // removes is a tetrahedron of legs 1, so 1/6 of a cubic metre.
              { normal: { x: 1, y: 1, z: 1 }, offset: 2 },
            ])!,
            1 - 1 / 6,
          ),
      ],
      [
        "a column open at one end reports no volume rather than a confident zero",
        () : boolean =>
          autoMovieDrawingCellVolume([
            { normal: { x: 1, y: 0, z: 0 }, offset: 1 },
            { normal: { x: -1, y: 0, z: 0 }, offset: 0 },
            { normal: { x: 0, y: 0, z: 1 }, offset: 1 },
            { normal: { x: 0, y: 0, z: -1 }, offset: 0 },
            // Bounded on four sides and open upward: four corners exist, so a
            // vertex count alone would let it through.
            { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
          ]) === null,
      ],
      [
        "a wedge capped twice and open below reports no volume either",
        () : boolean =>
          autoMovieDrawingCellVolume([
            { normal: { x: 1, y: 0, z: 0 }, offset: 1 },
            { normal: { x: -1, y: 0, z: 0 }, offset: 1 },
            { normal: { x: 0, y: 0, z: 1 }, offset: 1 },
            { normal: { x: 0, y: 0, z: -1 }, offset: 0 },
            // Two capping planes meeting in a ridge give six non-coplanar
            // corners, and the solid still runs off downward.
            { normal: { x: -1, y: 1, z: 0 }, offset: 5 },
            { normal: { x: 1, y: 1, z: 0 }, offset: 5 },
          ]) === null,
      ],
      [
        "four parallel planes bound no solid and report none",
        () : boolean =>
          autoMovieDrawingCellVolume([
            { normal: { x: 1, y: 0, z: 0 }, offset: 1 },
            { normal: { x: 1, y: 0, z: 0 }, offset: 2 },
            { normal: { x: 1, y: 0, z: 0 }, offset: 3 },
            { normal: { x: 1, y: 0, z: 0 }, offset: 4 },
          ]) === null,
      ],
      [
        "a polygon of fewer than three points encloses nothing",
        () : boolean =>
          nclose(autoMovieDrawingPolygonArea([
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ]), 0, 0),
      ],
    ]),
    {
      "a 2 by 3 by 4 box is 24 cubic metres": true,
      "the same box written with unnormalized normals is the same volume": true,
      "a repeated face is redundant, not a second face": true,
      "a plane touching only one edge bounds no face and adds no cone": true,
      "a corner cut off a unit cube removes exactly a sixth of it": true,
      "a column open at one end reports no volume rather than a confident zero": true,
      "a wedge capped twice and open below reports no volume either": true,
      "four parallel planes bound no solid and report none": true,
      "a polygon of fewer than three points encloses nothing": true,
    },
  );

  // 7. Cross-sections.
  const frame: IAutoMovieDrawingFrame = autoMovieDrawingFrame(drawingView());
  TestValidator.equals(
    "a cross-section is the cell where the cut meets it and nothing where it does not",
    namedFacts([
      [
        "a box the cut passes through sections at its own plan extent",
        () : boolean => {
          const section: { polygon: IAutoMovieDrawingPoint[]; bounded: boolean; } = autoMovieDrawingCellSection(
            frame,
            box([0, 0, 0], [2, 3, 4]),
          );
          return (
            section.bounded === true &&
            nclose(autoMovieDrawingPolygonArea(section.polygon), 8)
          );
        },
      ],
      [
        "a box wholly above the cut sections to nothing",
        () : boolean =>
          autoMovieDrawingCellSection(frame, box([0, 2, 0], [2, 3, 4])).polygon
            .length === 0,
      ],
      [
        "a cell whose own half-spaces contradict sections to nothing",
        () : boolean =>
          autoMovieDrawingCellSection(frame, [
            { normal: { x: 1, y: 0, z: 0 }, offset: 1 },
            { normal: { x: -1, y: 0, z: 0 }, offset: -5 },
            { normal: { x: 0, y: 1, z: 0 }, offset: 3 },
            { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
          ]).polygon.length === 0,
      ],
      [
        "a cell the design never closed is reported unbounded rather than drawn",
        () : boolean =>
          autoMovieDrawingCellSection(frame, [
            { normal: { x: 1, y: 0, z: 0 }, offset: 10 },
            { normal: { x: -1, y: 0, z: 0 }, offset: 0 },
            { normal: { x: 0, y: 1, z: 0 }, offset: 3 },
            { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
          ]).bounded === false,
      ],
      [
        "the plan of an unbounded cell says so instead of drawing a horizon",
        () : boolean => {
          const drawing: IAutoMovieDrawing = deriveAutoMovieDrawing({
            environment: unboundedCell(environment),
            view: drawingView({ id: "unbounded" }),
          });
          return (
            // The same word the quantity report uses: the section exists and
            // the closed cell it needs does not.
            drawing.gaps.find((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "unbounded-space-cell")
              ?.status === "not-run" &&
            drawing.regions.every((region: IAutoMovieDrawingRegion) : boolean => region.cell !== "open-cell")
          );
        },
      ],
    ]),
    {
      "a box the cut passes through sections at its own plan extent": true,
      "a box wholly above the cut sections to nothing": true,
      "a cell whose own half-spaces contradict sections to nothing": true,
      "a cell the design never closed is reported unbounded rather than drawn": true,
      "the plan of an unbounded cell says so instead of drawing a horizon": true,
    },
  );

}
