import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * A construction tree's admission, before any work: every node of the closed union, every view part's, join's, continuation's and trim's name used once, and every seed, continuation and trim naming a face of the right subtree (a part face or a continuation's faces a view part, a host face a view part or a join's blend). A tree that breaks one is refused whole, by a throw naming the node and the rule.
 *
 * @evidence contracts/common.md#principled-implementation Every face reference is resolved against the set of faces its own subtree builds, computed bottom-up in one recursion, so a seed, continuation or trim can only name a face that will exist where it is applied.
 * @evidence contracts/common.md#clear-and-simple-design One recursive check returns each subtree's view and face names; uniqueness, the closed union and every face reference are read from that one pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A tree that breaks a structural rule is refused whole by a throw naming the node; nothing is renamed, skipped or guessed.
 * @evidence contracts/common.md#meaningful-documentation States the four rules, which faces each reference may name and the refusal's form.
 * @evidence contracts/performance.md#efficient-algorithms One visit per node; the name sets are merged per join, linear in the names below it, so the whole admission is bounded by depth times names.
 * @evidence contracts/performance.md#reuse-equivalent-work Each subtree's sets are built once and handed to its parent instead of being recomputed per reference.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one name set per open recursion level and releases them when admission returns.
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
