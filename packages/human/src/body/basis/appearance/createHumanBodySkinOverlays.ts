import type { IAutoMovieMaterial, IAutoMovieMaterialOverlay } from "@automovie/interface";

import { portraitNormals } from "../../../common/mesh/portraitNormals";
import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import { evaluateHumanBodyShape } from "../evaluateHumanBodyShape";

/**
 * Bind the body skin's nail plates and optional superficial vein overlays.
 *
 * A nail plate replaces covered skin at full strength, independently of the
 * skin's optional micro-normal texture. Its pigment adjustment uses the
 * group-level cheek-to-palm fit in `HUMAN_BODY_SKIN_SITES` (Lu et al. 2025),
 * a proxy for the nail bed rather than an individual nail measurement.
 * Veins tint skin only when the document requests them. Their declared
 * inverse-metre attenuation reduces visibility by exp(-attenuation * t),
 * where t is outward tissue thickness in metres between this body's rest
 * skin and its lean self along the rest normal. The basis supplies that
 * attenuation; this function does not infer vessel depth from imaging.
 * A vein request without a declared layer refuses instead of succeeding
 * without any visible effect.
 *
 * The body builder provides rest and lean shapes lazily for the same document
 * revision. The basis and document are read, while the per-document material
 * copy receives overlays in declared order. Micro-relief is a separate stage.
 */
export function createHumanBodySkinOverlays(input: {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
  materialMap: Map<string, IAutoMovieMaterial>;
  restAll: () => ReturnType<typeof evaluateHumanBodyShape>;
  leanOf: (index: number) => number[];
}): void {
  const { basis, document, materialMap, restAll, leanOf } = input;
  const skin = HUMAN_BODY_SKIN_SITES.material;
  if (
    document.skinVeins !== undefined &&
    !(document.skinVeins.strength >= 0 && document.skinVeins.strength <= 1)
  )
    throw new Error("Body skin veins need a strength in [0,1].");
  if (
    document.skinVeins !== undefined &&
    !basis.surfaces.some((surface) =>
      (surface.overlays ?? []).some(
        (overlay) => overlay.kind === "veins" && overlay.material === skin,
      ),
    )
  )
    throw new Error("Body skin veins need declared veins on the basis.");
  const once = (asset: string, colorSpace: "srgb" | "linear") => ({
    asset,
    texCoord: 0,
    coordinateSource: "source-uv" as const,
    colorSpace,
    sampler: {
      wrapS: "clamp" as const,
      wrapT: "clamp" as const,
      minFilter: "linearMipmapLinear" as const,
      magFilter: "linear" as const,
    },
  });
  const restNormals = new Map<number, number[]>();
  const veinsShow = (
    index: number,
    overlay: { vertices: number[]; attenuation: number },
    strength: number,
  ): number => {
    const surface = basis.surfaces[index];
    const rest = restAll().surfaces[index];
    const lean = leanOf(index);
    let normals = restNormals.get(index);
    if (normals === undefined) {
      normals = portraitNormals(rest, surface.indices);
      restNormals.set(index, normals);
    }
    let tissue = 0;
    for (const v of overlay.vertices) {
      let along = 0;
      for (let k = 0; k < 3; k++)
        along += (rest[v * 3 + k] - lean[v * 3 + k]) * normals[v * 3 + k];
      tissue += Math.max(0, along);
    }
    return (
      strength *
      Math.exp((-overlay.attenuation * tissue) / overlay.vertices.length)
    );
  };
  const overlays = basis.surfaces.flatMap((surface, index) =>
    (surface.overlays ?? [])
      .filter((overlay) => overlay.material === skin)
      .flatMap((overlay): IAutoMovieMaterialOverlay[] => {
        const normalTexture =
          overlay.normal === undefined
            ? null
            : once(overlay.normal, "linear");
        if (overlay.kind === "nails") {
          const cheek = document.skinColour?.cheek;
          const palm = (rgb: { r: number; g: number; b: number }) =>
            HUMAN_BODY_SKIN_SITES.sites.palmar.map(
              ([a, b], k) => Math.exp(a) * [rgb.r, rgb.g, rgb.b][k] ** b,
            );
          const factor =
            cheek === undefined || overlay.cheek === undefined
              ? undefined
              : ((own, drawn) => ({
                  r: own[0] / drawn[0],
                  g: own[1] / drawn[1],
                  b: own[2] / drawn[2],
                }))(palm(cheek), palm(overlay.cheek));
          return [
            {
              baseColorTexture: once(overlay.color, "srgb"),
              blend: "replace",
              ...(factor === undefined ? {} : { colorFactor: factor }),
              roughness: overlay.roughness,
              normalTexture,
              strength: 1,
            },
          ];
        }
        const veins = document.skinVeins;
        if (veins === undefined) return [];
        return [
          {
            baseColorTexture: once(overlay.color, "srgb"),
            blend: "multiply",
            normalTexture,
            strength: veinsShow(index, overlay, veins.strength),
          },
        ];
      }),
  );
  if (overlays.length > 0) materialMap.get(skin)!.overlays = overlays;
}
