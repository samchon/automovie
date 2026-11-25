import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionComposedEnd,
  IAutoMovieConstructionSkinCut,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World point or direction, mm. */
type Vec3 = AutoMovieVector3Tuple;

/** A point or a derivative in the end plane's own coordinates, mm. */
type V2 = [number, number];
const { add, cross, dot, norm, scale, sub, unit } = AutoMovieSolidVector;

/**
 * An end composed of its children's sections in one plane
 * (`IAutoMovieConstructionSplit.ICompose`): the closed curves the children's
 * skins cut in the plane, laid side by side, with the forks where neighbours
 * cross, the lobes each child keeps on the outline and the seam plane between
 * each pair.
 *
 * In the plane each section is a closed curve read by its child's phase with
 * its tangent. Two neighbours' curves cross in two points, the pair's forks:
 * the composed outline is each curve's arcs outside its neighbours, so a lobe's
 * extremes are the child's own and the valley between two lobes ends in the
 * forks. The pair's seam plane passes through both forks and holds the unit
 * bisector of the two children's axes, so it is a function of both children's
 * frames; its normal points from the lower child toward the upper one.
 */
export namespace AutoMovieConstructionComposedEnd {
  /**
   * Build a composition, or the reason it cannot be built.
   *
   * Each section is sampled into a polygon in the plane's coordinates; polygon
   * edges that cross bracket the two curves' crossings, and each crossing is
   * then solved on the curves themselves by Newton's iteration in both phases.
   * Neighbours must cross exactly twice; sections that are not neighbours must
   * neither cross nor hold one another's centre.
   *
   * @param input The plane and the sections.
   * @returns The composition, or the refusal naming the sections.
   */
  export function create(
    input: IAutoMovieConstructionComposedEnd.IInput,
  ): IAutoMovieConstructionComposedEnd.IComposition | string {
    const { sections, normal }: IAutoMovieConstructionComposedEnd.IInput =
      input;
    const m: number = input.samples;
    const turn: number = 2 * Math.PI;
    if (sections.length < 2)
      return "an end is composed of at least two sections";
    if (!(Number.isInteger(m) && m >= 8))
      return `the composition's ${m} samples are fewer than 8`;

    // The plane's own axes: the world axis least along the normal, made square to it, and their cross product.
    const least: number = [0, 1, 2].reduce(
      (a: number, b: number): number =>
        Math.abs(normal[b]!) < Math.abs(normal[a]!) ? b : a,
      0,
    );
    const seed: Vec3 = [
      least === 0 ? 1 : 0,
      least === 1 ? 1 : 0,
      least === 2 ? 1 : 0,
    ];
    const e1: Vec3 | null = unit(sub(seed, scale(normal, dot(seed, normal))));
    if (e1 === null) return "the end plane has no normal";
    const e2: Vec3 = cross(normal, e1);
    const flat = (p: Vec3): V2 => [
      dot(sub(p, input.point), e1),
      dot(sub(p, input.point), e2),
    ];
    const lean = (d: Vec3): V2 => [dot(d, e1), dot(d, e2)];

    const polygons: V2[][] = sections.map(
      (s: IAutoMovieConstructionComposedEnd.ISection): V2[] =>
        Array.from(
          { length: m },
          (_: unknown, k: number): V2 => flat(s.at((turn * k) / m).point),
        ),
    );
    const centres: V2[] = polygons.map(
      (q: V2[]): V2 => [
        q.reduce((sum: number, p: V2): number => sum + p[0], 0) / m,
        q.reduce((sum: number, p: V2): number => sum + p[1], 0) / m,
      ],
    );

    /** Whether a point lies inside a polygon, by crossing parity. */
    const inside = (q: V2[], p: V2): boolean => {
      let odd: boolean = false;
      for (let k: number = 0; k < q.length; ++k) {
        const a: V2 = q[k]!;
        const b: V2 = q[(k + 1) % q.length]!;
        if (
          a[1] > p[1] !== b[1] > p[1] &&
          p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
        )
          odd = !odd;
      }
      return odd;
    };

    /**
     * The crossings of two sections' polygons as phase pairs, each then solved
     * on the curves; or the refusal.
     */
    const crossings = (i: number, k: number): [number, number][] | string => {
      const found: [number, number][] = [];
      for (let a: number = 0; a < m; ++a) {
        const p: V2 = polygons[i]![a]!;
        const r: V2 = [
          polygons[i]![(a + 1) % m]![0] - p[0],
          polygons[i]![(a + 1) % m]![1] - p[1],
        ];
        for (let b: number = 0; b < m; ++b) {
          const q: V2 = polygons[k]![b]!;
          const s: V2 = [
            polygons[k]![(b + 1) % m]![0] - q[0],
            polygons[k]![(b + 1) % m]![1] - q[1],
          ];
          const den: number = r[0] * s[1] - r[1] * s[0];
          if (den === 0) continue;
          const t: number = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / den;
          const w: number = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / den;
          if (!(t >= 0 && t < 1 && w >= 0 && w < 1)) continue;

          // Newton on both phases from the edges' crossing: P_i(x) - P_k(y) = 0 in the plane.
          let [x, y]: [number, number] = [
            (turn * (a + t)) / m,
            (turn * (b + w)) / m,
          ];
          let settled: boolean = false;
          for (let step: number = 0; step < 32 && !settled; ++step) {
            const A: { point: Vec3; first: Vec3 } = sections[i]!.at(x);
            const B: { point: Vec3; first: Vec3 } = sections[k]!.at(y);
            const gap: V2 = lean(sub(A.point, B.point));
            const [da, db]: [V2, V2] = [lean(A.first), lean(B.first)];
            const det: number = -da[0] * db[1] + da[1] * db[0];
            if (det === 0) break;
            const dx: number = (gap[0] * db[1] - gap[1] * db[0]) / det;
            const dy: number = (da[1] * gap[0] - da[0] * gap[1]) / det;
            x += dx;
            y += dy;
            // Settled once a step moves both phases by under 1e-12 rad, some hundred times the rounding of a section reading.
            settled = Math.abs(dx) + Math.abs(dy) <= 1e-12;
          }
          if (
            !settled ||
            Math.abs(x - (turn * (a + t)) / m) > turn / m ||
            Math.abs(y - (turn * (b + w)) / m) > turn / m
          )
            return `the sections of ${sections[i]!.name} and ${sections[k]!.name} touch where they cross, near phase ${(turn * (a + t)) / m} rad of the first`;
          found.push([((x % turn) + turn) % turn, ((y % turn) + turn) % turn]);
        }
      }
      return found;
    };

    // Sections that are not neighbours stand apart.
    for (let i: number = 0; i < sections.length; ++i)
      for (let k: number = i + 2; k < sections.length; ++k) {
        const met: [number, number][] | string = crossings(i, k);
        if (typeof met === "string") return met;
        if (
          met.length !== 0 ||
          inside(polygons[k]!, centres[i]!) ||
          inside(polygons[i]!, centres[k]!)
        )
          return `the sections of ${sections[i]!.name} and ${sections[k]!.name}, which are not neighbours, overlap in the end plane`;
      }

    // Each neighbouring pair's forks and seam plane.
    const seams: IAutoMovieConstructionComposedEnd.ISeam[] = [];
    for (let i: number = 0; i + 1 < sections.length; ++i) {
      const [lower, upper]: [
        IAutoMovieConstructionComposedEnd.ISection,
        IAutoMovieConstructionComposedEnd.ISection,
      ] = [sections[i]!, sections[i + 1]!];
      const met: [number, number][] | string = crossings(i, i + 1);
      if (typeof met === "string") return met;
      if (met.length !== 2)
        return `the sections of ${lower.name} and ${upper.name} cross ${met.length} times in the end plane, not twice`;
      const forks: IAutoMovieConstructionComposedEnd.IFork[] = met.map(
        (
          phases: [number, number],
        ): IAutoMovieConstructionComposedEnd.IFork => ({
          point: lower.at(phases[0]).point,
          phases,
        }),
      );
      const across: V2 = [
        centres[i + 1]![0] - centres[i]![0],
        centres[i + 1]![1] - centres[i]![1],
      ];
      const side = (f: IAutoMovieConstructionComposedEnd.IFork): number => {
        const p: V2 = flat(f.point);
        return (
          across[0] * (p[1] - centres[i]![1]) -
          across[1] * (p[0] - centres[i]![0])
        );
      };
      const [first, second]: [
        IAutoMovieConstructionComposedEnd.IFork,
        IAutoMovieConstructionComposedEnd.IFork,
      ] =
        side(forks[0]!) >= side(forks[1]!)
          ? [forks[0]!, forks[1]!]
          : [forks[1]!, forks[0]!];
      const chord: Vec3 | null = unit(sub(second.point, first.point));
      const heading: Vec3 | null = unit(add(lower.axis, upper.axis));
      if (chord === null)
        return `the forks between ${lower.name} and ${upper.name} coincide`;
      if (heading === null)
        return `the axes of ${lower.name} and ${upper.name} are opposite, so they have no bisector`;
      // The bisector's part square to the chord, the sine of their angle: at the rounding of two unit vectors it is no direction.
      const across2: Vec3 = sub(heading, scale(chord, dot(heading, chord)));
      const square: Vec3 | null =
        norm(across2) > 64 * Number.EPSILON ? unit(across2) : null;
      if (square === null)
        return `the bisector of the axes of ${lower.name} and ${upper.name} runs along the chord between their forks, so no seam plane stands`;
      const raw: Vec3 = cross(chord, square);
      const toward: number = dot(
        raw,
        add(scale(e1, across[0]), scale(e2, across[1])),
      );
      if (toward === 0)
        return `the seam plane between ${lower.name} and ${upper.name} holds the line through their centres`;
      seams.push({
        forks: [first, second],
        normal: scale(raw, Math.sign(toward)),
        heading,
      });
    }

    // Each section's lobes: the arcs between its forks whose middle lies outside its neighbours.
    // Each lobe remembers the fork at each of its ends, as `seam * 2 + fork`.
    type Lobe = { from: number; to: number; first: number; last: number };
    const tagged: Lobe[][] = sections.map(
      (s: IAutoMovieConstructionComposedEnd.ISection, i: number): Lobe[] => {
        const cuts: { phase: number; fork: number }[] = [
          ...(i > 0
            ? seams[i - 1]!.forks.map(
                (
                  f: IAutoMovieConstructionComposedEnd.IFork,
                  k: number,
                ): { phase: number; fork: number } => ({
                  phase: f.phases[1],
                  fork: 2 * (i - 1) + k,
                }),
              )
            : []),
          ...(i < seams.length
            ? seams[i]!.forks.map(
                (
                  f: IAutoMovieConstructionComposedEnd.IFork,
                  k: number,
                ): { phase: number; fork: number } => ({
                  phase: f.phases[0],
                  fork: 2 * i + k,
                }),
              )
            : []),
        ].sort(
          (a: { phase: number }, b: { phase: number }): number =>
            a.phase - b.phase,
        );
        const out: Lobe[] = [];
        cuts.forEach(
          (from: { phase: number; fork: number }, k: number): void => {
            const next: { phase: number; fork: number } =
              cuts[(k + 1) % cuts.length]!;
            const to: number =
              k + 1 < cuts.length ? next.phase : next.phase + turn;
            const middle: V2 = flat(s.at((from.phase + to) / 2).point);
            const covered: boolean =
              (i > 0 && inside(polygons[i - 1]!, middle)) ||
              (i + 1 < sections.length && inside(polygons[i + 1]!, middle));
            if (!covered)
              out.push({
                from: from.phase,
                to,
                first: from.fork,
                last: next.fork,
              });
          },
        );
        return out;
      },
    );

    // The outline: from the first section's lobe, each piece ends in a fork at which the neighbouring section's lobe begins.
    const pieces: IAutoMovieConstructionComposedEnd.IPiece[] = [];
    const ends: [number, number][] = [];
    const total: number = tagged.reduce(
      (sum: number, list: Lobe[]): number => sum + list.length,
      0,
    );
    if (tagged[0]!.length !== 1)
      return `the section of ${sections[0]!.name} keeps ${tagged[0]!.length} lobes on the outline, not one`;
    let section: number = 0;
    let fork: number = tagged[0]![0]!.last;
    pieces.push({
      section: 0,
      from: tagged[0]![0]!.from,
      to: tagged[0]![0]!.to,
    });
    ends.push([tagged[0]![0]!.first, tagged[0]![0]!.last]);
    while (pieces.length < total) {
      const seam: number = Math.floor(fork / 2);
      const other: number = section === seam ? seam + 1 : seam;
      const lobe: Lobe | undefined = tagged[other]!.find(
        (l: Lobe): boolean => l.first === fork || l.last === fork,
      );
      if (lobe === undefined) break;
      const forward: boolean = lobe.first === fork;
      pieces.push({
        section: other,
        from: forward ? lobe.from : lobe.to,
        to: forward ? lobe.to : lobe.from,
      });
      ends.push([fork, forward ? lobe.last : lobe.first]);
      section = other;
      fork = forward ? lobe.last : lobe.first;
    }
    if (
      pieces.length !== total ||
      section !== 1 ||
      fork !== tagged[0]![0]!.first
    )
      return "the sections' lobes do not close into one outline";

    const read = (
      piece: IAutoMovieConstructionComposedEnd.IPiece,
      share: number,
    ): { point: Vec3; first: Vec3; second?: Vec3 } => {
      const span: number = piece.to - piece.from;
      const r: { point: Vec3; first: Vec3; second?: Vec3 } = sections[
        piece.section
      ]!.at(piece.from + span * share);
      return {
        point: r.point,
        first: scale(r.first, span),
        ...(r.second === undefined
          ? {}
          : { second: scale(r.second, span * span) }),
      };
    };
    // Each piece at `samples + 1` equal shares, in the plane: where a distance to the outline starts from.
    const samples: V2[][] = pieces.map(
      (piece: IAutoMovieConstructionComposedEnd.IPiece): V2[] =>
        Array.from(
          { length: m + 1 },
          (_: unknown, k: number): V2 => flat(read(piece, k / m).point),
        ),
    );
    // Retain competing sites within arithmetic roundoff only in the optional observation.
    const distanceTie = (a: number, b: number): boolean =>
      Math.abs(a - b) <= 64 * Number.EPSILON * (1 + Math.max(a, b));
    return {
      seams,
      lobes: tagged.map((list: Lobe[]): [number, number][] =>
        list.map((l: Lobe): [number, number] => [l.from, l.to]),
      ),
      centres: centres.map(
        (c: V2): Vec3 =>
          add(input.point, add(scale(e1, c[0]), scale(e2, c[1]))),
      ),
      outline: {
        pieces,
        at: (t: number): { point: Vec3; first: Vec3; second?: Vec3 } => {
          const x: number =
            ((t % pieces.length) + pieces.length) % pieces.length;
          const i: number = Math.min(pieces.length - 1, Math.floor(x));
          return read(pieces[i]!, x - i);
        },
        distance: (point, observe): number => {
          const q: V2 = flat(point);
          // Each piece's nearest sample; then, on the two pieces whose samples stand nearest, the foot on the section itself: each
          // step moves the share by the gap's part along the tangent over the tangent's length, held inside the piece, until it
          // moves by under 1e-14 of the piece.
          const nearest: { piece: number; share: number; d: number }[] = samples
            .map(
              (
                list: V2[],
                i: number,
              ): { piece: number; share: number; d: number } => {
                let [share, least]: [number, number] = [0, Infinity];
                list.forEach((p: V2, k: number): void => {
                  const d: number = Math.hypot(p[0] - q[0], p[1] - q[1]);
                  if (d < least) [least, share] = [d, k / m];
                });
                return { piece: i, share, d: least };
              },
            )
            .sort((a: { d: number }, b: { d: number }): number => a.d - b.d);
          let best: number = nearest[0]!.d;
          const evidence =
            observe === undefined
              ? undefined
              : {
                  best: {
                    piece: nearest[0]!.piece,
                    share: nearest[0]!.share,
                    distance: best,
                    settled: false,
                  },
                  pieces: new Map<
                    number,
                    { share: number; distance: number; settled: boolean }
                  >(),
                };
          const retain =
            evidence === undefined
              ? undefined
              : (
                  piece: number,
                  share: number,
                  distance: number,
                  settled: boolean,
                ): void => {
                  const winner = evidence.best;
                  // Keep the original search's exact scalar winner, with a settled version of the same branch when available.
                  if (
                    distance < winner.distance ||
                    (piece === winner.piece &&
                      distance === winner.distance &&
                      settled &&
                      !winner.settled)
                  )
                    evidence.best = { piece, share, distance, settled };
                  const existing = evidence.pieces.get(piece);
                  if (
                    existing === undefined ||
                    distance < existing.distance ||
                    (settled &&
                      !existing.settled &&
                      distanceTie(distance, existing.distance))
                  )
                    evidence.pieces.set(piece, { share, distance, settled });
                };
          if (retain !== undefined)
            for (const start of nearest)
              retain(start.piece, start.share, start.d, false);
          for (const start of nearest.slice(0, 2)) {
            const piece: IAutoMovieConstructionComposedEnd.IPiece =
              pieces[start.piece]!;
            let share: number = start.share;
            for (let step: number = 0; step < 32; ++step) {
              const r: { point: Vec3; first: Vec3 } = read(piece, share);
              const [p, d]: [V2, V2] = [flat(r.point), lean(r.first)];
              const distance: number = Math.hypot(p[0] - q[0], p[1] - q[1]);
              best = Math.min(best, distance);
              const speed: number = d[0] * d[0] + d[1] * d[1];
              if (!(speed > 0)) {
                retain?.(start.piece, share, distance, false);
                break;
              }
              const next: number = Math.min(
                1,
                Math.max(
                  0,
                  share + ((q[0] - p[0]) * d[0] + (q[1] - p[1]) * d[1]) / speed,
                ),
              );
              const settled: boolean = Math.abs(next - share) <= 1e-14;
              retain?.(start.piece, share, distance, settled);
              if (settled) break;
              share = next;
            }
          }
          if (observe !== undefined && evidence !== undefined) {
            const winner = evidence.best;
            const sites: IAutoMovieConstructionComposedEnd.IOutlineDistanceSite[] =
              [
                {
                  piece: winner.piece,
                  share: winner.share,
                  forks: ends[winner.piece]!,
                  settled: winner.settled,
                },
              ];
            for (const [piece, hit] of evidence.pieces)
              if (piece !== winner.piece && distanceTie(hit.distance, best))
                sites.push({
                  piece,
                  share: hit.share,
                  forks: ends[piece]!,
                  settled: hit.settled,
                });
            observe(sites);
          }
          return best;
        },
      },
    };
  }

  /**
   * A child's section in the end plane from its skin and the end plane's cut of
   * it (`AutoMovieConstructionSkinCut`).
   *
   * @param name The child's name.
   * @param surface The child's skin.
   * @param cut The skin cut by the end plane.
   * @param into The station's sign into the child.
   * @param samples Phases over which the axis is averaged.
   * @returns The section, or the refusal when the stations have no mean
   *   direction.
   */
  export function section(
    name: string,
    surface: IAutoMovieSolidSurface,
    cut: IAutoMovieConstructionSkinCut.ICut,
    into: 1 | -1,
    samples: number,
  ): IAutoMovieConstructionComposedEnd.ISection | string {
    let sum: Vec3 = [0, 0, 0];
    for (let k: number = 0; k < samples; ++k) {
      const psi: number = (2 * Math.PI * k) / samples;
      const along: Vec3 | null = unit(surface.jet(cut.at(psi)[0], psi).u);
      if (along !== null) sum = add(sum, scale(along, into));
    }
    const axis: Vec3 | null = unit(sum);
    if (axis === null)
      return `the stations of ${name} have no mean direction across its section`;
    return {
      name,
      axis,
      at: (psi: number): { point: Vec3; first: Vec3; second: Vec3 } => {
        const [u, slope, bend]: [number, number, number] = cut.at(psi);
        const j: IAutoMovieSolidSurface.IJet = surface.jet(u, psi);
        return {
          point: [j.p[0], j.p[1], j.p[2]],
          first: add(scale(j.u, slope), j.v),
          second: AutoMovieSolidVector.combine([
            [slope * slope, j.uu],
            [2 * slope, j.uv],
            [1, j.vv],
            [bend, j.u],
          ]),
        };
      },
    };
  }
}
