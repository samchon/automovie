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
 * @evidence contracts/common.md#principled-implementation Reads the actual prepared scalar owners and differentiates their existing cap product analytically in the same physical station coordinate.
 * @evidence contracts/common.md#clear-and-simple-design Value-only and physical-second-order reads have separate APIs and share only the actual cap law.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Value admission never requests a physical jet; unavailable derivatives produce a named failure rather than invented zeros or a legacy curve.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes signed outlines, effective shoulder ownership and regular station derivatives from singular parameter endpoints.
 * @evidence contracts/performance.md#efficient-algorithms One scalar query per original source precedes fixed four-quarter and at-most-two-cap arithmetic; no world frame, layer traversal, native inverse or girth solve occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work The common shoulder is read once and shared by its four departures; source preparation remains producer-owned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh scalar arrays and failures belong to the caller; no station, phase or source cache is retained.
 */
export namespace AutoMovieLoftViewRead {
  /**
   * Finite original values, before native shape admission.
   *
   * @evidence contracts/common.md#principled-implementation Keeps four signed-to-positive extents and the four effective shoulders from their source functions.
   * @evidence contracts/common.md#clear-and-simple-design Two arrays preserve the shared section factory's quarter layout.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Values do not imply physical jet availability or a positive/convex admitted section.
   * @evidence contracts/common.md#meaningful-documentation Extents use mm and shoulders are dimensionless, ordered +u,+v,-u,-v.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reader owns query reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns two fresh four-entry arrays.
   */
  export interface IValues {
    /** Four extent values, mm; native section admission still checks positivity. */
    extents: number[];

    /** Four effective shoulder values after their existing cap law. */
    shoulders: number[];
  }

  /**
   * Actual finite physical-station source2 inputs of the shared native field.
   *
   * @evidence contracts/common.md#principled-implementation Carries each actual value, first derivative and second derivative after the analytical cap product rule.
   * @evidence contracts/common.md#clear-and-simple-design Two ordered four-entry jet arrays directly match ViewSectionField.prepare.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A null source station jet never appears as a zero-filled tuple.
   * @evidence contracts/common.md#meaningful-documentation Each tuple uses physical station mm, extent mm and dimensionless shoulders.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its producer owns scalar query reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns eight fixed tuples with no borrowed mutable output.
   */
  export interface IJets {
    /** Four extent source2 tuples in physical station. */
    extents: Scalar[];

    /** Four effective shoulder source2 tuples in that same station. */
    shoulders: Scalar[];
  }

  /**
   * Read finite scalar values without requesting station derivatives.
   *
   * @evidence contracts/common.md#principled-implementation Uses Outline.value for every actual scalar and the original maximum cap weight and shoulder blend.
   * @evidence contracts/common.md#clear-and-simple-design Admission, original values and effective fullness are consecutive stages.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A finite value at a singular parameter endpoint survives; malformed present data returns a named source failure without another geometry.
   * @evidence contracts/common.md#meaningful-documentation Returns finite scalar inputs rather than a derivative or shape certificate.
   * @evidence contracts/performance.md#efficient-algorithms Four extent queries and the direct fullness owner's queries retain their Outline lookup costs, followed by fixed arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads a common shoulder once before adding its quarter departures.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh arrays or a diagnostic string and retains no query.
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
      if (w.active)
        shoulders = shoulders.map((r: number): number => blend(r, w));
      if (![...extents, ...shoulders].every(Number.isFinite))
        throw new Error("The effective source values are not finite.");
      return { extents, shoulders };
    } catch (error: unknown) {
      return fault(station, error);
    }
  }

  /**
   * Read actual physical source2; an unavailable input jet remains unavailable.
   *
   * @evidence contracts/common.md#principled-implementation Applies signs, direct fullness addition and the exact first/second cap product rule to actual Outline.stationJet values.
   * @evidence contracts/common.md#clear-and-simple-design The explicit derivative path is separate from value-only reading and contains no phase geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves singular-pole, singular-parameter and nonfinite statuses in its failure instead of using parameter jets as physical jets.
   * @evidence contracts/common.md#meaningful-documentation States required physical derivatives and unchanged effective shoulder ownership.
   * @evidence contracts/performance.md#efficient-algorithms Each required scalar is read once, retaining Outline's knot-search cost; all remaining work is fixed by four quarters.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the common shoulder jet and one cap jet across all four effective quarters.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned triples or a named failure with no retained source or station state.
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
      if (w.active)
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
      return {
        extents,
        shoulders: shoulders.map((at: Scalar): Scalar => [...at]),
      };
    } catch (error: unknown) {
      return fault(station, error);
    }
  }
}

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
