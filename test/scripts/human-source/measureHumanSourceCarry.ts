import { denseHumanSourceRows } from "./denseHumanSourceRows.ts";
import { measureHumanSourceError } from "./measureHumanSourceError.ts";
import type { IHumanSourceCarryInput } from "./structures/IHumanSourceCarryInput.ts";
import type { IHumanSourceReproductionError } from "./structures/IHumanSourceReproductionError.ts";
import type { IHumanSourceReproductionRow } from "./structures/IHumanSourceReproductionRow.ts";

/**
 * Measure every row's P2 and P1 carry on the written artifacts.
 *
 * P2 reads the one-skin generation as the evaluator will: a face row at its
 * face vertex's skin id; a body row at its body vertex's source id, plus the
 * row's head-carry landmark delta where that vertex is head-only and the band
 * has made body rows carry-relative. P1 reads the written P1 face and body:
 * a body vertex the complement dropped reads as no motion for an endpoint and
 * is left out of neutral and weight comparisons, whose rows then say how many
 * vertices were not compared. Attached parts are referenced by the generation,
 * not stored, so their P2 stays null. Nothing here is assumed equal: an
 * unchanged copy measures zero because its values are equal.
 */
export function measureHumanSourceCarry(input: IHumanSourceCarryInput): IHumanSourceReproductionRow[] {
  const { face, body, cut, generation, p1 } = input;
  const n = generation.skin.originalVertices;
  const human = face.surfaces.find((s) => s.id === "Human")!;
  const p1Human = p1.face.surfaces.find((s) => s.id === "Human")!;
  const bodySurface = body.surfaces[0];
  const p1Body = p1.body.surfaces[0];
  const faceCount = human.positions.length / 3;
  const bodyCount = bodySurface.positions.length / 3;
  const kept = cut.r16ToSource;
  const p1Of = new Map<number, number>();
  cut.p1BodyToG1.forEach((g, j) => p1Of.set(g, j));
  const headOnly = new Uint8Array(n);
  for (let t = 0; t < generation.skin.labels.length; t++)
    if (generation.skin.labels[t] === 0)
      for (let k = 0; k < 3; k++) {
        const g = generation.skin.triangles[3 * t + k];
        if (g < n) headOnly[g] = 1;
      }
  for (let t = 0; t < generation.skin.labels.length; t++)
    if (generation.skin.labels[t] === 1)
      for (let k = 0; k < 3; k++) {
        const g = generation.skin.triangles[3 * t + k];
        if (g < n) headOnly[g] = 0;
      }
  const carryLandmark = generation.band?.carryLandmark ?? null;
  const carryIndex = carryLandmark === null ? -1 : body.landmarks.ids.indexOf(carryLandmark);
  const anchorTargets = new Set(generation.anchor?.targets ?? []);
  const anchorIndex = (generation.anchor?.landmarks ?? []).map((id) => body.landmarks.ids.indexOf(id));
  const anchorOf = (name: string): number[] => {
    const rows = body.landmarks.targets[name] ?? [];
    const sum = [0, 0, 0];
    for (let i = 0; i < rows.length; i += 4) if (anchorIndex.includes(rows[i])) for (let c = 0; c < 3; c++) sum[c] += rows[i + 1 + c];
    return sum.map((x) => x / Math.max(1, anchorIndex.length));
  };
  const aliasOf = new Map<string, string>();
  for (const alias of generation.aliases) for (const [from, to] of Object.entries(alias.endpoints)) aliasOf.set(from, to);
  const carryOf = (name: string): number[] => {
    const rows = body.landmarks.targets[name] ?? [];
    for (let i = 0; i < rows.length; i += 4) if (rows[i] === carryIndex) return [rows[i + 1], rows[i + 2], rows[i + 3]];
    return [0, 0, 0];
  };
  const skinRows = (name: string): Map<number, number[]> => {
    const rows = generation.targets[name] ?? [];
    const out = new Map<number, number[]>();
    for (let i = 0; i < rows.length; i += 4) out.set(rows[i], [rows[i + 1], rows[i + 2], rows[i + 3]]);
    return out;
  };
  const zeros = (count: number): Float64Array => new Float64Array(3 * count);
  const scalarField = (count: number, at: (v: number) => number): Float64Array =>
    Float64Array.from({ length: 3 * count }, (_, i) => (i % 3 === 0 ? at(i / 3) : 0));
  const compact = (published: ArrayLike<number>, candidate: (v: number, c: number) => number | undefined, count: number) => {
    const p: number[] = [];
    const q: number[] = [];
    let missing = 0;
    for (let v = 0; v < count; v++) {
      if (candidate(v, 0) === undefined) {
        missing++;
        continue;
      }
      for (let c = 0; c < 3; c++) {
        p.push(published[3 * v + c]);
        q.push(candidate(v, c)!);
      }
    }
    return { published: Float64Array.from(p), candidate: Float64Array.from(q), missing };
  };
  const weightDifference = (rowsOf: (v: number) => Map<string, number> | undefined, count: number) => {
    let missing = 0;
    const compared: number[] = [];
    for (let v = 0; v < count; v++) {
      const candidate = rowsOf(v);
      if (candidate === undefined) {
        missing++;
        continue;
      }
      const published = new Map<string, number>();
      for (let k = 0; k < 4; k++) {
        const w = bodySurface.skin.weights[4 * v + k];
        const slot = bodySurface.skin.joints[bodySurface.skin.boneIndices[4 * v + k]];
        if (w !== 0) published.set(slot, (published.get(slot) ?? 0) + w);
      }
      let worst = 0;
      for (const slot of new Set([...published.keys(), ...candidate.keys()]))
        worst = Math.max(worst, Math.abs((published.get(slot) ?? 0) - (candidate.get(slot) ?? 0)));
      compared.push(worst, 0, 0);
    }
    return { field: Float64Array.from(compared), missing };
  };
  const slotRows = (joints: readonly string[], boneIndices: readonly number[], weights: readonly number[], at: number): Map<string, number> => {
    const out = new Map<string, number>();
    for (let k = 0; k < 4; k++) if (weights[4 * at + k] !== 0) out.set(joints[boneIndices[4 * at + k]], (out.get(joints[boneIndices[4 * at + k]]) ?? 0) + weights[4 * at + k]);
    return out;
  };
  const faceLandmarks = generation.landmarks.find((l) => l.origin === "face");
  const bodyLandmarks = generation.landmarks.find((l) => l.origin === "body")!;

  return input.rows.map((row): IHumanSourceReproductionRow => {
    let p2: IHumanSourceReproductionError | null = null;
    let p1Error: IHumanSourceReproductionError | null = null;
    let note = row.note;
    if (row.basis === "face" && row.surface === "Human" && (row.role === "channel-endpoint" || row.role === "corrective")) {
      const d = denseHumanSourceRows(human.targets[row.row], faceCount);
      // An aliased face endpoint is read from the body endpoint that owns it,
      // relative to the head anchor as the face frame was: the stored head row,
      // or the absolute cut-sample row minus the anchor delta.
      const owner = aliasOf.get(row.row);
      const map = skinRows(owner ?? row.row);
      const anchor = owner === undefined ? [0, 0, 0] : anchorOf(owner);
      const candidate = Float64Array.from({ length: 3 * faceCount }, (_, i) => {
        const g = cut.faceToG1[Math.floor(i / 3)];
        return (map.get(g)?.[i % 3] ?? 0) - (owner !== undefined && g >= n ? anchor[i % 3] : 0);
      });
      p2 = measureHumanSourceError({ published: d, candidate, neutral: human.positions });
      if (owner !== undefined) note = `${note}; P2 reads alias ${owner} relative to the eye anchor`;
      p1Error = measureHumanSourceError({ published: d, candidate: denseHumanSourceRows(p1Human.targets[row.row], faceCount), neutral: human.positions });
    } else if (row.basis === "face" && row.surface === "Human" && row.role === "neutral") {
      const published = Float64Array.from(human.positions);
      const candidate = Float64Array.from({ length: 3 * faceCount }, (_, i) => generation.skin.positions[3 * cut.faceToG1[Math.floor(i / 3)] + (i % 3)]);
      p2 = measureHumanSourceError({ published, candidate, neutral: zeros(faceCount) });
      p1Error = measureHumanSourceError({ published, candidate: Float64Array.from(p1Human.positions), neutral: zeros(faceCount) });
    } else if (row.basis === "face" && row.role === "attachment") {
      const owner = row.row.slice("attachment:".length);
      const weightsOf = (rows: readonly number[] | undefined): Map<number, number> => {
        const out = new Map<number, number>();
        for (let i = 0; rows !== undefined && i < rows.length; i += 2) out.set(rows[i], rows[i + 1]);
        return out;
      };
      const published = weightsOf(human.attachments?.find((a) => a.owner === owner)?.rows);
      const skin = weightsOf(generation.attachments.find((a) => a.owner === owner)?.rows);
      const p1Rows = weightsOf(p1Human.attachments?.find((a) => a.owner === owner)?.rows);
      const reference = scalarField(faceCount, (v) => published.get(v) ?? 0);
      p2 = measureHumanSourceError({ published: reference, candidate: scalarField(faceCount, (v) => skin.get(cut.faceToG1[v]) ?? 0), neutral: zeros(faceCount) });
      p1Error = measureHumanSourceError({ published: reference, candidate: scalarField(faceCount, (v) => p1Rows.get(v) ?? 0), neutral: zeros(faceCount) });
    } else if (row.basis === "face" && row.surface === "landmarks" && face.landmarks !== undefined && faceLandmarks !== undefined) {
      const count = face.landmarks.ids.length;
      const pick = (positions: readonly number[], targets: Record<string, number[]>): Float64Array =>
        row.role === "neutral" ? Float64Array.from(positions) : denseHumanSourceRows(targets[row.row], count);
      const published = pick(face.landmarks.positions, face.landmarks.targets);
      const neutral = row.role === "neutral" ? zeros(count) : face.landmarks.positions;
      // A macro row now lives under its body owner, relative to the eye anchor.
      const owner = row.role === "neutral" ? undefined : aliasOf.get(row.row);
      const stored = owner === undefined ? pick(faceLandmarks.positions, faceLandmarks.targets) : denseHumanSourceRows(faceLandmarks.targets[owner], count);
      p2 = measureHumanSourceError({ published, candidate: stored, neutral });
      if (owner !== undefined) note = `${note}; P2 reads ${owner} relative to the eye anchor`;
      p1Error = measureHumanSourceError({ published, candidate: pick(p1.face.landmarks!.positions, p1.face.landmarks!.targets), neutral });
    } else if (row.basis === "face" && row.role === "part-endpoint") {
      const surface = face.surfaces.find((s) => s.id === row.surface)!;
      const p1Surface = p1.face.surfaces.find((s) => s.id === row.surface)!;
      const count = surface.positions.length / 3;
      const stored = generation.parts.find((p) => p.id === row.surface)!;
      const owner = aliasOf.get(row.row);
      p2 = measureHumanSourceError({
        published: denseHumanSourceRows(surface.targets[row.row], count),
        candidate: denseHumanSourceRows(owner === undefined ? stored.surface.targets[row.row] : stored.bodyTargets[owner], count),
        neutral: surface.positions,
      });
      if (owner !== undefined) note = `${note}; P2 reads body row ${owner} regenerated through the part binding`;
      p1Error = measureHumanSourceError({
        published: denseHumanSourceRows(surface.targets[row.row], count),
        candidate: denseHumanSourceRows(p1Surface.targets[row.row], count),
        neutral: surface.positions,
      });
    } else if (row.basis === "body" && row.surface === "Human" && (row.role === "channel-endpoint" || row.role === "corrective")) {
      const d = denseHumanSourceRows(bodySurface.targets[row.row], bodyCount);
      const map = skinRows(row.row);
      const anchored = anchorTargets.has(row.row);
      const carry = anchored ? anchorOf(row.row) : carryIndex < 0 ? [0, 0, 0] : carryOf(row.row);
      const p1Map = new Map<number, number[]>();
      const p1Rows = p1Body.targets[row.row] ?? [];
      for (let i = 0; i < p1Rows.length; i += 4) p1Map.set(p1Rows[i], [p1Rows[i + 1], p1Rows[i + 2], p1Rows[i + 3]]);
      const candidate = new Float64Array(3 * bodyCount);
      const p1Candidate = new Float64Array(3 * bodyCount);
      for (let v = 0; v < bodyCount; v++) {
        const x = kept[v];
        const stored = map.get(x);
        const relative = (anchored || carryIndex >= 0) && headOnly[x] === 1;
        const j = p1Of.get(x);
        for (let c = 0; c < 3; c++) {
          candidate[3 * v + c] = (stored?.[c] ?? 0) + (relative ? carry[c] : 0);
          p1Candidate[3 * v + c] = j === undefined ? 0 : (p1Map.get(j)?.[c] ?? 0);
        }
      }
      p2 = measureHumanSourceError({ published: d, candidate, neutral: bodySurface.positions });
      p1Error = measureHumanSourceError({ published: d, candidate: p1Candidate, neutral: bodySurface.positions });
    } else if (row.basis === "body" && row.surface === "Human" && row.role === "neutral") {
      p2 = measureHumanSourceError({
        published: Float64Array.from(bodySurface.positions),
        candidate: Float64Array.from({ length: 3 * bodyCount }, (_, i) => generation.skin.positions[3 * kept[Math.floor(i / 3)] + (i % 3)]),
        neutral: zeros(bodyCount),
      });
      const present = compact(bodySurface.positions, (v, c) => {
        const j = p1Of.get(kept[v]);
        return j === undefined ? undefined : p1Body.positions[3 * j + c];
      }, bodyCount);
      p1Error = measureHumanSourceError({ published: present.published, candidate: present.candidate, neutral: zeros(present.published.length / 3) });
      note = `${note}; P1 compares ${bodyCount - present.missing} vertices, ${present.missing} dropped above the cut`;
    } else if (row.basis === "body" && row.role === "weights") {
      const w = generation.weights;
      const skin = weightDifference((v) => slotRows(w.joints, w.boneIndices, w.weights, kept[v]), bodyCount);
      const pw = p1Body.skin;
      const p1w = weightDifference((v) => {
        const j = p1Of.get(kept[v]);
        return j === undefined ? undefined : slotRows(pw.joints, pw.boneIndices, pw.weights, j);
      }, bodyCount);
      const compared = (field: Float64Array): number => field.length / 3;
      p2 = measureHumanSourceError({ published: zeros(compared(skin.field)), candidate: skin.field, neutral: zeros(compared(skin.field)) });
      p1Error = measureHumanSourceError({ published: zeros(compared(p1w.field)), candidate: p1w.field, neutral: zeros(compared(p1w.field)) });
      note = `${note}; P1 compares ${compared(p1w.field)} vertices, ${p1w.missing} dropped above the cut`;
    } else if (row.basis === "body" && row.surface === "landmarks") {
      const count = body.landmarks.ids.length;
      const pick = (positions: readonly number[], targets: Record<string, number[]>): Float64Array =>
        row.role === "neutral" ? Float64Array.from(positions) : denseHumanSourceRows(targets[row.row], count);
      const published = pick(body.landmarks.positions, body.landmarks.targets);
      const neutral = row.role === "neutral" ? zeros(count) : body.landmarks.positions;
      p2 = measureHumanSourceError({ published, candidate: pick(bodyLandmarks.positions, bodyLandmarks.targets), neutral });
      p1Error = measureHumanSourceError({ published, candidate: pick(p1.body.landmarks.positions, p1.body.landmarks.targets), neutral });
    } else if (row.basis === "body" && row.role === "joint") {
      const published = body.joints.find((j) => j.bone === row.row);
      const equal = (joints: typeof body.joints): boolean => JSON.stringify(joints.find((j) => j.bone === row.row)) === JSON.stringify(published);
      const unit = (same: boolean): IHumanSourceReproductionError => ({
        maximumMetres: same ? 0 : Number.NaN,
        rmsMetres: same ? 0 : Number.NaN,
        float32MaximumMetres: same ? 0 : Number.NaN,
        comparedVertices: 0,
        differingVertices: same ? 0 : 1,
      });
      p2 = unit(equal(generation.joints));
      p1Error = unit(equal(p1.body.joints));
      note = `${note}; carry compares the whole joint record`;
    }
    return { ...row, p2, p1: p1Error, note };
  });
}
