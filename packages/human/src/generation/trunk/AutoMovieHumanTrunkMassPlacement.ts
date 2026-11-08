import {
  AutoMovieIllinois,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/** A source point or anatomical AP direction, calibration mm or unit length. */
type Vec3 = [number, number, number];

/**
 * A trunk mass's AP axis from the actual original trunk section and its
 * declared apex. A closest point on a loft is a different datum: it can move
 * the supplied height and transverse place before the protrusion is drawn.
 *
 * @evidence contracts/common.md#principled-implementation Reads the identical trunk outlines and fullness through the engine owners, intersects that source section at the apex's Y/Z, and uses the AP difference to the apex as amplitude.
 * @evidence contracts/common.md#clear-and-simple-design One source placement record precedes the existing mass builder without realizing another host or defining another section representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no loft layer, closest-foot recovery, mesh, private fit, target clamp or displaced old relief point.
 * @evidence contracts/common.md#meaningful-documentation States source units, level-chart admission, AP ownership and the distinction from final attachment.
 * @evidence contracts/performance.md#efficient-algorithms Prepares the actual scalar/fullness source once and one native point reader, then the existing bounded Illinois solve without a loft, phase derivatives or body rebuild.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted section is shared by every residual and the final point query within the placement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fixed-size owned tuples or one failure; no source, host or cache is retained.
 */
export namespace AutoMovieHumanTrunkMassPlacement {
  /**
   * The original wall point, AP direction and distance to the declared apex.
   *
   * @evidence contracts/common.md#principled-implementation Separates the source wall point and AP extreme from the host chart used only for embedding.
   * @evidence contracts/common.md#clear-and-simple-design Three tuples/scalars supply the existing mass builder directly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no fitted or recovered geometric substitute.
   * @evidence contracts/common.md#meaningful-documentation Members state calibration units and chart versus world meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The placement operation owns sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its synchronous caller owns the returned tuples.
   */
  export interface IPlacement {
    /** Original trunk chart station and polar phase, mm and radians. */
    centre: [number, number];
    /** Original wall point at the target's Y/Z, calibration mm. */
    origin: Vec3;
    /** Anatomical anterior or posterior unit direction. */
    normal: Vec3;
    /** Positive AP distance from wall to apex, mm. */
    amplitude: number;
  }

  /**
   * Place an AP extreme without moving its height or transverse coordinate.
   * The selected front/back branch follows the source owner's convex-section
   * contract. Its existing sampled fault check rejects detected defects but
   * is not a continuous convexity certificate. The Illinois result's residual
   * is checked after its iteration limit; unsupported premises remain failures.
   *
   * @evidence contracts/common.md#principled-implementation Uses the production source's four signed edges, original fullness and fixed world-X/Z frame, then the same native Cartesian point and bracketed root owner.
   * @evidence contracts/common.md#clear-and-simple-design Returns the exact wall/axis/amplitude record or a named premise string.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not force an out-of-box target, assume a sparse knot is a full surface, or reinterpret an oblique normal as an AP extreme.
   * @evidence contracts/common.md#meaningful-documentation Defines facing, target units, the source owner's convexity premise and sampled admission limit, and the 1e-9 mm scalar residual boundary.
   * @evidence contracts/performance.md#efficient-algorithms After original source preparation, Illinois reads two endpoints and at most one hundred iterative point residuals; successful return adds one residual check and one final point read, at most 104 point calls in total.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same native point closure throughout the root, residual check and final wall query; no full derivative capability is requested.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All prepared sources and closures are call-local; only fixed-size placement data escapes.
   */
  export function of(
    part: IAutoMovieViewPart,
    target: Vec3,
    facing: 1 | -1,
  ): IPlacement | string {
    const y: number = target[1];
    const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> = part.axis.at(y);
    if (
      !target.every(Number.isFinite) ||
      Math.abs(frame.origin[1] - y) > 1e-9 ||
      frame.origin[2] !== 0 ||
      frame.u.some(
        (value: number, axis: number): boolean => value !== [1, 0, 0][axis],
      ) ||
      frame.v.some(
        (value: number, axis: number): boolean => value !== [0, 0, 1][axis],
      )
    )
      return "mass placement needs the actual level world-X/Z trunk source";
    const prepared: ReturnType<typeof AutoMovieLoftViewSource.create> =
      AutoMovieLoftViewSource.create(part);
    if (prepared === null || prepared.source === null)
      return `mass wall source failed: ${JSON.stringify(prepared?.diagnostics ?? "girth source unavailable")}`;
    const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
      AutoMovieLoftViewRead.values(prepared.source, y);
    if (typeof values === "string") return values;
    const across: number = target[2] - frame.origin[2];
    if (across < -values.extents[3]! || across > values.extents[1]!)
      return `mass apex across ${across} mm is outside its actual source wall`;
    const point: ReturnType<typeof AutoMovieLoftSectionNative.point> =
      AutoMovieLoftSectionNative.point(values);
    const z: (phi: number) => number = (phi: number): number => point(phi)[1];
    const phase: number | null = AutoMovieIllinois.root(
      (phi: number): number => z(phi) - across,
      facing === 1 ? -Math.PI / 2 : Math.PI / 2,
      facing === 1 ? Math.PI / 2 : (3 * Math.PI) / 2,
      1e-9,
      100,
    );
    if (
      phase === null ||
      !Number.isFinite(phase) ||
      Math.abs(z(phase) - across) > 1e-9
    )
      return "mass wall across query has no admitted source root";
    const local: [number, number] = point(phase);
    const origin: Vec3 = [frame.origin[0] + local[0], y, target[2]];
    const amplitude: number = facing * (target[0] - origin[0]);
    if (!(Number.isFinite(amplitude) && amplitude > 0))
      return `mass apex leaves no positive AP projection above its source wall: ${amplitude} mm`;
    return {
      centre: [y, phase < 0 ? phase + 2 * Math.PI : phase],
      origin,
      normal: [facing, 0, 0],
      amplitude,
    };
  }
}
