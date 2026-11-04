import type { AutoMovieHumanSkeletonLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, AutoMovieLoftFrame, type IAutoMovieLoftChain } from "@automovie/engine";
import { HumanCurveProfile } from "../curves/HumanCurveProfile";
import { HumanCurveRings } from "../curves/HumanCurveRings";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyMirror } from "../HumanAnatomyMirror";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanPopulationAudit } from "../HumanPopulationAudit";

type IRow = HumanAnatomyAudit.IRow;
type V3 = [number, number, number];
type P2 = [number, number];

/**
 * The anatomy audit on the finished curves, one table of relations the
 * construction does not guarantee by itself (its laws or their sources could
 * be wrong), read by one engine over every limb of every person.
 *
 * A limb is its chain's taut-tape girth every 2 mm (`HumanCurveRings`) with
 * the stations of its three joints from the bind skeleton (hip or shoulder,
 * knee or elbow, ankle or wrist), and the section at each distal joint. Each
 * row of {@link TABLE} reads that and names its source; the profile shape
 * readings are the catalog's (`HumanCurveProfile`, consistency.md 1.2) with
 * ISO 20685-1's 4 mm small-girth error as the noise floor.
 *
 * Checks the construction guarantees (a girth equal to its input at the
 * station that solves it, the guide touch) are the input-identity audit's
 * and the operator tests', not rows here.
 */
export namespace HumanAnatomyTable {
  /** One limb read for the table. */
  export interface ILimb {
    /** `leg` or `arm`. */
    kind: "leg" | "arm";

    /** `left` or `right`. */
    side: "left" | "right";

    /** Taut-tape girth every 2 mm along the chain, input mm. */
    girth: number[];

    /** Profile index of the proximal joint (hip, shoulder), the middle joint (knee, elbow) and the distal joint (ankle, wrist). */
    joints: [number, number, number];

    /** Profile step, input mm. */
    step: number;

    /** The distal segment's sections at its middle and distal joints, each its polygon in its plane and the joint there, input mm. */
    sections: { ring: P2[]; joint: P2; label: string }[];

    /**
     * A shank's frontal contours over the calf's span, 0.1 to 0.6 of the way
     * from the knee joint to the ankle joint: at each 2 mm station its share
     * of that way and its section's greatest reach across the body from the
     * joint axis, toward the midline (medial) and away from it (lateral),
     * input mm. Absent on an arm.
     */
    contours?: { share: number[]; medial: number[]; lateral: number[] };
  }

  /** One relation of the table. */
  export interface IRelation {
    /** Identifier, its catalog rule where it has one. */
    id: string;

    /** The relation and its source. */
    source: string;

    /** The rows it reads on one limb of a person of the given sex; none where it does not apply. */
    read: (person: string, limb: ILimb, sex: "female" | "male") => IRow[];
  }

  /** ISO 20685-1:2018 Table 4's allowable error for small girths, the profiles' noise floor, mm. */
  export const FLOOR: number = HumanAnatomyShared.SMALL;

  /** The table. */
  export const TABLE: readonly IRelation[] = [
    {
      id: "ORD-LG-knee/thigh",
      source: "knee over thigh girth within ANSUR 1988's 1st to 99th percentile by sex (HumanPopulationAudit, \"knee / thigh\")",
      read: (person: string, l: ILimb, sex: "female" | "male"): IRow[] => (l.kind !== "leg" ? [] : [band(person, l, "knee / thigh", at(l, 1) / max(l, 0, 0, 0.5), sex)]),
    },
    {
      id: "ORD-LG-calf/knee",
      source: "calf over knee girth within ANSUR 1988's 1st to 99th percentile by sex (\"calf / knee\")",
      read: (person: string, l: ILimb, sex: "female" | "male"): IRow[] => (l.kind !== "leg" ? [] : [band(person, l, "calf / knee", max(l, 1, 0.15, 0.6) / at(l, 1), sex)]),
    },
    {
      id: "ORD-AR-wrist/elbow",
      source: "wrist over elbow girth within ANSUR 1988's 1st to 99th percentile by sex (\"wrist / elbow\")",
      read: (person: string, l: ILimb, sex: "female" | "male"): IRow[] => (l.kind !== "arm" ? [] : [band(person, l, "wrist / elbow", least(l).girth / at(l, 1), sex)]),
    },
    {
      id: "PRO-LG-ankle/calf",
      source: "least supramalleolar girth over calf girth 0.439 to 0.719, ANSUR II's ratio 0.578 and 0.585 by sex +- 2.326 SD (consistency.md 2)",
      read: (person: string, l: ILimb): IRow[] => (l.kind !== "leg" ? [] : [row(person, l, "least ankle over calf girth", least(l).girth / max(l, 1, 0.15, 0.6), 0.439, 0.719, "")]),
    },
    {
      id: "PRO-narrowest",
      source: "the least girth of the distal segment below its belly stands at its landmark: the ankle within 0.75 to 0.97 of the shank (consistency.md 3.1, L6), the wrist within 30 mm proximal to 10 mm distal of stylion (3.2, A5; Gray 1918)",
      read: (person: string, l: ILimb): IRow[] => {
        const n: { index: number; girth: number } = least(l);
        if (l.kind === "leg") return [row(person, l, "least ankle girth's share of the shank, knee to ankle", share(l, 1, 2, n.index), 0.75, 0.97, "")];
        const signed: number = (n.index - l.joints[2]) * l.step * Math.sign(l.joints[2] - l.joints[1]);
        return [row(person, l, "least wrist girth from the wrist joint, distal positive", signed, -30, 10, "mm")];
      },
    },
    {
      id: "PRO-one-belly",
      source: "one belly per muscle group (testing skill, anatomical facts): the gastrocnemius and soleus make one calf maximum between 0.1 and 0.97 of the shank, the flexor-extensor mass one forearm maximum between the elbow and the wrist (Gray 1918); turns beyond ISO's 4 mm floor",
      read: (person: string, l: ILimb): IRow[] => {
        const span: number[] = segment(l, 1, l.kind === "leg" ? 0.1 : 0.05, l.kind === "leg" ? 0.97 : 0.95);
        return [row(person, l, `${l.kind === "leg" ? "calf" : "forearm"} maxima beyond the 4 mm floor`, HumanCurveProfile.turns(span, FLOOR).filter((t: HumanCurveProfile.ITurn): boolean => t.kind === "max").length, 0, 1, "maxima")];
      },
    },
    {
      id: "PRO-taper",
      source: "the girth falls monotonically from the distal segment's belly to its least girth (PRO-LG-5 to PRO-LG-8, A4 to A5): excess variation within ISO's 4 mm floor",
      read: (person: string, l: ILimb): IRow[] => {
        const belly: number = maxIndex(l, 1, l.kind === "leg" ? 0.15 : 0.1, 0.6);
        const n: number = least(l).index;
        const run: number[] = l.girth.slice(Math.min(belly, n), Math.max(belly, n) + 1);
        return [row(person, l, `${l.kind === "leg" ? "calf to least ankle" : "forearm belly to least wrist"}: excess variation`, HumanCurveProfile.excess(run), 0, FLOOR, "mm")];
      },
    },
    {
      id: "BONE-inside",
      source: "the bone inside its skin (testing skill, anatomical facts): the middle and distal joint centres lie inside the limb's section at their stations",
      read: (person: string, l: ILimb): IRow[] => l.sections.map((s: { ring: P2[]; joint: P2; label: string }): IRow => row(person, l, `${s.label} joint centre outside its section`, inside(s.ring, s.joint) ? 0 : 1, 0, 0, "")),
    },
    {
      id: "OBS-LG-1",
      source: "the gastrocnemius' medial head is the larger, its fibres extending lower than the lateral's, and the medial border the more prominent (Gray 1918), so seen from the front the shank's medial contour reaches farthest below where its lateral contour does",
      read: (person: string, l: ILimb): IRow[] => {
        const c: { share: number[]; medial: number[]; lateral: number[] } | undefined = l.contours;
        if (c === undefined || c.share.length === 0) return [];
        const medial: number = c.share[HumanCurveProfile.argmax(c.medial, 0, c.medial.length - 1)]!;
        const lateral: number = c.share[HumanCurveProfile.argmax(c.lateral, 0, c.lateral.length - 1)]!;
        return [row(person, l, "medial contour's greatest reach below the lateral's, share of the shank", medial - lateral, 0, 1, "")];
      },
    },
  ];

  /** Every row of every relation on every limb of a body. */
  export function rows(person: string, limbs: readonly ILimb[], sex: "female" | "male"): IRow[] {
    return limbs.flatMap((l: ILimb): IRow[] => TABLE.flatMap((r: IRelation): IRow[] => r.read(person, l, sex).map((x: IRow): IRow => ({ ...x, site: `${x.site} (${r.id})` }))));
  }

  /**
   * Left against right (SYM-1): each left limb's girth profile, aligned with
   * its right twin's from their proximal joints, agrees station by station
   * within the mirror bound of `HumanCurveMirror`: the anatomy audits' 0.5 mm
   * mirror distance round the ring (`2 pi 0.5` mm of girth, `HumanAnatomyMirror.MIRROR`)
   * plus `pi` times the person's largest left-right input difference, so a
   * person whose sides differ by input is read against that difference.
   *
   * @param person Name in rows.
   * @param limbs The person's limbs.
   * @param difference The largest left-right difference of the person's paired inputs, mm (`HumanCurveMirror.difference`).
   */
  export function mirror(person: string, limbs: readonly ILimb[], difference: number): IRow[] {
    const bound: number = 2 * Math.PI * HumanAnatomyMirror.MIRROR + Math.PI * difference;
    const out: IRow[] = [];
    for (const left of limbs.filter((l: ILimb): boolean => l.side === "left")) {
      const right: ILimb | undefined = limbs.find((l: ILimb): boolean => l.side === "right" && l.kind === left.kind);
      if (right === undefined) continue;
      const along: (l: ILimb) => number[] = (l: ILimb): number[] => (l.joints[2] >= l.joints[0] ? l.girth.slice(l.joints[0]) : l.girth.slice(0, l.joints[0] + 1).reverse());
      const a: number[] = along(left);
      const b: number[] = along(right);
      let worst: number = 0;
      let at: number = 0;
      for (let i: number = 0; i < Math.min(a.length, b.length); i++) {
        const d: number = Math.abs(a[i]! - b[i]!);
        if (d > worst) {
          worst = d;
          at = i;
        }
      }
      out.push({ person, site: `${left.kind}.left against ${left.kind}.right: largest girth difference from the proximal joint, at ${(at * left.step).toFixed(0)} mm (SYM-1)`, value: worst, low: 0, high: bound, unit: "mm" });
    }
    return out;
  }

  /**
   * The four limbs of a generated body: each limb chain's girth profile
   * every 2 mm and its joints' stations, the profile index whose section
   * centre lies nearest the joint centre of the bind skeleton, and the
   * sections at the middle and distal joints in their own planes.
   *
   * @throws {Error} When the body carries no skeleton or a limb chain.
   */
  export function limbs(body: IAutoMovieHumanBodyCalibration, k: number): ILimb[] {
    const skeleton: AutoMovieHumanSkeletonLaw.IBone[] | undefined = body.skeleton;
    if (skeleton === undefined) throw new Error("the body carries no bind skeleton");
    const out: ILimb[] = [];
    for (const kind of ["leg", "arm"] as const)
      for (const side of ["left", "right"] as const) {
        const name: string = `${kind}.${side}`;
        const chain: IAutoMovieLoftChain | undefined = body.chains.find((c: IAutoMovieLoftChain): boolean => c.name === name);
        if (chain === undefined) throw new Error(`the body carries no ${name} chain`);
        const profile: HumanCurveRings.IProfile = HumanCurveRings.of(body, name, k);
        const bones: string[] = kind === "leg" ? ["UpperLeg", "LowerLeg", "Foot"] : ["UpperArm", "LowerArm", "Hand"];
        const centres: V3[] = bones.map((b: string): V3 => {
          const bone: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton.find((x: AutoMovieHumanSkeletonLaw.IBone): boolean => x.bone === `${side}${b}`);
          if (bone === undefined) throw new Error(`the skeleton has no ${side}${b}`);
          return [bone.position[0] * k, bone.position[1] * k, bone.position[2] * k];
        });
        const joints: [number, number, number] = centres.map((c: V3): number => nearest(profile.centre, c)) as [number, number, number];
        const sections: { ring: P2[]; joint: P2; label: string }[] = [1, 2].map((j: number): { ring: P2[]; joint: P2; label: string } => {
          const s: number = profile.stations[joints[j]!]! / k;
          const frame: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, s);
          const ring: P2[] = AutoMovieLoftChain.ring(chain, s, HumanCurveRings.PHASES).map((p: [number, number, number]): P2 => scale(AutoMovieLoftFrame.local(frame, p), k));
          return { ring, joint: scale(AutoMovieLoftFrame.local(frame, centres[j]!.map((v: number): number => v / k) as V3), k), label: j === 1 ? (kind === "leg" ? "knee" : "elbow") : kind === "leg" ? "ankle" : "wrist" };
        });
        // The shank's frontal contours: each section's reach across the body (z, the body's left +Z) from the knee-to-ankle line.
        let contours: { share: number[]; medial: number[]; lateral: number[] } | undefined;
        if (kind === "leg") {
          contours = { share: [], medial: [], lateral: [] };
          const outward: number = side === "left" ? 1 : -1;
          const [knee, ankle]: V3[] = [centres[1]!, centres[2]!];
          for (let i: number = Math.min(joints[1], joints[2]); i <= Math.max(joints[1], joints[2]); i++) {
            const along: number = (i - joints[1]) / (joints[2] - joints[1]);
            if (along < 0.1 || along > 0.6) continue;
            const axis: number = knee[2] + along * (ankle[2] - knee[2]);
            const across: number[] = AutoMovieLoftChain.ring(chain, profile.stations[i]! / k, HumanCurveRings.PHASES).map((p: [number, number, number]): number => outward * (p[2] * k - axis));
            contours.share.push(along);
            contours.lateral.push(Math.max(...across));
            contours.medial.push(-Math.min(...across));
          }
        }
        out.push({ kind, side, girth: profile.girth, joints, step: HumanCurveRings.STEP, sections, ...(contours !== undefined ? { contours } : {}) });
      }
    return out;
  }

  /** Whether a point lies inside a closed polygon, by the crossing number. */
  export function inside(ring: readonly P2[], p: P2): boolean {
    let crossings: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: P2 = ring[i]!;
      const b: P2 = ring[(i + 1) % ring.length]!;
      if (a[1] > p[1] !== b[1] > p[1] && p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) crossings++;
    }
    return crossings % 2 === 1;
  }

  /** A row on a limb. */
  function row(person: string, l: ILimb, what: string, value: number, low: number, high: number, unit: string): IRow {
    return { person, site: `${l.kind}.${l.side} ${what}`, value, low, high, unit };
  }

  /** A ratio row against a population relation's band for the sex. */
  function band(person: string, l: ILimb, label: string, value: number, sex: "female" | "male"): IRow {
    const r: HumanPopulationAudit.IRelation | undefined = HumanPopulationAudit.RELATIONS.find((x: HumanPopulationAudit.IRelation): boolean => x.label === label);
    if (r === undefined) throw new Error(`no population relation named ${label}`);
    return row(person, l, `${label} on the curves`, value, r.band[sex][0], r.band[sex][1], "");
  }

  /** The girth at a joint's index. */
  function at(l: ILimb, joint: number): number {
    return l.girth[l.joints[joint]!]!;
  }

  /** The profile index at a share of the segment from joint `a` to joint `b`. */
  function index(l: ILimb, a: number, b: number, share: number): number {
    return Math.round(l.joints[a]! + share * (l.joints[b]! - l.joints[a]!));
  }

  /** A profile index's share of the segment from joint `a` to joint `b`. */
  function share(l: ILimb, a: number, b: number, i: number): number {
    return (i - l.joints[a]!) / (l.joints[b]! - l.joints[a]!);
  }

  /** The girths of the segment from joint `j` to the next, between two shares, in order from `j`. */
  function segment(l: ILimb, j: number, from: number, to: number): number[] {
    const a: number = index(l, j, j + 1, from);
    const b: number = index(l, j, j + 1, to);
    const run: number[] = l.girth.slice(Math.min(a, b), Math.max(a, b) + 1);
    return a <= b ? run : run.reverse();
  }

  /** The index of the greatest girth of a segment between two shares. */
  function maxIndex(l: ILimb, j: number, from: number, to: number = 1): number {
    const a: number = index(l, j, j + 1, from);
    const b: number = index(l, j, j + 1, to);
    return HumanCurveProfile.argmax(l.girth, Math.min(a, b), Math.max(a, b));
  }

  /** The greatest girth of a segment between two shares. */
  function max(l: ILimb, j: number, from: number, to: number = 1): number {
    return l.girth[maxIndex(l, j, from, to)]!;
  }

  /**
   * The distal segment's least girth below its belly: from its greatest
   * girth between 0.1 (0.15 on the shank) and 0.6 of the segment down to 10 mm
   * past the distal joint.
   */
  function least(l: ILimb): { index: number; girth: number } {
    const belly: number = maxIndex(l, 1, l.kind === "leg" ? 0.15 : 0.1, 0.6);
    const past: number = l.joints[2] + Math.sign(l.joints[2] - l.joints[1]) * Math.round(10 / l.step);
    const end: number = Math.max(0, Math.min(l.girth.length - 1, past));
    const i: number = HumanCurveProfile.argmin(l.girth, Math.min(belly, end), Math.max(belly, end));
    return { index: i, girth: l.girth[i]! };
  }

  /** The index of the centre nearest a point. */
  function nearest(centres: readonly V3[], p: V3): number {
    let best: number = 0;
    let d: number = Infinity;
    centres.forEach((c: V3, i: number): void => {
      const e: number = Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]);
      if (e < d) {
        d = e;
        best = i;
      }
    });
    return best;
  }

  /** A planar point scaled. */
  function scale(p: P2, k: number): P2 {
    return [p[0] * k, p[1] * k];
  }
}
