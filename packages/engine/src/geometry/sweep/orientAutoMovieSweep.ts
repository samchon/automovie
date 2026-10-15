import { AutoMovieSweepRotation } from "./AutoMovieSweepRotation";
import { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";

/**
 * Create the station-rotation buffers of a sweep and the in-place
 * computation of its section planes.
 *
 * The carried frame at `u` is the transport's rotation-minimizing frame, or
 * under the fixed orientation its first frame's axes moved to the spine
 * point. `update` stores each giving station's turn relative to the carried
 * frame at its `at`, the station's rotation premultiplied by the inverse of
 * the carried basis; a station without a rotation has no turn. The plane at
 * `u` is the carried frame turned by the normalized linear interpolation of
 * the two bracketing stations' turns, the second negated when their dot
 * product is negative, held beyond the end stations, as sweep-based
 * deformation interpolates key-ellipse orientations (Hyun et al. 2005, The
 * Visual Computer 21(8-10):542-550). Without any giving station the plane is
 * the carried frame.
 *
 * @param props.transport The spine's transport, with frames; only read.
 * @param props.knots The stations' `at`, strictly increasing; only read.
 * @param props.fixed Whether the carried frame keeps the first frame's axes.
 * @returns The orientation, every station without a rotation until written.
 *
 * @evidence contracts/common.md#principled-implementation Relative key-section turns interpolated by nlerp over the transported frame, the orientation rule of sweep-based deformation, with the fixed frame as the translational sweep's carrier.
 * @evidence contracts/common.md#clear-and-simple-design One implementation of section orientation: `compileAutoMovieSweep` writes its stations' rotations once, and a posed sweep writes its bones' every frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rotations are not validated here; `compileAutoMovieSweep` refuses non-finite or zero ones and posing writes unit ones.
 * @evidence contracts/common.md#meaningful-documentation States the carried frame, the relative turn, the interpolation and its source, and the ends.
 * @evidence contracts/performance.md#efficient-algorithms For S stations: `update` is S transport frames and products; a frame query is one transport frame, an O(S) bracket search and a constant-size product, with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The relative turns are computed once per `update` and serve every query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains 8 S numbers, S flags and 40 numbers of frame and scratch, sized at creation and released with the orientation.
 */
export const orientAutoMovieSweep: (props: {
  transport: IAutoMovieSweepTransport;
  knots: Float64Array;
  fixed: boolean;
}) => IAutoMovieSweepOrientation = (props: {
  transport: IAutoMovieSweepTransport;
  knots: Float64Array;
  fixed: boolean;
}): IAutoMovieSweepOrientation => {
  const { transport, knots, fixed } = props;
  const count: number = knots.length;
  const rotations: Float64Array = new Float64Array(4 * count);
  const given: Uint8Array = new Uint8Array(count);
  const offsets: Float64Array = new Float64Array(4 * count);
  // the first frame for the fixed orientation; scratch holds a carried frame and quaternions in turn
  const first: Float64Array = new Float64Array(12);
  const scratch: Float64Array = new Float64Array(28);
  let turned: boolean = false;

  const carried = (u: number, out: Float64Array, at: number): void => {
    transport.frame(u, out, at);
    if (fixed) for (let a: number = 3; a < 12; ++a) out[at + a] = first[a]!;
  };
  const update = (): void => {
    if (fixed) transport.frame(0, first, 0);
    turned = false;
    for (let k: number = 0; k < count; ++k) {
      const o: number = 4 * k;
      if (given[k] === 0) {
        offsets[o] = 0;
        offsets[o + 1] = 0;
        offsets[o + 2] = 0;
        offsets[o + 3] = 1;
        continue;
      }
      turned = true;
      carried(knots[k]!, scratch, 0);
      AutoMovieSweepRotation.fromBasis(scratch, 3, 6, 9, scratch, 12);
      AutoMovieSweepRotation.conjugate(scratch, 12, scratch, 12);
      for (let a: number = 0; a < 4; ++a) scratch[16 + a] = rotations[o + a]!;
      AutoMovieSweepRotation.normalize(scratch, 16);
      AutoMovieSweepRotation.multiply(scratch, 12, scratch, 16, offsets, o);
      AutoMovieSweepRotation.normalize(offsets, o);
    }
  };
  // the interpolated turn at u, written at scratch[16]
  const offset = (u: number): void => {
    const last: number = count - 1;
    if (u <= knots[0]! || u >= knots[last]!) {
      const k: number = u <= knots[0]! ? 0 : last;
      for (let a: number = 0; a < 4; ++a) scratch[16 + a] = offsets[4 * k + a]!;
      return;
    }
    let k: number = 0;
    while (knots[k + 1]! < u) ++k;
    const t: number = (u - knots[k]!) / (knots[k + 1]! - knots[k]!);
    const a: number = 4 * k;
    const b: number = 4 * (k + 1);
    const dot: number =
      offsets[a]! * offsets[b]! + offsets[a + 1]! * offsets[b + 1]! + offsets[a + 2]! * offsets[b + 2]! + offsets[a + 3]! * offsets[b + 3]!;
    const sign: number = dot < 0 ? -1 : 1;
    for (let c: number = 0; c < 4; ++c) scratch[16 + c] = offsets[a + c]! + (sign * offsets[b + c]! - offsets[a + c]!) * t;
    AutoMovieSweepRotation.normalize(scratch, 16);
  };
  const frame = (input: number, out: Float64Array, at: number): void => {
    const u: number = Math.min(1, Math.max(0, input));
    carried(u, out, at);
    if (!turned) return;
    AutoMovieSweepRotation.fromBasis(out, at + 3, at + 6, at + 9, scratch, 12);
    offset(u);
    AutoMovieSweepRotation.multiply(scratch, 12, scratch, 16, scratch, 20);
    // the turned plane's axes are the rotation's columns
    for (let axis: number = 0; axis < 3; ++axis) {
      scratch[24] = axis === 0 ? 1 : 0;
      scratch[25] = axis === 1 ? 1 : 0;
      scratch[26] = axis === 2 ? 1 : 0;
      AutoMovieSweepRotation.rotate(scratch, 20, scratch, 24, out, at + 3 + 3 * axis);
    }
  };
  return { rotations, given, update, frame };
};
