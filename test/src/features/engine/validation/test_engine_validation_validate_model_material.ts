import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  AutoMovieViolationKind,
  IAutoMovieColor,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../internal/fixtures";
import { hasViolation } from "../../internal/predicates";

/**
 * Selected `validateModel` material branches: texture bindings,
 * scalar ranges, alpha and transmission coverage, colours, lobes, overlays,
 * procedural surfaces and wear.
 *
 * Fixture: the standard one-part generated model, its material mat-1 changed
 * one field at a time; a one-triangle mesh with UVs for the lobes.
 *
 * Scenarios:
 *
 * 1. Anisotropy, sheen, specular and thickness lobes on the UV mesh are admitted.
 * 2. Texture coordinate set 1; detail normal scale -1; metallic, roughness,
 *    opacity, occlusion, transmission and clearcoat 2; ior 0.5; thickness -1;
 *    subsurface radius r -1; alpha cutoff 2 under mask: range findings.
 * 3. Alpha cutoff 0.5 without mask, an opaque material of opacity 0.5 and a
 *    transmissive blended material: type findings.
 * 4. Base colour r 2 and emissive g 2 (range), and a hex that does not encode the
 *    channels.
 * 5. Anisotropy strength 2 (range); the lobes on the UV-less box (type at the
 *    part's geometry); an overlay of strength 2; a procedural seed -1 (range);
 *    wear with neither layer (type).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers selected texture, scalar, alpha, color, lobe, overlay, procedural and wear admission branches.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateModel on a part carrying one varied material and a UV-bearing mesh control for the material lobes.
 * @evidence contracts/development/testing.md#independent-expectations The authored bounded values and incompatible alpha combinations define the expected kinds. The UV-bearing mesh supplies a coordinate domain that the box lacks. Empty wear and contradictory swatches each have their own path.
 */
export function test_engine_validation_validate_model_material(): void {
  const base: IAutoMovieModel = createModel();
  const misses: string[] = [];
  const material = (
    patch: Partial<IAutoMovieMaterial>,
    parts: IAutoMovieModelPart[] = base.parts,
  ): IAutoMovieModel => ({
    ...base,
    parts,
    materials: [{ ...base.materials[0]!, ...patch }],
  });
  const refused = (
    label: string,
    model: IAutoMovieModel,
    kinds: AutoMovieViolationKind[],
    path: string,
  ): void => {
    const result: IAutoMovieValidation =
      AutoMovieEngineValidation.validateModel({ model });
    if (
      !kinds.some((kind: AutoMovieViolationKind): boolean =>
        hasViolation(result, kind, path),
      )
    )
      misses.push(
        `${label} at ${path}: ${JSON.stringify(result.success ? [] : result.violations.map((v) => [v.kind, v.path]))}`,
      );
  };
  const color = (patch: Partial<IAutoMovieColor>): IAutoMovieColor => ({
    ...base.materials[0]!.baseColor,
    ...patch,
  });
  const lobes: Partial<IAutoMovieMaterial> = {
    anisotropy: { strength: 1, rotationDeg: -720, texture: "flow.png" },
    sheen: { color: { r: 0, g: 1, b: 0.5, a: null, hex: null }, roughness: 0 },
    specularIntensity: 0,
    thicknessTexture: { asset: "depth.png", texCoord: 0, colorSpace: "linear" },
  };
  const sheet: IAutoMovieModelPart[] = [
    {
      ...base.parts[0]!,
      geometry: {
        type: "mesh",
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          normals: null,
          uvs: [0, 0, 1, 0, 0, 1],
          indices: null,
          skin: null,
        },
      },
    },
  ];

  // 1.
  TestValidator.equals(
    "lobes",
    AutoMovieEngineValidation.validateModel({ model: material(lobes, sheet) })
      .success,
    true,
  );

  // 2.
  refused(
    "texture coordinate set",
    material({
      baseColorTexture: { asset: "a.png", texCoord: 1, colorSpace: "srgb" },
    }),
    ["range"],
    ".baseColorTexture.texCoord",
  );
  refused(
    "detail normal scale",
    material({ detailNormalScale: -1 }),
    ["range"],
    ".detailNormalScale",
  );
  for (const field of [
    "metallic",
    "roughness",
    "opacity",
    "occlusionStrength",
    "transmission",
    "clearcoat",
  ] as const)
    refused(
      field,
      material({ [field]: 2 }),
      ["range"],
      `.materials[0].${field}`,
    );
  refused("ior 0.5", material({ ior: 0.5 }), ["range"], ".ior");
  refused("thickness -1", material({ thickness: -1 }), ["range"], ".thickness");
  refused(
    "subsurface",
    material({ subsurfaceRadius: { r: -1, g: 1, b: 1 } }),
    ["range"],
    ".subsurfaceRadius.r",
  );
  refused(
    "alpha cutoff 2",
    material({ alphaMode: "mask", alphaCutoff: 2 }),
    ["range"],
    ".alphaCutoff",
  );

  // 3.
  refused(
    "cutoff without mask",
    material({ alphaCutoff: 0.5 }),
    ["type"],
    ".alphaCutoff",
  );
  refused(
    "opaque opacity",
    material({ alphaMode: "opaque", opacity: 0.5 }),
    ["type"],
    ".materials[0].opacity",
  );
  refused(
    "transmissive blend",
    material({ opacity: 0.5, transmission: 0.5 }),
    ["type"],
    ".transmission",
  );

  // 4.
  refused(
    "base colour r",
    material({ baseColor: color({ r: 2 }) }),
    ["range"],
    ".baseColor.r",
  );
  refused(
    "emissive g",
    material({ emissive: color({ g: 2 }) }),
    ["range"],
    ".emissive.g",
  );
  refused(
    "hex mismatch",
    material({ baseColor: color({ hex: "#000000" }) }),
    ["type", "range"],
    ".baseColor.hex",
  );

  // 5.
  refused(
    "anisotropy strength",
    material(
      {
        ...lobes,
        anisotropy: { strength: 2, rotationDeg: 0, texture: "flow.png" },
      },
      sheet,
    ),
    ["range"],
    ".anisotropy.strength",
  );
  refused(
    "lobes without UVs",
    material(lobes),
    ["type"],
    "$input.parts[0].geometry",
  );
  refused(
    "overlay strength",
    material({
      overlays: [
        { baseColorTexture: "veins.png", blend: "multiply", strength: 2 },
      ],
    }),
    ["range"],
    ".overlays[0].strength",
  );
  refused(
    "procedural seed",
    material({
      procedural: {
        kind: "stone",
        seed: -1,
        scale: 1,
        colors: [color({}), color({})],
        roughness: { atZero: 0.5, atOne: 0.5 },
        relief: 0,
      },
    }),
    ["range"],
    ".procedural.seed",
  );
  refused(
    "wear without layers",
    material({ wear: { seed: 1 } }),
    ["type"],
    ".materials[0].wear",
  );
  TestValidator.equals("every material rule decided", misses, []);
}
