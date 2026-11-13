import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** World point or derivative in the producing surface chart. */
type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * A join's blend published as a lofted chain, so the skin, its normals, its
 * binding and its chart read the blend's vertices as they read any chain's,
 * and a later merge can take the blend as a host face.
 *
 * The blend is the quintic Hermite in its share `w` between the host's and
 * the part's ribbons (`AutoMovieSolidBlend`). A chain interval whose
 * two layers carry values, slopes and second derivatives is the same quintic
 * Hermite in station (`AutoMovieStationHermite`), so the blend is a
 * chain of two layers: the host's rail at station 0 and the part's at station
 * `L`, the columns' mean chord, with `s = w L`, each layer's slopes the
 * ribbon's cross derivative over `L` and its second derivatives the ribbon's
 * second cross derivative over `L^2`. Its rings are not planar, so each
 * layer lies in the world's level frame (`u = +X`, `v = +Z`, normal `+Y`)
 * with its height as the lift, carried by the same quintic rule
 * (`IAutoMovieLoftChain.ILayer.liftCurvatures`). In phase every
 * quantity is the periodic cubic B-spline through the columns at `count`
 * uniform curve parameters from the trace's seed, the chain's phase `t - seed`.
 *
 * So at every column the chain is the blend exactly (to the B-spline
 * interpolation filter's rounding), including both ribbons' 2-jets, and
 * between columns it is the B-spline through them: its interpolated ribbons
 * leave the surfaces' tangent planes there by about `(spacing / R)^2 / 8`,
 * the spacing the columns' distance along a rail and `R` the surface's
 * smaller radius of curvature, so the column count is chosen from that bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the layers, their fields and the refusal.
 * @evidence contracts/development/design.md#principled-representation Represents A join's blend published as a lofted chain, so the skin, its normals, its binding and its chart read the blend's vertices as they read any chain's, and a later merge can take the blend as a host face: companion namespace of 3 members (`IBlend`, `of`, `strip`); units and frames named in its text: frame, radians, world, local, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidBlendChain` in packages/engine/src/geometry/construction/AutoMovieSolidBlendChain.ts; its surface is the 3 members listed and the text shows 15 other files naming it, mostly test (8), packages/engine (6), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidBlendChain {
  /**
   * A two-layer blend chain and the column-aligned trim/measurement records
   * used by Body and Clip. Chain station is w*length in mm; chain phase phi
   * names trace parameter seed+phi. Layer frame/zero-jet records are shared
   * factory objects, so mutating them can affect other published blends.
   *
   * @evidence contracts/development/design.md#principled-representation One column ordering ties the interpolated ribbon chain to its two rail charts, direction observations, intersection points and width readings; between-column interpolation is not an exact analytic-surface certificate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A data record publishes geometry and its source correspondence without retaining the join's query API or another tessellated representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type proves neither regular G2 contact nor global orientation/trim correctness. The producer's shared mutable frame records remain an ownership gap, not a guarantee of detached output.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the station/phase mapping, physical units, loop correspondence and shared-frame mutation consequence.
   */
  export interface IBlend {
    /** The chain. */
    chain: IAutoMovieLoftChain;

    /** Its station span `L`, mm: the share `w` is `station / L`. */
    length: number;

    /** The curve parameter of the chain's phase 0, radians (`AutoMovieSolidIntersection.IPoint.t`). */
    seed: number;

    /** The host's rail at the columns, as a trim of the host's face. */
    host: AutoMovieSolidMesh.ILoopChart;

    /** The part's rail at the columns, as a trim of the part's face. */
    part: AutoMovieSolidMesh.ILoopChart;

    /**
     * The host's chart direction at each column from the curve's preimage
     * toward its rail, of unit world speed: the host continues past its rail
     * at `host.chart[k] + sigma across[k]`, `sigma > 0` in millimetres.
     */
    across: [number, number][];

    /**
     * The part's chart direction at each column from the curve's preimage
     * toward its rail, of unit world speed at the preimage
     * (`AutoMovieSolidRail.IRail.partAcross`): the part continues past its
     * rail along it.
     */
    partAcross: [number, number][];

    /** The intersection curve's point at each column, mm. */
    curve: [number, number, number][];

    /** The declared chords at each column, mm (`AutoMovieSolidJoin.IJoin.widths`); the part's null where its rail is one fixed station. */
    widths: { host: number[]; part: (number | null)[] };

    /** The kind of the curve's parameter (`AutoMovieSolidIntersection.Parameter`). */
    parameter: AutoMovieSolidIntersection.Parameter["kind"];

    /** The part's kept side in its station: the part continues past its rail at `s + sigma d`, `d > 0` (the phase parameter). */
    sigma: 1 | -1;
  }

  /**
   * Publish a join's blend.
   *
   * @param name The blend chain's name, such as `blend.arm.left`.
   * @param join The join.
   * @param count Columns, a positive multiple of 4 of at least 8.
   * @returns The blend, or null for an unsupported count, failed/nonfinite column, unrepresentable positive chord or unusable orientation anchor.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies both analytic ribbon 2-jets into two station layers and obtains the chart sign from the first host rail's analytic outward normal. The join owns unfolding; one sign anchor does not certify regularity between columns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One producer validates its count and column data before publishing the chain and shared trim records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses invalid arithmetic and zero/ambiguous orientation; neither the storage origin nor sampled mesh triangles decide the outward side.
   * @evidence contracts/development/common.md#meaningful-documentation States supported counts, nullable publication failures, parameter mapping and analytic outward ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates count columns, interpolates a fixed number of O(count) fields, then reads one analytic orientation jet; column solve costs belong to the join.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One local column array supplies layers, trim charts and the sign anchor; the returned join's existing rail cache handles repeated rail requests.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local columns are released after publication; the caller owns the O(count) chain and trim arrays, with no additional retained cache here.
   */
  export function of(
    name: string,
    join: AutoMovieSolidJoin.IJoin,
    count: number,
  ): IBlend | null {
    if (!Number.isInteger(count) || count < 8 || count % 4 !== 0) return null;
    const seed: number = join.curve.points[0]!.t;
    const columns: AutoMovieSolidJoin.IColumn[] = [];

    /** Each published ribbon component and outward source must have finite arithmetic. */
    const finite: (v: readonly number[]) => boolean = (
      v: readonly number[],
    ): boolean => v.every(Number.isFinite);
    for (let k: number = 0; k < count; k++) {
      const c: AutoMovieSolidJoin.IColumn | null = join.column(
        seed + (2 * Math.PI * k) / count,
      );
      if (c === null) return null;

      // A column with a non-finite rail or ribbon (a solve that failed
      // silently) is refused, never published into a chain.
      if (
        !(
          finite(c.start.point) &&
          finite(c.start.first) &&
          finite(c.start.second) &&
          finite(c.end.point) &&
          finite(c.end.first) &&
          finite(c.end.second) &&
          finite(c.outward) &&
          Math.hypot(...c.outward) > 0
        )
      )
        return null;
      columns.push(c);
    }

    const r0: AutoMovieSolidJoin.IColumn = columns[0]!;
    const published: { chain: IAutoMovieLoftChain; length: number } | null =
      strip(name, columns, r0.outward);
    if (published === null) return null;
    const { chain, length: L } = published;

    // A part's rail that does not wind round its phase encloses a region of
    // its chart; the part keeps the side its rail stands toward from the
    // curve (`partAcross`): inside when a step that way from the rail enters
    // the region (an island, as a nose along the face), else outside (a
    // hole). Taken as a hole always, a part whose kept skin lay inside was
    // drawn turned inside out, a pit where it should stand out.
    const partChart: [number, number][] = columns.map(
      (c: AutoMovieSolidJoin.IColumn): [number, number] => [
        c.rail.s,
        c.rail.phi,
      ],
    );
    const island: () => boolean = (): boolean => {
      const a: [number, number] = r0.rail.partAcross;
      const l: number = Math.hypot(a[0], a[1]);
      if (!(l > 0)) return false;
      const span: number = Math.max(
        ...partChart.map((p: [number, number]): number =>
          Math.hypot(p[0] - r0.rail.s, p[1] - r0.rail.phi),
        ),
      );
      const step: number = (1e-3 * span) / l;
      return !AutoMovieSolidCycle.kept(
        { kind: "hole", chart: partChart },
        r0.rail.s + step * a[0],
        r0.rail.phi + step * a[1],
        2 * Math.PI,
      );
    };
    return {
      chain,
      length: L,
      seed,
      host: {
        kind:
          join.curve.winding === 0
            ? "hole"
            : r0.rail.across[0] > 0
              ? "start"
              : "end",
        chart: columns.map(
          (c: AutoMovieSolidJoin.IColumn): [number, number] => [
            c.rail.host[0],
            c.rail.host[1],
          ],
        ),
        faces: columns.map(
          (c: AutoMovieSolidJoin.IColumn): number => c.rail.hostFace,
        ),
      },
      across: columns.map((c: AutoMovieSolidJoin.IColumn): [number, number] => [
        c.rail.across[0],
        c.rail.across[1],
      ]),
      partAcross: columns.map(
        (c: AutoMovieSolidJoin.IColumn): [number, number] => [
          c.rail.partAcross[0],
          c.rail.partAcross[1],
        ],
      ),
      curve: columns.map(
        (c: AutoMovieSolidJoin.IColumn): [number, number, number] => [
          c.rail.curve.point[0],
          c.rail.curve.point[1],
          c.rail.curve.point[2],
        ],
      ),
      widths: {
        host: columns.map(
          (_: AutoMovieSolidJoin.IColumn, k: number): number =>
            join.widths(seed + (2 * Math.PI * k) / count).host,
        ),
        part: columns.map(
          (_: AutoMovieSolidJoin.IColumn, k: number): number | null =>
            join.widths(seed + (2 * Math.PI * k) / count).part,
        ),
      },
      parameter: join.curve.parameter.kind,
      sigma: r0.rail.sigma > 0 ? 1 : -1,
      part: {
        kind:
          join.curve.partWinding === 0
            ? island()
              ? "island"
              : "hole"
            : r0.rail.sigma > 0
              ? "start"
              : "end",
        chart: partChart,
      },
    };
  }

  /**
   * The strip between two ribbon rails as a two-layer chain: the quintic
   * Hermite in station from the start ribbons (station 0) to the end ribbons
   * (station `L`, the columns' mean chord), each field the periodic cubic
   * B-spline through the columns in phase, in the world's level frame with
   * the height as the lift; its outward sign from `outward`, the start rail's
   * outward normal at column 0. A join's blend ({@link of}) and a split's
   * bands (`AutoMovieConstructionSplitRealize`) publish through it.
   *
   * A profiled strip (a port's `IAutoMovieConstructionPort.IProfile`) adds interior layers: at a share `t` of the span, each column's point,
   * cross derivative and second cross derivative per unit share, so the strip is the piecewise quintic Hermite through its rails and those
   * cross sections, C2 across each, and its rails keep their own 2-jets.
   *
   * @param name The chain's name.
   * @param columns The ribbon pairs at uniform phases `2 pi k / n`, `n` a multiple of 4 of at least 8.
   * @param outward The start surface's outward normal at column 0.
   * @param inner Interior cross sections in increasing share `t` in `(0, 1)`, each with one jet per column; absent, none.
   * @returns The chain and its station span `L`, mm, or null for a nonpositive or nonfinite span or an unusable orientation anchor.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A chain interval whose two layers carry values, slopes and second derivatives is the quintic Hermite in station (`AutoMovieStationHermite`), so copying each ribbon's point, first over `L` and second over `L^2` reproduces the blend columns exactly at the column phases; between them every field is the periodic cubic B-spline interpolant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder owns the ribbons-to-layers mapping and the outward sign, shared by both strip producers so their chains cannot drift apart.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a degenerate span or orientation instead of publishing; the column count and finiteness are the caller's admission.
   * @evidence contracts/development/common.md#meaningful-documentation States the layer fields, the station and phase meanings, the units and the refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass for the span and twelve O(n) periodic spline interpolations for n columns, then one chain jet for the sign.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's already evaluated ribbons are read once per field; nothing is re-evaluated on a surface.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns O(n) layer arrays owned by the caller; the layers reference the shared LEVEL/STILL factory records as the join's blend always has, and no column array is retained.
   */
  export function strip(
    name: string,
    columns: readonly {
      start: { point: Vec3; first: Vec3; second: Vec3 };
      end: { point: Vec3; first: Vec3; second: Vec3 };
    }[],
    outward: Vec3,
    inner: readonly { t: number; jets: readonly [Vec3, Vec3, Vec3][] }[] = [],
  ): { chain: IAutoMovieLoftChain; length: number } | null {
    const count: number = columns.length;

    // The station span: the mean chord between the rails.
    let chord: number = 0;
    for (const c of columns)
      chord += Math.hypot(
        ...[0, 1, 2].map(
          (i: number): number => c.end.point[i]! - c.start.point[i]!,
        ),
      );
    const L: number = chord / count;
    if (!(Number.isFinite(L) && L > 0)) return null;

    /** Every layer uses the same physical chord clock, with station derivatives scaled by L; `rows` holds each column's point and its two cross derivatives. */
    const layer: (
      y: number,
      rows: readonly (readonly [Vec3, Vec3, Vec3])[],
    ) => IAutoMovieLoftChain.ILayer = (
      y: number,
      rows: readonly (readonly [Vec3, Vec3, Vec3])[],
    ): IAutoMovieLoftChain.ILayer => {
      /** World X/Z ribbon components in the level storage plane. */
      const plane: (k: 0 | 1 | 2, by: number) => number[] = (
        k: 0 | 1 | 2,
        by: number,
      ): number[] =>
        AutoMovieSplineCurve.interpolate(
          rows.map((r: readonly [Vec3, Vec3, Vec3]): [number, number] => [
            r[k][0] * by,
            r[k][2] * by,
          ]),
        );

      /** The world Y component is the lift along the level frame's normal. */
      const height: (k: 0 | 1 | 2, by: number) => number[] = (
        k: 0 | 1 | 2,
        by: number,
      ): number[] =>
        AutoMovieSplineCurve.interpolate(
          rows.map((r: readonly [Vec3, Vec3, Vec3]): [number, number] => [
            r[k][1] * by,
            0,
          ]),
        ).slice(0, count);
      return {
        y,
        frame: LEVEL,
        frameSlopes: STILL,
        frameCurvatures: STILL,
        coefficients: plane(0, 1),
        slopes: plane(1, 1 / L),
        curvatures: plane(2, 1 / (L * L)),
        lift: height(0, 1),
        liftSlopes: height(1, 1 / L),
        liftCurvatures: height(2, 1 / (L * L)),
      };
    };
    const chain: IAutoMovieLoftChain = {
      name,
      basis: "spline",
      order: count,
      rule: "polar",
      samples: count,
      layers: [
        layer(
          0,
          columns.map((c: (typeof columns)[number]): [Vec3, Vec3, Vec3] => [
            c.start.point,
            c.start.first,
            c.start.second,
          ]),
        ),
        ...inner.map(
          (section: { t: number; jets: readonly [Vec3, Vec3, Vec3][] }): IAutoMovieLoftChain.ILayer =>
            layer(section.t * L, section.jets),
        ),
        layer(
          L,
          columns.map((c: (typeof columns)[number]): [Vec3, Vec3, Vec3] => [
            c.end.point,
            c.end.first,
            c.end.second,
          ]),
        ),
      ],
    };

    // A blend is an annulus, not a tube about its storage frame's origin.
    // Its rail continues the start surface's oriented surface. A regular
    // connected strip keeps that sign; one anchor is not a global
    // certificate for the periodic interpolation between columns.
    const edge: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, 0, 0);
    const facing: number = AutoMovieSolidVector.dot(
      AutoMovieSolidVector.cross(edge.s, edge.t),
      outward,
    );
    if (!(Number.isFinite(facing) && Math.abs(facing) > 0)) return null;
    chain.orientation = facing > 0 ? 1 : -1;
    return { chain, length: L };
  }
}

/** The world's level frame: `u = +X`, `v = +Z`, normal `v x u = +Y`. */
const LEVEL: AutoMovieLoftFrame.IFrame = {
  origin: [0, 0, 0],
  u: [1, 0, 0],
  v: [0, 0, 1],
};

/** A frame that does not move with station. */
const STILL: AutoMovieLoftFrame.IFrame = {
  origin: [0, 0, 0],
  u: [0, 0, 0],
  v: [0, 0, 0],
};
