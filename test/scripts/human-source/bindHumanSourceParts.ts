import { closestHumanSourceTriangle } from "./closestHumanSourceTriangle.ts";
import type { IHumanSourceGenerationGap } from "./structures/IHumanSourceGenerationGap.ts";
import type { IHumanSourceGenerationPartBinding } from "./structures/IHumanSourceGenerationPartBinding.ts";
import type { IHumanSourceLoss } from "./structures/IHumanSourceLoss.ts";
import type { IHumanSourcePartInput } from "./structures/IHumanSourcePartInput.ts";
import type { IHumanSourcePartRekey } from "./structures/IHumanSourcePartRekey.ts";

/** Body endpoints the part-vs-skin check reports, as the N2 evaluator measured them. */
const REPORTED_ENDPOINTS = ["macro/height-max", "macro/height-min", "macro/age-child", "macro/age-old", "macro/gender-male", "macro/gender-female"];
/** A published part vertex is an exact twin of MPFB's refit only within float storage. */
const TWIN_METRES = 1e-6;
/**
 * Issues that own each rigid part's size relative to the head: the part's own
 * element issue (optics, measured dentition, tongue form and motion) and the
 * head-to-stature relation.
 */
const RIGID_GAP_OWNERS: Readonly<Record<string, readonly string[]>> = {
  "Human.low-poly": ["#2728", "#2704"],
  "Human.teeth_base": ["#2738", "#2704"],
  "Human.tongue01": ["#2739", "#2704"],
};

/**
 * Bind every attached face part to the skin and regenerate its body-control
 * rows from the skin's rows, so one body control moves skin and parts from the
 * same base (3d-modeling: a derivative is regenerated when its base changes).
 *
 * Binding kind follows the part's anatomy and the published attachments.
 * Eyebrow and eyelash cards deform with the skin they lie on, so each vertex
 * takes the row of its nearest head skin point. Globes, dentition and tongue
 * are rigid bodies and must not stretch: each moves as one translation. A
 * globe follows its own eye cube, the centre the face articulation rotates it
 * about. A dentition arch (split by the published jaw attachment) and the
 * tongue follow the least-squares translation of the skin they sit in, because
 * their articulation pivot, the skull-mandible joint, lies far behind them and
 * a translation taken there would leave them behind a reshaped mouth. MPFB's own proxy bindings were checked first: only the eyebrow binds to
 * skin vertices; the eyelashes, globes, dentition and tongue bind to helper
 * geometry that no post-extraction skin row moves, so they cannot regenerate
 * rows for this generation's controls.
 *
 * Body rows are keyed by the body endpoint, indexed by part vertex, relative to
 * the head anchor like the skin's head-only rows. Face-channel rows stay on the
 * part; face endpoints that now alias a body macro are removed from parts and
 * the face landmark set. The face landmark set gains every body endpoint's
 * landmark rows relative to the anchor, so articulation pivots follow the
 * reshaped head.
 */
export function bindHumanSourceParts(input: IHumanSourcePartInput): IHumanSourcePartRekey {
  const { generation, body, sample, offset } = input;
  const skin = generation.skin;
  const n = skin.originalVertices;
  const aliased = new Set(generation.aliases.flatMap((alias) => Object.keys(alias.endpoints)));
  const anchorIds = (generation.anchor?.landmarks ?? []).map((id) => body.landmarks.ids.indexOf(id));
  const landmarkRow = (name: string, index: number): number[] => {
    const rows = body.landmarks.targets[name] ?? [];
    for (let i = 0; i < rows.length; i += 4) if (rows[i] === index) return rows.slice(i + 1, i + 4);
    return [0, 0, 0];
  };
  const anchorOf = (name: string): number[] => {
    const sum = [0, 0, 0];
    for (const index of anchorIds) landmarkRow(name, index).forEach((x, c) => (sum[c] += x / anchorIds.length));
    return sum;
  };
  const bodyEndpoints = Object.keys(body.surfaces[0].targets);
  const headTriangles: number[] = [];
  skin.labels.forEach((label, t) => {
    if (label === 0) headTriangles.push(t);
  });
  const skinRow = new Map<string, Map<number, number[]>>();
  const rowsOf = (name: string): Map<number, number[]> => {
    let map = skinRow.get(name);
    if (map === undefined) {
      map = new Map();
      const rows = generation.targets[name] ?? [];
      for (let i = 0; i < rows.length; i += 4) map.set(rows[i], rows.slice(i + 1, i + 4));
      skinRow.set(name, map);
    }
    return map;
  };
  // A skin point's row in the head frame: head-only rows are already relative
  // to the anchor; a cut sample's absolute row is made relative here.
  const pointRow = (name: string, triangle: number, weights: readonly number[]): number[] => {
    const map = rowsOf(name);
    const anchor = anchorOf(name);
    const out = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const g = skin.triangles[3 * triangle + k];
      const value = map.get(g) ?? [0, 0, 0];
      for (let c = 0; c < 3; c++) out[c] += weights[k] * (value[c] - (g >= n ? anchor[c] : 0));
    }
    return out;
  };
  const nearest = closestHumanSourceTriangle(skin.positions, skin.triangles, headTriangles);
  const checks: Record<string, number | boolean | string> = {};
  const gaps: IHumanSourceGenerationGap[] = [];
  const losses: IHumanSourceLoss[] = [];

  const parts = generation.parts.map((part) => {
    const published = part.surface;
    const count = published.positions.length / 3;
    const attachments = new Map<number, string>();
    for (const attachment of published.attachments ?? [])
      for (let i = 0; i < attachment.rows.length; i += 2) attachments.set(attachment.rows[i], attachment.owner);
    // A globe moves with its eye cube, the centre its articulation rotates it
    // about; any other rigid group (a dentition arch, the tongue) moves with the
    // mean row of the skin around it, since its articulation pivot lies elsewhere.
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
    const binding: IHumanSourceGenerationPartBinding = {
      kind: rigid ? "rigid" : "surface",
      triangles: rigid ? [] : triangles,
      weights: rigid ? [] : weights,
      frames: rigid ? Array.from({ length: count }, (_, v) => frameOf(v)) : [],
      frameSources: {},
      reason: rigid
        ? "rigid body with a published articulation attachment; carried by its joint cube without stretching"
        : "deforming card lying on the skin; follows its nearest skin point",
    };
    const members = new Map<string, number[]>();
    binding.frames.forEach((frame, v) => {
      const list = members.get(frame);
      if (list === undefined) members.set(frame, [v]);
      else list.push(v);
    });
    for (const frame of members.keys())
      binding.frameSources[frame] = body.landmarks.ids.includes(frame)
        ? `body landmark ${frame}`
        : "mean row of the skin points nearest to this frame's vertices";
    const frameRow = new Map<string, number[]>();
    const translation = (name: string, frame: string): number[] => {
      const key = `${name}|${frame}`;
      let row = frameRow.get(key);
      if (row === undefined) {
        const index = body.landmarks.ids.indexOf(frame);
        if (index >= 0) {
          const anchor = anchorOf(name);
          row = landmarkRow(name, index).map((x, c) => x - anchor[c]);
        } else {
          row = [0, 0, 0];
          const list = members.get(frame)!;
          for (const v of list) pointRow(name, triangles[v], weights.slice(3 * v, 3 * v + 3)).forEach((x, c) => (row![c] += x / list.length));
        }
        frameRow.set(key, row);
      }
      return row;
    };
    const partRow = (name: string, v: number): number[] => {
      if (!rigid) return pointRow(name, triangles[v], weights.slice(3 * v, 3 * v + 3));
      return translation(name, binding.frames[v]);
    };
    const bodyTargets: Record<string, number[]> = {};
    let rows = 0;
    for (const name of bodyEndpoints) {
      const out: number[] = [];
      for (let v = 0; v < count; v++) {
        const row = partRow(name, v);
        if (row.some((x) => x !== 0)) out.push(v, ...row);
      }
      if (out.length > 0) {
        bodyTargets[name] = out;
        rows += out.length / 4;
      }
    }
    // Part against the skin it sits in: zero for a surface binding by
    // construction, the skin's own deformation around a rigid part otherwise.
    const sizes: Record<string, number> = {};
    const relative = REPORTED_ENDPOINTS.map((name) => {
      let worst = 0;
      for (let v = 0; v < count; v++) {
        const skinPoint = pointRow(name, triangles[v], weights.slice(3 * v, 3 * v + 3));
        worst = Math.max(worst, Math.hypot(...partRow(name, v).map((x, c) => x - skinPoint[c])));
      }
      sizes[name] = worst;
      return `${name} ${(worst * 1000).toFixed(2)} mm`;
    });
    // A rigid part cannot follow skin that the body control scales around it.
    // No size rule for it is sourced, so the motion is left as a named gap.
    if (rigid) {
      const owners = RIGID_GAP_OWNERS[part.id];
      if (owners === undefined) throw new Error(`Rigid part ${part.id} has no gap owner.`);
      gaps.push({
        subject: part.id,
        quantity: "largest motion of a part vertex relative to its nearest skin point under a body control at weight one",
        sizes,
        owners: [...owners],
        reason: "the part is carried rigidly; the skin around it is scaled by body macros, and no measured rule ties this part's size to stature or head size, so no scale is invented",
      });
      for (const [name, size] of Object.entries(sizes))
        losses.push({
          basis: "face", surface: part.id, row: name, kind: "part-rigid-relative-motion", vertices: count, maximumMetres: size,
          reason: `rigid part does not scale with the skin around it; owners ${owners.join(", ")}`,
        });
    }
    // Rigid or surface rows against MPFB's own refit where the part is its exact twin.
    const refit = refitCheck(part.id, count, published.positions, (name, v) => partRow(name, v));
    checks[part.id] = `${binding.kind}; ${rows} body rows over ${Object.keys(bodyTargets).length} endpoints; part-vs-skin ${relative.join(", ")}; ${refit}`;
    const targets = Object.fromEntries(Object.entries(published.targets).filter(([name]) => !aliased.has(name)));
    return {
      ...part,
      provenance: `published face part; body-control rows regenerated from the skin through a ${binding.kind} binding`,
      surface: { ...published, targets },
      binding,
      bodyTargets,
    };
  });

  function refitCheck(id: string, count: number, positions: readonly number[], row: (name: string, v: number) => number[]): string {
    const recorded = sample.manifest.parts.find((p) => p.id === id);
    const level = recorded === undefined ? undefined : Object.keys(recorded.vertices).find((l) => recorded.vertices[l] === count);
    const values = level === undefined ? undefined : sample.partPositions.get(id)?.get(level);
    if (values === undefined) return "no refit level matches";
    const states = new Map(sample.manifest.partStates.map((name, i) => [name, i]));
    const at = (state: number, q: number, c: number): number => {
      const base = 3 * (state * count + q);
      return c === 0 ? values[base] : c === 1 ? values[base + 2] - offset : -values[base + 1];
    };
    const map = new Int32Array(count);
    const used = new Set<number>();
    let worstTwin = 0;
    for (let v = 0; v < count; v++) {
      let best = Number.POSITIVE_INFINITY;
      for (let q = 0; q < count; q++) {
        const d = Math.hypot(at(0, q, 0) - positions[3 * v], at(0, q, 1) - positions[3 * v + 1], at(0, q, 2) - positions[3 * v + 2]);
        if (d < best) {
          best = d;
          map[v] = q;
        }
      }
      used.add(map[v]);
      worstTwin = Math.max(worstTwin, best);
    }
    if (used.size !== count || worstTwin > TWIN_METRES) return "no exact refit twin (neutral changed after extraction)";
    const report = REPORTED_ENDPOINTS.filter((name) => states.has(name)).map((name) => {
      const s = states.get(name)!;
      const anchor = anchorOf(name);
      let worst = 0;
      for (let v = 0; v < count; v++) {
        const q = map[v];
        const truth = [0, 1, 2].map((c) => at(s, q, c) - at(0, q, c) - anchor[c]);
        worst = Math.max(worst, Math.hypot(...row(name, v).map((x, c) => x - truth[c])));
      }
      return `${name} ${(worst * 1000).toFixed(2)} mm`;
    });
    return `against MPFB refit ${report.join(", ")}`;
  }

  // Face landmark set: drop aliased face rows; add every body endpoint's rows.
  const landmarks = generation.landmarks.map((set) => {
    if (set.origin !== "face") return set;
    const targets: Record<string, number[]> = Object.fromEntries(Object.entries(set.targets).filter(([name]) => !aliased.has(name)));
    const indices = set.ids.map((id) => body.landmarks.ids.indexOf(id));
    for (const name of Object.keys(body.landmarks.targets)) {
      const anchor = anchorOf(name);
      const out: number[] = [];
      indices.forEach((index, i) => {
        if (index < 0) return;
        const row = landmarkRow(name, index).map((x, c) => x - anchor[c]);
        if (row.some((x) => x !== 0)) out.push(i, ...row);
      });
      if (out.length > 0) targets[name] = out;
    }
    return { ...set, targets };
  });
  return {
    generation: {
      ...generation,
      parts,
      landmarks,
      gaps: [...generation.gaps, ...gaps],
      stamps: [
        ...generation.stamps,
        { derivative: "part body-control rows and face landmark body rows", authoredOn: generation.id, status: "regenerated", note: "parts bound to the skin (surface or rigid); rows relative to the head anchor" },
      ],
    },
    losses,
    checks,
  };
}
