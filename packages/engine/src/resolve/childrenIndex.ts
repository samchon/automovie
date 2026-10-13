import { IAutoMovieNode } from "@automovie/interface";

/** Build the parent → children adjacency the recompose walk needs. */
export const childrenIndex = (
  nodes: IAutoMovieNode[],
): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const n of nodes)
    if (n.parent !== null) {
      const siblings = map.get(n.parent);
      if (siblings !== undefined) siblings.push(n.id);
      else map.set(n.parent, [n.id]);
    }
  return map;
};
