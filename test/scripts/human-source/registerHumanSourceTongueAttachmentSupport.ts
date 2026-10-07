import crypto from "node:crypto";

import { serializeHumanFaceOralNativeSource } from "@automovie/human/face/anatomy/oral/serializeHumanFaceOralNativeSource";
import type { IAutoMovieHumanFaceBasisSurface } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceOralTongueAttachmentSupport } from "@automovie/human/face/structures/IAutoMovieHumanFaceOralTongueAttachmentSupport";

import type { IHumanSourceTongueAttachmentLoop } from "./structures/IHumanSourceTongueAttachmentLoop.ts";

/**
 * Witness a prepared native ventral loop on the final same-generation tongue.
 * Exact native seats, closed boundary edges and patch membership are checked
 * before registration. The fingerprint consumes final neutral, endpoint and
 * rigid support data after binding, without making a post-binding correction.
 */
export function registerHumanSourceTongueAttachmentSupport(generation: string, tongue: IAutoMovieHumanFaceBasisSurface, loop: IHumanSourceTongueAttachmentLoop): IAutoMovieHumanFaceOralTongueAttachmentSupport {
  if (generation.trim() === "" || loop.surface !== tongue.id || loop.frame !== "head-metres-y-up-z-anterior" ||
      loop.nativeVertices.length < 3 || new Set(loop.nativeVertices).size !== loop.nativeVertices.length || loop.points.length !== loop.nativeVertices.length)
    throw new Error("Tongue attachment registration needs one complete native ventral loop.");
  const attached = new Set(loop.attachedTriangles), vertices = new Set(loop.attachedSourceVertices);
  const actualVertices = new Set<number>();
  const boundary = new Map<string, number>();
  for (const triangle of attached) {
    if (!Number.isSafeInteger(triangle) || triangle < 0 || 3 * triangle + 2 >= tongue.indices.length) throw new Error("Tongue attachment addresses a missing native triangle.");
    for (let corner = 0; corner < 3; corner++) {
      const a = tongue.indices[3 * triangle + corner], b = tongue.indices[3 * triangle + (corner + 1) % 3];
      actualVertices.add(a); actualVertices.add(b);
      if (!vertices.has(a) || !vertices.has(b)) throw new Error("Tongue attachment patch and native membership disagree.");
      const key = a < b ? `${a}:${b}` : `${b}:${a}`; boundary.set(key, (boundary.get(key) ?? 0) + 1);
    }
  }
  if (actualVertices.size !== vertices.size || [...vertices].some((vertex) => !actualVertices.has(vertex)))
    throw new Error("Tongue attachment membership includes a vertex outside its actual native patch.");
  loop.points.forEach((point, at) => {
    const vertex = loop.nativeVertices[at], next = loop.nativeVertices[(at + 1) % loop.nativeVertices.length];
    const key = vertex < next ? `${vertex}:${next}` : `${next}:${vertex}`;
    if (boundary.get(key) !== 1 || !attached.has(point.triangle) || !tongue.indices.slice(3 * point.triangle, 3 * point.triangle + 3).includes(vertex) || point.weights.length !== 3 ||
        point.weights.some((weight, corner) => weight !== (tongue.indices[3 * point.triangle + corner] === vertex ? 1 : 0)))
      throw new Error("Tongue attachment loop differs from the actual native patch boundary or seat.");
  });
  if ([...boundary.values()].filter((count) => count === 1).length !== loop.nativeVertices.length)
    throw new Error("Tongue attachment has an additional undeclared source boundary.");
  return { generation, surface: tongue.id, nativeSha256: crypto.createHash("sha256").update(serializeHumanFaceOralNativeSource(tongue)).digest("hex"),
    nativeVertices: [...loop.nativeVertices], points: loop.points.map((point) => ({ triangle: point.triangle, weights: [...point.weights] })),
    attachedTriangles: [...loop.attachedTriangles], attachedSourceVertices: [...loop.attachedSourceVertices], frame: loop.frame, qualification: "authoredConvention" };
}
