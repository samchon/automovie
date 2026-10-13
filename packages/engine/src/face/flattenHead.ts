import {
  AutoMovieHeadParameterName,
  IAutoMovieHead,
} from "@automovie/interface";

/**
 * Every leaf of every {@link IAutoMovieHead} group mapped to its morph name;
 * `-?` makes each group and field required, so a leaf added to the interface
 * without a mapping, or a mapping for a field that does not exist, fails
 * compilation.
 */
type HeadParameterMap = {
  readonly [G in keyof IAutoMovieHead]-?: {
    readonly [F in keyof Required<IAutoMovieHead>[G]]-?: AutoMovieHeadParameterName;
  };
};

/**
 * How each anatomy-grouped head leaf projects onto its flat
 * {@link AutoMovieHeadParameterName}. The grouping is for the LLM's benefit;
 * authored morph templates consume the flat names independently of topology.
 */
const HEAD_PARAMETERS: HeadParameterMap = {
  shape: {
    width: "faceWidth",
    length: "faceLength",
    oval: "faceOval",
    round: "headRound",
    foreheadSlope: "foreheadSlope",
    foreheadHeight: "foreheadHeight",
    foreheadBulge: "foreheadBulge",
    templeWidth: "templeWidth",
    occiputDepth: "occiputDepth",
  },
  brow: { height: "browHeight", angle: "browAngle" },
  eyes: {
    size: "eyeSize",
    openness: "eyeHeight",
    spacing: "eyeSpacing",
    tilt: "eyeAngle",
    depth: "eyeDepth",
    epicanthus: "epicanthus",
    fold: "eyeFold",
  },
  nose: {
    width: "noseWidth",
    length: "noseLength",
    projection: "noseProject",
    hump: "noseHump",
    tipAngle: "nosePoint",
    nostrilWidth: "nostrilWidth",
    baseHeight: "noseBaseH",
    bridge: "noseBridge",
  },
  mouth: {
    width: "mouthWidth",
    lipFullness: "lipFull",
    upperLipHeight: "upperLipH",
    lowerLipHeight: "lowerLipH",
    cupidsBow: "cupidsBow",
    philtrum: "philtrum",
    height: "mouthHeight",
    smile: "mouthSmile",
  },
  cheek: { fullness: "cheekFull", bones: "cheekBones" },
  jaw: {
    width: "jawWidth",
    drop: "jawDrop",
    chinLength: "chinLength",
    chinWidth: "chinWidth",
    chinProjection: "chinProject",
  },
};

/**
 * Project an anatomy-grouped {@link IAutoMovieHead} document onto the flat morph
 * weights {@link AutoMovieHeadParameterName} for an authored morph template.
 * The caller supplies the template's neutral geometry and matching targets;
 * this projection does not construct an anatomical face document, apply the
 * weights, or range-check them.
 *
 * Omitted groups and fields are skipped (they stay neutral), so the result
 * carries only the traits the document set, each weight copied unchanged.
 * Every leaf of the head interface has exactly one morph name, checked by the
 * compiler, so no field is invented and none is dropped.
 *
 * @evidence contracts/common.md#principled-implementation A fixed one-to-one renaming from grouped leaves to flat names, read from a table whose mapped type requires every group and field of `IAutoMovieHead`, so the projection is total over the interface and leaves values untouched.
 * @evidence contracts/common.md#clear-and-simple-design One table plus a two-level loop; the table is the whole specification of the vocabulary bridge. The function is retained dormant face code with no production caller, only its test, which the face barrel documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No weight is clamped, scaled or defaulted, and only table keys are read, so an unknown property on the document is ignored rather than passed through as a morph name; the two casts only widen named optional number fields to string-keyed lookups over those same keys.
 * @evidence contracts/common.md#meaningful-documentation States what the caller must supply, that the function neither applies nor validates weights, the omission rule, that values are copied unchanged, and that completeness is compiler-checked.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the 41 table entries, constant for the fixed vocabulary, with one property read each and no intermediate arrays beyond the key lists.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure projection of one small document per call with no coordination across callers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new record of at most 41 numbers owned by the caller; the table is a module constant and no document reference is retained.
 * @author Samchon
 */
export const flattenHead = (
  doc: IAutoMovieHead,
): Partial<Record<AutoMovieHeadParameterName, number>> => {
  const out: Partial<Record<AutoMovieHeadParameterName, number>> = {};
  for (const group of Object.keys(HEAD_PARAMETERS) as (keyof IAutoMovieHead)[]) {
    const fields: Readonly<Record<string, number | undefined>> | undefined =
      doc[group] as Readonly<Record<string, number | undefined>> | undefined;
    if (fields === undefined) continue;
    const names: Readonly<Record<string, AutoMovieHeadParameterName>> =
      HEAD_PARAMETERS[group];
    for (const field of Object.keys(names)) {
      const value: number | undefined = fields[field];
      if (value !== undefined) out[names[field]!] = value;
    }
  }
  return out;
};
