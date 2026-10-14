import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const LOBES: Partial<IAutoMovieMaterial> = {
  anisotropy: { strength: 1, rotationDeg: -720, texture: "flow.png" },
  sheen: { color: { r: 0, g: 1, b: 0.5, a: null, hex: null }, roughness: 0 },
  specularIntensity: 0,
  thicknessTexture: { asset: "depth.png", texCoord: 0, colorSpace: "linear" },
};

const validate: (
  patch: Record<string, unknown>,
  parts?: IAutoMovieModelPart[],
) => IAutoMovieValidation = (
  patch: Record<string, unknown>,
  parts?: IAutoMovieModelPart[],
): IAutoMovieValidation => {
  const model: IAutoMovieModel = createModel();
  return validateModel({
    model: {
      ...model,
      parts: parts ?? model.parts,
      materials: [{ ...model.materials[0]!, ...patch } as IAutoMovieMaterial],
    },
  });
};

const refused: (
  patch: Record<string, unknown>,
  kind: "type" | "range",
  path: string,
) => boolean = (
  patch: Record<string, unknown>,
  kind: "type" | "range",
  path: string,
): boolean =>
  hasViolation(validate({ ...LOBES, ...patch }), kind, `.materials[0]${path}`);

const triangle: (uvs: number[] | null) => IAutoMovieModelPart = (
  uvs: number[] | null,
): IAutoMovieModelPart => ({
  id: "sheet",
  name: null,
  geometry: {
    type: "mesh",
    mesh: {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: null,
      uvs,
      indices: null,
      skin: null,
    },
  },
  material: "mat-1",
  attachedBone: null,
  transform: null,
});

/**
 * Model admission of the anisotropy, sheen, specular-intensity and thickness-texture fields, including the UV0 requirement anisotropy places on a mesh that cites the material.
 *
 * Scenarios:
 *
 * 1. Every lobe at its closed-interval boundary on a UV-bearing mesh, a multi-turn negative rotation, a bare-id anisotropy map and a linear thickness map validate, and omitting every lobe validates.
 * 2. Strength above one and below zero, an infinite rotation, a missing anisotropy texture field, a non-record anisotropy or sheen, sheen roughness above one, an out-of-range sheen colour channel and specular intensity just above one are refused at their paths.
 * 3. An sRGB anisotropy map or thickness map is refused because both slots carry linear data.
 * 4. An anisotropic material cited by a mesh without UV0 is refused at that mesh's `uvs` and one cited by a tessellated primitive at its geometry, while the same mesh with UV0, or with anisotropy strength zero, is not.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel on authored materials and parts and checks reported kinds and paths, catching a missing lobe gate, a clamped value, a lost slot or a missing UV requirement.
 * @evidence contracts/testing.md#independent-expectations The intervals and the linear decoding come from the glTF extension factors the interface restates and documents; the UV0 rule follows the interface's statement that the direction lies in the UV0 tangent frame.
 * @evidence contracts/testing.md#distinguishing-cases Pairs each boundary value with a just-outside twin, a linear with an sRGB binding, and a UV-less mesh or primitive with a UV-bearing mesh and with zero strength; viewer mapping and carried images are owned by their own tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported unit runs the portable engine validator on in-memory records without a file, browser or GPU.
 */
export function test_validation_material_lobes(): void {
  TestValidator.equals(
    "boundary lobes and omitted lobes are admitted",
    namedFacts([
      [
        "boundaries",
        (): boolean =>
          validate(LOBES, [triangle([0, 0, 1, 0, 0, 1])]).success,
      ],
      ["omitted", (): boolean => validate({}).success],
      [
        "nullTexture",
        (): boolean =>
          validate(
            {
              ...LOBES,
              anisotropy: { strength: 0.5, rotationDeg: 30, texture: null },
              thicknessTexture: null,
            },
            [triangle([0, 0, 1, 0, 0, 1])],
          ).success,
      ],
    ]),
    { boundaries: true, omitted: true, nullTexture: true },
  );
  TestValidator.equals(
    "out-of-domain lobes are refused at their paths",
    namedFacts([
      [
        "strengthHigh",
        (): boolean =>
          refused(
            { anisotropy: { ...LOBES.anisotropy, strength: 1.01 } },
            "range",
            ".anisotropy.strength",
          ),
      ],
      [
        "strengthLow",
        (): boolean =>
          refused(
            { anisotropy: { ...LOBES.anisotropy, strength: -0.01 } },
            "range",
            ".anisotropy.strength",
          ),
      ],
      [
        "rotation",
        (): boolean =>
          refused(
            { anisotropy: { ...LOBES.anisotropy, rotationDeg: Infinity } },
            "range",
            ".anisotropy.rotationDeg",
          ),
      ],
      [
        "textureField",
        (): boolean =>
          refused(
            { anisotropy: { strength: 0.5, rotationDeg: 0 } },
            "type",
            ".anisotropy.texture",
          ),
      ],
      [
        "anisotropyRecord",
        (): boolean => refused({ anisotropy: 0.5 }, "type", ".anisotropy"),
      ],
      ["sheenRecord", (): boolean => refused({ sheen: [] }, "type", ".sheen")],
      [
        "sheenRoughness",
        (): boolean =>
          refused(
            { sheen: { ...LOBES.sheen, roughness: 1.01 } },
            "range",
            ".sheen.roughness",
          ),
      ],
      [
        "sheenColour",
        (): boolean =>
          refused(
            {
              sheen: {
                ...LOBES.sheen,
                color: { r: 1.5, g: 0, b: 0, a: null, hex: null },
              },
            },
            "range",
            ".sheen.color.r",
          ),
      ],
      [
        "specular",
        (): boolean =>
          refused({ specularIntensity: 1.01 }, "range", ".specularIntensity"),
      ],
      [
        "anisotropySrgb",
        (): boolean =>
          refused(
            {
              anisotropy: {
                ...LOBES.anisotropy,
                texture: { asset: "flow.png", texCoord: 0, colorSpace: "srgb" },
              },
            },
            "type",
            ".anisotropy.texture.colorSpace",
          ),
      ],
      [
        "thicknessSrgb",
        (): boolean =>
          refused(
            {
              thicknessTexture: {
                asset: "depth.png",
                texCoord: 0,
                colorSpace: "srgb",
              },
            },
            "type",
            ".thicknessTexture.colorSpace",
          ),
      ],
    ]),
    {
      strengthHigh: true,
      strengthLow: true,
      rotation: true,
      textureField: true,
      anisotropyRecord: true,
      sheenRecord: true,
      sheenRoughness: true,
      sheenColour: true,
      specular: true,
      anisotropySrgb: true,
      thicknessSrgb: true,
    },
  );
  const uvPath: string = "$input.parts[0].geometry.mesh.uvs";
  TestValidator.equals(
    "anisotropy needs a UV0 mesh on every part that cites it",
    namedFacts([
      [
        "withoutUvs",
        (): boolean =>
          hasViolation(validate(LOBES, [triangle(null)]), "type", uvPath),
      ],
      [
        "primitive",
        (): boolean =>
          hasViolation(validate(LOBES), "type", "$input.parts[0].geometry"),
      ],
      [
        "withUvs",
        (): boolean =>
          !hasViolation(
            validate(LOBES, [triangle([0, 0, 1, 0, 0, 1])]),
            "type",
            uvPath,
          ),
      ],
      [
        "isotropic",
        (): boolean =>
          !hasViolation(
            validate(
              {
                ...LOBES,
                anisotropy: { strength: 0, rotationDeg: 0, texture: null },
              },
              [triangle(null)],
            ),
            "type",
            uvPath,
          ),
      ],
    ]),
    { withoutUvs: true, primitive: true, withUvs: true, isotropic: true },
  );
}
