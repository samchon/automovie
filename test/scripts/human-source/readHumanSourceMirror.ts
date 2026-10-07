import { readHumanSourceWorkBytes } from "./readHumanSourceWorkBytes.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";

/** Body vertices of the hm08 base mesh; helper geometry follows them. */
const BODY_VERTICES = 13380;

/**
 * Read the pinned MPFB mirror table (`mesh_metadata/hm08.mirror`, CC0 data,
 * one `vertex twin side` line per vertex) for the body vertices. Subdivision
 * keeps each base vertex at its own index as a source sample, so the table
 * addresses the generation's skin directly.
 */
export function readHumanSourceMirror(
  work: string,
  inputs: IHumanSourceGenerationInput[],
): IHumanSourceMirror {
  const text = readHumanSourceWorkBytes(
    inputs,
    work,
    "upstream/mpfb2/src/mpfb/data/mesh_metadata/hm08.mirror",
    "native mirror correspondence",
  ).toString("utf8");
  const twin = new Int32Array(BODY_VERTICES).fill(-1);
  const midline: number[] = [];
  for (const line of text.split("\n")) {
    const [a, b, side] = line.trim().split(/\s+/);
    if (side === undefined) continue;
    const vertex = Number(a);
    if (vertex >= BODY_VERTICES) continue;
    twin[vertex] = Number(b);
    if (side === "m") midline.push(vertex);
  }
  if (twin.some((t) => t < 0))
    throw new Error("The mirror table does not cover every body vertex.");
  return { midline, twin };
}
