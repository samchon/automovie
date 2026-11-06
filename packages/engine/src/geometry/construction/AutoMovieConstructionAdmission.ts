import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * A construction tree's admission, before any work: every node of the closed union, every view part's, join's, continuation's and trim's name used once, and every seed, continuation and trim naming a face of the right subtree (a part face or a continuation's faces a view part, a host face a view part or a join's blend). A tree that breaks one is refused whole, by a throw naming the node and the rule.
 *
 * @evidence contracts/common.md#principled-implementation Bottom-up name sets admit only references to faces structurally produced by the required subtree; later geometric failures can still prevent those faces from being realized.
 * @evidence contracts/common.md#clear-and-simple-design One recursive check returns each subtree's view and face names; uniqueness, the closed union and every face reference are read from that one pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A tree that breaks a structural rule is refused whole by a throw naming the node; nothing is renamed, skipped or guessed.
 * @evidence contracts/common.md#meaningful-documentation States the four rules, which faces each reference may name and the refusal's form.
 * @evidence contracts/performance.md#efficient-algorithms One visit per node; the name sets are merged per join, linear in the names below it, so the whole admission is bounded by depth times names.
 * @evidence contracts/performance.md#reuse-equivalent-work Each subtree's sets are built once and handed to its parent instead of being recomputed per reference.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns a global seen set, open recursion frames and child/union view-face sets; none remains retained by this module after return or throw.
 */
export namespace AutoMovieConstructionAdmission {
  /**
   * Admit a tree.
   *
   * @param root The tree's root node.
   * @throws When the tree breaks a rule, naming the node and the rule.
   *
   * @evidence contracts/common.md#principled-implementation Recursively builds each subtree's view/face name sets and checks references against the required side; one global seen set rejects repeated names before descending further.
   * @evidence contracts/common.md#clear-and-simple-design A single structural walk owns union-kind, name-uniqueness and subtree-reference admission before realization mutates a body.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects the listed structural failures by throwing; this is not complete numeric/shape-field validation, which the typed node operators perform separately.
   * @evidence contracts/common.md#meaningful-documentation Gives the subtree naming rules, the pre-realization role and the node/rule failure form.
   * @evidence contracts/performance.md#efficient-algorithms For N nodes and depth D, copying descendant name sets costs O(ND) work in the worst case, including quadratic work for a skewed tree; no linear-total claim is made.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes each subtree's two sets once and reuses them for reference checks and the parent union rather than rewalking that subtree per reference.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The seen set, returned child sets, union temporaries and recursion stack are owned by this synchronous call and become unreachable on return/throw; no tree or name cache survives.
   */
  export function admit(root: AutoMovieConstructionNode): void {
    const seen: Set<string> = new Set();
    const check = (
      node: AutoMovieConstructionNode,
    ): { views: Set<string>; faces: Set<string> } => {
      const name: string = (node as { name?: unknown }).name as string;
      if (typeof name !== "string")
        throw new Error("realizeAutoMovieConstruction: a node has no name");
      if (seen.has(name))
        throw new Error(
          `realizeAutoMovieConstruction: the name ${name} is used twice`,
        );
      seen.add(name);
      const need = (set: Set<string>, face: string, what: string): void => {
        if (!set.has(face))
          throw new Error(
            `realizeAutoMovieConstruction: ${name}'s ${what} ${face} is not a face of its subtree`,
          );
      };
      switch (node.type) {
        case "view":
          return { views: new Set([name]), faces: new Set([name]) };
        case "join": {
          const host = check(node.host);
          const part = check(node.part);
          need(part.views, node.seed.partFace, "part face");
          need(host.faces, node.seed.hostFace, "host face");
          return {
            views: union(host.views, part.views),
            faces: union(union(host.faces, part.faces), new Set([name])),
          };
        }
        case "continue": {
          const host = check(node.host);
          const part = check(node.part);
          need(host.views, node.hostFace, "host face");
          need(part.views, node.partFace, "part face");
          return {
            views: union(host.views, part.views),
            faces: union(host.faces, part.faces),
          };
        }
        case "trim": {
          const host = check(node.host);
          need(host.faces, node.face, "face");
          return host;
        }
        default:
          throw new Error(
            `realizeAutoMovieConstruction: ${name} has the unknown type ${(node as { type?: unknown }).type as string}`,
          );
      }
    };
    check(root);
  }

  /** The union of two name sets. */
  function union(a: ReadonlySet<string>, b: ReadonlySet<string>): Set<string> {
    return new Set([...a, ...b]);
  }
}
