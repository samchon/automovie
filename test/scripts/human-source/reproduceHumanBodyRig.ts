import { createHumanSourceBodyRecipes } from "./createHumanSourceBodyRecipes.ts";
import { denseHumanSourceRows } from "./denseHumanSourceRows.ts";
import { humanSourceBodyBones } from "./humanSourceBodyBones.ts";
import { measureHumanSourceError } from "./measureHumanSourceError.ts";
import { pruneHumanSourceWeights } from "./pruneHumanSourceWeights.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceLoss } from "./structures/IHumanSourceLoss.ts";
import type { IHumanSourceReproductionRow } from "./structures/IHumanSourceReproductionRow.ts";
import type { IHumanSourceRigInput } from "./structures/IHumanSourceRigInput.ts";
import type { IHumanSourceRigReproduction } from "./structures/IHumanSourceRigReproduction.ts";

/**
 * Reproduce the published body's neutral, landmarks and rig from upstream.
 *
 * - Skin and landmark neutrals against the replayed extraction neutral.
 * - Landmark endpoint rows against their recipes, micrometre-rounded.
 * - Skin weights against the extractor's four-influence storage of the
 *   interpolated `game_engine` weights, per vertex.
 * - Each joint's parent and head/tail cubes against `rig.game_engine.json`
 *   through the slot table, and its cube positions against the neutral.
 *   Frames, clinical signs, rest angles and constraints are carried: they
 *   come from the extractor's rig module and the clinical receipt, which are
 *   recoverable from Git but not replayed by this producer.
 */
export function reproduceHumanBodyRig(input: IHumanSourceRigInput): IHumanSourceRigReproduction {
  const { body, cut, reader, field, sample } = input;
  const surface = body.surfaces[0];
  const count = surface.positions.length / 3;
  const kept = cut.r16ToSource;
  const rows: IHumanSourceReproductionRow[] = [];
  const losses: IHumanSourceLoss[] = [];
  const row = (partial: Omit<IHumanSourceReproductionRow, "basis" | "p2" | "p1" | "newSupport">): void => {
    rows.push({ basis: "body", p2: null, p1: null, newSupport: "not-needed", ...partial });
  };

  // Skin neutral.
  const neutral = new Float64Array(3 * count);
  for (let v = 0; v < count; v++) for (let c = 0; c < 3; c++) neutral[3 * v + c] = field.neutral[3 * kept[v] + c];
  row(
    {
      surface: "Human",
      row: "neutral",
      role: "neutral",
      provenance: "upstream-recipe",
      recipe: "source neutral with the nipple-exclusion fill",
      regeneration: measureHumanSourceError({
        published: Float64Array.from(surface.positions),
        candidate: neutral,
        neutral: new Float64Array(3 * count),
      }),
      note: "post-extraction neutral changes are reported as residual, not replayed",
    },
  );

  // Landmarks.
  const index = new Map(sample.manifest.landmarkIds.map((id, i) => [id, i]));
  const ids = body.landmarks.ids;
  const pick = (values: Float64Array): Float64Array => {
    const out = new Float64Array(3 * ids.length);
    ids.forEach((id, i) => {
      const at = index.get(id);
      if (at === undefined) throw new Error(`Body landmark ${id} is not a sampled joint cube.`);
      for (let c = 0; c < 3; c++) out[3 * i + c] = values[3 * at + c];
    });
    return out;
  };
  const landmarkNeutral = pick(field.landmarksNeutral);
  row(
    {
      surface: "landmarks",
      row: "neutral",
      role: "neutral",
      provenance: "upstream-recipe",
      recipe: "joint-cube centroids of the default human",
      regeneration: measureHumanSourceError({
        published: Float64Array.from(body.landmarks.positions),
        candidate: landmarkNeutral,
        neutral: new Float64Array(3 * ids.length),
      }),
      note: "absolute positions",
    },
  );
  const recipeOf = createHumanSourceBodyRecipes(reader, field);
  for (const [name, published] of Object.entries(body.landmarks.targets)) {
    const d = denseHumanSourceRows(published, ids.length);
    const recipe = recipeOf(name);
    row(
      {
        surface: "landmarks",
        row: name,
        role: "landmark",
        provenance: recipe === null ? "carried-published" : "upstream-recipe",
        recipe: recipe?.state ?? null,
        regeneration:
          recipe === null
            ? null
            : measureHumanSourceError({
                published: d,
                candidate: pick(recipe.landmarks).map((x) => roundHalfEven(x, 6)),
                neutral: body.landmarks.positions,
              }),
        note: recipe === null ? "authored after extraction" : "micrometre rows",
      },
    );
  }

  // Skin weights.
  const freshWeights = sample.weights.bones.map((rows) => pruneHumanSourceWeights(rows));
  const skin = surface.skin;
  const differences = new Float64Array(3 * count);
  let unequalSlots = 0;
  for (let v = 0; v < count; v++) {
    const published = new Map<string, number>();
    for (let k = 0; k < 4; k++) {
      const w = skin.weights[4 * v + k];
      if (w !== 0) published.set(skin.joints[skin.boneIndices[4 * v + k]], (published.get(skin.joints[skin.boneIndices[4 * v + k]]) ?? 0) + w);
    }
    const fresh = new Map(freshWeights[kept[v]]);
    let worst = 0;
    for (const slot of new Set([...published.keys(), ...fresh.keys()])) {
      if (!published.has(slot) || !fresh.has(slot)) unequalSlots++;
      worst = Math.max(worst, Math.abs((published.get(slot) ?? 0) - (fresh.get(slot) ?? 0)));
    }
    differences[3 * v] = worst;
  }
  row(
    {
      surface: "Human",
      row: "skin-weights",
      role: "weights",
      provenance: "upstream-recipe",
      recipe: "weights.game_engine.json interpolated through the subdivision, four influences, 1e-7 storage",
      regeneration: measureHumanSourceError({
        published: new Float64Array(3 * count),
        candidate: differences,
        neutral: new Float64Array(3 * count),
      }),
      note: `dimensionless; per-vertex largest weight difference; ${unequalSlots} slot memberships differ`,
    },
  );

  // Joints.
  for (const joint of body.joints) {
    const bone = input.gameEngineRig[humanSourceBodyBones[joint.bone]];
    const parentBone = joint.parent === null ? null : humanSourceBodyBones[joint.parent];
    const identical =
      bone !== undefined &&
      bone.head.cube_name === joint.head &&
      bone.tail.cube_name === joint.tail &&
      (parentBone === null || bone.parent === parentBone);
    const ends = [joint.head, joint.tail];
    const publishedEnds = new Float64Array(6);
    const freshEnds = new Float64Array(6);
    ends.forEach((cube, e) => {
      const p = ids.indexOf(cube);
      for (let c = 0; c < 3; c++) {
        publishedEnds[3 * e + c] = body.landmarks.positions[3 * p + c];
        freshEnds[3 * e + c] = landmarkNeutral[3 * p + c];
      }
    });
    row(
      {
        surface: "joints",
        row: joint.bone,
        role: "joint",
        provenance: identical ? "upstream-recipe" : "carried-published",
        recipe: identical ? `rig.game_engine.json ${humanSourceBodyBones[joint.bone]}` : null,
        regeneration: measureHumanSourceError({ published: publishedEnds, candidate: freshEnds, neutral: new Float64Array(6) }),
        note: identical
          ? "parent and head/tail cubes equal upstream; frame, signs, rest angles and constraint carried"
          : "joint identity differs from upstream; carried",
      },
    );
    if (!identical)
      losses.push({
        basis: "body",
        surface: "joints",
        row: joint.bone,
        kind: "not-regenerated-from-upstream",
        vertices: 0,
        maximumMetres: 0,
        reason: "joint parent or cubes differ from rig.game_engine.json",
      });
  }
  return {
    rows,
    losses,
    freshWeights,
    checks: { joints: body.joints.length, landmarkIds: ids.length, weightSlotMembershipDifferences: unequalSlots },
  };
}
