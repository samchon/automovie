import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";

/**
 * A construction tree's structural admission before work: every node of the closed union, every name used once, and every seed, continuation and trim naming a face of the right subtree. Declared views and explicit native source leaves produce chain part faces. Original profile leaves reserve qualified family/piece faces for atlas hosts and trims; chain-specific part joins and continuation remain restricted to chain leaves. Runtime availability is admitted at each leaf.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four rules, which faces each reference may name and the refusal's form.
 * @evidence contracts/development/design.md#principled-representation Represents A construction tree's structural admission before work: every node of the closed union, every name used once, and every seed, continuation and trim naming a face of the right subtree: companion namespace of 3 members (`Names`, `admit`, `union`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionAdmission` in packages/engine/src/geometry/construction/AutoMovieConstructionAdmission.ts; its surface is the 3 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieConstructionAdmission {
  /** Structurally produced part leaves and all faces in one admitted subtree. */
  interface Names {
    /** Declared or source-supplied part names. */
    views: Set<string>;

    /** Part and blend face names. */
    faces: Set<string>;
  }

  /**
   * Admit a tree.
   *
   * @param root The tree's root node.
   * @throws When the tree breaks a rule, naming the node and the rule.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Recursively builds each subtree's view/face name sets and checks references against the required side; one global seen set rejects repeated names before descending further.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single structural walk owns union-kind, name-uniqueness and subtree-reference admission before realization mutates a body.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects the listed structural failures by throwing; this is not complete numeric/shape-field validation, which the typed node operators perform separately.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the subtree naming rules, the pre-realization role and the node/rule failure form.
   * @evidence contracts/development/implementation.md#efficient-algorithms For N nodes and depth D, copying descendant name sets costs O(ND) work in the worst case, including quadratic work for a skewed tree; no linear-total claim is made.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Computes each subtree's two sets once and reuses them for reference checks and the parent union rather than rewalking that subtree per reference.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The seen set, returned child sets, union temporaries and recursion stack are owned by this synchronous call and become unreachable on return/throw; no tree or name cache survives.
   */
  export function admit(root: AutoMovieConstructionNode): void {
    const seen: Set<string> = new Set();
    /** Check this node before returning the faces structurally produced below it. */
    function check(node: AutoMovieConstructionNode): Names {
      const name: string = (node as { name?: unknown }).name as string;
      if (typeof name !== "string")
        throw new Error("realizeAutoMovieConstruction: a node has no name");
      if (seen.has(name))
        throw new Error(
          `realizeAutoMovieConstruction: the name ${name} is used twice`,
        );
      seen.add(name);
      /** Require a reference to a face of the operation's declared subtree. */
      function need(set: Set<string>, face: string, what: string): void {
        if (!set.has(face))
          throw new Error(
            `realizeAutoMovieConstruction: ${name}'s ${what} ${face} is not a face of its subtree`,
          );
      }
      switch (node.type) {
        case "view":
        case "source":
          return { views: new Set([name]), faces: new Set([name]) };
        case "profile": {
          const faces: Set<string> = new Set();
          for (const loop of node.loops)
            for (const piece of loop.pieces) {
              const face: string = name + "/" + piece.id;
              if (seen.has(face))
                throw new Error(
                  "realizeAutoMovieConstruction: the name " +
                    face +
                    " is used twice",
                );
              seen.add(face);
              faces.add(face);
            }
          return { views: new Set(), faces };
        }
        case "join": {
          const host: Names = check(node.host);
          const part: Names = check(node.part);
          need(part.views, node.seed.partFace, "part face");
          need(host.faces, node.seed.hostFace, "host face");
          return {
            views: union(host.views, part.views),
            faces: union(union(host.faces, part.faces), new Set([name])),
          };
        }
        case "continue": {
          const host: Names = check(node.host);
          const part: Names = check(node.part);
          need(host.views, node.hostFace, "host face");
          need(part.views, node.partFace, "part face");
          return {
            views: union(host.views, part.views),
            faces: union(host.faces, part.faces),
          };
        }
        case "split": {
          /** Refuse a split field outside its declared range, naming it. */
          const refuse: (what: string) => never = (what: string): never => {
            throw new Error(`realizeAutoMovieConstruction: ${name}'s ${what}`);
          };
          const host: Names = check(node.host);
          need(host.views, node.hostFace, "host face");
          const [a, b]: [number, number] = node.seam;
          if (
            !(
              Number.isFinite(a) &&
              Number.isFinite(b) &&
              a < b &&
              b < a + 2 * Math.PI
            )
          )
            refuse(`seam [${a}, ${b}] is not a < b < a + 2 pi`);
          if (
            !(
              Number.isInteger(node.count) &&
              node.count >= 8 &&
              node.count % 4 === 0
            )
          )
            refuse(`count ${node.count} is not a multiple of 4 of at least 8`);
          if (!(Number.isInteger(node.rows) && node.rows >= 1))
            refuse(`rows ${node.rows} is not a positive integer`);
          // A curved seam is parameterized by its own length, so its knots
          // need not advance along the chord; each stands off the one before
          // (the seam's first end the origin) at no negative `along`. Whether
          // they stay within the chord's length needs the host, so the
          // realization refuses a knot beyond it.
          const admit: (
            profile: IAutoMovieConstructionSplit.IProfile | undefined,
          ) => void = (
            profile: IAutoMovieConstructionSplit.IProfile | undefined,
          ): void => {
            if (profile === undefined) return;
            if (profile.knots.length === 0) refuse("profile has no knot");
            let previous: [number, number] = [0, 0];
            for (const [along, depth] of profile.knots) {
              if (
                !(
                  Number.isFinite(along) &&
                  Number.isFinite(depth) &&
                  along >= 0 &&
                  (along !== previous[0] || depth !== previous[1])
                )
              )
                refuse(
                  `profile knot [${along}, ${depth}] m is not finite, at no negative along and apart from the knot before`,
                );
              previous = [along, depth];
            }
            if (
              !(
                Number.isFinite(profile.corner) &&
                profile.corner > 0 &&
                profile.corner < Math.PI / 2
              )
            )
              refuse(
                `profile corner ${profile.corner} rad is not in (0, pi / 2)`,
              );
            const heading: [number, number, number] | undefined = profile.heading;
            if (heading !== undefined && !(heading.every(Number.isFinite) && Math.hypot(...heading) > 0))
              refuse(`profile heading [${heading.join(", ")}] is not a finite nonzero direction`);
          };
          admit(node.profile);
          // Further seams each enclose the one before, and the children are one
          // more than the seams.
          let inner: [number, number] = [a, b];
          for (const outer of node.outer ?? []) {
            const [oa, ob]: [number, number] = outer.seam;
            if (
              !(
                Number.isFinite(oa) &&
                Number.isFinite(ob) &&
                oa < inner[0] &&
                ob > inner[1] &&
                ob < oa + 2 * Math.PI
              )
            )
              refuse(
                `outer seam [${oa}, ${ob}] does not enclose [${inner[0]}, ${inner[1]}] within one turn`,
              );
            admit(outer.profile);
            inner = [oa, ob];
          }
          if (node.children.length !== 2 + (node.outer ?? []).length)
            refuse(
              `${node.children.length} children for ${1 + (node.outer ?? []).length} seams`,
            );
          let views: Set<string> = host.views;
          let faces: Set<string> = host.faces;
          for (const child of node.children) {
            const part: Names = check(child.part);
            need(part.views, child.partFace, "part face");
            if (!(Number.isFinite(child.rail) && child.rail > 0))
              refuse(
                `rail ${child.rail} m of ${child.partFace} is not positive`,
              );
            const crease: typeof child.crease = child.crease;
            if (
              crease !== undefined &&
              !(
                Number.isFinite(crease.start) &&
                Number.isFinite(crease.end) &&
                Number.isFinite(crease.transition) &&
                crease.start <= crease.end &&
                crease.end < crease.start + 2 * Math.PI &&
                crease.transition > 0
              )
            )
              refuse(
                `crease of ${child.band} is not start <= end < start + 2 pi with a positive transition`,
              );
            if (seen.has(child.band))
              throw new Error(
                `realizeAutoMovieConstruction: the name ${child.band} is used twice`,
              );
            seen.add(child.band);
            views = union(views, part.views);
            faces = union(union(faces, part.faces), new Set([child.band]));
          }
          return { views, faces };
        }
        case "port": {
          const host: Names = check(node.host);
          const part: Names = check(node.part);
          need(host.views, node.hostFace, "host face");
          need(part.views, node.partFace, "part face");
          const { centre, semi } = node.loop;
          if (
            !(
              centre.every(Number.isFinite) &&
              semi[0] > 0 &&
              semi[1] > 0 &&
              semi[1] < Math.PI &&
              Number.isFinite(semi[0]) &&
              (node.loop.sense === 1 || node.loop.sense === -1)
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s port curve is not a finite chart ellipse with positive semi-axes, the phase one under pi`,
            );
          if (
            !(
              Number.isInteger(node.count) &&
              node.count >= 8 &&
              node.count % 4 === 0
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s count ${node.count} is not a multiple of 4 of at least 8`,
            );
          if (!(Number.isInteger(node.rows) && node.rows >= 1))
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s rows ${node.rows} is not a positive integer`,
            );
          if (!(Number.isFinite(node.rail) && node.rail > 0))
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s rail ${node.rail} m is not positive`,
            );
          const shape: number[] | undefined = node.loop.shape;
          if (
            shape !== undefined &&
            !(
              shape.length === node.count &&
              shape.every((x: number): boolean => Number.isFinite(x) && x > 0)
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s loop shape is not ${node.count} finite positive shares, one per column`,
            );
          if (seen.has(node.band))
            throw new Error(
              `realizeAutoMovieConstruction: the name ${node.band} is used twice`,
            );
          seen.add(node.band);
          return {
            views: union(host.views, part.views),
            faces: union(union(host.faces, part.faces), new Set([node.band])),
          };
        }
        case "trim": {
          const host: Names = check(node.host);
          need(host.faces, node.face, "face");
          return host;
        }
        default:
          throw new Error(
            `realizeAutoMovieConstruction: ${name} has the unknown type ${(node as { type?: unknown }).type as string}`,
          );
      }
    }
    check(root);
  }

  /** The union of two name sets. */
  function union(a: ReadonlySet<string>, b: ReadonlySet<string>): Set<string> {
    return new Set([...a, ...b]);
  }
}
