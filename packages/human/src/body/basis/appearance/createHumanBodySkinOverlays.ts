import type {
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import { evaluateHumanBodyShape } from "../evaluateHumanBodyShape";

/**
 * Bind the body skin's nail plates and optional superficial vein overlays.
 *
 * A nail plate replaces covered skin at full strength, independently of the skin's optional micro-normal texture. Its pigment adjustment uses the group-level cheek-to-palm fit in `HUMAN_BODY_SKIN_SITES` (Lu et al. 2025), a proxy for the nail bed rather than an individual nail measurement. Veins tint skin only when the document requests them. Their declared inverse-metre attenuation reduces visibility by exp(-attenuation * t), where t is outward tissue thickness in metres between this body's rest skin and its lean self along the rest normal. The basis supplies that attenuation; this function does not infer vessel depth from imaging. A vein request without a declared layer refuses instead of succeeding without any visible effect.
 *
 * The body builder provides rest and lean shapes lazily for the same document revision. The basis and document are read, while the per-document material copy receives overlays in declared order. Micro-relief is a separate stage.
 *
 * @evidence contracts/common.md#principled-implementation Nail tint uses the declared cheek-to-palm proxy; requested veins use rest-minus-lean thickness projected on actual rest normals and the basis attenuation in inverse metres.
 * @evidence contracts/common.md#clear-and-simple-design One ordered overlay pass binds source-UV colour and optional normal images to the copied skin material, keeping nail replacement and vein multiplication separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid vein strength or a request without a declared vein layer refuses; nail proxies and average projected thickness do not establish individual nail colour or imaged vessel depth.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies proxy provenance, metre attenuation, same-revision lazy shapes, material-only mutation and the separate micro-relief stage.
 * @evidence contracts/performance.md#efficient-algorithms Overlay selection is linear in declared layers; each vein layer walks its vertices, while rest normals require one coordinate/face pass per touched surface rather than per layer.
 * @evidence contracts/performance.md#reuse-equivalent-work Lazy rest and lean shapes are supplied by the builder, and a local surface-index map shares rest normals among this call's vein layers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The material retains only emitted overlay records and asset references; the normal map and layer traversal arrays expire after return, with no persistent cache or external work.
 */
export function createHumanBodySkinOverlays(input: {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
  materialMap: Map<string, IAutoMovieMaterial>;
  restAll: () => ReturnType<typeof evaluateHumanBodyShape>;
  leanOf: (index: number) => number[];
}): void {
  const { basis, document, materialMap, restAll, leanOf }: typeof input = input;
  const skin: string = HUMAN_BODY_SKIN_SITES.material;
  if (
    document.skinVeins !== undefined &&
    !(document.skinVeins.strength >= 0 && document.skinVeins.strength <= 1)
  )
    throw new Error("Body skin veins need a strength in [0,1].");
  if (
    document.skinVeins !== undefined &&
    !basis.surfaces.some(
      (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean =>
        (surface.overlays ?? []).some(
          (
            overlay: NonNullable<
              IAutoMovieHumanBodyBasis["surfaces"][number]["overlays"]
            >[number],
          ): boolean => overlay.kind === "veins" && overlay.material === skin,
        ),
    )
  )
    throw new Error("Body skin veins need declared veins on the basis.");
  const once: (
    asset: string,
    colorSpace: "srgb" | "linear",
  ) => IAutoMovieTextureReference = (
    asset: string,
    colorSpace: "srgb" | "linear",
  ): IAutoMovieTextureReference => ({
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
  const restNormals: Map<number, number[]> = new Map<number, number[]>();
  const veinsShow: (
    index: number,
    overlay: { vertices: number[]; attenuation: number },
    strength: number,
  ) => number = (
    index: number,
    overlay: { vertices: number[]; attenuation: number },
    strength: number,
  ): number => {
    const surface: IAutoMovieHumanBodyBasis["surfaces"][number] =
      basis.surfaces[index];
    const rest: number[] = restAll().surfaces[index];
    const lean: number[] = leanOf(index);
    let normals: number[] | undefined = restNormals.get(index);
    if (normals === undefined) {
      normals = areaWeightedNormals(rest, surface.indices);
      restNormals.set(index, normals);
    }
    let tissue: number = 0;
    for (const v of overlay.vertices) {
      let along: number = 0;
      for (let k: number = 0; k < 3; k++)
        along += (rest[v * 3 + k] - lean[v * 3 + k]) * normals[v * 3 + k];
      tissue += Math.max(0, along);
    }
    return (
      strength *
      Math.exp((-overlay.attenuation * tissue) / overlay.vertices.length)
    );
  };
  const overlays: IAutoMovieMaterialOverlay[] = basis.surfaces.flatMap(
    (
      surface: IAutoMovieHumanBodyBasis["surfaces"][number],
      index: number,
    ): IAutoMovieMaterialOverlay[] =>
      (surface.overlays ?? [])
        .filter(
          (
            overlay: NonNullable<
              IAutoMovieHumanBodyBasis["surfaces"][number]["overlays"]
            >[number],
          ): boolean => overlay.material === skin,
        )
        .flatMap(
          (
            overlay: NonNullable<
              IAutoMovieHumanBodyBasis["surfaces"][number]["overlays"]
            >[number],
          ): IAutoMovieMaterialOverlay[] => {
            const normalTexture: IAutoMovieTextureReference | null =
              overlay.normal === undefined
                ? null
                : once(overlay.normal, "linear");
            if (overlay.kind === "nails") {
              const cheek:
                | NonNullable<
                    IAutoMovieHumanBodyBasisDocument["skinColour"]
                  >["cheek"]
                | undefined = document.skinColour?.cheek;
              const palm: (rgb: {
                r: number;
                g: number;
                b: number;
              }) => number[] = (rgb: {
                r: number;
                g: number;
                b: number;
              }): number[] =>
                HUMAN_BODY_SKIN_SITES.sites.palmar.map(
                  ([a, b]: [number, number], k: number): number =>
                    Math.exp(a) * [rgb.r, rgb.g, rgb.b][k] ** b,
                );
              const factor: { r: number; g: number; b: number } | undefined =
                cheek === undefined || overlay.cheek === undefined
                  ? undefined
                  : ((
                      own: number[],
                      drawn: number[],
                    ): { r: number; g: number; b: number } => ({
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
            const veins: IAutoMovieHumanBodyBasisDocument["skinVeins"] =
              document.skinVeins;
            if (veins === undefined) return [];
            return [
              {
                baseColorTexture: once(overlay.color, "srgb"),
                blend: "multiply",
                normalTexture,
                strength: veinsShow(index, overlay, veins.strength),
              },
            ];
          },
        ),
  );
  if (overlays.length > 0) materialMap.get(skin)!.overlays = overlays;
}
