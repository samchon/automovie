import { createHumanSourceBodyRecipes } from "./createHumanSourceBodyRecipes.ts";
import { denseHumanSourceRows } from "./denseHumanSourceRows.ts";
import { pruneHumanSourceWeights } from "./pruneHumanSourceWeights.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceStageInput } from "./structures/IHumanSourceStageInput.ts";

/**
 * Compare the upstream replay with one historical body publication: every
 * recipe endpoint and landmark row, the neutral and the skin weights. Against
 * the extraction-stage publication this separates sampling reproduction from
 * the later stages that changed the published rows.
 */
export function compareHumanSourceBodyStage(input: IHumanSourceStageInput): Record<string, number | boolean | string> {
  const { stage, cut, reader, field, sample } = input;
  const surface = stage.surfaces[0];
  const count = surface.positions.length / 3;
  const kept = cut.r16ToSource;
  if (count !== kept.length) throw new Error(`Stage ${stage.id} does not share the published body vertices.`);
  const recipeOf = createHumanSourceBodyRecipes(reader, field);
  let endpoints = 0;
  let exact = 0;
  let worst = 0;
  const differing: [string, number][] = [];
  for (const [name, rows] of Object.entries(surface.targets)) {
    const recipe = recipeOf(name);
    if (recipe === null) continue;
    endpoints++;
    const d = denseHumanSourceRows(rows, count);
    let max = 0;
    for (let v = 0; v < count; v++) {
      const e = Math.hypot(
        roundHalfEven(recipe.skin[3 * kept[v]], 6) - d[3 * v],
        roundHalfEven(recipe.skin[3 * kept[v] + 1], 6) - d[3 * v + 1],
        roundHalfEven(recipe.skin[3 * kept[v] + 2], 6) - d[3 * v + 2],
      );
      max = Math.max(max, e);
    }
    if (max === 0) exact++;
    else differing.push([name, max]);
    worst = Math.max(worst, max);
  }
  const index = new Map(sample.manifest.landmarkIds.map((id, i) => [id, i]));
  let landmarkRows = 0;
  let landmarkExact = 0;
  for (const [name, rows] of Object.entries(stage.landmarks.targets)) {
    const recipe = recipeOf(name);
    if (recipe === null) continue;
    landmarkRows++;
    const d = denseHumanSourceRows(rows, stage.landmarks.ids.length);
    const same = stage.landmarks.ids.every((id, i) =>
      [0, 1, 2].every((c) => roundHalfEven(recipe.landmarks[3 * index.get(id)! + c], 6) === d[3 * i + c]),
    );
    if (same) landmarkExact++;
  }
  let neutral = 0;
  for (let v = 0; v < count; v++)
    neutral = Math.max(
      neutral,
      Math.hypot(...[0, 1, 2].map((c) => field.neutral[3 * kept[v] + c] - surface.positions[3 * v + c])),
    );
  let weights = 0;
  for (let v = 0; v < count; v++) {
    const fresh = new Map(pruneHumanSourceWeights(sample.weights.bones[kept[v]]));
    for (let k = 0; k < 4; k++) {
      const w = surface.skin.weights[4 * v + k];
      if (w === 0) continue;
      weights = Math.max(weights, Math.abs((fresh.get(surface.skin.joints[surface.skin.boneIndices[4 * v + k]]) ?? 0) - w));
    }
  }
  differing.sort((x, y) => y[1] - x[1]);
  return {
    basis: stage.id,
    revision: input.revision,
    recipeEndpoints: endpoints,
    exactEndpoints: exact,
    worstEndpointMetres: worst,
    worstEndpoints: differing.slice(0, 8).map(([n, e]) => `${n}=${e.toExponential(2)}`).join(", "),
    recipeLandmarkRows: landmarkRows,
    exactLandmarkRows: landmarkExact,
    neutralMaximumMetres: neutral,
    weightMaximumDifference: weights,
  };
}
