import { createHumanSourceFaceRecipeCandidates } from "./createHumanSourceFaceRecipeCandidates.ts";
import { denseHumanSourceRows } from "./denseHumanSourceRows.ts";
import { measureHumanSourceError } from "./measureHumanSourceError.ts";
import { recoverHumanSourceFaceRecipe } from "./recoverHumanSourceFaceRecipe.ts";
import type { IHumanSourceFaceInput } from "./structures/IHumanSourceFaceInput.ts";
import type { IHumanSourceFaceReproduction } from "./structures/IHumanSourceFaceReproduction.ts";
import type { IHumanSourceLoss } from "./structures/IHumanSourceLoss.ts";
import type { IHumanSourceReproductionError } from "./structures/IHumanSourceReproductionError.ts";
import type { IHumanSourceReproductionRow } from "./structures/IHumanSourceReproductionRow.ts";

/**
 * Reproduce the published face on the source generation.
 *
 * Carry: every face skin vertex is a source vertex or a W sample, so each
 * skin endpoint is stored at its one-skin id unchanged; the map's injectivity
 * is checked once and makes the carry exact for every row.
 *
 * Regeneration: the deleted recipe recovery's rule
 * (`67b7d53e6^:face_extraction/recipes.py`). A published endpoint D is one
 * sampled state C evaluated through the same cut stencil minus one common
 * frame shift (the extraction subtracted the binocular eye-centroid change
 * from every vertex), so the shift is `mean(C - D)` over all skin vertices and
 * the residual `max |C - D - shift|`. The best state over every sampled
 * candidate is found exactly (a candidate stops once it cannot beat the best);
 * a row is upstream-reproduced only when that residual is within tolerance,
 * otherwise it stays carried and is listed, never zero-filled.
 */
export function reproduceHumanFaceRows(
  input: IHumanSourceFaceInput,
): IHumanSourceFaceReproduction {
  const { face, cut, reader, sample } = input;
  const human = face.surfaces.find((s) => s.id === "Human");
  if (human === undefined)
    throw new Error("The published face has no Human skin.");
  const count = human.positions.length / 3;
  const samples = cut.faceSamples;
  if (samples.length !== count)
    throw new Error("The face cut does not describe the published skin.");
  if (new Set(cut.faceToG1).size !== count)
    throw new Error("Two face vertices share one one-skin id.");
  const atFace = (source: Float64Array): Float64Array => {
    const out = new Float64Array(3 * count);
    for (let v = 0; v < count; v++) {
      const { a, b, t } = samples[v];
      for (let c = 0; c < 3; c++)
        out[3 * v + c] =
          a === b
            ? source[3 * a + c]
            : (1 - t) * source[3 * a + c] + t * source[3 * b + c];
    }
    return out;
  };

  const candidates = createHumanSourceFaceRecipeCandidates(cut, reader, sample);
  const correctiveTargets = new Set(
    (face.correctives ?? []).map((c) => c.target),
  );
  const rows: IHumanSourceReproductionRow[] = [];
  const losses: IHumanSourceLoss[] = [];
  const recipes: Record<string, string> = {};
  const shifts = new Map<string, number[]>();
  const g1Targets: Record<string, number[]> = {};

  for (const [name, published] of Object.entries(human.targets)) {
    const d = denseHumanSourceRows(published, count);
    const order: number[] = [];
    for (let v = 0; v < count; v++)
      if (d[3 * v] !== 0 || d[3 * v + 1] !== 0 || d[3 * v + 2] !== 0)
        order.push(v);
    const support = order.length;
    const match = recoverHumanSourceFaceRecipe(d, candidates);
    const best = match.maximumMetres,
      bestName = match.state,
      bestShift = match.shiftMetres;
    const matched = best <= input.tolerance;
    const role = correctiveTargets.has(name)
      ? "corrective"
      : "channel-endpoint";
    let regeneration: IHumanSourceReproductionError | null = null;
    if (matched) {
      const c = candidates.find((x) => x.name === bestName)!.field;
      const regenerated = new Float64Array(3 * count);
      for (let i = 0; i < regenerated.length; i++)
        regenerated[i] = c[i] - bestShift[i % 3];
      regeneration = measureHumanSourceError({
        published: d,
        candidate: regenerated,
        neutral: human.positions,
      });
      recipes[name] = bestName;
      shifts.set(name, bestShift);
    } else {
      let magnitude = 0;
      for (let v = 0; v < count; v++)
        magnitude = Math.max(
          magnitude,
          Math.hypot(d[3 * v], d[3 * v + 1], d[3 * v + 2]),
        );
      losses.push({
        basis: "face",
        surface: "Human",
        row: name,
        kind: "not-regenerated-from-upstream",
        vertices: support,
        maximumMetres: magnitude,
        reason: `nearest sampled state ${bestName} leaves ${best.toExponential(3)} m after its frame shift; value carried from the published face`,
      });
    }
    rows.push({
      basis: "face",
      surface: "Human",
      row: name,
      role,
      provenance: matched ? "upstream-recipe" : "carried-published",
      recipe: matched ? bestName : null,
      regeneration,
      p2: null,
      p1: null,
      newSupport: "not-needed",
      note: matched
        ? `shift [${bestShift.map((x) => x.toExponential(3)).join(", ")}] m`
        : `best residual ${best.toExponential(3)} m against ${bestName}`,
    });
    const g1: [number, number][] = [];
    for (let i = 0; i < published.length; i += 4)
      g1.push([cut.faceToG1[published[i]], i]);
    g1.sort((x, y) => x[0] - y[0]);
    g1Targets[name] = g1.flatMap(([g, i]) => [
      g,
      published[i + 1],
      published[i + 2],
      published[i + 3],
    ]);
  }

  // Landmarks: published rows against the matched recipe's joint-cube delta.
  const landmarkIndex = new Map(
    sample.manifest.landmarkIds.map((id, i) => [id, i]),
  );
  if (face.landmarks !== undefined) {
    const ids = face.landmarks.ids;
    const neutral = new Float64Array(3 * ids.length);
    ids.forEach((id, i) => {
      const at = landmarkIndex.get(id);
      if (at === undefined)
        throw new Error(`Face landmark ${id} is not a sampled joint cube.`);
      for (let c = 0; c < 3; c++)
        neutral[3 * i + c] = input.landmarksNeutral[3 * at + c];
    });
    rows.push({
      basis: "face",
      surface: "landmarks",
      row: "neutral",
      role: "neutral",
      provenance: "upstream-recipe",
      recipe: "joint-cube centroids of the default human",
      regeneration: measureHumanSourceError({
        published: Float64Array.from(face.landmarks.positions),
        candidate: neutral,
        neutral: new Float64Array(3 * ids.length),
      }),
      p2: null,
      p1: null,
      newSupport: "not-needed",
      note: "absolute positions compared; a constant difference is a frame translation, not a shape change",
    });
    for (const [name, published] of Object.entries(face.landmarks.targets)) {
      const d = denseHumanSourceRows(published, ids.length);
      const recipe = recipes[name];
      let regeneration: IHumanSourceReproductionError | null = null;
      if (recipe !== undefined) {
        const l = reader.landmarks(recipe);
        const shift = shifts.get(name)!;
        const regenerated = new Float64Array(3 * ids.length);
        ids.forEach((id, i) => {
          for (let c = 0; c < 3; c++)
            regenerated[3 * i + c] =
              l[3 * landmarkIndex.get(id)! + c] - shift[c];
        });
        regeneration = measureHumanSourceError({
          published: d,
          candidate: regenerated,
          neutral: face.landmarks!.positions,
        });
      }
      rows.push({
        basis: "face",
        surface: "landmarks",
        row: name,
        role: "landmark",
        provenance:
          recipe === undefined ? "carried-published" : "upstream-recipe",
        recipe: recipe ?? null,
        regeneration,
        p2: null,
        p1: null,
        newSupport: "not-needed",
        note:
          recipe === undefined
            ? "skin endpoint has no upstream recipe"
            : "skin recipe and frame shift reused",
      });
    }
  }

  // Neutral: source plus the recorded chin bake, through the cut stencil.
  const chin = reader.has("chin/chin-height-incr")
    ? atFace(reader.skin("chin/chin-height-incr"))
    : null;
  const sourceNeutral = atFace(input.topology.positions);
  const freshNeutral = new Float64Array(3 * count);
  for (let i = 0; i < freshNeutral.length; i++)
    freshNeutral[i] =
      sourceNeutral[i] + (chin === null ? 0 : input.chinFactor * chin[i]);
  rows.push({
    basis: "face",
    surface: "Human",
    row: "neutral",
    role: "neutral",
    provenance: "upstream-recipe",
    recipe: "source neutral + lower-face chin bake",
    regeneration: measureHumanSourceError({
      published: Float64Array.from(human.positions),
      candidate: freshNeutral,
      neutral: new Float64Array(3 * count),
    }),
    p2: null,
    p1: null,
    newSupport: "not-needed",
    note: "later neutral bakes (cranial breadth and others) are not replayed here; their residual is reported, not hidden",
  });

  // Jaw attachment weights against the default-rig subtree sums.
  for (const attachment of human.attachments ?? []) {
    const published = new Float64Array(count);
    for (let i = 0; i < attachment.rows.length; i += 2)
      published[attachment.rows[i]] = attachment.rows[i + 1];
    const fresh = new Float64Array(count);
    const weightOf = (v: number): number =>
      sample.weights.attachments[v].find(
        ([owner]) => owner === attachment.owner,
      )?.[1] ?? 0;
    for (let v = 0; v < count; v++) {
      const { a, b, t } = samples[v];
      fresh[v] =
        a === b ? weightOf(a) : (1 - t) * weightOf(a) + t * weightOf(b);
    }
    const expand = (w: Float64Array): Float64Array =>
      Float64Array.from({ length: 3 * count }, (_, i) =>
        i % 3 === 0 ? w[i / 3] : 0,
      );
    rows.push({
      basis: "face",
      surface: "Human",
      row: `attachment:${attachment.owner}`,
      role: "attachment",
      provenance: "upstream-recipe",
      recipe:
        "weights.default.json subtree sum interpolated through the subdivision",
      regeneration: measureHumanSourceError({
        published: expand(published),
        candidate: expand(fresh),
        neutral: new Float64Array(3 * count),
      }),
      p2: null,
      p1: null,
      newSupport: "not-needed",
      note: "dimensionless weights in the metre fields",
    });
  }

  // Attached parts: carried verbatim; their fitting producer is not in the repository.
  for (const surface of face.surfaces) {
    if (surface.id === "Human") continue;
    for (const [name, published] of Object.entries(surface.targets)) {
      let magnitude = 0;
      for (let i = 0; i < published.length; i += 4)
        magnitude = Math.max(
          magnitude,
          Math.hypot(published[i + 1], published[i + 2], published[i + 3]),
        );
      rows.push({
        basis: "face",
        surface: surface.id,
        row: name,
        role: "part-endpoint",
        provenance: "carried-part",
        recipe: null,
        regeneration: null,
        p2: null,
        p1: null,
        newSupport: "not-needed",
        note: "part carried verbatim",
      });
      losses.push({
        basis: "face",
        surface: surface.id,
        row: name,
        kind: "part-not-regenerated",
        vertices: published.length / 4,
        maximumMetres: magnitude,
        reason:
          "the face extractor and its source .blend were never tracked; part fitting must be reimplemented",
      });
    }
  }
  return {
    rows,
    losses,
    g1Targets,
    recipes,
    shifts: Object.fromEntries(shifts),
    checks: {
      faceSkinVertices: count,
      faceToG1Injective: true,
      candidates: candidates.length,
      chinStateSampled: chin !== null,
    },
  };
}
