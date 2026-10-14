import type {
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
  IAutoMovieHumanSkinRegion as ImportedIAutoMovieHumanSkinRegion,
} from "@automovie/human";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import { isHumanFaceOralToothId } from "./isHumanFaceOralToothId";

/**
 * Read all 32 registered permanent source crowns and their native open cervical cycles before document-level absence is applied. Triangle incidence and degree-two undirected adjacency identify each cycle without a height threshold. Original dental ordinals survive, but this coarse source port and derived traversal order do not constitute clinical CEJ or measured tooth-axis acquisition. Invalid ownership, manifold incidence or disconnected ports refuse.
 *
 * @evidence contracts/common.md#principled-implementation Exact permanent source regions select native triangles whose degree-two free cycles identify cervical ports.
 * @evidence contracts/common.md#clear-and-simple-design Original incidence remains authoritative for identity, lining, contact and reference measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The registered source requires all 32 crowns before authored absence is applied; coarse root ports are not clinical CEJ acquisition.
 * @evidence contracts/common.md#meaningful-documentation Original dental ordinals and ISO ids remain distinct from crown-local/render indices; cervical order is derived from undirected adjacency.
 * @evidence contracts/performance.md#efficient-algorithms Each crown scans source triangles; cycle membership uses array includes and can be quadratic in port length.
 * @evidence contracts/performance.md#reuse-equivalent-work One edge-count/adjacency table per crown supplies its connected cycle, without a height-threshold reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned copied crown arrays are owned and local allowed/edge/adjacency maps are released after extraction.
 *
 * @author Samchon
 */
export function readHumanFaceOralCrowns(
  basis: IAutoMovieHumanFaceBasis,
): IHumanFaceOralCrown[] {
  const surface: ImportedIAutoMovieHumanFaceBasisSurface | undefined =
    basis.surfaces.find(
      (one: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
        one.id === "Human.teeth_base",
    );
  if (surface === undefined)
    throw new Error("Oral assembly needs its registered dental surface.");
  const result: {
    id:
      | "11"
      | "12"
      | "13"
      | "18"
      | "14"
      | "16"
      | "15"
      | "17"
      | "21"
      | "22"
      | "23"
      | "28"
      | "24"
      | "26"
      | "25"
      | "27"
      | "31"
      | "32"
      | "33"
      | "38"
      | "34"
      | "36"
      | "35"
      | "37"
      | "41"
      | "42"
      | "43"
      | "48"
      | "44"
      | "46"
      | "45"
      | "47";
    vertices: number[];
    indices: number[];
    cervical: number[];
    mandibular: boolean;
  }[] = Object.entries(basis.skinRegions ?? {})
    .filter(
      ([id]: [string, ImportedIAutoMovieHumanSkinRegion]): boolean =>
        id.startsWith("tooth-") && isHumanFaceOralToothId(id.slice(6)),
    )
    .map(
      ([id, region]: [string, ImportedIAutoMovieHumanSkinRegion]): {
        id:
          | "11"
          | "12"
          | "13"
          | "18"
          | "14"
          | "16"
          | "15"
          | "17"
          | "21"
          | "22"
          | "23"
          | "28"
          | "24"
          | "26"
          | "25"
          | "27"
          | "31"
          | "32"
          | "33"
          | "38"
          | "34"
          | "36"
          | "35"
          | "37"
          | "41"
          | "42"
          | "43"
          | "48"
          | "44"
          | "46"
          | "45"
          | "47";
        vertices: number[];
        indices: number[];
        cervical: number[];
        mandibular: boolean;
      } => {
        const tooth: string = id.slice(6);
        if (!isHumanFaceOralToothId(tooth))
          throw new Error(
            "Source crown has an unsupported permanent tooth identifier.",
          );
        if (basis.surfaces[region.surface] !== surface)
          throw new Error(
            "Oral crown registration has a different dental owner: " + id,
          );
        const vertices: number[] = [...region.vertices];
        const allowed: Set<number> = new Set(vertices);
        const indices: number[] = [];
        const edges: Map<string, number> = new Map<string, number>();
        for (let at: number = 0; at < surface.indices.length; at += 3) {
          const triangle: number[] = surface.indices.slice(at, at + 3);
          if (!triangle.every((v: number): boolean => allowed.has(v))) continue;
          indices.push(...triangle);
          for (let k: number = 0; k < 3; k++) {
            const a: number = triangle[k],
              b: number = triangle[(k + 1) % 3];
            const key: string = Math.min(a, b) + ":" + Math.max(a, b);
            edges.set(key, (edges.get(key) ?? 0) + 1);
          }
        }
        const neighbors: Map<number, number[]> = new Map<number, number[]>();
        for (const [key, count] of edges) {
          if (count > 2)
            throw new Error("Oral crown has a nonmanifold edge: " + id);
          if (count !== 1) continue;
          const [a, b]: number[] = key.split(":").map(Number);
          neighbors.set(a, [...(neighbors.get(a) ?? []), b]);
          neighbors.set(b, [...(neighbors.get(b) ?? []), a]);
        }
        if (
          neighbors.size < 3 ||
          [...neighbors.values()].some(
            (row: number[]): boolean => row.length !== 2,
          )
        )
          throw new Error(
            "Oral crown needs one degree-two cervical cycle: " + id,
          );
        const cervical: number[] = [];
        let current: number = Math.min(...neighbors.keys()),
          previous: number = -1;
        while (!cervical.includes(current)) {
          cervical.push(current);
          const next: number = neighbors
            .get(current)!
            .find((v: number): boolean => v !== previous)!;
          previous = current;
          current = next;
        }
        if (current !== cervical[0] || cervical.length !== neighbors.size)
          throw new Error("Oral crown has disconnected cervical ports: " + id);
        return {
          id: tooth,
          vertices,
          indices,
          cervical,
          mandibular: Number(id[6]) > 2,
        };
      },
    );
  if (result.length !== 32)
    throw new Error(
      "Oral assembly needs all 32 registered permanent source crowns.",
    );
  return result;
}
