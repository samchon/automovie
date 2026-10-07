import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IHumanSourceGuideRecipe } from "./structures/IHumanSourceGuideRecipe.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";
import { defineHumanSourceHeadSampleSelections } from "./defineHumanSourceHeadSampleSelections.ts";

/** Derive complete head/native correspondence from its pinned historical host.
 * The author selects anatomical names, not a large literal vertex table. The
 * historical partition owns every native ID; its point array owns the original
 * most-anterior support. This reproduces source conventions, not clinical
 * anatomy. Later source authoring must retain or readdress their true lineage.
 * Filled ears come from the historical head; sparse supports come from their
 * maintained selection owner and its pinned native mirror, not absent regions
 * in an older artifact. Their acquisition and qualification remain distinct.
 * @author Samchon
 */
export function deriveHumanSourceHeadGuides(head: IAutoMovieHumanPersonHeadView,
  recipe: IHumanSourceGuideRecipe, mirror: IHumanSourceMirror): ReadonlyMap<string, unknown> {
  const index = head.face.surfaces.findIndex((surface) => surface.id === "Human");
  const skin = head.face.surfaces[index], partition = skin?.sourcePartition;
  if (recipe.schema !== "automovie-source-guide-recipe/1" || partition === undefined ||
      partition.generation !== head.id || partition.samples.length * 3 !== skin.positions.length ||
      !Number.isSafeInteger(partition.originalVertices) || partition.originalVertices < 1)
    throw new Error("Source guide derivation requires its complete historical native partition.");
  const nativeVertices = partition.samples.flatMap((sample, vertex) => {
    if (!Number.isSafeInteger(sample) || sample < 0 || sample > 0x7fffffff)
      throw new Error("Historical source guide sample cannot be represented by its native correspondence owner.");
    return sample < partition.originalVertices ? [vertex] : [];
  });
  const headNativeIds = [...new Set(nativeVertices.map((vertex) => partition.samples[vertex]))].sort((a, b) => a - b);
  if (headNativeIds.length === 0 || skin.positions.some((value) => !Number.isFinite(value)))
    throw new Error("Historical head source has no finite native population.");
  const landmarks = (names: readonly string[]): Record<string, number> => Object.fromEntries(names.map((name) => {
    const point = head.face.skinLandmarks?.[name];
    if (point === undefined || point.surface !== index || !Number.isSafeInteger(point.vertex) || point.vertex < 0 || point.vertex >= partition.samples.length)
      throw new Error(`Source guide landmark ${name} has no exact historical correspondence.`);
    const native = partition.samples[point.vertex];
    if (native >= partition.originalVertices) throw new Error(`Source guide landmark ${name} is not an original native point.`);
    return [name, native];
  }));
  const base = { schema: "automovie-head-source-guide/1", sourceRevision: recipe.revision,
    sourceLogicalPath: recipe.headPath, sourceBlobSha256: recipe.headSha256, basis: head.id,
    originalNativeCount: partition.originalVertices, headNativeIds,
    landmarkNativeIds: landmarks(recipe.baseLandmarks),
    qualification: "Original tracked G1 native correspondence; fixed source landmarks are not reconstructed personal measurements." };
  const anterior = nativeVertices.reduce((best, vertex) => skin.positions[3 * vertex + 2] > skin.positions[3 * best + 2] ? vertex : best);
  const regions = recipe.earRegions.map((name) => {
    const region = head.face.skinRegions?.[name];
    if (region === undefined || region.surface !== index)
      throw new Error(`Source guide region ${name} has no exact historical skin owner.`);
    const samples = region.vertices.map((vertex) => {
      if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= partition.samples.length)
        throw new Error(`Source guide region ${name} has an invalid historical vertex.`);
      return partition.samples[vertex];
    });
    return { name, nativeSamples: [...new Set(samples.filter((sample) => sample < partition.originalVertices))].sort((a, b) => a - b),
      derivedSamples: [...new Set(samples.filter((sample) => sample >= partition.originalVertices))].sort((a, b) => a - b),
      qualification: "Historical filled region; its authored attachment reading does not establish a clinical boundary." };
  });
  const selections = defineHumanSourceHeadSampleSelections({ mirror, faceToG1: Int32Array.from(partition.samples) });
  const selectedNames = new Set(recipe.sampleRegions);
  if (selectedNames.size !== recipe.sampleRegions.length ||
      regions.some((region) => selectedNames.has(region.name)) ||
      selectedNames.size !== selections.records.length ||
      selections.records.some((record) => !selectedNames.has(record.name)))
    throw new Error("Source guide sparse recipe must name exactly the maintained sample-selection population.");
  for (const record of selections.records) regions.push({ name: record.name,
    nativeSamples: [...record.originalVertices].sort((a, b) => a - b), derivedSamples: [],
    qualification: `${record.definition} ${record.rule} ${record.uncertainty}` });
  return new Map<string, unknown>([["head-source-guide.json", base], ["head-source-guide-nasal.json", {
    ...base, landmarkNativeIds: { ...base.landmarkNativeIds, ...landmarks(recipe.nasalLandmarks) },
    nasalTipNativeSupport: partition.samples[anterior],
    nasalTipQualification: "Original native most-anterior source support; not per-shape clinical pronasale.",
  }], ["ear-source-region-guide.json", { schema: "automovie-derived-ear-source-regions/1",
    generation: head.id, originalNativeCount: partition.originalVertices, regions,
    sourceRevision: recipe.revision, sourceLogicalPath: recipe.headPath, sourceBlobSha256: recipe.headSha256,
    qualification: "Historical filled ears and maintained sparse native selections retain separate authorities; replacement ports require the same native cell incidence and inherited attachment loops.",
    sparseSelectionReadings: selections.records }]]);
}
