import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/** A corner of a band quad in the band's own coordinates. */
type ICorner = Pick<IAutoMovieSurfaceCoordinate, "s" | "t">;

/**
 * Lay out the quads of a band that changes a sweep's column count, in the
 * band's own coordinates: `s` round the band from 0 to 1, `t` from the start
 * ring at 0 to the end ring at 1.
 *
 * The band has `rows` even rows. Its middle row, row `floor(rows / 2)` from
 * the start, reduces the finer count `F` to the coarser `K` by the standard
 * 2-to-1 quad reduction of subdivision modelling: a block takes four fine
 * columns into two coarse columns through six quads, with three interior
 * vertices half-way across the row, the outer two of valence three and the
 * middle one regular; every other column passes straight through as one
 * quad. With `b = (F - K) / 2` blocks and `K - 2b` straight columns, the
 * fine ring stays regular and the band's extraordinary vertices are its
 * `2b` interior poles of valence three and the coarse ring vertices at the
 * blocks' corners, which gain the poles' diagonals: valence five beside a
 * straight column, six between two blocks. A band with both rings regular
 * would need interior valence-five poles to balance the valence-three ones,
 * since the band's interior `4 - valence` and its rings' `3 - band degree`
 * sum to zero; this strip trades that for one row. The rows before the
 * middle row have the start count and the rows after it the end count, so
 * the band can be as tall as its neighbours' rows require.
 *
 * Blocks and straight columns alternate as evenly as rounding allows: of the
 * `b + K - 2b` items round the row, block `i` takes the item holding
 * `(i + 1/2) n / b`, rounded toward the row's middle, so a band reversed in
 * `s` places its blocks at mirrored items, except where an odd number of
 * blocks meets an even number of items. Each ring's points are evenly
 * spaced, `k / F` and `j / K`, so both weld onto evenly divided neighbours;
 * a block's interior vertices lie half-way between its second, third and
 * fourth fine points and the midpoint of its first coarse column, its middle
 * coarse point and the midpoint of its second coarse column. A 2-to-1 band
 * has no straight columns and so no shear; any other ratio shears its
 * straight columns, the price of even rings. Equal counts give a plain grid.
 *
 * @param start Columns at `t` 0, a positive integer.
 * @param end Columns at `t` 1, a positive integer.
 * @param rows Rows across the band, a positive integer.
 * @returns Quads as four corners in patch coordinates, counterclockwise with `s` right and `t` up.
 * @throws Error when a count is not a positive integer, the column counts differ by an odd number, or the finer is more than twice the coarser.
 *
 * @evidence contracts/common.md#principled-implementation The 2-to-1 quad reduction strip of subdivision modelling, which changes a ring's count with quads only in one row, keeps the fine ring regular and puts its valence-three poles inside the band, combined with straight columns for ratios below two; blocks spread by centred rounding. A 3-to-1 strip among straight columns was measured worse on a cylinder, 1.6 percent radial and 5.9 degrees against 1.0 and 4.0 at 8 to 16 columns.
 * @evidence contracts/common.md#clear-and-simple-design Pure topology and patch coordinates; the network rig turns corners into vertices on the sweep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts the strip cannot join, an odd difference or more than a halving, are refused instead of being joined by triangles, n-gons or a crease; a larger change chains two bands.
 * @evidence contracts/common.md#meaningful-documentation States the rows, the pattern, every extraordinary vertex and its valence, why the coarse ring is not regular, the ring spacing, the interior positions, the shear, the symmetry and its exception, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(rows x F) quads, each constant work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per band per rig compile.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the quad list is transferred to the caller.
 */
export const layoutAutoMovieSurfaceTransition: (
  start: number,
  end: number,
  rows: number,
) => Array<
  [
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
  ]
> = (
  start: number,
  end: number,
  rows: number,
): Array<
  [
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
    Pick<IAutoMovieSurfaceCoordinate, "s" | "t">,
  ]
> => {
  for (const n of [start, end, rows])
    if (!Number.isSafeInteger(n) || n < 1)
      throw new Error(`transition counts must be positive integers, not ${n}`);
  const fine: number = Math.max(start, end);
  const coarse: number = Math.min(start, end);
  if ((fine - coarse) % 2 !== 0)
    throw new Error(
      `transition counts ${start} and ${end} must differ by an even number`,
    );
  if (fine > 2 * coarse)
    throw new Error(
      `transition count ${fine} is more than twice ${coarse}; chain two bands`,
    );
  const quads: Array<[ICorner, ICorner, ICorner, ICorner]> = [];
  const middle: number = Math.floor(rows / 2);
  // the plain rows: start count before the middle row, end count after it
  for (let r: number = 0; r < rows; ++r) {
    if (r === middle) continue;
    const n: number = r < middle ? start : end;
    for (let i: number = 0; i < n; ++i)
      quads.push([
        { s: i / n, t: r / rows },
        { s: (i + 1) / n, t: r / rows },
        { s: (i + 1) / n, t: (r + 1) / rows },
        { s: i / n, t: (r + 1) / rows },
      ]);
  }
  const blocks: number = (fine - coarse) / 2;
  const items: number = coarse - blocks;
  // items that are blocks: each block's centre, rounded toward the row's middle
  const holds: Set<number> = new Set();
  for (let i: number = 0; i < blocks; ++i) {
    const centre: number = ((i + 0.5) * items) / blocks;
    holds.add(
      centre < items / 2
        ? Math.floor(centre)
        : centre > items / 2
          ? Math.ceil(centre) - 1
          : Math.floor(centre),
    );
  }
  // in canonical orientation the fine ring is at the row's bottom; a band that grows is the mirror across the row
  const flip: boolean = start < end;
  function at(s: number, tau: number): ICorner {
    return {
      s,
      t: (middle + (flip ? 1 - tau : tau)) / rows,
    };
  }
  function push(q: [ICorner, ICorner, ICorner, ICorner]): void {
    quads.push(flip ? [q[3], q[2], q[1], q[0]] : q);
  }
  let f: number = 0;
  let c: number = 0;
  for (let item: number = 0; item < items; ++item) {
    if (!holds.has(item)) {
      push([
        at(f / fine, 0),
        at((f + 1) / fine, 0),
        at((c + 1) / coarse, 1),
        at(c / coarse, 1),
      ]);
      f += 1;
      c += 1;
      continue;
    }
    const b: ICorner[] = [0, 1, 2, 3, 4].map(
      (k: number): ICorner => at((f + k) / fine, 0),
    );
    const t: ICorner[] = [0, 1, 2].map(
      (k: number): ICorner => at((c + k) / coarse, 1),
    );
    function half(k: number, top: number): ICorner {
      return at(((f + k) / fine + (c + top) / coarse) / 2, 0.5);
    }
    const i1: ICorner = half(1, 0.5);
    const m: ICorner = half(2, 1);
    const i2: ICorner = half(3, 1.5);
    push([b[0]!, b[1]!, i1, t[0]!]);
    push([b[1]!, b[2]!, m, i1]);
    push([b[2]!, b[3]!, i2, m]);
    push([b[3]!, b[4]!, t[2]!, i2]);
    push([i1, m, t[1]!, t[0]!]);
    push([m, i2, t[2]!, t[1]!]);
    f += 4;
    c += 2;
  }
  if (f !== fine || c !== coarse)
    throw new Error(
      `transition blocks cover ${f} of ${fine} fine and ${c} of ${coarse} coarse columns`,
    );
  return quads;
};
