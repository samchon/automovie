import type { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";

/** Existing malformed PBR binding/lobe cases in their original assertion order. */
export const assertViewerPbrDeclarationRefusals = (
  validateMaterial: (patch: Record<string, unknown>) => ReturnType<typeof validateModel>,
): void => {
  const materialRefusedAt = (
    patch: Record<string, unknown>, kind: "type" | "range", path: string,
  ): boolean => hasViolation(validateMaterial(patch), kind, path);
  TestValidator.equals(
    "PBR declarations reject malformed bindings and contradictory states",
    namedFacts([
      [
        "blankLegacy",
        () =>
          materialRefusedAt(
            { baseColorTexture: " " },
            "type",
            ".baseColorTexture",
          ),
      ],
      [
        "bindingType",
        () =>
          materialRefusedAt(
            { baseColorTexture: [] },
            "type",
            ".baseColorTexture",
          ),
      ],
      [
        "asset",
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        "normalFinite",
        () =>
          materialRefusedAt({ normalScale: Infinity }, "range", ".normalScale"),
      ],
      [
        "occlusion",
        () =>
          materialRefusedAt(
            { occlusionStrength: 2 },
            "range",
            ".occlusionStrength",
          ),
      ],
      [
        "transmission",
        () => materialRefusedAt({ transmission: -1 }, "range", ".transmission"),
      ],
      ["ior", () => materialRefusedAt({ ior: 0.99 }, "range", ".ior")],
      [
        "thickness",
        () => materialRefusedAt({ thickness: -1 }, "range", ".thickness"),
      ],
      [
        "clearcoat",
        () => materialRefusedAt({ clearcoat: 2 }, "range", ".clearcoat"),
      ],
      [
        "doubleSided",
        () => materialRefusedAt({ doubleSided: "yes" }, "type", ".doubleSided"),
      ],
      [
        "alphaMode",
        () => materialRefusedAt({ alphaMode: "hash" }, "type", ".alphaMode"),
      ],
      [
        "alphaCutoffRange",
        () =>
          materialRefusedAt(
            { alphaMode: "mask", alphaCutoff: 2 },
            "range",
            ".alphaCutoff",
          ),
      ],
      [
        "alphaCutoffMode",
        () =>
          materialRefusedAt(
            { alphaMode: "blend", alphaCutoff: 0.5 },
            "type",
            ".alphaCutoff",
          ),
      ],
      [
        "opaqueOpacity",
        () =>
          materialRefusedAt(
            { alphaMode: "opaque", opacity: 0.5 },
            "type",
            ".opacity",
          ),
      ],
      [
        "transmissionCoverage",
        () =>
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
