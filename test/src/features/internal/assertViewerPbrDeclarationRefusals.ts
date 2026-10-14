import type { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";

/**
 * Run the PBR unit's existing malformed binding/lobe cases in their original order.
 *
 * The named PBR scenario supplies its actual validateModel call, and this helper checks rejection kind and authored path for every malformed binding/sampler/physical combination.
 * Closed texture roles, first-UV support, finite sampler/transform values and the supported alpha/physical ranges define literal refusal paths; hasViolation reads actual diagnostics rather than a repository manifest or source pattern.
 * Preserves blank/non-record bindings, unsupported UV/color/sampler/coordinate choices, nonfinite transforms and physical/alpha contradictions; the caller separately retains valid one-away and legacy twins.
 */
export const assertViewerPbrDeclarationRefusals: (
  validateMaterial: (
    patch: Record<string, unknown>,
  ) => ReturnType<typeof validateModel>,
) => void = (
  validateMaterial: (
    patch: Record<string, unknown>,
  ) => ReturnType<typeof validateModel>,
): void => {
  const materialRefusedAt: (
    patch: Record<string, unknown>,
    kind: "type" | "range",
    path: string,
  ) => boolean = (
    patch: Record<string, unknown>,
    kind: "type" | "range",
    path: string,
  ): boolean => hasViolation(validateMaterial(patch), kind, path);
  TestValidator.equals(
    "PBR declarations reject malformed bindings and contradictory states",
    namedFacts([
      [
        "blankLegacy",
        (): boolean =>
          materialRefusedAt(
            { baseColorTexture: " " },
            "type",
            ".baseColorTexture",
          ),
      ],
      [
        "bindingType",
        (): boolean =>
          materialRefusedAt(
            { baseColorTexture: [] },
            "type",
            ".baseColorTexture",
          ),
      ],
      [
        "asset",
        (): boolean =>
          materialRefusedAt(
            {
              baseColorTexture: { asset: " ", texCoord: 0, colorSpace: "srgb" },
            },
            "type",
            ".baseColorTexture.asset",
          ),
      ],
      [
        "uvSet",
        (): boolean =>
          materialRefusedAt(
            {
              baseColorTexture: {
                asset: "base.png",
                texCoord: 1,
                colorSpace: "srgb",
              },
            },
            "range",
            ".baseColorTexture.texCoord",
          ),
      ],
      [
        "baseColorSpace",
        (): boolean =>
          materialRefusedAt(
            {
              baseColorTexture: {
                asset: "base.png",
                texCoord: 0,
                colorSpace: "linear",
              },
            },
            "type",
            ".baseColorTexture.colorSpace",
          ),
      ],
      [
        "linearColorSpace",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "srgb",
              },
            },
            "type",
            ".normalTexture.colorSpace",
          ),
      ],
      [
        "transformType",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                transform: [],
              },
            },
            "type",
            ".normalTexture.transform",
          ),
      ],
      [
        "offsetType",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                transform: {
                  offset: null,
                  scale: { x: 1, y: 1 },
                  rotationDeg: 0,
                },
              },
            },
            "type",
            ".transform.offset",
          ),
      ],
      [
        "offsetAxis",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                transform: {
                  offset: { x: Infinity, y: 0 },
                  scale: { x: 1, y: 1 },
                  rotationDeg: 0,
                },
              },
            },
            "range",
            ".transform.offset.x",
          ),
      ],
      [
        "scaleZero",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                transform: {
                  offset: { x: 0, y: 0 },
                  scale: { x: 0, y: 1 },
                  rotationDeg: 0,
                },
              },
            },
            "range",
            ".transform.scale.x",
          ),
      ],
      [
        "rotation",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                transform: {
                  offset: { x: 0, y: 0 },
                  scale: { x: 1, y: 1 },
                  rotationDeg: NaN,
                },
              },
            },
            "range",
            ".transform.rotationDeg",
          ),
      ],
      [
        "samplerType",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                sampler: null,
              },
            },
            "type",
            ".normalTexture.sampler",
          ),
      ],
      [
        "wrapS",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                sampler: {
                  wrapS: "edge",
                  wrapT: "repeat",
                  minFilter: "linear",
                  magFilter: "linear",
                },
              },
            },
            "type",
            ".sampler.wrapS",
          ),
      ],
      [
        "wrapT",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                sampler: {
                  wrapS: "repeat",
                  wrapT: "edge",
                  minFilter: "linear",
                  magFilter: "linear",
                },
              },
            },
            "type",
            ".sampler.wrapT",
          ),
      ],
      [
        "minFilter",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                sampler: {
                  wrapS: "repeat",
                  wrapT: "repeat",
                  minFilter: "cubic",
                  magFilter: "linear",
                },
              },
            },
            "type",
            ".sampler.minFilter",
          ),
      ],
      [
        "magFilter",
        (): boolean =>
          materialRefusedAt(
            {
              normalTexture: {
                asset: "normal.png",
                texCoord: 0,
                colorSpace: "linear",
                sampler: {
                  wrapS: "repeat",
                  wrapT: "repeat",
                  minFilter: "linear",
                  magFilter: "cubic",
                },
              },
            },
            "type",
            ".sampler.magFilter",
          ),
      ],
      [
        "coordinateSource",
        (): boolean =>
          materialRefusedAt(
            {
              baseColorTexture: {
                asset: "base.png",
                texCoord: 0,
                colorSpace: "srgb",
                coordinateSource: "metres",
              },
            },
            "type",
            ".baseColorTexture.coordinateSource",
          ),
      ],
      [
        "normalFinite",
        (): boolean =>
          materialRefusedAt({ normalScale: Infinity }, "range", ".normalScale"),
      ],
      [
        "occlusion",
        (): boolean =>
          materialRefusedAt(
            { occlusionStrength: 2 },
            "range",
            ".occlusionStrength",
          ),
      ],
      [
        "transmission",
        (): boolean =>
          materialRefusedAt({ transmission: -1 }, "range", ".transmission"),
      ],
      ["ior", (): boolean => materialRefusedAt({ ior: 0.99 }, "range", ".ior")],
      [
        "thickness",
        (): boolean =>
          materialRefusedAt({ thickness: -1 }, "range", ".thickness"),
      ],
      [
        "clearcoat",
        (): boolean =>
          materialRefusedAt({ clearcoat: 2 }, "range", ".clearcoat"),
      ],
      [
        "doubleSided",
        (): boolean =>
          materialRefusedAt({ doubleSided: "yes" }, "type", ".doubleSided"),
      ],
      [
        "alphaMode",
        (): boolean =>
          materialRefusedAt({ alphaMode: "hash" }, "type", ".alphaMode"),
      ],
      [
        "alphaCutoffRange",
        (): boolean =>
          materialRefusedAt(
            { alphaMode: "mask", alphaCutoff: 2 },
            "range",
            ".alphaCutoff",
          ),
      ],
      [
        "alphaCutoffMode",
        (): boolean =>
          materialRefusedAt(
            { alphaMode: "blend", alphaCutoff: 0.5 },
            "type",
            ".alphaCutoff",
          ),
      ],
      [
        "opaqueOpacity",
        (): boolean =>
          materialRefusedAt(
            { alphaMode: "opaque", opacity: 0.5 },
            "type",
            ".opacity",
          ),
      ],
      [
        "transmissionCoverage",
        (): boolean =>
          materialRefusedAt(
            { alphaMode: "blend", transmission: 0.5 },
            "type",
            ".transmission",
          ),
      ],
    ]),
    {
      blankLegacy: true,
      bindingType: true,
      asset: true,
      uvSet: true,
      baseColorSpace: true,
      linearColorSpace: true,
      transformType: true,
      offsetType: true,
      offsetAxis: true,
      scaleZero: true,
      rotation: true,
      samplerType: true,
      wrapS: true,
      wrapT: true,
      minFilter: true,
      magFilter: true,
      coordinateSource: true,
      normalFinite: true,
      occlusion: true,
      transmission: true,
      ior: true,
      thickness: true,
      clearcoat: true,
      doubleSided: true,
      alphaMode: true,
      alphaCutoffRange: true,
      alphaCutoffMode: true,
      opaqueOpacity: true,
      transmissionCoverage: true,
    },
  );
};
