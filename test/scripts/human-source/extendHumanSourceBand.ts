import { createHumanSourceBodyRecipes } from "./createHumanSourceBodyRecipes.ts";
import { measureHumanSourceBand } from "./measureHumanSourceBand.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceBandExtension } from "./structures/IHumanSourceBandExtension.ts";
import type { IHumanSourceBandInput } from "./structures/IHumanSourceBandInput.ts";
import type { IHumanSourceGenerationAttachment } from "./structures/IHumanSourceGenerationAttachment.ts";
import type { IHumanSourceGenerationBandTarget } from "./structures/IHumanSourceGenerationBandTarget.ts";

/** A stored cut-sample row counts as reproduced by a recipe within two micrometre storage units. */
const POSITION_TOLERANCE_METRES = 2e-6;
/** One storage unit of seven-decimal weights. */
const WEIGHT_TOLERANCE = 1e-7;

/**
 * Define every channel that crosses the neck once, on the one skin
 * (`n2-band-channel-request.md` C-1..C-6).
 *
 * Body endpoints: rows on head-only vertices become relative to the rigid head
 * carry Δ (the endpoint's `joint-head` landmark row), `s(v)·(E(v) − Δ)` on the
 * head band and nothing beyond it; the published absolute rows they replace
 * are counted. Face endpoints that move the cut gain `s'(v)·E(v)` on the body
 * band. Face macro endpoints instead fade to zero at the cut, `(1 − s(v))·F`,
 * because the body macro owns the cut value of the same upstream quantity
 * (main decision C-5). E is the upstream recipe when it reproduces the stored
 * cut-sample rows; otherwise the cut-sample row carried to the vertex's loop
 * parameter (derived); an endpoint whose cut-sample rows have no source value
 * stays unavailable. Face attachment weights reaching the cut are extended the
 * same way as face rows: the source authored that weight on neck skin, so the
 * band carries it on rather than cutting it off inside the head (see the N2
 * record). Landmark rows are unchanged.
 */
export function extendHumanSourceBand(input: IHumanSourceBandInput): IHumanSourceBandExtension {
  const { generation, face, body, cut, faceRows, reader, field, sample } = input;
  const geometry = measureHumanSourceBand(generation);
  const { band, azimuth, headWeight, bodyWeight, partition, loopAzimuths } = geometry;
  const n = generation.skin.originalVertices;
  const loop = band.loopSamples;
  const transport = (values: Float64Array, width: number, theta: number, out: Float64Array): void => {
    const m = loop.length;
    let upper = 0;
    while (upper < m && loopAzimuths[upper] < theta) upper++;
    const lo = (upper - 1 + m) % m;
    const hi = upper % m;
    const span = (loopAzimuths[hi] - loopAzimuths[lo] + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI;
    const f = ((theta - loopAzimuths[lo] + 2 * Math.PI) % (2 * Math.PI)) / span;
    for (let c = 0; c < width; c++) out[c] = (1 - f) * values[width * lo + c] + f * values[width * hi + c];
  };
  const stencil = (field3: Float64Array, g: number, c: number): number => {
    const s = cut.intersections[g - n];
    return (1 - s.t) * field3[3 * s.a + c] + s.t * field3[3 * s.b + c];
  };
  const toMap = (rows: readonly number[] | undefined): Map<number, number[]> => {
    const out = new Map<number, number[]>();
    for (let i = 0; rows !== undefined && i < rows.length; i += 4) out.set(rows[i], [rows[i + 1], rows[i + 2], rows[i + 3]]);
    return out;
  };
  const toRows = (map: Map<number, number[]>): number[] =>
    [...map].filter(([, v]) => v[0] !== 0 || v[1] !== 0 || v[2] !== 0).sort((x, y) => x[0] - y[0]).flatMap(([g, v]) => [g, ...v]);
  const loopValues = (map: Map<number, number[]>): Float64Array => {
    const out = new Float64Array(3 * loop.length);
    loop.forEach((g, i) => out.set(map.get(g) ?? [0, 0, 0], 3 * i));
    return out;
  };

  const targets = { ...generation.targets };
  const records: IHumanSourceGenerationBandTarget[] = [];
  const unavailable = { ...generation.unavailable };
  const value = new Float64Array(3);

  // Body endpoints on the head band, relative to the head carry.
  const recipeOf = createHumanSourceBodyRecipes(reader, field);
  const carryIndex = body.landmarks.ids.indexOf(band.carryLandmark);
  if (carryIndex < 0) throw new Error(`The body has no ${band.carryLandmark} landmark.`);
  const carryOf = (name: string): number[] => {
    const rows = body.landmarks.targets[name] ?? [];
    for (let i = 0; i < rows.length; i += 4) if (rows[i] === carryIndex) return [rows[i + 1], rows[i + 2], rows[i + 3]];
    return [0, 0, 0];
  };
  for (const name of Object.keys(body.surfaces[0].targets)) {
    const map = toMap(targets[name]);
    const values = loopValues(map);
    const carry = carryOf(name);
    let replaced = 0;
    for (const g of [...map.keys()]) if (partition[g] === 0) {
      map.delete(g);
      replaced++;
    }
    let crossing = false;
    for (let i = 0; i < values.length; i++) if (values[i] - carry[i % 3] !== 0) crossing = true;
    if (!crossing && replaced === 0) continue;
    if (name in generation.unavailable) {
      targets[name] = toRows(map);
      records.push({ target: name, origin: "body", side: "head-band", extension: "unavailable", rows: 0, replacedRows: replaced, note: "cut-sample rows have no source value" });
      unavailable[name] = `${generation.unavailable[name]}; no band extension`;
      continue;
    }
    const recipe = recipeOf(name);
    let upstream = recipe !== null;
    if (recipe !== null)
      for (let i = 0; i < loop.length && upstream; i++)
        for (let c = 0; c < 3; c++)
          if (Math.abs(roundHalfEven(stencil(recipe.skin, loop[i], c), 6) - values[3 * i + c]) > POSITION_TOLERANCE_METRES) upstream = false;
    let rows = 0;
    for (const g of band.headBand) {
      const s = headWeight[g];
      if (s === 0) continue;
      if (upstream) for (let c = 0; c < 3; c++) value[c] = roundHalfEven(recipe!.skin[3 * g + c], 6);
      else transport(values, 3, azimuth[g], value);
      const row = [0, 1, 2].map((c) => s * (value[c] - carry[c]));
      if (row.some((x) => x !== 0)) {
        map.set(g, row);
        rows++;
      }
    }
    targets[name] = toRows(map);
    records.push({
      target: name, origin: "body", side: "head-band", extension: upstream ? "upstream" : "derived", rows, replacedRows: replaced,
      note: upstream ? `recipe ${recipe!.state}` : recipe === null ? "no upstream recipe; cut rows carried by loop parameter" : `recipe ${recipe.state} does not reproduce the stored cut rows; cut rows carried by loop parameter`,
    });
  }

  // Face endpoints on the body band; face macros fade to zero at the cut.
  const faceSkin = face.surfaces.find((s) => s.id === "Human")!;
  const faceMacros: string[] = [];
  for (const name of Object.keys(faceSkin.targets)) {
    const map = toMap(targets[name]);
    const values = loopValues(map);
    const recipe = faceRows.recipes[name];
    // A macro recipe is any state produced by macro overrides; the face and body
    // samples of one macro node are the same upstream quantity, whichever matched.
    if (recipe !== undefined && reader.state(recipe).recipe.macro !== undefined) {
      faceMacros.push(name);
      let changed = 0;
      for (const g of loop) if (map.delete(g)) changed++;
      for (const g of band.headBand) {
        const row = map.get(g);
        if (row === undefined || headWeight[g] === 0) continue;
        map.set(g, row.map((x) => (1 - headWeight[g]) * x));
        changed++;
      }
      targets[name] = toRows(map);
      records.push({ target: name, origin: "face", side: "head-band", extension: "macro-owned-by-body", rows: changed, replacedRows: changed, note: `face macro ${recipe}: zero at the cut, (1 - s) on the head band` });
      continue;
    }
    if (values.every((x) => x === 0)) continue;
    const shift = faceRows.shifts[name];
    const field3 = recipe === undefined ? null : reader.skin(recipe);
    let upstream = field3 !== null;
    if (field3 !== null)
      for (let i = 0; i < loop.length && upstream; i++)
        for (let c = 0; c < 3; c++)
          if (Math.abs(stencil(field3, loop[i], c) - shift[c] - values[3 * i + c]) > POSITION_TOLERANCE_METRES) upstream = false;
    let rows = 0;
    for (const g of band.bodyBand) {
      const s = bodyWeight[g];
      if (s === 0) continue;
      if (upstream) for (let c = 0; c < 3; c++) value[c] = field3![3 * g + c] - shift[c];
      else transport(values, 3, azimuth[g], value);
      const row = [0, 1, 2].map((c) => s * value[c]);
      if (row.some((x) => x !== 0)) {
        map.set(g, row);
        rows++;
      }
    }
    targets[name] = toRows(map);
    records.push({
      target: name, origin: "face", side: "body-band", extension: upstream ? "upstream" : "derived", rows, replacedRows: 0,
      note: upstream ? `recipe ${recipe} with its frame shift` : recipe === undefined ? "no upstream recipe; cut rows carried by loop parameter" : `recipe ${recipe} does not reproduce the stored cut rows; carried`,
    });
  }

  // Face attachment weights, re-addressed and extended over the body band.
  const attachments: IHumanSourceGenerationAttachment[] = (faceSkin.attachments ?? []).map((attachment) => {
    const weights = new Map<number, number>();
    for (let i = 0; i < attachment.rows.length; i += 2) weights.set(cut.faceToG1[attachment.rows[i]], attachment.rows[i + 1]);
    const values = Float64Array.from(loop, (g) => weights.get(g) ?? 0);
    const fresh = (x: number): number => sample.weights.attachments[x].find(([owner]) => owner === attachment.owner)?.[1] ?? 0;
    const upstream = loop.every((g, i) => {
      const s = cut.intersections[g - n];
      return Math.abs((1 - s.t) * fresh(s.a) + s.t * fresh(s.b) - values[i]) <= WEIGHT_TOLERANCE;
    });
    const one = new Float64Array(1);
    for (const g of band.bodyBand) {
      const s = bodyWeight[g];
      if (s === 0) continue;
      if (upstream) one[0] = fresh(g);
      else transport(values, 1, azimuth[g], one);
      if (s * one[0] !== 0) weights.set(g, s * one[0]);
    }
    return {
      owner: attachment.owner,
      rows: [...weights].filter(([, w]) => w !== 0).sort((x, y) => x[0] - y[0]).flatMap(([g, w]) => [g, w]),
      extension: upstream ? "upstream" : "derived",
    };
  });

  const count = (origin: string, extension: string): number => records.filter((r) => r.origin === origin && r.extension === extension).length;
  return {
    generation: {
      ...generation,
      targets,
      unavailable,
      band,
      bandTargets: records,
      attachments,
      stamps: [
        ...generation.stamps,
        { derivative: "neck band extension", authoredOn: generation.id, status: "regenerated", note: `${band.method}; head band ${band.headBand.length}, body band ${band.bodyBand.length}; body rows relative to the ${band.carryLandmark} carry` },
      ],
    },
    checks: {
      ...geometry.checks,
      bodyUpstream: count("body", "upstream"),
      bodyDerived: count("body", "derived"),
      bodyUnavailable: count("body", "unavailable"),
      faceUpstream: count("face", "upstream"),
      faceDerived: count("face", "derived"),
      faceMacrosOwnedByBody: faceMacros.join(", "),
      bandRows: records.reduce((sum, r) => sum + r.rows, 0),
      replacedPublishedRows: records.reduce((sum, r) => sum + r.replacedRows, 0),
      attachmentExtension: attachments.map((a) => `${a.owner}:${a.extension}`).join(", "),
    },
  };
}
