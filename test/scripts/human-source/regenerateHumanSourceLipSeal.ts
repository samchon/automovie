import { createHumanFaceClosureGain } from "@automovie/human/face/basis/createHumanFaceClosureGain";
import { evaluateHumanFaceRest } from "@automovie/human/face/basis/evaluateHumanFaceRest";
import { measureHumanFaceMarginGaps } from "@automovie/human/face/basis/measureHumanFaceMarginGaps";
import { resolveHumanFaceApertureUp } from "@automovie/human/face/basis/resolveHumanFaceApertureUp";
import { resolveHumanFaceArticulation } from "@automovie/human/face/basis/resolveHumanFaceArticulation";
import { readHumanFaceLipMarginPoints } from "@automovie/human/face/basis/readHumanFaceLipMarginPoints";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import crypto from "node:crypto";

import { buildHumanSourceAuthoredHeadRegions } from "./buildHumanSourceAuthoredHeadRegions.ts";
import { readdressHumanSourceFaceBasis } from "./readdressHumanSourceFaceBasis.ts";
import { registerHumanSourceLipMargin } from "./registerHumanSourceLipMargin.ts";
import type { IHumanSourceAuthoredSkin } from "./structures/IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceCompactedTopology } from "./structures/IHumanSourceCompactedTopology.ts";
import type { IHumanSourceLipClosureRows } from "./structures/IHumanSourceLipClosureRows.ts";
import type { IHumanSourceLipSealReceipt } from "./structures/IHumanSourceLipSealReceipt.ts";

/**
 * Author closed neutral lips on the root through the existing closure rule.
 *
 * The source preparation view readdresses the actual original contact ports
 * onto the current skin and consumes its current-domain closure rows from
 * the normal recipe/native-residual transport owner. Current vermilion chains
 * are registered through the same owner as P1. Only that endpoint is
 * prepared for this named calculation; this intermediate
 * view is not an admitted person or a new public authoring input. The neutral
 * rigid motions come from the normal articulation resolver at zero weights,
 * and the opening direction from its existing owner. The margin gain owner
 * retains its tissue budget and refuses immobile or over-budget margins.
 *
 * Its closure displacement is baked into root and skin together. Margin gaps
 * are measured again on those actual candidate positions before any source
 * mutation; an unsealed or penetrating result beyond the existing contact
 * tolerance refuses. The frozen cut cannot be moved independently. Both views,
 * bound parts, fields, registrations and normal/export observations must then
 * be regenerated on the same source generation. Endpoint deltas retain their
 * source meaning against this new rest, without claiming motion acceptance.
 * Closed neutral lips are an authored product convention, not a measured
 * clinical resting aperture or a personal reconstruction.
 */
export function regenerateHumanSourceLipSeal(
  original: IAutoMovieHumanFaceBasis,
  root: IHumanSourceCompactedTopology,
  skin: IHumanSourceAuthoredSkin,
  closure: IHumanSourceLipClosureRows,
): IHumanSourceLipSealReceipt {
  const contact = original.contact;
  const sourceSkin = original.surfaces.find(
    (surface) => surface.id === "Human",
  );
  if (
    contact === undefined ||
    sourceSkin === undefined ||
    original.articulation === undefined
  )
    throw new Error(
      "Source lip seal needs actual skin, articulation and contact ports.",
    );
  const channel = original.channels.find(
    (entry) => entry.id === contact.closure.channel,
  );
  if (channel === undefined)
    throw new Error("Source lip seal has no registered closure channel.");
  if (closure.endpoint !== channel.positive || closure.rows.length === 0)
    throw new Error(
      "Source lip seal has no matching current-domain closure rows.",
    );
  const transported = closure.rows;
  const geometrySha = crypto
    .createHash("sha256")
    .update(Buffer.from(skin.headPositions.buffer))
    .digest("hex");
  const face = readdressHumanSourceFaceBasis({
    face: original,
    skin,
    generation: geometrySha,
    targets: { [channel.positive]: transported },
    regions: buildHumanSourceAuthoredHeadRegions(original, skin.partition),
  });
  const chain = registerHumanSourceLipMargin(
    face,
    Array.from(skin.headPositions),
    {
      generation: geometrySha,
      originalVertices: skin.partition.cut.originalVertices,
      parentTriangles: Array.from(root.topology.triangles),
      intersections: skin.partition.cut.intersections.map((point) => ({ ...point })),
      samples: Array.from(skin.partition.cut.faceToG1),
      parents: Array.from(skin.partition.cut.p1FaceParents),
    },
  );
  const lipSurface = face.surfaces.find((surface) => surface.id === contact.lips.surface)!;
  lipSurface.sourcePartition = {
    generation: geometrySha, originalVertices: skin.partition.cut.originalVertices,
    parentTriangles: Array.from(root.topology.triangles),
    intersections: skin.partition.cut.intersections.map((point) => ({ ...point })),
    samples: Array.from(skin.partition.cut.faceToG1), parents: Array.from(skin.partition.cut.p1FaceParents),
  };
  face.contact = {
    ...face.contact!,
    margin: chain.margin,
  };
  const currentContact = face.contact!;
  const margin = currentContact.margin!;
  const weights = new Map<string, number>();
  const rest = evaluateHumanFaceRest(face, { weights, activations: [] });
  const articulation = face.articulation!;
  const motions = resolveHumanFaceArticulation(
    articulation,
    weights,
    rest.landmarks,
  ).motions;
  const up = resolveHumanFaceApertureUp(articulation.jaw.axis);
  const gain = createHumanFaceClosureGain(
    face,
    currentContact,
    rest.surfaces,
    motions,
    up,
  );
  const surface = face.surfaces.findIndex((entry) => entry.id === "Human");
  const before = rest.surfaces[surface],
    after = [...before];
  const beforeGaps = measureHumanFaceMarginGaps(
    before,
    margin,
    articulation.jaw.axis,
    up,
    lipSurface,
  );
  for (let at = 0; at < transported.length; at += 4)
    for (let axis = 0; axis < 3; axis++)
      after[3 * transported[at] + axis] +=
        gain.lips[transported[at]] * transported[at + axis + 1];
  const afterGaps = measureHumanFaceMarginGaps(
    after,
    margin,
    articulation.jaw.axis,
    up,
    lipSurface,
  );
  const tolerance = currentContact.toleranceMetres;
  if (
    after.some((value) => !Number.isFinite(value)) ||
    afterGaps.some(
      (gap) => !Number.isFinite(gap) || gap > tolerance || gap < -tolerance,
    )
  ) {
    const rows = new Map<number, number[]>();
    for (let at = 0; at < transported.length; at += 4)
      rows.set(transported[at], transported.slice(at + 1, at + 4));
    const reading = (vertex: number) => ({
      vertex,
      source: skin.partition.cut.faceToG1[vertex],
      native: root.sourceToNative[skin.partition.cut.faceToG1[vertex]],
      gain: gain.lips[vertex],
      before: before.slice(3 * vertex, 3 * vertex + 3),
      after: after.slice(3 * vertex, 3 * vertex + 3),
      delta: rows.get(vertex),
      alongBefore: articulation.jaw.axis.reduce(
        (sum, value, axis) => sum + value * before[3 * vertex + axis],
        0,
      ),
      alongAfter: articulation.jaw.axis.reduce(
        (sum, value, axis) => sum + value * after[3 * vertex + axis],
        0,
      ),
    });
    throw new Error(
      "Source closure rule left a margin gap or overlap beyond the existing contact tolerance: " +
        JSON.stringify({
          toleranceMetres: tolerance,
          centralGain: gain.ratio,
          beforeGapsMetres: beforeGaps,
          afterGapsMetres: afterGaps,
          upper: readHumanFaceLipMarginPoints(lipSurface, margin, after).upper.map((point) => ({ identity: point.identity, point: point.point, support: point.vertices.map(reading) })),
          lower: readHumanFaceLipMarginPoints(lipSurface, margin, after).lower.map((point) => ({ identity: point.identity, point: point.point, support: point.vertices.map(reading) })),
          closureProvenance: closure.provenance,
        }),
    );
  }
  const moved = new Map<number, number>();
  let maximum = 0;
  for (let vertex = 0; vertex < after.length / 3; vertex++) {
    const displacement = [0, 1, 2].map(
      (axis) => after[3 * vertex + axis] - before[3 * vertex + axis],
    );
    if (displacement.every((value) => value === 0)) continue;
    const source = skin.partition.cut.faceToG1[vertex];
    if (source >= root.topology.vertexCount)
      throw new Error(
        "Source lip seal attempted to move the frozen cut independently.",
      );
    moved.set(source, vertex);
    maximum = Math.max(maximum, Math.hypot(...displacement));
  }
  for (const [source, vertex] of moved) {
    for (let axis = 0; axis < 3; axis++) {
      root.topology.positions[3 * source + axis] = after[3 * vertex + axis];
      skin.positions[3 * source + axis] = after[3 * vertex + axis];
    }
  }
  const pick = (samples: Int32Array): Float64Array =>
    Float64Array.from(
      Array.from(samples).flatMap((source) =>
        Array.from(skin.positions.subarray(3 * source, 3 * source + 3)),
      ),
    );
  skin.headPositions = pick(skin.partition.cut.faceToG1);
  skin.bodyPositions = pick(skin.partition.cut.p1BodyToG1);
  return {
    revision: "source-neutral-lip-seal-1",
    closureChannel: channel.id,
    endpoint: channel.positive,
    centralGain: gain.ratio,
    marginRegistration: chain.record,
    closurePreparation: closure,
    toleranceMetres: tolerance,
    gapsBeforeMetres: beforeGaps,
    gapsAfterMetres: afterGaps,
    movedSourceVertices: [...moved.keys()].sort((a, b) => a - b),
    maximumDisplacementMetres: maximum,
    qualification:
      "Shared-source neutral closure through original native margin rows and budget; clinical rest, zero/partial/full runtime closure, vestibule/crown contact and GPU/export acceptance remain separate.",
  };
}
