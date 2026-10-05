import type { IHumanSourceReadRegion } from "./structures/IHumanSourceReadRegion.ts";
import type { IHumanSourceRegionFill } from "./structures/IHumanSourceRegionFill.ts";

/**
 * Fill a region bounded by a read loop on the base mesh. Every consecutive
 * pair of the loop, the last back to the first, must be a base-mesh edge, or
 * the loop is not closed and the region is refused. Faces are reached from
 * the seed's faces across shared edges that are not loop edges. The same fill
 * from the outside vertex must reach none of those faces, or the loop does
 * not separate and the region is refused. The loop's vertices belong to the
 * outside, not the region.
 */
export function fillHumanSourceReadRegion(name: string, faces: readonly number[][], read: IHumanSourceReadRegion): IHumanSourceRegionFill {
  const edge = (a: number, b: number): string => (a < b ? `${a},${b}` : `${b},${a}`);
  const facesOfEdge = new Map<string, number[]>();
  faces.forEach((face, f) => {
    for (let i = 0; i < face.length; i++) {
      const k = edge(face[i], face[(i + 1) % face.length]);
      if (!facesOfEdge.has(k)) facesOfEdge.set(k, []);
      facesOfEdge.get(k)!.push(f);
    }
  });
  const loopEdges = new Set(read.loop.map((v, i) => edge(v, read.loop[(i + 1) % read.loop.length])));
  for (const k of loopEdges) if (!facesOfEdge.has(k)) throw new Error(`Skin region ${name}: loop step ${k} is not a base-mesh edge; the loop is not closed.`);
  const fill = (start: number): Set<number> => {
    const reached = new Set<number>();
    const queue = faces.flatMap((face, f) => (face.includes(start) ? [f] : []));
    for (const f of queue) reached.add(f);
    while (queue.length > 0) {
      const f = queue.pop()!;
      const face = faces[f];
      for (let i = 0; i < face.length; i++) {
        const k = edge(face[i], face[(i + 1) % face.length]);
        if (loopEdges.has(k)) continue;
        for (const g of facesOfEdge.get(k)!)
          if (!reached.has(g)) {
            reached.add(g);
            queue.push(g);
          }
      }
    }
    return reached;
  };
  const inside = fill(read.seed);
  const outside = fill(read.outside);
  for (const f of inside) if (outside.has(f)) throw new Error(`Skin region ${name}: the fill from the seed reaches the outside; the loop does not separate.`);
  const loop = new Set(read.loop);
  const vertices = [...new Set([...inside].flatMap((f) => faces[f]))].filter((v) => !loop.has(v)).sort((a, b) => a - b);
  return { faces: inside, vertices, loopEdges };
}
