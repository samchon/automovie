import type { IHumanSourceBandExtension } from "./structures/IHumanSourceBandExtension.ts";
import type { IHumanSourceBandInput } from "./structures/IHumanSourceBandInput.ts";
import type { IHumanSourceGenerationAttachment } from "./structures/IHumanSourceGenerationAttachment.ts";
import type { IHumanSourceGenerationBandTarget } from "./structures/IHumanSourceGenerationBandTarget.ts";

/**
 * Define the endpoints that only one partition owns across the cut, on the
 * body band only.
 *
 * Ownership: the face owns the head partition's shape; the body carries the
 * whole head rigidly with the head anchor (the eye joint-cube mean); every MPFB
 * macro is already defined once over the skin and needs no band. What remains
 * are endpoints with no counterpart across the cut: body-only keys
 * (proportions, torso, neck girth) and face-only non-macro keys (including the
 * ancestry correctives). They meet on the body band, the body vertices less
 * than the reach convention below the cut loop, weighted by
 * `w = 1 - smootherstep(depth / reach)`:
 *
 * - a body endpoint keeps its body rows, loses any head-only row, and on the
 *   band becomes `B(v) - w(v)·(B(c(v)) - Δanchor)` with cut-sample rows
 *   `Δanchor`, so it equals the rigid head carry at the cut and its own value
 *   below the band;
 * - a face endpoint that moves the cut keeps its head rows and gains
 *   `w(v)·F(c(v))` on the band, as does the face jaw attachment weight.
 *
 * `c(v)` is the cut row at the vertex's loop azimuth. An unavailable endpoint
 * has no source value on part of the cut, so it gets no band row and stays
 * refused by name. Nothing here is fitted to an output.
 */
export function defineHumanSourceBand(input: IHumanSourceBandInput): IHumanSourceBandExtension {
  const { generation, face, body, reachMetres } = input;
  const skin = generation.skin;
  const n = skin.originalVertices;
  const total = skin.positions.length / 3;
  const head = new Uint8Array(n);
  const bodySide = new Uint8Array(n);
  skin.labels.forEach((label, t) => {
    for (let k = 0; k < 3; k++) {
      const g = skin.triangles[3 * t + k];
      if (g < n) (label === 0 ? head : bodySide)[g] = 1;
    }
  });
  const samples = Array.from({ length: total - n }, (_, i) => n + i);
  const axis = [0, 2].map((c) => samples.reduce((sum, g) => sum + skin.positions[3 * g + c], 0) / samples.length);
  const azimuth = (g: number): number => Math.atan2(skin.positions[3 * g] - axis[0], skin.positions[3 * g + 2] - axis[1]);
  const loop = samples.slice().sort((x, y) => azimuth(x) - azimuth(y));
  const loopAzimuth = loop.map(azimuth);
  const bracket = (theta: number): number[] => {
    let j = loopAzimuth.findIndex((a) => a >= theta);
    if (j < 0) j = 0;
    const i = (j - 1 + loop.length) % loop.length;
    let span = loopAzimuth[j] - loopAzimuth[i];
    if (span <= 0) span += 2 * Math.PI;
    let into = theta - loopAzimuth[i];
    if (into < 0) into += 2 * Math.PI;
    return [i, j, Math.min(1, into / span)];
  };
  const vertices: number[] = [];
  const weights: number[] = [];
  const brackets: number[][] = [];
  for (let g = 0; g < n; g++) {
    if (bodySide[g] === 0) continue;
    const [i, j, t] = bracket(azimuth(g));
    const loopY = skin.positions[3 * loop[i] + 1] * (1 - t) + skin.positions[3 * loop[j] + 1] * t;
    const depth = loopY - skin.positions[3 * g + 1];
    if (depth < 0 || depth >= reachMetres) continue;
    const u = depth / reachMetres;
    vertices.push(g);
    weights.push(1 - u * u * u * (u * (6 * u - 15) + 10));
    brackets.push([i, j, t]);
  }
  const carried = (map: Map<number, number[]>, b: number[]): number[] => {
    const first = map.get(loop[b[0]]) ?? [0, 0, 0];
    const second = map.get(loop[b[1]]) ?? [0, 0, 0];
    return [0, 1, 2].map((c) => first[c] * (1 - b[2]) + second[c] * b[2]);
  };
  const toMap = (rows: readonly number[]): Map<number, number[]> => {
    const out = new Map<number, number[]>();
    for (let i = 0; i < rows.length; i += 4) out.set(rows[i], rows.slice(i + 1, i + 4));
    return out;
  };
  const toRows = (map: Map<number, number[]>): number[] =>
    [...map].filter(([, v]) => v.some((x) => x !== 0)).sort((x, y) => x[0] - y[0]).flatMap(([g, v]) => [g, ...v]);
  const anchorIds = (generation.anchor?.landmarks ?? []).map((id) => body.landmarks.ids.indexOf(id));
  const anchorOf = (name: string): number[] => {
    const rows = body.landmarks.targets[name] ?? [];
    const sum = [0, 0, 0];
    for (let i = 0; i < rows.length; i += 4) if (anchorIds.includes(rows[i])) for (let c = 0; c < 3; c++) sum[c] += rows[i + 1 + c] / anchorIds.length;
    return sum;
  };
  const origin = new Map<string, "face" | "body">();
  for (const channel of generation.channels) {
    origin.set(channel.positive, channel.origin);
    if (channel.negative !== null) origin.set(channel.negative, channel.origin);
  }
  for (const corrective of generation.correctives) origin.set(corrective.target, corrective.origin);
  const macro = new Set(generation.anchor?.targets ?? []);
  const targets: Record<string, number[]> = {};
  const records: IHumanSourceGenerationBandTarget[] = [];
  for (const [name, rows] of Object.entries(generation.targets)) {
    const owner = origin.get(name);
    if (owner === undefined) throw new Error(`Endpoint ${name} has no channel or corrective.`);
    if (owner === "body" && macro.has(name)) {
      targets[name] = rows;
      continue;
    }
    const map = toMap(rows);
    if (owner === "face") {
      for (const g of [...map.keys()]) if (g < n && head[g] === 0) map.delete(g);
      const moves = loop.some((g) => (map.get(g) ?? [0, 0, 0]).some((x) => x !== 0));
      if (moves) {
        vertices.forEach((g, k) => map.set(g, carried(map, brackets[k]).map((x) => x * weights[k])));
        records.push({ target: name, origin: "face", rule: "face-band", rows: vertices.length });
      }
      targets[name] = toRows(map);
      continue;
    }
    for (const g of [...map.keys()]) if (g < n && head[g] === 1) map.delete(g);
    if (name in generation.unavailable) {
      targets[name] = toRows(map);
      records.push({ target: name, origin: "body", rule: "unavailable", rows: 0 });
      continue;
    }
    const anchor = anchorOf(name);
    const relative = new Map(loop.map((g) => [g, (map.get(g) ?? [0, 0, 0]).map((x, c) => x - anchor[c])]));
    if ([...relative.values()].some((v) => v.some((x) => x !== 0))) {
      vertices.forEach((g, k) => {
        const own = map.get(g) ?? [0, 0, 0];
        const cut = carried(relative, brackets[k]);
        map.set(g, own.map((x, c) => x - weights[k] * cut[c]));
      });
      for (const g of loop) map.set(g, anchor.slice());
      records.push({ target: name, origin: "body", rule: "body-band", rows: vertices.length });
    }
    targets[name] = toRows(map);
  }

  // The face jaw attachment: published head rows, carried onto the band.
  const faceSkin = face.surfaces.find((s) => s.id === "Human")!;
  const attachments: IHumanSourceGenerationAttachment[] = (faceSkin.attachments ?? []).map((attachment) => {
    const map = new Map<number, number>();
    for (let i = 0; i < attachment.rows.length; i += 2) map.set(skin.faceVertexToSkin[attachment.rows[i]], attachment.rows[i + 1]);
    vertices.forEach((g, k) => {
      const [i, j, t] = brackets[k];
      const value = weights[k] * ((map.get(loop[i]) ?? 0) * (1 - t) + (map.get(loop[j]) ?? 0) * t);
      if (value > 0) map.set(g, Math.min(1, value));
    });
    return {
      owner: attachment.owner,
      rows: [...map].filter(([, w]) => w !== 0).sort((x, y) => x[0] - y[0]).flatMap(([g, w]) => [g, w]),
      extension: "derived",
    };
  });
  const count = (rule: string, side: string): number => records.filter((r) => r.rule === rule && r.origin === side).length;
  return {
    generation: {
      ...generation,
      targets,
      attachments,
      band: {
        convention: "smallest reach without a band fold in the N2 sweep of the one-skin evaluator (40/60/80/112.5 mm): an authored rig convention, not a measurement",
        reachMetres,
        axis,
        loopSamples: loop,
        vertices,
        weights,
      },
      bandTargets: records,
      stamps: [
        ...generation.stamps,
        { derivative: "body band", authoredOn: generation.id, status: "regenerated", note: `reach ${reachMetres} m, ${vertices.length} body vertices; face owns the head, body carries it with the eye anchor` },
      ],
    },
    checks: {
      bandVertices: vertices.length,
      bodyBandTargets: count("body-band", "body"),
      faceBandTargets: count("face-band", "face"),
      unavailableTargets: count("unavailable", "body"),
      bandRows: records.reduce((sum, r) => sum + r.rows, 0),
    },
  };
}
