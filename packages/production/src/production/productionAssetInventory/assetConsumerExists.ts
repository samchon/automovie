import { type IAutoMovieExternalMotionAdoption, IAutoMovieAssetProvenance, IAutoMovieModelRecipe } from "@automovie/interface";

import { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";

/**
 * Check graph-addressable consumer bindings and delegate consumers whose reverse gates need compiled data.
 *
 * @evidence contracts/common.md#principled-implementation Recipe, resource, proxy, adoption and rendition references use actual graph/ledger membership; audio, design-reference, texture and scene-environment cases defer to their named later gates.
 * @evidence contracts/common.md#clear-and-simple-design The design graph answers only its owned relationships, avoiding a second incomplete compiled-consumer inventory here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deferred true is a delegation marker, not proof those consumers exist. The full builder must run audio, design-reference and texture/environment reverse gates before accepting them.
 * @evidence contracts/common.md#meaningful-documentation Lists graph-owned versus deferred consumer kinds and the caller's remaining gate obligation.
 * @evidence contracts/performance.md#efficient-algorithms Map membership is expected constant work; resource ownership searches records and recipes, while proxy/adoption checks scan their actual declared populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses supplied graph/ledger facts without caching a deferred case as a completed consumer verification.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a boolean without retaining graph, record, byte or task ownership.
 *
 * @author Samchon
 */
export function assetConsumerExists(
  graph: IAutoMovieProductionDesignGraph,
  records: readonly IAutoMovieAssetProvenance[],
  assetPath: string,
  consumer: IAutoMovieAssetProvenance["uses"][number]["consumer"],
): boolean {
  switch (consumer.kind) {
    case "audio-cue":
      return true;
    case "model-recipe":
      return graph.models.get(consumer.id)?.asset === assetPath;
    case "model-resource": {
      const owner: IAutoMovieAssetProvenance | undefined = records.find((record: IAutoMovieAssetProvenance) : boolean => record.path === consumer.id);
      return (
        owner?.model !== undefined &&
        assetPath !== owner.path &&
        [...graph.models.values()].some((model: IAutoMovieModelRecipe) : boolean => model.asset === owner.path)
      );
    }
    case "model-proxy": {
      const owner: IAutoMovieAssetProvenance | undefined = records.find((record: IAutoMovieAssetProvenance) : boolean => record.path === consumer.id);
      return (
        owner?.model !== undefined &&
        [owner.model.collisionProxy, owner.model.measurementProxy].some(
          (reference: { kind: "asset"; asset: string; } | ({ kind: "generated"; } & { recipe: "capsule-v1"; parameters: { radius: number; height: number; }; }) | ({ kind: "generated"; } & { recipe: "box-v1"; parameters: { width: number; height: number; depth: number; }; }) | ({ kind: "generated"; } & { recipe: "humanoid-landmarks-v1"; parameters: { height: number; shoulderWidth: number; hipWidth: number; }; })) : boolean =>
            reference.kind === "asset" && reference.asset === assetPath,
        )
      );
    }
    case "motion-resource": {
      const owner: IAutoMovieAssetProvenance | undefined = records.find((record: IAutoMovieAssetProvenance) : boolean => record.path === consumer.id);
      return owner?.motion !== undefined && assetPath !== owner.path;
    }
    case "motion-adoption":
      return (
        graph.production?.externalMotions?.some(
          (adoption: IAutoMovieExternalMotionAdoption) : boolean =>
            adoption.id === consumer.id && adoption.asset === assetPath,
        ) === true
      );
    case "rendition-reference":
      return graph.shots.has(consumer.id);
    // Like an audio cue, the reverse binding is owned by the consumer's own
    // gate: `designReferenceDiagnostics` refuses a document whose asset carries
    // no matching use, and refuses a use naming no declared document.
    case "design-reference":
      return true;
    // Same delegation, for the same reason: a texture use is keyed by the
    // compiled model id rather than a recipe id, and a scene environment is not
    // in the design graph at all, so this graph cannot answer either question.
    // `validateTextureAssets` sees the compiled models and scenes and reports
    // both directions -- an image bound by no authorized use, and a use no
    // compiled consumer binds any more -- so answering `false` here would
    // double-report the same fault at a less specific path.
    case "material-texture":
    case "scene-environment":
      return true;
  }
}
