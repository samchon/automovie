import {
  extrudeAutoMovieRegion,
  transformAutoMovieMesh,
  validateTextureScale,
} from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAtlasDensityRange } from "../internal/IAtlasDensityRange";
import { atlasDensityRange } from "../internal/atlasMeasure";
import { namedFacts, nclose, violationCount } from "../internal/predicates";

/**
 * Advisory warnings a validation carries, or `-1` when it failed outright.
 *
 * Only the success arm of the result union has a warning list, and collapsing
 * a failure to zero warnings would let a refused model compare equal to a clean
 * one. `-1` keeps the two apart in the comparison below.
 */
const warningCount: (validation: IAutoMovieValidation) => number = (
  validation: IAutoMovieValidation,
): number =>
  validation.success === true ? (validation.warnings ?? []).length : -1;

/** A 1 m square section extruded 4 m: one atlas-bearing member at unit size. */
const member: () => IAutoMovieMesh = (): IAutoMovieMesh =>
  extrudeAutoMovieRegion({
    outer: [
      { x: -0.5, y: -0.5 },
      { x: 0.5, y: -0.5 },
      { x: 0.5, y: 0.5 },
      { x: -0.5, y: 0.5 },
    ],
    depth: 4,
  });

/**
 * One model whose single part declares a coordinate source and may be scaled.
 *
 * `source` exists so the case can prove the validator examined this exact
 * fixture rather than returning clean because something about the shape made it
 * say nothing. A `"normalized"` declaration over a span of 4 is refused, so the
 * same model differing only in that word is the positive control.
 */
const declaredModel: (
  scale: number | null,
  source?: "surface-metres" | "normalized",
) => IAutoMovieModel = (
  scale: number | null,
  source: "surface-metres" | "normalized" = "surface-metres",
): IAutoMovieModel => {
  const part: IAutoMovieModelPart = {
    id: "shaft",
    name: null,
    geometry: { type: "mesh", mesh: member() },
    material: "oak",
    attachedBone: null,
    transform:
      scale === null
        ? null
        : ({
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: scale, y: scale, z: scale },
          } as IAutoMovieModelPart["transform"]),
  };
  return {
    parts: [part],
    materials: [
      {
        id: "oak",
        baseColorTexture: {
          asset: "public/textures/oak.png",
          texCoord: 0,
          colorSpace: "srgb",
          coordinateSource: source,
          transform: {
            offset: { x: 0, y: 0 },
            scale: { x: 2, y: 2 },
            rotationDeg: 0,
          },
        },
      } as IAutoMovieMaterial,
    ],
  } as IAutoMovieModel;
};

/**
 * What a placement's scale does to a metric atlas, and what nothing does about it.
 *
 * Placement preserves UVs while scaling geometry. A uniform scale's surface
 * area grows by the square of that factor, so the unchanged UV-area ratio is
 * its reciprocal. A nonuniform scale changes faces by their own directions.
 * These numeric measurements do not observe a finish's rendered appearance.
 *
 * Scenarios:
 *
 * 1. A rotation and a translation cost nothing. The uv buffer comes back
 *    element for element and the metric claim still reads exactly 1, which is
 *    the positive case the scale is measured against.
 * 2. A uniform scale of 3 leaves that same uv buffer untouched while the
 *    surface grows nine times in area, so every triangle reads 1 / 9 and one
 *    atlas unit now spans three metres.
 * 3. A non-uniform scale is not wrong by one number. Scaling one axis by 3
 *    leaves the faces across it at 1 and drives the faces along it to 1 / 3, so
 *    no single correction restores the set.
 * 4. Nothing downstream sees it. `validateTextureScale` reads a binding against
 *    the part's own coordinate span and never the part's transform, so the
 *    scaled part and the unscaled one return the identical clean verdict for
 *    the same `"surface-metres"` declaration. A control declaring `"normalized"`
 *    over the same span is refused, which is what makes the two clean verdicts
 *    evidence that the validator looked rather than evidence that it skipped.
 * 5. None of the three densities was taken over a shrinking subset. A collapsed
 *    face carries no ratio, so it would drop out of both bounds and leave the
 *    survivors looking better behaved than the surface is; all three meshes
 *    report zero of them.
 *
 * @evidence contracts/testing.md#behavioral-verification Transforms the authored metric prism and measures its UV/surface-area extrema, asserting unchanged UV buffers for rigid and uniform placement, ratios one, one ninth and one third-to-one, and no skipped small-area faces. Texture-scale validation must retain the same clean verdict for unscaled/scaled surface-metres declarations while refusing the adjacent normalized declaration.
 * @evidence contracts/testing.md#independent-expectations Rigid transforms preserve area, uniform scale three multiplies it by nine, and scaling only X multiplies affected face areas by three while orthogonal faces retain theirs. The independent triangle area observer measures these analytic ratios. Validation counts observe its resident-UV contract rather than world-space geometric admission; partial typed fixtures are used only at that seam, and no rendered finish is checked.
 * @evidence contracts/testing.md#distinguishing-cases Preserves rigid versus uniform/nonuniform transforms, both ratio extrema, three zero-exclusion counts, unchanged UVs, equal validation warnings and the normalized-span negative control. General texture binding admission and malformed transform inputs belong to their own validation/procedural entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry invokes portable extrusion, transform and validation source with the existing atlas observer and fixture. It requires no consumer installation, native build, real host, browser or GPU and owns all cases without dynamic registration.
 */
export function test_geometry_placement_scale_atlas(): void {
  const built: IAutoMovieMesh = member();
  const placed: IAutoMovieMesh = transformAutoMovieMesh(built, {
    translation: { x: 7, y: -2, z: 3 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  });
  const turned: IAtlasDensityRange = atlasDensityRange(placed);
  TestValidator.equals(
    "a rotation and a translation keep both the atlas and what it means",
    namedFacts([
      [
        "uvBufferIsElementForElement",
        (): boolean =>
          placed.uvs!.length === built.uvs!.length &&
          placed.uvs!.every((value: number, at: number): boolean =>
            nclose(value, built.uvs![at], 0),
          ),
      ],
      ["andStillReadsOneMetrePerUnit", (): boolean => nclose(turned.least, 1)],
      ["onEveryTriangle", (): boolean => nclose(turned.most, 1)],
    ]),
    {
      uvBufferIsElementForElement: true,
      andStillReadsOneMetrePerUnit: true,
      onEveryTriangle: true,
    },
  );

  const enlarged: IAutoMovieMesh = transformAutoMovieMesh(built, {
    scale: { x: 3, y: 3, z: 3 },
  });
  const grown: IAtlasDensityRange = atlasDensityRange(enlarged);
  TestValidator.equals(
    "a uniform scale of 3 leaves the atlas alone and makes every unit 3 m",
    namedFacts([
      [
        "uvBufferIsStillElementForElement",
        (): boolean =>
          enlarged.uvs!.length === built.uvs!.length &&
          enlarged.uvs!.every((value: number, at: number): boolean =>
            nclose(value, built.uvs![at], 0),
          ),
      ],
      ["yetTheDensityIsOneNinth", (): boolean => nclose(grown.least, 1 / 9)],
      ["uniformlySo", (): boolean => nclose(grown.most, 1 / 9)],
    ]),
    {
      uvBufferIsStillElementForElement: true,
      yetTheDensityIsOneNinth: true,
      uniformlySo: true,
    },
  );

  const stretched: IAtlasDensityRange = atlasDensityRange(
    transformAutoMovieMesh(built, { scale: { x: 3, y: 1, z: 1 } }),
  );
  TestValidator.equals(
    "a non-uniform scale is not wrong by one number, so nothing corrects it",
    namedFacts([
      [
        "facesAlongTheScaledAxis",
        (): boolean => nclose(stretched.least, 1 / 3),
      ],
      ["facesAcrossItAreUntouched", (): boolean => nclose(stretched.most, 1)],
      [
        "soOneFactorCannotServeBoth",
        (): boolean => !nclose(stretched.most, stretched.least, 0),
      ],
    ]),
    {
      facesAlongTheScaledAxis: true,
      facesAcrossItAreUntouched: true,
      soOneFactorCannotServeBoth: true,
    },
  );

  const asBuilt: IAutoMovieValidation = validateTextureScale({
    models: [declaredModel(null)],
  });
  const asScaled: IAutoMovieValidation = validateTextureScale({
    models: [declaredModel(3)],
  });
  const control: IAutoMovieValidation = validateTextureScale({
    models: [declaredModel(null, "normalized")],
  });
  TestValidator.equals(
    "the declaration is never checked against the placement that falsified it",
    namedFacts([
      // The control first: a clean verdict below means nothing unless this
      // fixture is one the validator actually reads and can refuse.
      [
        "theValidatorDoesReadThisFixture",
        (): boolean => violationCount(control) > 0,
      ],
      ["theUnscaledPartIsClean", (): boolean => violationCount(asBuilt) === 0],
      ["andSoIsTheScaledOne", (): boolean => violationCount(asScaled) === 0],
      [
        "withTheSameWarnings",
        (): boolean => warningCount(asBuilt) === warningCount(asScaled),
      ],
    ]),
    {
      theValidatorDoesReadThisFixture: true,
      theUnscaledPartIsClean: true,
      andSoIsTheScaledOne: true,
      withTheSameWarnings: true,
    },
  );

  TestValidator.equals(
    "every density above was taken over real area, none of it over a collapsed face",
    namedFacts([
      ["turned", (): boolean => turned.degenerate === 0],
      ["grown", (): boolean => grown.degenerate === 0],
      ["stretched", (): boolean => stretched.degenerate === 0],
    ]),
    { turned: true, grown: true, stretched: true },
  );
}
