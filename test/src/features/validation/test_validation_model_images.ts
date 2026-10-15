import {
  type IAutoMovieTextureImageFacts,
  validateModel,
  validateTextureAssets,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { encodeTestPng } from "../internal/encodeTestPng";
import { createModel } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

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
  images: unknown,
  material?: Partial<IAutoMovieMaterial>,
) => IAutoMovieModel = (
  images: unknown,
  material?: Partial<IAutoMovieMaterial>,
): IAutoMovieModel => {
  const model: IAutoMovieModel = createModel();
  return {
    ...model,
    images: images as IAutoMovieImage[],
    materials: [
      { ...model.materials[0]!, baseColorTexture: GRID, ...material },
    ],
  };
};

const refusedAt: (images: unknown, path: string) => boolean = (
  images: unknown,
  path: string,
): boolean =>
  hasViolation(validateModel({ model: carrying(images) }), "type", path) ||
  hasViolation(validateModel({ model: carrying(images) }), "range", path);

/**
 * Model admission of carried images and their place in the texture closure: the PNG header subset the viewer decodes is required, and a binding that names a carried image needs no ledger record.
 *
 * Scenarios:
 *
 * 1. A model carrying one RGBA PNG bound by its base colour validates, and the texture closure with an empty ledger reports nothing for it, while a second model binding the same id without carrying it is reported unregistered.
 * 2. One carried image bound as sRGB colour and as a linear normal map is reported as contradictory under that model's image, not as a project asset.
 * 3. A non-list, a non-record entry, a blank or repeated id, a JPEG media type, a data-URI prefix, non-PNG bytes, a 16-bit depth, a palette, interlacing, a zero edge and an edge one past 8192 are each refused at the image's path, while greyscale, greyscale-alpha and RGB images and an 8192-pixel edge are admitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel and validateTextureAssets on authored models and checks the reported paths, catching a missing image gate, a ledger demand for carried bytes and a lost intent check.
 * @evidence contracts/testing.md#independent-expectations PNG bytes come from an independent Node zlib encoder with authored IHDR fields; the admitted subset and the 8192 edge are the documented interface contract, and the ledger rule follows the interface's resolution order.
 * @evidence contracts/testing.md#distinguishing-cases Pairs carried and uncarried bindings of one id, each refused header field with an admitted colour type, and the edge bound at 8192 and 8193; viewer decoding and material lobes are owned by their own tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported unit runs portable engine validators on in-memory records without a file, browser or GPU.
 */
export function test_validation_model_images(): void {
  const facts: (asset: string) => IAutoMovieTextureImageFacts | undefined = ():
    | IAutoMovieTextureImageFacts
    | undefined => undefined;
  const closure: (models: IAutoMovieModel[]) => IAutoMovieValidation = (
    models: IAutoMovieModel[],
  ): IAutoMovieValidation =>
    validateTextureAssets({
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
        (): boolean => validateModel({ model: carrying([image()]) }).success,
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
  ): boolean => validateModel({ model: carrying(images) }).success;
  TestValidator.equals(
    "only the decoded PNG subset is admitted",
    namedFacts([
      ["notList", (): boolean => refusedAt({}, "$input.images")],
      ["notRecord", (): boolean => refusedAt([7], "$input.images[0]")],
      [
        "blankId",
        (): boolean => refusedAt([image({ id: " " })], "$input.images[0].id"),
      ],
      [
        "repeatedId",
        (): boolean =>
          refusedAt([image(), image()], "$input.images[1].id") &&
          !refusedAt([image(), image()], "$input.images[0].id"),
      ],
      [
        "jpeg",
        (): boolean =>
          refusedAt(
            [image({ mimeType: "image/jpeg" as "image/png" })],
            "$input.images[0].mimeType",
          ),
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
          ([0, 2, 4] as const).every((colourType: 0 | 2 | 4): boolean =>
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
      notList: true,
      notRecord: true,
      blankId: true,
      repeatedId: true,
      jpeg: true,
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
