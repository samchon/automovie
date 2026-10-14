import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IHumanConstructionCheck } from "../../../common/basis/IHumanConstructionCheck";
import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { HUMAN_SKIN_FINISH } from "../../../common/skin/HUMAN_SKIN_FINISH";
import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { createHumanFaceClearanceCheck } from "../../basis/createHumanFaceClearanceCheck";
import { readHumanFaceFibrePigment } from "../../basis/readHumanFaceFibrePigment";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBrowPopulation } from "../../structures/IAutoMovieHumanFaceBrowPopulation";
import type { IAutoMovieHumanFacePeriocularBrowBand } from "../../structures/IAutoMovieHumanFacePeriocularBrowBand";
import type { IHumanFaceSkinChart } from "../skin/IHumanFaceSkinChart";
import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
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
 * band, rather than old card vertices. A published positive material disk
 * retains every band's native identity independently of skin performance.
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
 *
 * @evidence contracts/common.md#principled-implementation Each side builds shafts through the registered same-generation band and current skin chart, then keeps original clearance checks on the emitted population.
 * @evidence contracts/common.md#clear-and-simple-design Chart seating, shaft construction, tinting, clearance reading and Float32 publication remain separate owners linked by actual band identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing generation/material/tolerance or unexpected non-mesh shafts refuse; replaced vertices follow exact source sets rather than names.
 * @evidence contracts/common.md#meaningful-documentation The description distinguishes rest/performed skin, named native band authority, source pigment/density and the three clearance relations.
 * @evidence contracts/performance.md#efficient-algorithms At most two sides build skin/chart acceleration and their requested shafts; dominant work includes native guide registration/walks, shaft sampling, tint seats and output-precision mesh checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Each side reuses one current host/chart across its fibres and retains one check closure for later original clearance reads; immutable source changes require a new assembly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned parts/materials, tint arrays, replacement sets and checks are assembly-owned and scale with represented geometry; retained checks capture their actual skin/shaft population for that assembly lifetime.
 */
export function buildHumanFaceBrowAssembly(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  document: IAutoMovieHumanFaceBasisDocument,
  materials: readonly IAutoMovieMaterial[],
  state: "rest" | "performed",
  reference: ReadonlyMap<string, readonly number[]>,
): IHumanFaceBrowAssembly {
  const replacements: Map<string, Set<number>> = new Map<string, Set<number>>();
  const checks: IHumanConstructionCheck[] = [];
  const tints: Map<string, number[]> = new Map<string, number[]>();
  const result: IHumanFaceBrowAssembly = {
    parts: [],
    materials: [],
    replacements,
    checks,
    tints,
  };
  for (const side of ["left", "right"] as const) {
    const input: IAutoMovieHumanFaceBrowPopulation | undefined =
      document.brows?.[side];
    if (input === undefined) continue;
    const band: IAutoMovieHumanFacePeriocularBrowBand | undefined =
      basis.periocular?.[side].browBand;
    if (band === undefined)
      throw new Error("Brow implantation band unavailable: " + side);
    const surface: IAutoMovieHumanFaceBasisSurface | undefined =
      basis.surfaces.find(
        (surface: IAutoMovieHumanFaceBasisSurface): boolean =>
          surface.id === band.surface,
      );
    const points: readonly number[] | undefined = positions.get(band.surface);
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
    const source: IAutoMovieMaterial | undefined = materials.find(
      (material: IAutoMovieMaterial): boolean => material.id === band.material,
    );
    if (source === undefined)
      throw new Error(
        "Brow population needs its registered source finish: " + side,
      );
    const owned: Set<number> =
      replacements.get(band.replaceSurface) ?? new Set<number>();
    band.replaceVertices.forEach(
      (vertex: number): Set<number> => owned.add(vertex),
    );
    replacements.set(band.replaceSurface, owned);
    const host: IHumanFaceSkinHost = createHumanFaceSkinHost(
      surface.indices,
      points,
    );
    const chart: IHumanFaceSkinChart = createHumanFaceSkinChart({
      surface,
      referencePositions: reference.get(surface.id) ?? [],
      domain: side === "left" ? "browLeft" : "browRight",
      host,
      supportVertices: [...band.upper, ...band.lower],
    });
    const parts: IAutoMovieModelPart[] = buildHumanFaceBrowShafts({
      chart,
      referencePositions: reference.get(surface.id) ?? [],
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
    const tolerance: number | undefined = basis.contact?.toleranceMetres;
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
        (): IAutoMovieHumanConstructionClearanceReading[] =>
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
    const pigment: number[] =
      document.materials?.[band.material]?.pigment ??
      readHumanFaceFibrePigment(source);
    const id: string = "brows:" + side;
    const opacity: number =
      source.opacity *
      Math.min(1, document.materials?.[band.material]?.density ?? 1);
    const skinFinish: IAutoMovieMaterial | undefined = materials.find(
      (material: IAutoMovieMaterial): boolean =>
        material.id === HUMAN_SKIN_FINISH.material,
    );
    if (skinFinish !== undefined) {
      let gains: number[] | undefined = tints.get(band.surface);
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
