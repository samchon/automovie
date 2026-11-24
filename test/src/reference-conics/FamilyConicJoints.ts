import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicLoop } from "./FamilyConicLoop";
import { FamilyConicNativePremises } from "./FamilyConicNativePremises";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicThumbRoot } from "./FamilyConicThumbRoot";
import { FamilyConicValley } from "./FamilyConicValley";
import {
  AutoMovieLoftFrame,
  orientAutoMovieSolidChart,
  AutoMovieViewAxis,
  AutoMovieLoftViewFullSource,
  AutoMovieSolidChain,
  AutoMovieSolidVector as V3,
  AutoMovieViewLoft,
  AutoMovieViewOutline,
  createAutoMovieMeshRayCaster,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanBreastConnection,
  AutoMovieHumanReferenceOutlines,
  AutoMovieHumanChainTopology,
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanF1,
  AutoMovieHumanF1Armscye,
  AutoMovieHumanF1Centres,
  AutoMovieHumanF1Divide,
  AutoMovieHumanF1Engineering,
  AutoMovieHumanF1NativeLaw,
  AutoMovieHumanF1NativeCalibration,
  AutoMovieHumanF1NativeSites,
  AutoMovieHumanF1Placement,
  AutoMovieHumanF1Placing,
  AutoMovieHumanF1SegmentLengths,
  AutoMovieHumanF1ThumbRoot,
  AutoMovieHumanJoinLoop,
} from "@automovie/human";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanLandmarkSurface,
  IAutoMovieLoftViewFullSource,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
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
 * `--ear [--ray-hits]`: whether the auricle's skin is one height over its plane. In planes square to the ear frame's long axis, every 4 mm, lines
 * parallel to the auricle's plane normal are laid 1 mm apart from front to back, and each line's crossings of the reference head's cut
 * are counted from the lateral side inward. One crossing before the head's own skin would be a bare head; three are a free sheet (its
 * lateral face, its cranial face, the head behind it); five or more are an overhang, skin hidden behind skin along the normal, and its
 * depth is the air between the second and the third crossing. A height net over a plate carries one value a line. `--ray-hits` writes
 * the raw chart crossings with slice-local chain and edge provenance. On three-hit rays, the two measured gaps distinguish a sheet
 * tapering to its free rim from air closing at its cranial attachment. One-hit rays alone do not identify the attachment, and extra
 * folds are kept as ambiguous. The sampled ray grid does not trace or certify a closed insertion perimeter.
 *
 * `--survey --out=<new absolute JSON file>`: one private F1 survey of actual source contacts, composed ends, named reference parts and
 * the terminal foot caliper. Writes every independent result and refused premise. Existing scope and synthetic bridge flags do not apply.
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
    const assembly: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const declared: IAutoMovieHumanF1.IConstruction = AutoMovieHumanF1.constructionBareFrom(assembly);
    const node: IAutoMovieConstructionNode | null = find(declared.root, name);
    if (node === null || node.type !== "split") throw new Error("--compose: the tree has no split named " + name);
    const carried: number = Number(option("carried") ?? 0);
    const offset: string | undefined = option("plane");
    if (node.compose === undefined) throw new Error(name + ": no actual composed end");
    const compose: IAutoMovieConstructionSplit.ICompose = offset === undefined
      ? node.compose
      : { frame: "host", plane: { point: [0, 0, Number(offset) / 1000], normal: [0, 0, 1] } };
    const rail: number | undefined = option("rail") === undefined ? undefined : Number(option("rail")) / 1000;
    const sources: Map<string, IAutoMovieViewPart> = new Map(declared.sources);
    const families: Map<string, IAutoMovieHumanConicLoft.IFamily> = new Map(assembly.families.map((family: IAutoMovieHumanConicLoft.IFamily): [string, IAutoMovieHumanConicLoft.IFamily] => [family.name, family]));

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
    const root: IAutoMovieConstructionNode = {
      ...node,
      host: { type: "source", name: node.hostFace, source: node.hostFace },
      children: children as IAutoMovieConstructionSplit["children"],
      compose,
    };
    const started: number = performance.now();
    const real: IAutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "joint." + name, root }, { chord: 0.0005, sources });
    const experimental: boolean = offset !== undefined || carried !== 0 || rail !== undefined;
    process.stdout.write(`== ${name} isolated sources | ${experimental ? "explicit parameter experiment" : "authored plane and sources"} ==\n`);
    process.stdout.write(`plane ${JSON.stringify(compose)}, children carried ${carried} mm\n`);
    process.stdout.write(`children: ${children.map((child: IAutoMovieConstructionSplit.IChild): string => `${child.partFace} (rail ${(child.rail * 1000).toFixed(1)} mm)`).join(", ")}\n`);
    process.stdout.write(`realized in ${Math.round(performance.now() - started)} ms, ${real.mesh.indices.length / 3} triangles, ${real.diagnostics.length} diagnostics\n`);
    for (const diagnostic of real.diagnostics) process.stdout.write(`- ${diagnostic.node} | ${diagnostic.contract} | ${diagnostic.detail.slice(0, 900)}\n`);
  }

  async function end(name: string): Promise<void> {
    const planes: number[] = (option("planes") ?? "0").split(",").map(Number);
    const within: number = Number(option("within") ?? 80);
    const assembly: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const families: Map<string, IAutoMovieHumanConicLoft.IFamily> = new Map(assembly.families.map((family: IAutoMovieHumanConicLoft.IFamily): [string, IAutoMovieHumanConicLoft.IFamily] => [family.name, family]));
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
      const declared: IAutoMovieHumanF1.IConstruction = AutoMovieHumanF1.constructionBareFrom(assembly);
      const node: IAutoMovieConstructionNode | null = find(declared.root, name);
      if (node === null || node.type !== "split") throw new Error("--end: the tree has no split named " + name);
      const host: IAutoMovieViewPart | undefined = declared.sources.get(node.hostFace);
      if (host === undefined) throw new Error("--end: missing actual host source " + node.hostFace);
      const raw = AutoMovieViewLoft.create(host);
      if (raw.chain === null) throw new Error("--end: " + JSON.stringify(raw.diagnostics));
      const terminal = raw.chain.layers[node.hostEnd === "top" ? raw.chain.layers.length - 1 : 0]!;
      const frame = terminal.frame ?? AutoMovieLoftFrame.horizontal(terminal.y);
      const out0: [number, number, number] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
      // The course's direction is `v x u`; out of the host it is that at a top end and its reverse at a bottom end.
      normal = node.hostEnd === "top" ? out0 : [-out0[0], -out0[1], -out0[2]];
      base = frame;
      names = node.children.map((child: IAutoMovieConstructionSplit.IChild): string => child.partFace);
      title = `the end plane of ${name} (host ${node.hostFace}, ${node.hostEnd} station ${terminal.y} mm)`;
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
    const frames = AutoMovieHumanF1Placement.frames(undefined, AutoMovieHumanChainTopology(AutoMovieHumanF1Placing.CHAIN, chain));
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
    type Hit = { z: number; chain: number; edge: number };
    type Ray = {
      x: number;
      y: number;
      hits: Hit[];
      profile: "single" | "sheet" | "ambiguous";
      sheetThickness: number | null;
      cranialGap: number | null;
    };
    const frame = AutoMovieHumanF1Placement.REFERENCE.get("ear");
    if (frame === undefined) throw new Error("f1 has no ear frame");
    const [X, Y, Z] = frame.axes;
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const rays: Ray[] | undefined = process.argv.includes("--ray-hits") ? [] : undefined;
    const out: string[] = [`== the reference auricle along its plane normal; ear frame origin ${fixed(frame.origin)}, long axis ${fixed(Y.map((x: number): number => x * 10))}/10, normal ${fixed(Z.map((x: number): number => x * 10))}/10 ==`];
    out.push("height along the long axis mm | crossings per line, front (+34 mm) to back (-34 mm), one digit a millimetre | overhangs: line mm: lateral sheet thickness / air behind it, mm");
    for (let y: number = -32; y <= 40; y += 4) {
      const origin: [number, number, number] = [0, 1, 2].map((k: number): number => frame.origin[k]! + y * Y[k]!) as [number, number, number];
      const chains = R.chains(source.head, { origin, u: X, v: Z } as Parameters<typeof R.chains>[1]) as { points: [number, number][]; closed: boolean }[];
      const digits: string[] = [];
      const hung: string[] = [];
      for (let x: number = 34; x >= -34; --x) {
        const hits: Hit[] = [];
        const ray: number = x + 1e-7;
        for (const [index, chain] of chains.entries()) {
          const last: number = chain.closed ? chain.points.length : chain.points.length - 1;
          for (let i: number = 0; i < last; ++i) {
            const [a, b]: [number, number][] = [chain.points[i]!, chain.points[(i + 1) % chain.points.length]!];
            if ((a![0] > ray) === (b![0] > ray)) continue;
            const z: number = a![1] + ((b![1] - a![1]) * (ray - a![0])) / (b![0] - a![0]);
            if (z > -40 && z < 60) hits.push({ z, chain: index, edge: i });
          }
        }
        hits.sort((p: Hit, q: Hit): number => q.z - p.z);
        rays?.push({
          x: ray,
          y,
          hits,
          profile: hits.length === 1 ? "single" : hits.length === 3 ? "sheet" : "ambiguous",
          sheetThickness: hits.length === 3 ? hits[0]!.z - hits[1]!.z : null,
          cranialGap: hits.length === 3 ? hits[1]!.z - hits[2]!.z : null,
        });
        digits.push(hits.length > 9 ? "+" : String(hits.length));
        if (hits.length >= 5) hung.push(`${x}: ${(hits[0]!.z - hits[1]!.z).toFixed(1)} / ${(hits[1]!.z - hits[2]!.z).toFixed(1)}`);
      }
      out.push(`${y} | ${digits.join("")} | ${hung.join("; ") || "none"}`);
    }
    process.stdout.write(rays === undefined
      ? out.join("\n") + "\n"
      : JSON.stringify({ unit: "mm", frame, normalWindow: [-40, 60], rays }, null, 2) + "\n");
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
  /**
   * Actual reference mesh fold edges in the ear-normal view. An edge is eligible only when two incident faces project with opposite
   * orientation. Their tied depth has exactly one other transverse hit if this is a simple sheet event. Its order distinguishes the
   * medial end of the air gap from the free edge of the auricle. Crossing a third edge, a coplanar face or a many-hit stack is evidence
   * of ambiguity. The projected medial components are candidate insertion coverage, not cranial or source ownership labels.
   */
  function earAttachment(source: R.ISource, frame: IAutoMovieHumanSegmentFrame) {
    const mesh = source.head;
    const local: R.V[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) {
      const p: R.V = [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
      local.push(frame.axes.map((axis): number => axis.reduce(
        (sum: number, value: number, k: number): number => sum + value * (p[k]! - frame.origin[k]!),
        0,
      )) as R.V);
    }
    const oriented = (a: R.V, b: R.V, c: R.V): number =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const face: { a: R.V; b: R.V; c: R.V; ids: R.V; turn: number; index: number }[] = [];
    const incidence = new Map<string, { edge: [number, number]; face: number[] }>();
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const ids: R.V = [mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!];
      const [a, b, c] = [local[ids[0]]!, local[ids[1]]!, local[ids[2]]!];
      // The same capture scope as the existing ear rays. Keep entire incident faces when their bounds overlap.
      if (Math.min(a[0], b[0], c[0]) > 34 || Math.max(a[0], b[0], c[0]) < -34 ||
          Math.min(a[1], b[1], c[1]) > 40 || Math.max(a[1], b[1], c[1]) < -32)
        continue;
      face.push({ a, b, c, ids, turn: oriented(a, b, c), index: i / 3 });
      for (let k: number = 0; k < 3; ++k) {
        const [x, y] = [ids[k]!, ids[(k + 1) % 3]!];
        const edge: [number, number] = x < y ? [x, y] : [y, x];
        const key: string = edge.join(",");
        const known = incidence.get(key);
        if (known === undefined) incidence.set(key, { edge, face: [face.length - 1] });
        else known.face.push(face.length - 1);
      }
    }
    const unresolved: { edge: [number, number]; reason: string }[] = [];
    const events = Array.from(incidence.values()).flatMap(({ edge, face: incident }) => {
      const [a, b] = [local[edge[0]]!, local[edge[1]]!];
      if (Math.min(a[0], b[0]) > 34 || Math.max(a[0], b[0]) < -34 ||
          Math.min(a[1], b[1]) > 40 || Math.max(a[1], b[1]) < -32 ||
          Math.min(a[2], b[2]) >= 60 || Math.max(a[2], b[2]) <= -40) return [];
      if (incident.length !== 2) { unresolved.push({ edge, reason: "indexed edge has " + incident.length + " incident sources" }); return []; }
      const [one, two] = [face[incident[0]!]!, face[incident[1]!]!];
      if (one.turn === 0 || two.turn === 0 || (a[0] === b[0] && a[1] === b[1])) {
        unresolved.push({ edge, reason: "an incident source or its indexed edge is projection-singular" });
        return [];
      }
      if (Math.sign(one.turn) === Math.sign(two.turn)) return [];
      const at = (t: number): R.V => t === 0 ? a : t === 1 ? b : a.map((v, k) => v + t * (b[k]! - v)) as R.V;
      const zero = (x: number, y: number): number | undefined =>
        (x < 0) === (y < 0) || x === y ? undefined : x / (x - y);
      const stops = new Map<number, Set<string>>();
      const stop = (t: number, key: string): void => {
        let keys: Set<string> | undefined = stops.get(t);
        if (keys === undefined) stops.set(t, keys = new Set());
        keys.add(key);
      };
      stop(0, "vertex:" + edge[0]);
      stop(1, "vertex:" + edge[1]);
      for (const [axis, bound] of [[0, -34], [0, 34], [1, -32], [1, 40], [2, -40], [2, 60]] as const) {
        const t = zero(a[axis] - bound, b[axis] - bound);
        if (t !== undefined) stop(t, "window:" + axis + ":" + bound);
      }
      const boxesOverlap = (row: (typeof face)[number]): boolean => [0, 1].every((axis): boolean =>
        Math.max(a[axis]!, b[axis]!) >= Math.min(row.a[axis]!, row.b[axis]!, row.c[axis]!) &&
        Math.min(a[axis]!, b[axis]!) <= Math.max(row.a[axis]!, row.b[axis]!, row.c[axis]!));
      type Cover = { lo: number; hi: number; depth: ((t: number) => number) | null; edgeCovered: boolean; source: number };
      const coverage = face.flatMap((row): Cover[] => {
        if (row === one || row === two || !boxesOverlap(row)) return [];
        if (row.turn === 0) {
          const abc = [row.a, row.b, row.c], hits: number[] = [];
          for (const [i, p] of abc.entries()) {
            const q = abc[(i + 1) % 3]!;
            const d1 = oriented(a, b, p), d2 = oriented(a, b, q);
            if ((d1 < 0) !== (d2 < 0) || d1 === 0 || d2 === 0) {
              const u = d1 === d2 ? 0 : d1 / (d1 - d2);
              if (u < 0 || u > 1) continue;
              const k = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? 0 : 1;
              const t = (p[k]! + u * (q[k]! - p[k]!) - a[k]!) / (b[k]! - a[k]!);
              if (t >= 0 && t <= 1) { stop(t, "coplanar:" + row.index + ":" + i); hits.push(t); }
            }
          }
          if (hits.length < 2) return [];
          return [{ lo: Math.min(...hits), hi: Math.max(...hits), depth: null, edgeCovered: true, source: row.index }];
        }
        // The indexed blocker edge owns its event before either incident face normalizes barycentric weights.
        const sides: { key: string; x: number; y: number; root: number | undefined }[] = row.ids.map((_, i) => {
          const from: number = row.ids[(i + 1) % 3]!, to: number = row.ids[(i + 2) % 3]!;
          const min: number = Math.min(from, to), max: number = Math.max(from, to);
          const x: number = oriented(local[min]!, local[max]!, a), y: number = oriented(local[min]!, local[max]!, b);
          const scale: number = (from === min ? 1 : -1) / row.turn;
          return { key: "edge:" + min + "," + max, x: scale * x, y: scale * y, root: zero(x, y) };
        });
        const x: R.V = [sides[0]!.x, sides[1]!.x, sides[2]!.x];
        const y: R.V = [sides[0]!.y, sides[1]!.y, sides[2]!.y];
        let lo: number = 0, hi: number = 1;
        for (const side of sides) {
          if (side.x < 0 && side.y < 0) return [];
          if (side.root === undefined) continue;
          if (side.x < 0) lo = Math.max(lo, side.root);
          else hi = Math.min(hi, side.root);
        }
        if (!(hi > lo)) return [];
        for (const side of sides)
          if (side.root !== undefined && (side.root === lo || side.root === hi)) stop(side.root, side.key);
        const depths: [number, number, number] = [row.a[2], row.b[2], row.c[2]];
        const d0 = V3.dot(x, depths), d1 = V3.dot(y, depths);
        const depthsAt: [number, number][] = [[d0 - a[2], d1 - b[2]], [d0 + 40, d1 + 40], [d0 - 60, d1 - 60]];
        for (const [k, bounds] of depthsAt.entries()) {
          const root: number | undefined = zero(...bounds);
          if (root !== undefined && root > lo && root < hi) stop(root, "depth:" + row.index + ":" + k);
        }
        return [{ lo, hi, depth: (t: number): number => d0 + t * (d1 - d0),
          edgeCovered: x.some((p, i) => p === 0 && y[i] === 0), source: row.index }];
      });
      const stations: number[] = [...stops.keys()].sort((x, y): number => x - y);
      const id = (t: number): string => t === 0 ? String(edge[0]) : t === 1 ? String(edge[1]) :
        edge.join(",") + "@" + [...stops.get(t)!].sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0).join("|") + ":" + t;
      return stations.slice(1).flatMap((to, i) => {
        const from = stations[i]!, t = from + (to - from) / 2;
        if (!(t > from && t < to)) return [];
        const point = at(t);
        if (Math.abs(point[0]) > 34 || point[1] < -32 || point[1] > 40 || point[2] <= -40 || point[2] >= 60) return [];
        const active = coverage.filter((row) => row.lo < t && t < row.hi);
        const hits = active.flatMap(({ depth, source }) => {
          const z = depth?.(t);
          return z === undefined || z <= -40 || z >= 60 ? [] : [{ depth: z, source }];
        });
        const ordered = [from, to].every((end): boolean => end === 0 || end === 1 || stops.get(end)!.size === 1);
        const ambiguous = !ordered || active.some((row) => row.edgeCovered) || hits.length !== 1 || hits[0]!.depth === point[2];
        const kind: "medial-gap" | "free-rim" | "ambiguous" = ambiguous ? "ambiguous" : point[2] < hits[0]!.depth ? "medial-gap" : "free-rim";
        return [{ edge, point, interval: [from, to], vertices: [id(from), id(to)], ends: [at(from), at(to)],
          source: [one.index, two.index], stopSources: [[...stops.get(from)!], [...stops.get(to)!]], hits, kind }];
      });
    });
    const edges = events.filter((event): boolean => event.kind === "medial-gap");
    const adjacency = new Map<string, number[]>(), points = new Map<string, R.V>();
    for (const [i, event] of edges.entries())
      for (const [k, endpoint] of event.vertices.entries()) {
        const incident = adjacency.get(endpoint) ?? [];
        if (incident.length === 0) adjacency.set(endpoint, incident);
        incident.push(i);
        points.set(endpoint, event.ends[k]!);
      }
    const unseen = new Set(edges.map((_, i): number => i));
    const medial: { edges: { edge: [number, number]; interval: number[] }[]; endpoints: { vertex: string; point: R.V }[]; branched: boolean }[] = [];
    while (unseen.size !== 0) {
      const todo: number[] = [unseen.values().next().value!];
      const component: number[] = [];
      const vertices = new Set<string>();
      while (todo.length !== 0) {
        const i: number = todo.pop()!;
        if (!unseen.delete(i)) continue;
        component.push(i);
        for (const vertex of edges[i]!.vertices) {
          vertices.add(vertex);
          todo.push(...adjacency.get(vertex)!);
        }
      }
      const ends = [...vertices].filter((vertex): boolean => adjacency.get(vertex)!.length === 1);
      medial.push({ edges: component.map((i) => ({ edge: edges[i]!.edge, interval: edges[i]!.interval })),
        endpoints: ends.map((vertex) => ({ vertex, point: points.get(vertex)! })),
        branched: [...vertices].some((vertex): boolean => adjacency.get(vertex)!.length > 2) });
    }
    return { frame, events, medial, unresolved };
  }

  /** Survey all observed station brackets on the placed source's own divider, retaining unsupported and tangency events. */
  function dividerCuts(
    source: IAutoMovieViewPart,
    peer: IAutoMovieViewPart,
    side: (p: readonly number[]) => number,
    count: number,
  ) {
    const wall = AutoMovieLoftViewFullSource.create(source);
    const other = AutoMovieLoftViewFullSource.create(peer);
    const [from, to] = wall.domain;
    const stations: number[] = [from, ...source.stations.filter((s: number): boolean => s > from && s < to), to];
    return {
      source: source.name,
      samples: stations.length,
      columns: Array.from({ length: count }, (_, k: number) => {
        const phase: number = 2 * Math.PI * k / count;
        const read = (s: number): number => side(wall.point(s, phase));
        const values: number[] = stations.map(read);
        const roots = values.flatMap((value: number, i: number) => {
          if (!Number.isFinite(value)) return [{ kind: "outside-scope", station: stations[i]! }];
          const [before, next] = [values[i - 1], values[i + 1]];
          let s: number = stations[i]!;
          if (value === 0) {
            if (before === undefined || next === undefined) return [{ kind: "domain-end", station: s }];
            if (!Number.isFinite(before) || !Number.isFinite(next))
              return [{ kind: "undetermined-zero", station: s }];
            if (before === 0 || next === 0) return [{ kind: "zero-interval", station: s }];
            if ((before < 0) === (next < 0)) return [{ kind: "tangent-sample", station: s }];
          } else {
            if (next === undefined || !Number.isFinite(next) || next === 0 || (value < 0) === (next < 0)) return [];
            let hi: number = stations[i + 1]!;
            for (let step: number = 0; step < 40; ++step) {
              const midpoint: number = (s + hi) / 2;
              if (midpoint === s || midpoint === hi) break;
              const at: number = read(midpoint);
              if (!Number.isFinite(at)) return [{ kind: "undetermined-bracket", station: midpoint }];
              if ((at < 0) === (value < 0)) s = midpoint;
              else hi = midpoint;
            }
            s = (s + hi) / 2;
          }
          const p: readonly number[] = wall.point(s, phase);
          const address = attempt(() =>
            AutoMovieHumanJoinLoop.address(peer, other.domain, p, (other.domain[0] + other.domain[1]) / 2));
          const gapMm: number | null = address.kind === "observed"
            ? Math.hypot(...other.point(...address.value).map((x: number, a: number): number => x - p[a]!))
            : null;
          return [{ kind: "crossing", station: s, point: p, address, gapMm, negativeBefore: (value === 0 ? before! : value) < 0 }];
        });
        return { phase, roots };
      }),
      scope: "declared source intervals; unknown sub-interval crossings remain unresolved",
    };
  }

  /** Intersect the actual native wall with the same physical measurement ray, starting from the independently indexed skin. */
  function rayWall(part: IAutoMovieViewPart, wall: IAutoMovieLoftViewFullSource.IReader,
    origin: R.V, direction: R.V, reference: R.V, tolerance: number) {
    const first = AutoMovieHumanJoinLoop.address(part, wall.domain, reference, (wall.domain[0] + wall.domain[1]) / 2);
    let [s, phi] = first;
    let radius: number = V3.dot(V3.sub(reference, origin), direction);
    for (let i: number = 0; i < 64; ++i) {
      if (!(radius > 0 && s > wall.domain[0] && s < wall.domain[1]))
        throw new Error("the measured ray reaches a chart bound at " + s + " mm");
      const jet = wall.jet(s, phi);
      const onRay: R.V = V3.add(origin, V3.scale(direction, radius));
      const residual: R.V = V3.sub(jet.p, onRay);
      const length: number = V3.norm(residual);
      const delta: R.V | null = V3.solve3(jet.u, jet.v, V3.scale(direction, -1), V3.scale(residual, -1));
      if (delta === null) throw new Error("the measured ray is tangent to the source chart");
      if (length <= tolerance) return { s, phi, radius, point: jet.p, residualMm: length };
      let advanced: boolean = false;
      for (let scale: number = 1; scale >= Number.EPSILON; scale /= 2) {
        const next: R.V = [s + scale * delta[0], phi + scale * delta[1], radius + scale * delta[2]];
        if (!(next[0] > wall.domain[0] && next[0] < wall.domain[1] && next[2] > 0)) continue;
        const miss = V3.sub(wall.point(next[0], next[1]), V3.add(origin, V3.scale(direction, next[2])));
        if (!(V3.norm(miss) < length)) continue;
        [s, phi, radius] = next;
        advanced = true;
        break;
      }
      if (!advanced) throw new Error("the actual surface cannot approach the fixed ray from its independent witness");
    }
    throw new Error("the measured source ray did not converge");
  }

  /** The original landmark and a divider ray must visit a common indexed face before the analytic trace may borrow the seed. */
  function indexedLandmarkRay(mesh: R.ISource["body"], from: R.V, landmark: R.V, tolerance: number) {
    const caster = createAutoMovieMeshRayCaster({
      positions: Array.from(mesh.positions, (coordinate): number => coordinate / 1000),
      indices: Array.from(mesh.indices), normals: null, uvs: null, skin: null,
    });
    const metres = (p: R.V): R.V => V3.scale(p, 1 / 1000);
    const direction = V3.unit(V3.sub(landmark, from));
    if (direction === null) throw new Error("the original measured landmark ray has no direction");
    const first = caster.nearestHit(metres(from), direction, Infinity);
    if (first === null || Math.abs(first.distance * 1000 - Math.hypot(...V3.sub(landmark, from))) > tolerance)
      throw new Error("the original indexed ray does not recover the independently measured landmark");
    const other = caster.nearestHit(metres(from), direction, Infinity, 0, { excludedTriangles: new Set([first.triangle]) });
    if (other !== null && Math.abs(other.distance - first.distance) * 1000 <= tolerance)
      throw new Error("the independently measured landmark does not select one indexed face");
    return (origin: R.V, heading: R.V) => {
      const excludedTriangles = new Set<number>();
      const intersections: { triangle: number; radius: number }[] = [];
      for (;;) {
        const hit = caster.nearestHit(metres(origin), heading, Infinity, 0, { excludedTriangles });
        if (hit === null) break;
        excludedTriangles.add(hit.triangle);
        if (hit.distance > 0) intersections.push({ triangle: hit.triangle, radius: 1000 * hit.distance });
      }
      const selected = intersections.filter((row): boolean => row.triangle === first.triangle);
      if (selected.length !== 1) throw new Error("the divider ray has no unique positive hit on the observed landmark face");
      const row = selected[0]!;
      return { face: row.triangle, radius: row.radius, point: V3.add(origin, V3.scale(heading, row.radius)), intersections };
    };
  }

  /** A foreground triangle cannot replace the observed landmark's face on the same ray. */
  function indexedSeedControl(): void {
    const seed = indexedLandmarkRay({
      positions: [1, -1, -1, 1, 1, -1, 1, 0, 1, 2, -1, -1, 2, 1, -1, 2, 0, 1],
      indices: [0, 1, 2, 3, 4, 5],
    }, [1.5, 0, 0], [2, 0, 0], 1e-3);
    const row = seed([0, 0, 0], [1, 0, 0]);
    if (row.face !== 1 || row.intersections.length !== 2 || row.intersections[0]!.triangle === row.face)
      throw new Error("the occluding face replaced the independently observed seed");
    let rejected = false;
    try { seed([1.5, 0, 0], [-1, 0, 0]); } catch { rejected = true; }
    if (!rejected) throw new Error("a ray that never reaches the landmark face was accepted");
  }

  /** Read a fixed divider on the indexed skin and both actual full walls. Each sample has independent success or refusal. */
  function masterRays(reference: R.ISource, host: IAutoMovieViewPart, part: IAutoMovieViewPart,
    divider: IAutoMovieHumanLandmarkSurface.ISurface, landmark: R.V, count: number, tolerance: number,
    trace: ReturnType<typeof dividerCuts> | undefined, childTrace: ReturnType<typeof dividerCuts> | undefined,
    seedFace?: ReturnType<typeof indexedLandmarkRay>) {
    const { origin, normal } = divider;
    const q: R.V = V3.sub(landmark, origin);
    const u: R.V | null = V3.unit(V3.sub(q, V3.scale(normal, V3.dot(normal, q))));
    if (u === null) throw new Error("the physical landmark does not set a divider direction");
    const v: R.V = V3.cross(u, normal);
    const h = AutoMovieLoftViewFullSource.create(host);
    const p = AutoMovieLoftViewFullSource.create(part);
    const crossings = (observed: ReturnType<typeof dividerCuts> | undefined, direction: R.V) => {
      if (observed === undefined) return { seeds: [] as R.V[], openColumns: [] as number[] };
      const openColumns: number[] = [], seeds: R.V[] = [];
      const phases = observed.columns;
      for (let j: number = 0; j < phases.length; ++j) {
        const here = phases[j]!.roots.filter((root) => root.kind === "crossing" && "point" in root);
        const next = phases[(j + 1) % phases.length]!.roots.filter((root) => root.kind === "crossing" && "point" in root);
        if (here.length !== 1 || next.length !== 1) openColumns.push(j);
        for (const a of here) for (const b of next) {
          if (!("point" in a) || !("point" in b)) continue;
          if (!Array.isArray(a.point) || !Array.isArray(b.point)) continue;
          const one: R.V = [a.point[0]!, a.point[1]!, a.point[2]!], two: R.V = [b.point[0]!, b.point[1]!, b.point[2]!];
          const x = V3.sub(one, origin), y = V3.sub(two, origin);
          if (V3.dot(V3.cross(direction, x), normal) * V3.dot(V3.cross(direction, y), normal) > 0 ||
              Math.max(V3.dot(direction, x), V3.dot(direction, y)) <= 0) continue;
          seeds.push(one, two);
        }
      }
      return { seeds, openColumns };
    };
    return Array.from({ length: count }, (_, k: number) => {
      const angle: number = 2 * Math.PI * k / count;
      const direction: R.V = V3.add(V3.scale(u, Math.cos(angle)), V3.scale(v, Math.sin(angle)));
      const start: R.V = V3.add(origin, V3.scale(normal, -divider.side(V3.add(origin, direction))));
      const chains = R.chains(reference.body, { origin: start, u: direction, v: normal });
      const sections = chains.map((chain) => {
        const hits: number[] = [];
        let overlaps: boolean = false;
        const edges: number = chain.closed ? chain.points.length : chain.points.length - 1;
        for (let i: number = 0; i < edges; ++i) {
          const a = chain.points[i]!, b = chain.points[(i + 1) % chain.points.length]!;
          if (a[1] === 0 && b[1] === 0 && Math.max(a[0], b[0]) >= 0) overlaps = true;
          if ((a[1] > 0) === (b[1] > 0)) continue;
          const radius: number = a[0] + (b[0] - a[0]) * -a[1] / (b[1] - a[1]);
          if (radius === 0) overlaps = true;
          if (radius > 0) hits.push(radius);
        }
        return { closed: chain.closed, overlaps, hits: hits.sort((a, b): number => a - b) };
      });
      const candidates = sections.filter((section): boolean => section.closed && section.hits.length % 2 === 1);
      const ambiguous: boolean = sections.some((section): boolean => section.overlaps || (!section.closed && section.hits.length > 0));
      const hostSeeds = crossings(trace, direction), childSeeds = crossings(childTrace, direction);
      const observedRoots = {
        host: { openColumns: hostSeeds.openColumns, attempts: hostSeeds.seeds.map((seed) => attempt(() => rayWall(host, h, start, direction, seed, tolerance))) },
        child: { openColumns: childSeeds.openColumns, attempts: childSeeds.seeds.map((seed) => attempt(() => rayWall(part, p, start, direction, seed, tolerance))) },
      };
      if (ambiguous || candidates.length !== 1)
        return { k, angle, kind: "unresolved reference interior", sections, observedRoots };
      const indexed = k === 0 && seedFace !== undefined ? attempt(() => seedFace(start, direction)) : undefined;
      if (indexed?.kind === "unavailable" || (indexed === undefined && candidates[0]!.hits.length !== 1))
        return { k, angle, kind: "unresolved original divider branch", sections, observedRoots, indexed };
      const radius: number = indexed?.kind === "observed" ? indexed.value.radius : candidates[0]!.hits[0]!;
      const witness: R.V = V3.add(start, V3.scale(direction, radius));
      const parent = attempt(() => rayWall(host, h, start, direction, witness, tolerance));
      const child = attempt(() => rayWall(part, p, start, direction, witness, tolerance));
      return { k, angle, witness, radius, indexed, sections, observedRoots, parent, child,
        radialChangeMm: parent.kind === "observed" && child.kind === "observed" ? parent.value.radius - child.value.radius : null,
        paired: parent.kind === "observed" && child.kind === "observed" ? attempt(() =>
          AutoMovieHumanJoinLoop.columnGap(h, p, [parent.value.s, parent.value.phi], [child.value.s, child.value.phi])) : null,
      };
    });
  }

  /** One bounded independent read can refuse without preventing the other measured sites from being written. */
  function attempt<T>(read: () => T): { kind: "observed"; value: T } | { kind: "unavailable"; reason: string } {
    try {
      return { kind: "observed", value: read() };
    } catch (error: unknown) {
      return { kind: "unavailable", reason: error instanceof Error ? error.message : String(error) };
    }
  }

  /** The independently located host divider, actual articulated child feet and indexed retained skin of one attached material. */
  function sideMember(
    reference: R.ISource, figure: IAutoMovieHumanF1.IAssembly, tree: IAutoMovieHumanF1.IConstruction,
    family: K.IStored, placed: K.IStored, hostFace: string, joinName: string, next: R.V, landmarks: R.V[],
    divider: IAutoMovieHumanLandmarkSurface.ISurface, owns: ReturnType<typeof AutoMovieHumanF1Divide.landmarkOwner>,
  ) {
    const join = find(tree.root, joinName), parent = tree.sources.get(hostFace), child = tree.sources.get(placed.name);
    if (join === null || join.type !== "join" || parent === undefined || child === undefined)
      throw new Error("the registered physical attachment is missing " + joinName);
    if (family.native !== undefined || (family.tips !== undefined && family.tips[0] !== null))
      throw new Error(family.name + " lacks an open canonical proximal material");
    const tolerance = join.tolerance * 1000;
    const master = AutoMovieHumanJoinLoop.master(parent, join.count, landmarks, divider, owns, tolerance, join.grazing);
    const runs = AutoMovieViewAxis.runs(family.centres, family.halves);
    if (typeof runs === "string") throw new Error(runs);
    const ends = family.centres.flatMap((point, k): number[] => V3.norm(V3.sub(point, next)) <= tolerance ? [k] : []);
    if (ends.length !== 1 || ends[0]! <= 0 || runs[ends[0]! - 1] === undefined)
      throw new Error(family.name + " has no unique bounded registered proximal articulation");
    const domain: [number, number] = [runs[0]!.start, runs[ends[0]! - 1]!.end];
    const collect = AutoMovieHumanJoinLoop.materialAddresses(child, domain, placed, figure.reference(placed.name));
    const fixed = (point: R.V) => {
      const feet = collect(point);
      if (!owns(point, true) || feet.length !== 1 || feet[0]![0] <= domain[0] || feet[0]![0] >= domain[1])
        throw new Error(family.name + " has " + feet.length + " child plane feet in its registered material course at " + point.join(","));
      return { point, address: feet[0]! };
    };
    const targets = Array.from({ length: 2 * join.count }, (_, k) => fixed(master.at(Math.PI * k / join.count).point));
    const located = landmarks.map(fixed);
    const sections = [...located, ...targets].map((q): number => q.address[0]);
    const low = Math.min(...sections), high = Math.max(...sections);
    const mark = family.knots.find((s, j): boolean => j > 0 && j + 1 < family.knots.length && s > high);
    if (mark === undefined) throw new Error(family.name + " lacks a protected canonical interval beyond its entire divider");
    const first = family.knots[0]!;
    const start = low > first ? first : Math.max(...runs.flatMap((run): number[] => [run.start, run.end]).filter((s): boolean => s < low && s <= first));
    if (!(Number.isFinite(start) && start < low && start <= first)) throw new Error(family.name + " has no independently bounded material before its divider");
    const axis = K.axis(family), observed: F.IRow[] = [], whole = new Set<number>();
    const world = (s: number, q: C.P): R.V => {
      const frame = axis.at(s);
      return AutoMovieLoftFrame.place(frame, q[0], q[1]);
    };
    const outside = (s: number, q: C.P): number => {
      const point = world(s, q);
      return owns(point, true) ? -divider.side(point) : Infinity;
    };
    const controls = [start];
    const sample = (s: number, heldout: boolean): void => {
      const cut = R.cut(reference.body, axis.at(s), 0, true);
      if (cut.around !== 1 || cut.loop === null || cut.measured === undefined) return;
      const side = cut.loop.map((q): number => outside(s, q));
      const pieces = K.measuredRuns(cut.loop, cut.measured, side);
      if (pieces.length === 0) return;
      if (pieces.length === 1 && pieces[0] === cut.loop) whole.add(s);
      observed.push({ s, points: pieces.flat(), runs: pieces, heldout });
      if (!heldout) controls.push(s);
    };
    const stations = [...new Set([start, ...family.knots.filter((s): boolean => s >= start && s < mark),
      ...Array.from({ length: Math.ceil((mark - start) / 4) }, (_, j): number => start + 4 * j), mark])].sort((a, b): number => a - b);
    for (let k = 1; k < stations.length; ++k) {
      sample(stations[k - 1]!, false);
      sample((stations[k - 1]! + stations[k]!) / 2, true);
    }
    if (!observed.some((row): boolean => row.heldout) || !observed.some((row): boolean => !row.heldout))
      throw new Error(family.name + " lacks independent exposed training and withheld skin before its protected section");
    const tail = K.constrainTail(family, mark, [...new Set(controls)].sort((a, b): number => a - b));
    if (typeof tail === "string") throw new Error(tail);
    const gate = F.prepareGroupMember(observed, tail, family);
    return { family, placed, tolerance, targets, tail, gate, observed, world, outside, whole: (s: number): boolean => whole.has(s),
      owns, divider,
      physical: { domain, start, originalStart: first, protected: mark, landmarks: located.map((q) => q.address), columns: targets.length,
        train: observed.filter((row): boolean => !row.heldout).map((row): number => row.s), held: observed.filter((row): boolean => row.heldout).map((row): number => row.s) } };
  }

  /** Solve both attached children against their host-owned dividers in one reduced material state. */
  function sideMaterials(members: readonly ReturnType<typeof sideMember>[]) {
    const vector: number[] = [], offsets = new Map<string, number>();
    const columns: { face: string; step: number }[] = [];
    for (const member of members) {
      offsets.set(member.family.name, vector.length);
      const steps = F.sectionSteps(member.family.layout);
      for (const [f, field] of member.tail.initial.entries()) for (const k of member.tail.free) {
        vector.push(field[k]!);
        columns.push({ face: member.placed.name, step: steps[f]! });
      }
    }
    const expand = (state: readonly number[]) => new Map(members.map((m) => {
      const n = m.tail.free.length, start = offsets.get(m.family.name)!;
      const values = m.tail.initial.map((_, f): number[] => m.tail.expand(f, state.slice(start + n * f, start + n * (f + 1))));
      return [m.family.name, { ...m.family, knots: m.tail.knots, values, rootSectionMark: m.tail.mark }] as const;
    }));
    const feasibility = (state: readonly number[], derivatives: boolean) => {
      const margins: F.IStartMargin[] = [];
      let fault: string | null = null;
      const bank = expand(state);
      for (const member of members) {
        const family = bank.get(member.family.name)!;
        const raw = member.gate.raw(family.values, offsets.get(family.name)!, derivatives);
        if (typeof raw === "string") return family.name + ": " + raw;
        margins.push(...raw.margins.map((row) => ({ ...row, label: family.name + " " + row.label })));
        fault ??= raw.fault;
      }
      return { margins, fault };
    };
    const restored = F.restoreGroup(vector, feasibility, 60);
    if (restored.stopped !== null) throw new Error("attached material feasibility: " + restored.stopped + "; " + JSON.stringify(restored.receipts.at(-1)));
    const tolerance = Math.min(...members.map((m): number => m.tolerance));
    const names = new Set(members.map((m): string => m.placed.name));
    const sources = (bank: ReadonlyMap<string, K.IStored>) =>
      AutoMovieHumanF1.originalSources(AutoMovieHumanF1.assemble(undefined, undefined, bank), names);
    // Each indexed edge owns its original endpoints and midpoint on this station.
    const observed = (member: (typeof members)[number], held: boolean) =>
      member.observed.filter((row) => (row.heldout ?? false) === held).flatMap((row) =>
        row.runs!.flatMap((run) => {
          const edges = run.slice(1).map((b, i) => [run[i]!, b] as const);
          if (member.whole(row.s)) edges.push([run.at(-1)!, run[0]!] as const);
          return edges.flatMap(([a, b], i) => {
            if (orientAutoMovieSolidChart([0, 0], a, b) === 0 && a[0] * b[0] + a[1] * b[1] <= 0)
              throw new Error(member.placed.name + " has a measured edge through its section origin at " + row.s);
            const sites = [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as C.P,
              ...(i === edges.length - 1 && !member.whole(row.s) ? [b] : [])];
            return sites.map((q) => ({ s: row.s, phase: Math.atan2(q[1], q[0]), target: member.world(row.s, q),
              edge: [member.world(row.s, a), member.world(row.s, b)] as const }));
          });
        }));
    const training = new Map(members.map((m) => [m.placed.name, observed(m, false)]));
    const read = (state: readonly number[], derivatives: boolean): ReturnType<typeof F.readGroup> => {
      try {
        const bank = expand(state), admitted = feasibility(state, false);
        if (typeof admitted === "string") return admitted;
        if (admitted.margins.some((q): boolean => q.closed ? q.value < 0 : q.value <= 0) || admitted.fault !== null)
          return admitted.fault ?? "an attached source lost its raw material inequalities";
        const views = sources(bank);
        const targets = members.flatMap((member) => {
          const face = member.placed.name, view = views.get(face)!;
          const source = AutoMovieLoftViewFullSource.create(view);
          return training.get(face)!.map((site) => {
            const current = source.point(site.s, site.phase);
            const bound = member.owns(current, true) ? -member.divider.side(current) : Infinity;
            if (!Number.isFinite(bound)) throw new Error(face + " leaves the registered side ownership");
            return { ...site, member, face, current, bound,
              inside: new Map<number, number>(), gradient: [new Map<number, number>(), new Map<number, number>(), new Map<number, number>()] };
          });
        });
        if (derivatives) for (const [index, column] of columns.entries()) {
          const moved = [...state]; moved[index]! += column.step;
          const wall = AutoMovieLoftViewFullSource.create(sources(expand(moved)).get(column.face)!);
          for (const site of targets) if (site.face === column.face) {
            const changed = wall.point(site.s, site.phase);
            if (!site.member.owns(changed, true)) throw new Error("the moved wall leaves its registered divider");
            site.inside.set(index, (-site.member.divider.side(changed) - site.bound) / column.step);
            for (const [axis, gradient] of site.gradient.entries())
              gradient.set(index, (changed[axis]! - site.current[axis]!) / column.step);
          }
        }
        const measured = targets.flatMap((site) => V3.sub(site.current, site.target).map((value, k): F.IGroupRow =>
          ({ value, gradient: site.gradient[k]! })));
        const inside = targets.map((site): F.IGroupRow => ({ value: site.bound, gradient: site.inside }));
        return F.readGroup(state, derivatives, [{ rows: () => ({ measured, incidence: [], inside }) }]);
      } catch (error: unknown) { return error instanceof Error ? error.message : String(error); }
    };
    const fit = F.fitGroup(restored.values, read, tolerance, 60 - restored.iteration);
    if (typeof fit === "string") throw new Error(fit);
    if (!(fit.incidence <= tolerance)) throw new Error("the reduced attached material solve stops at " + fit.incidence + " mm: " + fit.stopped);
    const bank = new Map([...expand(fit.values)].map(([name, source]) => [name, JSON.parse(JSON.stringify(source)) as K.IStored] as const));
    const actual = sources(bank);
    const accepted = members.map((member) => {
      const candidate = bank.get(member.family.name)!;
      const refusal = member.tail.check(candidate) ?? K.tailPolicyFault(candidate, member.family);
      if (refusal !== null) throw new Error(candidate.name + ": " + refusal);
      const view = actual.get(member.placed.name)!, loft = AutoMovieViewLoft.create(view);
      if (loft.surface === null || loft.diagnostics.length > 0)
        throw new Error(candidate.name + " has no actual admitted native span: " + loft.diagnostics.map((row) => row.detail).join(", "));
      const physical = loft.surface;
      const witness = (held: boolean) => observed(member, held).map((site) => {
        const point = physical.jet(site.s, site.phase).p;
        const [a, b] = site.edge, direction = V3.sub(b, a);
        const squared = V3.dot(direction, direction);
        if (!(squared > 0)) throw new Error(candidate.name + " has an empty observed edge");
        const along = Math.min(1, Math.max(0, V3.dot(V3.sub(point, a), direction) / squared));
        return { station: site.s, forward: V3.norm(V3.sub(point, site.target)),
          reverse: V3.norm(V3.sub(point, V3.add(a, V3.scale(direction, along)))) };
      });
      const trained = witness(false), held = witness(true);
      const heldFullSourceMm = Math.max(...held.map((site) => Math.max(site.forward, site.reverse)));
      if (!(held.length > 0 && heldFullSourceMm <= 0.5))
        throw new Error(candidate.name + " lacks independent held world wall support: " + JSON.stringify({ heldFullSourceMm, held }));
      return { candidate, physical: { ...member.physical, feasibility: restored.iteration, iterations: fit.iteration, incidence: fit.incidence,
        timings: fit.timings, owned: { scope: "finite paired indexed edge and actual bound wall samples", trained, held }, heldFullSourceMm } };
    });
    return { bank, accepted };
  }

  async function survey(out: string, materialOnly: boolean): Promise<void> {
    const reference = await R.load(path.resolve(process.cwd(), ".."));
    const originalFigure = AutoMovieHumanF1.assemble();
    const proposals = () => {
      const base = AutoMovieHumanF1.constructionBareFrom(originalFigure);
      const arm = attempt(() => {
        const thorax = originalFigure.frames.get("thorax");
        if (thorax === undefined) throw new Error("the thorax carrying frame is absent");
        const body = originalFigure.body.arm, stock = originalFigure.reference(body.name);
        const shoulder = originalFigure.point("upperarm"), elbow = originalFigure.point("lowerarm");
        const landmarks = AutoMovieHumanF1Armscye.landmarks(thorax);
        return sideMember(reference, originalFigure, base, stock, body, originalFigure.body.trunk.name, "armscye." + body.name,
          elbow, landmarks, AutoMovieHumanF1Armscye.surface(thorax, shoulder, elbow),
          AutoMovieHumanF1Divide.landmarkOwner(shoulder, [shoulder, elbow, originalFigure.point("hand")], landmarks, AutoMovieHumanF1Divide.ARMSCYE_MM));
      });
      const thumb = attempt(() => {
        const metacarpal = originalFigure.frames.get("thumb.metacarpal");
        if (metacarpal === undefined) throw new Error("the metacarpal carrying frame is absent");
        const members = AutoMovieHumanF1.PRE_DOME_DIGITS.filter((digit): boolean => digit.limb === "arm" && !digit.knuckle);
        const placed = originalFigure.digits.filter((digit): boolean => digit.limb === "arm" && !digit.knuckle);
        if (members.length !== 1 || placed.length !== 1) throw new Error("the registered first web has no unique raw and placed metacarpal source");
        const root = originalFigure.point("thumb2"), tip = originalFigure.point("thumb3");
        const landmarks = [...AutoMovieHumanF1ThumbRoot.knuckleSeeds(metacarpal), AutoMovieHumanF1ThumbRoot.webFloor(metacarpal)];
        return sideMember(reference, originalFigure, base, members[0]!.family, placed[0]!.family, originalFigure.body.hand.name,
          "web." + placed[0]!.family.name, tip, landmarks, AutoMovieHumanF1ThumbRoot.surface(metacarpal, root, tip),
          AutoMovieHumanF1Divide.landmarkOwner(root, [root, tip], landmarks));
      });
      const material = attempt(() => {
        if (arm.kind === "unavailable" || thumb.kind === "unavailable")
          throw new Error([arm, thumb].flatMap((entry): string[] => entry.kind === "unavailable" ? [entry.reason] : []).join(" | "));
        return sideMaterials([arm.value, thumb.value]);
      });
      const support = attempt(() => {
        if (material.kind === "unavailable") throw new Error(material.reason);
        const figure = AutoMovieHumanF1.assemble(undefined, undefined, material.value.bank);
        for (const { candidate } of material.value.accepted) {
          const before = originalFigure.reference(candidate.name), after = figure.reference(candidate.name);
          if (K.tailPolicyFault(after, before) !== null) throw new Error(candidate.name + " changed the placed distal policy");
        }
        return { figure, installed: [...material.value.bank.keys()], originals: Object.fromEntries(material.value.bank) };
      });
      const result = (member: typeof arm, i: number) => attempt(() => {
        if (member.kind === "unavailable") throw new Error(member.reason);
        if (material.kind === "unavailable") throw new Error(material.reason);
        return material.value.accepted[i]!;
      });
      return { armSupport: result(arm, 0), thumbSupport: result(thumb, 1), support,
        located: { arm: arm.kind === "observed" ? arm.value.physical : arm, thumb: thumb.kind === "observed" ? thumb.value.physical : thumb } };
    };
    const proposed = materialOnly ? proposals() : undefined;
    const figure = proposed?.support.kind === "observed" ? proposed.support.value.figure : originalFigure;
    const contactReadings = new Map<string, { clock: number; held: boolean; gapMm: number; mirroredGapMm: number }[]>();
    const declared = AutoMovieHumanF1.constructionBareFrom(figure, undefined, !materialOnly ? undefined : (name, clock, held, gapMm, mirroredGapMm): void => {
      const list = contactReadings.get(name) ?? [];
      list.push({ clock, held, gapMm, mirroredGapMm });
      contactReadings.set(name, list);
    });
    const baseline = figure === originalFigure ? declared : AutoMovieHumanF1.constructionBareFrom(originalFigure);
    const raw = AutoMovieHumanF1.originalSources(figure, new Set([
      figure.body.trunk.name, figure.body.arm.name, figure.body.hand.name, figure.body.leg.name,
      figure.body.breast.name, figure.body.ear.name, "finger.thumb",
    ]));
    const source = (name: string): IAutoMovieViewPart => {
      const part = raw.get(name);
      if (part === undefined) throw new Error("source " + name + " is absent");
      return part;
    };
    const frame = (name: string): IAutoMovieHumanSegmentFrame => {
      const found = figure.frames.get(name);
      if (found === undefined) throw new Error("frame " + name + " is absent");
      return found;
    };
    const joinCount = (name: string): number => {
      const node = find(declared.root, name);
      if (node === null || node.type !== "join") throw new Error("join " + name + " is absent");
      return node.count;
    };
    const divide = (name: string, host: string, part: string, side: (p: readonly number[]) => number) => ({
      part: attempt(() => dividerCuts(source(part), source(host), side, joinCount(name))),
      host: attempt(() => dividerCuts(source(host), source(part), side, joinCount(name))),
    });
    const readFootprint = () => attempt(() => {
      const prior = AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT;
      let low = Infinity, high = -Infinity;
      for (let k = 1; k < reference.all.positions.length; k += 3) {
        const y = reference.all.positions[k]!;
        low = Math.min(low, y);
        high = Math.max(high, y);
      }
      const height = high - low;
      if (!(Number.isFinite(height) && height > 0)) throw new Error("the original stature is unavailable");
      const extent: [number, number, number, number] = [prior.values.up, prior.values.lateral, prior.values.down, prior.values.medial]
        .map((ratio): number => height * ratio) as [number, number, number, number];
      const host = source(figure.body.trunk.name), target = figure.point("breastTip");
      const chord = attempt(() => {
        const read = AutoMovieHumanBreastConnection.create({ trunk: host, target, footprint: extent, shoulder: Math.SQRT2 - 1, lateral: 1 });
        if (typeof read === "string") throw new Error(read);
        const relocate = AutoMovieHumanF1Divide.anteriorFeet(host, 1e-3);
        const feet = Array.from({ length: 2 * read.phases }, (_, k) => {
          const at = Math.PI * k / read.phases;
          return { at, held: k % 2 !== 0, contact: attempt(() => {
            const contact = read.contact(at);
            if (typeof contact === "string") throw new Error(contact);
            if (!(contact.point[2] > 0)) throw new Error("the original footprint leaves the authored world half");
            const { front } = contact.chord;
            return { point: contact.point, front, relocated: attempt(() => relocate(contact.point)) };
          }) };
        });
        return { rootInterval: read.rootInterval, phases: read.phases, feet };
      });
      const stock = originalFigure.reference(originalFigure.body.breast.name);
      const root: R.V = figure.point("breastRoot");
      const axis: R.V | null = V3.unit(V3.sub(target, root));
      if (axis === null) throw new Error("the projected footprint has no registered root-to-tip direction");
      const actualHost = AutoMovieLoftViewFullSource.create(host);
      const projected = chord.kind === "observed" ? chord.value.feet.flatMap(({ at, held, contact }) => {
        if (contact.kind !== "observed" || contact.value.relocated.kind !== "observed") return [];
        const world: R.V = actualHost.point(...contact.value.relocated.value.address);
        return [{ at, held, station: V3.dot(V3.sub(world, root), axis) }];
      }) : [];
      const cap = stock.tips?.[1] ?? null;
      const capStart: number | null = cap === null ? null : figure.station(stock.name, cap.from);
      const storedStart: number = figure.station(stock.name, stock.knots[0]!);
      const covered = projected.filter(({ station }): boolean => station >= storedStart &&
        (capStart === null || station < capStart));
      const material = { root, firstStored: stock.knots[0], lastStored: stock.knots.at(-1), retainedCap: cap,
        projected, capStart, reachesProtectedCap: capStart === null ? null :
          projected.filter((point): boolean => point.station >= capStart).length,
        sourceCoverage: {
          storedStart, regularTraining: covered.filter((row): boolean => !row.held).length,
          regularHeld: covered.filter((row): boolean => row.held).length,
          beforeStock: projected.filter(({ station }): boolean => station < storedStart).length,
        },
        support: "The independent footprint and historical cap do not establish a measured proximal stock interval." };
      return { population: prior.people, statureMm: height, footprintMm: extent, chord, material };
    });
    const breast = materialOnly ? { kind: "held" as const } : attempt(() => {
      const origin: R.V = figure.point("breastRoot");
      const tip: R.V = figure.point("breastTip");
      const unit = (p: R.V): R.V => {
        const length: number = Math.hypot(...p);
        if (!(length > 0)) throw new Error("breast observation has no meridian axis");
        return [p[0] / length, p[1] / length, p[2] / length];
      };
      const axis: R.V = unit([tip[0] - origin[0], tip[1] - origin[1], tip[2] - origin[2]]);
      const up: R.V = unit([-axis[1] * axis[0], 1 - axis[1] ** 2, -axis[1] * axis[2]]);
      const lateral: R.V = [axis[1] * up[2] - axis[2] * up[1], axis[2] * up[0] - axis[0] * up[2], axis[0] * up[1] - axis[1] * up[0]];
      return {
        origin, tip, axis, up, lateral,
        lowerLateralDatum: figure.point("breastFan"),
        meridians: Array.from({ length: 72 }, (_, k: number) => {
          const theta: number = 2 * Math.PI * k / 72;
          const v: R.V = [0, 1, 2].map((a: number): number => up[a]! * Math.cos(theta) + lateral[a]! * Math.sin(theta)) as R.V;
          return { theta, v, chains: R.chains(reference.all, { origin, u: axis, v }) };
        }),
        scope: "unbridged skin sections, no claim to buried host wall or inferred closed footprint",
      };
    });
    const thumb = attempt(() => {
      const carrier = frame("thumb.metacarpal");
      const p = source("finger.thumb");
      const wall = AutoMovieLoftViewFullSource.create(p);
      const address = (world: R.V) => ({
        world,
        reading: attempt(() => AutoMovieHumanJoinLoop.address(p, wall.domain, world, (wall.domain[0] + wall.domain[1]) / 2)),
      });
      const divider = AutoMovieHumanF1ThumbRoot.surface(carrier, figure.point("thumb2"), figure.point("thumb3"));
      const cuts = divide("web.finger.thumb", figure.body.hand.name, p.name, divider.side);
      const landmarks = FamilyConicThumbRoot.read(reference);
      const floor = landmarks.landmarks.find(([name]): boolean => name === "web floor")?.[1];
      if (floor === undefined || floor === null) throw new Error("the measured thumb divider lacks its web-floor landmark");
      indexedSeedControl();
      const seed = indexedLandmarkRay(reference.body, landmarks.middle, floor, 1e-3);
      return {
        landmarks,
        inSupportSeeds: AutoMovieHumanF1ThumbRoot.knuckleSeeds(carrier).map(address),
        webFloor: address(AutoMovieHumanF1ThumbRoot.webFloor(carrier)),
        master: masterRays(reference, source(figure.body.hand.name), p, divider,
          AutoMovieHumanF1ThumbRoot.webFloor(carrier), joinCount("web.finger.thumb"), 1e-3,
          cuts.host.kind === "observed" ? cuts.host.value : undefined, cuts.part.kind === "observed" ? cuts.part.value : undefined, seed),
        cuts,
      };
    });
    const arm = attempt(() => {
      const thorax = frame("thorax");
      const divider = AutoMovieHumanF1Armscye.surface(thorax, figure.point("upperarm"), figure.point("lowerarm"));
      const ref = materialOnly ? undefined : FamilyConicLoop.build(reference);
      const cuts = divide("armscye." + figure.body.arm.name, figure.body.trunk.name, figure.body.arm.name, divider.side);
      return {
        landmarks: ref?.landmarks,
        referenceRaysFaired: ref?.points,
        apex: AutoMovieHumanF1Armscye.apex(thorax),
        master: masterRays(reference, source(figure.body.trunk.name), source(figure.body.arm.name), divider,
          AutoMovieHumanF1Armscye.apex(thorax), joinCount("armscye." + figure.body.arm.name), 1e-3,
          cuts.host.kind === "observed" ? cuts.host.value : undefined, cuts.part.kind === "observed" ? cuts.part.value : undefined),
        cuts,
      };
    });
    if (proposed !== undefined) {
      const readSide = (name: string, tree: typeof declared = declared) =>
        [name, name + ".mirror"].map((id) => attempt(() => {
          const join = find(tree.root, id);
          if (join === null || join.type !== "join") throw new Error("the declared physical side join is absent: " + id);
          const seed = join.seed, loop = join.loop;
          if (seed.type !== "point" || loop === undefined)
            throw new Error(id + " has no complete source-owned material loop");
          if ("source" in loop) {
            const prepared = tree.loopSources().get(loop.source);
            if (prepared === undefined) throw new Error(id + " has no declared original loop reader");
            if (prepared.kind === "refused") throw new Error(prepared.detail);
          } else if (loop.shape?.length !== join.count) throw new Error(id + " has no complete radial source columns");
          const host = AutoMovieLoftViewFullSource.create(tree.sources.get(seed.hostFace)!);
          const child = AutoMovieLoftViewFullSource.create(tree.sources.get(seed.partFace)!);
          const seedGapMm = AutoMovieHumanJoinLoop.columnGap(host, child, [1000 * seed.host[0], seed.host[1]], [1000 * seed.part[0], seed.part[1]]);
          return { name: id, host: seed.hostFace, child: seed.partFace, seed, loop, columns: join.count, seedGapMm, toleranceM: join.tolerance };
        }));
      const measure = (name: string, input: typeof proposed.armSupport) => {
        if (input.kind === "unavailable") return input;
        if (proposed.support.kind === "unavailable") return proposed.support;
        if (!proposed.support.value.installed.includes(input.value.candidate.name)) throw new Error("the source bank omitted an admitted material");
        return readSide(name);
      };
      const result = {
        unit: "mm", source: "ordinary declared getters on the bank of independently admitted proximal sources",
        located: proposed.located,
        input: { arm: proposed.armSupport.kind === "observed" ? proposed.armSupport.value.physical : proposed.armSupport,
          thumb: proposed.thumbSupport.kind === "observed" ? proposed.thumbSupport.value.physical : proposed.thumbSupport },
        bank: proposed.support.kind === "observed" ? { kind: "prepared", installed: proposed.support.value.installed, originals: proposed.support.value.originals } : proposed.support,
        sides: {
          thumb: { observed: thumb, baseline: readSide("web.finger.thumb", baseline),
            actual: measure("web.finger.thumb", proposed.thumbSupport) },
          armscye: { observed: arm, baseline: readSide("armscye." + figure.body.arm.name, baseline),
            actual: measure("armscye." + figure.body.arm.name, proposed.armSupport) },
          ear: { independent: attempt(() => earAttachment(reference, frame("ear"))),
            baseline: readSide("root." + figure.body.ear.name, baseline),
            actual: readSide("root." + figure.body.ear.name) },
          mammary: { independent: readFootprint(), baseline: readSide("mammary." + figure.body.breast.name, baseline),
            actual: readSide("mammary." + figure.body.breast.name) },
        },
      };
      await fs.writeFile(out, JSON.stringify({ ...result, contactReadings: Object.fromEntries(contactReadings) }) + "\n", { flag: "wx" });
      return;
    }
    const ears = attempt(() => {
      const local = frame("ear");
      const attachments = earAttachment(reference, local);
      const host = source(figure.body.trunk.name), child = source(figure.body.ear.name);
      const h = AutoMovieLoftViewFullSource.create(host), p = AutoMovieLoftViewFullSource.create(child);
      const atlas = figure.earAxis ?? { family: figure.body.ear, translation: [0, 0, 0] as R.V };
      const feet = AutoMovieHumanJoinLoop.certifiedAddresses(child, p.domain, atlas.family, atlas.translation);
      const indexed = attachments.events.filter((event): boolean => event.kind === "medial-gap").map((event) => {
        const world: R.V = [0, 1, 2].map((k: number): number => local.axes.reduce(
          (sum: number, axis, j: number): number => sum + axis[k]! * event.point[j]!, local.origin[k]!)) as R.V;
        const hostPoint = attempt(() => rayWall(host, h, [world[0], world[1], 0], [0, 0, 1], world, 1e-3));
        return { edge: event.edge, world, hostPoint, physical: hostPoint.kind !== "observed" ? [] :
          feet(hostPoint.value.point).map((at) => ({ at, reading: attempt(() =>
            AutoMovieHumanJoinLoop.columnGap(h, p, [hostPoint.value.s, hostPoint.value.phi], at)) })) };
      });
      const closed = attachments.medial.filter((component): boolean => !component.branched && component.endpoints.length === 0);
      const plate = originalFigure.reference(originalFigure.body.ear.name);
      const caps = (plate.tips ?? []).map((cap): number | null =>
        cap === null ? null : figure.station(plate.name, cap.from));
      const [proximal = null, distal = null] = caps;
      const siteEvidence = indexed.flatMap(({ edge, physical }) => physical.map(({ at, reading }) => ({
        edge, child: at, kind: reading.kind,
        role: proximal !== null && at[0] <= proximal ? "proximal-cap" :
          distal !== null && at[0] >= distal ? "distal-cap" : "regular-stock",
      })));
      return { tragion: figure.point("tragion"), attachments, indexed,
        carrier: { capStarts: caps, originalDomain: p.domain, uncappedScalarSpan: p.regular, siteEvidence },
        cranialComponents: { observed: attachments.medial.length, simpleClosed: closed.length,
          openEnds: attachments.medial.map((component): number => component.endpoints.length) } };
    });
    const field = (assembly: IAutoMovieHumanF1.IAssembly, tree: IAutoMovieHumanF1.IConstruction) => {
      const host = tree.sources.get(assembly.body.trunk.name)!;
      const child = tree.sources.get(assembly.body.breast.name)!;
      const family = assembly.body.breast.native === undefined ? assembly.body.breast : assembly.reference(child.name);
      const first: number = child.stations[0]!;
      const shift: R.V = V3.sub(child.axis.at(first).origin, H.axis(family).at(first).origin);
      const h = AutoMovieLoftViewFullSource.create(host), p = AutoMovieLoftViewFullSource.create(child);
      const twin = AutoMovieLoftViewFullSource.create(tree.sources.get(child.name + ".mirror")!);
      const node = find(tree.root, "mammary." + child.name);
      if (node?.type !== "join") throw new Error("the mammary join is absent");
      const transitions: unknown[] = [];
      const readings: unknown[] = [];
      const contact = attempt(() => AutoMovieHumanF1Divide.fieldContact(host, child, assembly.point("breastRoot"), node.count,
        (sample): void => {
          const changes = sample.changes.map(({ left, right }) => [left, right].map((landing) => {
            if (landing.world === null || !("before" in landing.side)) return landing;
            const addresses = landing.side.addresses;
            if (addresses === undefined) return landing;
            return { ...landing, physical: addresses.map(({ child: at }) => ({
              at, authored: attempt(() => AutoMovieHumanJoinLoop.columnGap(h, p, landing.host, at)),
              reflected: attempt(() => AutoMovieHumanJoinLoop.columnGap(h, twin,
                [landing.host[0], -landing.host[1]], [at[0], -at[1]])),
            })) };
          }));
          transitions.push({ clock: sample.clock, origin: sample.origin, changes });
        }, { family, translation: shift }, node.tolerance * 1000,
        (onHost, onChild): void => {
          readings.push({ onHost, onChild, authored: attempt(() => AutoMovieHumanJoinLoop.columnGap(h, p, onHost, onChild)),
            reflected: attempt(() => AutoMovieHumanJoinLoop.columnGap(h, twin, [onHost[0], -onHost[1]], [onChild[0], -onChild[1]])) });
        }));
      return { contact, transitions, readings };
    };
    const breastWalls = attempt(() => field(figure, declared));
    const focusedNative = attempt(() => {
      const prepared = AutoMovieHumanF1NativeLaw.prepare(figure, declared.sources);
      const direct = AutoMovieHumanF1Engineering.resolve(prepared.fields, null, (): never => {
        throw new Error("the focused source reader received a tape request");
      }, 0.25);
      return direct.filter((item): boolean => ["tissue-0.8", "tagged-fields-minus", "tagged-fields-plus"].includes(item.id))
        .map((item) => ({ id: item.id, source: attempt(() => {
          const body = AutoMovieHumanF1.nativeFrom(item.fields, prepared);
          const tree = AutoMovieHumanF1.constructionBareFrom(body);
          if (item.id === "tissue-0.8") return field(body, tree);
          const ankle: number = AutoMovieHumanF1NativeCalibration.LEG.find(([key]): boolean => key === "ankle")![1];
          return [body.body.leg.name, body.body.leg.name + ".mirror"].map((name) => {
            const part = tree.sources.get(name)!;
            if (part.fullness.kind !== "top") throw new Error("the actual leg lacks its split angle");
            const angle = part.fullness.pieces?.[3]?.[0]?.angle;
            if (angle === undefined) throw new Error("the actual leg lacks its third-quarter angle");
            const outline = AutoMovieViewOutline.create(angle);
            if ("contract" in outline) throw new Error(outline.detail);
            const value = AutoMovieViewOutline.at(outline, ankle);
            if (typeof value === "string" || value.stationJet === null) throw new Error("the original station has no angle2");
            return { name, ankle, originalKnot: angle.knots.some((k): boolean => k.station === ankle), value: value.value,
              first: value.stationJet[0], second: value.stationJet[1] };
          });
        }) }));
    });

    const sources = new Map<string, { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface }>();
    const sourceResults = Array.from(declared.sources, ([name, part]) => ({
      name,
      reading: attempt(() => {
        const raw = AutoMovieViewLoft.create(part);
        if (raw.chain === null) throw new Error(JSON.stringify(raw.diagnostics));
        const chain = AutoMovieSolidChain.framed(raw.chain);
        const surface = AutoMovieSolidChain.surface(chain);
        if (surface === null) throw new Error("actual relieved source2 unavailable");
        sources.set(name, { chain, surface });
        return { domain: surface.domain, first: part.stations[0], last: part.stations.at(-1) };
      }),
    }));
    const endCuts = [
      "wrist." + figure.body.arm.name,
      "fan." + figure.body.hand.name,
      "fan." + figure.body.leg.name,
      "crotch",
    ].map((name: string) => ({
      name,
      reading: attempt(() => {
        const node = find(declared.root, name);
        if (!(node?.type === "split" || node?.type === "continue"))
          throw new Error("the declared open end " + name + " is absent");
        if (node.type === "split") {
          const p = node.compose;
          if (p === undefined || p.frame !== "host" ||
              !p.plane.point.every((a: number): boolean => a === 0) ||
              p.plane.normal[0] !== 0 || p.plane.normal[1] !== 0 || p.plane.normal[2] !== 1)
            throw new Error(name + ": the declared composition plane is not the host section");
        }
        const host = source(node.hostFace);
        const station: number = host.stations[node.hostEnd === "bottom" ? 0 : host.stations.length - 1]!;
        const chart = host.axis.at(station);
        return {
          host: host.name,
          station,
          frame: chart,
          chains: R.chains(reference.all, chart),
        };
      }),
    }));
    const actual = attempt(() => FamilyConicNativePremises(declared.root, sources, undefined, declared.loopSources()));
    const contacts = declared.contactPremises();
    const contact = (name: string) => attempt(() => {
      const found = contacts.filter((item): boolean => item.name === name);
      if (found.length !== 1) throw new Error("the ordinary source has " + found.length + " paired contact declarations for " + name);
      return found[0]!;
    });
    const footprint = readFootprint();
    const sideSources = {
      thumb: { source: thumb.kind, contact: contact("web.finger.thumb") },
      armscye: { source: arm.kind, contact: contact("armscye." + figure.body.arm.name) },
      ear: { source: ears.kind, contact: contact("root." + figure.body.ear.name) },
      mammary: { source: breast.kind, footprint, contact: contact("mammary." + figure.body.breast.name) },
    };
    await fs.writeFile(out, JSON.stringify({
      unit: "mm",
      side: "+Z authored reference; twin only in operator census",
      reference: { arm, thumb, ears, breast, endCuts },
      pairedWalls: { breast: breastWalls, focusedNative },
      foot: {
        anatomical: AutoMovieHumanF1NativeSites.footStation(figure.body.leg, figure.point("footBall")),
        terminal: declared.sources.get(figure.body.leg.name)?.stations.at(-1),
        calibration: attempt(() => AutoMovieHumanF1NativeCalibration.readReference(figure, declared.sources).fields.extremities.foot),
      },
      sources: sourceResults,
      contacts, sideSources,
      actual,
    }) + "\n", { flag: "wx" });
  }

  export async function main(): Promise<void> {
    const args: string[] = process.argv.slice(2);
    if (args.includes("--survey") || args.includes("--side-material")) {
      const out: string | undefined = args[1]?.startsWith("--out=") ? args[1].slice(6) : undefined;
      if (args.length !== 2 || (args[0] !== "--survey" && args[0] !== "--side-material") || out === undefined ||
          !path.isAbsolute(out) || path.extname(out) !== ".json")
        throw new Error("choose --survey or --side-material followed by --out=<new absolute JSON file>");
      const evidence = await fs.realpath(path.resolve("..", "packages", "human", ".shots", "campaign3-supervision-20261116"));
      const directory = await fs.realpath(path.dirname(out));
      const relative: string = path.relative(evidence, directory);
      if (path.isAbsolute(relative) || relative === ".." || relative.startsWith(".." + path.sep))
        throw new Error("the survey receipt must stay under " + evidence);
      const receipt: string = path.join(directory, path.basename(out));
      try {
        await fs.lstat(receipt);
        throw new Error("the survey receipt already exists: " + receipt);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      return survey(receipt, args[0] === "--side-material");
    }
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
