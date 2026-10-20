import { realizeAutoMovieConvexSupportLoft } from "@automovie/engine/geometry/realizeAutoMovieConvexSupportLoft";
import type { IAutoMovieConvexSupportLoft } from "@automovie/interface";
import type { IAutoMovieRecoverySupportLoft } from "@automovie/interface/recovery";

import type { IAutoMovieRecoverySupportLoftBudget } from "../structures/image/IAutoMovieRecoverySupportLoftBudget";
import type { IAutoMovieRecoverySupportRealization } from "../structures/image/IAutoMovieRecoverySupportRealization";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/**
 * Generate new geometry, normal fans and construction from saved support curves.
 * Independent coordinate edits transform the support equations by the inverse
 * diagonal map and renormalize each plane, preserving other axis extents.
 * No source image, measurement row, source mesh or source normal is consulted.
 * Partial denotes inferred finite-view coverage, regardless of completed emission.
 *
 * @evidence contracts/common.md#principled-implementation Inverse-transpose plane transformation under independent X/Z scales preserves the same edited inequalities; shifted/scaled physical Y changes the chart. The generic engine intersects their cubic profiles and generates its own surfaces and analytic normals.
 * @evidence contracts/common.md#clear-and-simple-design Recovery admits the recipe family, edit range and coverage policy; engine owns continuous intersections/tessellation and viewer receives ordinary mesh/construction outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original bytes, dense contour table, copied mesh/normal, hidden cap or certified-concavity/enclosure claim supplies generation. Invalid coverage or scales refuse rather than completing unknown regions.
 * @evidence contracts/common.md#meaningful-documentation States source isolation, scale anchors, inverse plane transformation, new normals and separate processing versus physical coverage semantics.
 * @evidence contracts/performance.md#efficient-algorithms O(P S) field transformation precedes the bounded engine's O(S P to the fourth + (S+E) P cubed + T P squared + C) planning/incidence/emission, for E events, C strips and T station-triple visits bounded by O((S+E+1) P cubed). No image or source-sized traversal occurs; the engine owner includes its triple/map retention separately from output.
 * @evidence contracts/performance.md#reuse-equivalent-work One transformed coefficient field supplies model geometry and its actual construction; no second fit or independent normal source is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transformed fields and plans expire synchronously; model, construction and scalar diagnostics transfer without I/O, GPU, task or global retention.
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
      typeof recipe.objectId !== "string" ||
      !recipe.objectId.trim() ||
      typeof recipe.frame !== "string" ||
      !recipe.frame.trim() ||
      !recipe.loft ||
      !Array.isArray(recipe.loft.planes) ||
      !Array.isArray(recipe.loft.spans) ||
      !recipe.loft.spans.length ||
      !recipe.dimensions ||
      ![
        recipe.dimensions.widthScale,
        recipe.dimensions.depthScale,
        recipe.dimensions.heightScale,
      ].every(
        (scale: number): boolean =>
          Number.isFinite(scale) && scale >= 0.25 && scale <= 4,
      ) ||
      recipe.coverage?.lateralSurface !==
        "inferred-finite-view-convex-support" ||
      recipe.coverage.endCaps !== "unobserved" ||
      recipe.coverage.interior !== "unobserved" ||
      recipe.coverage.hiddenConcavities !== "unobserved" ||
      recipe.coverage.cameras !== "supplied" ||
      recipe.coverage.enclosure !== "not-certified" ||
      !budget ||
      !Number.isSafeInteger(budget.maxPlanes) ||
      budget.maxPlanes < 3 ||
      recipe.loft.planes.length > budget.maxPlanes
    )
      throw new Error(
        "invalid-support-recipe: support coefficients, independent scales and explicit unknown coverage required",
      );
    for (const plane of recipe.loft.planes)
      if (
        !plane ||
        !Array.isArray(plane.normal) ||
        plane.normal.length !== 2 ||
        !Number.isFinite(plane.normal[0]) ||
        !Number.isFinite(plane.normal[1]) ||
        Math.abs(Math.hypot(...plane.normal) - 1) > 64 * Number.EPSILON
      )
        throw new Error(
          "invalid-support-recipe: original plane normals must already be unit vectors",
        );
    const anchor: number = recipe.loft.spans[0]?.interval?.[0];
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
        ): IAutoMovieConvexSupportLoft["spans"][number] => ({
          interval: span.interval.map(
            (y: number): number =>
              anchor + (y - anchor) * recipe.dimensions.heightScale,
          ) as [number, number],
          offsets: span.offsets.map(
            (q: number[], i: number): [number, number, number, number] =>
              q.map((h: number): number => h / lengths[i]) as [
                number,
                number,
                number,
                number,
              ],
          ),
        }),
      ),
    };
    const generated: ReturnType<typeof realizeAutoMovieConvexSupportLoft> =
      realizeAutoMovieConvexSupportLoft({
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
