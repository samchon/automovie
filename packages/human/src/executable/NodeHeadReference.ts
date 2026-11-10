import fs from "node:fs";
import { AutoMovieLoftChain, AutoMovieMeshCourse, type AutoMovieMeshExtract, tessellateAutoMovieContourStrip64, type AutoMovieViewAxis, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import type { AutoMovieHumanHeadFrankfort } from "../generation/head/AutoMovieHumanHeadFrankfort";
import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeHeadJunction } from "./NodeHeadJunction";
import { NodeHeadNativeJunctions } from "./NodeHeadNativeJunctions";
import { NodeHeadOrbit } from "./NodeHeadOrbit";
import { NodeHeadTrace } from "./NodeHeadTrace";

type V3 = [number, number, number];
type V2 = [number, number];
type Seam = { chain: string; end: "top" | "bottom"; rail: string; station?: number };
type Layout = { seams: Seam[]; replace?: string } & (NodeHeadJunction.ILayout | { name: string; native: () => NodeHeadJunction.IResult });
type Junction = Pick<NodeHeadJunction.IResult, "clay" | "lines" | "rails" | "receipt">;

/**
 * Read the reference overlay and assemble the observed Stage 1 head junctions.
 * Original curves stay in their source frame for capture. An emitted seam uses
 * both existing edge sequences by index and checks their opposite incidence.
 */
export namespace NodeHeadReference {
  /** Fill only the observed one-to-one rows in the two refused local neck spans. */
  export function attachTurnedNeck(capture: CaptureModel.IPart, mesh: AutoMovieMeshExtract.IMesh, axis: AutoMovieViewAxis.IAxis, chains: readonly IAutoMovieLoftChain[]): void {
    if (capture.loft.status !== "available") return;
    const neck: IAutoMovieLoftChain[] = chains.filter((chain: IAutoMovieLoftChain): boolean => (chain.name ?? "").startsWith("head.neck."));
    for (let i: number = 1; i < neck.length; ++i) {
      const lower: IAutoMovieLoftChain = neck[i - 1]!;
      const upper: IAutoMovieLoftChain = neck[i]!;
      const from: number = lower.layers.at(-1)!.y;
      const to: number = upper.layers[0]!.y;
      if (to <= from) continue;
      const name: string = `submental course ${from.toFixed(3)}–${to.toFixed(3)} mm`;
      try {
        const { bands, notes } = NodeHeadTrace.turnedBands(name, mesh, CaptureSpecs.steps(from, to, 1).map((s: number): AutoMovieMeshCourse.IPlane => coursePlane(axis, s)));
        report(capture, `${name}: ${bands.length} one-to-one raw bands; boundary observations [${notes.join(" | ")}]`);
        for (const band of bands) {
          let generated: CaptureModel.ILoft = CaptureSpecs.loft(band, []);
          if (generated.status !== "available") continue;
          let a: number = band.layers[0]!.y;
          const b: number = band.layers.at(-1)!.y;
          const phases: number = generated.clay.indices[1]!;
          const first: number[] = Array.from({ length: phases }, (_: unknown, k: number): number => k);
          const initial: Extract<CaptureModel.ILoft, { status: "available" }> = generated;
          const initialA: number = a;
          const lastStart: number = initial.clay.positions.length / 3 - phases;
          const initialRails: Map<string, number[]> = new Map([["first", first], ["last", first.map((k: number): number => lastStart + k)]]);
          let rails: Map<string, number[]> = initialRails;
          let clipReceipt: string = "";
          if (i === 1 && a > from) {
            try {
              const clip: Junction = NodeHeadOrbit.clip(mesh, coursePlane(axis, from), coursePlane(axis, a));
              const staged: Extract<CaptureModel.ILoft, { status: "available" }> = { ...generated };
              const links: string[] = stitchJunction(staged, clip, [{ chain: band.name!, end: "bottom", rail: "last", station: a }], [band], mesh, axis);
              if (links.length !== 1 || links[0]!.includes("unsewn:")) throw new Error(links.join(" | "));
              const end: Junction = { clay: generated.clay, lines: [], rails, receipt: "" };
              rails = new Map([["first", originalRim(staged.clay, clip, "first")], ["last", originalRim(staged.clay, end, "last")]]);
              generated = staged;
              a = from;
              clipReceipt = [clip.receipt, ...links].join("\n");
            } catch (error) {
              report(capture, `original submental skin refused: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          const seams = (start: number): Seam[] => [
            ...(start === from ? [{ chain: lower.name!, end: "top", rail: "first", station: start } as const] : []),
            ...(b === to ? [{ chain: upper.name!, end: "bottom", rail: "last", station: b } as const] : []),
          ];
          const midplanes: AutoMovieMeshCourse.IPlane[] = band.layers.slice(1).map((row: IAutoMovieLoftChain.ILayer, k: number): AutoMovieMeshCourse.IPlane =>
            coursePlane(axis, (band.layers[k]!.y + row.y) / 2),
          );
          const residual: string = NodeHeadJunction.surfaceResidual(mesh, generated.clay, midplanes);
          const target: Extract<CaptureModel.ILoft, { status: "available" }> = clipReceipt === "" ? capture.loft : { ...capture.loft };
          let joins: string[] = stitchJunction(target, { clay: generated.clay, lines: generated.lines, rails, receipt: residual }, seams(a), chains, mesh, axis);
          if (clipReceipt !== "" && joins.some((join: string): boolean => join.includes("unsewn:"))) {
            report(capture, `original submental skin refused at the outer rails: ${joins.join(" | ")}`);
            a = initialA;
            joins = stitchJunction(capture.loft, { ...initial, rails: initialRails, receipt: residual }, seams(a), chains, mesh, axis);
          } else if (clipReceipt !== "") {
            capture.loft = target;
            report(capture, clipReceipt);
          }
          report(capture, `${name}, observed ${a.toFixed(3)}–${b.toFixed(3)} mm: ${residual}; ${joins.join(" | ")}`);
        }
      } catch (error) {
        report(capture, `${name} refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    NodeHeadNativeJunctions.repairOuterSpans(capture, NodeHeadOrbit.skin(mesh), mesh, NodeHeadOrbit.clipPlane, NodeHeadOrbit.connect);
  }
  /** Prefer the complete observed forehead span where the existing section fits missed it. */
  export function withForehead(archive: string, mesh: AutoMovieMeshExtract.IMesh, chains: IAutoMovieLoftChain[], diagnostics: string[]): { chains: IAutoMovieLoftChain[]; forehead: NodeHeadJunction.IResult | null } {
    try {
      const forehead: ReturnType<typeof NodeHeadJunction.forehead> = NodeHeadJunction.forehead(archive, mesh);
      if (!forehead.qualified || !forehead.rails.has("forehead:top")) throw new Error(forehead.receipt);
      return {
        forehead,
        chains: chains.filter((chain: IAutoMovieLoftChain): boolean =>
          !(chain.name ?? "").startsWith("head.face") || chain.layers[0]!.y < forehead.from || chain.layers.at(-1)!.y > forehead.to,
        ),
      };
    } catch (error) {
      diagnostics.push(`forehead exterior refused: ${error instanceof Error ? error.message : String(error)}`);
      return { chains, forehead: null };
    }
  }

  /** Join observed head junctions to their physical neighbours and preserve unresolved boundary ownership. */
  export function attachOriginalJunctions(capture: CaptureModel.IPart, archive: string, mesh: AutoMovieMeshExtract.IMesh, chains: readonly IAutoMovieLoftChain[], axis: AutoMovieViewAxis.IAxis | undefined, forehead: NodeHeadJunction.IResult | null): void {
    if (capture.loft.status !== "available") return;
    // The observed right orbitale in the F1 head measurement, in capture world millimetres.
    capture.ports.push({ name: "orbit", point: [103.44128859022192, 1579.628451098783, 31.07267043229048], radius: 53 });
    const native = (): CaptureModel.ITriangles => NodeHeadOrbit.skin(mesh);
    const layouts: Layout[] = [
      ...NodeHeadNativeJunctions.ARCHIVED,
      { name: "original right ear terminal", seams: [{ chain: "head.right-lobe", end: "bottom", rail: "rim" }],
        native: () => NodeHeadNativeJunctions.terminal(native(), NodeHeadOrbit.clipPlane, 1541.1154556274414, 1541.1328125,
          [23.4403657913208, 1541.1158752441406, 71.77016258239746], "top", "right ear terminal") },
      // Ordinal 1 is a separate inner oral wall at these ear sections.
      { name: "ear junction", file: "sections/head/004.json", first: 933, ordinals: [[0, 2, 3], [0, 2], [0, 2], [0]], events: ["critical.403", "critical.404"], seams: [
        { chain: "head.face-linked.882", end: "top", rail: "0:0" },
        { chain: "head.right-lobe", end: "top", rail: "0:1" },
        { chain: "head.left-lobe", end: "top", rail: "0:2" },
        { chain: "head.face-linked.936", end: "bottom", rail: "3:0" },
      ] },
      { name: "crown closure", file: "sections/head/019.json", first: 2892, ordinals: [[0], [0], []], events: ["critical.1379"], seams: [
        { chain: "head.vault", end: "top", rail: "0:0" },
      ] },
    ];
    for (const layout of layouts) {
      let receipt: string;
      try {
        const join: NodeHeadJunction.IResult = "native" in layout ? layout.native() : NodeHeadJunction.create(archive, layout, mesh);
        const staged: Extract<CaptureModel.ILoft, { status: "available" }> = { ...capture.loft };
        const seams: string[] = stitchJunction(staged, join, layout.seams, chains, mesh, undefined, layout.replace);
        if (!join.qualified || seams.some((item: string): boolean => item.includes("unsewn:"))) throw new Error([join.receipt, ...seams].join(" | "));
        capture.loft = staged;
        receipt = [join.receipt, ...seams].join("\n");
      } catch (error) {
        receipt = `${layout.name} refused: ${error instanceof Error ? error.message : String(error)}`;
      }
      report(capture, receipt);
    }
    if (forehead !== null) {
      let skin: Junction = forehead;
      try { skin = NodeHeadNativeJunctions.eyelid(forehead, native(), NodeHeadOrbit.clipPlane, NodeHeadOrbit.connect); }
      catch (error) { report(capture, `original eyelid branch refused: ${error instanceof Error ? error.message : String(error)}`); }
      report(capture, [skin.receipt, ...stitchJunction(capture.loft, skin, [{ chain: "head.vault", end: "bottom", rail: "forehead:top" }], chains, mesh)].join("\n"));
    }
    const lastNeck: IAutoMovieLoftChain | undefined = chains.filter((chain: IAutoMovieLoftChain): boolean => (chain.name ?? "").startsWith("head.neck.")).at(-1);
    try {
      const mouth: ReturnType<typeof NodeHeadJunction.mouth> = NodeHeadJunction.mouth(archive, mesh);
      capture.ports.push({ name: "mouth", point: mouth.lip, radius: 42 });
      const seams: Seam[] = [{ chain: "head.face", end: "bottom", rail: "mouth:last" }];
      if (axis !== undefined && lastNeck !== undefined)
        seams.unshift({ chain: lastNeck.name!, end: "top", rail: "mouth:first", station: lastNeck.layers.at(-1)!.y });
      let wall: Junction = mouth;
      try { wall = NodeHeadNativeJunctions.oralWall(archive, mesh, mouth, native(), NodeHeadOrbit.clipPlane, NodeHeadOrbit.connect); }
      catch (error) { report(capture, `original oral wall refused: ${error instanceof Error ? error.message : String(error)}`); }
      report(capture, [wall.receipt, ...stitchJunction(capture.loft, wall, seams, chains, mesh, axis)].join("\n"));
    } catch (error) {
      report(capture, `mouth aperture refused: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (forehead !== null) {
      try {
        const lower: Junction = NodeHeadJunction.create(archive, {
          name: "original lower orbit rim", file: "sections/head/009.json", first: 1673, ordinals: [[0], [0]], events: [],
        }, mesh);
        const staged: Extract<CaptureModel.ILoft, { status: "available" }> = { ...capture.loft };
        const seams: string[] = stitchJunction(staged, lower, [{ chain: "head.face-linked.1533", end: "top", rail: "0:0" }], chains, mesh);
        if (seams.length !== 1 || seams[0]!.includes("unsewn:")) throw new Error(seams.join(" | "));
        const lowerRim: number[] = originalRim(staged.clay, lower, "1:0");
        const upperRim: number[] = originalRim(staged.clay, forehead, "0:0");
        const joined = NodeHeadOrbit.attach(staged.clay, mesh, lowerRim, upperRim);
        capture.loft = { ...staged, clay: joined.clay, lines: staged.lines.concat(joined.lines ?? []) };
        if (joined.original !== undefined) capture.curves.push(joined.original);
        report(capture, [lower.receipt, ...seams, joined.receipt].join("\n"));
      } catch (error) {
        report(capture, `orbit exterior refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    try {
      const positions: number[] = capture.loft.clay.positions;
      const boundary = (id: number, end: Seam["end"]): number[] => {
        const chain: IAutoMovieLoftChain | undefined = chains.find((item: IAutoMovieLoftChain): boolean => item.name === `head.face-linked.${id}`);
        if (chain === undefined) throw new Error(`the lower-eye boundary chain ${id} is unavailable`);
        return adjacentRail(chain, end, positions, chains.indexOf(chain)).end;
      };
      const rims: [number[], number[]][] = [[947, 1219], [1219, 1405], [1405, 1533]].map(
        ([lower, upper]): [number[], number[]] => [boundary(lower!, "top"), boundary(upper!, "bottom")],
      );
      const joined = NodeHeadOrbit.attachBelow(capture.loft.clay, mesh, rims);
      capture.loft.clay = joined.clay;
      capture.loft.lines = capture.loft.lines.concat(joined.lines ?? []);
      report(capture, joined.receipt);
    } catch (error) {
      report(capture, `lower orbit skin refused: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
      const globes: Junction = NodeHeadJunction.globes(archive, mesh);
      if (globes.clay.indices.length > 0) stitchJunction(capture.loft, globes, [], chains, mesh);
      report(capture, globes.receipt);
    } catch (error) {
      report(capture, `eye globes refused: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** Locate unchanged vertices of an original rim after indexed compaction. */
  function originalRim(clay: CaptureModel.ITriangles, patch: Junction, name: string): number[] {
    const source: number[] | undefined = patch.rails.get(name);
    if (source === undefined || source.length === 0) throw new Error("the original rim was not emitted");
    const keys: Set<string> = new Set(source.map((index: number): string => patch.clay.positions.slice(3 * index, 3 * index + 3).join(":")));
    const same: Map<string, number> = new Map();
    for (let i: number = 0; i < clay.positions.length / 3; ++i) {
      const key: string = clay.positions.slice(3 * i, 3 * i + 3).join(":");
      if (keys.has(key)) same.set(key, i);
    }
    return source.map((index: number): number => {
      const position: number[] = patch.clay.positions.slice(3 * index, 3 * index + 3);
      const found: number | undefined = same.get(position.join(":"));
      if (found === undefined) throw new Error("the original rim lacks an unchanged indexed vertex");
      return found;
    });
  }

  function report(capture: CaptureModel.IPart, receipt: string): void {
    capture.diagnostics.push(receipt);
    if (capture.loft.status === "available") capture.loft.diagnostics.push(receipt);
    console.log(receipt);
  }

  function coursePlane(axis: AutoMovieViewAxis.IAxis, station: number): AutoMovieMeshCourse.IPlane {
    const { origin, u, v } = axis.at(station);
    return { station, origin: origin as V3, u: u as V3, v: v as V3 };
  }

  /** Preserve the original junction rails and reuse the adjacent clay's exact retained vertices. */
  function stitchJunction(
    loft: Extract<CaptureModel.ILoft, { status: "available" }>,
    join: Junction,
    seams: readonly Seam[],
    chains: readonly IAutoMovieLoftChain[],
    mesh: AutoMovieMeshExtract.IMesh,
    axis?: AutoMovieViewAxis.IAxis,
    replaceChain?: string,
  ): string[] {
    const base: number = loft.clay.positions.length / 3;
    const positions: number[] = loft.clay.positions.concat(join.clay.positions);
    let faces: number[] = loft.clay.indices.concat(join.clay.indices.map((i: number): number => base + i));
    const point = (i: number): V3 => [positions[3 * i]!, positions[3 * i + 1]!, positions[3 * i + 2]!];
    const replaced: Set<string> = new Set();
    if (replaceChain !== undefined) {
      const domain: number = chains.findIndex((chain): boolean => chain.name === replaceChain);
      faces = NodeHeadNativeJunctions.withoutBridge(faces, chains[domain], replaced,
        (chain, end) => adjacentRail(chain, end, loft.clay.positions, domain));
    }
    const reports: string[] = [];
    for (const seam of seams) {
      try {
        const source: number[] | undefined = join.rails.get(seam.rail)?.map((i: number): number => i + base);
        if (source === undefined) throw new Error("the original rail has no complete indexed boundary");
        const chain: IAutoMovieLoftChain | undefined = chains.find((candidate: IAutoMovieLoftChain): boolean =>
          candidate.name === seam.chain || ((candidate.name ?? "").startsWith(seam.chain + ".") &&
            candidate.layers.at(seam.end === "top" ? -1 : 0)?.y === point(source[0]!)[1]),
        );
        if (chain === undefined) throw new Error("the named adjacent loft is unavailable");
        const { end, kept, station, ringLine } = adjacentRail(chain, seam.end, loft.clay.positions, chains.indexOf(chain));
        if (NodeHeadTrace.railDirection(faces, end) === 0) throw new Error("the outgoing clay row is not a free indexed rail");
        const remove: Set<number> = new Set(end);
        const retained: number[] = [];
        for (let i: number = 0; i < faces.length; i += 3) {
          const a: number = faces[i]!;
          const b: number = faces[i + 1]!;
          const c: number = faces[i + 2]!;
          if (!remove.has(a) && !remove.has(b) && !remove.has(c)) retained.push(a, b, c);
        }
        const [lower, upper] = seam.end === "top" ? [kept, source] : [source, kept];
        const boundaries: [AutoMovieMeshCourse.IPlane, AutoMovieMeshCourse.IPlane] | undefined = axis === undefined || seam.station === undefined ? undefined
          : seam.end === "top" ? [coursePlane(axis, station), coursePlane(axis, seam.station)] : [coursePlane(axis, seam.station), coursePlane(axis, station)];
        const strip: number[] = sharedStrip(retained, lower, upper, point, boundaries);
        const y: number = (point(lower[0]!)[1] + point(upper[0]!)[1]) / 2;
        const centre: V3 = source.reduce((sum: V3, i: number): V3 => {
          const p: V3 = point(i);
          return [sum[0] + p[0] / source.length, y, sum[2] + p[2] / source.length];
        }, [0, y, 0]);
        const plane: AutoMovieMeshCourse.IPlane = boundaries === undefined || axis === undefined ? { station: y, origin: centre, u: [1, 0, 0], v: [0, 0, 1] }
          : coursePlane(axis, (boundaries[0].station + boundaries[1].station) / 2);
        const original: V2[] | null = AutoMovieMeshCourse.cut(mesh, [plane])[0]!.loop;
        const built: V2[] | null = AutoMovieMeshCourse.cut({ positions, indices: strip }, [plane])[0]!.loop;
        const error: string = original === null || built === null ? "raw midpoint unreadable"
          : `raw midpoint ${Math.sqrt(Math.max(NodeHeadTrace.directed(original, built), NodeHeadTrace.directed(built, original))).toFixed(3)} mm`;
        faces = retained.concat(strip);
        replaced.add(ringLine);
        reports.push(`${seam.chain} ${seam.end}: ${source.length} original and ${kept.length} retained edges reused in opposite pairs, ${error}`);
      } catch (error) {
        reports.push(`${seam.chain} ${seam.end} unsewn: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const used: Set<number> = new Set(faces);
    const compact: number[] = [];
    const remap: Map<number, number> = new Map();
    for (let i: number = 0; i < positions.length / 3; ++i) {
      if (!used.has(i)) continue;
      remap.set(i, compact.length / 3);
      compact.push(...point(i));
    }
    loft.clay = { positions: compact, indices: faces.map((i: number): number => remap.get(i)!) };
    loft.lines = loft.lines.filter((line: CaptureModel.ILine): boolean => !replaced.has(line.id)).concat(join.lines);
    return reports;
  }

  /** Locate the exact outgoing CaptureSpecs row and its first retained neighbour. */
  function adjacentRail(chain: IAutoMovieLoftChain, end: Seam["end"], positions: readonly number[], domain: number): { end: number[]; kept: number[]; station: number; ringLine: string } {
    const phases: number = 72;
    const layer: number = end === "top" ? chain.layers.length - 1 : 0;
    const stations: number[] = CaptureSpecs.steps(chain.layers[0]!.y, chain.layers.at(-1)!.y, 1.5);
    const station: number = end === "top" ? stations.at(-1)! : stations[0]!;
    const around: number[] = Array.from({ length: phases }, (_: unknown, k: number): number => (2 * Math.PI * k) / phases);
    const ring: readonly (readonly number[])[] = AutoMovieLoftChain.ring(chain, station, around);
    const row: number[] = ring.flatMap((p: readonly number[]): number[] => [p[0]!, p[1]!, p[2]!]);
    for (let i: number = 0; i + row.length <= positions.length; i += 3) {
      if (row[0] !== positions[i] || row[1] !== positions[i + 1] || row[2] !== positions[i + 2] ||
          row.some((value: number, j: number): boolean => value !== positions[i + j])) continue;
      const next: number = i / 3 + (end === "top" ? -phases : phases);
      if (next < 0 || 3 * (next + phases) > positions.length) break;
      return {
        end: around.map((_: number, j: number): number => i / 3 + j),
        kept: around.map((_: number, j: number): number => next + j),
        station: end === "top" ? stations.at(-2)! : stations[1]!,
        ringLine: `domain ${domain}:loft:ring:${layer}`,
      };
    }
    throw new Error("no exact outgoing tessellation row matches the adjacent loft");
  }

  /** Fill a pair of physical rails and certify opposite indexed incidence on both sides. */
  function sharedStrip(faces: readonly number[], lower: number[], upper: number[], point: (i: number) => V3, planes?: [AutoMovieMeshCourse.IPlane, AutoMovieMeshCourse.IPlane]): number[] {
    const ordered = (rail: number[]): V3[] => {
      const points: V3[] = rail.map(point);
      const area: number = points.reduce((sum: number, a: V3, i: number): number => {
        const b: V3 = points[(i + 1) % points.length]!;
        return sum + a[0] * b[2] - a[2] * b[0];
      }, 0);
      if (area < 0) {
        rail.reverse();
        points.reverse();
      }
      return points;
    };
    const a: V3[] = ordered(lower);
    const b: V3[] = ordered(upper);
    const advances: boolean = planes === undefined ? Math.max(...a.map((p: V3): number => p[1])) < Math.min(...b.map((p: V3): number => p[1]))
      : NodeHeadTrace.advances(a, b, planes[0], planes[1]);
    if (!advances)
      throw new Error("the two real boundary planes do not advance along the loft");
    const lowerSense: number = NodeHeadTrace.railDirection(faces, lower);
    const upperSense: number = NodeHeadTrace.railDirection(faces, upper);
    if (lowerSense === 0 || upperSense === 0 || lowerSense === upperSense)
      throw new Error(`boundary edges are unavailable or inconsistently directed (${lowerSense},${upperSense})`);
    const vertices: Map<V3, number> = new Map([...a.map((p: V3, i: number): [V3, number] => [p, lower[i]!]), ...b.map((p: V3, i: number): [V3, number] => [p, upper[i]!])]);
    const strip: number[] = [];
    let refused: string | null = null;
    tessellateAutoMovieContourStrip64(a, b, (p: V3, q: V3, r: V3): void => {
      for (const value of [p, q, r]) {
        const index: number | undefined = vertices.get(value);
        if (index === undefined) throw new Error("the strip changed a boundary vertex");
        strip.push(index);
      }
    }, undefined, (result): void => { if (!result.qualified) refused = result.diagnostics.join(" | ") || "the strip was unqualified"; });
    if (refused !== null) throw new Error(refused);
    if (NodeHeadTrace.railDirection(strip, lower) === lowerSense)
      for (let i: number = 0; i < strip.length; i += 3) [strip[i + 1], strip[i + 2]] = [strip[i + 2]!, strip[i + 1]!];
    if (NodeHeadTrace.railDirection(strip, lower) !== -lowerSense || NodeHeadTrace.railDirection(strip, upper) !== -upperSense)
      throw new Error("the strip does not share both complete ordered boundary rails");
    return strip;
  }

  /** The registered points and the registration's own measurements. */
  export interface IRegistered {
    /** Reference vertices in the head frame, mm. */
    points: V3[];

    /** Measurements of the registration and of the reference head, mm. */
    measures: Record<string, number>;
  }

  /**
   * The reference's vertices above `floor` in world mm with Z to the
   * subject's right (the native artifact is metres, +X forward, +Y up, +Z
   * anatomical left). A display selection, not a measurement.
   */
  export function load(floor: number): V3[] {
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    const out: V3[] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const y: number = p[i + 1]! * 1000;
        // Within 140 mm of the midsagittal plane: the head and neck without the shoulders.
        if (y > floor && Math.abs(p[i + 2]! * 1000) < 140) out.push([p[i]! * 1000, y, -p[i + 2]! * 1000]);
      }
    }
    return out;
  }

  /**
   * Diagnostic registration by the reference head's own extremes, translation
   * only (the reference's FH tilt is unresolved and recorded as such): its
   * vertex (highest point) onto this head's vertex height; its lateral centre
   * (midpoint of the extreme half breadths within 10 mm of 0.6 of this head's
   * tragion-vertex height, clear of the ears) onto Z = 0; and its sagittal
   * g-op midpoint (front and back
   * extremes of the midsagittal band |Z| < 6 mm within 4 mm of this head's
   * glabella height) onto the midpoint of this head's g and op. Because the
   * AP shift reads this head's own g and op places, an AP error of those
   * places is hidden in the overlay; the measures record the reference's own
   * lengths for comparison with the inputs.
   */
  export function register(points: V3[], head: AutoMovieHumanHeadFrankfort.IOutput): IRegistered {
    if (points.length < 100) return { points: [], measures: {} };
    const P: Record<AutoMovieHumanHeadFrankfort.Name, V3> = head.points;
    const top: number = points.reduce((m: number, p: V3): number => Math.max(m, p[1]), -Infinity);
    const dy: number = P.v[1] - top;
    const near: (y: number, band: number) => V3[] = (y: number, band: number): V3[] => points.filter((p: V3): boolean => Math.abs(p[1] + dy - y) < band);
    // The lateral centre is read on a band clear of the ears (0.6 of the tragion-vertex height).
    const euBand: V3[] = near(0.6 * P.v[1], 10);
    const zMax: number = Math.max(...euBand.map((p: V3): number => p[2]));
    const zMin: number = Math.min(...euBand.map((p: V3): number => p[2]));
    const dz: number = -(zMax + zMin) / 2;
    const gBand: V3[] = near(P.g[1], 4).filter((p: V3): boolean => Math.abs(p[2] + dz) < 6);
    const xMax: number = Math.max(...gBand.map((p: V3): number => p[0]));
    const xMin: number = Math.min(...gBand.map((p: V3): number => p[0]));
    const dx: number = (P.g[0] + P.op[0]) / 2 - (xMax + xMin) / 2;
    const placed: V3[] = points.map((p: V3): V3 => [p[0] + dx, p[1] + dy, p[2] + dz]);
    const lowest: number = placed.filter((p: V3): boolean => p[0] > 40 && Math.abs(p[2]) < 10).reduce((m: number, p: V3): number => Math.min(m, p[1]), Infinity);
    const breadth: number = placed.filter((p: V3): boolean => p[1] > 0).reduce((m: number, p: V3): number => Math.max(m, Math.abs(p[2])), 0) * 2;
    return {
      points: placed,
      measures: {
        shiftX: dx,
        shiftY: dy,
        shiftZ: dz,
        referenceGOpAtGlabellaHeight: xMax - xMin,
        inputGOp: head.dims.length,
        referenceBreadthAboveFH: breadth,
        inputEuEu: head.dims.breadth,
        referenceEuBandBreadth: zMax - zMin,
        referenceVertexHeightWorld: top,
        referenceLowestFrontMidlineY: lowest,
        modelMentonY: P.me[1],
      },
    };
  }

  /**
   * The reference's points in the head frame by the newest `node:head-measure`
   * receipt's own Frankfort frame (origin the tragia's midpoint, its FH axes,
   * all in the native frame), so the overlay compares like with like; null
   * without a receipt. Diagnostic only.
   */
  export function frankfort(points: V3[]): IRegistered | null {
    const dir: string = HumanNodePaths.resolve("packages/human/.shots/f1_head");
    const receipts: string[] = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name: string): boolean => name.startsWith("measure-")).sort((a: string, b: string): number => a.localeCompare(b)) : [];
    const newest: string | undefined = receipts[receipts.length - 1];
    if (newest === undefined) return null;
    const receipt: { frame: { origin: V3; X: V3; Y: V3; Z: V3 } } = JSON.parse(fs.readFileSync(`${dir}/${newest}/head.json`, "utf8"));
    const { origin, X, Y, Z } = receipt.frame;
    const dot: (a: V3, b: V3) => number = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    // The loaded points carry Z negated (to the subject's right); the receipt's frame is in the native frame.
    const out: V3[] = points.map((p: V3): V3 => {
      const d: V3 = [p[0] - origin[0], p[1] - origin[1], -p[2] - origin[2]];
      return [dot(d, X), dot(d, Y), dot(d, Z)];
    });
    return { points: out, measures: { receiptFrameOriginY: origin[1] } };
  }

  /**
   * The reference's points in her own upright frame, her tragia's midpoint
   * (the newest receipt's origin) at the origin and her native axes kept
   * (+X forward, +Y up, +Z right): the registration of her neck by its own
   * segment axes (her trunk stands upright), where the Frankfort
   * registration reads her head's 5.5 degree pitch as a rotation of her
   * neck. The model stands with FH level, so its head frame is upright here.
   * Null without a receipt. Diagnostic only.
   */
  export function upright(points: V3[]): IRegistered | null {
    const dir: string = HumanNodePaths.resolve("packages/human/.shots/f1_head");
    const receipts: string[] = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name: string): boolean => name.startsWith("measure-")).sort((a: string, b: string): number => a.localeCompare(b)) : [];
    const newest: string | undefined = receipts[receipts.length - 1];
    if (newest === undefined) return null;
    const origin: V3 = (JSON.parse(fs.readFileSync(`${dir}/${newest}/head.json`, "utf8")) as { frame: { origin: V3 } }).frame.origin;
    // The loaded points carry Z negated; the receipt's origin and axes are native, so the native point is (x, y, -z), as `frankfort` reads it: her upright frame is that native point less the origin, the Frankfort registration's frame before its rotation (`AutoMovieHumanHeadF1Pose`).
    return { points: points.map((p: V3): V3 => [p[0] - origin[0], p[1] - origin[1], -p[2] - origin[2]]), measures: { receiptFrameOriginY: origin[1] } };
  }
}
