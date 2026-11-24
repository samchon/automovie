import { AutoMovieSolidVector, bracketedRoot } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNail,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanCourseRuns } from "../conic/AutoMovieHumanCourseRuns";

/**
 * The measured skin grid and its display sampling, shared by both digit
 * sources.
 */
export namespace AutoMovieHumanDigitNailSkin {
  /** The skin net's chart station step in mm, phase count. */
  const SKIN: { station: number; phases: number } = {
    station: 0.25,
    phases: 360,
  };

  /**
   * Invert the physical opening in the same chart, retaining its exact first
   * station.
   */
  export function aperture(
    name: string,
    [from, end]: readonly [number, number],
    opening: number,
    physical?: (station: number) => number,
  ): number {
    let first: number = Math.max(from, opening);
    if (
      physical !== undefined &&
      physical !== AutoMovieHumanCourseRuns.identity
    ) {
      if (opening <= physical(from)) first = from;
      else if (opening < physical(end))
        first = bracketedRoot(
          (station): number => physical(station) - opening,
          from,
          end,
          1e-9,
        );
      else first = end;
    }
    if (!(first < end))
      throw new Error("nail: " + name + " aperture is past the skin's tip");
    return first;
  }

  /** Read the proximal ridge and lateral reach at the shared material edge. */
  export function measuredGroove(
    rows: NonNullable<IAutoMovieHumanNail.ISetup["groove"]>,
    frame: IAutoMovieHumanNail.IFrame,
    clipping: number,
  ): { fold: number | null; side: number | null } {
    const { cross, sub, scale, add, dot } = AutoMovieSolidVector;
    const lateral: AutoMovieVector3Tuple = cross(frame.distal, frame.dorsal);
    const proximal: number[] = [],
      aside: number[] = [];
    for (const {
      edge: [a, b],
      skin,
    } of rows) {
      const reach: AutoMovieVector3Tuple = sub(skin, scale(add(a, b), 0.5));
      const along: number = dot(reach, frame.distal),
        across: number = Math.abs(dot(reach, lateral));
      const dorsal: number = dot(reach, frame.dorsal);
      if (across > Math.abs(along)) aside.push(across);
      else if (along < 0 && dorsal > clipping) proximal.push(dorsal);
    }
    const median = (values: number[]): number | null => {
      if (values.length === 0) return null;
      values.sort((a, b): number => a - b);
      return (
        (values[Math.floor((values.length - 1) / 2)]! +
          values[Math.floor(values.length / 2)]!) /
        2
      );
    };
    return { fold: median(proximal), side: median(aside) };
  }

  /**
   * Sample the original field on the existing nail grid from the fitted
   * aperture.
   */
  export function net(
    surface: IAutoMovieLoftViewFullSource.IReader,
    first: number,
  ): IAutoMovieHumanNail.ISkin {
    const [from, end]: readonly [number, number] = surface.domain;
    // The bilinear net keeps its uniform chart pitch. In the ordinary arclength chart a 0.25 mm chord on a 5 mm radius
    // stands about 2 micrometres off the skin. Native length transport can change the net's physical spacing.
    const rows: number = Math.ceil((end - first) / SKIN.station) + 1;
    const pitch: number = (end - first) / (rows - 1);
    const ring = (station: number): AutoMovieVector3Tuple[] => {
      const pointAt = surface.pointAt(station);
      return Array.from(
        { length: SKIN.phases },
        (_: unknown, j: number): AutoMovieVector3Tuple =>
          pointAt((2 * Math.PI * j) / SKIN.phases),
      );
    };
    const net: AutoMovieVector3Tuple[][] = Array.from(
      { length: rows },
      (_: unknown, i: number): AutoMovieVector3Tuple[] =>
        ring(i === rows - 1 ? end : first + pitch * i),
    );

    // Keep the fitted chart itself. The bed may also use the original owning
    // skin between the actual first ring and this chart's first ring.
    const leading: number = Math.ceil((first - from) / SKIN.station);
    const leadPitch: number = leading === 0 ? 0 : (first - from) / leading;
    const proximal: NonNullable<IAutoMovieHumanNail.ISkin["proximal"]> =
      Array.from({ length: leading }, (_, i: number) => {
        const station: number = from + leadPitch * i;
        return { station, ring: ring(station) };
      });
    const point = (station: number, phase: number): readonly number[] => {
      const behind: boolean = leading !== 0 && station < first;
      const rowCount: number = behind ? leading + 1 : rows;
      const a: number = Math.max(
        0,
        Math.min(
          rowCount - 1,
          behind ? (station - from) / leadPitch : (station - first) / pitch,
        ),
      );
      const i: number = Math.min(rowCount - 2, Math.floor(a));
      const turn: number = phase / (2 * Math.PI);
      const b: number = (turn - Math.floor(turn)) * SKIN.phases;
      const j: number = Math.floor(b) % SKIN.phases;
      const [s, t]: [number, number] = [a - i, b - Math.floor(b)];
      const at: readonly AutoMovieVector3Tuple[] = behind
        ? proximal[i]!.ring
        : net[i]!;
      const next: readonly AutoMovieVector3Tuple[] = behind
        ? i + 1 === leading
          ? net[0]!
          : proximal[i + 1]!.ring
        : net[i + 1]!;
      const [p, q, r, w]: number[][] = [
        at[j]!,
        at[(j + 1) % SKIN.phases]!,
        next[j]!,
        next[(j + 1) % SKIN.phases]!,
      ];
      return [0, 1, 2].map(
        (k: number): number =>
          (1 - s) * ((1 - t) * p![k]! + t * q![k]!) +
          s * ((1 - t) * r![k]! + t * w![k]!),
      );
    };
    return { point, first, tip: end, grid: net, proximal };
  }

  /**
   * Insert only display samples inside existing intervals, preserving endpoints
   * exactly.
   */
  function refined(
    stations: readonly number[],
    step: (from: number, to: number) => number,
  ): number[] {
    return stations.flatMap((to: number, i: number): number[] => {
      if (i === 0) return [to];
      const from: number = stations[i - 1]!;
      const cuts: number = Math.max(1, Math.ceil((to - from) / step(from, to)));
      return Array.from({ length: cuts }, (_: unknown, k: number): number =>
        k + 1 === cuts ? to : from + ((to - from) * (k + 1)) / cuts,
      );
    });
  }

  /**
   * Add reliefs and their display rows to the existing positioned digit.
   *
   * The direct view field reads its own outline knots. Its axial and phase
   * display rows carry no shape authority. Original cap rows stay in the list
   * and additional rows split their intervals where a relief needs them.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Only the sampling lists and reliefs change on the original direct view part.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Splits existing station intervals at the finest intersecting relief's row pitch and delegates angular turn sampling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original axis, scalar controls, closure and native material authority. Adds no replacement source or tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over original station intervals and bounded relief windows before the existing angular sampler.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The source that drove the fit retains every generating definition at emission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows immutable source data and allocates only feature and display lists.
   * @evidence contracts/development/common.md#meaningful-documentation Names the two display clocks and their independence from the original cap and scalar controls.
   */
  export function addReliefs(
    original: IAutoMovieViewPart,
    family: Pick<
      IAutoMovieHumanConicLoft.IFamily,
      "pitch" | "phase" | "turn" | "tips"
    >,
    added: readonly IAutoMovieLoftRelief[],
  ): IAutoMovieViewPart {
    const reliefs: IAutoMovieLoftRelief[] = [
      ...(original.reliefs ?? []),
      ...added,
    ];
    const stations: number[] = refined(
      original.stations,
      (from: number, to: number): number =>
        Math.min(
          Infinity,
          ...added
            .filter(
              (relief: IAutoMovieLoftRelief): boolean =>
                relief.stations[0] < to && relief.stations[1] > from,
            )
            .map(
              (relief: IAutoMovieLoftRelief): number =>
                (relief.stations[1] - relief.stations[0]) / (relief.rows - 3),
            ),
        ),
    );
    const sampling: Pick<
      IAutoMovieHumanConicLoft.IFamily,
      "pitch" | "phase" | "turn" | "reliefs"
    > = { ...family, reliefs };
    const samples: number =
      original.phases?.length ??
      Math.max(
        original.samples,
        AutoMovieHumanConicLoft.phaseCount(sampling, 0),
      );
    const source: IAutoMovieViewPart = {
      ...original,
      stations,
      reliefs,
      samples,
    };
    const [bottom, top]: [
      IAutoMovieHumanConicLoft.ITip | null,
      IAutoMovieHumanConicLoft.ITip | null,
    ] = family.tips ?? [null, null];
    const wall: number[] = stations.filter(
      (s: number): boolean =>
        (bottom === null || bottom.from <= s) &&
        (top === null || s <= top.from),
    );
    return AutoMovieHumanConicLoft.sampled(sampling, source, wall);
  }
}
