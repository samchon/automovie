import type { IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanConicRelief as R } from "@automovie/human";

/**
 * The compact relief forms against closed forms, on made nets.
 *
 * Scenarios:
 * 1. A half of 3 rows by 4 stored columns whose height is `100 a + b` expands to 3 by 7 with `100 a + min(b, 6 - b)` at row `a`,
 *    column `b`: the middle column once, the others on both sides, rows in place.
 * 2. `mirrored` refuses an even column count and a half of the wrong length.
 * 3. A twin of a 5 by 6 net whose height is `100 a + b` holds `100 a + (5 - b)`: columns reversed, rows kept; it carries its own name,
 *    window and directions and the original's stations, rows and columns.
 * 4. Reflection is an involution and fixes a mirrored net: the twin's twin is the original, and a mirrored net's twin holds the net's
 *    own heights.
 * 5. `list` resolves a twin by the name of a net before it and refuses one that names a later net; `stored` gives the half's length for
 *    a mirrored net, none for a twin and every height for a net written whole. A twin of a fixed cast given a turning direction is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `mirrored`, `twin`, `list` and `stored` of `AutoMovieHumanConicRelief`.
 * @evidence contracts/development/testing.md#independent-expectations Every expected height is the closed form of its row and column, written here and not computed by the helper.
 * @evidence contracts/development/testing.md#distinguishing-cases Heights that differ in every row and column tell a column reversal from a row reversal and the middle column from its neighbours; an asymmetric 5 by 6 net tells a twin from its original.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on made numbers, reached by `--include human_conic_relief`, with no reference body or figure.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the closed form it is checked against.
 */
export function test_human_conic_relief(): void {
  const failures: string[] = [];
  const same = (label: string, got: readonly number[], want: readonly number[]): void => {
    if (got.length !== want.length || got.some((x: number, i: number): boolean => x !== want[i])) failures.push(`${label}: ${JSON.stringify(got)} against ${JSON.stringify(want)}`);
  };
  const refused = (label: string, call: () => unknown): void => {
    try {
      call();
      failures.push(label + ": not refused");
    } catch {
      // Refused, as it must be.
    }
  };
  const grid = (rows: number, columns: number, height: (a: number, b: number) => number): number[] => Array.from({ length: rows * columns }, (_: unknown, i: number): number => height(Math.floor(i / columns), i % columns));

  // 1. The half expands about its middle column.
  const full: number[] = R.mirrored(3, 7, grid(3, 4, (a: number, b: number): number => 100 * a + b));
  same("mirrored 3 by 7", full, grid(3, 7, (a: number, b: number): number => 100 * a + Math.min(b, 6 - b)));

  // 2. What has no middle column or the wrong size is refused.
  refused("mirrored with 6 columns", (): number[] => R.mirrored(3, 6, grid(3, 3, (): number => 0)));
  refused("mirrored with a short half", (): number[] => R.mirrored(3, 7, grid(3, 3, (): number => 0)));
  refused("mirrored with a whole net as its half", (): number[] => R.mirrored(3, 7, grid(3, 7, (): number => 0)));

  // 3. A twin reverses columns and keeps rows.
  const original: IAutoMovieLoftRelief = { name: "made", stations: [10, 50], phases: [0.3, 2], axis: [1, 0, 0], turn: [0, 0, 1], rows: 5, columns: 6, heights: grid(5, 6, (a: number, b: number): number => 100 * a + b) };
  const own: Omit<R.ITwin, "twin"> = { name: "made.twin", phases: [-2, -0.3], axis: [1, 0, 0], turn: [0, 0, -1] };
  const twin: IAutoMovieLoftRelief = R.twin(original, own);
  same("twin heights", twin.heights, grid(5, 6, (a: number, b: number): number => 100 * a + (5 - b)));
  same("twin size and stations", [twin.rows, twin.columns, ...twin.stations], [5, 6, 10, 50]);
  same("twin window and directions", [...twin.phases, ...twin.axis, ...(twin.turn ?? [])], [-2, -0.3, 1, 0, 0, 0, 0, -1]);
  if (twin.name !== "made.twin") failures.push("twin name: " + twin.name);

  // 4. Reflection twice is the identity, and a mirrored net is its own reflection.
  same("twin of the twin", R.twin(twin, { ...own, name: "made.back" }).heights, original.heights);
  const median: IAutoMovieLoftRelief = { name: "median", stations: [0, 1], phases: [-1, 1], axis: [1, 0, 0], rows: 3, columns: 7, heights: full };
  same("twin of a mirrored net", R.twin(median, { name: "median.twin", phases: [-1, 1], axis: [1, 0, 0] }).heights, full);

  // 5. The list, its order and the stored sizes.
  const listed: IAutoMovieLoftRelief[] = R.list([median, original, { ...own, twin: "made" }]);
  same("listed twin", listed[2]!.heights, twin.heights);
  if (listed[0] !== median || listed[1] !== original) failures.push("list: a net written whole did not stand as it is");
  same("stored sizes", listed.map(R.stored), [12, 30, 0]);
  refused("a twin before its original", (): IAutoMovieLoftRelief[] => R.list([{ ...own, twin: "made" }, original]));
  refused("a turning twin of a fixed cast", (): IAutoMovieLoftRelief => R.twin(median, own));

  if (failures.length > 0) throw new Error("conic relief:\n" + failures.join("\n"));
}
