import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";

/**
 * A construction tree's structural admission before work: every node of the
 * closed union, every name used once, and every seed, continuation and trim
 * naming a face of the right subtree. Declared views and explicit native source
 * leaves produce chain part faces. Original profile leaves reserve qualified
 * family/piece faces for atlas hosts and trims; chain-specific part joins and
 * continuation remain restricted to chain leaves. Runtime availability is
 * admitted at each leaf.
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
   */
  export function admit(root: IAutoMovieConstructionNode): void {
    const seen: Set<string> = new Set();
    /**
     * Check this node before returning the faces structurally produced below
     * it.
     */
    function check(node: IAutoMovieConstructionNode): Names {
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
          if (
            node.fair !== undefined &&
            !(node.fair > 0)
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s fair ${node.fair} m is not positive and finite`,
            );

          // A mixed join's declared loop and each fold's reach (`IAutoMovieConstructionJoin.loop`, `IAutoMovieConstructionFoldWidth.reach`).
          const loop: typeof node.loop = node.loop;
          if (
            loop !== undefined &&
            !(
              loop.semi[0] > 0 &&
              loop.semi[1] > 0 &&
              loop.semi[1] < Math.PI &&
              (loop.sense === 1 || loop.sense === -1) &&
              (loop.shape === undefined ||
                (loop.shape.length === node.count &&
                  loop.shape.every(
                    (share: number): boolean =>
                      share > 0,
                  )))
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s loop needs a finite centre, positive semi-axes with the phase one under pi, a sense of 1 or -1 and, when shaped, ${node.count} positive shares`,
            );
          for (const width of [node.partWidth, node.hostWidth])
            if (
              width.type === "fold" &&
              width.reach !== undefined &&
              !(width.reach > 0)
            )
              throw new Error(
                `realizeAutoMovieConstruction: ${name}'s fold reach ${width.reach} m is not positive and finite`,
              );
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
          const band: typeof node.band = node.band;
          if (
            band !== undefined &&
            !(
              band.rail > 0 &&
              band.count >= 8 &&
              band.count % 4 === 0 &&
              band.rows >= 1
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s band (rail ${band.rail} m, ${band.count} columns, ${band.rows} rows) is out of range`,
            );
          return {
            views: union(host.views, part.views),
            faces:
              band === undefined
                ? union(host.faces, part.faces)
                : union(union(host.faces, part.faces), new Set([name])),
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
          // A composed end derives every seam's phases from its children (`IAutoMovieConstructionSplit.ICompose`), so the authored
          // ones are not read and not admitted; its plane and rounding are.
          const composed: boolean = node.compose !== undefined;
          /**
           * Refuse a declared plane that is not finite or has no normal, naming
           * its holder.
           */
          const flat: (
            plane: IAutoMovieConstructionSplit.IPlane,
            what: string,
          ) => void = (
            plane: IAutoMovieConstructionSplit.IPlane,
            what: string,
          ): void => {
            if (
              !(
                Math.hypot(...plane.normal) > 0
              )
            )
              refuse(
                `${what} plane (point [${plane.point.join(", ")}] m, normal [${plane.normal.join(", ")}]) is not finite with a nonzero normal`,
              );
          };
          if (node.compose !== undefined) {
            if (node.compose.frame !== "tree" && node.compose.frame !== "host")
              refuse(
                `compose frame ${String(node.compose.frame)} is neither tree nor host`,
              );
            flat(node.compose.plane, "compose");
            if (
              node.compose.round !== undefined &&
              !(node.compose.round > 0)
            )
              refuse(
                `compose round ${node.compose.round} m is not positive and finite`,
              );
          }
          if (
            !composed &&
            !(
              a < b &&
              b < a + 2 * Math.PI
            )
          )
            refuse(`seam [${a}, ${b}] is not a < b < a + 2 pi`);
          if (
            !(
              node.count >= 8 &&
              node.count % 4 === 0
            )
          )
            refuse(`count ${node.count} is not a multiple of 4 of at least 8`);
          if (!(node.rows >= 1))
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
            // A composed end derives each seam's valley and plane from its children, so authored knots or a heading would be a second
            // definition of the same curve; the profile then carries only the ribbons' corner, reach, square and fair.
            if (composed && profile.knots.length !== 0)
              refuse(
                "profile knots conflict with compose, which derives the seam's valley from the children",
              );
            if (composed && profile.heading !== undefined)
              refuse(
                "profile heading conflicts with compose, which derives the seam's plane from the children",
              );
            if (!composed && profile.knots.length === 0)
              refuse("profile has no knot");
            let previous: [number, number] = [0, 0];
            for (const [along, depth] of profile.knots) {
              if (
                !(
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
                profile.corner > 0 &&
                profile.corner < Math.PI / 2
              )
            )
              refuse(
                `profile corner ${profile.corner} rad is not in (0, pi / 2)`,
              );
            if (
              profile.reach !== undefined &&
              !(
                profile.reach > 0 &&
                profile.reach <= 1
              )
            )
              refuse(`profile reach ${profile.reach} is not in (0, 1]`);
            if (
              profile.square !== undefined &&
              typeof profile.square !== "boolean"
            )
              refuse(
                `profile square ${String(profile.square)} is not a boolean`,
              );
            if (
              profile.fair !== undefined &&
              !(
                typeof profile.fair === "number" ? [profile.fair] : profile.fair
              ).every(
                (share: number): boolean =>
                  share > 0 && share <= 1,
              )
            )
              refuse(
                `profile fair ${JSON.stringify(profile.fair)} is not in (0, 1]`,
              );
            const heading: [number, number, number] | undefined =
              profile.heading;
            if (
              heading !== undefined &&
              !(Math.hypot(...heading) > 0)
            )
              refuse(
                `profile heading [${heading.join(", ")}] is not a finite nonzero direction`,
              );
          };
          admit(node.profile);
          // Further seams each enclose the one before, and the children are one
          // more than the seams.
          let inner: [number, number] = [a, b];
          for (const outer of node.outer ?? []) {
            const [oa, ob]: [number, number] = outer.seam;
            if (
              !composed &&
              !(
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
            if (!(child.rail > 0))
              refuse(
                `rail ${child.rail} m of ${child.partFace} is not positive`,
              );
            if (child.cut !== undefined) {
              if (
                child.cut.frame !== "tree" &&
                child.cut.frame !== "host" &&
                child.cut.frame !== "part"
              )
                refuse(
                  `cut frame ${String(child.cut.frame)} of ${child.partFace} is none of tree, host and part`,
                );
              if (child.cut.planes.length === 0)
                refuse(`cut of ${child.partFace} has no plane`);
              for (const plane of child.cut.planes)
                flat(plane, `cut of ${child.partFace}'s`);
              if (
                child.cut.round !== undefined &&
                !(child.cut.round > 0)
              )
                refuse(
                  `cut round ${child.cut.round} m of ${child.partFace} is not positive and finite`,
                );
            }
            const crease: typeof child.crease = child.crease;
            if (
              crease !== undefined &&
              !(
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
          const semi: readonly [number, number] = node.loop.semi;
          if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI))
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s port curve is not a finite chart ellipse with positive semi-axes, the phase one under pi`,
            );
          if (
            !(
              node.count >= 8 &&
              node.count % 4 === 0
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s count ${node.count} is not a multiple of 4 of at least 8`,
            );
          if (!(node.rows >= 1))
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s rows ${node.rows} is not a positive integer`,
            );
          if (!(node.rail > 0))
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s rail ${node.rail} m is not positive`,
            );
          if (
            node.rails !== undefined &&
            !(
              node.rails.length >= 3 &&
              node.rails.every(
                (x: number): boolean => x > 0,
              )
            )
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s rails are not at least 3 finite positive distances`,
            );
          if (
            node.correspondence !== undefined &&
            node.correspondence !== "angle" &&
            node.correspondence !== "length"
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s correspondence ${String(node.correspondence)} is neither angle nor length`,
            );
          if (
            node.ribbons !== undefined &&
            node.ribbons !== "common" &&
            node.ribbons !== "column"
          )
            throw new Error(
              `realizeAutoMovieConstruction: ${name}'s ribbons ${String(node.ribbons)} is neither common nor column`,
            );
          for (const profile of node.profiles ?? []) {
            const knots: boolean =
              profile.knots.length >= 1 &&
              profile.knots.every(
                ([t]: [number, number], k: number): boolean =>
                  t > 0 &&
                  t < 1 &&
                  (k === 0 || t > profile.knots[k - 1]![0]),
              );
            const window: boolean =
              profile.start <= profile.end &&
              profile.end < profile.start + 2 * Math.PI &&
              profile.transition > 0;
            if (!knots)
              throw new Error(
                `realizeAutoMovieConstruction: ${name}'s profile knots are not increasing shares in (0, 1) with finite depths`,
              );
            if (!window)
              throw new Error(
                `realizeAutoMovieConstruction: ${name}'s profile window is not start <= end < start + 2 pi with a positive transition`,
              );
          }
          const shape: number[] | undefined = node.loop.shape;
          if (
            shape !== undefined &&
            !(
              shape.length === node.count &&
              shape.every((x: number): boolean => x > 0)
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
