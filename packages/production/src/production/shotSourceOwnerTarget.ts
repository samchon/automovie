import { IAutoMovieScreenplayIndex, IAutoMovieShotContract, type IAutoMovieSceneEvidence, type IAutoMovieScreenplayScene } from "@automovie/interface";

/**
 * Resolve a contract to one distinct active-scene owner address. A missing index, no active citation or multiple distinct addresses returns undefined for the caller's source-owner admission.
 *
 * @evidence contracts/common.md#principled-implementation An exact scene-id map resolves citations and a set deduplicates path-plus-lowercase-id addresses. The path falls back to the screenplay path; only active scene records participate.
 * @evidence contracts/common.md#clear-and-simple-design This address projection feeds source-owner binding, while the binding gate owns reviewed citation admission and current source digest checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambiguous ownership is left unresolved rather than selecting the first citation; tombstones and unknown ids do not manufacture owner addresses.
 * @evidence contracts/common.md#meaningful-documentation States active-scene filtering, lowercase fragment construction, path fallback, address deduplication and the undefined result for missing or ambiguous ownership.
 * @evidence contracts/performance.md#efficient-algorithms Building the scene map costs O(S) and projecting C citations costs O(C) expected lookup work plus address string lengths; map/set/array storage scales with S and distinct cited addresses.
 * @evidence contracts/performance.md#reuse-equivalent-work One map serves all citations in this call. Each contract call rebuilds it, including callers sharing the same screenplay; no cross-shot cache is present and that repeated cost remains.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The inputs are borrowed; temporary indices expire on return and only an optional address string escapes. No file, renderer, task or retained owner binding is acquired.
 */
export const shotSourceOwnerTarget: (contract: IAutoMovieShotContract, screenplay: IAutoMovieScreenplayIndex | null) => string | undefined = (
  contract: IAutoMovieShotContract,
  screenplay: IAutoMovieScreenplayIndex | null,
): string | undefined => {
  if (screenplay === null) return undefined;
  const scenes: Map<string, IAutoMovieScreenplayScene> = new Map(
    screenplay.screenplay.scenes.map((scene: IAutoMovieScreenplayScene) : readonly [string, IAutoMovieScreenplayScene] => [scene.id, scene] as const),
  );
  const targets: string[] = [
    ...new Set(
      (contract.evidence ?? []).flatMap((citation: IAutoMovieSceneEvidence) : string[] => {
        const scene: IAutoMovieScreenplayScene | undefined = scenes.get(citation.scene);
        if (scene === undefined || scene.status !== "active") return [];
        return [
          `${scene.path ?? screenplay.screenplay.path}#${scene.id.toLowerCase()}`,
        ];
      }),
    ),
  ];
  return targets.length === 1 ? targets[0] : undefined;
};
