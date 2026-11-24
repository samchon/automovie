import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import type { measureAutoMovieCameraFrameEdge } from "./measureAutoMovieCameraFrameEdge.js";

/**
 * Report a cut by the frame's sides as a warning and return its coverage row.
 *
 * A cut confirmed on an opaque drawn surface is `confirmed`; one seen only on a
 * transparent surface, or inferred from bounds the surface could not check, is
 * a `candidate`. A side the bounds cross only before the near plane is listed
 * as crossed with no extent, and a finding whose sides all lack one is a
 * candidate with no rank, its row `checked`. A budget stop leaves the row
 * `deferred` and an unreadable surface leaves it `unsupported`, each with its
 * candidate. A drawn surface wholly `outside` the frame is no cut: the row is
 * `checked` with no warning, and the caller reports the subject out of frame.
 *
 * @param findings The sample's findings, which a cut is appended to.
 * @param row The subject's `camera-frame-edge` row before its outcome.
 * @param result The frame-edge measurement of the subject.
 * @returns The row with its outcome.
 * @evidence contracts/development/common.md#meaningful-documentation States when a cut is confirmed or a candidate, how a side crossed only before the near plane is listed, the row status each surface outcome leaves, and that a surface wholly outside the frame is left to the caller as no cut.
 * @evidence contracts/development/implementation.md#principled-implementation A cut is confirmed only on an opaque drawn surface, as #4048 item 4 requires; bounds, an envelope, a transparent surface or a deferred check give a candidate. The rank is the largest extent past a side, as item 6 requires. A surface that shows nowhere in the frame is not cut by its edge, so it gets no `frame-edge-cut` warning.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Return the row for outcomes with nothing to report, build one warning from the crossings and the surface, then name the row status from the surface outcome.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A budget stop is `deferred` and an unreadable surface `unsupported`, each with its reason, never `checked`.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the at most four crossed sides.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reports one subject's measurement once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Appends plain values to the caller's array and keeps nothing.
 */
export function reportAutoMovieCameraFrameEdge(
  findings: IAutoMovieInspectionDiagnostics.IFinding[],
  row: Pick<
    IAutoMovieInspectionDiagnostics.ICoverage,
    "check" | "key" | "required"
  >,
  result: measureAutoMovieCameraFrameEdge.IResult,
): IAutoMovieInspectionDiagnostics.ICoverage {
  if (result.status === "unmeasured")
    return { ...row, status: "unsupported", reason: result.reason };
  if (
    result.status === "inside" ||
    result.surface?.status === "clear" ||
    result.surface?.status === "outside"
  )
    return { ...row, status: "checked" };
  const { crossings, surface } = result;
  const extents: number[] = crossings.flatMap(
    (crossing: measureAutoMovieCameraFrameEdge.ICrossing): number[] =>
      crossing.extent === undefined ? [] : [crossing.extent],
  );
  const sides: string = crossings
    .map(
      (crossing: measureAutoMovieCameraFrameEdge.ICrossing): string =>
        crossing.side,
    )
    .join(" ");
  const confirmed: boolean = surface?.status === "cut" && surface.opaque;
  findings.push({
    check: row.check,
    key: row.key,
    code: "frame-edge-cut",
    paths: [row.key],
    category: "warning",
    confidence: confirmed ? "confirmed" : "candidate",
    message: `Required subject ${row.key} ${confirmed ? "is" : "may be"} cut by the ${sides.replaceAll(" ", " and ")} ${crossings.length > 1 ? "edges" : "edge"} of the delivery frame.`,
    witness: {
      ...(extents.length === 0 ? {} : { rank: Math.max(...extents) }),
      measurements: [
        { name: "crossed-sides", value: sides, unit: "sides" },
        ...crossings.flatMap(
          (
            crossing: measureAutoMovieCameraFrameEdge.ICrossing,
          ): IAutoMovieInspectionDiagnostics.IMeasurement[] =>
            crossing.extent === undefined
              ? []
              : [
                  {
                    name: `${crossing.side}-edge-extent`,
                    value: crossing.extent,
                    unit: "normalized device units",
                  },
                ],
        ),
        ...(surface?.status === "cut"
          ? [
              {
                name: "frame-edge-triangles",
                value: surface.triangles,
                unit: "triangles",
              },
              ...(surface.fraction === undefined
                ? []
                : [
                    {
                      name: "visible-fraction-by-projected-surface-area",
                      value: surface.fraction,
                      unit: "fraction",
                    },
                  ]),
            ]
          : []),
      ],
    },
  });
  return surface === null || surface.status === "cut"
    ? { ...row, status: "checked" }
    : {
        ...row,
        status: surface.status === "over-budget" ? "deferred" : "unsupported",
        reason: surface.reason,
      };
}
