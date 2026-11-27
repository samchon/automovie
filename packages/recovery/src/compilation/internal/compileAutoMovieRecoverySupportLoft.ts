import { AutoMovieEngineConvexSupportLoft } from "@automovie/engine";
import type {
  IAutoMovieConvexSupportLoft,
  IAutoMoviePhysicalYInterval,
  IAutoMovieRealizeConvexSupportLoft,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySupportLoft,
  IAutoMovieRecoverySupportLoftBudget,
  IAutoMovieRecoverySupportRealization,
} from "@automovie/interface";

import { scaleRecoveryLoftIntervals } from "./scaleRecoveryLoftIntervals";

/*
 * Generate new geometry, normal fans and construction from saved support
 * curves. Independent coordinate edits transform the support equations by the
 * inverse diagonal map and renormalize each plane, preserving other axis
 * extents. No source image, measurement row, source mesh or source normal is
 * consulted. Partial denotes inferred finite-view coverage, regardless of
 * completed emission.
 */
export function compileAutoMovieRecoverySupportLoft(
  recipe: IAutoMovieRecoverySupportLoft,
  budget: IAutoMovieRecoverySupportLoftBudget,
): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportRealization> {
  const operator: IAutoMovieRecoveryResult<unknown>["operator"] =
    "image-support-loft-v1";
  try {
    if (
      !recipe ||
      recipe.family !== "finite-view-convex-support" ||
      !recipe.objectId.trim() ||
      !recipe.frame.trim() ||
      !recipe.loft ||
      !recipe.loft.spans.length ||
      !recipe.dimensions ||
      ![
        recipe.dimensions.widthScale,
        recipe.dimensions.depthScale,
        recipe.dimensions.heightScale,
      ].every((scale: number): boolean => scale >= 0.25 && scale <= 4) ||
      recipe.coverage?.lateralSurface !==
        "inferred-finite-view-convex-support" ||
      recipe.coverage.endCaps !== "unobserved" ||
      recipe.coverage.interior !== "unobserved" ||
      recipe.coverage.hiddenConcavities !== "unobserved" ||
      recipe.coverage.cameras !== "supplied" ||
      recipe.coverage.enclosure !== "not-certified" ||
      !budget ||
      budget.maxPlanes < 3 ||
      recipe.loft.planes.length > budget.maxPlanes
    )
      throw new Error(
        "invalid-support-recipe: support coefficients, independent scales and explicit unknown coverage required",
      );
    for (const plane of recipe.loft.planes)
      if (
        !plane ||
        plane.normal.length !== 2 ||
        Math.abs(Math.hypot(...plane.normal) - 1) > 64 * Number.EPSILON
      )
        throw new Error(
          "invalid-support-recipe: original plane normals must already be unit vectors",
        );
    const intervals: IAutoMoviePhysicalYInterval[] = scaleRecoveryLoftIntervals(
      recipe.loft.spans,
      recipe.dimensions.heightScale,
    );
    const lengths: number[] = recipe.loft.planes.map(
      (plane: IAutoMovieConvexSupportLoft["planes"][number]): number =>
        Math.hypot(
          plane.normal[0] / recipe.dimensions.widthScale,
          plane.normal[1] / recipe.dimensions.depthScale,
        ),
    );
    const loft: IAutoMovieConvexSupportLoft = {
      planes: recipe.loft.planes.map(
        (
          plane: IAutoMovieConvexSupportLoft["planes"][number],
          i: number,
        ): IAutoMovieConvexSupportLoft["planes"][number] => ({
          id: plane.id,
          normal: [
            plane.normal[0] / recipe.dimensions.widthScale / lengths[i],
            plane.normal[1] / recipe.dimensions.depthScale / lengths[i],
          ],
        }),
      ),
      spans: recipe.loft.spans.map(
        (
          span: IAutoMovieConvexSupportLoft["spans"][number],
          index: number,
        ): IAutoMovieConvexSupportLoft["spans"][number] => ({
          interval: intervals[index]!,
          offsets: span.offsets.map(
            (q: number[], i: number): [number, number, number, number] => [
              q[0]! / lengths[i]!,
              q[1]! / lengths[i]!,
              q[2]! / lengths[i]!,
              q[3]! / lengths[i]!,
            ],
          ),
        }),
      ),
    };
    const generated: IAutoMovieRealizeConvexSupportLoft.IResult =
      AutoMovieEngineConvexSupportLoft.realize({
        ...budget,
        loft,
        topologyDomain: `support-loft:${recipe.objectId}`,
      });
    return {
      operator,
      status: "partial",
      diagnostics: [
        "Finite-view convex support approximation; physical concavity, end caps and interior remain unobserved, and enclosure is not certified",
      ],
      value: {
        model: {
          id: recipe.objectId,
          name: null,
          origin: "generated",
          skeleton: null,
          body: null,
          asset: null,
          materials: [],
          parts: [
            {
              id: "lateral-surface",
              name: null,
              material: null,
              attachedBone: null,
              transform: null,
              geometry: { type: "mesh", mesh: generated.mesh },
            },
          ],
        },
        construction: generated.construction,
        generation: {
          events: generated.events,
          intervals: generated.intervals,
          vertices: generated.mesh.positions.length / 3,
          maximumBoundaryDefectMeters: generated.maximumBoundaryDefectMeters,
          faceChordBoundMeters: generated.faceChordBoundMeters,
          eventQualification: generated.eventQualification,
        },
      },
    };
  } catch (failure: unknown) {
    return {
      operator,
      status: "refused",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
