import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";

/**
 * Compile a bridge patch's interior for per-pose evaluation, returning the
 * writer that fills its rows into a target buffer.
 *
 * Column `k` joins loop point `k` of the first loop to loop point `k` of the
 * second by the cubic Hermite curve `h00 A + h10 m T_A + h01 B + h11 m T_B`,
 * `m` the tension times the chord, row `j` at `t = j / rows`. A loop point's
 * direction follows its loop's rule: at a sweep point the sweep's outward
 * normal for `normal`, its opposite for `inward`, and its unit derivative
 * along the spine, forward or backward, for `forward` and `backward`; at a
 * curve point the curve's declared direction. Under `across` the direction is
 * the normal, the sweep's or the curve's blended one, crossed with the loop's
 * chord between the points one first-row length, `m / rows`, before and
 * after it along the loop, at least reaching both neighbours. That chord is
 * the loop's tangent at the scale of the first row, so near a corner of the
 * loop the columns turn over the points within one row of it rather than at
 * the corner alone, and no column overtakes its neighbour.
 *
 * @param props.from The first loop's points, in order; their `sweep` and `curve` decide directions.
 * @param props.to The second loop's points, the same count.
 * @param props.fromIndex Vertex index of each first-loop point.
 * @param props.toIndex Vertex index of each second-loop point.
 * @param props.fromRule The first loop's tangent rule.
 * @param props.toRule The second loop's tangent rule.
 * @param props.probes Probe slot of each sweep point of both loops, first loop then second, -1 for a curve point.
 * @param props.rows Faces along each column.
 * @param props.tension Tangent length over chord length.
 * @param props.interior Vertex index of row `j` of column `k` at `k * (rows - 1) + j - 1`.
 * @returns The writer, which reads the loops' vertices and writes the interior into the same buffer.
 *
 * @evidence contracts/common.md#principled-implementation Cubic Hermite blending between two loops with end directions in the joined surfaces' tangent planes, the explicit rule for a branch or a junction band, with the loop tangent taken at the scale of the first row as an offset curve takes it.
 * @evidence contracts/common.md#clear-and-simple-design All per-pose state is three small buffers; the network rig decides vertex identities and probes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing curve normals or directions are refused by the curve's rig, not substituted.
 * @evidence contracts/common.md#meaningful-documentation States the column curve, every direction rule and why the across chord spans a first row.
 * @evidence contracts/performance.md#efficient-algorithms For n columns of r rows: O(n) arc lengths per loop, an O(n) walk per across direction, and O(n r) interior points; nothing allocates.
 * @evidence contracts/performance.md#reuse-equivalent-work Hermite weights per row and arc lengths per loop are computed once per call and shared by every column.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the index arrays and O(n + r) numbers of arcs, weights and scratch.
 */
export const rigAutoMovieSurfaceBridge: (props: {
  from: IAutoMovieSurfaceSample[];
  to: IAutoMovieSurfaceSample[];
  fromIndex: number[];
  toIndex: number[];
  fromRule: IAutoMovieSurfaceNetwork.ILoop["tangent"];
  toRule: IAutoMovieSurfaceNetwork.ILoop["tangent"];
  probes: number[];
  rows: number;
  tension: number;
  interior: number[];
}) => (targets: Float64Array) => void = (props: {
  from: IAutoMovieSurfaceSample[];
  to: IAutoMovieSurfaceSample[];
  fromIndex: number[];
  toIndex: number[];
  fromRule: IAutoMovieSurfaceNetwork.ILoop["tangent"];
  toRule: IAutoMovieSurfaceNetwork.ILoop["tangent"];
  probes: number[];
  rows: number;
  tension: number;
  interior: number[];
}): ((targets: Float64Array) => void) => {
  const { rows, tension, interior, probes } = props;
  const n: number = props.from.length;
  const ia: Int32Array = Int32Array.from(props.fromIndex);
  const ib: Int32Array = Int32Array.from(props.toIndex);
  const arcA: Float64Array = new Float64Array(n + 1);
  const arcB: Float64Array = new Float64Array(n + 1);
  // Hermite weights h00, h10, h01, h11 of each interior row
  const basis: Float64Array = new Float64Array(4 * rows);
  for (let j: number = 1; j < rows; ++j) {
    const t: number = j / rows;
    basis.set(
      [
        2 * t ** 3 - 3 * t ** 2 + 1,
        t ** 3 - 2 * t ** 2 + t,
        -2 * t ** 3 + 3 * t ** 2,
        t ** 3 - t ** 2,
      ],
      4 * j,
    );
  }
  // directions at the two loop points, a chord's ends and a base vector in turn
  const scratch: Float64Array = new Float64Array(15);

  const arcs = (
    targets: Float64Array,
    index: Int32Array,
    arc: Float64Array,
  ): void => {
    arc[0] = 0;
    for (let k: number = 1; k <= n; ++k) {
      const a: number = 3 * index[k % n]!;
      const b: number = 3 * index[k - 1]!;
      arc[k] =
        arc[k - 1]! +
        Math.hypot(
          targets[a]! - targets[b]!,
          targets[a + 1]! - targets[b + 1]!,
          targets[a + 2]! - targets[b + 2]!,
        );
    }
  };
  // the loop's point at a distance along it, closed, written at scratch[at]
  const along = (
    targets: Float64Array,
    index: Int32Array,
    arc: Float64Array,
    distance: number,
    at: number,
  ): void => {
    const total: number = arc[n]!;
    const d: number = ((distance % total) + total) % total;
    let k: number = 0;
    while (k < n - 1 && arc[k + 1]! <= d) ++k;
    const span: number = arc[k + 1]! - arc[k]!;
    const w: number = span > 0 ? (d - arc[k]!) / span : 0;
    const a: number = 3 * index[k]!;
    const b: number = 3 * index[(k + 1) % n]!;
    for (let c: number = 0; c < 3; ++c)
      scratch[at + c] =
        targets[a + c]! + (targets[b + c]! - targets[a + c]!) * w;
  };
  // the unit direction a column leaves or reaches loop point k along, written at scratch[at]
  const direction = (
    targets: Float64Array,
    loop: IAutoMovieSurfaceSample[],
    index: Int32Array,
    arc: Float64Array,
    probe: number,
    k: number,
    reach: number,
    rule: IAutoMovieSurfaceNetwork.ILoop["tangent"],
    at: number,
  ): void => {
    const point: IAutoMovieSurfaceSample = loop[k]!;
    if (point.sweep !== null) {
      const p: Float64Array = point.sweep.rig.probes;
      const o: number = 6 * probe;
      if (rule === "forward" || rule === "backward") {
        const size: number =
          Math.hypot(p[o + 3]!, p[o + 4]!, p[o + 5]!) *
          (rule === "forward" ? 1 : -1);
        for (let c: number = 0; c < 3; ++c)
          scratch[at + c] = p[o + 3 + c]! / size;
      } else
        for (let c: number = 0; c < 3; ++c)
          scratch[at + c] = p[o + c]! * (rule === "inward" ? -1 : 1);
    } else if (rule === "across")
      point.curve!.rig.normal(point.curve!.t, scratch, at);
    else point.curve!.rig.direction(scratch, at);
    if (rule !== "across") return;
    const before: number =
      arc[k]! - arc[(k + n - 1) % n]! + (k === 0 ? arc[n]! : 0);
    const step: number = Math.max(reach, arc[k + 1]! - arc[k]!, before);
    along(targets, index, arc, arc[k]! + step, 6);
    along(targets, index, arc, arc[k]! - step, 9);
    const cx: number = scratch[6]! - scratch[9]!;
    const cy: number = scratch[7]! - scratch[10]!;
    const cz: number = scratch[8]! - scratch[11]!;
    const nx: number = scratch[at]!;
    const ny: number = scratch[at + 1]!;
    const nz: number = scratch[at + 2]!;
    const x: number = ny * cz - nz * cy;
    const y: number = nz * cx - nx * cz;
    const z: number = nx * cy - ny * cx;
    const size: number = Math.hypot(x, y, z);
    scratch[at] = x / size;
    scratch[at + 1] = y / size;
    scratch[at + 2] = z / size;
  };
  return (targets: Float64Array): void => {
    arcs(targets, ia, arcA);
    arcs(targets, ib, arcB);
    for (let k: number = 0; k < n; ++k) {
      const a: number = 3 * ia[k]!;
      const b: number = 3 * ib[k]!;
      const m: number =
        tension *
        Math.hypot(
          targets[b]! - targets[a]!,
          targets[b + 1]! - targets[a + 1]!,
          targets[b + 2]! - targets[a + 2]!,
        );
      direction(
        targets,
        props.from,
        ia,
        arcA,
        probes[k]!,
        k,
        m / rows,
        props.fromRule,
        0,
      );
      direction(
        targets,
        props.to,
        ib,
        arcB,
        probes[n + k]!,
        k,
        m / rows,
        props.toRule,
        3,
      );
      for (let j: number = 1; j < rows; ++j) {
        const o: number = 3 * interior[k * (rows - 1) + j - 1]!;
        const h: number = 4 * j;
        for (let c: number = 0; c < 3; ++c)
          targets[o + c] =
            targets[a + c]! * basis[h]! +
            scratch[c]! * m * basis[h + 1]! +
            (targets[b + c]! * basis[h + 2]! +
              scratch[3 + c]! * m * basis[h + 3]!);
      }
    }
  };
};
