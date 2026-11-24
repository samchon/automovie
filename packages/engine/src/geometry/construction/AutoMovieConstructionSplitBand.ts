import type {
  AutoMovieVector3Tuple,
  IAutoMovieBlendColumn,
  IAutoMovieBlendCrossJet,
  IAutoMovieConstructionBandProfile64,
  IAutoMovieConstructionLocalScaleMinorant,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionLocalScaleMinorant as Minorant } from "./AutoMovieConstructionLocalScaleMinorant";
import { AutoMovieConstructionPortCurve as PortCurve } from "./AutoMovieConstructionPortCurve";
import { AutoMovieConstructionSplitBandTrace as Trace } from "./AutoMovieConstructionSplitBandTrace";
import { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

const { add, combine, cross, dot, norm, scale, sub, unit } =
  AutoMovieSolidVector;

/**
 * One band of a split (`IAutoMovieConstructionSplit`): the join strip between a
 * child's loop on the host's end and the child's rail, published as a two-layer
 * chain (`AutoMovieSolidBlendChain.strip`).
 *
 * The loop's clock `c_k = 2 pi k / n` over `n` columns: for `k <= n/2` the host
 * ring arc, linear in host phase, for `k > n/2` the straight chord from the
 * arc's end point back to its start point. At each column the start ribbon is
 * the host surface's 2-jet leaving its end (`AutoMovieSolidRibbon`) on the arc,
 * and on the chord the declared ruling in the end section's plane, square to
 * the chord and toward the band's own arc (first derivative `L` times that
 * unit, second zero), so both bands meet G1 across the chord; the end ribbon is
 * the child's 2-jet at its rail leaving into its kept side, each first
 * derivative of length `L`, the column's rail-to-rail chord
 * (`AutoMovieSolidBlend`'s chord law). In a crease window the end ribbon's
 * first derivative becomes that chord and its second zero, by the window's C2
 * weight. The band's ribbons are then scaled by one common factor, at most 1,
 * at which every column's Bezier control points advance monotonically along its
 * chord, so no column turns back (a band whose rails stand far apart across a
 * short drop otherwise folds); the scale changes only the cross parameter's
 * speed, so the G2 meetings hold.
 *
 * With a curved seam (`IAutoMovieConstructionSplit.IProfile`,
 * `AutoMovieConstructionSplitSeam`) the chord columns stand on the seam at
 * equal arclength shares, ruled by the seam plane's normal toward the band's
 * arc, and within the corner window of each fork both sides' ribbons turn by
 * the quintic smoothstep to the inward diagonal at the fork: the arc's inside
 * the host's tangent plane (G1 there, its second derivative falling with the
 * turn), the seam's toward its direction away from the fork. The corner column
 * then leaves the fork transverse to both the arc and the seam.
 *
 * The child's phase at each column is the one whose rail point stands at the
 * loop point's angle about the rail ring's centroid, in the ring's Newell
 * plane. It is admitted only when the ring's angle and the loop's angle both
 * turn once, strictly monotonically, round that centroid (construction.md,
 * Tree: measure monotonicity before choosing a parameter); otherwise the band
 * is refused with the reason.
 */
export namespace AutoMovieConstructionSplitBand {
  /**
   * The rail's station on a side at a phase: its curve's when it has one, else
   * its one station.
   *
   * @param side The side.
   * @param psi The side's phase, radians.
   * @returns The station, mm.
   */
  export function railAt(
    side: IAutoMovieConstructionSplitBand.ISide,
    psi: number,
  ): number {
    return side.along === undefined ? side.station : side.along(psi);
  }

  /**
   * Build one band, or the reason it cannot be built.
   *
   * @param input The band's sides, arc, normal, columns and crease.
   * @param trace Optional nonthrowing observer of detached actual strip work;
   *   absent, no snapshots are made.
   * @returns The band, or the refusal.
   */
  export function create(
    input: IAutoMovieConstructionSplitBand.IInput,
    trace?: IAutoMovieConstructionSplitBandTrace.Sink,
  ): IAutoMovieConstructionSplitBand.IBand | string {
    const factor: number = refine(input);
    const made: IAutoMovieConstructionSplitBand.IBand | string = build(
      factor === 1 ? input : { ...input, count: factor * input.count },
      trace,
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
   * The strip's columns per mesh column for a curved seam: at a fork the clock
   * spline's tangent mixes the one-sided chords to its neighbours, and a chord
   * deviates from its side's tangent by half that side's turn per column, out
   * of the host's tangent plane where the ring curves out of it (O(h kappa),
   * test_construction_split_seam: 7.0 deg at 11.25 deg per column). The strip
   * is therefore built on `F` times the columns, `F` the largest turn between
   * adjacent chords next to either fork, on the arc and on the seam, in
   * degrees, rounded up, so each one-sided chord deviates by at most half a
   * degree; the mesh columns are every `F`-th strip column, at the same clocks,
   * so the shared vertices are the strip's own knots. At most 16; 1 for the
   * straight chord, whose corners are declared creases.
   */
  function refine(input: IAutoMovieConstructionSplitBand.IInput): number {
    const seam: IAutoMovieConstructionSplitBand.IInput["seam"] = input.seam;
    if (seam === undefined) return 1;
    const n: number = input.count;
    const m: number = n / 2;
    const [alpha, beta]: [number, number] = input.arc;
    const ring: (k: number) => AutoMovieVector3Tuple = (
      k: number,
    ): AutoMovieVector3Tuple =>
      input.host.surface.jet(
        input.host.station,
        alpha + ((beta - alpha) * k) / m,
      ).p;
    const start: AutoMovieVector3Tuple = ring(0);
    const finish: AutoMovieVector3Tuple = ring(m);
    const reversed: boolean =
      norm(sub(seam.curve.ends[0], finish)) >
      norm(sub(seam.curve.ends[0], start));
    const onSeam: (k: number) => AutoMovieVector3Tuple = (
      k: number,
    ): AutoMovieVector3Tuple =>
      seam.curve.at(reversed ? 1 - (k - m) / m : (k - m) / m).point;
    const turn: (
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
      c: AutoMovieVector3Tuple,
    ) => number = (
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
      c: AutoMovieVector3Tuple,
    ): number => {
      const u: AutoMovieVector3Tuple | null = unit(sub(b, a));
      const v: AutoMovieVector3Tuple | null = unit(sub(c, b));
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
  function build(
    input: IAutoMovieConstructionSplitBand.IInput,
    trace?: IAutoMovieConstructionSplitBandTrace.Sink,
  ): IAutoMovieConstructionSplitBand.IBand | string {
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
    const start: AutoMovieVector3Tuple = ring[0]!.p;
    const finish: AutoMovieVector3Tuple = ring[m]!.p;
    // A curved seam: chord column k stands at the share `(k - m) / m` of the
    // seam's length from `finish`; the seam's own share runs from its first
    // end, which is this band's `start` for the band whose arc leaves it
    // (child 0) and its `finish` for the other, so both bands read the same
    // points (band 0's column k is band 1's `3 m - k`).
    const seam: IAutoMovieConstructionSplitBand.IInput["seam"] = input.seam;
    const reversed: boolean =
      seam !== undefined &&
      norm(sub(seam.curve.ends[0], finish)) >
        norm(sub(seam.curve.ends[0], start));
    const seamAt: (IAutoMovieConstructionSplitSeam.IPoint | null)[] =
      Array.from(
        { length: n },
        (
          _: unknown,
          k: number,
        ): IAutoMovieConstructionSplitSeam.IPoint | null =>
          seam === undefined || k <= m
            ? null
            : seam.curve.at(reversed ? 1 - (k - m) / m : (k - m) / m),
      );
    const loop: AutoMovieVector3Tuple[] = Array.from(
      { length: n },
      (_: unknown, k: number): AutoMovieVector3Tuple =>
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
    const along: AutoMovieVector3Tuple | null = unit(sub(start, finish));
    const toward: AutoMovieVector3Tuple = sub(
      ring[Math.floor(m / 2)]!.p,
      scale(add(start, finish), 0.5),
    );
    // A curved seam's ruling: the seam plane's normal toward this band's arc.
    const lateral: AutoMovieVector3Tuple | null =
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
    const near: (k: number, L: number) => IAutoMovieBlendCrossJet | string = (
      k: number,
      L: number,
    ): IAutoMovieBlendCrossJet | string => {
      if (k > m) {
        const reading: IAutoMovieConstructionSplitSeam.IPoint | null =
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
        const away: AutoMovieVector3Tuple = scale(
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
      const own: IAutoMovieBlendCrossJet = AutoMovieSolidRibbon.of(
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
      const ahead: AutoMovieVector3Tuple | null = unit(own.first);
      const normal: AutoMovieVector3Tuple | null = unit(
        cross(ring[k]!.u, ring[k]!.v),
      );
      if (ahead === null || normal === null)
        return `column ${k}: the host's tangent plane is degenerate`;
      const side: AutoMovieVector3Tuple | null = unit(
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
    const outward: AutoMovieVector3Tuple | null = unit(
      scale(cross(ring[0]!.u, ring[0]!.v), input.host.surface.orientation),
    );
    if (outward === null)
      return "the host's tangent plane at the arc's start is degenerate";
    const made: IAutoMovieConstructionSplitBand.IStrip | string = strip(
      input.name,
      loop,
      near,
      outward,
      input.child,
      input.crease,
      input.correspondence ?? "angle",
      "common",
      [],
      trace,
    );
    return typeof made === "string" ? made : { ...made, hostPhases };
  }

  /**
   * Build one band of a split into more than two, or the reason it cannot be
   * built.
   *
   * The loop runs through its stretches in order: on an arc its columns stand
   * at equal steps of host phase from the arc's first phase, on a seam at equal
   * arclength shares from the fork it is read from, and a seam's first column
   * is the fork that ends the arc before it. The ribbons are a two-way band's
   * (`create`): on an arc the host's own 2-jet, on a seam the seam plane's
   * normal toward the band's own loop, and within `corner` of clock of each
   * fork both turn by the quintic smoothstep to the inward diagonal there, the
   * arc's toward the adjacent seam's ruling inside the host's tangent plane and
   * the seam's toward its direction away from the fork. With `square` an arc's
   * ribbon is the host's 2-jet along the chart line square to the end ring
   * instead of along the station line. Two bands that read one seam from its
   * two ends therefore meet G1 across it.
   *
   * @param input The band's sides, stretches, corner and crease.
   * @param trace Optional nonthrowing observer of detached actual strip work;
   *   absent, no snapshots are made.
   * @returns The band with each column's host phase (NaN on a seam's inner
   *   columns), or the refusal.
   */
  export function fan(
    input: IAutoMovieConstructionSplitBand.IFanInput,
    count: number,
    trace?: IAutoMovieConstructionSplitBandTrace.Sink,
  ): (IAutoMovieConstructionSplitBand.IStrip & { phases: number[] }) | string {
    const stretches: IAutoMovieConstructionSplitBand.IStretch[] =
      input.stretches;
    if (stretches[0]?.kind !== "arc")
      return "the loop does not start on an arc";
    if (
      stretches.reduce(
        (sum: number, s: IAutoMovieConstructionSplitBand.IStretch): number =>
          sum + s.columns,
        0,
      ) !== count
    )
      return "the stretches' columns do not add up to the band's";
    const n: number = count;
    const step: number = (2 * Math.PI) / n;

    // Each column: its stretch and its index in it; a stretch's first column is a fork.
    const owner: number[] = [];
    const within: number[] = [];
    stretches.forEach(
      (s: IAutoMovieConstructionSplitBand.IStretch, i: number): void => {
        for (let j: number = 0; j < s.columns; ++j) {
          owner.push(i);
          within.push(j);
        }
      },
    );
    const previous = (i: number): IAutoMovieConstructionSplitBand.IStretch =>
      stretches[(i - 1 + stretches.length) % stretches.length]!;

    // A seam's first column is the fork ending the arc before it: read as that arc's last phase.
    const phases: number[] = owner.map((i: number, k: number): number => {
      const s: IAutoMovieConstructionSplitBand.IStretch = stretches[i]!;
      if (s.kind === "arc")
        return s.from + ((s.to - s.from) * within[k]!) / s.columns;
      const before: IAutoMovieConstructionSplitBand.IStretch = previous(i);
      return within[k] === 0 && before.kind === "arc" ? before.to : NaN;
    });
    // A seam column reads no host jet unless it ends the arc before it.
    const jets: (IAutoMovieSolidSurface.IJet | null)[] = owner.map(
      (i: number, k: number): IAutoMovieSolidSurface.IJet | null =>
        stretches[i]!.kind === "arc" ||
        (within[k] === 0 && previous(i).kind === "arc")
          ? input.host.surface.jet(input.host.station, phases[k]!)
          : null,
    );
    const share = (
      s: Extract<IAutoMovieConstructionSplitBand.IStretch, { kind: "seam" }>,
      j: number,
    ): number => (s.forward ? j / s.columns : 1 - j / s.columns);
    const loop: AutoMovieVector3Tuple[] = owner.map(
      (i: number, k: number): AutoMovieVector3Tuple => {
        const jet: IAutoMovieSolidSurface.IJet | null = jets[k]!;
        if (jet !== null) return [jet.p[0]!, jet.p[1]!, jet.p[2]!];
        const s: IAutoMovieConstructionSplitBand.IStretch = stretches[i]!;
        return s.kind === "seam"
          ? s.curve.at(share(s, within[k]!)).point
          : [NaN, NaN, NaN];
      },
    );
    const centroid: AutoMovieVector3Tuple = scale(
      loop.reduce(
        (
          sum: AutoMovieVector3Tuple,
          p: AutoMovieVector3Tuple,
        ): AutoMovieVector3Tuple => add(sum, p),
        [0, 0, 0],
      ),
      1 / n,
    );

    // Each seam's ruling: its plane's normal toward this band's loop.
    const ruling: (AutoMovieVector3Tuple | null)[] = stretches.map(
      (
        s: IAutoMovieConstructionSplitBand.IStretch,
      ): AutoMovieVector3Tuple | null => {
        if (s.kind !== "seam") return null;
        const middle: AutoMovieVector3Tuple = scale(
          add(s.curve.ends[0], s.curve.ends[1]),
          0.5,
        );
        const toward: number = dot(s.curve.normal, sub(centroid, middle));
        return toward === 0 ? null : scale(s.curve.normal, Math.sign(toward));
      },
    );
    if (
      stretches.some(
        (s: IAutoMovieConstructionSplitBand.IStretch, i: number): boolean =>
          s.kind === "seam" && ruling[i] === null,
      )
    )
      return "a seam plane holds the direction toward the band's loop";
    const turn = (d: number): number => {
      if (!(d < input.corner)) return 0;
      const x: number = d / input.corner;
      return 1 - x * x * x * (10 - 15 * x + 6 * x * x);
    };
    // The ribbons' reach toward each fork (`IAutoMovieConstructionSplit.IProfile.reach`): first derivative by the share, second by its
    // square, so each column only slows across its start and its curvature there, and the band's G2 to the host, are kept.
    const reach: number = input.reach ?? 1;
    const near = (k: number, L: number): IAutoMovieBlendCrossJet | string => {
      const made: IAutoMovieBlendCrossJet | string = turned(k, L);
      if (typeof made === "string" || reach === 1) return made;
      const lambda: number =
        reach +
        (1 - reach) *
          (1 -
            turn(
              Math.min(within[k]!, stretches[owner[k]!]!.columns - within[k]!) *
                step,
            ));
      return {
        point: made.point,
        first: scale(made.first, lambda),
        second: scale(made.second, lambda * lambda),
      };
    };
    const turned = (k: number, L: number): IAutoMovieBlendCrossJet | string => {
      const i: number = owner[k]!;
      const s: IAutoMovieConstructionSplitBand.IStretch = stretches[i]!;
      const fromStart: number = within[k]! * step;
      const toEnd: number = (s.columns - within[k]!) * step;
      const jet: IAutoMovieSolidSurface.IJet | null = jets[k]!;
      if (jet === null && s.kind === "seam") {
        const reading: IAutoMovieConstructionSplitSeam.IPoint = s.curve.at(
          share(s, within[k]!),
        );
        const angle: number = (Math.PI / 4) * turn(Math.min(fromStart, toEnd));
        const along: AutoMovieVector3Tuple = scale(
          reading.tangent,
          s.forward ? 1 : -1,
        );
        const away: AutoMovieVector3Tuple = scale(
          along,
          fromStart <= toEnd ? 1 : -1,
        );
        return {
          point: loop[k]!,
          first: scale(
            add(
              scale(ruling[i]!, Math.cos(angle)),
              scale(away, Math.sin(angle)),
            ),
            L,
          ),
          second: [0, 0, 0],
        };
      }
      if (jet === null) return `column ${k}: neither on an arc nor on a seam`;
      // The chart direction the band leaves along: the station line, or with `square` the line whose image is square to the end ring,
      // `(into, -into (S_u . S_v) / (S_v . S_v))`, so the host's 2-jet along it keeps the band G2 to the host.
      const across: number =
        input.square === true && dot(jet.v, jet.v) > 0
          ? (-input.host.into * dot(jet.u, jet.v)) / dot(jet.v, jet.v)
          : 0;
      const hostSpeed: number = norm(
        add(scale(jet.u, input.host.into), scale(jet.v, across)),
      );
      if (!(hostSpeed > 0))
        return `column ${k}: the host's station speed vanishes at its end`;
      const own: IAutoMovieBlendCrossJet = AutoMovieSolidRibbon.of(
        input.host.surface,
        input.host.station,
        phases[k]!,
        input.host.into,
        across,
        L / hostSpeed,
      );
      // On an arc the nearer fork is its first column or the next seam's; a seam's first column is that seam's own fork.
      const onArc: boolean = s.kind === "arc";
      const d: number = onArc ? Math.min(fromStart, toEnd) : 0;
      const seamIndex: number = onArc
        ? fromStart <= toEnd
          ? (i - 1 + stretches.length) % stretches.length
          : (i + 1) % stretches.length
        : i;
      const w: number = turn(d);
      const lateral: AutoMovieVector3Tuple | null = ruling[seamIndex] ?? null;
      if (w === 0 || lateral === null) return own;
      const ahead: AutoMovieVector3Tuple | null = unit(own.first);
      const normal: AutoMovieVector3Tuple | null = unit(cross(jet.u, jet.v));
      if (ahead === null || normal === null)
        return `column ${k}: the host's tangent plane is degenerate`;
      const side: AutoMovieVector3Tuple | null = unit(
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
    const first: IAutoMovieSolidSurface.IJet = jets[0]!;
    const outward: AutoMovieVector3Tuple | null = unit(
      scale(cross(first.u, first.v), input.host.surface.orientation),
    );
    if (outward === null)
      return "the host's tangent plane at the loop's start is degenerate";
    const made: IAutoMovieConstructionSplitBand.IStrip | string = strip(
      input.name,
      loop,
      near,
      outward,
      input.child,
      input.crease,
      input.correspondence ?? "angle",
      "common",
      [],
      trace,
    );
    return typeof made === "string" ? made : { ...made, phases };
  }

  /**
   * A band's strip from its loop to a child's rail: the shared builder of a
   * split's bands and a port's band.
   *
   * @param name The band's chain name.
   * @param loop The loop's points at the `n` clocks `2 pi k / n`, mm.
   * @param near The start ribbon at column `k` for a column chord of length
   *   `L`, or a refusal.
   * @param outward The start surface's outward normal at column 0.
   * @param child The child side: its surface, its rail station, `into` into its
   *   kept side.
   * @param crease The declared crease window on the child side, or absent.
   * @param correspondence How the child's rail is matched to the loop: by angle
   *   about the rail's centroid, or by arclength share.
   * @param ribbons Whether every column takes the band's one common ribbon
   *   scale, or its own (`column`).
   * @param profiles A port band's cross profiles, their depths in mm
   *   (`IAutoMovieConstructionBandProfile64`); absent, none.
   * @param trace Optional nonthrowing observer of actual columns/common
   *   factor/local passes. Its ribbon derivatives use the normalized cross
   *   parameter.
   * @returns The strip, or the refusal.
   */
  export function strip(
    name: string,
    loop: readonly AutoMovieVector3Tuple[],
    near: (k: number, L: number) => IAutoMovieBlendCrossJet | string,
    outward: AutoMovieVector3Tuple,
    child: IAutoMovieConstructionSplitBand.ISide,
    crease?: IAutoMovieConstructionSplit.ICrease,
    correspondence: "angle" | "length" = "angle",
    ribbons: "common" | "column" = "common",
    profiles: readonly IAutoMovieConstructionBandProfile64[] = [],
    trace?: IAutoMovieConstructionSplitBandTrace.Sink,
  ): IAutoMovieConstructionSplitBand.IStrip | string {
    const n: number = loop.length;
    const childPhases: number[] | string = PortCurve.correspondence(
      child,
      loop,
      correspondence,
    );
    if (typeof childPhases === "string") {
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "refusal",
          stage: "correspondence",
          reason: childPhases,
          pass: null,
        });
      return childPhases;
    }

    const columns: {
      start: IAutoMovieBlendCrossJet;
      end: IAutoMovieBlendCrossJet;
    }[] = [];
    for (let k: number = 0; k < n; ++k) {
      const station: number = railAt(child, childPhases[k]!);
      const far: IAutoMovieSolidSurface.IJet = child.surface.jet(
        station,
        childPhases[k]!,
      );
      const chord: AutoMovieVector3Tuple = sub(far.p, loop[k]!);
      const L: number = norm(chord);
      const childSpeed: number = norm(far.u);
      if (!(L > 0 && childSpeed > 0)) {
        const reason: string = `column ${k}: the loop point and the child's rail point coincide or the child's station speed vanishes`;
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "refusal",
            stage: "columns",
            reason,
            pass: null,
          });
        return reason;
      }
      const start: IAutoMovieBlendCrossJet | string = near(k, L);
      if (typeof start === "string") {
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "refusal",
            stage: "columns",
            reason: start,
            pass: null,
          });
        return start;
      }
      const own: IAutoMovieBlendCrossJet = AutoMovieSolidRibbon.of(
        child.surface,
        station,
        childPhases[k]!,
        child.into,
        0,
        L / childSpeed,
      );
      const w: number = weight((2 * Math.PI * k) / n, crease);
      const end: IAutoMovieBlendCrossJet =
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
      columns.push({ start, end });
    }

    // The ribbons' common scale: the largest found factor `f <= 1` of the
    // chord law at which every column advances monotonically along its own
    // chord (`monotone`), so no column turns back on itself; scaling a
    // ribbon's first derivative by `f` and its second by `f^2` changes only
    // the cross parameter's speed, so both rails stay G2. One factor for the
    // whole band keeps the ribbon fields as smooth along the loop as the
    // chord law's; a factor varying smoothly along the loop (`local`) keeps
    // longer tangents where the turn is gentle.
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
      const chord: AutoMovieVector3Tuple = sub(
        column.end.point,
        column.start.point,
      );
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
      if (own === null) {
        const reason: string =
          "no ribbon scale keeps every column monotone along its chord";
        if (trace !== undefined)
          Trace.emit(trace, {
            kind: "refusal",
            stage: "common",
            reason,
            pass: null,
          });
        return reason;
      }
      factors.push(own);
    }
    let factor: number = factors.length === 0 ? 1 : Math.min(...factors);
    for (let settled: boolean = false; !settled; ) {
      settled = true;
      for (const column of forward) {
        if (monotone(column, factor)) continue;
        const lower: number | null = largest(column, factor);
        if (lower === null) {
          const reason: string =
            "no ribbon scale keeps every column monotone along its chord";
          if (trace !== undefined)
            Trace.emit(trace, {
              kind: "refusal",
              stage: "common",
              reason,
              pass: null,
            });
          return reason;
        }
        factor = lower;
        settled = false;
      }
    }
    if (trace !== undefined)
      Trace.emit(trace, {
        kind: "prepared",
        name,
        childPhases,
        columns,
        backward,
        forwardIndices: columns.flatMap(
          (_: IAutoMovieBlendColumn, k: number): number[] =>
            backward.includes(k) ? [] : [k],
        ),
        factors,
        commonFactor: factor,
      });

    // Each column's own factor, when the band asks for it (`ribbons:
    // "column"`): the smooth field below each forward column's largest
    // monotone factor, so one hard stretch shortens only its own
    // neighbourhood. A port's single hard stretch (the arm's band behind the
    // armpit held every one of its 192 columns at 0.093 where nine in ten
    // hold at 1) otherwise turns the whole band within a tenth of its chord
    // at both rails, which shows as a line along each rail.
    const field: number[] | string =
      ribbons === "column"
        ? local(columns, backward, factors, forward, trace)
        : columns.map((): number => factor);
    if (typeof field === "string") return field;
    const scaled: typeof columns = columns.map(
      (
        column: (typeof columns)[number],
        k: number,
      ): (typeof columns)[number] => ({
        start: {
          point: column.start.point,
          first: scale(column.start.first, field[k]!),
          second: scale(column.start.second, field[k]! * field[k]!),
        },
        end: {
          point: column.end.point,
          first: scale(column.end.first, field[k]!),
          second: scale(column.end.second, field[k]! * field[k]!),
        },
      }),
    );

    const plain: { chain: IAutoMovieLoftChain; length: number } | null =
      AutoMovieSolidBlendChain.strip(name, scaled, outward);
    const flat: IAutoMovieSolidSurface | null =
      plain === null ? null : AutoMovieSolidChain.surface(plain.chain);
    const published: { chain: IAutoMovieLoftChain; length: number } | null =
      profiles.length === 0 || plain === null || flat === null
        ? plain
        : AutoMovieSolidBlendChain.strip(
            name,
            scaled,
            outward,
            sections(flat, plain.length, n, profiles),
          );
    if (published === null) {
      const reason: string =
        "the strip has no positive span or no outward side";
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "refusal",
          stage: "publication",
          reason,
          pass: null,
        });
      return reason;
    }
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(
      published.chain,
    );
    if (surface === null) {
      const reason: string = "the strip chain carries no surface";
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "refusal",
          stage: "publication",
          reason,
          pass: null,
        });
      return reason;
    }
    return {
      chain: published.chain,
      surface,
      length: published.length,
      loop: [...loop],
      childPhases,
      scale: { applied: Math.min(...field), columns: factors, backward },
      field: [...field],
      columns: scaled,
      outward,
    };
  }

  /**
   * A plain strip's profiled chain (`IAutoMovieConstructionBandProfile64`): the
   * same rail layers with the profiles' interior cross sections (`sections`),
   * each laid from the plain strip's own point along the inward unit normal of
   * the surface the profile is carried on. A port carries it on its exact band
   * (`AutoMovieConstructionPortBand.carried`), so the depth is measured on the
   * band the port publishes as its face.
   *
   * @param plain The strip built without profiles.
   * @param profiles The profiles, depths in mm.
   * @param normals The surface whose normals carry the depth, in the strip's
   *   chart.
   * @returns The profiled chain and its surface, or the refusal.
   */
  export function profiled(
    plain: IAutoMovieConstructionSplitBand.IStrip,
    profiles: readonly IAutoMovieConstructionBandProfile64[],
    normals: IAutoMovieSolidSurface,
  ): { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | string {
    const made: { chain: IAutoMovieLoftChain; length: number } | null =
      AutoMovieSolidBlendChain.strip(
        plain.chain.name,
        plain.columns,
        plain.outward,
        sections(
          plain.surface,
          plain.length,
          plain.loop.length,
          profiles,
          normals,
        ),
      );
    if (made === null)
      return "the profiled strip has no positive span or no outward side";
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(
      made.chain,
    );
    if (surface === null) return "the profiled strip chain carries no surface";
    return { chain: made.chain, surface };
  }

  /**
   * A profiled band's interior cross sections
   * (`IAutoMovieConstructionBandProfile64`): at every share any profile names,
   * each column's point and station derivatives on the plain band, per unit
   * share, carried in along the plain band's inward unit normal by the sum of
   * the profiles' depths there, each weighted by its window at the column's
   * clock, with the depth's own slope and bend across the band. The normal's
   * own turn across the band is left out of the derivatives; the strip stays a
   * C2 piecewise quintic through its rails and these sections, and its rails
   * keep their 2-jets.
   *
   * @param plain The plain band's surface: station mm from 0 at the loop to `L`
   *   at the rail, phase the loop clock.
   * @param L The plain band's span, mm.
   * @param n The columns, at clocks `2 pi k / n`.
   * @param profiles The profiles, depths in mm.
   * @param normals The surface whose inward unit normal carries the depth, in
   *   the plain band's chart; absent, the plain band itself.
   * @returns The sections in increasing share.
   */
  function sections(
    plain: IAutoMovieSolidSurface,
    L: number,
    n: number,
    profiles: readonly IAutoMovieConstructionBandProfile64[],
    normals: IAutoMovieSolidSurface = plain,
  ): {
    t: number;
    jets: [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ][];
  }[] {
    const shares: number[] = [
      ...new Set(
        profiles.flatMap((p: IAutoMovieConstructionBandProfile64): number[] =>
          p.knots.map((k: [number, number]): number => k[0]),
        ),
      ),
    ].sort((a: number, b: number): number => a - b);
    const depths: ((t: number) => [number, number, number])[] = profiles.map(
      (
        p: IAutoMovieConstructionBandProfile64,
      ): ((t: number) => [number, number, number]) =>
        clamped(
          [0, ...p.knots.map((k: [number, number]): number => k[0]), 1],
          [0, ...p.knots.map((k: [number, number]): number => k[1]), 0],
        ),
    );
    return shares.map(
      (
        t: number,
      ): {
        t: number;
        jets: [
          AutoMovieVector3Tuple,
          AutoMovieVector3Tuple,
          AutoMovieVector3Tuple,
        ][];
      } => ({
        t,
        jets: Array.from(
          { length: n },
          (
            _: unknown,
            k: number,
          ): [
            AutoMovieVector3Tuple,
            AutoMovieVector3Tuple,
            AutoMovieVector3Tuple,
          ] => {
            const c: number = (2 * Math.PI * k) / n;
            const jet: IAutoMovieSolidSurface.IJet = plain.jet(t * L, c);
            const p: AutoMovieVector3Tuple = [jet.p[0], jet.p[1], jet.p[2]];
            const d1: AutoMovieVector3Tuple = scale(
              [jet.u[0], jet.u[1], jet.u[2]],
              L,
            );
            const d2: AutoMovieVector3Tuple = scale(
              [jet.uu[0], jet.uu[1], jet.uu[2]],
              L * L,
            );
            const carrier: IAutoMovieSolidSurface.IJet =
              normals === plain ? jet : normals.jet(t * L, c);
            const normal: AutoMovieVector3Tuple | null = unit(
              scale(cross(carrier.u, carrier.v), normals.orientation),
            );
            let depth: [number, number, number] = [0, 0, 0];
            profiles.forEach(
              (
                profile: IAutoMovieConstructionBandProfile64,
                i: number,
              ): void => {
                const w: number = weight(c, profile);
                const [v, s, b]: [number, number, number] = depths[i]!(t);
                depth = [depth[0] + w * v, depth[1] + w * s, depth[2] + w * b];
              },
            );
            if (normal === null) return [p, d1, d2];
            return [
              sub(p, scale(normal, depth[0])),
              sub(d1, scale(normal, depth[1])),
              sub(d2, scale(normal, depth[2])),
            ];
          },
        ),
      }),
    );
  }

  /**
   * The cubic spline through `(x_i, y_i)` with zero slope at both ends, read as
   * its value and its first and second derivatives: the clamped spline's second
   * derivatives solved by the tridiagonal (Thomas) sweep.
   */
  function clamped(
    x: readonly number[],
    y: readonly number[],
  ): (t: number) => [number, number, number] {
    const m: number = x.length;
    const h: number[] = Array.from(
      { length: m - 1 },
      (_: unknown, i: number): number => x[i + 1]! - x[i]!,
    );
    const a: number[] = new Array<number>(m).fill(0);
    const b: number[] = new Array<number>(m).fill(0);
    const c: number[] = new Array<number>(m).fill(0);
    const r: number[] = new Array<number>(m).fill(0);
    b[0] = h[0]! / 3;
    c[0] = h[0]! / 6;
    r[0] = (y[1]! - y[0]!) / h[0]!;
    for (let i: number = 1; i < m - 1; ++i) {
      a[i] = h[i - 1]! / 6;
      b[i] = (h[i - 1]! + h[i]!) / 3;
      c[i] = h[i]! / 6;
      r[i] = (y[i + 1]! - y[i]!) / h[i]! - (y[i]! - y[i - 1]!) / h[i - 1]!;
    }
    a[m - 1] = h[m - 2]! / 6;
    b[m - 1] = h[m - 2]! / 3;
    r[m - 1] = -(y[m - 1]! - y[m - 2]!) / h[m - 2]!;
    for (let i: number = 1; i < m; ++i) {
      const f: number = a[i]! / b[i - 1]!;
      b[i] = b[i]! - f * c[i - 1]!;
      r[i] = r[i]! - f * r[i - 1]!;
    }
    const M: number[] = new Array<number>(m).fill(0);
    M[m - 1] = r[m - 1]! / b[m - 1]!;
    for (let i: number = m - 2; i >= 0; --i)
      M[i] = (r[i]! - c[i]! * M[i + 1]!) / b[i]!;
    return (t: number): [number, number, number] => {
      let i: number = 0;
      while (i < m - 2 && t > x[i + 1]!) ++i;
      const hi: number = h[i]!;
      const A: number = (x[i + 1]! - t) / hi;
      const B: number = (t - x[i]!) / hi;
      const value: number =
        A * y[i]! +
        B * y[i + 1]! +
        (((A * A * A - A) * M[i]! + (B * B * B - B) * M[i + 1]!) * hi * hi) / 6;
      const slope: number =
        (y[i + 1]! - y[i]!) / hi +
        ((-(3 * A * A - 1) * M[i]! + (3 * B * B - 1) * M[i + 1]!) * hi) / 6;
      return [value, slope, A * M[i]! + B * M[i + 1]!];
    };
  }

  /**
   * A crease window's weight at a clock: 1 inside `[start, end]`, falling to 0
   * over `transition` on each side by `1 - (10 x^3 - 15 x^4 + 6 x^5)`, `x` the
   * clock distance from the window over the transition, so the weight is C2 in
   * the clock; 0 without a crease.
   *
   * @param c The clock, radians.
   * @param crease The window, or absent.
   * @returns The weight in `[0, 1]`.
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
   * Whether a column, its ribbons scaled by `f` (first by `f`, second by
   * `f^2`), advances monotonically along its chord: the quintic Hermite in the
   * cross parameter `w` written as its six Bezier control points (curves.md,
   * Preserve the Actual Parameter, with `h = 1`), each projected on the chord,
   * never decreasing. By the variation-diminishing property of the Bezier form
   * this is sufficient for the column's own projection to be monotone
   * (curves.md, Diagnose the Controls), so the column cannot turn back and fold
   * over itself.
   */
  function monotone(column: IAutoMovieBlendColumn, f: number): boolean {
    const a: AutoMovieVector3Tuple = column.start.point;
    const b: AutoMovieVector3Tuple = column.end.point;
    const chord: AutoMovieVector3Tuple = sub(b, a);
    const a1: AutoMovieVector3Tuple = scale(column.start.first, f);
    const a2: AutoMovieVector3Tuple = scale(column.start.second, f * f);
    const b1: AutoMovieVector3Tuple = scale(column.end.first, f);
    const b2: AutoMovieVector3Tuple = scale(column.end.second, f * f);
    const controls: AutoMovieVector3Tuple[] = [
      a,
      add(a, scale(a1, 1 / 5)),
      add(add(a, scale(a1, 2 / 5)), scale(a2, 1 / 20)),
      add(add(b, scale(b1, -2 / 5)), scale(b2, 1 / 20)),
      add(b, scale(b1, -1 / 5)),
      b,
    ];
    const along: number[] = controls.map((p: AutoMovieVector3Tuple): number =>
      dot(sub(p, a), chord),
    );
    return along.every(
      (x: number, i: number): boolean => i === 0 || x >= along[i - 1]!,
    );
  }

  /**
   * How fast a column's ribbon scale may grow away from a column that needs a
   * smaller one, in natural log per radian of clock: from a column held at a
   * tenth, the field is back at 1 about 0.6 rad round the loop.
   */
  const LOCAL_SLOPE: number = 4;

  /**
   * The width of the Gaussian that smooths the scale field along the loop,
   * radians of clock: about five columns of 192.
   */
  const LOCAL_SMOOTH: number = 0.15;

  /**
   * Each column's own ribbon scale: a field smooth along the loop that stays at
   * or below every forward column's largest monotone scale. In log scale it is
   * the lower envelope of the columns' targets, each widened by `LOCAL_SLOPE`
   * per radian of clock, smoothed by a periodic Gaussian of `LOCAL_SMOOTH`. A
   * column's target starts at its own log scale; where the smoothing carries
   * the field above a column's own (it rounds off the envelope's corner at a
   * hard column) that column's target is pushed down by the excess, and a
   * column that still fails at its field value takes its largest monotone scale
   * below it, and the field is read again, so the field is lowered only about
   * the columns that need it. A backward column takes the field of its
   * neighbours, since it turns back at any scale.
   *
   * @param columns Every column's ribbons, in clock order at `2 pi k / n`.
   * @param backward The indices of the columns that point back against their
   *   chord.
   * @param factors The forward columns' largest monotone scales at or below 1,
   *   in their order.
   * @param forward The forward columns, in their order.
   * @returns The scale of every column, or the refusal when a column has no
   *   monotone scale.
   *
   *   Scaling one column's first derivatives by `f` and its second by `f^2`
   *   reparameterizes it across the band, so each rail stays G2; a field smooth
   *   in the clock keeps the columns' periodic spline interpolation smooth
   *   along the loop, and the envelope keeps every forward column monotone. No
   *   column is given more than its own monotone scale; a column with none
   *   refuses the band as the common scale does. The work is one envelope, one
   *   smoothing, one lowering and a check per column, repeated only for a
   *   column that fails: O(n^2) for n columns per pass, a few hundred columns
   *   once per band, returning one array of n numbers. It is a numeric field
   *   over already built columns and coordinates no work, and `create` answers
   *   the contracts for the band it builds.
   *
   *   After 64 passes that changed only above-own goals, the last computed field
   *   receives one uniform attenuation through LocalScaleMinorant. Original
   *   held factors and the actual projected-control predicate certify it again;
   *   scaled ribbon jets must stay finite and nonzero first vectors may not
   *   vanish. The existing settled returns and every predicate-changing refusal
   *   remain unchanged. This certifies column data, not interpolation between
   *   columns.
   */
  function local(
    columns: readonly IAutoMovieBlendColumn[],
    backward: readonly number[],
    factors: readonly number[],
    forward: readonly IAutoMovieBlendColumn[],
    trace?: IAutoMovieConstructionSplitBandTrace.Sink,
  ): number[] | string {
    const n: number = columns.length;
    if (forward.length === 0) return columns.map((): number => 1);
    const turn: number = 2 * Math.PI;
    const own: number[] = columns.map(
      (column: IAutoMovieBlendColumn): number => {
        const i: number = forward.indexOf(column);
        return i < 0 ? Infinity : Math.log(factors[i]!);
      },
    );
    const distance = (j: number, k: number): number => {
      const d: number = Math.abs(j - k) % n;
      return (turn * Math.min(d, n - d)) / n;
    };
    // The targets the envelope is built on: each forward column's own log scale, pushed further down wherever the smoothing still carries
    // the field above the column's own.
    const goal: number[] = [...own];
    let lastField: number[] | null = null;
    let hadPredicate: boolean = false;
    for (let pass: number = 0; pass < 64; ++pass) {
      const observedOwn: IAutoMovieConstructionSplitBandTrace.Target[] =
        trace === undefined ? [] : Trace.targets(own, backward);
      const observedGoal: IAutoMovieConstructionSplitBandTrace.Target[] =
        trace === undefined ? [] : Trace.targets(goal, backward);
      const adjustments: IAutoMovieConstructionSplitBandTrace.IAdjustment[] =
        [];
      const envelope: number[] = columns.map(
        (_: IAutoMovieBlendColumn, k: number): number =>
          Math.min(
            0,
            ...goal.map(
              (g: number, j: number): number =>
                g + LOCAL_SLOPE * distance(j, k),
            ),
          ),
      );
      const smooth: number[] = columns.map(
        (_: IAutoMovieBlendColumn, k: number): number => {
          let [sum, weight]: [number, number] = [0, 0];
          for (let j: number = 0; j < n; ++j) {
            const w: number = Math.exp(
              -((distance(j, k) / LOCAL_SMOOTH) ** 2) / 2,
            );
            sum += w * envelope[j]!;
            weight += w;
          }
          return sum / weight;
        },
      );
      const field: number[] = smooth.map((h: number): number => Math.exp(h));
      lastField = field;
      let settled: boolean = true;
      for (const [k, column] of columns.entries()) {
        if (backward.includes(k)) continue;
        if (smooth[k]! > own[k]!) {
          goal[k] = goal[k]! - (smooth[k]! - own[k]!) - 1e-9;
          if (trace !== undefined)
            adjustments.push({
              column: k,
              reason: "above-own",
              goal: goal[k]!,
              lower: null,
            });
          settled = false;
          continue;
        }
        if (monotone(column, field[k]!)) continue;
        hadPredicate = true;
        const lower: number | null = largest(column, field[k]!);
        if (lower === null) {
          const reason: string =
            "no ribbon scale keeps every column monotone along its chord";
          if (trace !== undefined) {
            Trace.emit(trace, {
              kind: "local-pass",
              pass,
              backward: [...backward],
              own: observedOwn,
              goal: observedGoal,
              envelope,
              smooth,
              field,
              adjustments,
              settled: false,
            });
            Trace.emit(trace, {
              kind: "refusal",
              stage: "local",
              reason,
              pass,
            });
          }
          return reason;
        }
        own[k] = Math.log(lower);
        goal[k] = Math.min(goal[k]!, own[k]!);
        if (trace !== undefined)
          adjustments.push({
            column: k,
            reason: "predicate",
            goal: goal[k]!,
            lower,
          });
        settled = false;
      }
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "local-pass",
          pass,
          backward: [...backward],
          own: observedOwn,
          goal: observedGoal,
          envelope,
          smooth,
          field,
          adjustments,
          settled,
        });
      if (settled) return field;
    }

    // The original settled returns above keep their exact arithmetic. Only
    // above-own exhaustion can use the last already computed field, with
    // original held factors rather than a reconstructed log inverse.
    if (!hadPredicate && lastField !== null) {
      const backwardSet: Set<number> = new Set(backward);
      const caps: IAutoMovieConstructionLocalScaleMinorant.ICap[] = [];
      let forwardIndex: number = 0;
      for (let index: number = 0; index < columns.length; ++index) {
        if (backwardSet.has(index)) continue;
        caps.push({
          index,
          factor: factors[forwardIndex]!,
          logarithm: own[index]!,
        });
        ++forwardIndex;
      }
      const result: IAutoMovieConstructionLocalScaleMinorant.Result =
        Minorant.create(
          lastField,
          caps,
          (
            index: number,
            factor: number,
            isForward: boolean,
          ): string | null => {
            const column: IAutoMovieBlendColumn = columns[index]!;
            for (const ribbon of [column.start, column.end]) {
              const first: AutoMovieVector3Tuple = scale(ribbon.first, factor);
              const second: AutoMovieVector3Tuple = scale(
                ribbon.second,
                factor * factor,
              );
              if ((isForward || norm(ribbon.first) > 0) && !(norm(first) > 0))
                return "a scaled first ribbon vector vanishes";
              if (
                ribbon.second.some(
                  (value: number, axis: number): boolean =>
                    value !== 0 && second[axis] === 0,
                )
              )
                return "a nonzero second ribbon component underflows to zero";
            }
            if (isForward && !monotone(column, factor))
              return "the literal forward projected-control predicate refused";
            return null;
          },
        );
      if (trace !== undefined) Trace.emit(trace, { kind: "minorant", result });
      if (result.kind === "accepted") return result.field;
      const reason: string = `no smooth ribbon scale: ${result.stage}${result.index === null ? "" : " at column " + result.index}: ${result.reason}`;
      if (trace !== undefined)
        Trace.emit(trace, {
          kind: "refusal",
          stage: "local",
          reason,
          pass: 63,
        });
      return reason;
    }
    const reason: string =
      "no smooth ribbon scale keeps every column monotone along its chord";
    if (trace !== undefined)
      Trace.emit(trace, { kind: "refusal", stage: "local", reason, pass: 63 });
    return reason;
  }

  /**
   * A column's largest monotone scale found at or below `from`: `from` itself
   * when it holds, else halving until it holds (a ribbon pointing along its
   * chord holds at small enough scales), then 40 bisection steps between the
   * last failing and the first holding value; null when even `1e-9` fails.
   *
   * @param column The column's ribbons.
   * @param from The largest scale to try.
   * @returns The scale found, or null.
   */
  export function largest(
    column: IAutoMovieBlendColumn,
    from: number,
  ): number | null {
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
}
