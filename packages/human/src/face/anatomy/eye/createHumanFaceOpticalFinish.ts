import type {
  IAutoMovieColor,
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModel,
} from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import { srgbByteToLinear } from "../../../common/colour/srgbByteToLinear";
import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../structures/IAutoMovieHumanFaceBasisDocument";
import type { AutoMovieHumanFaceOpticalSurface } from "./AutoMovieHumanFaceOpticalSurface";
import { createPortraitIrisMaterials } from "./createPortraitIrisMaterials";
import { findHumanFaceIrisGlobe } from "./findHumanFaceIrisGlobe";
import { humanFaceOpticalPartId } from "./humanFaceOpticalPartId";
import { prepareHumanFaceIrisTextures } from "./prepareHumanFaceIrisTextures";
import { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisPaintedEye } from "./structures/IHumanFaceIrisPaintedEye";
import type { IHumanFaceIrisPreparedTexture } from "./structures/IHumanFaceIrisPreparedTexture";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Carry the source eye's pigment into its independent numerical surfaces.
 *
 * Source texels are sampled in the existing iris locator's polar chart and
 * mapped to the generated iris annulus by normalized radial progress. This
 * preserves the licensed source painting, rather than treating a colour as
 * anatomy. The fit and texture-boundary conventions remain those of the
 * existing iris locator. A requested pigment uses its existing eight-band
 * owner instead. Sclera uses that source texture's surrounding colour.
 *
 * The transparent corneal finish is a rendering convention: full transmission
 * with authored roughness 0.05 and the renderer's default refractive index,
 * without an asserted physiological refractive index. The black reversed
 * scleral backing hides the empty rendered scene; it is not retinal anatomy.
 * Each generated sample is bound to the document, source generation and side,
 * so cornea/sclera shading aliases retain their common limbal point identity.
 *
 * @evidence contracts/common.md#principled-implementation The licensed source iris polar chart supplies neutral pigment and surrounding sclera colour to the actual generated optical annulus.
 * @evidence contracts/common.md#clear-and-simple-design Source texture preparation is compiled once while each document/assembly owns fresh metric part/material copies and bound physical source domains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nearest chart texels and eight pigment bands are authored appearance conventions; transparent cornea/backing are not physiological anatomy claims.
 * @evidence contracts/common.md#meaningful-documentation The prose states pigment/source ownership, metre mesh publication, document-generation-side identities and renderer limitations.
 * @evidence contracts/performance.md#efficient-algorithms Preparation finds the nearest source texel for each of 576 palette samples per side; each call copies/publishes all generated coordinates and colours.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared textures and neutral 9-by-64 pigments are shared across documents; requested document pigments and generated part identity are recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder-held closure retains neutral source/prepared/pigment records until release; returned parts/materials own their copies and no handle or task is retained.
 */
export function createHumanFaceOpticalFinish(
  basis: IAutoMovieHumanFaceBasis,
): (
  document: IAutoMovieHumanFaceBasisDocument,
  optics: readonly IHumanFaceOpticalAssembly[],
  materials: readonly IAutoMovieMaterial[],
) => Pick<IAutoMovieModel, "parts" | "materials"> {
  const sources: Map<"left" | "right", IHumanFaceIrisGlobe | null> = new Map(
    (["left", "right"] as const).map(
      (
        side: "left" | "right",
      ): readonly ["left" | "right", IHumanFaceIrisGlobe | null] => {
        const globe: IHumanFaceIrisGlobe | null = findHumanFaceIrisGlobe(
          basis,
          side === "left" ? "leftEye" : "rightEye",
        );
        return [side, globe] as const;
      },
    ),
  );
  const prepared: Map<
    "left" | "right",
    IHumanFaceIrisPreparedTexture | undefined
  > = new Map(
    (["left", "right"] as const).map(
      (
        side: "left" | "right",
      ): readonly [
        "left" | "right",
        IHumanFaceIrisPreparedTexture | undefined,
      ] => {
        const globe: IHumanFaceIrisGlobe | null | undefined = sources.get(side);
        return [
          side,
          globe === null || globe === undefined
            ? undefined
            : prepareHumanFaceIrisTextures([globe]).get(globe.material),
        ] as const;
      },
    ),
  );
  const pigments: Map<"left" | "right", number[] | undefined> = new Map(
    (["left", "right"] as const).map(
      (
        side: "left" | "right",
      ):
        | readonly ["left" | "right", undefined]
        | readonly ["left" | "right", number[]] => {
        const texture: IHumanFaceIrisPreparedTexture | undefined =
          prepared.get(side);
        if (texture === undefined) return [side, undefined] as const;
        const eye: IHumanFaceIrisPaintedEye = texture.eyes[0];
        const colors: number[] = Array.from(
          { length: 9 * 64 },
          (_: unknown, index: number): number[] => {
            const row: number = Math.floor(index / 64),
              column: number = index % 64;
            const theta: number =
              eye.disc.pupil + ((eye.disc.limbus - eye.disc.pupil) * row) / 8;
            const phi: number = (column * 2 * Math.PI) / 64;
            let nearest: number = -1,
              error: number = Infinity;
            for (let at: number = 0; at < eye.texels.index.length; at++) {
              const distance: number =
                (eye.texels.theta[at] - theta) ** 2 +
                (2 *
                  Math.sin((eye.texels.phi[at] - phi) / 2) *
                  Math.sin(theta)) **
                  2;
              if (distance < error) {
                error = distance;
                nearest = eye.texels.index[at];
              }
            }
            if (nearest < 0)
              throw new Error(
                "Independent iris needs a readable source pigment chart.",
              );
            return [0, 1, 2].map((c: number): number =>
              srgbByteToLinear(texture.rgba[4 * nearest + c]),
            );
          },
        ).flat();
        return [side, colors] as const;
      },
    ),
  );
  return (
    document: IAutoMovieHumanFaceBasisDocument,
    optics: readonly IHumanFaceOpticalAssembly[],
    materials: readonly IAutoMovieMaterial[],
  ): Pick<IAutoMovieModel, "parts" | "materials"> => {
    const result: Pick<IAutoMovieModel, "parts" | "materials"> = {
      parts: [],
      materials: [],
    };
    for (const eye of optics) {
      const source: IHumanFaceIrisGlobe | null | undefined = sources.get(
        eye.side,
      );
      const texture: IHumanFaceIrisPreparedTexture | undefined = prepared.get(
        eye.side,
      );
      if (source === null || source === undefined || texture === undefined)
        throw new Error(
          "Independent optical finish needs the registered source iris painting for " +
            eye.side +
            ".",
        );
      const sourceMaterial: IAutoMovieMaterial = materials.find(
        (m: IAutoMovieMaterial): boolean => m.id === source.material,
      )!;
      const id: string = "optics:" + eye.side;
      const make: (
        name: AutoMovieHumanFaceOpticalSurface,
        rgb: readonly number[],
        roughness: number,
      ) => IAutoMovieMaterial = (
        name: AutoMovieHumanFaceOpticalSurface,
        rgb: readonly number[],
        roughness: number,
      ): IAutoMovieMaterial => ({
        id: humanFaceOpticalPartId(eye.side, name),
        name: humanFaceOpticalPartId(eye.side, name),
        baseColor: { r: rgb[0], g: rgb[1], b: rgb[2], a: 1, hex: null },
        roughness,
        metallic: 0,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
        doubleSided: name !== "cornea" && name !== "apertureBacking",
        ...(name === "cornea" ? { transmission: 1 } : {}),
      });
      const gain: number[] = [
        sourceMaterial.baseColor.r,
        sourceMaterial.baseColor.g,
        sourceMaterial.baseColor.b,
      ];
      const sclera: number[] = texture.eyes[0].sclera.map(
        (v: number, at: number): number => v * gain[at],
      );
      result.materials.push(
        make("sclera", sclera, sourceMaterial.roughness),
        make("cornea", [1, 1, 1], 0.05),
        make("iris", gain, sourceMaterial.roughness),
        make("apertureBacking", [0, 0, 0], 1),
      );
      const palette: IAutoMovieMaterial[] | undefined =
        document.iris === undefined || document.iris === null
          ? undefined
          : createPortraitIrisMaterials(
              id + ":pigment",
              document.iris[eye.side],
            );
      const profile: {
        radius: number;
        limbus: number;
        curvature: number;
        thickness: number;
        iris: number;
        aperture: number;
        depth: number;
        rim: number;
        apex: number;
        irisZ: number;
        height: (r: number) => number;
        slope: (r: number) => number;
      } = resolveHumanFaceOpticalProfile(document.eyes![eye.side]);
      for (const name of [
        "sclera",
        "cornea",
        "iris",
        "apertureBacking",
      ] as const) {
        const generated: { mesh: IAutoMovieMesh; physicalPoints: number[] } =
          eye.geometry.parts[name];
        const mesh: IAutoMovieMesh = structuredClone(generated.mesh);
        float32MeshBuffers(mesh, humanFaceOpticalPartId(eye.side, name));
        if (name === "iris") {
          mesh.colors = Array.from(
            { length: mesh.positions.length / 3 },
            (_: unknown, vertex: number): number[] => {
              const x: number = 2 * mesh.uvs![2 * vertex] - 1,
                y: number = 2 * mesh.uvs![2 * vertex + 1] - 1;
              const progress: number =
                (Math.hypot(x, y) * profile.iris - profile.aperture) /
                (profile.iris - profile.aperture);
              const row: number = Math.round(progress * 8);
              const column: number =
                (Math.round((Math.atan2(y, x) * 64) / (2 * Math.PI)) + 64) % 64;
              if (row < 0 || row > 8 || !Number.isSafeInteger(column))
                throw new Error(
                  "Independent iris finish lost its generated polar correspondence.",
                );
              if (palette === undefined)
                return pigments
                  .get(eye.side)!
                  .slice(3 * (row * 64 + column), 3 * (row * 64 + column + 1));
              const band: IAutoMovieColor = palette[Math.min(7, row)].baseColor;
              return [band.r, band.g, band.b];
            },
          ).flat();
        }
        const domain: string =
          humanPhysicalSourceDomain(document.id, eye.generation) + ":" + id;
        mesh.physicalVertices = {
          sources: generated.physicalPoints.map(
            (point: number): { domain: string; id: number } => ({
              domain,
              id: point,
            }),
          ),
          vertices: generated.physicalPoints.map(
            (_: number, at: number): number => at,
          ),
        };
        const partId: string = humanFaceOpticalPartId(eye.side, name);
        result.parts.push({
          id: partId,
          name: partId,
          material: partId,
          geometry: { type: "mesh", mesh },
          attachedBone: null,
          transform: null,
        });
      }
    }
    return result;
  };
}
