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
  if (node.type === "intent") return [node.intent];
  if (node.type === "at") return compositionIntents(node.part);
  return node.parts.flatMap(compositionIntents);
}
