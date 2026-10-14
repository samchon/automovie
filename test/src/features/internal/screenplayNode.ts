import { IAutoMovieScriptNode } from "@automovie/interface";

/** Create a fresh script node with null temporal metadata and a fresh interaction list before applying caller fields; nested supplied payloads remain borrowed. */
export const screenplayNode: (
  partial: Omit<IAutoMovieScriptNode, "temporal" | "interactsWith">,
) => IAutoMovieScriptNode = (
  partial: Omit<IAutoMovieScriptNode, "temporal" | "interactsWith">,
): IAutoMovieScriptNode =>
  ({ temporal: null, interactsWith: [], ...partial }) as IAutoMovieScriptNode;
