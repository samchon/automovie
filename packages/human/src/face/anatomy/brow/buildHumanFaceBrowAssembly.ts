import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import type { IHumanConstructionCheck } from "../../../common/basis/IHumanConstructionCheck";
import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { HUMAN_SKIN_FINISH } from "../../../common/skin/HUMAN_SKIN_FINISH";
import { createHumanFaceClearanceCheck } from "../../basis/createHumanFaceClearanceCheck";
import { readHumanFaceFibrePigment } from "../../basis/readHumanFaceFibrePigment";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../structures/IAutoMovieHumanFaceBasisDocument";
import { createHumanFaceSkinChart } from "../skin/createHumanFaceSkinChart";
import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import type { IHumanFaceBrowAssembly } from "./IHumanFaceBrowAssembly";
import { applyHumanFaceBrowTint } from "./applyHumanFaceBrowTint";
import { buildHumanFaceBrowShafts } from "./buildHumanFaceBrowShafts";
import { readHumanFaceBrowClearance } from "./readHumanFaceBrowClearance";

/**
 * Generate both numerical brow populations on one state of the forehead skin.
 * Each side compiles a skin host on the positions it is given and hands it to
 * the shaft builder, so roots, courses and lifts are read from the skin's own
 * triangles and normals. Named source boundaries supply the implantation
 * band, rather than old card vertices. Its central upper native anchor's
 * first incident facet in source winding defines an authored tangent chart.
 * Actual native walks verify every upper/lower anchor before shaft lifting;
 * a fold or disconnected band refuses rather than projecting to another sheet.
 * The builder calls this once on the
 * shape-only reference (`state` "rest") and once on the performed skin.
 * Each side's check measures the emitted shafts against that same skin and
 * reports roots and tips beside the judged whole-shaft relation.
 * Foreground pigment and legacy density affect finish independently of count.
 * Each side also states, as gains on the skin vertices of its band, the share
 * of the band its shafts cover, which is how the brow reads where a view
 * cannot resolve a shaft; the builder multiplies those gains into the skin.
 * @evidence contracts/common.md#principled-implementation Shafts are seated on the actual skin triangles of the state being built, and the same triangles judge their clearance; source-card foreground painting supplies only appearance.
 * @evidence contracts/common.md#clear-and-simple-design One assembly connects population, source band, host, geometry, measurement and replacement incidence.
 * @evidence contracts/common.md#meaningful-documentation States source implantation, the host, the two states, count and display-only pigment transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No private curve input, guessed forehead indices or biological count derived from a card mesh enters.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each side and original shaft sequence has a stable brows identity; zero requested population replaces cards with no shaft part.
 * @evidence contracts/modeling.md#spatial-conventions Skin and shafts stay in head-frame metres; the shaft builder owns the one conversion of the profile's millimetres.
 * @evidence contracts/modeling.md#emitted-geometry The shaft builder owns the lattice; this assembly admits its Float32 meshes and no card vertex population becomes a shaft count.
 * @evidence contracts/modeling.md#parameter-channels Requested strand count and supplied shaft radius, taper, arch, emergence and complete flow remain independent of source painting.
 * @evidence contracts/modeling.md#shared-boundaries The registered band's vertex identities and the host address the same live skin, while original card replacement follows exact publisher-owned incidence.
 * @evidence contracts/anatomy.md#anatomical-source Source band eligibility and painting are explicitly authored or source-observed qualifications; no clinical follicle protocol is inferred from them.
 * @evidence contracts/anatomy.md#permitted-range Existing profile admission bounds the rendering population, and the skin clearance condition and tolerance are the ones the former assertion applied.
 * @evidence contracts/anatomy.md#parametric-authority Independent counts and numerical shaft/flow dimensions are authored controls; source implantation and clinical density remain separate.
 */
export function buildHumanFaceBrowAssembly(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  document: IAutoMovieHumanFaceBasisDocument,
  materials: readonly IAutoMovieMaterial[],
  state: "rest" | "performed" = "performed",
): IHumanFaceBrowAssembly {
  const replacements = new Map<string, Set<number>>();
  const checks: IHumanConstructionCheck[] = [];
  const tints = new Map<string, number[]>();
  const result: IHumanFaceBrowAssembly = {
    parts: [],
    materials: [],
    replacements,
    checks,
    tints,
  };
  for (const side of ["left", "right"] as const) {
    const input = document.brows?.[side];
    if (input === undefined) continue;
    const band = basis.periocular?.[side].browBand;
    if (band === undefined)
      throw new Error("Brow implantation band unavailable: " + side);
    const surface = basis.surfaces.find(
      (surface) => surface.id === band.surface,
    );
    const points = positions.get(band.surface);
    if (
      surface === undefined ||
      points === undefined ||
      band.generation !== basis.periocular?.generation ||
      band.generation !== surface.sourcePartition?.generation ||
      band.sourceId.trim() === ""
    )
      throw new Error(
        "Brow implantation needs the actual same-generation skin host: " + side,
      );
    const source = materials.find((material) => material.id === band.material);
    if (source === undefined)
      throw new Error(
        "Brow population needs its registered source finish: " + side,
      );
    const owned = replacements.get(band.replaceSurface) ?? new Set<number>();
    band.replaceVertices.forEach((vertex) => owned.add(vertex));
    replacements.set(band.replaceSurface, owned);
    const host = createHumanFaceSkinHost(surface.indices, points);
    const anchor = band.upper[Math.floor(band.upper.length / 2)];
    const seedCorner = surface.indices.indexOf(anchor);
    if (seedCorner < 0)
      throw new Error(
        "Brow source-chart anchor has no native support facet: " + side,
      );
    const chart = createHumanFaceSkinChart({
      positions: points,
      indices: surface.indices,
      host,
      seedTriangle: Math.floor(seedCorner / 3),
      supportVertices: [...band.upper, ...band.lower],
    });
    const parts = buildHumanFaceBrowShafts({
      chart,
      positions: points,
      binding: { side, upper: band.upper, lower: band.lower },
      count: input.strandCount,
      profile: input,
    });
    const shaftMeshes: IAutoMovieMesh[] = [];
    for (const part of parts) {
      if (part.geometry.type !== "mesh")
        throw new Error("Brow generator must emit actual shaft meshes.");
      shaftMeshes.push(part.geometry.mesh);
    }
    const tolerance = basis.contact?.toleranceMetres;
    if (tolerance === undefined)
      throw new Error("Brow population needs the source attachment tolerance.");
    const skin: IAutoMovieMesh = {
      positions: [...points],
      indices: surface.indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    checks.push(
      createHumanFaceClearanceCheck(
        "brow-" + side,
        "Brow shaft penetrates or crosses its host skin",
        () =>
          readHumanFaceBrowClearance({
            side,
            state,
            skin,
            against: band.surface,
            shafts: shaftMeshes,
            rowVertices: input.representation === "ribbon" ? 2 : 9,
            toleranceMetres: tolerance,
          }),
      ),
    );
    if (parts.length === 0) continue;
    const pigment =
      document.materials?.[band.material]?.pigment ??
      readHumanFaceFibrePigment(source);
    const id = "brows:" + side;
    const opacity =
      source.opacity *
      Math.min(1, document.materials?.[band.material]?.density ?? 1);
    const skinFinish = materials.find(
      (material) => material.id === HUMAN_SKIN_FINISH.material,
    );
    if (skinFinish !== undefined) {
      let gains = tints.get(band.surface);
      if (gains === undefined)
        tints.set(
          band.surface,
          (gains = new Array<number>(points.length).fill(1)),
        );
      applyHumanFaceBrowTint({
        host,
        positions: points,
        binding: { side, upper: band.upper, lower: band.lower },
        shafts: shaftMeshes,
        ribbon: input.representation === "ribbon",
        fibre: [
          pigment[0] * source.baseColor.r,
          pigment[1] * source.baseColor.g,
          pigment[2] * source.baseColor.b,
        ],
        skin: [
          skinFinish.baseColor.r,
          skinFinish.baseColor.g,
          skinFinish.baseColor.b,
        ],
        opacity,
        gains,
      });
    }
    result.materials.push({
      id,
      name: id,
      baseColor: {
        r: pigment[0] * source.baseColor.r,
        g: pigment[1] * source.baseColor.g,
        b: pigment[2] * source.baseColor.b,
        a: opacity,
        hex: null,
      },
      roughness: source.roughness,
      metallic: 0,
      opacity,
      emissive: null,
      baseColorTexture: null,
      doubleSided: input.representation === "ribbon",
      alphaMode: opacity < 1 ? "blend" : "opaque",
    });
    for (const part of parts) {
      if (part.geometry.type !== "mesh")
        throw new Error("Brow generator must emit actual shaft meshes.");
      float32MeshBuffers(part.geometry.mesh, "brows:" + part.id);
      part.id = "brows:" + part.id;
      part.name = part.id;
      part.material = id;
      result.parts.push(part);
    }
  }
  return result;
}
