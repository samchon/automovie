import { createAutoMovieEllipticLoftAtlas } from "@automovie/engine/geometry/createAutoMovieEllipticLoftAtlas";
import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieEllipticLoft,
} from "@automovie/interface";
import type { IAutoMovieRecoveryImageLoft } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryImageLoftBudget } from "../structures/image/IAutoMovieRecoveryImageLoftBudget";
import type { IAutoMovieRecoveryImageRealization } from "../structures/image/IAutoMovieRecoveryImageRealization";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/**
 * Generate an ordinary AutoMovie bicubic model and its actual construction from
 * saved section coefficients alone. Positive axis scales preserve the other two
 * coordinate extents; height edits anchor at the lowest saved station. Construction
 * evaluates the generated atlas coefficients, including its declared circular-cubic
 * approximation. The viewer and numerical mesh consumer use that same atlas.
 * Partial describes unobserved caps/interior, independently of the engine's later
 * tessellation completion or source/image fidelity.
 *
 * @evidence contracts/common.md#principled-implementation Validated scalar profiles and independent coordinate scales feed the engine's shared elliptic-to-bicubic producer; construction samples its authoritative tensor coefficients rather than an image or source mesh.
 * @evidence contracts/common.md#clear-and-simple-design One source-free compiler returns the ordinary public model and generating lines. The engine owns surface coefficients and tessellation, the viewer owns display and a host owns serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source address, image, observation table, external mesh, copied normal or inferred cap is opened or accepted as generation input; invalid families, scales or coverage tags refuse.
 * @evidence contracts/common.md#meaningful-documentation States metre units, edit anchors/independence, exact construction authority, circular approximation and the separate meanings of partial coverage and tessellation completion.
 * @evidence contracts/performance.md#efficient-algorithms Atlas production is O(S) for S spans; fixed 32-sample quarter sections and 16-sample span guides add O(S) construction work and memory without triangulating an unrequested model.
 * @evidence contracts/performance.md#reuse-equivalent-work The same returned atlas supplies display and numerical consumers; all construction samples read that atlas rather than refitting profiles or repeating acquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compiler owns no global cache or file handle. Scaled-profile scratch expires on return and the model, construction and scalar bound transfer to the caller.
 */
export function compileAutoMovieRecoveryImageLoft(
  recipe: IAutoMovieRecoveryImageLoft,
  budget: IAutoMovieRecoveryImageLoftBudget,
): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageRealization> {
  const operator: IAutoMovieRecoveryResult<unknown>["operator"] =
    "image-elliptic-loft-v1";
  try {
    if (
      !recipe ||
      recipe.family !== "aligned-elliptical-sections" ||
      typeof recipe.objectId !== "string" ||
      !recipe.objectId.trim() ||
      typeof recipe.frame !== "string" ||
      !recipe.frame.trim() ||
      !recipe.loft ||
      !Array.isArray(recipe.loft.spans) ||
      !recipe.loft.spans.length ||
      !recipe.dimensions ||
      ![
        recipe.dimensions.widthScale,
        recipe.dimensions.depthScale,
        recipe.dimensions.heightScale,
      ].every(
        (value: number): boolean =>
          Number.isFinite(value) && value >= 0.25 && value <= 4,
      ) ||
      recipe.coverage?.lateralSurface !==
        "inferred-under-aligned-ellipse-prior" ||
      recipe.coverage.endCaps !== "unobserved" ||
      recipe.coverage.interior !== "unobserved" ||
      recipe.coverage.cameras !== "supplied"
    )
      throw new Error(
        "invalid-image-recipe: aligned-section coefficients, explicit coverage and admissible independent dimensions required",
      );
    const anchor: number = recipe.loft.spans[0]?.interval?.[0];
    const scaled: IAutoMovieEllipticLoft = {
      spans: recipe.loft.spans.map(
        (
          span: IAutoMovieEllipticLoft["spans"][number],
        ): IAutoMovieEllipticLoft["spans"][number] => ({
          interval: span.interval.map(
            (y: number): number =>
              anchor + (y - anchor) * recipe.dimensions.heightScale,
          ) as [number, number],
          radiusX: span.radiusX.map(
            (value: number): number => value * recipe.dimensions.widthScale,
          ) as [number, number, number, number],
          radiusZ: span.radiusZ.map(
            (value: number): number => value * recipe.dimensions.depthScale,
          ) as [number, number, number, number],
          centreX: span.centreX.map(
            (value: number): number => value * recipe.dimensions.widthScale,
          ) as [number, number, number, number],
          centreZ: span.centreZ.map(
            (value: number): number => value * recipe.dimensions.depthScale,
          ) as [number, number, number, number],
        }),
      ),
    };
    const atlas: ReturnType<typeof createAutoMovieEllipticLoftAtlas> =
      createAutoMovieEllipticLoftAtlas({
        loft: scaled,
        topologyDomain: `image-loft:${recipe.objectId}`,
        ...budget,
      });
    const geometry: IAutoMovieBicubicAtlasGeometry = atlas.geometry;
    const point: (
      patch: number,
      u: number,
      v: number,
    ) => [number, number, number] = (
      patch: number,
      u: number,
      v: number,
    ): [number, number, number] => {
      const a: number[] = [
        (1 - u) ** 3,
        3 * u * (1 - u) ** 2,
        3 * u * u * (1 - u),
        u ** 3,
      ];
      const b: number[] = [
        (1 - v) ** 3,
        3 * v * (1 - v) ** 2,
        3 * v * v * (1 - v),
        v ** 3,
      ];
      const result: [number, number, number] = [0, 0, 0];
      for (let row: number = 0; row < 4; row++)
        for (let column: number = 0; column < 4; column++) {
          const control: IAutoMovieBicubicAtlasGeometry["controls"][number] =
            geometry.controls[
              geometry.patches[patch].controlIds[4 * row + column]
            ];
          const weight: number = a[column] * b[row];
          result[0] += weight * control.x;
          result[1] += weight * control.y;
          result[2] += weight * control.z;
        }
      return result;
    };
    const construction: {
      id: string;
      closed: boolean;
      points: [number, number, number][];
    }[] = [];
    for (let span: number = 0; span < scaled.spans.length; span++)
      for (let row: number = span === 0 ? 0 : 1; row <= 2; row++) {
        const points: [number, number, number][] = [];
        for (let quarter: number = 0; quarter < 4; quarter++)
          for (let column: number = 0; column < 32; column++)
            points.push(point(4 * span + quarter, column / 32, row / 2));
        construction.push({
          id: `section.${span}.${row}`,
          closed: true,
          points,
        });
      }
    for (let meridian: number = 0; meridian < 8; meridian++) {
      const points: [number, number, number][] = [];
      for (let span: number = 0; span < scaled.spans.length; span++)
        for (let row: number = span === 0 ? 0 : 1; row <= 16; row++)
          points.push(
            point(
              4 * span + Math.floor(meridian / 2),
              (meridian % 2) / 2,
              row / 16,
            ),
          );
      construction.push({ id: `meridian.${meridian}`, closed: false, points });
    }
    return {
      operator,
      status: "partial",
      diagnostics: [
        "Open lateral surface inferred under an aligned-ellipse prior; end caps and interior remain unobserved",
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
              geometry,
            },
          ],
        },
        construction,
        arcDeviationBoundMeters: atlas.arcDeviationBound,
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
