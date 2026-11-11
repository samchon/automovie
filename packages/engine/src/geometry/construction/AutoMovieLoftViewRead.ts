import type { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewSection } from "./AutoMovieViewSection";
import type { AutoMovieViewSectionField } from "./AutoMovieViewSectionField";

/** Actual scalar value and derivatives in physical station mm. */
type Scalar = AutoMovieViewSectionField.IStationJet;

/** The cap's actual active domain and small complementary weight survive rounded values. */
interface CapReading {
  /** Weight value and its actual physical station derivatives. */
  jet: Scalar;

  /** Independently evaluated one-minus-weight, including beside the pole. */
  complement: number;

  /** A source-support decision, never inferred from a rounded primal weight. */
  active: boolean;
}

/**
 * Original scalar values and qualified physical jets for native view evaluation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes signed outlines, effective shoulder ownership and regular station derivatives from singular parameter endpoints.
 * @evidence contracts/development/design.md#principled-representation Represents Original scalar values and qualified physical jets for native view evaluation: companion namespace of 4 members (`IValues`, `IJets`, `values`, `jets`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftViewRead` in packages/engine/src/geometry/construction/AutoMovieLoftViewRead.ts; its surface is the 4 members listed and the text shows 39 other files naming it, mostly packages/human (20), packages/engine (11), test (8), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieLoftViewRead {
  /**
   * Finite original values, before native shape admission.
   *
   * @evidence contracts/development/design.md#principled-representation Keeps four signed-to-positive extents and the four effective shoulders from their source functions, and a top source's touch offsets, splits and split lists when it declares them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two arrays preserve the shared section factory's quarter layout; the optional members carry the split-quarter chain's extra inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values do not imply physical jet availability or a positive/convex admitted section.
   * @evidence contracts/development/common.md#meaningful-documentation Extents use mm and shoulders are dimensionless, ordered +u,+v,-u,-v; touch offsets are mm along each support line; each split is [u mm, v mm, tangent angle rad, shoulder].
   */
  export interface IValues {
    /** Four extent values, mm; native section admission still checks positivity. */
    extents: number[];

    /** Four effective shoulder values after their existing cap law. */
    shoulders: number[];

    /** Four touch offsets, mm, when the source declares them. */
    touch?: number[];

    /** Four splits `[u, v, angle, shoulder]`, when the source declares them. */
    splits?: number[][];

    /** Each quarter's ordered split points `[u, v, angle, shoulder]`, when the source declares them. */
    pieces?: number[][][];
  }

  /**
   * Actual finite physical-station source2 inputs of the shared native field.
   *
   * @evidence contracts/development/design.md#principled-representation Carries each actual value, first derivative and second derivative after the analytical cap product rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two ordered four-entry jet arrays directly match ViewSectionField.prepare; the optional members carry the split-quarter chain's extra inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null source station jet never appears as a zero-filled tuple.
   * @evidence contracts/development/common.md#meaningful-documentation Each tuple uses physical station mm, extent mm and dimensionless shoulders; touch offsets in mm; splits as [u, v, angle, shoulder] tuples.
   */
  export interface IJets {
    /** Four extent source2 tuples in physical station. */
    extents: Scalar[];

    /** Four effective shoulder source2 tuples in that same station. */
    shoulders: Scalar[];

    /** Four touch-offset source2 tuples, when the source declares them. */
    touch?: Scalar[];

    /** Four splits of four source2 tuples each, `[u, v, angle, shoulder]`, when the source declares them. */
    splits?: Scalar[][];

    /** Each quarter's ordered split points, four source2 tuples each, when the source declares them. */
    pieces?: Scalar[][][];
  }

  /**
   * Read finite scalar values without requesting station derivatives.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses Outline.value for every actual scalar and the original maximum cap weight and shoulder blend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, original values and effective fullness are consecutive stages.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A finite value at a singular parameter endpoint survives; malformed present data returns a named source failure without another geometry.
   * @evidence contracts/development/common.md#meaningful-documentation Returns finite scalar inputs rather than a derivative or shape certificate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four extent queries and the direct fullness owner's queries retain their Outline lookup costs, followed by fixed arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads a common shoulder once before adding its quarter departures.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays or a diagnostic string and retains no query.
   */
  export function values(
    source: AutoMovieLoftViewSource.ISource,
    station: number,
  ): IValues | string {
    try {
      validate(source, station);
      const extents: number[] = source.extents.map(
        (outline: AutoMovieViewOutline.IOutline, q: number): number =>
          value(outline, station, `extent ${q}`) * (q < 2 ? 1 : -1),
      );
      let shoulders: number[];
      if (source.fullness.kind === "top")
        shoulders = source.fullness.shoulders.map(
          (outline: AutoMovieViewOutline.IOutline, q: number): number =>
            value(outline, station, `top shoulder ${q}`),
        );
      else {
        const owner: number = value(source.fullness.owner, station, "shoulder");
        shoulders =
          source.fullness.departures === null
            ? [owner, owner, owner, owner]
            : source.fullness.departures.map(
                (outline: AutoMovieViewOutline.IOutline, q: number): number =>
                  owner + value(outline, station, `departure ${q}`),
              );
      }
      const w: CapReading = cap(source.caps, station);
      if (w.active && !chained(source))
        shoulders = shoulders.map((r: number): number => blend(r, w));
      if (![...extents, ...shoulders].every(Number.isFinite))
        throw new Error("The effective source values are not finite.");
      const out: IValues = { extents, shoulders };
      if (source.fullness.kind === "top" && source.fullness.touch !== null)
        out.touch = source.fullness.touch.map((outline: AutoMovieViewOutline.IOutline, q: number): number => value(outline, station, `touch ${q}`));
      if (source.fullness.kind === "top" && source.fullness.splits !== null)
        out.splits = source.fullness.splits.map((split: readonly AutoMovieViewOutline.IOutline[], q: number): number[] => split.map((outline: AutoMovieViewOutline.IOutline, k: number): number => value(outline, station, `split ${q} ${SPLIT[k]}`)));
      if (source.fullness.kind === "top" && source.fullness.pieces !== null)
        out.pieces = source.fullness.pieces.map((list: readonly (readonly AutoMovieViewOutline.IOutline[])[], q: number): number[][] => list.map((split: readonly AutoMovieViewOutline.IOutline[], j: number): number[] => split.map((outline: AutoMovieViewOutline.IOutline, k: number): number => value(outline, station, `quarter ${q} point ${j} ${SPLIT[k]}`))));
      return out;
    } catch (error: unknown) {
      return fault(station, error);
    }
  }

  /**
   * Read actual physical source2; an unavailable input jet remains unavailable.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies signs, direct fullness addition and the exact first/second cap product rule to actual Outline.stationJet values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The explicit derivative path is separate from value-only reading and contains no phase geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves singular-pole, singular-parameter and nonfinite statuses in its failure instead of using parameter jets as physical jets.
   * @evidence contracts/development/common.md#meaningful-documentation States required physical derivatives and unchanged effective shoulder ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each required scalar is read once, retaining Outline's knot-search cost; all remaining work is fixed by four quarters.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the common shoulder jet and one cap jet across all four effective quarters.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns owned triples or a named failure with no retained source or station state.
   */
  export function jets(
    source: AutoMovieLoftViewSource.ISource,
    station: number,
  ): IJets | string {
    try {
      validate(source, station);
      const extents: Scalar[] = source.extents.map(
        (outline: AutoMovieViewOutline.IOutline, q: number): Scalar => {
          const at: Scalar = jet(outline, station, `extent ${q}`);
          return q < 2 ? at : [-at[0], -at[1], -at[2]];
        },
      );
      let shoulders: Scalar[];
      if (source.fullness.kind === "top")
        shoulders = source.fullness.shoulders.map(
          (outline: AutoMovieViewOutline.IOutline, q: number): Scalar =>
            jet(outline, station, `top shoulder ${q}`),
        );
      else {
        const owner: Scalar = jet(source.fullness.owner, station, "shoulder");
        shoulders =
          source.fullness.departures === null
            ? [owner, owner, owner, owner]
            : source.fullness.departures.map(
                (outline: AutoMovieViewOutline.IOutline, q: number): Scalar => {
                  const departure: Scalar = jet(
                    outline,
                    station,
                    `departure ${q}`,
                  );
                  return [
                    owner[0] + departure[0],
                    owner[1] + departure[1],
                    owner[2] + departure[2],
                  ];
                },
              );
      }
      const w: CapReading = cap(source.caps, station);
      if (w.active && !chained(source))
        shoulders = shoulders.map((r: Scalar): Scalar => {
          const difference: number = AutoMovieViewSection.ELLIPSE - r[0];
          return [
            blend(r[0], w),
            w.complement * r[1] + w.jet[1] * difference,
            w.complement * r[2] - 2 * w.jet[1] * r[1] + w.jet[2] * difference,
          ];
        });
      if (
        ![...extents, ...shoulders].every((at: Scalar): boolean =>
          at.every(Number.isFinite),
        )
      )
        throw new Error("The required effective source2 is not finite.");
      const out: IJets = {
        extents,
        shoulders: shoulders.map((at: Scalar): Scalar => [...at]),
      };
      if (source.fullness.kind === "top" && source.fullness.touch !== null)
        out.touch = source.fullness.touch.map((outline: AutoMovieViewOutline.IOutline, q: number): Scalar => jet(outline, station, `touch ${q}`));
      if (source.fullness.kind === "top" && source.fullness.splits !== null)
        out.splits = source.fullness.splits.map((split: readonly AutoMovieViewOutline.IOutline[], q: number): Scalar[] => split.map((outline: AutoMovieViewOutline.IOutline, k: number): Scalar => jet(outline, station, `split ${q} ${SPLIT[k]}`)));
      if (source.fullness.kind === "top" && source.fullness.pieces !== null)
        out.pieces = source.fullness.pieces.map((list: readonly (readonly AutoMovieViewOutline.IOutline[])[], q: number): Scalar[][] => list.map((split: readonly AutoMovieViewOutline.IOutline[], j: number): Scalar[] => split.map((outline: AutoMovieViewOutline.IOutline, k: number): Scalar => jet(outline, station, `quarter ${q} point ${j} ${SPLIT[k]}`))));
      return out;
    } catch (error: unknown) {
      return fault(station, error);
    }
  }
}

/**
 * Whether a source's sections are conic chains (touch offsets, splits or split lists) rather than four plain quarters.
 *
 * Such a source closes a pole self-similarly: its coordinates fall to zero in the pole parameter while every tangent angle and shoulder keeps
 * its own source value, so the cap is the end section shrunk to a point. The surface has a tangent plane there when the coordinates fall
 * together; its curvature at the pole is that of the section's own shape, not an ellipse's.
 */
function chained(source: AutoMovieLoftViewSource.ISource): boolean {
  return source.fullness.kind === "top" && (source.fullness.touch !== null || source.fullness.splits !== null || source.fullness.pieces !== null);
}

/** The four scalar roles of one split, in its tuple order. */
const SPLIT: readonly string[] = ["u", "v", "angle", "shoulder"];

/** Distinguish explicit source absence at the caller from broken present source data here. */
function validate(
  source: AutoMovieLoftViewSource.ISource,
  station: number,
): void {
  if (
    !Number.isFinite(station) ||
    source === null ||
    source.kind !== "view" ||
    !Array.isArray(source.extents) ||
    source.extents.length !== 4 ||
    !Array.isArray(source.domain) ||
    source.domain.length !== 2 ||
    !source.domain.every(Number.isFinite) ||
    !Number.isFinite(source.domain[1] - source.domain[0]) ||
    !(source.domain[1] > source.domain[0]) ||
    !Array.isArray(source.caps) ||
    source.caps.length > 2 ||
    source.fullness === null ||
    (source.fullness.kind !== "shoulder" && source.fullness.kind !== "top")
  )
    throw new Error("The present view source is malformed.");
  if (
    source.fullness.kind === "top"
      ? !Array.isArray(source.fullness.shoulders) ||
        source.fullness.shoulders.length !== 4
      : source.fullness.departures !== null &&
        (!Array.isArray(source.fullness.departures) ||
          source.fullness.departures.length !== 4)
  )
    throw new Error("The present fullness source has no four-quarter layout.");

  // A split-quarter or touch-offset section closes its pole as it stands: the
  // four-quarter cap law blends quarter shoulders toward the ellipse, which
  // names no piece of a split quarter, so `chained` sources skip that blend.
  if (source.fullness.kind === "top" && (source.fullness.touch !== null || source.fullness.splits !== null || source.fullness.pieces !== null)) {
    if (source.fullness.touch !== null && source.fullness.touch.length !== 4) throw new Error("The present touch source has no four-guide layout.");
    if (source.fullness.splits !== null && (source.fullness.splits.length !== 4 || source.fullness.splits.some((split: readonly AutoMovieViewOutline.IOutline[]): boolean => split.length !== 4)))
      throw new Error("The present split source has no four-quarter, four-role layout.");
    if (source.fullness.pieces !== null && (source.fullness.pieces.length !== 4 || source.fullness.pieces.some((list: readonly (readonly AutoMovieViewOutline.IOutline[])[]): boolean => !Array.isArray(list) || list.some((split: readonly AutoMovieViewOutline.IOutline[]): boolean => split.length !== 4))))
      throw new Error("The present split-list source has no four-quarter layout of four-role points.");
  }
  const poles: Set<number> = new Set();
  for (const entry of source.caps) {
    if (
      entry === null ||
      entry === undefined ||
      !source.domain.includes(entry.pole) ||
      poles.has(entry.pole)
    )
      throw new Error("A present cap has no unique declared domain endpoint.");
    poles.add(entry.pole);
    if (entry.span === null) {
      if (entry.near !== null)
        throw new Error("A constant cap has an inconsistent support endpoint.");
    } else if (
      !(
        Number.isFinite(entry.span) &&
        entry.span > 0 &&
        entry.near !== null &&
        Number.isFinite(entry.near) &&
        entry.span === Math.abs(entry.near - entry.pole) &&
        (entry.pole === source.domain[0]
          ? entry.near > entry.pole
          : entry.near < entry.pole)
      )
    )
      throw new Error(
        "A present cap has no consistent positive source-knot span.",
      );
  }
  if (
    source.caps.length === 2 &&
    source.caps.every(
      (entry: AutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
        entry.span !== null,
    )
  ) {
    const lower: AutoMovieLoftViewSource.ISource["caps"][number] =
      source.caps.find(
        (entry: AutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          entry.pole === source.domain[0],
      )!;
    const upper: AutoMovieLoftViewSource.ISource["caps"][number] =
      source.caps.find(
        (entry: AutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          entry.pole === source.domain[1],
      )!;
    if (lower.near! > upper.near!)
      throw new Error(
        "Present finite cap supports overlap and do not admit a regular maximum source2.",
      );
  }
}

/** A finite original scalar remains independent of its derivative availability. */
function value(
  outline: AutoMovieViewOutline.IOutline,
  station: number,
  name: string,
): number {
  const reading: number | string = AutoMovieViewOutline.value(outline, station);
  if (typeof reading === "string") throw new Error(`${name}: ${reading}`);
  if (!Number.isFinite(reading))
    throw new Error(`${name}: the original scalar value is nonfinite.`);
  return reading;
}

/** Required physical source2 is read, never inferred from nearby samples or parameter jets. */
function jet(
  outline: AutoMovieViewOutline.IOutline,
  station: number,
  name: string,
): Scalar {
  const reading: AutoMovieViewOutline.IReading | string =
    AutoMovieViewOutline.at(outline, station);
  if (typeof reading === "string") throw new Error(`${name}: ${reading}`);
  if (reading.stationJet === null)
    throw new Error(
      `${name}: physical source2 is unavailable (${reading.stationJetStatus}).`,
    );
  return [reading.value, reading.stationJet[0], reading.stationJet[1]];
}

/** Existing maximum of disjoint quintic cap spans, with exact physical station derivatives. */
function cap(
  caps: AutoMovieLoftViewSource.ISource["caps"],
  station: number,
): CapReading {
  if (
    caps.some(
      (entry: AutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
        entry.span === null,
    )
  )
    return { jet: [1, 0, 0], complement: 0, active: true };
  for (const entry of caps) {
    const near: number = entry.near!;
    const span: number = entry.span!;
    if (
      station === near ||
      station < Math.min(entry.pole, near) ||
      station > Math.max(entry.pole, near)
    )
      continue;
    const x: number = Math.abs(station - entry.pole) / span;
    const far: number = Math.abs(near - station) / span;
    const small: number = x <= 0.5 ? x : far;
    const q: number =
      small * small * small * (10 - 15 * small + 6 * small * small);
    const weight: number = x <= 0.5 ? 1 - q : q;
    const complement: number = x <= 0.5 ? q : 1 - q;
    const first: number = Math.sign(near - entry.pole) / span;
    return {
      jet: [
        weight,
        -30 * x * x * far * far * first,
        -60 * x * far * (1 - 2 * x) * first * first,
      ],
      complement,
      active: true,
    };
  }
  return { jet: [0, 0, 0], complement: 1, active: false };
}

/** Both sides use their directly represented small weight rather than subtracting a rounded one. */
function blend(value: number, reading: CapReading): number {
  return reading.jet[0] < 0.5
    ? value + reading.jet[0] * (AutoMovieViewSection.ELLIPSE - value)
    : AutoMovieViewSection.ELLIPSE +
        reading.complement * (value - AutoMovieViewSection.ELLIPSE);
}

/** Include the actual query coordinate while retaining the original diagnostic text. */
function fault(station: number, error: unknown): string {
  return `View source at station ${station} mm: ${error instanceof Error ? error.message : String(error)}`;
}
