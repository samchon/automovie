import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";

/**
 * The intents a composition holds, in the order its nodes name them: a
 * sequence's and a parallel's parts in turn, an anchored part's own.
 *
 * @param node The composition.
 * @returns Its intents.
 */
export function compositionIntents(
  node: IAutoMovieComposition,
): IAutoMovieIntent[] {
  if (node.kind === "intent") return [node.intent];
  if (node.kind === "at") return compositionIntents(node.part);
  return node.parts.flatMap(compositionIntents);
}
