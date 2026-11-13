import type { IAutoMovieConstructionSplit } from "@automovie/interface";

import type { AutoMovieConstructionSplitSeam } from "./AutoMovieConstructionSplitSeam";
import { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or derivative, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;
const { add, combine, cross, dot, norm, scale, sub, unit } =
  AutoMovieSolidVector;

/**
 * One band of a split (`IAutoMovieConstructionSplit`): the join strip between a child's loop on the host's end and the child's rail, published as a two-layer chain (`AutoMovieSolidBlendChain.strip`).
 *
 * The loop's clock `c_k = 2 pi k / n` over `n` columns: for `k <= n/2` the host ring arc, linear in host phase, for `k > n/2` the straight chord from the arc's end point back to its start point. At each column the start ribbon is the host surface's 2-jet leaving its end (`AutoMovieSolidRibbon`) on the arc, and on the chord the declared ruling in the end section's plane, square to the chord and toward the band's own arc (first derivative `L` times that unit, second zero), so both bands meet G1 across the chord; the end ribbon is the child's 2-jet at its rail leaving into its kept side, each first derivative of length `L`, the column's rail-to-rail chord (`AutoMovieSolidBlend`'s chord law). In a crease window the end ribbon's first derivative becomes that chord and its second zero, by the window's C2 weight. The band's ribbons are then scaled by one common factor, at most 1, at which every column's Bezier control points advance monotonically along its chord, so no column turns back (a band whose rails stand far apart across a short drop otherwise folds); the scale changes only the cross parameter's speed, so the G2 meetings hold.
 *
 * With a curved seam (`IAutoMovieConstructionSplit.IProfile`, `AutoMovieConstructionSplitSeam`) the chord columns stand on the seam at equal arclength shares, ruled by the seam plane's normal toward the band's arc, and within the corner window of each fork both sides' ribbons turn by the quintic smoothstep to the inward diagonal at the fork: the arc's inside the host's tangent plane (G1 there, its second derivative falling with the turn), the seam's toward its direction away from the fork. The corner column then leaves the fork transverse to both the arc and the seam.
 *
 * The child's phase at each column is the one whose rail point stands at the loop point's angle about the rail ring's centroid, in the ring's Newell plane. It is admitted only when the ring's angle and the loop's angle both turn once, strictly monotonically, round that centroid (construction.md, Tree: measure monotonicity before choosing a parameter); otherwise the band is refused with the reason.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, both ribbons, the crease, the correspondence and its admission.
 * @evidence contracts/development/design.md#principled-representation Represents One band of a split (`IAutoMovieConstructionSplit`): the join strip between a child's loop on the host's end and the child's rail, published as a two-layer chain (`AutoMovieSolidBlendChain.strip`): companion namespace of 13 members (`ISide`, `IInput`, `IBand`, `IStrip`, `create`, `refine`, ...); units and frames named in its text: radians, degrees, degree, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionSplitBand` in packages/engine/src/geometry/construction/AutoMovieConstructionSplitBand.ts; its surface is the 13 members listed and the text shows 7 other files naming it, mostly packages/engine (3), packages/human (2), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds a use of `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieConstructionSplitBand {
  /**
   * One side of a band: the face's surface, the rail's station on it and the station's sign into the band's continuation.
   *
   * @evidence contracts/development/design.md#principled-representation A rail at one station with a station sign fixes the ribbon's chart direction `(into, 0)`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three fields are the whole side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The station is the realization's, not searched here.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit and sign meaning.
   */
  export interface ISide {
    /** The face's surface, mm. */
    surface: IAutoMovieSolidSurface;

    /** The rail's station, mm. */
    station: number;

    /** The station's sign leaving the rail: out of the host into the band, or from the child's rail into the child's kept side. */
    into: 1 | -1;

    /**
     * The rail's station at a phase when the rail is a curve round the face (a port's `rails`), mm; absent, `station` at every phase.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the unit and the absent case.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; the caller's curve is the implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body; its cost is the caller's curve.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
     */
    along?: (psi: number) => number;
  }

  /**
   * The rail's station on a side at a phase: its curve's when it has one, else its one station.
   *
   * @param side The side.
   * @param psi The side's phase, radians.
   * @returns The station, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the side's own rail curve, or its one station, so every reader of the child's rail takes the same station at a phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The curve is the caller's; nothing is clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States both cases and the units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time beyond the curve's own reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reader coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function railAt(side: ISide, psi: number): number {
    return side.along === undefined ? side.station : side.along(psi);
  }

  /**
   * What one band is built from.
   *
   * @evidence contracts/development/design.md#principled-representation The host's arc, its end normal and the child's rail determine the loop and both ribbons.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The split's per-band slice of its declaration, in kernel units.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only; admission belongs to the realization.
   * @evidence contracts/development/common.md#meaningful-documentation States the arc's orientation, the normal's direction and the units.
   */
  export interface IInput {
    /** The band's chain name. */
    name: string;

    /** The host side: its surface, its end station, `into` leaving the host. */
    host: ISide;

    /** The arc's start and end host phases, radians, increasing. */
    arc: [number, number];

    /** The host end section's unit normal pointing out of the host. */
    normal: Vec3;

    /** The child side: its surface, its rail station, `into` into its kept side. */
    child: ISide;

    /** Columns, a multiple of 4 of at least 8. */
    count: number;

    /** The declared crease window, or absent. */
    crease?: IAutoMovieConstructionSplit.ICrease;

    /** The curved seam both bands share and the ribbons' turn at each fork, radians of clock (`IAutoMovieConstructionSplit.IProfile`), or absent for the straight chord. */
    seam?: { curve: AutoMovieConstructionSplitSeam.ISeam; corner: number };

    /** How the child's rail is matched to the loop (`IAutoMovieConstructionSplit.IChild.correspondence`); absent, by angle. */
    correspondence?: "angle" | "length";
  }

  /**
   * One built band.
   *
   * @evidence contracts/development/design.md#principled-representation Publishes the strip chain with the column data the body's cycles need, so the shared vertices are the columns' own points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The chain, its surface and three column arrays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Column values are the ones the strip interpolates, not resampled.
   * @evidence contracts/development/common.md#meaningful-documentation States each array's indexing and unit.
   */
  export interface IBand extends IStrip {
    /** The arc's host phases at columns `0..n/2`, radians. */
    hostPhases: number[];
  }

  /**
   * One built strip from a loop to a child's rail.
   *
   * @evidence contracts/development/design.md#principled-representation Publishes the strip chain with the column data the body's cycles need, so the shared vertices are the columns' own points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The chain, its surface and the column arrays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Column values are the ones the strip interpolates, not resampled.
   * @evidence contracts/development/common.md#meaningful-documentation States each array's indexing and unit.
   */
  export interface IStrip {
    /** The strip chain: station 0 the loop, station `length` the child's rail. */
    chain: IAutoMovieLoftChain;

    /** The chain's surface, chart `(station, clock)`. */
    surface: IAutoMovieSolidSurface;

    /** The station span, mm. */
    length: number;

    /** The loop's points at every column, mm. */
    loop: Vec3[];

    /** The child's rail phase at every column, radians, unwrapped along the clock. */
    childPhases: number[];

    /** The ribbons' scale against the chord law: the factor applied to the whole band, each forward column's own largest monotone factor found, and the columns whose ribbon points back against their chord (kept, turning back). */
    scale: { applied: number; columns: number[]; backward: number[] };
  }

  /**
   * Build one band, or the reason it cannot be built.
   *
   * @param input The band's sides, arc, normal, columns and crease.
   * @returns The band, or the refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each column's ribbons are the sides' own 2-jets (or the declared ruling and crease chord) scaled to the column chord, as the join blend scales its ribbons.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Loop, correspondence, columns, then the shared strip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses collapsed or nonfinite columns and a strip without orientation or surface.
   * @evidence contracts/development/common.md#meaningful-documentation States the refusals in its result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in columns apart from the correspondence's fixed-depth bisections.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The arc jets serve both the loop and the scale.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary columns are released; the result is caller-owned.
   */
  export function create(input: IInput): IBand | string {
    const factor: number = refine(input);
    const made: IBand | string = build(
      factor === 1 ? input : { ...input, count: factor * input.count },
    );
    if (typeof made === "string" || factor === 1) return made;
    const every: <T>(list: T[]) => T[] = <T>(list: T[]): T[] =>
      list.filter((_: T, j: number): boolean => j % factor === 0);
    return {
      ...made,
      hostPhases: every(made.hostPhases),
      loop: every(made.loop),
      childPhases: every(made.childPhases),
    };
  }

  /**
   * The strip's columns per mesh column for a curved seam: at a fork the
   * clock spline's tangent mixes the one-sided chords to its neighbours, and
   * a chord deviates from its side's tangent by half that side's turn per
   * column, out of the host's tangent plane where the ring curves out of it
   * (O(h kappa), test_construction_split_seam: 7.0 deg at 11.25 deg per
   * column). The strip is therefore built on `F` times the columns, `F` the
   * largest turn between adjacent chords next to either fork, on the arc and
   * on the seam, in degrees, rounded up, so each one-sided chord deviates by
   * at most half a degree; the mesh columns are every `F`-th strip column, at
   * the same clocks, so the shared vertices are the strip's own knots. At
   * most 16; 1 for the straight chord, whose corners are declared creases.
   */
  function refine(input: IInput): number {
    const seam: IInput["seam"] = input.seam;
    if (seam === undefined) return 1;
    const n: number = input.count;
    const m: number = n / 2;
    const [alpha, beta]: [number, number] = input.arc;
    const ring: (k: number) => Vec3 = (k: number): Vec3 =>
      input.host.surface.jet(
        input.host.station,
        alpha + ((beta - alpha) * k) / m,
      ).p;
    const start: Vec3 = ring(0);
    const finish: Vec3 = ring(m);
    const reversed: boolean =
      norm(sub(seam.curve.ends[0], finish)) >
      norm(sub(seam.curve.ends[0], start));
    const onSeam: (k: number) => Vec3 = (k: number): Vec3 =>
      seam.curve.at(reversed ? 1 - (k - m) / m : (k - m) / m).point;
    const turn: (a: Vec3, b: Vec3, c: Vec3) => number = (
      a: Vec3,
      b: Vec3,
      c: Vec3,
    ): number => {
      const u: Vec3 | null = unit(sub(b, a));
      const v: Vec3 | null = unit(sub(c, b));
      return u === null || v === null
        ? 0
        : (Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) * 180) / Math.PI;
    };
    const turns: number[] = [
      turn(ring(0), ring(1), ring(2)),
      turn(ring(m - 2), ring(m - 1), ring(m)),
      turn(finish, onSeam(m + 1), onSeam(m + 2)),
      turn(onSeam(n - 2), onSeam(n - 1), start),
    ];
    return Math.min(16, Math.max(1, Math.ceil(Math.max(...turns))));
  }

  /** One band on exactly `input.count` columns. */
  function build(input: IInput): IBand | string {
    const n: number = input.count;
    const m: number = n / 2;
    const [alpha, beta]: [number, number] = input.arc;
    const hostPhases: number[] = Array.from(
      { length: m + 1 },
      (_: unknown, k: number): number => alpha + ((beta - alpha) * k) / m,
    );
    const ring: IAutoMovieSolidSurface.IJet[] = hostPhases.map(
      (phi: number): IAutoMovieSolidSurface.IJet =>
        input.host.surface.jet(input.host.station, phi),
    );
    const start: Vec3 = ring[0]!.p;
    const finish: Vec3 = ring[m]!.p;
    // A curved seam: chord column k stands at the share `(k - m) / m` of the
    // seam's length from `finish`; the seam's own share runs from its first
    // end, which is this band's `start` for the band whose arc leaves it
    // (child 0) and its `finish` for the other, so both bands read the same
    // points (band 0's column k is band 1's `3 m - k`).
    const seam: IInput["seam"] = input.seam;
    const reversed: boolean =
      seam !== undefined &&
      norm(sub(seam.curve.ends[0], finish)) >
        norm(sub(seam.curve.ends[0], start));
    const seamAt: (AutoMovieConstructionSplitSeam.IPoint | null)[] = Array.from(
      { length: n },
      (_: unknown, k: number): AutoMovieConstructionSplitSeam.IPoint | null =>
        seam === undefined || k <= m
          ? null
          : seam.curve.at(reversed ? 1 - (k - m) / m : (k - m) / m),
    );
    const loop: Vec3[] = Array.from(
      { length: n },
      (_: unknown, k: number): Vec3 =>
        k <= m
          ? [...ring[k]!.p]
          : (seamAt[k]?.point ??
            add(finish, scale(sub(start, finish), (k - m) / m))),
    );
    // The start ribbon: the host's 2-jet leaving its end on the arc; on the
    // chord the declared ruling in the end section's plane, square to the
    // chord, toward this band's own arc. The two bands then leave their
    // shared chord in opposite directions with the end plane as their common
    // tangent plane, G1 across the seam (the crotch's underside a saddle
    // facing out along the end normal). A ruling along the end normal would
    // send both bands off the chord in the same direction: two sheets
    // tangent back to back, a tent along the seam.
    const along: Vec3 | null = unit(sub(start, finish));
    const toward: Vec3 = sub(
      ring[Math.floor(m / 2)]!.p,
      scale(add(start, finish), 0.5),
    );
    // A curved seam's ruling: the seam plane's normal toward this band's arc.
    const lateral: Vec3 | null =
      seam !== undefined
        ? dot(seam.curve.normal, toward) === 0
          ? null
          : scale(seam.curve.normal, Math.sign(dot(seam.curve.normal, toward)))
        : along === null
          ? null
          : unit(
              sub(
                sub(toward, scale(along, dot(toward, along))),
                scale(input.normal, dot(toward, input.normal)),
              ),
            );
    if (lateral === null)
      return seam === undefined
        ? "the chord gives no direction square to it in the end plane toward the arc"
        : "the seam plane holds the direction toward the band's arc";
    // The ribbons' turn at the forks (`IAutoMovieConstructionSplit.IProfile`):
    // `pi / 4` at a fork, falling by the quintic smoothstep to 0 at `corner`
    // of clock from it, so the ribbon fields stay C2 along the loop.
    const step: number = (2 * Math.PI) / n;
    const share: (d: number) => number = (d: number): number => {
      if (seam === undefined || !(d < seam.corner)) return 0;
      const x: number = d / seam.corner;
      return 1 - x * x * x * (10 - 15 * x + 6 * x * x);
    };
    const near: (
      k: number,
      L: number,
    ) => AutoMovieSolidRibbon.IRibbon | string = (
      k: number,
      L: number,
    ): AutoMovieSolidRibbon.IRibbon | string => {
      if (k > m) {
        const reading: AutoMovieConstructionSplitSeam.IPoint | null =
          seamAt[k] ?? null;
        if (reading === null)
          return {
            point: loop[k]!,
            first: scale(lateral, L),
            second: [0, 0, 0],
          };
        // On the seam: from the ruling toward the seam's direction away from
        // the nearer fork. Rising share from `finish` is the seam's tangent
        // unless the seam runs the other way.
        const fromFinish: number = (k - m) * step;
        const fromStart: number = (n - k) * step;
        const angle: number =
          (Math.PI / 4) * share(Math.min(fromFinish, fromStart));
        const away: Vec3 = scale(
          reading.tangent,
          (fromFinish <= fromStart ? 1 : -1) * (reversed ? -1 : 1),
        );
        return {
          point: loop[k]!,
          first: scale(
            add(scale(lateral, Math.cos(angle)), scale(away, Math.sin(angle))),
            L,
          ),
          second: [0, 0, 0],
        };
      }
      const hostSpeed: number = norm(ring[k]!.u);
      if (!(hostSpeed > 0))
        return `column ${k}: the host's station speed vanishes at its end`;
      const own: AutoMovieSolidRibbon.IRibbon = AutoMovieSolidRibbon.of(
        input.host.surface,
        input.host.station,
        hostPhases[k]!,
        input.host.into,
        0,
        L / hostSpeed,
      );
      const w: number = share(Math.min(k, m - k) * step);
      if (w === 0) return own;
      // On the arc: from the host's own ribbon toward the ruling, inside the
      // host's tangent plane (the ruling's part square to the host normal and
      // to the ribbon), so the band stays G1 to the host; its second
      // derivative falls with the turn's share.
      const ahead: Vec3 | null = unit(own.first);
      const normal: Vec3 | null = unit(cross(ring[k]!.u, ring[k]!.v));
      if (ahead === null || normal === null)
        return `column ${k}: the host's tangent plane is degenerate`;
      const side: Vec3 | null = unit(
        sub(
          sub(lateral, scale(normal, dot(lateral, normal))),
          scale(ahead, dot(lateral, ahead)),
        ),
      );
      if (side === null)
        return `column ${k}: the seam's ruling has no direction in the host's tangent plane square to its ribbon`;
      const angle: number = (Math.PI / 4) * w;
      return {
        point: own.point,
        first: scale(
          add(scale(ahead, Math.cos(angle)), scale(side, Math.sin(angle))),
          L,
        ),
        second: scale(own.second, 1 - w),
      };
    };
    // The outward side: the host's outward normal at column 0.
    const outward: Vec3 | null = unit(
      scale(cross(ring[0]!.u, ring[0]!.v), input.host.surface.orientation),
    );
    if (outward === null)
      return "the host's tangent plane at the arc's start is degenerate";
    const made: IStrip | string = strip(
      input.name,
      loop,
      near,
      outward,
      input.child,
      input.crease,
      input.correspondence ?? "angle",
    );
    return typeof made === "string" ? made : { ...made, hostPhases };
  }

  /**
   * One stretch of a band's loop in a split into more than two: a host arc, or a seam read from one of its forks to the other.
   *
   * @evidence contracts/development/design.md#principled-representation An arc is two host phases and a seam a built curve and the direction the loop reads it in; together they are every stretch a loop is made of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A discriminated pair and its column count.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only; the realization decides the stretches and their columns.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit and direction.
   */
  export type IStretch =
    | { kind: "arc"; from: number; to: number; columns: number }
    | { kind: "seam"; curve: AutoMovieConstructionSplitSeam.ISeam; forward: boolean; columns: number };

  /**
   * What one band of a split into more than two is built from.
   *
   * @evidence contracts/development/design.md#principled-representation The loop's stretches, the host's and the child's sides and the corner turn determine the loop and both ribbons, as one arc and one seam do for a two-way split.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The split's per-band slice of its declaration, in kernel units.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only; admission belongs to the realization.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's role and unit.
   */
  export interface IFanInput {
    /** The band's chain name. */
    name: string;

    /** The host side: its surface, its end station, `into` leaving the host. */
    host: ISide;

    /** The child side: its surface, its rail station, `into` into its kept side. */
    child: ISide;

    /** The loop's stretches in clock order, the first an arc and arcs and seams alternating; their columns sum to the band's. */
    stretches: IStretch[];

    /** The ribbons' turn at each fork, radians of clock. */
    corner: number;

    /** The declared crease window, or absent. */
    crease?: IAutoMovieConstructionSplit.ICrease;

    /** How the child's rail is matched to the loop (IAutoMovieConstructionSplit.IChild.correspondence); absent, by angle. */
    correspondence?: "angle" | "length";

    /** The share of its length a ribbon keeps at a fork (`IAutoMovieConstructionSplit.IProfile.reach`), in `(0, 1]`; absent, 1. */
    reach?: number;

    /** Whether the bands leave the host's arc square to its end ring (`IAutoMovieConstructionSplit.IProfile.square`); absent, along its station line. */
    square?: boolean;
  }

  /**
   * Build one band of a split into more than two, or the reason it cannot be built.
   *
   * The loop runs through its stretches in order: on an arc its columns stand at equal steps of host phase from the arc's first phase, on a
   * seam at equal arclength shares from the fork it is read from, and a seam's first column is the fork that ends the arc before it. The
   * ribbons are a two-way band's (`create`): on an arc the host's own 2-jet, on a seam the seam plane's normal toward the band's own loop,
   * and within `corner` of clock of each fork both turn by the quintic smoothstep to the inward diagonal there, the arc's toward the
   * adjacent seam's ruling inside the host's tangent plane and the seam's toward its direction away from the fork. With `square` an arc's
   * ribbon is the host's 2-jet along the chart line square to the end ring instead of along the station line. Two bands that read one
   * seam from its two ends therefore meet G1 across it.
   *
   * @param input The band's sides, stretches, corner and crease.
   * @returns The band with each column's host phase (NaN on a seam's inner columns), or the refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The two-way band's ribbons applied stretch by stretch, so every seam is ruled and every fork turned alike, and the shared strip builder (`strip`) does the rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Columns, ribbons, then the shared strip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a loop that does not start on an arc, a column count that does not add up, a degenerate tangent plane and a seam whose plane holds the direction toward the band.
   * @evidence contracts/development/common.md#meaningful-documentation States the loop, the ribbons, the corner and the refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in columns apart from the strip's correspondence.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each column's host jet serves its point and its ribbon.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary columns are released; the result is caller-owned.
   */
  export function fan(input: IFanInput, count: number): (IStrip & { phases: number[] }) | string {
    const stretches: IStretch[] = input.stretches;
    if (stretches[0]?.kind !== "arc") return "the loop does not start on an arc";
    if (stretches.reduce((sum: number, s: IStretch): number => sum + s.columns, 0) !== count) return "the stretches' columns do not add up to the band's";
    const n: number = count;
    const step: number = (2 * Math.PI) / n;

    // Each column: its stretch and its index in it; a stretch's first column is a fork.
    const owner: number[] = [];
    const within: number[] = [];
    stretches.forEach((s: IStretch, i: number): void => {
      for (let j: number = 0; j < s.columns; ++j) {
        owner.push(i);
        within.push(j);
      }
    });
    const previous = (i: number): IStretch => stretches[(i - 1 + stretches.length) % stretches.length]!;

    // A seam's first column is the fork ending the arc before it: read as that arc's last phase.
    const phases: number[] = owner.map((i: number, k: number): number => {
      const s: IStretch = stretches[i]!;
      if (s.kind === "arc") return s.from + ((s.to - s.from) * within[k]!) / s.columns;
      const before: IStretch = previous(i);
      return within[k] === 0 && before.kind === "arc" ? before.to : NaN;
    });
    const jets: (IAutoMovieSolidSurface.IJet | null)[] = phases.map((phi: number): IAutoMovieSolidSurface.IJet | null => (Number.isNaN(phi) ? null : input.host.surface.jet(input.host.station, phi)));
    const share = (s: Extract<IStretch, { kind: "seam" }>, j: number): number => (s.forward ? j / s.columns : 1 - j / s.columns);
    const loop: Vec3[] = owner.map((i: number, k: number): Vec3 => {
      const jet: IAutoMovieSolidSurface.IJet | null = jets[k]!;
      if (jet !== null) return [jet.p[0]!, jet.p[1]!, jet.p[2]!];
      const s: IStretch = stretches[i]!;
      return s.kind === "seam" ? s.curve.at(share(s, within[k]!)).point : [NaN, NaN, NaN];
    });
    const centroid: Vec3 = scale(loop.reduce((sum: Vec3, p: Vec3): Vec3 => add(sum, p), [0, 0, 0]), 1 / n);

    // Each seam's ruling: its plane's normal toward this band's loop.
    const ruling: (Vec3 | null)[] = stretches.map((s: IStretch): Vec3 | null => {
      if (s.kind !== "seam") return null;
      const middle: Vec3 = scale(add(s.curve.ends[0], s.curve.ends[1]), 0.5);
      const toward: number = dot(s.curve.normal, sub(centroid, middle));
      return toward === 0 ? null : scale(s.curve.normal, Math.sign(toward));
    });
    if (stretches.some((s: IStretch, i: number): boolean => s.kind === "seam" && ruling[i] === null)) return "a seam plane holds the direction toward the band's loop";
    const turn = (d: number): number => {
      if (!(d < input.corner)) return 0;
      const x: number = d / input.corner;
      return 1 - x * x * x * (10 - 15 * x + 6 * x * x);
    };
    // The ribbons' reach toward each fork (`IAutoMovieConstructionSplit.IProfile.reach`): first derivative by the share, second by its
    // square, so each column only slows across its start and its curvature there, and the band's G2 to the host, are kept.
    const reach: number = input.reach ?? 1;
    const near = (k: number, L: number): AutoMovieSolidRibbon.IRibbon | string => {
      const made: AutoMovieSolidRibbon.IRibbon | string = turned(k, L);
      if (typeof made === "string" || reach === 1) return made;
      const lambda: number = reach + (1 - reach) * (1 - turn(Math.min(within[k]!, stretches[owner[k]!]!.columns - within[k]!) * step));
      return { point: made.point, first: scale(made.first, lambda), second: scale(made.second, lambda * lambda) };
    };
    const turned = (k: number, L: number): AutoMovieSolidRibbon.IRibbon | string => {
      const i: number = owner[k]!;
      const s: IStretch = stretches[i]!;
      const fromStart: number = within[k]! * step;
      const toEnd: number = (s.columns - within[k]!) * step;
      const jet: IAutoMovieSolidSurface.IJet | null = jets[k]!;
      if (jet === null && s.kind === "seam") {
        const reading: AutoMovieConstructionSplitSeam.IPoint = s.curve.at(share(s, within[k]!));
        const angle: number = (Math.PI / 4) * turn(Math.min(fromStart, toEnd));
        const along: Vec3 = scale(reading.tangent, s.forward ? 1 : -1);
        const away: Vec3 = scale(along, fromStart <= toEnd ? 1 : -1);
        return { point: loop[k]!, first: scale(add(scale(ruling[i]!, Math.cos(angle)), scale(away, Math.sin(angle))), L), second: [0, 0, 0] };
      }
      if (jet === null) return `column ${k}: neither on an arc nor on a seam`;
      // The chart direction the band leaves along: the station line, or with `square` the line whose image is square to the end ring,
      // `(into, -into (S_u . S_v) / (S_v . S_v))`, so the host's 2-jet along it keeps the band G2 to the host.
      const across: number = input.square === true && dot(jet.v, jet.v) > 0 ? (-input.host.into * dot(jet.u, jet.v)) / dot(jet.v, jet.v) : 0;
      const hostSpeed: number = norm(add(scale(jet.u, input.host.into), scale(jet.v, across)));
      if (!(hostSpeed > 0)) return `column ${k}: the host's station speed vanishes at its end`;
      const own: AutoMovieSolidRibbon.IRibbon = AutoMovieSolidRibbon.of(input.host.surface, input.host.station, phases[k]!, input.host.into, across, L / hostSpeed);
      // On an arc the nearer fork is its first column or the next seam's; a seam's first column is that seam's own fork.
      const onArc: boolean = s.kind === "arc";
      const d: number = onArc ? Math.min(fromStart, toEnd) : 0;
      const seamIndex: number = onArc ? (fromStart <= toEnd ? (i - 1 + stretches.length) % stretches.length : (i + 1) % stretches.length) : i;
      const w: number = turn(d);
      const lateral: Vec3 | null = ruling[seamIndex] ?? null;
      if (w === 0 || lateral === null) return own;
      const ahead: Vec3 | null = unit(own.first);
      const normal: Vec3 | null = unit(cross(jet.u, jet.v));
      if (ahead === null || normal === null) return `column ${k}: the host's tangent plane is degenerate`;
      const side: Vec3 | null = unit(sub(sub(lateral, scale(normal, dot(lateral, normal))), scale(ahead, dot(lateral, ahead))));
      if (side === null) return `column ${k}: the seam's ruling has no direction in the host's tangent plane square to its ribbon`;
      const angle: number = (Math.PI / 4) * w;
      return { point: own.point, first: scale(add(scale(ahead, Math.cos(angle)), scale(side, Math.sin(angle))), L), second: scale(own.second, 1 - w) };
    };
    const first: IAutoMovieSolidSurface.IJet = jets[0]!;
    const outward: Vec3 | null = unit(scale(cross(first.u, first.v), input.host.surface.orientation));
    if (outward === null) return "the host's tangent plane at the loop's start is degenerate";
    const made: IStrip | string = strip(input.name, loop, near, outward, input.child, input.crease, input.correspondence ?? "angle");
    return typeof made === "string" ? made : { ...made, phases };
  }

  /**
   * A band's strip from its loop to a child's rail: the shared builder of a
   * split's bands and a port's band.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Matches the child's rail to the loop by angle about the rail's centroid, pairs each loop ribbon with the child's own 2-jet at its rail (or the crease's chord arrival), scales both by the monotone factor and publishes the join's strip chain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The caller supplies only its loop and its start ribbons; correspondence, scale and publication are shared.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a nonmonotone correspondence, collapsed or nonfinite columns and a strip without orientation or surface; a column whose ribbon points back against its chord is kept unaltered and named in `scale.backward`, never patched.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the steps and the refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in columns apart from the correspondence's bisections and each column's scale search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each column's child jet serves its chord, its ribbon and its scale.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary columns are released; the result is caller-owned.
   *
   * @param name The band's chain name.
   * @param loop The loop's points at the `n` clocks `2 pi k / n`, mm.
   * @param near The start ribbon at column `k` for a column chord of length `L`, or a refusal.
   * @param outward The start surface's outward normal at column 0.
   * @param child The child side: its surface, its rail station, `into` into its kept side.
   * @param crease The declared crease window on the child side, or absent.
   * @param correspondence How the child's rail is matched to the loop: by angle about the rail's centroid, or by arclength share.
   * @returns The strip, or the refusal.
   */
  export function strip(
    name: string,
    loop: readonly Vec3[],
    near: (k: number, L: number) => AutoMovieSolidRibbon.IRibbon | string,
    outward: Vec3,
    child: ISide,
    crease?: IAutoMovieConstructionSplit.ICrease,
    correspondence: "angle" | "length" = "angle",
  ): IStrip | string {
    const n: number = loop.length;
    const childPhases: number[] | string = correspondence === "length" ? lengths(child, loop) : phases(child, loop);
    if (typeof childPhases === "string") return childPhases;

    const columns: {
      start: AutoMovieSolidRibbon.IRibbon;
      end: AutoMovieSolidRibbon.IRibbon;
    }[] = [];
    for (let k: number = 0; k < n; ++k) {
      const station: number = railAt(child, childPhases[k]!);
      const far: IAutoMovieSolidSurface.IJet = child.surface.jet(
        station,
        childPhases[k]!,
      );
      const chord: Vec3 = sub(far.p, loop[k]!);
      const L: number = norm(chord);
      const childSpeed: number = norm(far.u);
      if (!(Number.isFinite(L) && L > 0 && childSpeed > 0))
        return `column ${k}: the loop point and the child's rail point coincide or the child's station speed vanishes`;
      const start: AutoMovieSolidRibbon.IRibbon | string = near(k, L);
      if (typeof start === "string") return start;
      const own: AutoMovieSolidRibbon.IRibbon = AutoMovieSolidRibbon.of(
        child.surface,
        station,
        childPhases[k]!,
        child.into,
        0,
        L / childSpeed,
      );
      const w: number = weight((2 * Math.PI * k) / n, crease);
      const end: AutoMovieSolidRibbon.IRibbon =
        w === 0
          ? own
          : {
              point: own.point,
              first: combine([
                [1 - w, own.first],
                [w, chord],
              ]),
              second: scale(own.second, 1 - w),
            };
      if (
        ![
          start.point,
          start.first,
          start.second,
          end.point,
          end.first,
          end.second,
        ].every((v: readonly number[]): boolean => v.every(Number.isFinite))
      )
        return `column ${k}: a ribbon is not finite`;
      columns.push({ start, end });
    }

    // The ribbons' common scale: the largest found factor `f <= 1` of the
    // chord law at which every column advances monotonically along its own
    // chord (`monotone`), so no column turns back on itself; scaling a
    // ribbon's first derivative by `f` and its second by `f^2` changes only
    // the cross parameter's speed, so both rails stay G2. One factor for the
    // whole band keeps the ribbon fields as smooth along the loop as the
    // chord law's. Debt: a factor varying smoothly along the loop would
    // keep longer tangents where the turn is gentle.
    // A column whose ribbon points back against its chord turns back at any
    // scale (its child rail point lies behind the side's own tangent
    // continuation, as where a port's ring and the child's rail differ in
    // shape); it is kept, published in `scale.backward`, and turns back by
    // at most the scaled ribbon's reach, which the factor below shortens, so
    // the band joins and its consumers measure the turn instead of losing
    // the part. One pointing along its chord is monotone for every small
    // enough factor (its control projections tend to 0, 0+, 0+, 1-, 1-, 1),
    // so the search below, over the forward columns, ends. Each failing
    // column lowers the factor by halving, then bisection between its last
    // failing and first passing values; a pass repeats until every forward
    // column holds at the final factor.
    const backward: number[] = [];
    for (const [k, column] of columns.entries()) {
      const chord: Vec3 = sub(column.end.point, column.start.point);
      if (
        !(
          dot(chord, column.start.first) > 0 && dot(chord, column.end.first) > 0
        )
      )
        backward.push(k);
    }
    const forward: typeof columns = columns.filter(
      (_: (typeof columns)[number], k: number): boolean =>
        !backward.includes(k),
    );
    const factors: number[] = [];
    for (const column of forward) {
      const own: number | null = largest(column, 1);
      if (own === null)
        return "no ribbon scale keeps every column monotone along its chord";
      factors.push(own);
    }
    let factor: number = factors.length === 0 ? 1 : Math.min(...factors);
    for (let settled: boolean = false; !settled; ) {
      settled = true;
      for (const column of forward) {
        if (monotone(column, factor)) continue;
        const lower: number | null = largest(column, factor);
        if (lower === null)
          return "no ribbon scale keeps every column monotone along its chord";
        factor = lower;
        settled = false;
      }
    }
    const scaled: typeof columns = columns.map(
      (column: (typeof columns)[number]): (typeof columns)[number] => ({
        start: {
          point: column.start.point,
          first: scale(column.start.first, factor),
          second: scale(column.start.second, factor * factor),
        },
        end: {
          point: column.end.point,
          first: scale(column.end.first, factor),
          second: scale(column.end.second, factor * factor),
        },
      }),
    );

    const published: { chain: IAutoMovieLoftChain; length: number } | null =
      AutoMovieSolidBlendChain.strip(name, scaled, outward);
    if (published === null)
      return "the strip has no positive span or no outward side";
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(
      published.chain,
    );
    if (surface === null) return "the strip chain carries no surface";
    return {
      chain: published.chain,
      surface,
      length: published.length,
      loop: [...loop],
      childPhases,
      scale: { applied: factor, columns: factors, backward },
    };
  }

  /**
   * A crease window's weight at a clock: 1 inside `[start, end]`, falling to 0 over `transition` on each side by `1 - (10 x^3 - 15 x^4 + 6 x^5)`, `x` the clock distance from the window over the transition, so the weight is C2 in the clock; 0 without a crease.
   *
   * @param c The clock, radians.
   * @param crease The window, or absent.
   * @returns The weight in `[0, 1]`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The quintic smoothstep has zero first and second derivatives at both ends, so the weighted ribbons stay C2 along the loop.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One periodic distance and one polynomial.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window is authored; no geometry decides it.
   * @evidence contracts/development/common.md#meaningful-documentation States the window, the fall law and the absent case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scalar function coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(
    c: number,
    crease: IAutoMovieConstructionSplit.ICrease | undefined,
  ): number {
    if (crease === undefined) return 0;
    const turn: number = 2 * Math.PI;
    const x: number = (((c - crease.start) % turn) + turn) % turn;
    const span: number = crease.end - crease.start;
    if (x <= span) return 1;
    const d: number = Math.min(x - span, turn - x);
    if (d >= crease.transition) return 0;
    const t: number = d / crease.transition;
    return 1 - t * t * t * (10 - 15 * t + 6 * t * t);
  }

  /**
   * One column's two ribbons: the host-side (or chord) ribbon at the band's start and the child-side one at its end, per unit of the cross parameter.
   *
   * @evidence contracts/development/design.md#principled-representation The quintic Hermite column is fixed by these two 2-jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two ribbons, as the join's column carries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only.
   * @evidence contracts/development/common.md#meaningful-documentation States which side each ribbon is and its parameter.
   */
  export interface IColumn {
    /** The start ribbon, at the loop. */
    start: AutoMovieSolidRibbon.IRibbon;

    /** The end ribbon, at the child's rail. */
    end: AutoMovieSolidRibbon.IRibbon;
  }

  /**
   * Whether a column, its ribbons scaled by `f` (first by `f`, second by
   * `f^2`), advances monotonically along its chord: the quintic Hermite in
   * the cross parameter `w` written as its six Bezier control points
   * (curves.md, Preserve the Actual Parameter, with `h = 1`), each projected
   * on the chord, never decreasing. By the variation-diminishing property of
   * the Bezier form this is sufficient for the column's own projection to be
   * monotone (curves.md, Diagnose the Controls), so the column cannot turn
   * back and fold over itself.
   */
  function monotone(column: IColumn, f: number): boolean {
    const a: Vec3 = column.start.point;
    const b: Vec3 = column.end.point;
    const chord: Vec3 = sub(b, a);
    const a1: Vec3 = scale(column.start.first, f);
    const a2: Vec3 = scale(column.start.second, f * f);
    const b1: Vec3 = scale(column.end.first, f);
    const b2: Vec3 = scale(column.end.second, f * f);
    const controls: Vec3[] = [
      a,
      add(a, scale(a1, 1 / 5)),
      add(add(a, scale(a1, 2 / 5)), scale(a2, 1 / 20)),
      add(add(b, scale(b1, -2 / 5)), scale(b2, 1 / 20)),
      add(b, scale(b1, -1 / 5)),
      b,
    ];
    const along: number[] = controls.map((p: Vec3): number =>
      dot(sub(p, a), chord),
    );
    return along.every(
      (x: number, i: number): boolean => i === 0 || x >= along[i - 1]!,
    );
  }

  /**
   * A column's largest monotone scale found at or below `from`: `from`
   * itself when it holds, else halving until it holds (a ribbon pointing
   * along its chord holds at small enough scales), then 40 bisection steps
   * between the last failing and the first holding value; null when even
   * `1e-9` fails.
   *
   * @param column The column's ribbons.
   * @param from The largest scale to try.
   * @returns The scale found, or null.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Searches the Bezier-hull monotonicity condition (`monotone`) along the scale; the found value holds it, though the holding set need not be an interval, so a larger holding scale may exist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Halving then bisection, one predicate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance on the condition; a scale that fails is never returned.
   * @evidence contracts/development/common.md#meaningful-documentation States the search, its bound and its null case.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most about 30 halvings and 40 bisection steps, each six control points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure numeric search coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function largest(column: IColumn, from: number): number | null {
    if (monotone(column, from)) return from;
    let hi: number = from;
    let lo: number = from / 2;
    while (!monotone(column, lo)) {
      hi = lo;
      lo /= 2;
      if (!(lo > 1e-9)) return null;
    }
    for (let step: number = 0; step < 40; ++step) {
      const mid: number = (lo + hi) / 2;
      if (monotone(column, mid)) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /**
   * The child's rail phase at each loop point by arclength, for a split's child and a port's alike: the ring is the child's rail read at
   * its station at each phase (`railAt`, a port's rail curve when it has one), and every column takes the phase that stands as far round
   * the ring, as a share of the ring's length, as the column stands round the loop, the two run the same way when their Newell normals
   * agree, from the start on the ring at which the two curves, each about its own centroid, stand closest in the least-squares sense.
   * Neither curve need be star-shaped about the centroid.
   */
  function lengths(child: ISide, loop: readonly Vec3[]): number[] | string {
    const turn: number = 2 * Math.PI;
    const samples: number = 8 * loop.length;
    const at = (psi: number): Vec3 => {
      const p: readonly number[] = child.surface.point?.(railAt(child, psi), psi) ?? child.surface.jet(railAt(child, psi), psi).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    const ring: Vec3[] = Array.from({ length: samples + 1 }, (_: unknown, j: number): Vec3 => at((turn * j) / samples));
    const newell = (points: readonly Vec3[]): { centre: Vec3; normal: Vec3 | null } => {
      let centre: Vec3 = [0, 0, 0];
      for (const q of points) centre = add(centre, scale(q, 1 / points.length));
      let area: Vec3 = [0, 0, 0];
      points.forEach((q: Vec3, j: number): void => {
        area = add(area, cross(sub(q, centre), sub(points[(j + 1) % points.length]!, centre)));
      });
      return { centre, normal: unit(area) };
    };
    const rim = newell(ring.slice(0, samples));
    const lap = newell(loop);
    if (rim.normal === null) return "the child's rail ring encloses no area";
    if (lap.normal === null) return "the loop encloses no area";
    const sense: 1 | -1 = dot(rim.normal, lap.normal) > 0 ? 1 : -1;
    // Cumulative arclength round the ring at its samples, and round the loop at its columns.
    const along: number[] = [0];
    for (let j: number = 1; j <= samples; ++j) along.push(along[j - 1]! + norm(sub(ring[j]!, ring[j - 1]!)));
    const total: number = along[samples]!;
    const lapAlong: number[] = [0];
    for (let k: number = 1; k <= loop.length; ++k) lapAlong.push(lapAlong[k - 1]! + norm(sub(loop[k % loop.length]!, loop[k - 1]!)));
    const lapTotal: number = lapAlong[loop.length]!;
    if (!(total > 0 && lapTotal > 0)) return "the child's rail ring or the loop has no length";
    // The sample at an arclength round the ring: the last whose arclength does not pass it, by bisection.
    const below = (x: number): number => {
      let lo: number = 0;
      let hi: number = samples - 1;
      while (lo < hi) {
        const mid: number = (lo + hi + 1) >> 1;
        if (along[mid]! <= x) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };
    // The phase and the point at an arclength round the ring, read linearly between its samples.
    const phaseAt = (length: number): number => {
      const x: number = ((length % total) + total) % total;
      const j: number = below(x);
      const span: number = along[j + 1]! - along[j]!;
      return (turn * (j + (span > 0 ? (x - along[j]!) / span : 0))) / samples;
    };
    const pointAt = (length: number): Vec3 => {
      const x: number = ((length % total) + total) % total;
      const j: number = below(x);
      const span: number = along[j + 1]! - along[j]!;
      const f: number = span > 0 ? (x - along[j]!) / span : 0;
      return add(scale(ring[j]!, 1 - f), scale(ring[j + 1]!, f));
    };
    // Where round the ring the loop's first column lands: of every sample, the one at which the loop's points and the ring's points taken
    // at the same shares of their lengths stand closest about their own centroids (the least sum of squared distances), the start a loft
    // between two closed curves takes so that the band does not twist. Read by the angle of the loop's first point about the ring's
    // centroid, every toe's band of f1's foot turned 14 to 18 degrees about its toe on average.
    let anchor: number = 0;
    let least: number = Infinity;
    for (let j: number = 0; j < samples; ++j) {
      let cost: number = 0;
      for (let k: number = 0; k < loop.length && cost < least; ++k) {
        const d: Vec3 = sub(sub(pointAt(along[j]! + sense * (lapAlong[k]! / lapTotal) * total), rim.centre), sub(loop[k]!, lap.centre));
        cost += dot(d, d);
      }
      if (cost < least) [least, anchor] = [cost, j];
    }
    const start: number = along[anchor]!;
    const out: number[] = [];
    for (let k: number = 0; k < loop.length; ++k) {
      const psi: number = phaseAt(start + sense * (lapAlong[k]! / lapTotal) * total);
      if (k === 0) {
        out.push(psi);
        continue;
      }
      const step: number = sense * ((((sense * (psi - out[k - 1]!)) % turn) + turn) % turn);
      if (!(step !== 0)) return `the child's rail phase does not advance at column ${k}`;
      out.push(out[k - 1]! + step);
    }
    return out;
  }

  /**
   * The child's rail phase at each loop point: the phase whose rail point stands at the loop point's angle about the rail ring's centroid, in the ring's Newell plane; or why none is admitted.
   */
  function phases(child: ISide, loop: readonly Vec3[]): number[] | string {
    const turn: number = 2 * Math.PI;
    const samples: number = 8 * loop.length;
    const at: (psi: number) => Vec3 = (psi: number): Vec3 => [
      ...(child.surface.point?.(railAt(child, psi), psi) ??
        child.surface.jet(railAt(child, psi), psi).p),
    ];
    const ring: Vec3[] = Array.from(
      { length: samples },
      (_: unknown, j: number): Vec3 => at((turn * j) / samples),
    );

    // The ring's centroid and its Newell normal (the polygon's area vector).
    let centre: Vec3 = [0, 0, 0];
    for (const q of ring) centre = add(centre, scale(q, 1 / samples));
    let area: Vec3 = [0, 0, 0];
    ring.forEach((q: Vec3, j: number): void => {
      area = add(
        area,
        cross(sub(q, centre), sub(ring[(j + 1) % samples]!, centre)),
      );
    });
    const normal: Vec3 | null = unit(area);
    if (normal === null) return "the child's rail ring encloses no area";
    const d0: Vec3 = sub(ring[0]!, centre);
    const e1: Vec3 | null = unit(sub(d0, scale(normal, dot(d0, normal))));
    if (e1 === null) return "the child's rail ring starts at its centroid";
    const e2: Vec3 = cross(normal, e1);
    const angle: (p: Vec3) => number = (p: Vec3): number => {
      const d: Vec3 = sub(p, centre);
      return Math.atan2(dot(d, e2), dot(d, e1));
    };
    const wrap: (x: number) => number = (x: number): number =>
      x - turn * Math.round(x / turn);

    // Both curves must turn once, strictly monotonically, round the centroid.
    const unwrap: (
      values: number[],
      what: string,
    ) => { angles: number[]; sense: 1 | -1 } | string = (
      values: number[],
      what: string,
    ): { angles: number[]; sense: 1 | -1 } | string => {
      const angles: number[] = [values[0]!];
      for (let j: number = 1; j <= values.length; ++j)
        angles.push(
          angles[j - 1]! + wrap(values[j % values.length]! - values[j - 1]!),
        );
      const total: number = angles[values.length]! - angles[0]!;
      const sense: 1 | -1 = total > 0 ? 1 : -1;
      if (!(Math.abs(Math.abs(total) - turn) < 1e-6))
        return `the ${what} turns ${total.toFixed(6)} rad round the child's rail centroid, not once`;
      for (let j: number = 1; j < angles.length; ++j)
        if (!(sense * (angles[j]! - angles[j - 1]!) > 0))
          return `the ${what}'s angle round the child's rail centroid is not monotone at ${j - 1}`;
      return { angles, sense };
    };
    const rim: { angles: number[]; sense: 1 | -1 } | string = unwrap(
      ring.map(angle),
      "child's rail ring",
    );
    if (typeof rim === "string") return rim;
    const lap: { angles: number[]; sense: 1 | -1 } | string = unwrap(
      loop.map(angle),
      "loop",
    );
    if (typeof lap === "string") return lap;

    // Invert the ring's unwrapped angle at each loop angle: bracket by the samples, then bisect.
    const found: number[] = lap.angles
      .slice(0, loop.length)
      .map((target: number): number => {
        const base: number = rim.angles[0]!;
        const x: number =
          base +
          rim.sense * ((((rim.sense * (target - base)) % turn) + turn) % turn);
        let j: number = 0;
        while (j < samples - 1 && rim.sense * (rim.angles[j + 1]! - x) < 0) ++j;
        let lo: number = (turn * j) / samples;
        let hi: number = (turn * (j + 1)) / samples;
        const reading: (psi: number) => number = (psi: number): number =>
          rim.angles[j]! + wrap(angle(at(psi)) - rim.angles[j]!);
        for (let step: number = 0; step < 48; ++step) {
          const mid: number = (lo + hi) / 2;
          if (rim.sense * (reading(mid) - x) < 0) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      });

    // Unwrap along the clock in the correspondence's direction.
    const direction: number = rim.sense * lap.sense;
    const out: number[] = [found[0]!];
    for (let k: number = 1; k < found.length; ++k) {
      const step: number =
        direction *
        ((((direction * (found[k]! - out[k - 1]!)) % turn) + turn) % turn);
      if (!(step !== 0))
        return `the child's rail phase does not advance at column ${k}`;
      out.push(out[k - 1]! + step);
    }
    return out;
  }
}
