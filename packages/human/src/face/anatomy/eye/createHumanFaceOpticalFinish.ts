import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Neutral source pigment is resampled by normalized iris polar correspondence; current authored palette and source material gain are applied downstream without changing geometry.
 * @evidence contracts/common.md#clear-and-simple-design One compiled source pigment table supplies the finish of the actual optical assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No patient-specific colours or hidden anatomical defaults are introduced; source pigment comes from its licensed texture.
 * @evidence contracts/common.md#meaningful-documentation States pigment correspondence, source limits, rendering approximations and physical ownership.
 * @evidence contracts/modeling.md#part-identity-and-grouping Emits the four optical surfaces under one side-specific identity.
 * @evidence contracts/modeling.md#shared-boundaries Generated physical point IDs preserve the shared limbal aliases across sclera and cornea.
 * @evidence contracts/modeling.md#spatial-conventions Geometry remains head-frame metres; colours are linear RGB and radial progress is dimensionless.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries source painting and authored finishes without inferred tissue measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range The palette owner admits RGB; the optical profile admits geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no independent shape input.
 */
export function createHumanFaceOpticalFinish(basis: IAutoMovieHumanFaceBasis) {
  const sources = new Map(
    (["left", "right"] as const).map((side) => {
      const globe = findHumanFaceIrisGlobe(
        basis,
        side === "left" ? "leftEye" : "rightEye",
      );
      return [side, globe] as const;
    }),
  );
  const prepared = new Map(
    (["left", "right"] as const).map((side) => {
      const globe = sources.get(side);
      return [
        side,
        globe === null || globe === undefined
          ? undefined
          : prepareHumanFaceIrisTextures([globe]).get(globe.material),
      ] as const;
    }),
  );
  const pigments = new Map(
    (["left", "right"] as const).map((side) => {
      const texture = prepared.get(side);
      if (texture === undefined) return [side, undefined] as const;
      const eye = texture.eyes[0];
      const colors = Array.from({ length: 9 * 64 }, (_, index) => {
        const row = Math.floor(index / 64),
          column = index % 64;
        const theta =
          eye.disc.pupil + ((eye.disc.limbus - eye.disc.pupil) * row) / 8;
        const phi = (column * 2 * Math.PI) / 64;
        let nearest = -1,
          error = Infinity;
        for (let at = 0; at < eye.texels.index.length; at++) {
          const distance =
            (eye.texels.theta[at] - theta) ** 2 +
            (2 * Math.sin((eye.texels.phi[at] - phi) / 2) * Math.sin(theta)) **
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
        return [0, 1, 2].map((c) =>
          srgbByteToLinear(texture.rgba[4 * nearest + c]),
        );
      }).flat();
      return [side, colors] as const;
    }),
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
      const source = sources.get(eye.side);
      const texture = prepared.get(eye.side);
      if (source === null || source === undefined || texture === undefined)
        throw new Error(
          "Independent optical finish needs the registered source iris painting for " +
            eye.side +
            ".",
        );
      const sourceMaterial = materials.find((m) => m.id === source.material)!;
      const id = "optics:" + eye.side;
      const make = (
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
      const gain = [
        sourceMaterial.baseColor.r,
        sourceMaterial.baseColor.g,
        sourceMaterial.baseColor.b,
      ];
      const sclera = texture.eyes[0].sclera.map((v, at) => v * gain[at]);
      result.materials.push(
        make("sclera", sclera, sourceMaterial.roughness),
        make("cornea", [1, 1, 1], 0.05),
        make("iris", gain, sourceMaterial.roughness),
        make("apertureBacking", [0, 0, 0], 1),
      );
      const palette =
        document.iris === undefined || document.iris === null
          ? undefined
          : createPortraitIrisMaterials(
              id + ":pigment",
              document.iris[eye.side],
            );
      const profile = resolveHumanFaceOpticalProfile(document.eyes![eye.side]);
      for (const name of [
        "sclera",
        "cornea",
        "iris",
        "apertureBacking",
      ] as const) {
        const generated = eye.geometry.parts[name];
        const mesh = structuredClone(generated.mesh);
        float32MeshBuffers(mesh, humanFaceOpticalPartId(eye.side, name));
        if (name === "iris") {
          mesh.colors = Array.from(
            { length: mesh.positions.length / 3 },
            (_, vertex) => {
              const x = 2 * mesh.uvs![2 * vertex] - 1,
                y = 2 * mesh.uvs![2 * vertex + 1] - 1;
              const progress =
                (Math.hypot(x, y) * profile.iris - profile.aperture) /
                (profile.iris - profile.aperture);
              const row = Math.round(progress * 8);
              const column =
                (Math.round((Math.atan2(y, x) * 64) / (2 * Math.PI)) + 64) % 64;
              if (row < 0 || row > 8 || !Number.isSafeInteger(column))
                throw new Error(
                  "Independent iris finish lost its generated polar correspondence.",
                );
              if (palette === undefined)
                return pigments
                  .get(eye.side)!
                  .slice(3 * (row * 64 + column), 3 * (row * 64 + column + 1));
              const band = palette[Math.min(7, row)].baseColor;
              return [band.r, band.g, band.b];
            },
          ).flat();
        }
        const domain =
          humanPhysicalSourceDomain(document.id, eye.generation) + ":" + id;
        mesh.physicalVertices = {
          sources: generated.physicalPoints.map((point) => ({
            domain,
            id: point,
          })),
          vertices: generated.physicalPoints.map((_, at) => at),
        };
        const partId = humanFaceOpticalPartId(eye.side, name);
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
