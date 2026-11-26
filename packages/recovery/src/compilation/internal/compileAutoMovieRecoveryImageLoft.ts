import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieEllipticLoft,
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageLoftBudget,
  IAutoMovieRecoveryImageRealization,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

/** Scale each coefficient of one four-coefficient span row. */
function scale4(
  row: Readonly<[number, number, number, number]>,
  factor: number,
): [number, number, number, number] {
  return [row[0] * factor, row[1] * factor, row[2] * factor, row[3] * factor];
}

/**
 * Generate an ordinary AutoMovie bicubic model and its actual construction from
 * saved section coefficients alone. Positive axis scales preserve the other two
 * coordinate extents; height edits anchor at the lowest saved station.
 * Construction evaluates the generated atlas coefficients, including its
 * declared circular-cubic approximation. The viewer and numerical mesh consumer
 * use that same atlas. Partial describes unobserved caps/interior,
 * independently of the engine's later tessellation completion or source/image
 * fidelity.
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
      !recipe.objectId.trim() ||
      !recipe.frame.trim() ||
      !recipe.loft ||
      !recipe.loft.spans.length ||
      !recipe.dimensions ||
      ![
        recipe.dimensions.widthScale,
        recipe.dimensions.depthScale,
        recipe.dimensions.heightScale,
      ].every((value: number): boolean => value >= 0.25 && value <= 4) ||
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
          interval: [
            anchor +
              (span.interval[0] - anchor) * recipe.dimensions.heightScale,
            anchor +
              (span.interval[1] - anchor) * recipe.dimensions.heightScale,
          ],
          radiusX: scale4(span.radiusX, recipe.dimensions.widthScale),
          radiusZ: scale4(span.radiusZ, recipe.dimensions.depthScale),
          centreX: scale4(span.centreX, recipe.dimensions.widthScale),
          centreZ: scale4(span.centreZ, recipe.dimensions.depthScale),
        }),
      ),
    };
    const atlas: ReturnType<typeof AutoMovieEngineGeometry.createEllipticLoftAtlas> =
      AutoMovieEngineGeometry.createEllipticLoftAtlas({
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
