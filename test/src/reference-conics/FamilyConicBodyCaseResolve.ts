import type { FamilyConicBodyCases as Cases } from "./FamilyConicBodyCases";

/**
 * Apply the case table to a caller's caliper and length fields. A change to a
 * girth requires a separate site solve. A row without the requested caliper
 * carries the reason it cannot resolve.
 */
export namespace FamilyConicBodyCaseResolve {
  /** A caliper record of the native fields: depth and breadth, mm. */
  interface ISize {
    /** Whole depth in the site's measured plane. */
    depth: number;
    /** Whole breadth in the same plane. */
    breadth: number;
  }

  /** Material measurements explicitly supplied for the round, in mm. */
  export interface IFields {
    /** The caller's skeletal support breadth. */
    hipJointCentreBreadth: number;
    /** The six declared trunk and head wall sites. */
    wall: Record<"hipSkin" | "omphalionWall" | "underbustWall" | "bustWall" | "neckSkin" | "headSkin", ISize>;
    /** The four original root calipers. */
    roots: Record<"arm" | "leg" | "breast" | "nose", ISize>;
    /** Source cap projection carried in the field record. */
    breastProjection: number;
    /** The four arm caliper sites. */
    arm: Record<"upperArm" | "elbow" | "forearm" | "wrist", ISize>;
    /** The three supplied leg caliper sites. */
    leg: Record<"knee" | "calf" | "ankle", ISize>;
    /** Hand, foot and representative digit calipers. */
    extremities: Record<"hand" | "foot" | "finger" | "toe", ISize>;
    /** Long bone, trunk and distal segment lengths. */
    lengths: Record<"upperArm" | "forearm" | "thigh" | "shank" | "pelvisToThorax" | "thoraxToHead" | "handLength" | "handBreadth" | "footLength" | "footBreadth", number> & {
      /** Ordered bone lengths of each supplied digit. */
      phalanges: Record<string, [number, number, number]>;
    };
  }

  /** The record emitted when a row requires only direct field changes. */
  interface IResolved {
    /** The original case identifier. */
    id: string;
    /** The transformed field values. */
    fields: IFields;
    /** Baseline mode or direct fields, retaining the unchanged support. */
    rawDrivers: {
      mode: "baseline" | "full-field";
      ratios: Record<"hip" | "omphalion" | "underbust" | "bust" | "neck", number>;
      hipJointCentreBreadth: number;
    };
    /** Direct field moves have no solved numerical residual. */
    resolution: { status: "resolved"; target: null; actual: null; residual: null; reason: null };
    /** A direct field move has no tape comparison. */
    girthResiduals: null;
    /** The case basis, held measurements and side convention. */
    qualification: string[];
  }

  /** A row resolved, or the reason it is not yet. */
  export type IOutcome = { resolved: IResolved } | { id: string; unresolved: string };

  /** Where each site's caliper stands in the native fields; a site without one is absent. */
  const CALIPERS: Record<string, (fields: IFields) => { depth: number; breadth: number }> = {
    hip: (f: IFields): ISize => f.wall.hipSkin,
    omphalion: (f: IFields): ISize => f.wall.omphalionWall,
    underbust: (f: IFields): ISize => f.wall.underbustWall,
    neck: (f: IFields): ISize => f.wall.neckSkin,
    upperArm: (f: IFields): ISize => f.arm.upperArm,
    elbow: (f: IFields): ISize => f.arm.elbow,
    forearm: (f: IFields): ISize => f.arm.forearm,
    wrist: (f: IFields): ISize => f.arm.wrist,
    knee: (f: IFields): ISize => f.leg.knee,
    calf: (f: IFields): ISize => f.leg.calf,
    ankle: (f: IFields): ISize => f.leg.ankle,
    hand: (f: IFields): ISize => f.extremities.hand,
    foot: (f: IFields): ISize => f.extremities.foot,
  };

  /** The long bones a `limbs` length case moves together. */
  const LIMBS: readonly ("upperArm" | "forearm" | "thigh" | "shank")[] = ["upperArm", "forearm", "thigh", "shank"];

  /** A deep copy of the fields a case may edit: every caliper record and the lengths with their bones. */
  function copy(base: IFields): IFields {
    const sizes = <K extends string>(group: Record<K, { depth: number; breadth: number }>): Record<K, { depth: number; breadth: number }> =>
      Object.fromEntries((Object.entries(group) as [K, { depth: number; breadth: number }][]).map(([key, size]: [K, { depth: number; breadth: number }]): [K, { depth: number; breadth: number }] => [key, { ...size }])) as Record<K, { depth: number; breadth: number }>;
    return {
      ...base,
      wall: sizes(base.wall),
      roots: sizes(base.roots),
      arm: sizes(base.arm),
      leg: sizes(base.leg),
      extremities: sizes(base.extremities),
      lengths: { ...base.lengths, phalanges: Object.fromEntries(Object.entries(base.lengths.phalanges).map(([digit, bones]): [string, [number, number, number]] => [digit, [...bones]])) },
    };
  }

  /**
   * One row resolved against the caller's baseline fields.
   *
   * @param row The case.
   * @param base The baseline fields, with direct field changes applied to a copy.
   */
  export function resolve(row: Cases.ICase, base: IFields): IOutcome {
    const fields: IFields = copy(base);
    if (row.kind === "girth" || row.kind === "bust")
      return { id: row.id, unresolved: "the native path takes no girth as an input yet: a girth closes a site's fullness once the site's section is solved at a knot" };
    if (row.kind === "breadth" || row.kind === "depth") {
      const at: ((f: IFields) => { depth: number; breadth: number }) | undefined = row.site === null ? undefined : CALIPERS[row.site];
      if (at === undefined) return { id: row.id, unresolved: "the native fields hold no caliper at the site " + row.site };
      at(fields)[row.kind] *= row.ratio;
    } else if (row.kind === "tissue") {
      for (const group of [fields.wall, fields.roots, fields.arm, fields.leg, fields.extremities] as Record<string, { depth: number; breadth: number }>[])
        for (const size of Object.values(group)) {
          size.depth *= row.ratio;
          size.breadth *= row.ratio;
        }
    } else if (row.kind === "length") {
      // The row's identifier is `length-<field>-<ratio>`, the native round's own wording of a length case.
      const field: string = row.id.split("-")[1] ?? "";
      if (field === "limbs") for (const bone of LIMBS) fields.lengths[bone] *= row.ratio;
      else if (field === "phalanges") for (const bones of Object.values(fields.lengths.phalanges)) for (let k: number = 0; k < bones.length; ++k) bones[k]! *= row.ratio;
      else if (field === "upperArm" || field === "forearm" || field === "thigh" || field === "shank" || field === "handLength" || field === "handBreadth" || field === "footLength" || field === "footBreadth") fields.lengths[field] *= row.ratio;
      else return { id: row.id, unresolved: "the native fields hold no length named " + field };
    }
    return {
      resolved: {
        id: row.id,
        fields,
        rawDrivers: { mode: row.kind === "baseline" ? "baseline" : "full-field", ratios: { hip: 1, omphalion: 1, underbust: 1, bust: 1, neck: 1 }, hipJointCentreBreadth: fields.hipJointCentreBreadth },
        resolution: { status: "resolved", target: null, actual: null, residual: null, reason: null },
        girthResiduals: null,
        qualification: ["the body round's case table: " + row.basis, "holds " + row.holds, "left side and median trunk; the right is the mirror"],
      },
    };
  }
}
