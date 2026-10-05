import type { IHumanSourceBoundPart } from "./structures/IHumanSourceBoundPart.ts";
import type { IHumanSourceGenerationPart } from "./structures/IHumanSourceGenerationPart.ts";
import type { IHumanSourceTriangleHit } from "./structures/IHumanSourceTriangleHit.ts";

/**
 * Bind one face part to the skin. A part with published articulation
 * attachments is rigid: a globe follows its own eye cube, the centre the face
 * articulation rotates it about, and any other rigid group (a dentition arch,
 * the tongue) is one frame named after the part and its attachment owner. A
 * part without attachments is a deforming card and follows its nearest head
 * skin point vertex by vertex.
 */
export function bindHumanSourcePart(
  part: IHumanSourceGenerationPart,
  nearest: (point: readonly number[]) => IHumanSourceTriangleHit,
  landmarkIds: readonly string[],
): IHumanSourceBoundPart {
  const published = part.surface;
  const count = published.positions.length / 3;
  const attachments = new Map<number, string>();
  for (const attachment of published.attachments ?? [])
    for (let i = 0; i < attachment.rows.length; i += 2) attachments.set(attachment.rows[i], attachment.owner);
  const frameOf = (v: number): string => {
    const owner = attachments.get(v);
    if (owner === "leftEye") return "joint-l-eye";
    if (owner === "rightEye") return "joint-r-eye";
    return `${part.id}:${owner ?? "head"}`;
  };
  const rigid = published.attachments !== undefined && published.attachments.length > 0;
  const triangles: number[] = [];
  const weights: number[] = [];
  for (let v = 0; v < count; v++) {
    const hit = nearest([published.positions[3 * v], published.positions[3 * v + 1], published.positions[3 * v + 2]]);
    triangles.push(hit.triangle);
    weights.push(...hit.weights);
  }
  const frames = rigid ? Array.from({ length: count }, (_, v) => frameOf(v)) : [];
  const members = new Map<string, number[]>();
  frames.forEach((frame, v) => {
    const list = members.get(frame);
    if (list === undefined) members.set(frame, [v]);
    else list.push(v);
  });
  const frameSources: Record<string, string> = {};
  for (const frame of members.keys())
    frameSources[frame] = landmarkIds.includes(frame) ? `body landmark ${frame}` : "mean row of the skin points nearest to this frame's vertices";
  return {
    binding: {
      kind: rigid ? "rigid" : "surface",
      triangles: rigid ? [] : triangles,
      weights: rigid ? [] : weights,
      frames,
      frameSources,
      reason: rigid
        ? "rigid body with a published articulation attachment; carried by its joint cube without stretching"
        : "deforming card lying on the skin; follows its nearest skin point",
    },
    rigid,
    count,
    triangles,
    weights,
    members,
  };
}
