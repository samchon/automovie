import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * A construction tree's admission, before any work: every node of the closed union, every view part's, join's, continuation's and trim's name used once, and every seed, continuation and trim naming a face of the right subtree (a part face or a continuation's faces a view part, a host face a view part or a join's blend). A tree that breaks one is refused whole, by a throw naming the node and the rule.
 */
export namespace AutoMovieConstructionAdmission {
  /**
   * Admit a tree.
   *
   * @param root The tree's root node.
   * @throws When the tree breaks a rule, naming the node and the rule.
   */
  export function admit(root: AutoMovieConstructionNode): void {
    const seen: Set<string> = new Set();
    const check = (node: AutoMovieConstructionNode): { views: Set<string>; faces: Set<string> } => {
      const name: string = (node as { name?: unknown }).name as string;
      if (typeof name !== "string") throw new Error("realizeAutoMovieConstruction: a node has no name");
      if (seen.has(name)) throw new Error(`realizeAutoMovieConstruction: the name ${name} is used twice`);
      seen.add(name);
      const need = (set: Set<string>, face: string, what: string): void => {
        if (!set.has(face)) throw new Error(`realizeAutoMovieConstruction: ${name}'s ${what} ${face} is not a face of its subtree`);
      };
      switch (node.type) {
        case "view":
          return { views: new Set([name]), faces: new Set([name]) };
        case "join": {
          const host = check(node.host);
          const part = check(node.part);
          need(part.views, node.seed.partFace, "part face");
          need(host.faces, node.seed.hostFace, "host face");
          return { views: union(host.views, part.views), faces: union(union(host.faces, part.faces), new Set([name])) };
        }
        case "continue": {
          const host = check(node.host);
          const part = check(node.part);
          need(host.views, node.hostFace, "host face");
          need(part.views, node.partFace, "part face");
          return { views: union(host.views, part.views), faces: union(host.faces, part.faces) };
        }
        case "trim": {
          const host = check(node.host);
          need(host.faces, node.face, "face");
          return host;
        }
        default:
          throw new Error(`realizeAutoMovieConstruction: ${name} has the unknown type ${(node as { type?: unknown }).type as string}`);
      }
    };
    check(root);
  }

  /** The union of two name sets. */
  function union(a: ReadonlySet<string>, b: ReadonlySet<string>): Set<string> {
    return new Set([...a, ...b]);
  }
}
