import { FamilyConicLoop } from "./FamilyConicLoop";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicThumbRoot } from "./FamilyConicThumbRoot";
import { FamilyConicValley } from "./FamilyConicValley";

import {
  AutoMovieHumanChainTopology,
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanF1,
  AutoMovieHumanF1Centres,
  AutoMovieHumanF1Placement,
  AutoMovieHumanF1Placing,
  AutoMovieHumanF1SegmentLengths,
} from "@automovie/human";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieViewPart,
} from "@automovie/interface";
import path from "node:path";

/**
 * Readings of every joint of the f1 figure at once, for `packages/human/docs/techniques/joints-one-shot.md`: instruments only, nothing
 * here is read by the figure.
 *
 * `--starts`: where each family's course and face start and end. For every authored family and cutter: its course's centres, the turn
 * half lengths, its first and last knot (the face's stations), and the world points of its course at the first centre, the first knot
 * and the last knot. A joint's centre is one of the course's centres, so the first knot's station is how far past (or before) its first
 * centre the family's face starts, and the row says whether a part's family starts inside its neighbour or at the joint.
 *
 * `--wedge --plane=<x|y|z> --at=<mm>,<mm>... --box=<u0>,<u1>,<v0>,<v1>`: a fold as a form on the reference. The reference's skin, body and head as one mesh, is
 * cut by each plane (`x`: charted `(z, y)`; `y`: `(x, z)`; `z`: `(x, y)`); in every loop of the cut, the fold's floor is the loop's
 * sharpest inward turn inside the box, read at 6 mm. Printed: the floor and the wedge of air the two sides enclose there, the angle
 * between the lines from the floor to the loop's points 3, 6 and 12 mm along it on either side. The skin turns `180 - wedge` degrees across the fold: what a blend there must
 * turn. A plane square to the fold's line reads the fold's own wedge; an oblique one reads it wider.
 *
 * `--compose=<split node> [--carried=<mm>] [--plane=<mm>] [--rail=<mm>]`: a branch node alone, as a composed end. The named split of the
 * figure's own tree (`fan.hand`, `fan.leg`, `crotch`) is taken with its host and its children's own leaves and nothing else, declared
 * with `compose` (the end as its children's sections in the host end's plane moved `plane` mm out of the host, default 0) and realized
 * by the engine; the diagnostics are the premises that refuse. With `carried`, each child's face is carried that far before its first
 * knot along its fields' end tangents, to read what the premises say of a child that started inside its parent. With `rail`, every
 * child's rail distance is that instead of the figure's. A reading of premises on the instrument: it draws nothing and is no figure.
 *
 * `--end=<split node> --planes=<mm>,<mm>... [--within=<mm>]`: what the reference's skin is in a branch node's end plane. The plane is the
 * split's host end section's plane (normal out of the host) moved each given distance along its normal. Printed for each: where every
 * child's course pierces it; every chain of the reference's cut within `within` mm of the end's origin (closed or open, its points, its
 * extents in the plane and the children whose piercing points it holds); between neighbouring children that lie in different chains, the
 * least gap between their two chains and where; and for a chain that holds several children, whether it is star-shaped about each
 * child's piercing point (the count of rays of 360 that cross it more than once). It answers whether neighbouring children's skins
 * overlap, touch or stand apart there, and whether a ray's share of one envelope can be a section about that ray's course.
 *
 * `--roll=<family>:<length field>:<ratio>`: what one changed segment length does to a family's chart far from it. The family is placed
 * for a person whose named length is the ratio times f1's, by the figure's own placement (`AutoMovieHumanF1Placement.repose` with the
 * person's chain and datums), and printed: the roll its joints' twists ask for (knots and values), and at stations along its first run
 * the angle between the person's and f1's section axis `u`. A distal length that turns no proximal run should leave that angle at zero.
 *
 * `--ear`: whether the auricle's skin is one height over its plane. In planes square to the ear frame's long axis, every 4 mm, lines
 * parallel to the auricle's plane normal are laid 1 mm apart from front to back, and each line's crossings of the reference head's cut
 * are counted from the lateral side inward. One crossing before the head's own skin would be a bare head; three are a free sheet (its
 * lateral face, its cranial face, the head behind it); five or more are an overhang, skin hidden behind skin along the normal, and its
 * depth is the air between the second and the third crossing. A height net over a plate carries one value a line.
 *
 * Usage, from `test/`: bundle with esbuild as the other tools of this folder, then `node <bundle> --starts`, `--wedge ...`, `--compose=...`, `--end=...`, `--roll=...` or `--ear`.
 */
namespace FamilyConicJoints {
  const fixed = (p: readonly number[]): string => "[" + p.map((x: number): string => x.toFixed(1)).join(", ") + "]";

  function starts(): void {
    const out: string[] = ["family | centres | halves | first knot | last knot | course at first centre | at first knot | at last knot | tips"];
    const families: IAutoMovieHumanConicLoft.IFamily[] = [...AutoMovieHumanF1.FAMILIES.map((m: IAutoMovieHumanF1.IMember): IAutoMovieHumanConicLoft.IFamily => m.family), ...AutoMovieHumanF1.CUTTERS.map((c: { family: IAutoMovieHumanConicLoft.IFamily }): IAutoMovieHumanConicLoft.IFamily => c.family)];
    for (const family of families) {
      const axis = H.axis(family);
      const [first, last]: [number, number] = [family.knots[0]!, family.knots.at(-1)!];
      out.push(
        [
          family.name,
          family.centres.length,
          family.halves.join(", ") || "-",
          first,
          last,
          fixed(axis.at(0).origin),
          fixed(axis.at(first).origin),
          fixed(axis.at(last).origin),
          (family.tips ?? []).map((tip: IAutoMovieHumanConicLoft.ITip | null): string => (tip === null ? "open" : `tip ${tip.tip} from ${tip.from}`)).join("; ") || "open; open",
        ].join(" | "),
      );
      out.push("  centres: " + family.centres.map(fixed).join(" "));
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  const option = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);

  /** The point `distance` mm along a closed polyline from vertex `from`, forward (`way` 1) or backward (-1). */
  function along(loop: [number, number][], from: number, way: 1 | -1, distance: number): [number, number] {
    let [left, i]: [number, number] = [distance, from];
    for (let k: number = 0; k < loop.length; ++k) {
      const j: number = (i + way + loop.length) % loop.length;
      const [p, q]: [number, number][] = [loop[i]!, loop[j]!];
      const step: number = Math.hypot(q![0] - p![0], q![1] - p![1]);
      if (step >= left) return [p![0] + ((q![0] - p![0]) * left) / step, p![1] + ((q![1] - p![1]) * left) / step];
      [left, i] = [left - step, j];
    }
    return loop[from]!;
  }

  async function wedge(): Promise<void> {
    const plane: string = option("plane") ?? "";
    const at: number[] = (option("at") ?? "").split(",").filter((x: string): boolean => x !== "").map(Number);
    const box: number[] = (option("box") ?? "").split(",").map(Number);
    if (!["x", "y", "z"].includes(plane) || at.length === 0 || box.length !== 4 || box.some(Number.isNaN)) throw new Error("--wedge needs --plane=<x|y|z> --at=<mm,...> --box=<u0,u1,v0,v1>");
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const frame = (c: number): { origin: [number, number, number]; u: [number, number, number]; v: [number, number, number] } =>
      plane === "x" ? { origin: [c, 0, 0], u: [0, 0, 1], v: [0, 1, 0] } : plane === "y" ? { origin: [0, c, 0], u: [1, 0, 0], v: [0, 0, 1] } : { origin: [0, 0, c], u: [1, 0, 0], v: [0, 1, 0] };
    const out: string[] = [`== folds on the reference in planes ${plane} = const, charted ${plane === "x" ? "(z, y)" : plane === "y" ? "(x, z)" : "(x, y)"}, box ${box.join(", ")} ==`, "plane mm | turn's way | sharpest turn at u, v | wedge deg at 3, 6, 12 mm | skin turn deg at 3, 6, 12 mm"];
    for (const c of at) {
      let any: boolean = false;
      // Every chain of the cut, closed or open: the reference's body is not closed everywhere, and a fold is read on the chain it lies on.
      const chains: { points: [number, number][]; closed: boolean }[] = R.chains(source.all, frame(c) as Parameters<typeof R.chains>[1]) as { points: [number, number][]; closed: boolean }[];
      const cuts: [number, number][][] = chains.map((chain: { points: [number, number][] }): [number, number][] => chain.points);
      for (const loop of cuts) {
        if (loop.length < 8) continue;
        // An open chain has no area of its own sense; its inward side is then the side its end-to-end polygon gives.
        const way: number = Math.sign(R.area(loop));
        // The sharpest inward turn of the loop inside the box, read at 6 mm: the fold's floor in this plane.
        const turnAt = (i: number, d: number): { wedge: number; inward: boolean } => {
          const floor: [number, number] = loop[i]!;
          const [p, q]: [number, number][] = [along(loop, i, 1, d), along(loop, i, -1, d)];
          const [x, y]: [number, number][] = [
            [p![0] - floor[0], p![1] - floor[1]],
            [q![0] - floor[0], q![1] - floor[1]],
          ];
          const wedge: number = (Math.acos(Math.max(-1, Math.min(1, (x![0] * y![0] + x![1] * y![1]) / (Math.hypot(x![0], x![1]) * Math.hypot(y![0], y![1]))))) * 180) / Math.PI;
          // Walking the loop its own way, an inward turn turns against the loop's sense.
          return { wedge, inward: (-y![0] * x![1] + y![1] * x![0]) * way > 0 };
        };
        // The sharpest turn each way inside the box: on a closed loop one way is inward (a fold's floor) and the other outward (a ridge);
        // on an open chain the sense is the chain's own, so both are printed and the reader takes the one that is the fold.
        for (const side of [true, false]) {
          let best: number = -1;
          let least: number = 180;
          for (let i: number = 0; i < loop.length; ++i) {
            const p: [number, number] = loop[i]!;
            if (p[0] < box[0]! || p[0] > box[1]! || p[1] < box[2]! || p[1] > box[3]!) continue;
            const turn: { wedge: number; inward: boolean } = turnAt(i, 6);
            if (turn.inward === side && turn.wedge < least) [least, best] = [turn.wedge, i];
          }
          if (best < 0) continue;
          const floor: [number, number] = loop[best]!;
          const wedges: number[] = [3, 6, 12].map((d: number): number => turnAt(best, d).wedge);
          any = true;
          out.push(`${c} | ${side ? "a" : "b"} | ${floor[0].toFixed(1)}, ${floor[1].toFixed(1)} | ${wedges.map((w: number): string => w.toFixed(0)).join(", ")} | ${wedges.map((w: number): string => (180 - w).toFixed(0)).join(", ")}`);
        }
      }
      if (!any) {
        const extents: string = cuts.map((loop: [number, number][]): string => `${loop.length} points, u ${Math.min(...loop.map((p: [number, number]): number => p[0])).toFixed(0)}..${Math.max(...loop.map((p: [number, number]): number => p[0])).toFixed(0)}, v ${Math.min(...loop.map((p: [number, number]): number => p[1])).toFixed(0)}..${Math.max(...loop.map((p: [number, number]): number => p[1])).toFixed(0)}`).join("; ");
        out.push(`${c} | no inward turn in the box (loops: ${extents || "none"})`);
      }
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  /** The node of that name in a tree, by its hosts, parts and children. */
  function find(node: IAutoMovieConstructionNode, name: string): IAutoMovieConstructionNode | null {
    if ((node as { name?: string }).name === name) return node;
    const below: IAutoMovieConstructionNode[] = [];
    const any = node as { host?: IAutoMovieConstructionNode; part?: IAutoMovieConstructionNode; children?: { part: IAutoMovieConstructionNode }[] };
    if (any.host !== undefined) below.push(any.host);
    if (any.part !== undefined) below.push(any.part);
    for (const child of any.children ?? []) below.push(child.part);
    for (const next of below) {
      const found: IAutoMovieConstructionNode | null = find(next, name);
      if (found !== null) return found;
    }
    return null;
  }

  function compose(name: string): void {
    const declared: IAutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction();
    const node: IAutoMovieConstructionNode | null = find(declared.root, name);
    if (node === null || node.type !== "split") throw new Error("--compose: the tree has no split named " + name);
    const carried: number = Number(option("carried") ?? 0);
    const plane: number = Number(option("plane") ?? 0);
    const rail: number | undefined = option("rail") === undefined ? undefined : Number(option("rail")) / 1000;
    const sources: Map<string, IAutoMovieViewPart> = new Map(declared.sources);
    const families: Map<string, IAutoMovieHumanConicLoft.IFamily> = new Map(AutoMovieHumanF1.assemble().families.map((family: IAutoMovieHumanConicLoft.IFamily): [string, IAutoMovieHumanConicLoft.IFamily] => [family.name, family]));

    // Each child as its own leaf alone: a child that is itself a subtree (a leg with its toes) is read as its facing face's source.
    const children: IAutoMovieConstructionSplit.IChild[] = node.children.map((child: IAutoMovieConstructionSplit.IChild): IAutoMovieConstructionSplit.IChild => {
      const face: string = child.partFace;
      if (carried > 0) {
        const family: IAutoMovieHumanConicLoft.IFamily | undefined = families.get(face.replace(/\.mirror$/, ""));
        if (family === undefined) throw new Error("--compose: no family named " + face);
        const own: IAutoMovieHumanConicLoft.IFamily = face.endsWith(".mirror") ? H.mirror(family, face) : family;
        const [first, last]: [number, number] = [own.knots[0]! - carried, own.knots.at(-1)!];
        sources.set(face, H.part({ ...own, tips: [null, own.tips?.[1] ?? null] }, Array.from({ length: Math.ceil(last - first) + 1 }, (_: unknown, i: number): number => Math.min(last, first + i))));
      }
      return { ...child, part: { type: "source", name: face, source: face }, ...(rail === undefined ? {} : { rail }) };
    });
    const bare = (profile: IAutoMovieConstructionSplit.IProfile | undefined): IAutoMovieConstructionSplit.IProfile | undefined => {
      if (profile === undefined) return undefined;
      const { heading: _heading, ...rest }: IAutoMovieConstructionSplit.IProfile = profile;
      return { ...rest, knots: [] };
    };
    const root: IAutoMovieConstructionNode = {
      ...node,
      host: { type: "source", name: node.hostFace, source: node.hostFace },
      ...(node.profile === undefined ? {} : { profile: bare(node.profile)! }),
      ...(node.outer === undefined ? {} : { outer: node.outer.map((seam: IAutoMovieConstructionSplit.ISeam): IAutoMovieConstructionSplit.ISeam => ({ seam: seam.seam, ...(seam.profile === undefined ? {} : { profile: bare(seam.profile)! }) })) }),
      children: children as IAutoMovieConstructionSplit["children"],
      compose: { frame: "host", plane: { point: [0, 0, plane / 1000], normal: [0, 0, 1] } },
    };
    const started: number = performance.now();
    const real: IAutoMovieConstructionRealization.IRealization = AutoMovieEngineConstruction.realize({ name: "joint." + name, root }, { chord: 0.0005, sources });
    process.stdout.write(`== ${name} alone as a composed end: plane ${plane} mm out of the host's end, children carried ${carried} mm, rail ${rail === undefined ? "the figure's" : rail * 1000 + " mm"} ==\n`);
    process.stdout.write(`children: ${children.map((child: IAutoMovieConstructionSplit.IChild): string => `${child.partFace} (rail ${(child.rail * 1000).toFixed(1)} mm)`).join(", ")}\n`);
    process.stdout.write(`realized in ${Math.round(performance.now() - started)} ms, ${real.mesh.indices.length / 3} triangles, ${real.diagnostics.length} diagnostics\n`);
    for (const diagnostic of real.diagnostics) process.stdout.write(`- ${diagnostic.node} | ${diagnostic.contract} | ${diagnostic.detail.slice(0, 900)}\n`);
  }

  async function end(name: string): Promise<void> {
    const planes: number[] = (option("planes") ?? "0").split(",").map(Number);
    const within: number = Number(option("within") ?? 80);
    const families: Map<string, IAutoMovieHumanConicLoft.IFamily> = new Map(AutoMovieHumanF1.assemble().families.map((family: IAutoMovieHumanConicLoft.IFamily): [string, IAutoMovieHumanConicLoft.IFamily] => [family.name, family]));
    let base: { origin: readonly number[]; u: readonly number[]; v: readonly number[] };
    let normal: [number, number, number];
    let names: string[];
    let title: string;
    const framed: number[] | undefined = option("frame")?.split(",").map(Number);
    if (framed !== undefined) {
      // `--end=plane --frame=<px>,<py>,<pz>,<nx>,<ny>,<nz> --children=<family>,<family>...`: a plane given by a point and a normal, for a
      // branch node the tree does not declare as a split (the thumb's base): the families named are the children whose courses pierce it.
      if (framed.length !== 6 || framed.some(Number.isNaN)) throw new Error("--frame needs a point and a normal, six numbers");
      const l: number = Math.hypot(framed[3]!, framed[4]!, framed[5]!);
      normal = [framed[3]! / l, framed[4]! / l, framed[5]! / l];
      const seed: [number, number, number] = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const along: number = seed[0] * normal[0] + seed[1] * normal[1] + seed[2] * normal[2];
      const raw: number[] = [0, 1, 2].map((k: number): number => seed[k]! - along * normal[k]!);
      const lu: number = Math.hypot(raw[0]!, raw[1]!, raw[2]!);
      const u: number[] = raw.map((x: number): number => x / lu);
      // `v x u` is the normal, as a course frame's is its direction.
      const v: number[] = [u[1]! * normal[2] - u[2]! * normal[1], u[2]! * normal[0] - u[0]! * normal[2], u[0]! * normal[1] - u[1]! * normal[0]];
      base = { origin: framed.slice(0, 3), u, v };
      names = (option("children") ?? "").split(",").filter((x: string): boolean => x !== "");
      title = `the plane through [${framed.slice(0, 3).join(", ")}]`;
    } else {
      const declared: IAutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction();
      const node: IAutoMovieConstructionNode | null = find(declared.root, name);
      if (node === null || node.type !== "split") throw new Error("--end: the tree has no split named " + name);
      const host: IAutoMovieHumanConicLoft.IFamily = families.get(node.hostFace)!;
      const frame = H.axis(host).at(node.hostEnd === "top" ? host.knots.at(-1)! : host.knots[0]!);
      const out0: [number, number, number] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
      // The course's direction is `v x u`; out of the host it is that at a top end and its reverse at a bottom end.
      normal = node.hostEnd === "top" ? out0 : [-out0[0], -out0[1], -out0[2]];
      base = frame;
      names = node.children.map((child: IAutoMovieConstructionSplit.IChild): string => child.partFace);
      title = `the end plane of ${name} (host ${node.hostFace}, ${node.hostEnd} end)`;
    }
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const out: string[] = [`== the reference in ${title}, chains within ${within} mm ==`];
    for (const d of planes) {
      const origin: [number, number, number] = [0, 1, 2].map((k: number): number => base.origin[k]! + d * normal[k]!) as [number, number, number];
      const chart = (p: readonly number[]): [number, number] => [0, 1].map((a: number): number => [0, 1, 2].reduce((sum: number, k: number): number => sum + (p[k]! - origin[k]!) * (a === 0 ? base.u : base.v)[k]!, 0)) as [number, number];
      // Where each child's course pierces the plane: the root of its signed distance along the course, carried back before its start.
      const pierced: { name: string; at: [number, number] | null }[] = names.map((face: string): { name: string; at: [number, number] | null } => {
        const child: { partFace: string } = { partFace: face };
        const family: IAutoMovieHumanConicLoft.IFamily | undefined = families.get(child.partFace.replace(/\.mirror$/, ""));
        if (family === undefined) return { name: child.partFace, at: null };
        const own: IAutoMovieHumanConicLoft.IFamily = child.partFace.endsWith(".mirror") ? H.mirror(family, child.partFace) : family;
        const course = H.axis(own);
        const off = (s: number): number => [0, 1, 2].reduce((sum: number, k: number): number => sum + (course.at(s).origin[k]! - origin[k]!) * normal[k]!, 0);
        // The crossing nearest the family's own face: bracketed outward from its first knot.
        let [lo, hi]: [number, number] = [own.knots[0]!, own.knots[0]!];
        for (let step: number = 2; step <= 2 * own.knots.at(-1)! && off(lo) * off(hi) > 0; step += 2) [lo, hi] = [own.knots[0]! - step, Math.min(own.knots.at(-1)!, own.knots[0]! + step)];
        if (off(lo) * off(hi) > 0) return { name: child.partFace, at: null };
        for (let i: number = 0; i < 60; ++i) {
          const m: number = (lo + hi) / 2;
          if (off(lo) * off(m) <= 0) hi = m;
          else lo = m;
        }
        return { name: child.partFace, at: chart(course.at((lo + hi) / 2).origin) };
      });
      out.push("", `-- plane ${d} mm out of the host's end; origin [${origin.map((x: number): string => x.toFixed(1)).join(", ")}], normal [${normal.map((x: number): string => x.toFixed(3)).join(", ")}]`);
      out.push("children pierce at: " + pierced.map((p: { name: string; at: [number, number] | null }): string => `${p.name} ${p.at === null ? "never" : `(${p.at[0].toFixed(1)}, ${p.at[1].toFixed(1)})`}`).join("; "));
      const chains: { points: [number, number][]; closed: boolean }[] = (R.chains(source.all, { ...base, origin } as Parameters<typeof R.chains>[1]) as { points: [number, number][]; closed: boolean }[]).filter((chain: { points: [number, number][] }): boolean => chain.points.some((p: [number, number]): boolean => Math.hypot(p[0], p[1]) < within));
      // The children a closed chain holds, by the winding of the chain about each piercing point.
      const holds = (points: [number, number][], q: [number, number]): boolean => {
        let turn: number = 0;
        for (let i: number = 0; i < points.length; ++i) {
          const [a, b]: [number, number][] = [points[i]!, points[(i + 1) % points.length]!];
          turn += Math.atan2((a![0] - q[0]) * (b![1] - q[1]) - (a![1] - q[1]) * (b![0] - q[0]), (a![0] - q[0]) * (b![0] - q[0]) + (a![1] - q[1]) * (b![1] - q[1]));
        }
        return Math.abs(turn) > Math.PI;
      };
      const owner: (number | null)[] = pierced.map((p: { at: [number, number] | null }): number | null => {
        if (p.at === null) return null;
        const k: number = chains.findIndex((chain: { points: [number, number][]; closed: boolean }): boolean => chain.closed && holds(chain.points, p.at!));
        return k < 0 ? null : k;
      });
      chains.forEach((chain: { points: [number, number][]; closed: boolean }, k: number): void => {
        const us: number[] = chain.points.map((p: [number, number]): number => p[0]);
        const vs: number[] = chain.points.map((p: [number, number]): number => p[1]);
        const held: string[] = pierced.filter((_: unknown, i: number): boolean => owner[i] === k).map((p: { name: string }): string => p.name);
        out.push(`chain ${k}: ${chain.closed ? "closed" : "open"}, ${chain.points.length} points, u ${Math.min(...us).toFixed(1)}..${Math.max(...us).toFixed(1)}, v ${Math.min(...vs).toFixed(1)}..${Math.max(...vs).toFixed(1)}, holds ${held.join(", ") || "no child"}`);
        // Star-shaped about each child it holds: rays from the piercing point that cross the chain more than once.
        for (let i: number = 0; i < pierced.length; ++i) {
          if (owner[i] !== k || held.length < 2) continue;
          const q: [number, number] = pierced[i]!.at!;
          let folded: number = 0;
          for (let r: number = 0; r < 360; ++r) {
            const [cx, cy]: [number, number] = [Math.cos((r * Math.PI) / 180), Math.sin((r * Math.PI) / 180)];
            let hits: number = 0;
            for (let j: number = 0; j < chain.points.length; ++j) {
              const [a, b]: [number, number][] = [chain.points[j]!, chain.points[(j + 1) % chain.points.length]!];
              const [sa, sb]: [number, number] = [(a![0] - q[0]) * cy - (a![1] - q[1]) * cx, (b![0] - q[0]) * cy - (b![1] - q[1]) * cx];
              if (sa * sb > 0 || sa === sb) continue;
              const w: number = sa / (sa - sb);
              if ((a![0] + (b![0] - a![0]) * w - q[0]) * cx + (a![1] + (b![1] - a![1]) * w - q[1]) * cy > 0) ++hits;
            }
            if (hits > 1) ++folded;
          }
          out.push(`  about ${pierced[i]!.name}: ${folded} of 360 rays cross the chain more than once`);
        }
      });
      // The valley between each pair of neighbouring children (`FamilyConicValley`): a composed end's host ring is measured against the
      // outline of its children's sections, and a valley deeper than a child's rail is one a smooth host ring cannot follow.
      FamilyConicValley.pairs(chains, pierced.map((p: { at: [number, number] | null }): [number, number] | null => p.at)).forEach((pair: FamilyConicValley.IPair, i: number): void => {
        const label: string = `${pierced[i]!.name} | ${pierced[i + 1]!.name}`;
        if (pair.kind === "open") out.push(`${label}: one of them lies in no closed chain`);
        else if (pair.kind === "apart") out.push(`${label}: apart, least gap ${pair.gap!.toFixed(2)} mm`);
        else out.push(`${label}: one chain holds both; ${pair.span.toFixed(1)} mm apart; valley ${pair.depths![0].toFixed(2)} mm on the left of the line from the first to the second and ${pair.depths![1].toFixed(2)} mm on the right`);
      });
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  function roll(spec: string): void {
    const [name, field, ratio]: string[] = spec.split(":");
    const stored: IAutoMovieHumanConicLoft.IFamily | undefined = AutoMovieHumanF1.FAMILIES.find((m: IAutoMovieHumanF1.IMember): boolean => m.family.name === name)?.family;
    if (stored === undefined || field === undefined || !(Number(ratio) > 0)) throw new Error("--roll needs <family>:<length field>:<ratio>");
    const f1 = AutoMovieHumanF1SegmentLengths.F1 as unknown as Record<string, unknown>;
    if (typeof f1[field] !== "number") throw new Error("--roll: no numeric length field named " + field + "; fields: " + Object.keys(f1).join(", "));
    const lengths = { ...f1, [field]: (f1[field] as number) * Number(ratio) } as unknown as typeof AutoMovieHumanF1SegmentLengths.F1;
    const chain = AutoMovieHumanF1SegmentLengths.chain(lengths);
    const frames = AutoMovieHumanF1Placement.frames(undefined, AutoMovieHumanChainTopology.admit(AutoMovieHumanF1Placing.CHAIN, chain));
    const person: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1Placement.repose(stored, frames, (datum: string) => AutoMovieHumanF1Centres.local(datum, lengths, chain)).family;
    const out: string[] = [`== ${name} for a person with ${field} x ${ratio} ==`];
    out.push("centres f1:     " + stored.centres.map(fixed).join(" "));
    out.push("centres person: " + person.centres.map(fixed).join(" "));
    out.push("roll f1: " + (stored.roll === undefined ? "none" : JSON.stringify(stored.roll)));
    out.push("roll person: " + (person.roll === undefined ? "none" : `knots ${person.roll.knots.map((x: number): string => x.toFixed(1)).join(", ")}; values rad ${person.roll.values.map((x: number): string => x.toExponential(3)).join(", ")}`));
    const [a, b] = [H.axis(stored), H.axis(person)];
    out.push("station | angle between the two u axes, rad | largest component difference of u, in machine epsilons");
    const first: number = stored.knots[0]!;
    for (const s of [first, first + 6, first + 20, first + 50, first + 100, first + 200]) {
      const [p, q] = [a.at(s), b.at(s)];
      const d: number = Math.max(...[0, 1, 2].map((k: number): number => Math.abs(p.u[k]! - q.u[k]!)));
      const cosine: number = Math.max(-1, Math.min(1, p.u[0]! * q.u[0]! + p.u[1]! * q.u[1]! + p.u[2]! * q.u[2]!));
      out.push(`${s} | ${Math.acos(cosine).toExponential(3)} | ${(d / Number.EPSILON).toExponential(3)}`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  async function ear(): Promise<void> {
    const frame = AutoMovieHumanF1Placement.REFERENCE.get("ear");
    if (frame === undefined) throw new Error("f1 has no ear frame");
    const [X, Y, Z] = frame.axes;
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const out: string[] = [`== the reference auricle along its plane normal; ear frame origin ${fixed(frame.origin)}, long axis ${fixed(Y.map((x: number): number => x * 10))}/10, normal ${fixed(Z.map((x: number): number => x * 10))}/10 ==`];
    out.push("height along the long axis mm | crossings per line, front (+34 mm) to back (-34 mm), one digit a millimetre | overhangs: line mm: lateral sheet thickness / air behind it, mm");
    for (let y: number = -32; y <= 40; y += 4) {
      const origin: [number, number, number] = [0, 1, 2].map((k: number): number => frame.origin[k]! + y * Y[k]!) as [number, number, number];
      const chains = R.chains(source.head, { origin, u: X, v: Z } as Parameters<typeof R.chains>[1]) as { points: [number, number][]; closed: boolean }[];
      const digits: string[] = [];
      const hung: string[] = [];
      for (let x: number = 34; x >= -34; --x) {
        const hits: number[] = [];
        for (const chain of chains) {
          const last: number = chain.closed ? chain.points.length : chain.points.length - 1;
          for (let i: number = 0; i < last; ++i) {
            const [a, b]: [number, number][] = [chain.points[i]!, chain.points[(i + 1) % chain.points.length]!];
            if (a![0] - (x + 1e-7) > 0 === b![0] - (x + 1e-7) > 0) continue;
            const z: number = a![1] + ((b![1] - a![1]) * (x + 1e-7 - a![0])) / (b![0] - a![0]);
            if (z > -40 && z < 60) hits.push(z);
          }
        }
        hits.sort((p: number, q: number): number => q - p);
        digits.push(hits.length > 9 ? "+" : String(hits.length));
        if (hits.length >= 5) hung.push(`${x}: ${(hits[0]! - hits[1]!).toFixed(1)} / ${(hits[1]! - hits[2]!).toFixed(1)}`);
      }
      out.push(`${y} | ${digits.join("")} | ${hung.join("; ") || "none"}`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  /** `--armscye-landmarks`: the armscye's four traced landmarks moved onto the reference's skin, in the world and in the thorax's frame, mm. */
  async function armscyeLandmarks(): Promise<void> {
    const loop: FamilyConicLoop.ILoop = FamilyConicLoop.build(await R.load(path.resolve(process.cwd(), "..")));
    const thorax = AutoMovieHumanF1Placement.REFERENCE.get("thorax")!;
    const out: string[] = ["landmark | traced | on the skin | in the thorax's frame"];
    loop.landmarks.forEach((p: number[], k: number): void => {
      const q: number[] = [0, 1, 2].map((a: number): number => [0, 1, 2].reduce((sum: number, c: number): number => sum + (p[c]! - thorax.origin[c]!) * thorax.axes[a]![c]!, 0));
      out.push(`${["acromion", "anterior axillary", "posterior axillary", "axilla"][k]} | [${FamilyConicLoop.LANDMARKS[k]!.join(", ")}] | [${p.map((x: number): string => x.toFixed(2)).join(", ")}] | [${q.map((x: number): string => x.toFixed(2)).join(", ")}]`);
    });
    process.stdout.write(out.join("\n") + "\n");
  }

  /**
   * `--thumb-landmarks`: the four landmarks of the thumb's root on the reference's skin (`FamilyConicThumbRoot`, which states their
   * rules), in the world and in the thumb metacarpal's frame, mm.
   */
  async function thumbLandmarks(): Promise<void> {
    const root: FamilyConicThumbRoot.IRoot = FamilyConicThumbRoot.read(await R.load(path.resolve(process.cwd(), "..")));
    const frame = AutoMovieHumanF1Placement.REFERENCE.get("thumb.metacarpal");
    if (frame === undefined) throw new Error("the placement has no frame thumb.metacarpal");
    const out: string[] = [`centre ${fixed(root.centre)}, toward ${fixed(root.toward)}, knuckles' midpoint ${fixed(root.middle)}`, "landmark | on the skin | from its ray's origin mm | in the thumb metacarpal's frame"];
    for (const [name, p] of root.landmarks) {
      if (p === null) {
        out.push(`${name} | no skin on the ray | - | -`);
        continue;
      }
      const from: readonly number[] = name === "web floor" ? root.middle : root.centre;
      const local: number[] = [0, 1, 2].map((a: number): number => [0, 1, 2].reduce((sum: number, c: number): number => sum + (p[c]! - frame.origin[c]!) * frame.axes[a]![c]!, 0));
      out.push(`${name} | [${p.map((x: number): string => x.toFixed(2)).join(", ")}] | ${Math.hypot(p[0] - from[0]!, p[1] - from[1]!, p[2] - from[2]!).toFixed(2)} | [${local.map((x: number): string => x.toFixed(2)).join(", ")}]`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }
  export async function main(): Promise<void> {
    if (process.argv.includes("--starts")) return starts();
    if (process.argv.includes("--thumb-landmarks")) return thumbLandmarks();
    if (process.argv.includes("--armscye-landmarks")) return armscyeLandmarks();
    if (process.argv.includes("--ear")) return ear();
    const rolled: string | undefined = option("roll");
    if (rolled !== undefined) return roll(rolled);
    const ended: string | undefined = option("end");
    if (ended !== undefined) return end(ended);
    const composed: string | undefined = option("compose");
    if (composed !== undefined) return compose(composed);
    if (process.argv.includes("--wedge")) return wedge();
    throw new Error("FamilyConicJoints: name a reading (--starts, --wedge)");
  }
}

void FamilyConicJoints.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
