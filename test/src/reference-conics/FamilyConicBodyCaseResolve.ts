import type { FamilyConicBodyCases as Cases } from "./FamilyConicBodyCases";
import type {
  IAutoMovieHumanF1Engineering,
  IAutoMovieHumanF1NativeLaw,
} from "@automovie/interface";

/**
 * The body round's cases resolved into native fields, in the record the native round's artifact holds
 * (`AutoMovieHumanF1Engineering.IResolvedCase`, written by `FamilyConicNativeRound` as `cases.json`, schema `f1-native-cases/v1`, and
 * read by `FamilyConicFigure --cases=<artifact> --case=<id>`).
 *
 * A row of `FamilyConicBodyCases.CASES` says which measure moves and by what ratio. The rows the native fields can state today are
 * resolved here from f1's own fields: a breadth or a depth at a site that has a caliper, tissue, and a length. A girth row and the bust
 * row are returned as unresolved with the reason: the native path takes no girth as an input until a site's section is solved at a
 * knot (the site law). The thigh's rows are unresolved as well, since the native fields hold no thigh caliper.
 *
 * This module computes fields only. Writing the artifact (its source hashes and bundle manifest) stays the native round's.
 */
export namespace FamilyConicBodyCaseResolve {
  type IFields = IAutoMovieHumanF1NativeLaw.IFields;

  /** A caliper record of the native fields: depth and breadth, mm. */
  type ISize = IFields["wall"]["hipSkin"];

  /** A row resolved, or the reason it is not yet. */
  export type IOutcome = { resolved: IAutoMovieHumanF1Engineering.IResolvedCase } | { id: string; unresolved: string };

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
   * One row resolved against f1's own fields.
   *
   * @param row The case.
   * @param base f1's native fields, which the result does not share any record with where it differs.
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
        rawDrivers: { mode: row.kind === "f1" ? "f1" : "full-field", ratios: { hip: 1, omphalion: 1, underbust: 1, bust: 1, neck: 1 }, hipJointCentreBreadth: fields.hipJointCentreBreadth },
        resolution: { status: "resolved", target: null, actual: null, residual: null, reason: null },
        girthResiduals: null,
        qualification: ["the body round's case table: " + row.basis, "holds " + row.holds, "left side and median trunk; the right is the mirror"],
      },
    };
  }
}
