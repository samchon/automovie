import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HUMAN_STICKMAN_POSES } from "../../../../packages/human/dev/src/human-stickman/HUMAN_STICKMAN_POSES";
import { HumanPeople } from "./HumanPeople";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A = HumanAnatomy;
const { SIDES, COMPRESSION, STRETCH, VOLUME, CONTACT } = HumanAnatomyShared;

/** The pose audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyPose {
  /**
   * Posed skin through the public pose evaluator and rig: no skin through skin
   * at the axillae, elbows, groin and knees beyond a stated depth, no skin
   * stretched past its failure strain or folded over, the arms clear of the
   * trunk at neutral, and a flexed limb keeping its volume.
   */
  export function pose(name: string): IRow[] {
    const rows: IRow[] = [];
    const rest: HumanAnatomy.ISkin = A.bind(name);
    const S: number = HumanPeople.person(name).params.body.controls.height.value!;
    const regions: [string, string, number][] = [];
    for (const side of SIDES) {
      regions.push([`${side} axilla`, `${side}UpperArm`, 0.07 * S]);
      regions.push([`${side} elbow`, `${side}LowerArm`, 0.045 * S]);
      regions.push([`${side} groin`, `${side}UpperLeg`, 0.07 * S]);
      regions.push([`${side} knee`, `${side}LowerLeg`, 0.05 * S]);
    }
    const tris: Map<string, Uint32Array> = new Map(
      regions.map(([label, bone, radius]): [string, Uint32Array] => {
        const at: V3 = A.joint(rest, bone);
        return [label, A.near(rest, at, at, radius)];
      }),
    );
    for (const [label, request] of Object.entries(POSES)) {
      const skin: HumanAnatomy.ISkin = A.posed(name, request);
      for (const [region] of regions) {
        const t: Uint32Array = tris.get(region)!;
        const deep = A.penetration(skin, t);
        rows.push({
          person: name,
          site: `${label} pose, ${region}: deepest skin inside skin, mm`,
          value: deep.deepest,
          low: 0,
          high: label === "neutral" ? CONTACT : COMPRESSION,
          unit: "mm",
        });
        const tear = strain(rest, skin, t);
        rows.push({ person: name, site: `${label} pose, ${region}: largest principal stretch`, value: tear.stretch, low: 0, high: STRETCH, unit: "x" });
        rows.push({ person: name, site: `${label} pose, ${region}: triangles folded over their neighbours`, value: tear.folded, low: 0, high: 0, unit: "triangles" });
      }
    }
    // Volume of the limbs under full flexion against their volume at neutral.
    const neutral: number = A.volume(A.posed(name, {}));
    for (const [label, request, limbs] of FLEXION) {
      const change: number = A.volume(A.posed(name, request)) - neutral;
      const own: number = limbs.reduce((sum: number, limb: string): number => sum + limbVolume(rest, limb), 0);
      rows.push({
        person: name,
        site: `${label}: body volume change over the flexed limbs' volume`,
        value: Math.abs(change) / own,
        low: 0,
        high: VOLUME,
        unit: "share",
      });
    }
    return rows;
  }

  /** The poses the pose audit reads. */
  export const POSES: Record<string, IAutoMovieHumanPose> = {
    neutral: {},
    demo: HUMAN_STICKMAN_POSES.demo!,
    limit: HUMAN_STICKMAN_POSES.limit!,
    raised: { arms: { left: { shoulder: { abduction: 179 } }, right: { shoulder: { abduction: 179 } } } },
    flexed: {
      arms: { left: { elbow: { flexion: 147.3 } }, right: { elbow: { flexion: 147.3 } } },
      legs: {
        left: { hip: { flexion: 132.1 }, knee: { flexion: 139.8 } },
        right: { hip: { flexion: 132.1 }, knee: { flexion: 139.8 } },
      },
    },
  };

  /** Poses that flex whole limbs, with the limbs they flex. */
  export const FLEXION: [string, IAutoMovieHumanPose, string[]][] = [
    ["elbows at full flexion", { arms: { left: { elbow: { flexion: 147.3 } }, right: { elbow: { flexion: 147.3 } } } }, ["leftArm", "rightArm"]],
    [
      "knees at full flexion",
      { legs: { left: { knee: { flexion: 139.8 } }, right: { knee: { flexion: 139.8 } } } },
      ["leftLeg", "rightLeg"],
    ],
  ];

  /**
   * Principal stretch and fold of a region's triangles between the bind and a
   * pose: the larger singular value of each triangle's in-plane map, and
   * triangles whose posed normal turns more than 120 degrees from its edge
   * neighbours' while it lay within 60 at the bind.
   */
  export function strain(rest: HumanAnatomy.ISkin, posed: HumanAnatomy.ISkin, region: Uint32Array): { stretch: number; folded: number } {
    let stretch: number = 0;
    const normal = (skin: HumanAnatomy.ISkin, t: number): V3 => {
      const a: V3 = A.point(skin, skin.I[3 * t]!);
      return A.unit(A.cross(A.sub(A.point(skin, skin.I[3 * t + 1]!), a), A.sub(A.point(skin, skin.I[3 * t + 2]!), a)));
    };
    const inRegion: Set<number> = new Set(region);
    const edgeOwner: Map<number, number[]> = new Map();
    const n: number = rest.P.length / 3;
    for (const t of region)
      for (let e: number = 0; e < 3; e++) {
        const a: number = rest.I[3 * t + e]!;
        const b: number = rest.I[3 * t + ((e + 1) % 3)]!;
        const k: number = Math.min(a, b) * n + Math.max(a, b);
        const list: number[] = edgeOwner.get(k) ?? [];
        list.push(t);
        edgeOwner.set(k, list);
      }
    for (const t of region) {
      const r: V3[] = [0, 1, 2].map((k: number): V3 => A.point(rest, rest.I[3 * t + k]!));
      const q: V3[] = [0, 1, 2].map((k: number): V3 => A.point(posed, posed.I[3 * t + k]!));
      const e1: V3 = A.sub(r[1]!, r[0]!);
      const e2: V3 = A.sub(r[2]!, r[0]!);
      const f1: V3 = A.sub(q[1]!, q[0]!);
      const f2: V3 = A.sub(q[2]!, q[0]!);
      // Rest frame in the triangle's plane.
      const u: V3 = A.unit(e1);
      const w: V3 = A.unit(A.reject(e2, u));
      const R: number[] = [A.dot(e1, u), A.dot(e2, u), A.dot(e1, w), A.dot(e2, w)];
      const det: number = R[0]! * R[3]! - R[1]! * R[2]!;
      if (Math.abs(det) < 1e-9) continue;
      const inv: number[] = [R[3]! / det, -R[1]! / det, -R[2]! / det, R[0]! / det];
      // Deformation F = [f1 f2] inv(R), a 3x2 map; its Gram matrix gives the stretches.
      const c1: V3 = A.add(A.scale(f1, inv[0]!), A.scale(f2, inv[2]!));
      const c2: V3 = A.add(A.scale(f1, inv[1]!), A.scale(f2, inv[3]!));
      const a11: number = A.dot(c1, c1);
      const a12: number = A.dot(c1, c2);
      const a22: number = A.dot(c2, c2);
      const tr: number = a11 + a22;
      const disc: number = Math.sqrt(Math.max(0, (a11 - a22) ** 2 / 4 + a12 * a12));
      stretch = Math.max(stretch, Math.sqrt(tr / 2 + disc));
    }
    let folded: number = 0;
    for (const t of region) {
      const neighbours: number[] = [];
      for (let e: number = 0; e < 3; e++) {
        const a: number = rest.I[3 * t + e]!;
        const b: number = rest.I[3 * t + ((e + 1) % 3)]!;
        for (const o of edgeOwner.get(Math.min(a, b) * n + Math.max(a, b)) ?? []) if (o !== t && inRegion.has(o)) neighbours.push(o);
      }
      if (neighbours.length === 0) continue;
      const mean = (skin: HumanAnatomy.ISkin): V3 => A.unit(neighbours.reduce((s: V3, o: number): V3 => A.add(s, normal(skin, o)), [0, 0, 0]));
      const was: number = A.dot(normal(rest, t), mean(rest));
      const now: number = A.dot(normal(posed, t), mean(posed));
      if (was > 0.5 && now < -0.5) folded++;
    }
    return { stretch, folded };
  }

  /** Volume of a whole limb at the bind: its sections' areas along its bones. */
  export function limbVolume(skin: HumanAnatomy.ISkin, limb: string): number {
    const side: string = limb.startsWith("left") ? "left" : "right";
    const chain: string[] = limb.endsWith("Arm")
      ? [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`]
      : [`${side}UpperLeg`, `${side}LowerLeg`, `${side}Foot`];
    const joints: V3[] = chain.map((b: string): V3 => A.joint(skin, b));
    let sum: number = 0;
    for (let i: number = 0; i + 1 < joints.length; i++) {
      const a: V3 = joints[i]!;
      const b: V3 = joints[i + 1]!;
      const d: V3 = A.unit(A.sub(b, a));
      const L: number = A.dist(a, b);
      const region: Uint32Array = A.near(skin, a, b, 0.2 * L + 80);
      // Start a fifth down the first bone, clear of the trunk.
      for (let s: number = i === 0 ? 0.2 * L : 0; s < L; s += 5) {
        const o: V3 = A.add(a, A.scale(d, s));
        const c: HumanAnatomy.ICut | null = A.cut(skin, o, d, o, region);
        if (c !== null && c.contained) sum += c.area * 5;
      }
    }
    return sum;
  }

}
