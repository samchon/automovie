import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import { isHumanFaceOralToothId } from "./isHumanFaceOralToothId";

/**
 * Read all registered permanent crowns and their manifold cervical cycles.
 * Incidence supplies the boundary, without a height threshold or clinical
 * reinterpretation of the source's coarse root. Original source indices are
 * preserved for dental contact, reference measurement and common gingiva.
 * @author Samchon
 */
export function readHumanFaceOralCrowns(
  basis: IAutoMovieHumanFaceBasis,
): IHumanFaceOralCrown[] {
  const surface = basis.surfaces.find((one) => one.id === "Human.teeth_base");
  if (surface === undefined)
    throw new Error("Oral assembly needs its registered dental surface.");
  const result = Object.entries(basis.skinRegions ?? {})
    .filter(
      ([id]) => id.startsWith("tooth-") && isHumanFaceOralToothId(id.slice(6)),
    )
    .map(([id, region]) => {
      const tooth = id.slice(6);
      if (!isHumanFaceOralToothId(tooth))
        throw new Error(
          "Source crown has an unsupported permanent tooth identifier.",
        );
      if (basis.surfaces[region.surface] !== surface)
        throw new Error(
          "Oral crown registration has a different dental owner: " + id,
        );
      const vertices = [...region.vertices];
      const allowed = new Set(vertices);
      const indices: number[] = [];
      const edges = new Map<string, number>();
      for (let at = 0; at < surface.indices.length; at += 3) {
        const triangle = surface.indices.slice(at, at + 3);
        if (!triangle.every((v) => allowed.has(v))) continue;
        indices.push(...triangle);
        for (let k = 0; k < 3; k++) {
          const a = triangle[k],
            b = triangle[(k + 1) % 3];
          const key = Math.min(a, b) + ":" + Math.max(a, b);
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
      }
      const neighbors = new Map<number, number[]>();
      for (const [key, count] of edges) {
        if (count > 2)
          throw new Error("Oral crown has a nonmanifold edge: " + id);
        if (count !== 1) continue;
        const [a, b] = key.split(":").map(Number);
        neighbors.set(a, [...(neighbors.get(a) ?? []), b]);
        neighbors.set(b, [...(neighbors.get(b) ?? []), a]);
      }
      if (
        neighbors.size < 3 ||
        [...neighbors.values()].some((row) => row.length !== 2)
      )
        throw new Error(
          "Oral crown needs one degree-two cervical cycle: " + id,
        );
      const cervical: number[] = [];
      let current = Math.min(...neighbors.keys()),
        previous = -1;
      while (!cervical.includes(current)) {
        cervical.push(current);
        const next = neighbors.get(current)!.find((v) => v !== previous)!;
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
    });
  if (result.length !== 32)
    throw new Error(
      "Oral assembly needs all 32 registered permanent source crowns.",
    );
  return result;
}
