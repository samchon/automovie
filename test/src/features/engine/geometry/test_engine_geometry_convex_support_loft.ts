import { AutoMovieEngineConvexSupportLoft } from "@automovie/engine";
import type { IAutoMovieRealizeConvexSupportLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Realize a rectangular prism's lateral mesh from one authored cubic span.
 *
 * Scenarios:
 *
 * 1. Four constant XZ half-planes and Y from 1 to 4 m enclose a 3 by 2 m section.
 *    The result has the authored bounds, two triangles per side, eight physical
 *    corners, one interval and no interior events.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed support planes, interval, known bounds and expected open lateral topology.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes a one-span support field and checks its actual XYZ bounds, side triangles, physical corners and event count.
 * @evidence contracts/development/testing.md#independent-expectations Four constant half-planes give four unchanged rectangle sides across heights 1 to 4. The two end rings supply eight physical corners, and only the four sides contribute triangles.
 */
export function test_engine_geometry_convex_support_loft(): void {
  const result: IAutoMovieRealizeConvexSupportLoft.IResult =
    AutoMovieEngineConvexSupportLoft.realize({
      loft: {
        planes: [
          { id: "right", normal: [1, 0] },
          { id: "front", normal: [0, 1] },
          { id: "left", normal: [-1, 0] },
          { id: "back", normal: [0, -1] },
        ],
        spans: [
          {
            interval: { lowerY: 1, upperY: 4 },
            offsets: [
              [2, 2, 2, 2],
              [1, 1, 1, 1],
              [1, 1, 1, 1],
              [1, 1, 1, 1],
            ],
          },
        ],
      },
      topologyDomain: "prism",
      tolerance: 1e-6,
      maxPlanes: 4,
      maxEvents: 0,
      maxCells: 4,
      maxVertices: 16,
      minimumDirectionSine: 1e-6,
    });

  const axes: readonly [number, number, number] = [0, 1, 2];
  const lower: readonly [number, number, number] = [-1, 1, -1];
  const upper: readonly [number, number, number] = [2, 4, 1];
  TestValidator.predicate(
    "authored XYZ bounds",
    axes.every((axis: number): boolean => {
      const coordinates: number[] = result.mesh.positions.filter(
        (_coordinate: number, index: number): boolean => index % 3 === axis,
      );
      return (
        nclose(Math.min(...coordinates), lower[axis]!, 1e-12) &&
        nclose(Math.max(...coordinates), upper[axis]!, 1e-12)
      );
    }),
  );
  TestValidator.equals(
    "open lateral topology",
    {
      triangles: (result.mesh.indices?.length ?? 0) / 3,
      corners: result.mesh.physicalVertices?.sources.length,
      intervals: result.intervals,
      events: result.events,
    },
    { triangles: 8, corners: 8, intervals: 1, events: 0 },
  );
}
