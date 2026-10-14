import { type IAutoMovieNode } from "@automovie/interface";

/** Index the existing driver fixtures by id in supplied order, retaining their records and Map's duplicate-key semantics. */
export function indexDriverNodes(...nodes: IAutoMovieNode[]): Map<string, IAutoMovieNode> {
  return new Map(nodes.map((node: IAutoMovieNode): [string, IAutoMovieNode] => [node.id, node]));
}
