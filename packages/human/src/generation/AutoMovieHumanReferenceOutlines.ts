/**
 * The outline knot tables estimated from the private reference curves, the
 * shapes the view parts draw between the published measures that size them.
 *
 * Estimated from the private reference set (f1, f2, m1 and m2, aggregated as
 * normalized ratios, `.references/curves`); no published source carries these
 * shapes. Each table names the reading that produced it under
 * `test/src/features/human/estimate/`, its normalization, and its consumer;
 * each row is a station share and the mean of each column over the people the
 * station read on. A table whose rows are empty waits for its reading's run,
 * and its reader reports that rather than inventing a shape.
 *
 * Scaling: every value is a share of one of the person's own measures, named
 * per table, so a person's outline is the table times their measure; the
 * stations are shares between the person's own landmarks.
 */
export namespace AutoMovieHumanReferenceOutlines {
  /** One station of a table: its share and its columns' values. */
  export interface IRow {
    /** The station's share between the table's landmarks. */
    share: number;

    /** Each column's mean at the station. */
    values: Readonly<Record<string, number>>;
  }

  /** One table: its reading, its normalization, its consumers and its rows. */
  export interface ITable {
    /** The reading test that prints it. */
    reading: string;

    /** What the stations' share runs between, and what each value is a share of. */
    normalization: string;

    /** The view parts that read it. */
    consumers: string;

    /** The columns, in order. */
    columns: readonly string[];

    /** The rows, by increasing share; empty until the reading runs. */
    rows: readonly IRow[];
  }

  /** The trunk's outline along its height. */
  export const TRUNK: ITable = {
    reading: "test_human_estimate_trunk_outline",
    normalization: "share of crotch to cervicale; half breadth, front and back (forward of cervicale's back point) per stature; shoulders 0 chord to 1 box",
    consumers: "the trunk's view part (upperSites, the outlines above the chest)",
    columns: ["halfBreadth", "front", "back", "shoulderFront", "shoulderBack"],
    rows: [],
  };

  /** The head mass's outline along its height. */
  export const HEAD: ITable = {
    reading: "test_human_estimate_head_outline",
    normalization: "share of menton to vertex; P and B forward of the skull's centre per head length; L per half head breadth; shoulders 0 chord to 1 box",
    consumers: "AutoMovieHumanHeadMassPart (P, B, L, the quarters' fullness)",
    columns: ["P", "B", "L", "shoulderFront", "shoulderBack"],
    rows: [],
  };

  /** The forearm's section along it, wrist 0 to elbow 1. */
  export const FOREARM: ITable = {
    reading: "test_human_estimate_arm_sections",
    normalization: "share of wrist to elbow; the four extents about the section's centre per girth; shoulders 0 chord to 1 box",
    consumers: "the arm's view part (armSites)",
    columns: ["anterior", "lateral", "posterior", "medial", "shoulderFront", "shoulderBack"],
    rows: [],
  };

  /** The upper arm's section along it, elbow 0 to the axilla 1. */
  export const UPPER_ARM: ITable = {
    reading: "test_human_estimate_arm_sections",
    normalization: "share of elbow to the axilla; the four extents per girth; shoulders 0 chord to 1 box",
    consumers: "the arm's view part (armSites)",
    columns: ["anterior", "lateral", "posterior", "medial", "shoulderFront", "shoulderBack"],
    rows: [],
  };

  /** The foot's outline along its axis, heel 0 to toe 1. */
  export const FOOT: ITable = {
    reading: "test_human_estimate_foot_outline",
    normalization: "share of the foot length from the heel; edges about the axis and heights, per foot length",
    consumers: "the foot's view part (foot())",
    columns: ["lateral", "medial", "dorsum", "plantar"],
    rows: [],
  };

  /** The face's midline profile and front contour, nasion 0 to menton 1. */
  export const FACE: ITable = {
    reading: "test_human_estimate_face_profile",
    normalization: "share of nasion to menton; midline forward of the nasion per face height; setback at 0 to 1 of the half face width per half face width",
    consumers: "the head's face parts (nose, lips, chin, malar and cheek over the head mass)",
    columns: ["midline", "setback0", "setback0.2", "setback0.4", "setback0.6", "setback0.8", "setback1"],
    rows: [],
  };

  /** The breast's profile about the bust point, -1 down or medial to 1 up or lateral. */
  export const BREAST: ITable = {
    reading: "test_human_estimate_masses",
    normalization: "share of 0.1 stature (vertical) or a quarter section breadth (horizontal) about the bust point; setback behind the point per stature, women",
    consumers: "the breast part's footprint and profile",
    columns: ["vertical", "horizontal"],
    rows: [],
  };

  /** The gluteal mass's profile about the buttock point, as the breast's. */
  export const GLUTEAL: ITable = {
    reading: "test_human_estimate_masses",
    normalization: "as BREAST, about the buttock's most posterior point, both sexes by sex",
    consumers: "the gluteal part's footprint and profile",
    columns: ["vertical", "horizontal"],
    rows: [],
  };

  /** The ear's side outline, lobule 0 to top 1. */
  export const EAR: ITable = {
    reading: "test_human_estimate_ear_outline",
    normalization: "share of the ear's height; anterior and posterior rim forward of the ear's mean per ear breadth",
    consumers: "the ear's lateral outline (AutoMovieHumanHeadEarParts)",
    columns: ["anterior", "posterior"],
    rows: [],
  };

  /** The palpebral fissure, medial canthus 0 to lateral 1. */
  export const FISSURE: ITable = {
    reading: "test_human_estimate_lid_margins",
    normalization: "share of the fissure length; upper and lower margin heights per fissure height; forward per fissure length",
    consumers: "the lids' fissure outline and profile",
    columns: ["upper", "lower", "forward"],
    rows: [],
  };

  /** The lips' front-view half width, subnasale 0 to the lower lip's foot 1. */
  export const LIPS: ITable = {
    reading: "test_human_estimate_face_detail",
    normalization: "share of subnasale to a quarter face height under the stomion; half width per half mouth width",
    consumers: "the lips' front-view outline",
    columns: ["halfWidth"],
    rows: [],
  };

  /** The shank's lateral share about its bone line, ankle 0 to knee 1. */
  export const SHANK_SPLIT: ITable = {
    reading: "test_human_estimate_leg_split",
    normalization: "share of the ankle cut to the knee; lateral share of the breadth about the ankle-to-knee centre line",
    consumers: "leg/AutoMovieHumanLegLaws (the lateral split)",
    columns: ["lateral"],
    rows: [],
  };

  /** The thigh's lateral share about the femur's line, knee 0 toward the crotch 1. */
  export const THIGH_SPLIT: ITable = {
    reading: "test_human_estimate_thigh_split",
    normalization: "share of the knee centre toward the crotch; lateral share of the breadth about Hara's hip centre to de Leva's knee centre",
    consumers: "leg/AutoMovieHumanLegLaws (the lateral split)",
    columns: ["lateral"],
    rows: [],
  };

  /**
   * A table's column at a share, linear between rows and held beyond them.
   *
   * @param table The table.
   * @param column One of its columns.
   * @param share The station's share.
   * @returns The value at the share.
   * @throws When the table's rows wait for their reading's run, or the column is not the table's.
   */
  export function at(table: ITable, column: string, share: number): number {
    if (table.rows.length === 0) throw new Error(`AutoMovieHumanReferenceOutlines: ${table.reading} has not filled its table yet`);
    if (!table.columns.includes(column)) throw new Error(`AutoMovieHumanReferenceOutlines: ${table.reading} has no column ${column}`);
    const rows: readonly IRow[] = table.rows;
    const read = (r: IRow): number => r.values[column] ?? NaN;
    if (share <= rows[0]!.share) return read(rows[0]!);
    for (let i: number = 0; i + 1 < rows.length; i++) {
      const a: IRow = rows[i]!;
      const b: IRow = rows[i + 1]!;
      if (share <= b.share) return read(a) + ((share - a.share) / (b.share - a.share)) * (read(b) - read(a));
    }
    return read(rows[rows.length - 1]!);
  }
}
