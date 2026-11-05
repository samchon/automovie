import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Four signed original outlines in +u,+v,-u,-v order. */
type Outlines = readonly [
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
];

/** Existing direct fullness ownership, after scalar source admission. */
type Fullness =
  | {
      kind: "shoulder";
      owner: AutoMovieViewOutline.IOutline;
      departures: Outlines | null;
    }
  | { kind: "top"; shoulders: Outlines };

/** A null span denotes the existing constant ellipse cap law. */
interface Cap {
  /** Declared pole station, mm. */
  pole: number;

  /** Original nearest non-pole knot station; null for the constant law. */
  near: number | null;

  /** Its actual distance from the pole; null for the constant law. */
  span: number | null;
}

/**
 * Original scalar preparation retained for a direct view-generated field.
 *
 * @evidence contracts/common.md#principled-implementation Admits the same signed outlines, direct fullness and pole parameters as ViewLoft, retaining actual prepared scalar functions rather than principal phase samples.
 * @evidence contracts/common.md#clear-and-simple-design Admission and plain source data are separate from station reading and geometry evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit, resample, alter knots or invent station derivatives; generic girth remains the explicitly separate existing producer mode.
 * @evidence contracts/common.md#meaningful-documentation States signed quarter order, source ownership, cap spans and absent girth support.
 * @evidence contracts/performance.md#efficient-algorithms Each original outline is prepared once; cap spans inspect the original knot stations once per declared end.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned scalar preparations serve every station and phase through their reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned plain arrays retain only original scalar preparations and at most two cap records; no module cache is created.
 */
export namespace AutoMovieLoftViewSource {
  /**
   * Value-copyable original scalar definition of a direct view field.
   *
   * @evidence contracts/common.md#principled-implementation Explicit prepared sources retain their actual interpolation parameters, scalar jets and cap law.
   * @evidence contracts/common.md#clear-and-simple-design Four extremes, one direct fullness owner and cap records determine a station's inputs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No emitted row or object-registration identity selects the scalar geometry.
   * @evidence contracts/common.md#meaningful-documentation Members give quarter signs, physical station units and the cap's constant case.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source reading owns reuse of its prepared curves.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Storage follows the original knot populations and two cap records; no layer-squared table is retained.
   */
  export interface ISource {
    /** Explicit source discriminator; a malformed present source is not legacy absence. */
    kind: "view";

    /** Original signed outlines in +u,+v,-u,-v order, with opposite signs retained. */
    extents: Outlines;

    /** Direct shoulder plus departures, or four independent top shoulders. */
    fullness: Fullness;

    /** Original declared station interval in mm; final chain ownership may be narrower. */
    domain: readonly [number, number];

    /** Existing quintic cap-shoulder spans; null span means a constant weight of one. */
    caps: readonly Cap[];
  }

  /**
   * Scalar admission with all independent source failures preserved.
   *
   * @evidence contracts/common.md#principled-implementation Separates original source admission failures from an available field definition.
   * @evidence contracts/common.md#clear-and-simple-design One nullable source and its collected diagnostics avoid partial hidden success.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed curves are never replaced by another curve or a zero derivative.
   * @evidence contracts/common.md#meaningful-documentation States diagnostic ownership and the null-source meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Result data performs no admission.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Admission owns source preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the successful source or diagnostic list.
   */
  export interface IResult {
    /** Null when any scalar admission premise failed. */
    source: ISource | null;

    /** Every original curve failure, with its existing contract and source name. */
    diagnostics: AutoMovieViewOutline.IFailure[];
  }

  /**
   * Prepare direct shoulder/top ownership; null explicitly leaves generic girth unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Uses original signed outlines and the existing pole parameter, while direct fullness retains its own scalar parameter.
   * @evidence contracts/common.md#clear-and-simple-design One exhaustive ownership branch follows shared curve admission and cap preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Collects all independent failures without sorting or changing inputs; no incomplete girth derivative provider is attached.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes explicit generic-girth absence from a failed direct source and states immutable borrowed input.
   * @evidence contracts/performance.md#efficient-algorithms Linear original-outline preparation plus fixed end/quarter traversal; no native phase inverse or girth solve occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work Each admitted scalar spline is retained once for subsequent station reads.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied scalar preparations and cap metadata; inputs and temporary arrays are not globally retained.
   */
  export function create(part: IAutoMovieViewPart): IResult | null {
    if (part.fullness.kind === "girth") return null;
    const diagnostics: AutoMovieViewOutline.IFailure[] = [];
    const first: number = part.stations[0] ?? NaN;
    const last: number = part.stations[part.stations.length - 1] ?? NaN;
    if (
      !(
        Number.isFinite(first) &&
        Number.isFinite(last) &&
        Number.isFinite(last - first) &&
        last > first
      )
    )
      return {
        source: null,
        diagnostics: [
          {
            contract: "outline",
            detail:
              "The view source has no finite increasing declared station interval.",
          },
        ],
      };
    const ends: AutoMovieViewOutline.IEnds = {};
    if (part.pole === "bottom" || part.pole === "both") ends.bottom = first;
    if (part.pole === "top" || part.pole === "both") ends.top = last;
    const original: IAutoMovieViewPart.IOutline[] = [
      part.front.positive,
      part.side.positive,
      part.front.negative,
      part.side.negative,
    ];
    const lateral: AutoMovieViewOutline.IOutline | null = curve(
      part.front.positive,
      ends,
      "front positive",
      diagnostics,
    );
    const medial: AutoMovieViewOutline.IOutline | null = curve(
      part.front.negative,
      ends,
      "front negative",
      diagnostics,
    );
    const ahead: AutoMovieViewOutline.IOutline | null = curve(
      part.side.positive,
      ends,
      "side positive",
      diagnostics,
    );
    const behind: AutoMovieViewOutline.IOutline | null = curve(
      part.side.negative,
      ends,
      "side negative",
      diagnostics,
    );
    const extents: Outlines | null =
      lateral === null || medial === null || ahead === null || behind === null
        ? null
        : [lateral, ahead, medial, behind];
    const fullness: IAutoMovieViewPart.IShoulder | IAutoMovieViewPart.ITop =
      part.fullness;
    let admitted: Fullness | null;
    if (fullness.kind === "top") {
      const shoulders: Outlines | null = group(
        fullness.shoulders,
        {},
        "top shoulder",
        diagnostics,
      );
      admitted = shoulders === null ? null : { kind: "top", shoulders };
    } else {
      const owner: AutoMovieViewOutline.IOutline | null = curve(
        fullness.shoulder,
        {},
        "shoulder",
        diagnostics,
      );
      const departures: Outlines | null =
        fullness.departures === undefined
          ? null
          : group(fullness.departures, {}, "departure", diagnostics);
      admitted =
        owner === null ||
        (fullness.departures !== undefined && departures === null)
          ? null
          : { kind: "shoulder", owner, departures };
    }
    if (extents === null || admitted === null)
      return { source: null, diagnostics };
    const tips: number[] = [ends.bottom, ends.top].filter(
      (s: number | undefined): s is number => s !== undefined,
    );
    const knots: number[] = original
      .flatMap((o: IAutoMovieViewPart.IOutline): number[] =>
        o.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station),
      )
      .filter((s: number): boolean => !tips.includes(s));
    const caps: Cap[] = part.stations.some(
      (s: number): boolean => !tips.includes(s),
    )
      ? tips.map((pole: number): Cap => {
          const near: number | null =
            knots.length === 0
              ? null
              : pole === first
                ? Math.min(...knots)
                : Math.max(...knots);
          return {
            pole,
            near,
            span: near === null ? null : Math.abs(near - pole),
          };
        })
      : [];
    return {
      source: {
        kind: "view",
        extents,
        fullness: admitted,
        domain: [first, last],
        caps,
      },
      diagnostics,
    };
  }
}

/** Preserve a curve's existing failure category and attach only its source identity. */
function curve(
  outline: IAutoMovieViewPart.IOutline,
  ends: AutoMovieViewOutline.IEnds,
  name: string,
  diagnostics: AutoMovieViewOutline.IFailure[],
): AutoMovieViewOutline.IOutline | null {
  const result: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create(outline, ends);
  if ("detail" in result) {
    diagnostics.push({
      contract: result.contract,
      detail: `${name}: ${result.detail}`,
    });
    return null;
  }
  return result;
}

/** Admit every independent quarter even when another quarter already failed. */
function group(
  outlines: readonly IAutoMovieViewPart.IOutline[],
  ends: AutoMovieViewOutline.IEnds,
  name: string,
  diagnostics: AutoMovieViewOutline.IFailure[],
): Outlines | null {
  const values: (AutoMovieViewOutline.IOutline | null)[] = outlines.map(
    (
      outline: IAutoMovieViewPart.IOutline,
      q: number,
    ): AutoMovieViewOutline.IOutline | null =>
      curve(outline, ends, `${name} ${q}`, diagnostics),
  );
  if (
    values.length !== 4 ||
    values.some(
      (value: AutoMovieViewOutline.IOutline | null): boolean => value === null,
    )
  )
    return null;
  return [values[0]!, values[1]!, values[2]!, values[3]!];
}
