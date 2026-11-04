import type { HumanAnatomy } from "../../HumanAnatomy";
import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";

/**
 * Readable anatomical names for skin chains, split at the joints where one
 * chain holds two segments: an arm at the elbow, a leg at the knee, the trunk
 * at the spine's joints. The names only locate; they carry no measurement.
 *
 * Every name is registered once in `names`, and a vertex carries the index of
 * its name, so one `HumanReferenceSurfaceNaming` labels a reference and a
 * generated skin into the same table.
 */
export class HumanReferenceSurfaceNaming {
  /** Every name given so far, in order of first use. */
  public readonly names: string[] = [];

  /** Index in `names` of each name. */
  private readonly index: Map<string, number> = new Map();

  /**
   * @param joints Joint centres of the rig, mm, which place the splits.
   */
  public constructor(private readonly joints: Map<string, HumanAnatomy.V3>) {}

  /**
   * A name index per vertex: the chain of its largest adjacent triangle,
   * named at the vertex's position. A vertex no chain labels is "unassigned".
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   * @param tri Chain index of every triangle, into `chains`.
   * @param chains Chain names.
   * @returns The index into `names` of every vertex.
   */
  public label(P: Float64Array, I: Uint32Array, tri: Int32Array, chains: string[]): Int32Array {
    const n: number = P.length / 3;
    const best: Float64Array = new Float64Array(n).fill(-1);
    const chain: Int32Array = new Int32Array(n).fill(-1);

    for (let t: number = 0; t < tri.length; t++) {
      const a: number = 3 * I[3 * t]!;
      const b: number = 3 * I[3 * t + 1]!;
      const c: number = 3 * I[3 * t + 2]!;
      const ux: number = P[b]! - P[a]!;
      const uy: number = P[b + 1]! - P[a + 1]!;
      const uz: number = P[b + 2]! - P[a + 2]!;
      const vx: number = P[c]! - P[a]!;
      const vy: number = P[c + 1]! - P[a + 1]!;
      const vz: number = P[c + 2]! - P[a + 2]!;
      const s: number = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);

      for (let k: number = 0; k < 3; k++) {
        const v: number = I[3 * t + k]!;
        if (s > best[v]!) {
          best[v] = s;
          chain[v] = tri[t]!;
        }
      }
    }

    const out: Int32Array = new Int32Array(n);
    for (let v: number = 0; v < n; v++) {
      const name: string =
        chain[v]! < 0 ? "unassigned" : this.name(chains[chain[v]!]!, [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!]);

      let k: number | undefined = this.index.get(name);
      if (k === undefined) {
        k = this.names.length;
        this.index.set(name, k);
        this.names.push(name);
      }
      out[v] = k;
    }

    return out;
  }

  /**
   * A chain's readable name at a point, keeping the chain's own name in
   * brackets for tracing.
   *
   * @param chain The chain's name from the surface's groups.
   * @param p The point the name is read at, mm.
   */
  private name(chain: string, p: HumanAnatomy.V3): string {
    const parts: string[] = chain.split(".");
    const side: string = parts.find((s: string): boolean => s === "left" || s === "right") ?? "";
    const toes: string[] = ["big", "second", "third", "fourth", "little"];
    let readable: string;

    if (parts[0] === "arm")
      readable = `${side} ${this.nearer(p, side, ["UpperArm", "LowerArm", "Hand"]) ? "upper arm" : "forearm"}`;
    else if (parts[0] === "leg")
      readable = `${side} ${this.nearer(p, side, ["UpperLeg", "LowerLeg", "Foot"]) ? "thigh" : "lower leg"}`;
    else if (parts[0] === "finger") readable = `${side} ${parts[2]} finger`;
    else if (parts[0] === "thumb") readable = `${side} thumb`;
    else if (parts[0] === "hand") readable = `${side} hand`;
    else if (parts[0] === "foot") readable = `${side} foot`;
    else if (parts[0] === "forefoot") readable = `${side} forefoot`;
    else if (parts[0] === "toe") readable = `${side} ${toes[Number(parts[2]) - 1] ?? parts[2]} toe`;
    else if (parts[0] === "ear") readable = `${side} ear ${parts[1]}`;
    else if (chain === "trunk") {
      const hips: number = this.joints.get("hips")?.[1] ?? -Infinity;
      const chest: number = this.joints.get("chest")?.[1] ?? Infinity;
      readable = p[1] < hips ? "pelvis" : p[1] < chest ? "abdomen" : "chest";
    } else if (chain === "upper") readable = "shoulders and upper chest";
    else if (chain === "head.upper") readable = "upper head";
    else if (chain === "head.middle") readable = "face and mid head";
    else if (chain === "head.lower") readable = "jaw and neck";
    else if (chain === "head") readable = "neck base";
    else readable = chain;

    return readable === chain ? chain : `${readable} (${chain})`;
  }

  /**
   * Whether a point lies nearer the first of a limb's two segments than the
   * second, which splits an arm at the elbow and a leg at the knee. Without
   * the three joints the point counts as the first segment.
   *
   * @param p The point, mm.
   * @param side Which limb: "left" or "right".
   * @param bones The limb's three joints, proximal to distal, without the side.
   */
  private nearer(p: HumanAnatomy.V3, side: string, bones: [string, string, string]): boolean {
    const joint: (HumanAnatomy.V3 | undefined)[] = bones.map(
      (bone: string): HumanAnatomy.V3 | undefined => this.joints.get(side + bone),
    );
    const a: HumanAnatomy.V3 | undefined = joint[0];
    const b: HumanAnatomy.V3 | undefined = joint[1];
    const c: HumanAnatomy.V3 | undefined = joint[2];
    if (a === undefined || b === undefined || c === undefined) return true;

    return HumanReferenceSurfaceMesh.segment(p, a, b) <= HumanReferenceSurfaceMesh.segment(p, b, c);
  }
}
