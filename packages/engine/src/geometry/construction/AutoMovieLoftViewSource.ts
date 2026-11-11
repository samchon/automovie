import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Four signed original outlines in +u,+v,-u,-v order. */
type Outlines = readonly [
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
];

/** One admitted split point's sources: point u, point v, tangent angle, the shoulder of the piece it starts. */
type Split = readonly [
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
  AutoMovieViewOutline.IOutline,
];

/** Existing direct fullness ownership, after scalar source admission; `touch`, `splits` and `pieces` are null when the part declares none. */
type Fullness =
  | {
      kind: "shoulder";
      owner: AutoMovieViewOutline.IOutline;
      departures: Outlines | null;
    }
  | { kind: "top"; shoulders: Outlines; touch: Outlines | null; splits: readonly [Split, Split, Split, Split] | null; pieces: readonly [readonly Split[], readonly Split[], readonly Split[], readonly Split[]] | null };

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
 * @evidence contracts/development/common.md#meaningful-documentation States signed quarter order, source ownership, cap spans and absent girth support.
 * @evidence contracts/development/design.md#principled-representation Represents Original scalar preparation retained for a direct view-generated field: companion namespace of 4 members (`IInput`, `ISource`, `IResult`, `create`); units and frames named in its text: frame, frames. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftViewSource` in packages/engine/src/geometry/construction/AutoMovieLoftViewSource.ts; its surface is the 4 members listed and the text shows 34 other files naming it, mostly packages/human (22), packages/engine (7), test (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftViewSource {
  /**
   * Borrowed original scalar/domain data, without a completed part or frame.
   *
   * @evidence contracts/development/design.md#principled-representation Picks exactly the original fields create reads: physical station bounds, signed scalar parameters, direct fullness and pole declarations. Existing full parts and the shared scalar-control producer supply the same values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Separates native scalar preparation from anatomical frames, names, display density and part publication, which this factory never reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Changes no runtime access order, numeric admission, derivative availability or failed-source meaning; omitted metadata never substitutes geometry.
   * @evidence contracts/development/common.md#meaningful-documentation The borrowed fields retain IAutoMovieViewPart's calibration-mm stations, signed chart units, normalized scalar jets and cap semantics; producers keep them immutable during use.
   */
  export type IInput = Pick<
    IAutoMovieViewPart,
    "stations" | "front" | "side" | "fullness" | "pole"
  >;

  /**
   * Value-copyable original scalar definition of a direct view field.
   *
   * @evidence contracts/development/design.md#principled-representation Explicit prepared sources retain their actual interpolation parameters, scalar jets and cap law.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four extremes, one direct fullness owner and cap records determine a station's inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No emitted row or object-registration identity selects the scalar geometry.
   * @evidence contracts/development/common.md#meaningful-documentation Members give quarter signs, physical station units and the cap's constant case.
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
   * @evidence contracts/development/design.md#principled-representation Separates original source admission failures from an available field definition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One nullable source and its collected diagnostics avoid partial hidden success.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Failed curves are never replaced by another curve or a zero derivative.
   * @evidence contracts/development/common.md#meaningful-documentation States diagnostic ownership and the null-source meaning.
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
   * @evidence contracts/development/implementation.md#principled-implementation Uses original signed outlines and the existing pole parameter, while direct fullness retains its own scalar parameter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive ownership branch follows shared curve admission and cap preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Collects all independent failures without sorting or changing inputs; no incomplete girth derivative provider is attached, and a part declaring both one split and a split list per quarter is refused rather than one of them dropped.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes explicit generic-girth absence from a failed direct source and states immutable borrowed input.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear original-outline preparation plus fixed end/quarter traversal; no native phase inverse or girth solve occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each admitted scalar spline is retained once for subsequent station reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns copied scalar preparations and cap metadata; inputs and temporary arrays are not globally retained.
   */
  export function create(part: IInput): IResult | null {
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
      // A touch offset and a split's point are chart coordinates of the section like the extents, so at a pole they close in the same pole
      // parameter and every coordinate of a cap section falls together; an angle or a shoulder is no length and keeps its own parameter.
      const touch: Outlines | null = fullness.touch === undefined ? null : group(fullness.touch, ends, "touch", diagnostics);
      const admit = (split: IAutoMovieViewPart.ISplit, name: string): Split | null => {
        const parts: (AutoMovieViewOutline.IOutline | null)[] = [curve(split.u, ends, `${name} u`, diagnostics), curve(split.v, ends, `${name} v`, diagnostics), curve(split.angle, {}, `${name} angle`, diagnostics), curve(split.shoulder, {}, `${name} shoulder`, diagnostics)];
        return parts.some((p: AutoMovieViewOutline.IOutline | null): boolean => p === null) ? null : [parts[0]!, parts[1]!, parts[2]!, parts[3]!];
      };
      const splits: (Split | null)[] | null = fullness.splits === undefined ? null : fullness.splits.map((split: IAutoMovieViewPart.ISplit, q: number): Split | null => admit(split, `split ${q}`));
      const pieces: (Split | null)[][] | null = fullness.pieces === undefined ? null : fullness.pieces.map((list: IAutoMovieViewPart.ISplit[], q: number): (Split | null)[] => list.map((split: IAutoMovieViewPart.ISplit, j: number): Split | null => admit(split, `quarter ${q} point ${j}`)));
      const both: boolean = fullness.splits !== undefined && fullness.pieces !== undefined;
      if (both) diagnostics.push({ contract: "outline", detail: "A top fullness declares both one split per quarter and a split list per quarter; it declares one of them." });
      const failed: boolean =
        both ||
        shoulders === null ||
        (fullness.touch !== undefined && touch === null) ||
        (splits !== null && splits.some((s: Split | null): boolean => s === null)) ||
        (pieces !== null && (pieces.length !== 4 || pieces.some((list: (Split | null)[]): boolean => list.some((s: Split | null): boolean => s === null))));
      admitted = failed
        ? null
        : {
            kind: "top",
            shoulders: shoulders!,
            touch,
            splits: splits === null ? null : [splits[0]!, splits[1]!, splits[2]!, splits[3]!],
            pieces: pieces === null ? null : [pieces[0] as Split[], pieces[1] as Split[], pieces[2] as Split[], pieces[3] as Split[]],
          };
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
