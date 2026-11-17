import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";

/**
 * Matched loop samples and target slots for a pose-updated Hermite bridge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Corresponding metre loops and dimensionless tension define reserved Hermite bridge controls in a live packed buffer. Loop cardinality and tension are admitted by planning; degenerate directions or crossing columns remain possible and are not hidden by the contract.
 * @evidence contracts/development/design.md#principled-representation Corresponding metre loops and dimensionless tension define reserved Hermite bridge controls in a live packed buffer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface rigAutoMovieSurfaceBridge consumes the shared samples and probes supplied by network patch planning.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Loop cardinality and tension are admitted by planning; degenerate directions or crossing columns remain possible and are not hidden by the contract.
 */
export namespace IAutoMovieRigSurfaceBridge {
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
   * the corner alone. This local construction does not certify that columns never cross or that the resulting patch is free of self-intersection. Nondegenerate loop lengths and direction vectors are caller premises; this kernel can write nonfinite controls for a degenerate tangent, which the owning network rejects after evaluating all writers. No rollback of earlier interior writes is provided.
   *
   * @evidence contracts/development/design.md#principled-representation Loop indices address packed model-metre positions; rows and dimensionless tension define interior Hermite samples. Patch planning admits count agreement and positive finite tension before calling this unchecked kernel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieSurfaceRigPatches supplies shared loop samples and resolved probes; the bridge writes only its reserved interior vertex indices.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nullable sweep/curve sample metadata must identify the primitive required by each direction rule; degenerate tangents and self-intersection are not made impossible by this shape.
   * @evidence contracts/development/common.md#meaningful-documentation States copied indices versus borrowed arrays, pose ordering, column-major output indexing and tangent-unit conversion.
   */
  export type IProps = {
    /** First loop's ordered sample records, borrowed by the returned writer. Each sample's sweep or curve rig supplies its bridge direction; preserve order and references while the writer lives. */
    from: IAutoMovieSurfaceSample[];
    /** Second loop's samples in correspondence with from, with exactly the same count. Network patch planning admits matching loops before calling this compiler. */
    to: IAutoMovieSurfaceSample[];
    /** Vertex indices of first-loop points in the packed target buffer. Copied into an Int32Array during compilation; buffer positions are read at three times each index. */
    fromIndex: number[];
    /** Corresponding second-loop vertex indices, copied during compilation. Loops must already be written before the returned interior writer runs. */
    toIndex: number[];
    /** First loop's direction rule: sweep normal/inward/spine forward/backward, or normal crossed with a scale-aware loop chord for across. A curve supplies its declared direction except under across. */
    fromRule: IAutoMovieSurfaceNetwork.ILoop["tangent"];
    /** Second loop's direction rule in the same convention as fromRule; it determines the receiving Hermite tangent. */
    toRule: IAutoMovieSurfaceNetwork.ILoop["tangent"];
    /** Borrowed sweep probe slots for all first-loop points followed by all second-loop points. A curve point uses -1. Probe fields must reflect the current pose before writing. */
    probes: number[];
    /** Positive integer number of faces along each bridging column. The compiler writes rows-1 interior points; parent patch planning owns count admission. */
    rows: number;
    /** Positive finite dimensionless tangent-length/chord-length ratio, admitted by parent patch planning. Each Hermite endpoint tangent is scaled by this ratio times the current endpoint separation. */
    tension: number;
    /** Borrowed target vertex indices, column-major: row j of column k is at k*(rows-1)+j-1 for j=1..rows-1. The returned writer mutates those packed XYZ positions in metres. */
    interior: number[];
  };
}
