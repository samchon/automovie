import { AutoMovieLoftChain, AutoMovieSolidChain, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import { AutoMovieHumanLegBuild } from "../generation/leg/AutoMovieHumanLegBuild";
import { AutoMovieHumanLegHipRoot } from "../generation/leg/AutoMovieHumanLegHipRoot";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeArmDraw } from "./NodeArmDraw";
import type { NodeLegBuild } from "./NodeLegBuild";

type V3 = [number, number, number];

/**
 * The whole-trunk view of the legs for `node:leg-specs`: the trunk's S00
 * (f1_trunk's own build, read once) with both legs rooted on its pants split
 * through their hip-root bands (`AutoMovieHumanLegHipRoot`), each leg's chain
 * below its rail and its toes, in world coordinates, as clay at front, left,
 * back and below plus a crotch close-up from the front and from below. The
 * legs, the split and the bands' rail stations and crease windows come from
 * the leg's generation entry (`AutoMovieHumanLegBuild.body`). It also
 * measures the two legs' medial clearance below the furrow: at every sampled
 * course station the left leg's medial-most point and the right leg's, read
 * across the midsagittal plane. Display and measurement only.
 */
export namespace NodeLegWhole {
  /** One side's rooted build. */
  export interface ISide {
    /** The build in world. */
    build: NodeLegBuild.IBuild;

    /** The hip root, or null without a split. */
    root: AutoMovieHumanLegHipRoot.IOutput | null;

    /** The leg's inputs as built, the trunk's contours read into its furrow box. */
    inputs?: NodeLegBuild.IInputs;
  }

  /** The whole build and its measures. */
  export interface IOutput {
    /** Both sides. */
    sides: Record<"left" | "right", ISide>;

    /** S00's chain, or null. */
    trunk: IAutoMovieLoftChain | null;

    /** Notes: the split's refusal, the bands' refusals. */
    diagnostics: string[];

    /** Medial clearance per sampled station below the rail: station, clearance (mm, negative is interpenetration). */
    clearance: { station: number; height: number; clearance: number }[];

    /** The root loop's and the rail's half extents about each leg's crotch-level section frame, mm: +u (lateral), -u, +v, -v. */
    extents: Record<string, Record<string, number>>;

    /** Layer counts and the band's back against the trunk's back contour (mm). */
    density: Record<string, number>;

    /** Milliseconds: the split's S00 build, both legs and both hip roots. */
    ms: Record<string, number>;
  }

  /** Build the split once and both rooted legs. */
  export function build(parameters: IAutoMovieHumanParameters): IOutput {
    const body: AutoMovieHumanLegBuild.IBody = AutoMovieHumanLegBuild.body(parameters);
    const diagnostics: string[] = [...body.diagnostics];
    const ms: Record<string, number> = { ...body.ms };
    const split: AutoMovieHumanLegBuild.IBody["split"] = body.split;
    const contour: AutoMovieHumanLegBuild.IBody["contour"] = body.contour;
    const side: (name: "left" | "right") => ISide = (name: "left" | "right"): ISide => {
      const t: number = performance.now();
      const leg: AutoMovieHumanLegBuild.ISide = body.sides[name];
      const b: NodeLegBuild.IBuild = leg.build;
      const field: IAutoMovieSolidSurface | null = b.chain === null ? null : AutoMovieSolidChain.surface(b.chain);
      let root: AutoMovieHumanLegHipRoot.IOutput | null = null;
      if (split.split === null) diagnostics.push(`${name}: no hip root without the split`);
      else if (field === null || b.loft.course.axis === null) diagnostics.push(`${name}: the leg has no surface or course for its hip root`);
      else {
        root = AutoMovieHumanLegHipRoot.create({ split: split.split, side: name, leg: field, axis: b.loft.course.axis, depth: leg.rail, ...(leg.crease === null ? {} : { crease: leg.crease }) });
        diagnostics.push(...root.diagnostics.map((d: string): string => `${name}: ${d}`));
      }
      ms[`${name}.root`] = performance.now() - t;
      return { build: b, root, inputs: leg.inputs };
    };
    const sides: Record<"left" | "right", ISide> = { left: side("left"), right: side("right") };

    // Medial clearance below the rail, read at matching stations of the two mirrored legs.
    const clearance: { station: number; height: number; clearance: number }[] = [];
    const L: NodeLegBuild.IBuild = sides.left.build;
    const R: NodeLegBuild.IBuild = sides.right.build;
    if (L.chain !== null && R.chain !== null) {
      const phases: number[] = Array.from({ length: 360 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 360);
      const start: number = sides.left.root?.depth ?? 0;
      const knee: number = L.loft.station(L.landmarks.course.knee);
      for (let s: number = start; s <= knee; s += 4) {
        const left: number = Math.max(...AutoMovieLoftChain.ring(L.chain, s, phases).map((p: V3): number => p[2]));
        const right: number = Math.min(...AutoMovieLoftChain.ring(R.chain, s, phases).map((p: V3): number => p[2]));
        clearance.push({ station: s, height: AutoMovieLoftChain.axis(L.chain, s)[1], clearance: right - left });
      }
    }
    // The root loop's and the rail's extents about the leg's crotch-level section frame (u lateral, v the chart's second axis), per side.
    const extents: Record<string, Record<string, number>> = {};
    for (const name of ["left", "right"] as const) {
      const s: ISide = sides[name];
      const axis: ReturnType<NonNullable<NodeLegBuild.IBuild["loft"]["course"]["axis"]>["at"]> | null = s.build.loft.course.axis === null ? null : s.build.loft.course.axis.at(0);
      if (axis === null || s.root === null || s.build.chain === null) continue;
      const along: (p: V3, d: V3) => number = (p: V3, d: V3): number => (p[0] - axis.origin[0]) * d[0] + (p[1] - axis.origin[1]) * d[1] + (p[2] - axis.origin[2]) * d[2];
      const loop: V3[] = Array.from({ length: 720 }, (_: unknown, k: number): V3 => s.root!.loop((2 * Math.PI * k) / 720));
      const rail: V3[] = AutoMovieLoftChain.ring(s.build.chain, s.root.depth, Array.from({ length: 720 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 720));
      const ext: (pts: V3[]) => number[] = (pts: V3[]): number[] => [Math.max(...pts.map((p: V3): number => along(p, axis.u))), Math.max(...pts.map((p: V3): number => -along(p, axis.u))), Math.max(...pts.map((p: V3): number => along(p, axis.v))), Math.max(...pts.map((p: V3): number => -along(p, axis.v)))];
      const [l0, m0, p0, a0]: number[] = ext(loop);
      const [l1, m1, p1, a1]: number[] = ext(rail);
      extents[name] = { loopU: l0!, loopMinusU: m0!, loopV: p0!, loopMinusV: a0!, railU: l1!, railMinusU: m1!, railV: p1!, railMinusV: a1! };
    }
    // Densities: each chain's layers, and the band's back against the trunk's back contour between the fold and the crotch.
    const density: Record<string, number> = {};
    for (const name of ["left", "right"] as const) {
      const s: ISide = sides[name];
      density[`${name}.leg.layers`] = s.build.chain?.layers.length ?? 0;
      density[`${name}.toes.layers.max`] = Math.max(0, ...s.build.toes.map((t: { loft: { chain: IAutoMovieLoftChain | null } }): number => t.loft.chain?.layers.length ?? 0));
      const band: AutoMovieHumanLegHipRoot.IOutput["band"] | undefined = s.root?.band;
      if (contour === null || band === null || band === undefined) continue;
      const apex: V3 = contour[name].at(contour.fold);
      let worst: number = 0;
      let behind: number = 0;
      for (let i: number = 0; i <= 48; ++i)
        for (let k: number = 0; k < 360; ++k) {
          const p: readonly number[] = band.jet(i / 48, (2 * Math.PI * k) / 360).p;
          if (Math.abs(p[2]! - apex[2]) > 3 || p[1]! < contour.fold || p[1]! > contour.crotch || p[0]! > apex[0] + 60) continue;
          const d: number = p[0]! - contour[name].at(p[1]!)[0];
          worst = Math.max(worst, Math.abs(d));
          behind = Math.min(behind, d);
        }
      density[`${name}.band.backDeviation.max`] = worst;
      density[`${name}.band.backBehindContour.max`] = -behind;
    }
    return { sides, trunk: split.s00.chain, diagnostics, clearance, ms, extents, density };
  }

  /** Clay triangles of the whole: S00, both bands, both legs below their rails, all toes. */
  export function triangles(whole: IOutput): [V3, V3, V3][] {
    const out: [V3, V3, V3][] = [];
    if (whole.trunk !== null) out.push(...grid(whole.trunk, null, 3, 96));
    for (const side of [whole.sides.left, whole.sides.right]) {
      const b: NodeLegBuild.IBuild = side.build;
      if (b.chain !== null) out.push(...grid(b.chain, side.root?.band === null || side.root === null ? null : side.root.depth, 2, 72));
      if (side.root?.band) out.push(...bandTriangles(side.root));
      for (const toe of b.toes) if (toe.loft.chain !== null) out.push(...grid(toe.loft.chain, null, 1.5, 32, true));
    }
    return out;
  }

  /** Clay triangles of S00 alone, so its own surface reads apart from the bands' and the legs'. */
  export function trunkTriangles(whole: IOutput): [V3, V3, V3][] {
    return whole.trunk === null ? [] : grid(whole.trunk, null, 3, 96);
  }

  /** Draw the whole at a camera and caption it. */
  export function draw(whole: IOutput, forward: V3, bounds: V3[], caption: string[], mesh: [V3, V3, V3][]): NodeArmDraw.IView {
    const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
    NodeArmDraw.clay(v, mesh);
    for (const side of [whole.sides.left, whole.sides.right])
      if (side.root !== null) {
        const loop: V3[] = Array.from({ length: 129 }, (_: unknown, k: number): V3 => side.root!.loop((2 * Math.PI * k) / 128));
        NodeArmDraw.line(v, loop, "#ff7a00", 1.4, [5, 3]);
      }
    NodeArmDraw.caption(v, caption);
    return v;
  }

  /**
   * Draw the whole under a raking light: flat Lambert clay lit from the given
   * world direction (nearly tangent to the inspected surface), far to near,
   * so a crease or a step reads as a hard shade change.
   */
  export function raked(forward: V3, bounds: V3[], caption: string[], mesh: [V3, V3, V3][], light: V3): NodeArmDraw.IView {
    const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
    const l: V3 = NodeArmDraw.unit(light);
    const order: { t: [V3, V3, V3]; depth: number }[] = mesh.map((t: [V3, V3, V3]): { t: [V3, V3, V3]; depth: number } => ({ t, depth: NodeArmDraw.dot(NodeArmDraw.add(NodeArmDraw.add(t[0], t[1]), t[2]), v.forward) }));
    order.sort((a: { depth: number }, b: { depth: number }): number => b.depth - a.depth);
    for (const { t } of order) {
      const n0: V3 = NodeArmDraw.cross(NodeArmDraw.sub(t[1], t[0]), NodeArmDraw.sub(t[2], t[0]));
      const len: number = Math.hypot(...n0);
      if (!(len > 0)) continue;
      const n: V3 = NodeArmDraw.scale(n0, (NodeArmDraw.dot(n0, v.forward) > 0 ? -1 : 1) / len);
      const k: number = 0.12 + 0.88 * Math.max(0, NodeArmDraw.dot(n, l));
      v.g.fillStyle = `rgb(${Math.round(196 * k)},${Math.round(190 * k)},${Math.round(182 * k)})`;
      v.g.strokeStyle = v.g.fillStyle;
      v.g.lineWidth = 0.6;
      v.g.beginPath();
      const [a, b, c]: [number, number][] = t.map((p: V3): [number, number] => v.project(p));
      v.g.moveTo(a![0], a![1]);
      v.g.lineTo(b![0], b![1]);
      v.g.lineTo(c![0], c![1]);
      v.g.closePath();
      v.g.fill();
      v.g.stroke();
    }
    NodeArmDraw.caption(v, caption);
    return v;
  }

  /** A chain's station-phase grid as triangles, from `from` (or its first layer) to its end, fanned to its far pole when asked. */
  function grid(chain: IAutoMovieLoftChain, from: number | null, step: number, count: number, pole: boolean = false): [V3, V3, V3][] {
    const a: number = from ?? chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil((z - a) / step));
    const phases: number[] = Array.from({ length: count }, (_: unknown, k: number): number => (2 * Math.PI * k) / count);
    const rows: V3[][] = Array.from({ length: n + 1 }, (_: unknown, k: number): V3[] => AutoMovieLoftChain.ring(chain, a + ((z - a) * k) / n, phases));
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < count; ++k) {
        const k1: number = (k + 1) % count;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    const tip: V3 | undefined = (chain.opposite?.point ?? chain.pole?.point) as V3 | undefined;
    if (pole && tip !== undefined) for (let k: number = 0; k < count; ++k) out.push([tip, rows[n]![k]!, rows[n]![(k + 1) % count]!]);
    return out;
  }

  /** The band's (transverse, clock) grid as triangles. */
  function bandTriangles(root: AutoMovieHumanLegHipRoot.IOutput): [V3, V3, V3][] {
    const band: NonNullable<AutoMovieHumanLegHipRoot.IOutput["band"]> = root.band!;
    // 49 transverse rows and 192 clock columns: the fold's curvature, not the grid, should read under raking light.
    const rows: V3[][] = Array.from({ length: 49 }, (_: unknown, i: number): V3[] =>
      Array.from({ length: 192 }, (__: unknown, k: number): V3 => {
        const p: readonly number[] = band.jet(i / 48, (2 * Math.PI * k) / 192).p;
        return [p[0]!, p[1]!, p[2]!];
      }),
    );
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < 192; ++k) {
        const k1: number = (k + 1) % 192;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    return out;
  }
  /**
   * The capture's loft for a rooted leg: the chain's rings, guides and clay
   * from the rail down (above the rail the hip-root band is the surface),
   * the band's rings and clock lines, and the band's clay, world mm.
   */
  export function captureLoft(chain: IAutoMovieLoftChain, root: AutoMovieHumanLegHipRoot.IOutput, diagnostics: readonly string[]): CaptureModel.ILoft {
    if (root.band === null) return { status: "unavailable", cause: `hip root band refused: ${root.diagnostics.join(" | ")}` };
    const band: NonNullable<AutoMovieHumanLegHipRoot.IOutput["band"]> = root.band;
    const at: (v: number, c: number) => V3 = (v: number, c: number): V3 => {
      const p: readonly number[] = band.jet(v, c).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    const ring64: number[] = Array.from({ length: 65 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64);
    const lines: CaptureModel.ILine[] = chain.layers
      .filter((l: IAutoMovieLoftChain.ILayer): boolean => l.y >= root.depth - 1e-9)
      .map((l: IAutoMovieLoftChain.ILayer, k: number): CaptureModel.ILine => ({ id: `loft:ring:${k}`, closed: true, colour: "505050", points: AutoMovieLoftChain.ring(chain, l.y, ring64) as V3[] }));
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const ys: number[] = Array.from({ length: Math.ceil((last - root.depth) / 1.5) + 1 }, (_: unknown, k: number): number => Math.min(last, root.depth + 1.5 * k));
    (["008080", "8040c0", "c00060", "e07000"] as const).forEach((colour: string, k: number): void => {
      lines.push({ id: `loft:guide:${k}`, closed: false, colour, points: ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, (k * Math.PI) / 2) as V3) });
    });
    for (const v of [0, 0.25, 0.5, 0.75, 1]) lines.push({ id: `band:ring:${v}`, closed: true, colour: v === 0 ? "ff7a00" : "707070", points: ring64.map((c: number): V3 => at(v, c)) });
    for (let k: number = 0; k < 8; ++k) lines.push({ id: `band:clock:${k}`, closed: false, colour: "707070", points: Array.from({ length: 13 }, (_: unknown, i: number): V3 => at(i / 12, (k * Math.PI) / 4)) });
    const positions: number[] = [];
    const indices: number[] = [];
    const grid: (rows: V3[][]) => void = (rows: V3[][]): void => {
      const base: number = positions.length / 3;
      const n: number = rows[0]!.length;
      for (const row of rows) for (const p of row) positions.push(p[0], p[1], p[2]);
      for (let i: number = 0; i + 1 < rows.length; ++i)
        for (let k: number = 0; k < n; ++k) {
          const a: number = base + i * n + k;
          const c: number = base + i * n + ((k + 1) % n);
          indices.push(a, a + n, c + n, a, c + n, c);
        }
    };
    const around: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 72);
    const chainRows: V3[][] = ys.map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, around) as V3[]);
    grid(chainRows);
    const tip: V3 | undefined = (chain.opposite?.point ?? chain.pole?.point) as V3 | undefined;
    if (tip !== undefined) {
      const index: number = positions.length / 3;
      positions.push(tip[0], tip[1], tip[2]);
      const lastRow: number = (chainRows.length - 1) * 72;
      for (let k: number = 0; k < 72; ++k) indices.push(index, lastRow + k, lastRow + ((k + 1) % 72));
    }
    grid(Array.from({ length: 13 }, (_: unknown, i: number): V3[] => Array.from({ length: 96 }, (__: unknown, k: number): V3 => at(i / 12, (2 * Math.PI * k) / 96))));
    return { status: "available", lines, clay: { positions, indices }, diagnostics: [...diagnostics] };
  }
}
