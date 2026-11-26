import { IAutoMovieScriptNode } from "@automovie/interface";

/**
 * The id of the beat-kind node that claims one flat
 * {@link IAutoMovieScript.beats} entry, or null when there is no tree or no node
 * claims it.
 *
 * This is the join `validateScriptTree` enforces one-to-one on a committed
 * tree, and the lookup a beat-scoped consumer such as `locateOnBeat` uses to
 * place its feedback on the screenplay graph. On a tree that has not passed
 * that validation, the first claiming node in tree order is returned.
 */
export function beatNodeOf(
  tree: readonly IAutoMovieScriptNode[] | null | undefined,
  beatId: string,
): string | null {
  if (tree === null || tree === undefined) return null;
  for (const node of tree)
    if (node.kind === "beat" && node.payload.beat === beatId) return node.id;
  return null;
}
