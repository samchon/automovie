import type {
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewOutline,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewSection } from "./AutoMovieViewSection";

/**
 * The cap's actual active domain and small complementary weight survive rounded
 * values.
 */
interface CapReading {
  /** Weight value and its actual physical station derivatives. */
  jet: IAutoMovieViewSectionField.IStationJet;

  /** Independently evaluated one-minus-weight, including beside the pole. */
  complement: number;

  /** A source-support decision, never inferred from a rounded primal weight. */
  active: boolean;
}

/**
 * Original scalar values and qualified physical jets for native view
 * evaluation.
 */
export namespace AutoMovieLoftViewRead {
  /** Read finite scalar values without requesting station derivatives. */
  export function values(
    source: IAutoMovieLoftViewSource.ISource,
    station: number,
  ): IAutoMovieLoftViewRead.IValues | string {
    try {
      validate(source);
      const extents: number[] = source.extents.map(
        (outline: IAutoMovieViewOutline.IOutline, q: number): number =>
          value(outline, station, `extent ${q}`) * (q < 2 ? 1 : -1),
      );
      let shoulders: number[];
      if (source.fullness.kind === "top")
        shoulders = source.fullness.shoulders.map(
          (outline: IAutoMovieViewOutline.IOutline, q: number): number =>
            value(outline, station, `top shoulder ${q}`),
        );
      else {
        const owner: number = value(source.fullness.owner, station, "shoulder");
        shoulders =
          source.fullness.departures === null
            ? [owner, owner, owner, owner]
            : source.fullness.departures.map(
                (outline: IAutoMovieViewOutline.IOutline, q: number): number =>
                  owner + value(outline, station, `departure ${q}`),
              );
      }
      const w: CapReading = cap(source.caps, station);
      if (w.active && !chained(source))
        shoulders = shoulders.map((r: number): number => blend(r, w));
      const out: IAutoMovieLoftViewRead.IValues = { extents, shoulders };
      if (source.fullness.kind === "top" && source.fullness.touch !== null)
        out.touch = source.fullness.touch.map(
          (outline: IAutoMovieViewOutline.IOutline, q: number): number =>
            value(outline, station, `touch ${q}`),
        );
      if (source.fullness.kind === "top" && source.fullness.splits !== null)
        out.splits = source.fullness.splits.map(
          (
            split: readonly IAutoMovieViewOutline.IOutline[],
            q: number,
          ): number[] =>
            split.map(
              (outline: IAutoMovieViewOutline.IOutline, k: number): number =>
                value(outline, station, `split ${q} ${SPLIT[k]}`),
            ),
        );
      if (source.fullness.kind === "top" && source.fullness.pieces !== null)
        out.pieces = source.fullness.pieces.map(
          (
            list: readonly (readonly IAutoMovieViewOutline.IOutline[])[],
            q: number,
          ): number[][] =>
            list.map(
              (
                split: readonly IAutoMovieViewOutline.IOutline[],
                j: number,
              ): number[] =>
                split.map(
                  (
                    outline: IAutoMovieViewOutline.IOutline,
                    k: number,
                  ): number =>
                    value(
                      outline,
                      station,
                      `quarter ${q} point ${j} ${SPLIT[k]}`,
                    ),
                ),
            ),
        );
      return out;
    } catch (error: unknown) {
      return fault(station, error);
    }
  }

  /** Read actual physical source2; an unavailable input jet remains unavailable. */
  export function jets(
    source: IAutoMovieLoftViewSource.ISource,
    station: number,
  ): IAutoMovieLoftViewRead.IJets | string {
    try {
      validate(source);
      const extents: IAutoMovieViewSectionField.IStationJet[] =
        source.extents.map(
          (
            outline: IAutoMovieViewOutline.IOutline,
            q: number,
          ): IAutoMovieViewSectionField.IStationJet => {
            const at: IAutoMovieViewSectionField.IStationJet = jet(
              outline,
              station,
              `extent ${q}`,
            );
            return q < 2 ? at : [-at[0], -at[1], -at[2]];
          },
        );
      let shoulders: IAutoMovieViewSectionField.IStationJet[];
      if (source.fullness.kind === "top")
        shoulders = source.fullness.shoulders.map(
          (
            outline: IAutoMovieViewOutline.IOutline,
            q: number,
          ): IAutoMovieViewSectionField.IStationJet =>
            jet(outline, station, `top shoulder ${q}`),
        );
      else {
        const owner: IAutoMovieViewSectionField.IStationJet = jet(
          source.fullness.owner,
          station,
          "shoulder",
        );
        shoulders =
          source.fullness.departures === null
            ? [owner, owner, owner, owner]
            : source.fullness.departures.map(
                (
                  outline: IAutoMovieViewOutline.IOutline,
                  q: number,
                ): IAutoMovieViewSectionField.IStationJet => {
                  const departure: IAutoMovieViewSectionField.IStationJet = jet(
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
        shoulders = shoulders.map(
          (
            r: IAutoMovieViewSectionField.IStationJet,
          ): IAutoMovieViewSectionField.IStationJet => {
            const difference: number = AutoMovieViewSection.ELLIPSE - r[0];
            return [
              blend(r[0], w),
              w.complement * r[1] + w.jet[1] * difference,
              w.complement * r[2] - 2 * w.jet[1] * r[1] + w.jet[2] * difference,
            ];
          },
        );
      const out: IAutoMovieLoftViewRead.IJets = {
        extents,
        shoulders: shoulders.map(
          (
            at: IAutoMovieViewSectionField.IStationJet,
          ): IAutoMovieViewSectionField.IStationJet => [...at],
        ),
      };
      if (source.fullness.kind === "top" && source.fullness.touch !== null)
        out.touch = source.fullness.touch.map(
          (
            outline: IAutoMovieViewOutline.IOutline,
            q: number,
          ): IAutoMovieViewSectionField.IStationJet =>
            jet(outline, station, `touch ${q}`),
        );
      if (source.fullness.kind === "top" && source.fullness.splits !== null)
        out.splits = source.fullness.splits.map(
          (
            split: readonly IAutoMovieViewOutline.IOutline[],
            q: number,
          ): IAutoMovieViewSectionField.IStationJet[] =>
            split.map(
              (
                outline: IAutoMovieViewOutline.IOutline,
                k: number,
              ): IAutoMovieViewSectionField.IStationJet =>
                jet(outline, station, `split ${q} ${SPLIT[k]}`),
            ),
        );
      if (source.fullness.kind === "top" && source.fullness.pieces !== null)
        out.pieces = source.fullness.pieces.map(
          (
            list: readonly (readonly IAutoMovieViewOutline.IOutline[])[],
            q: number,
          ): IAutoMovieViewSectionField.IStationJet[][] =>
            list.map(
              (
                split: readonly IAutoMovieViewOutline.IOutline[],
                j: number,
              ): IAutoMovieViewSectionField.IStationJet[] =>
                split.map(
                  (
                    outline: IAutoMovieViewOutline.IOutline,
                    k: number,
                  ): IAutoMovieViewSectionField.IStationJet =>
                    jet(
                      outline,
                      station,
                      `quarter ${q} point ${j} ${SPLIT[k]}`,
                    ),
                ),
            ),
        );
      return out;
    } catch (error: unknown) {
      return fault(station, error);
    }
  }
}

/**
 * Whether a source's sections are conic chains (touch offsets, splits or split
 * lists) rather than four plain quarters.
 *
 * Such a source closes a pole self-similarly: its coordinates fall to zero in
 * the pole parameter while every tangent angle and shoulder keeps its own
 * source value, so the cap is the end section shrunk to a point. The surface
 * has a tangent plane there when the coordinates fall together; its curvature
 * at the pole is that of the section's own shape, not an ellipse's.
 */
function chained(source: IAutoMovieLoftViewSource.ISource): boolean {
  return (
    source.fullness.kind === "top" &&
    (source.fullness.touch !== null ||
      source.fullness.splits !== null ||
      source.fullness.pieces !== null)
  );
}

/** The four scalar roles of one split, in its tuple order. */
const SPLIT: readonly string[] = ["u", "v", "angle", "shoulder"];

/**
 * Distinguish explicit source absence at the caller from broken present source
 * data here.
 */
function validate(source: IAutoMovieLoftViewSource.ISource): void {
  structure(source);
}

/** Refuse a malformed source or station by the rule it breaks. */
function structure(source: IAutoMovieLoftViewSource.ISource): void {
  if (
    source.extents.length !== 4 ||
    source.domain.length !== 2 ||
    !(source.domain[1] > source.domain[0]) ||
    source.caps.length > 2
  )
    throw new Error("The present view source is malformed.");
  if (
    source.fullness.kind === "top"
      ? source.fullness.shoulders.length !== 4
      : source.fullness.departures !== null &&
        source.fullness.departures.length !== 4
  )
    throw new Error("The present fullness source has no four-quarter layout.");

  // A split-quarter or touch-offset section closes its pole as it stands: the
  // four-quarter cap law blends quarter shoulders toward the ellipse, which
  // names no piece of a split quarter, so `chained` sources skip that blend.
  if (
    source.fullness.kind === "top" &&
    (source.fullness.touch !== null ||
      source.fullness.splits !== null ||
      source.fullness.pieces !== null)
  ) {
    if (source.fullness.touch !== null && source.fullness.touch.length !== 4)
      throw new Error("The present touch source has no four-guide layout.");
    if (
      source.fullness.splits !== null &&
      (source.fullness.splits.length !== 4 ||
        source.fullness.splits.some(
          (split: readonly IAutoMovieViewOutline.IOutline[]): boolean =>
            split.length !== 4,
        ))
    )
      throw new Error(
        "The present split source has no four-quarter, four-role layout.",
      );
    if (
      source.fullness.pieces !== null &&
      (source.fullness.pieces.length !== 4 ||
        source.fullness.pieces.some(
          (
            list: readonly (readonly IAutoMovieViewOutline.IOutline[])[],
          ): boolean =>
            list.some(
              (split: readonly IAutoMovieViewOutline.IOutline[]): boolean =>
                split.length !== 4,
            ),
        ))
    )
      throw new Error(
        "The present split-list source has no four-quarter layout of four-role points.",
      );
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
        entry.span > 0 &&
        entry.near !== null &&
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
      (entry: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
        entry.span !== null,
    )
  ) {
    const lower: IAutoMovieLoftViewSource.ISource["caps"][number] =
      source.caps.find(
        (entry: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
          entry.pole === source.domain[0],
      )!;
    const upper: IAutoMovieLoftViewSource.ISource["caps"][number] =
      source.caps.find(
        (entry: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
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
  outline: IAutoMovieViewOutline.IOutline,
  station: number,
  name: string,
): number {
  const reading: number | string = AutoMovieViewOutline.value(outline, station);
  if (typeof reading === "string") throw new Error(`${name}: ${reading}`);
  return reading;
}

/**
 * Required physical source2 is read, never inferred from nearby samples or
 * parameter jets.
 */
function jet(
  outline: IAutoMovieViewOutline.IOutline,
  station: number,
  name: string,
): IAutoMovieViewSectionField.IStationJet {
  const reading: IAutoMovieViewOutline.IReading | string =
    AutoMovieViewOutline.at(outline, station);
  if (typeof reading === "string") throw new Error(`${name}: ${reading}`);
  if (reading.stationJet === null)
    throw new Error(
      `${name}: physical source2 is unavailable (${reading.stationJetStatus}).`,
    );
  return [reading.value, reading.stationJet[0], reading.stationJet[1]];
}

/**
 * Existing maximum of disjoint quintic cap spans, with exact physical station
 * derivatives.
 */
function cap(
  caps: IAutoMovieLoftViewSource.ISource["caps"],
  station: number,
): CapReading {
  if (
    caps.some(
      (entry: IAutoMovieLoftViewSource.ISource["caps"][number]): boolean =>
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

/**
 * Both sides use their directly represented small weight rather than
 * subtracting a rounded one.
 */
function blend(value: number, reading: CapReading): number {
  return reading.jet[0] < 0.5
    ? value + reading.jet[0] * (AutoMovieViewSection.ELLIPSE - value)
    : AutoMovieViewSection.ELLIPSE +
        reading.complement * (value - AutoMovieViewSection.ELLIPSE);
}

/**
 * Include the actual query coordinate while retaining the original diagnostic
 * text.
 */
function fault(station: number, error: unknown): string {
  return `View source at station ${station} mm: ${error instanceof Error ? error.message : String(error)}`;
}
