import { AutoMovieMeshExtract as M } from "../../../packages/engine/src/geometry/extract/AutoMovieMeshExtract";
import { PartConicTypes as T } from "./PartConicTypes";
import type { ConicPaperInput as C } from "./ConicPaperInput";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Read source bone metadata and one original family per part, then validate exact native midplanes. */
export namespace PartConicInput {
  /** Original station wrapper; all frame vectors are full-precision saved values. */
  interface Station { station: number; originMm: T.V; u: T.V; v: T.V; normal: T.V; loops: { kind: string; curve: C.Curve; quality: { status: string } }[] }
  /** Load and validate two original source-bone intervals without reading generated Human geometry. */
  export async function load(root: string): Promise<T.Input> {
    const started: number = performance.now();
    const identities: T.Input["identities"] = [];
    const read = async <Value>(relative: string): Promise<Value> => {
      const bytes: Buffer = await fs.readFile(path.join(root, relative));
      identities.push({ path: relative, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
      return JSON.parse(bytes.toString("utf8")) as Value;
    };
    const observations: { skeleton: { nativeChart: string; nativeLengthUnit: string; joints: { name: string; bindNativeTranslation: T.V }[] } } = await read("test/.shots/f1/body-observations.json");
    if (!observations.skeleton.nativeChart.includes("Y-up") || !observations.skeleton.nativeLengthUnit.includes("centimetres")) throw new Error("Original skeleton coordinate contract differs.");
    const joints: Map<string, T.V> = new Map(observations.skeleton.joints.map((joint): [string, T.V] => [joint.name, [10 * joint.bindNativeTranslation[2], 10 * joint.bindNativeTranslation[1], -10 * joint.bindNativeTranslation[0]]]));
    const native: { parts: { id: string; transform: unknown; geometry: { type: string; mesh: { positions: number[]; indices: number[] } } }[] } = await read("test/.shots/f1/reference-model.json");
    const body: typeof native.parts[number] | undefined = native.parts.find((part): boolean => part.id.includes("body"));
    if (body === undefined || body.transform !== null || body.geometry.type !== "mesh") throw new Error("Native body carrier does not match the original untransformed reference.");
    const positions: number[] = [];
    const aliases: Map<string, number> = new Map();
    const remap: number[] = [];
    for (let i: number = 0; i < body.geometry.mesh.positions.length; i += 3) {
      const p: T.V = [body.geometry.mesh.positions[i]! * 1000, body.geometry.mesh.positions[i + 1]! * 1000, body.geometry.mesh.positions[i + 2]! * 1000];
      const key: string = p.join(",");
      let index: number | undefined = aliases.get(key);
      if (index === undefined) { index = positions.length / 3; aliases.set(key, index); positions.push(...p); }
      remap.push(index);
    }
    const mesh: M.IMesh = { positions, indices: body.geometry.mesh.indices.map((index: number): number => remap[index]!) };
    const exactAliasCount: number = remap.length - positions.length / 3;
    const parts: T.Part[] = [];
    for (const request of [{ family: "leg_l-v2", from: "thigh", to: "calf", fractions: [0.3, 0.7], name: "positive-z-mid-thigh" }, { family: "arm_l-v2", from: "lowerarm", to: "hand", fractions: [0.25, 0.75], name: "positive-z-forearm" }]) {
      const sourceName: string = [request.from + "_l", request.from + "_r"].find((name: string): boolean => (joints.get(name)?.[2] ?? -Infinity) > 0) ?? "";
      const endName: string = request.to + sourceName.slice(-2);
      const origin: T.V | undefined = joints.get(sourceName);
      const end: T.V | undefined = joints.get(endName);
      if (origin === undefined || end === undefined) throw new Error("Registered positive-Z source joints are unavailable.");
      const difference: T.V = sub(end, origin);
      const lengthMm: number = Math.hypot(...difference);
      const n: T.V = scale(difference, 1 / lengthMm);
      const index: { families: { name: string; files: { file: string }[] }[] } = await read(".references/curves/bezier/f1/limbs/index.json");
      const family: typeof index.families[number] | undefined = index.families.find((item): boolean => item.name === request.family);
      if (family === undefined) throw new Error("The one selected original family is unavailable.");
      const all: Station[] = [];
      for (const file of family.files) all.push(...(await read<{ stations: Station[] }>(".references/curves/bezier/f1/limbs/" + file.file)).stations);
      const selected: { station: Station; s: number }[] = all.map((station: Station): { station: Station; s: number } => ({ station, s: dot(sub(station.originMm, origin), n) }))
        .filter((item): boolean => item.s >= request.fractions[0]! * lengthMm && item.s <= request.fractions[1]! * lengthMm && dot(item.station.normal, n) > 1 - 1e-10);
      if (selected.length < 8) throw new Error("The source family has insufficient exactly bone-normal central planes: " + request.family);
      const u: T.V = selected[0]!.station.u;
      const v: T.V = selected[0]!.station.v;
      const domain: [number, number] = [selected[0]!.s, selected.at(-1)!.s];
      let axisResidual: number = 0;
      let normalAngle: number = 0;
      for (const item of selected) {
        axisResidual = Math.max(axisResidual, Math.hypot(...sub(sub(item.station.originMm, origin), scale(n, item.s))));
        normalAngle = Math.max(normalAngle, Math.acos(Math.min(1, dot(item.station.normal, n))));
        if (dot(u, item.station.u) < 1 - 1e-10 || dot(v, item.station.v) < 1 - 1e-10) throw new Error("The selected original family twists inside a declared straight interval.");
      }
      if (axisResidual > 1e-5 || Math.hypot(...sub(cross(v, u), n)) > 1e-8) throw new Error("Native joints and original family do not share one registered axis.");
      const sites: { s: number; heldout: boolean; station?: Station }[] = [];
      for (let i: number = 0; i < selected.length; ++i) {
        sites.push({ s: selected[i]!.s, heldout: false, station: selected[i]!.station });
        if (i + 1 < selected.length) sites.push({ s: (selected[i]!.s + selected[i + 1]!.s) / 2, heldout: true });
      }
      const cuts: M.ISection[] = M.outline(mesh, { origin, axes: [n, u, v] }, sites.map((site): number => site.s), 0, 0.5, 0);
      const rows: T.Row[] = cuts.map((cut: M.ISection, i: number): T.Row => {
        const loops: M.ILoop[] = cut.loops.filter((loop: M.ILoop): boolean => loop.closed && contains(loop.points));
        if (loops.length !== 1) throw new Error("Native plane has " + loops.length + " closed loops around its actual source bone at " + request.name + ":" + cut.station);
        const points: T.P[] = loops[0]!.points.slice();
        if (area(points) < 0) points.reverse();
        const source: Station | undefined = sites[i]!.station;
        const saved: Station["loops"][number] | undefined = source?.loops.find((loop): boolean => loop.kind === "closed");
        return { s: cut.station, points, heldout: sites[i]!.heldout, ...(saved === undefined ? {} : { saved: saved.curve }), quality: saved?.quality.status ?? "native-midplane", surroundingLoops: loops.length, flags: cut.flags };
      });
      parts.push({ name: request.name, family: request.family, jointNames: [sourceName, endName], origin, u, v, n, lengthMm, domain, rows,
        registrationAxisResidualMm: axisResidual, registrationNormalAngle: normalAngle, exactAliasCount });
    }
    return { parts, mesh, identities, milliseconds: performance.now() - started };
  }
  /** Signed polygon area distinguishes the original chart orientation without moving a point. */
  export function area(points: readonly T.P[]): number { return points.reduce((sum: number, p: T.P, i: number): number => { const q: T.P = points[(i + 1) % points.length]!; return sum + p[0] * q[1] - p[1] * q[0]; }, 0) / 2; }
  /** Exact-ray parity selects the cut enclosing the registered bone point, independently of other sliced limbs. */
  function contains(points: readonly T.P[]): boolean { let inside: boolean = false; for (let i: number = 0; i < points.length; ++i) { const a: T.P = points[i]!; const b: T.P = points[(i + 1) % points.length]!; if ((a[1] > 0) !== (b[1] > 0) && 0 < a[0] + (b[0] - a[0]) * -a[1] / (b[1] - a[1])) inside = !inside; } return inside; }
  /** Dot product in the fixed registered world frame. */
  export function dot(a: T.V, b: T.V): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Vector difference, without changing registration or handedness. */
  export function sub(a: T.V, b: T.V): T.V { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Scalar multiplication of a world vector. */
  export function scale(a: T.V, t: number): T.V { return [a[0] * t, a[1] * t, a[2] * t]; }
  /** Right-handed Cartesian vector product; source planes retain v cross u as their normal. */
  export function cross(a: T.V, b: T.V): T.V { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
}
