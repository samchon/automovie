import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieTextureImageFacts,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { encodeTestPng } from "../../internal/encodeTestPng";
import { createModel } from "../../internal/fixtures";
import { hasViolation, namedFacts } from "../../internal/predicates";

const GRID: string = "grid";

const image: (patch?: Partial<IAutoMovieImage>) => IAutoMovieImage = (
  patch?: Partial<IAutoMovieImage>,
): IAutoMovieImage => ({
  id: GRID,
  mimeType: "image/png",
  data: encodeTestPng({
    width: 2,
    height: 1,
    colourType: 6,
    samples: [255, 0, 0, 255, 0, 0, 255, 128],
  }),
  ...patch,
});

const carrying: (
  images: IAutoMovieImage[] | undefined,
  material?: Partial<IAutoMovieMaterial>,
) => IAutoMovieModel = (
  images: IAutoMovieImage[] | undefined,
  material?: Partial<IAutoMovieMaterial>,
): IAutoMovieModel => {
  const model: IAutoMovieModel = createModel();
  return {
    ...model,
    ...(images === undefined ? {} : { images }),
    materials: [
      { ...model.materials[0]!, baseColorTexture: GRID, ...material },
    ],
  };
};

const refusedAt: (images: IAutoMovieImage[], path: string) => boolean = (
  images: IAutoMovieImage[],
  path: string,
): boolean =>
  hasViolation(AutoMovieEngineValidation.validateModel({ model: carrying(images) }), "type", path) ||
  hasViolation(AutoMovieEngineValidation.validateModel({ model: carrying(images) }), "range", path);

/**
 * Model admission of carried images and their place in the texture closure: the
 * PNG header subset the viewer decodes is required, and a binding that names a
 * carried image needs no ledger record.
 *
 * Scenarios:
 *
 * 1. A model carrying one RGBA PNG bound by its base colour validates, and the
 *    texture closure with an empty ledger reports nothing for it, while a
 *    second model binding the same id without carrying it is reported
 *    unregistered.
 * 2. One carried image bound as sRGB colour and as a linear normal map is reported
 *    as contradictory under that model's image, not as a project asset.
 * 3. A repeated id, a data-URI prefix, non-PNG bytes, a 16-bit depth, a palette,
 *    interlacing, a zero edge and an edge one past 8192 are each refused at the
 *    image's path, while greyscale, greyscale-alpha and RGB images and an
 *    8192-pixel edge are admitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers carried PNG admission, ledger closure, decoder bounds and conflicting reading spaces.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateModel and validateTextureAssets on models with authored carried image bytes, bound slots and missing or conflicting declarations.
 * @evidence contracts/development/testing.md#independent-expectations The carried id supplies its binding without the external ledger. One image cannot serve incompatible color and normal decoding. Header literals fix known valid color types, bit depth and the inclusive 8192 edge boundary.
 */
export function test_engine_validation_model_images(): void {
  /** Greyscale, RGB and greyscale-alpha: the PNG colour types besides RGBA. */
  const ADMITTED_COLOUR_TYPES: ReadonlyArray<0 | 2 | 4> = [0, 2, 4];
  const facts: (asset: string) => IAutoMovieTextureImageFacts | undefined = ():
    | IAutoMovieTextureImageFacts
    | undefined => undefined;
  const closure: (models: IAutoMovieModel[]) => IAutoMovieValidation = (
    models: IAutoMovieModel[],
  ): IAutoMovieValidation =>
    AutoMovieEngineValidation.validateTextureAssets({
      production: "studio",
      models,
      scenes: [],
      assets: [],
      facts,
    });
  const plain: IAutoMovieModel = { ...carrying(undefined), id: "plain" };
  const contradictory: IAutoMovieValidation = closure([
    carrying([image()], { normalTexture: GRID }),
  ]);
  TestValidator.equals(
    "a carried image resolves without the ledger and keeps one decoding",
    namedFacts([
      [
        "admitted",
        (): boolean => AutoMovieEngineValidation.validateModel({ model: carrying([image()]) }).success,
      ],
      ["noLedger", (): boolean => closure([carrying([image()])]).success],
      [
        "uncarriedReported",
        (): boolean =>
          hasViolation(
            closure([carrying([image()]), plain]),
            "type",
            "$input.models[1].materials[0].baseColorTexture",
          ) &&
          !hasViolation(
            closure([carrying([image()]), plain]),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "contradiction",
        (): boolean =>
          contradictory.success === false &&
          contradictory.violations.some(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.path.endsWith(".normalTexture") &&
              violation.expected.startsWith('image "grid" of model "model-1"'),
          ),
      ],
    ]),
    {
      admitted: true,
      noLedger: true,
      uncarriedReported: true,
      contradiction: true,
    },
  );

  const header: (
    patch: NonNullable<Parameters<typeof encodeTestPng>[0]["header"]>,
  ) => IAutoMovieImage = (
    patch: NonNullable<Parameters<typeof encodeTestPng>[0]["header"]>,
  ): IAutoMovieImage =>
    image({
      data: encodeTestPng({
        width: 1,
        height: 1,
        colourType: 0,
        samples: [9],
        header: patch,
      }),
    });
  const edge: (width: number) => IAutoMovieImage = (
    width: number,
  ): IAutoMovieImage =>
    image({
      data: encodeTestPng({
        width,
        height: 1,
        colourType: 0,
        samples: new Array<number>(width).fill(7),
      }),
    });
  const admitted: (images: IAutoMovieImage[]) => boolean = (
    images: IAutoMovieImage[],
  ): boolean => AutoMovieEngineValidation.validateModel({ model: carrying(images) }).success;
  TestValidator.equals(
    "only the decoded PNG subset is admitted",
    namedFacts([
      [
        "repeatedId",
        (): boolean =>
          refusedAt([image(), image()], "$input.images[1].id") &&
          !refusedAt([image(), image()], "$input.images[0].id"),
      ],

      [
        "dataUri",
        (): boolean =>
          refusedAt(
            [image({ data: `data:image/png;base64,${image().data}` })],
            "$input.images[0].data",
          ),
      ],
      [
        "notPng",
        (): boolean =>
          refusedAt(
            [image({ data: Buffer.from("GIF89a....").toString("base64") })],
            "$input.images[0].data",
          ),
      ],
      [
        "sixteenBit",
        (): boolean =>
          refusedAt([header({ depth: 16 })], "$input.images[0].data"),
      ],
      [
        "palette",
        (): boolean =>
          refusedAt([header({ colourType: 3 })], "$input.images[0].data"),
      ],
      [
        "interlaced",
        (): boolean =>
          refusedAt([header({ interlace: 1 })], "$input.images[0].data"),
      ],
      [
        "zeroEdge",
        (): boolean => refusedAt([edge(0)], "$input.images[0].data"),
      ],
      [
        "overEdge",
        (): boolean => refusedAt([edge(8193)], "$input.images[0].data"),
      ],
      ["atEdge", (): boolean => admitted([edge(8192)])],
      [
        "colourTypes",
        (): boolean =>
          ADMITTED_COLOUR_TYPES.every((colourType: 0 | 2 | 4): boolean =>
            admitted([
              image({
                data: encodeTestPng({
                  width: 1,
                  height: 1,
                  colourType,
                  samples: [1, 2, 3].slice(0, { 0: 1, 2: 3, 4: 2 }[colourType]),
                }),
              }),
            ]),
          ),
      ],
    ]),
    {
      repeatedId: true,
      dataUri: true,
      notPng: true,
      sixteenBit: true,
      palette: true,
      interlaced: true,
      zeroEdge: true,
      overEdge: true,
      atEdge: true,
      colourTypes: true,
    },
  );
}
