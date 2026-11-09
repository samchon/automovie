import fs from "node:fs";
import path from "node:path";
import { AutoMovieMeshCourse, closestPointOnSegmentXZ } from "@automovie/engine";

import { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes } from "../inspection/NodeCanvasTypes";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster } from "./NodeCanvasRaster";
import { NodeCaptureRender } from "./NodeCaptureRender";
import { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeTrunkCaptureSource } from "./NodeTrunkCaptureSource";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = [number, number, number];
type EdgeUse = { start: number; count: number };
type FreeEdge = { low: number; high: number; increasing: boolean };
type Free = Map<string, FreeEdge | null>;

/** Capture the direct F1 geometry and verify the shared indexed boundaries. */
export namespace NodeF1BodyDirect {
  /** Draw the direct F1 providers together and sew only complete, measured seams. */
  export async function run(): Promise<void> {
    const context: NodeCaptureSources.IContext = await NodeCaptureSources.context("reference");
    const providers: Map<string, NodeCaptureSources.IProvider> = NodeCaptureSources.providers();

    // Visit the hosts before their digits. Each host must emit actual skin
    // before its separately viewable digits can be omitted from the assembly.
    const names: string[] = ["trunk.archive", "head"];
    for (const side of ["left", "right"]) {
      names.push(`arm.${side}`, `thumb.${side}`, `leg.${side}`);
      for (const digit of [1, 2, 3, 4]) names.push(`finger.${side}.${digit}`);
      for (const digit of [1, 2, 3, 4, 5]) names.push(`toe.${side}.${digit}`);
    }
    const sourceFiles: string[] = [
      "packages/playground/src/human-parameters/f1.ts",
      ...names.flatMap((name: string): readonly string[] => providers.get(name)?.files ?? []),
      ...["NodeF1Body", "NodeF1BodyDirect", "NodeCaptureSources", "NodeCaptureRender", "NodeCanvasRaster"].map((file: string): string => `packages/human/src/executable/${file}.ts`),
    ];
    const identities: Record<string, string> = await NodeCaptureSources.identities(sourceFiles);
    const sources: { name: string; triangles: number; cause?: string; includedBy?: string }[] = [];
    const visualEvidence: { part: string; observations: string[] }[] = [];
    const calfEvidence: string[] = ["Archive calf contacts:", "Former calf join ", "Ordinary ["];
    const reviewPrefixes: Readonly<Record<string, readonly string[]>> = {
      head: ["forehead exterior", "the lower forehead rail"],
      "trunk.archive": ["archived trunk:"],
      "leg.left": calfEvidence,
      "leg.right": calfEvidence,
    };
    const positions: number[] = [];
    const indices: number[] = [];
    const boundaries: Map<string, Free> = new Map();
    const sewnFeet: Set<string> = new Set();
    const includedBy: Map<string, string> = new Map();
    for (const name of names) {
      const [region, side] = name.split(".");
      const owner: string | undefined = includedBy.get(name) ?? (region === "toe" && sewnFeet.has(side!) ? `leg.${side}` : undefined);
      if (owner !== undefined) {
        sources.push({ name, triangles: 0, includedBy: owner });
        continue;
      }
      try {
        const provider: NodeCaptureSources.IProvider | undefined = providers.get(name);
        if (provider === undefined) throw new Error("Direct provider is missing");
        const part: CaptureModel.IPart = await provider.prepare(name, context);
        if (part.loft.status !== "available") throw new Error(part.loft.cause);
        const mesh: CaptureModel.ITriangles = part.loft.clay;
        if (mesh.indices.length === 0) throw new Error("Direct provider has no clay triangles");
        const prefixes: readonly string[] = reviewPrefixes[name] ?? [];
        const observations: string[] = part.diagnostics.filter((line: string): boolean => prefixes.some((prefix: string): boolean => line.startsWith(prefix)));
        if (observations.length !== 0) visualEvidence.push({ part: name, observations });
        const base: number = positions.length / 3;
        if (["trunk.archive", "head", "arm.left", "arm.right", "leg.left", "leg.right"].includes(name))
          boundaries.set(name, directFree(mesh, base));
        for (const value of mesh.positions) positions.push(value);
        for (const index of mesh.indices) indices.push(base + index);
        sources.push({ name, triangles: mesh.indices.length / 3 });

        // A palm declares its contained parts. The foot receipt is emitted
        // only after its native web and the five digit rims sew successfully.
        for (const contained of part.included ?? [])
          if (contained !== name && names.includes(contained)) includedBy.set(contained, name);
        if (region === "leg" && part.diagnostics.some((line: string): boolean => line.startsWith("Sewn native forefoot skin:")))
          sewnFeet.add(side!);
      } catch (error: unknown) {
        sources.push({ name, triangles: 0, cause: error instanceof Error ? error.message : String(error) });
      }
      console.log(`direct body source ${JSON.stringify(sources[sources.length - 1])}`);
    }
    if (indices.length === 0) throw new Error("No direct F1 clay is available");

    const reference: NodeCaptureSources.IReference = await context.reference();
    const original: NodeTrunkReference.IMesh = NodeTrunkReference.fromModel(reference.model, 1);
    const raw: CaptureModel.ITriangles = { positions: original.points.flat(), indices: original.triangles.flat() };
    const fork: AutoMovieHumanF1Fork.IResult = AutoMovieHumanF1Fork.read(raw, NodeTrunkCaptureSource.midline(original.points));
    const neck: V3[] | null = await NodeTrunkCaptureSource.neckBoundary(raw);
    const [leftArm, rightArm]: V3[][] = await Promise.all([NodeTrunkCaptureSource.armBoundary("left"), NodeTrunkCaptureSource.armBoundary("right")]);
    const crotch: string[] = directKeys(fork.crotch, false);
    const median: Set<string> = new Set(crotch);

    // The parent owns the two outer arcs. Only the children share the median
    // line, so those edges must not also be expected on the trunk.
    const half = (points: V3[]): string[] => directKeys(points, true).filter((key: string): boolean => !median.has(key));
    const expected: { name: string; a: string; b: string; keys: string[] }[] = [
      { name: "neck", a: "trunk.archive", b: "head", keys: neck === null ? [] : directKeys(neck, true) },
      { name: "shoulder.left", a: "trunk.archive", b: "arm.left", keys: directKeys(leftArm!, true) },
      { name: "shoulder.right", a: "trunk.archive", b: "arm.right", keys: directKeys(rightArm!, true) },
      { name: "fork.left", a: "trunk.archive", b: "leg.left", keys: half(fork.left) },
      { name: "fork.right", a: "trunk.archive", b: "leg.right", keys: half(fork.right) },
      { name: "CROTCH_LINE", a: "leg.left", b: "leg.right", keys: crotch },
    ];
    const parents: Int32Array = Int32Array.from({ length: positions.length / 3 }, (_: unknown, i: number): number => i);
    const root = (vertex: number): number => {
      while (parents[vertex] !== vertex) {
        parents[vertex] = parents[parents[vertex]!]!;
        vertex = parents[vertex]!;
      }
      return vertex;
    };
    // Weld an entire measured seam only when each edge is free on both
    // surfaces and their windings oppose. Exact indexed sewing leaves any
    // unrelated coincident vertices and incomplete seams untouched.
    const seams = expected.map(({ name, a, b, keys }) => {
      const left: Free | undefined = boundaries.get(a);
      const right: Free | undefined = boundaries.get(b);
      const matches: [FreeEdge, FreeEdge][] = [];
      let sameDirection: number = 0;
      for (const key of keys) {
        const l: FreeEdge | null | undefined = left?.get(key);
        const r: FreeEdge | null | undefined = right?.get(key);
        if (!l || !r) continue;
        if (l.increasing === r.increasing) ++sameDirection;
        matches.push([l, r]);
      }
      const sewn: boolean = keys.length > 0 && matches.length === keys.length && sameDirection === 0;
      if (sewn)
        for (const [l, r] of matches) {
          parents[root(r.low)] = root(l.low);
          parents[root(r.high)] = root(l.high);
        }
      return { name, parts: [a, b], expectedEdges: keys.length, matchingEdges: matches.length, sameDirection, sewn };
    });
    for (let i: number = 0; i < indices.length; ++i) indices[i] = root(indices[i]!);
    const stride: number = positions.length / 3;
    const used: Map<number, EdgeUse> = directIncidence(indices, stride);
    const components: Set<number> = new Set();
    let freeEdges: number = 0;
    let multipleEdges: number = 0;
    let upperTrunkFreeEdges: number = 0;
    for (const [key, { count }] of used) {
      const first: number = Math.floor(key / stride);
      const second: number = key % stride;
      const a: number = root(first);
      const b: number = root(second);
      parents[b] = a;
      if (count === 1) {
        ++freeEdges;
        const y0: number = positions[3 * first + 1]!;
        const y1: number = positions[3 * second + 1]!;
        if (Math.min(y0, y1) >= 1333.79 && Math.max(y0, y1) < 1458) ++upperTrunkFreeEdges;
      }
      else if (count > 2) ++multipleEdges;
    }
    for (const vertex of indices) components.add(root(vertex));
    const pelvis835 = (["left", "right"] as const).map((side: "left" | "right") => {
      const centre: V3 = side === "left" ? fork.leftPlane.centroid : fork.rightPlane.centroid;
      const plane: AutoMovieMeshCourse.IPlane = { station: 835, origin: [centre[0], 835, centre[2]], u: [1, 0, 0], v: [0, 0, 1] };
      const original: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut(raw, [plane], 0.5)[0]!;
      const candidate: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut({ positions, indices }, [plane], 0.5)[0]!;
      const distances: { candidateToOriginal: number; originalToCandidate: number } | null =
        original.loop === null || candidate.loop === null ? null : {
          candidateToOriginal: horizontalLoopGap(candidate.loop, original.loop),
          originalToCandidate: horizontalLoopGap(original.loop, candidate.loop),
        };
      return { side, station: plane.station, origin: plane.origin, distances, originalFlags: original.flags, candidateFlags: candidate.flags };
    });
    // A sewn boundary establishes connectivity. The same-camera images and
    // section residuals are the separate evidence for how the surface looks.
    const report = {
      stage: "preassembly preview",
      referenceSha256: reference.sha256,
      sources,
      seams,
      unresolvedStructuralConnections: [
        ...seams.filter(({ sewn }): boolean => !sewn).map(({ name }): string => name),
        ...(upperTrunkFreeEdges > 0 || !sources.some(({ name, triangles }): boolean => name === "trunk.archive" && triangles > 0) ? ["trunk upper openings"] : []),
        ...["left", "right"].filter((side: string): boolean =>
          ![`thumb.${side}`, ...[1, 2, 3, 4].map((digit: number): string => `finger.${side}.${digit}`)]
            .every((name: string): boolean => includedBy.get(name) === `arm.${side}`),
        ).map((side: string): string => `${side} hand branch connections`),
        ...["left", "right"].filter((side: string): boolean => !sewnFeet.has(side)).map((side: string): string => `${side} foot branch connections`),
      ],
      visualReview: { status: "pending", providerEvidence: visualEvidence, pelvis835 },
      skin: { triangles: indices.length / 3, components: components.size, freeEdges, multipleEdges, upperTrunkFreeEdges },
    };

    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_integration/body-direct-${new Date().toISOString().replaceAll(":", "-")}`);
    fs.mkdirSync(out, { recursive: true });
    const map = NodeCaptureRender.display("world", null).map;
    const originalPoints: V3[] = original.points.map(map);
    const clayPositions: number[] = [];
    for (let i: number = 0; i < positions.length; i += 3)
      clayPositions.push(...map([positions[i]!, positions[i + 1]!, positions[i + 2]!]));
    const clay: NodeCanvasTypes.Mesh = { id: "direct F1 providers", positions: clayPositions, indices, colour: NodeCaptureRender.CLAY_COLOUR };
    const originalMesh: NodeCanvasTypes.Mesh = { id: "original F1 skin", positions: originalPoints.flat(), indices: raw.indices, colour: NodeCaptureRender.REFERENCE_COLOUR };
    const files: string[] = [];
    for (const view of ["front", "left", "back", "low-oblique"]) {
      const camera: NodeCanvasTypes.Camera = NodeCanvasCamera.fit(view, originalPoints);
      for (const [kind, mesh] of [["clay", clay], ["reference", originalMesh]] as const) {
        const file: string = `${view}.${kind}.png`;
        const { png } = NodeCanvasRaster.render(camera, [mesh], [], "depth", `F1 ${report.stage} | ${view} | ${kind}`);
        fs.writeFileSync(path.join(out, file), png);
        files.push(file);
      }
    }
    const identitiesAtExit: Record<string, string> = await NodeCaptureSources.identities(sourceFiles);
    const changedDuringRun: string[] = [...new Set([...Object.keys(identities), ...Object.keys(identitiesAtExit)])]
      .filter((file: string): boolean => identities[file] !== identitiesAtExit[file]);
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ ...report, files, provenance: { identities, identitiesAtExit, changedDuringRun } }, null, 2));
    console.log(`node:f1-body ${out}`);
    console.log(JSON.stringify({ seams, skin: report.skin, unresolvedStructuralConnections: report.unresolvedStructuralConnections, visualReview: report.visualReview, changedDuringRun }, null, 2));
  }

  /** Maximum observed vertex-to-segment distance on the same horizontal world plane. */
  function horizontalLoopGap(from: readonly [number, number][], to: readonly [number, number][]): number {
    let maximum: number = 0;
    for (const [x, z] of from) {
      let nearest: number = Infinity;
      for (let i: number = 0; i < to.length; ++i) {
        const [ax, az] = to[i]!;
        const [bx, bz] = to[(i + 1) % to.length]!;
        const closest = closestPointOnSegmentXZ({ x, z }, { x: ax, z: az }, { x: bx, z: bz });
        nearest = Math.min(nearest, Math.hypot(x - closest.x, z - closest.z));
      }
      maximum = Math.max(maximum, nearest);
    }
    return maximum;
  }

  /** Record the oriented use and multiplicity of every indexed edge. */
  function directIncidence(indices: readonly number[], stride: number): Map<number, EdgeUse> {
    const uses: Map<number, EdgeUse> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let e: number = 0; e < 3; ++e) {
        const a: number = indices[i + e]!;
        const b: number = indices[i + (e + 1) % 3]!;
        const key: number = Math.min(a, b) * stride + Math.max(a, b);
        const use: EdgeUse | undefined = uses.get(key);
        if (use === undefined) uses.set(key, { start: a, count: 1 });
        else ++use.count;
      }
    return uses;
  }

  /** Unique free edges keyed by the exact world coordinates of both endpoints. */
  function directFree(mesh: CaptureModel.ITriangles, base: number): Free {
    const stride: number = mesh.positions.length / 3;
    const free: Free = new Map();
    const xyz = (i: number): string => mesh.positions.slice(3 * i, 3 * i + 3).join(",");
    for (const [key, { start, count }] of directIncidence(mesh.indices, stride)) {
      if (count !== 1) continue;
      const low: number = Math.floor(key / stride);
      const high: number = key % stride;
      const end: number = start === low ? high : low;
      const a: string = xyz(start);
      const b: string = xyz(end);
      if (a === b) continue;
      const name: string = a < b ? `${a}|${b}` : `${b}|${a}`;
      const edge: FreeEdge = a < b
        ? { low: base + start, high: base + end, increasing: true }
        : { low: base + end, high: base + start, increasing: false };
      free.set(name, free.has(name) ? null : edge);
    }
    return free;
  }

  /** Coordinate keys for the actual ordered seam, excluding a repeated closing marker. */
  function directKeys(points: readonly V3[], closed: boolean): string[] {
    const keys: string[] = [];
    for (let i: number = 1; i < points.length + Number(closed); ++i) {
      const a: string = points[i - 1]!.join(",");
      const b: string = points[i % points.length]!.join(",");
      if (a !== b) keys.push(a < b ? `${a}|${b}` : `${b}|${a}`);
    }
    return keys;
  }
}
