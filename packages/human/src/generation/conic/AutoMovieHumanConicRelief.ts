import type { IAutoMovieLoftRelief } from "@automovie/engine";

/**
 * The compact forms a family's relief nets are stored in, and their expansion to the nets the engine reads.
 *
 * A net repeats numbers in two ways the body's symmetry gives. A net of a median part whose window stands about the median plane is its
 * own mirror image: its column `b` equals its column `columns - 1 - b`, the map the engine's uniform cubic gives a window reflected
 * about its middle (`AutoMovieLoftRelief.height`: control `i` of `n` stands at parameter `i - 1` of `[0, n - 3]`, and the reflection
 * `x -> n - 3 - x` sends it to `n - 1 - i`). And a net fitted on one side of such a part has a twin on the other, the same heights with
 * their columns in the other order. A module stores the half and names the twin; `list` returns the full nets.
 *
 * Every expansion copies stored doubles and computes nothing, so a figure built from the expanded nets is built from the same numbers
 * as one whose module wrote them all out.
 */
export namespace AutoMovieHumanConicRelief {
  /** A net stored as the reflection of an earlier one of its family's list. */
  export interface ITwin {
    /** The twin's own name. */
    name: string;

    /** The name of the net it reflects, which stands before it in the list. */
    twin: string;

    /** The twin's own phase window, radians. */
    phases: [number, number];

    /** The twin's own unit direction of height. */
    axis: [number, number, number];

    /** The twin's own turning direction; present exactly when the original has one. */
    turn?: [number, number, number];
  }

  /** How many heights each expanded net's module stores, by the expanded `heights` array itself. */
  const STORED: WeakMap<readonly number[], number> = new WeakMap();

  /**
   * The full heights of a net that is its own mirror image, from its stored half.
   *
   * @param rows The net's rows.
   * @param columns The net's columns, odd: the middle column is its own image and is stored once.
   * @param half Columns 0 to `(columns - 1) / 2` of every row, row by row.
   * @returns `rows * columns` heights, row by row: each row's stored columns, then the columns before the middle in reverse.
   */
  export function mirrored(rows: number, columns: number, half: readonly number[]): number[] {
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || columns % 2 !== 1) throw new Error("mirrored: a net of " + rows + " by " + columns + " has no middle column to reflect about");
    const kept: number = (columns + 1) / 2;
    if (half.length !== rows * kept) throw new Error("mirrored: " + half.length + " heights given for " + rows + " rows of " + kept + " stored columns");
    const out: number[] = new Array<number>(rows * columns);
    for (let a: number = 0; a < rows; ++a) for (let b: number = 0; b < columns; ++b) out[a * columns + b] = half[a * kept + Math.min(b, columns - 1 - b)]!;
    STORED.set(out, half.length);
    return out;
  }

  /**
   * A net's twin across the median plane: the original's stations, rows, columns and heights with every row's columns in the other
   * order, under the twin's own name, window and directions.
   *
   * @param original The net fitted on one side.
   * @param own The twin's name, phase window and directions.
   */
  export function twin(original: IAutoMovieLoftRelief, own: Omit<ITwin, "twin">): IAutoMovieLoftRelief {
    if ((original.turn === undefined) !== (own.turn === undefined)) throw new Error("twin: " + own.name + " and " + original.name + " do not both turn their cast");
    if (original.shift !== undefined) throw new Error("twin: " + original.name + " carries a station map, which no twin reflects");
    const { rows, columns }: IAutoMovieLoftRelief = original;
    const heights: number[] = new Array<number>(rows * columns);
    for (let a: number = 0; a < rows; ++a) for (let b: number = 0; b < columns; ++b) heights[a * columns + b] = original.heights[a * columns + (columns - 1 - b)]!;
    STORED.set(heights, 0);
    return { name: own.name, stations: original.stations, phases: own.phases, axis: own.axis, ...(own.turn === undefined ? {} : { turn: own.turn }), rows, columns, heights };
  }

  /**
   * A family's nets from their stored list, in its order: a net written whole or through `mirrored` stands as it is, and a twin is the
   * reflection of the net it names, which must stand before it.
   */
  export function list(entries: readonly (IAutoMovieLoftRelief | ITwin)[]): IAutoMovieLoftRelief[] {
    const out: IAutoMovieLoftRelief[] = [];
    for (const entry of entries) {
      if (!("twin" in entry)) {
        out.push(entry);
        continue;
      }
      const original: IAutoMovieLoftRelief | undefined = out.find((relief: IAutoMovieLoftRelief): boolean => relief.name === entry.twin);
      if (original === undefined) throw new Error("list: " + entry.name + " reflects " + entry.twin + ", which does not stand before it");
      out.push(twin(original, { name: entry.name, phases: entry.phases, axis: entry.axis, ...(entry.turn === undefined ? {} : { turn: entry.turn }) }));
    }
    return out;
  }

  /** How many heights a net's module stores: its half's for a mirrored net, none for a twin, and all of them for a net written whole. */
  export function stored(relief: IAutoMovieLoftRelief): number {
    return STORED.get(relief.heights) ?? relief.heights.length;
  }
}
