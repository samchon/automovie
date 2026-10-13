import {
  AutoMovieFaceParameterName,
  IAutoMovieFace,
} from "@automovie/interface";

import { IAutoMovieFaceTrait } from "./IAutoMovieFaceTrait";

/** A symmetric feature with one morph target. */
interface ISingleTrait {
  parameter: AutoMovieFaceParameterName;
  path: string;
  read: (face: IAutoMovieFace) => number | undefined;
}

/** The two sides of a paired feature group, read as plain weight records. */
interface ISidedSet {
  left?: Readonly<Record<string, number | undefined>>;
  right?: Readonly<Record<string, number | undefined>>;
}

/**
 * A paired feature with one morph target per side, named `${base}R` and
 * `${base}L`; the type of `base` makes the compiler check both names exist in
 * {@link AutoMovieFaceParameterName}.
 */
interface IPairedTrait {
  base:
    | "eyeSize"
    | "eyeWidth"
    | "eyeSpacing"
    | "eyeHeight"
    | "eyeTilt"
    | "browHeight"
    | "cheekFullness";
  group: "eyes" | "brows" | "cheeks";
  leaf: string;
  read: (face: IAutoMovieFace) => ISidedSet | undefined;
  /** Pair-level weight added onto each side's value, when the pair has one. */
  shared?: (face: IAutoMovieFace) => number | undefined;
  /** Document field name of the pair-level weight. */
  sharedLeaf?: string;
}

const SINGLE: readonly ISingleTrait[] = [
  { parameter: "faceWidth", path: "width", read: (f: IAutoMovieFace): number | undefined => f.width },
  {
    parameter: "faceLength",
    path: "length",
    read: (f: IAutoMovieFace): number | undefined => f.length,
  },
  {
    parameter: "jawWidth",
    path: "jaw.width",
    read: (f: IAutoMovieFace): number | undefined => f.jaw?.width,
  },
  {
    parameter: "chinLength",
    path: "jaw.chin.length",
    read: (f: IAutoMovieFace): number | undefined => f.jaw?.chin?.length,
  },
  {
    parameter: "chinProtrusion",
    path: "jaw.chin.protrusion",
    read: (f: IAutoMovieFace): number | undefined => f.jaw?.chin?.protrusion,
  },
  {
    parameter: "noseLength",
    path: "nose.length",
    read: (f: IAutoMovieFace): number | undefined => f.nose?.length,
  },
  {
    parameter: "noseWidth",
    path: "nose.width",
    read: (f: IAutoMovieFace): number | undefined => f.nose?.width,
  },
  {
    parameter: "noseProjection",
    path: "nose.projection",
    read: (f: IAutoMovieFace): number | undefined => f.nose?.projection,
  },
  {
    parameter: "mouthWidth",
    path: "mouth.width",
    read: (f: IAutoMovieFace): number | undefined => f.mouth?.width,
  },
  {
    parameter: "mouthHeight",
    path: "mouth.height",
    read: (f: IAutoMovieFace): number | undefined => f.mouth?.height,
  },
  {
    parameter: "lipFullness",
    path: "mouth.lips.fullness",
    read: (f: IAutoMovieFace): number | undefined => f.mouth?.lips?.fullness,
  },
];

const eyes = (f: IAutoMovieFace): ISidedSet | undefined =>
  f.eyes as ISidedSet | undefined;

const PAIRED: readonly IPairedTrait[] = [
  { base: "eyeSize", group: "eyes", leaf: "size", read: eyes },
  { base: "eyeWidth", group: "eyes", leaf: "width", read: eyes },
  {
    base: "eyeSpacing",
    group: "eyes",
    leaf: "offset",
    read: eyes,
    shared: (f: IAutoMovieFace): number | undefined => f.eyes?.spacing,
    sharedLeaf: "spacing",
  },
  { base: "eyeHeight", group: "eyes", leaf: "height", read: eyes },
  { base: "eyeTilt", group: "eyes", leaf: "tilt", read: eyes },
  {
    base: "browHeight",
    group: "brows",
    leaf: "height",
    read: (f: IAutoMovieFace): ISidedSet | undefined =>
      f.brows as ISidedSet | undefined,
  },
  {
    base: "cheekFullness",
    group: "cheeks",
    leaf: "fullness",
    read: (f: IAutoMovieFace): ISidedSet | undefined =>
      f.cheeks as ISidedSet | undefined,
  },
];

/**
 * Project an {@link IAutoMovieFace} onto its morph targets: the nested,
 * anatomy-shaped document flattened to `(parameter, path, weight)` traits,
 * symmetric features first and then each paired feature's right and left
 * targets, in the order of the tables above, with omitted leaves and groups
 * skipped.
 *
 * Paired features follow the side rule: when only one of `left` and `right`
 * is defined, that lone side sources both side targets (the symmetric
 * shorthand); when both are defined, each sources only its own target. The eye
 * pair's `spacing` weight adds onto each side's `offset` for the spacing
 * targets, and alone it still drives both. The reported `path` names the field
 * the document actually spells (the mirrored source when only one side
 * exists, or `eyes.spacing` when no side sets an offset), so a violation is
 * always actionable.
 *
 * Both engine consumers go through this single mapping, so validation paths and
 * morph application can never disagree about what a field means: `validateFace`
 * range-checks each trait at its document `path`, `morphFace` applies each
 * trait's `parameter` target.
 *
 * @evidence contracts/common.md#principled-implementation A table-driven projection: each row names one target, its document path and an accessor, so the output is a pure function of the document; the side rule picks the defined side as the source per target, and the spacing sum is the additive composition the interface documents, with its `[-2, 2]` range applied to that per-side sum by `validateFace`.
 * @evidence contracts/common.md#clear-and-simple-design Two tables, symmetric and paired, keep each mapping in one row, and the pair-level weight is a row field rather than a name test, so adding a target is one row; `IPairedTrait.base` is a closed union so a missing `R` or `L` target name fails compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No feature is special-cased by name in the loop; the casts from each pair interface to `ISidedSet` only widen named optional number fields to a record lookup by the row's `leaf`, which every row spells from those same interfaces.
 * @evidence contracts/common.md#meaningful-documentation States the output order, the omission rule, the side rule in both cases, how spacing composes and what it drives alone, which `path` is reported in each case, and that `validateFace` and `morphFace` both consume this one mapping.
 * @evidence contracts/performance.md#efficient-algorithms One pass over 11 symmetric rows and 7 paired rows with two sides each, at most 25 traits, constant for the fixed vocabulary; each row reads its group once per side.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure projection of one small document per call; `validateFace` and `morphFace` run in separate stages, and the projection is cheaper than any cache keyed on a mutable document.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new array of at most 25 trait records owned by the caller; the tables are module constants and no document reference is retained.
 * @author Samchon
 */
export const flattenFace = (face: IAutoMovieFace): IAutoMovieFaceTrait[] => {
  const out: IAutoMovieFaceTrait[] = [];
  for (const { parameter, path, read } of SINGLE) {
    const weight: number | undefined = read(face);
    if (weight !== undefined) out.push({ parameter, path, weight });
  }
  for (const { base, group, leaf, read, shared, sharedLeaf } of PAIRED) {
    const set: ISidedSet | undefined = read(face);
    if (set === undefined) continue;
    const pairWeight: number | undefined = shared?.(face);
    for (const [suffix, side, other] of [
      ["R", "right", "left"],
      ["L", "left", "right"],
    ] as const) {
      const source: "left" | "right" = set[side] !== undefined ? side : other;
      const value: number | undefined = set[source]?.[leaf];
      if (value === undefined && pairWeight === undefined) continue;
      const parameter: AutoMovieFaceParameterName = `${base}${suffix}`;
      out.push({
        parameter,
        path:
          value !== undefined
            ? `${group}.${source}.${leaf}`
            : `${group}.${sharedLeaf}`,
        weight: (value ?? 0) + (pairWeight ?? 0),
      });
    }
  }
  return out;
};
