import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";
import type { IHumanSourceRegionFill } from "./structures/IHumanSourceRegionFill.ts";

/**
 * Refuse, by name, a left region fill whose base vertices are not exactly the
 * mirror twins (hm08.mirror) of the right region fill's.
 */
export function assertHumanSourceMirroredFill(name: string, mirror: IHumanSourceMirror, right: IHumanSourceRegionFill, left: IHumanSourceRegionFill): void {
  const twins = right.vertices.map((v) => mirror.twin[v]).sort((a, b) => a - b);
  if (twins.length !== left.vertices.length || twins.some((v, i) => v !== left.vertices[i]))
    throw new Error(`Skin region ${name}: the left fill is not the mirror of the right fill.`);
}
