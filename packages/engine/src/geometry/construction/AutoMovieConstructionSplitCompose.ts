import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionComposedEnd,
  IAutoMovieConstructionSkinCut,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitCompose,
} from "@automovie/interface";

import { AutoMovieConstructionComposedEnd as ComposedEnd } from "./AutoMovieConstructionComposedEnd";
import { AutoMovieConstructionSkinCut as SkinCut } from "./AutoMovieConstructionSkinCut";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World point or direction, mm. */
type Vec3 = AutoMovieVector3Tuple;
const { add, dot, scale, sub, unit } = AutoMovieSolidVector;

/**
 * What a split derives from its declared planes (`IAutoMovieConstructionSplit.ICut`, `ICompose`): a child's rail as its skin cut by
 * planes written in a named frame, and from a composed end the forks on the host's ring, the seam planes and every child's rail.
 */
export namespace AutoMovieConstructionSplitCompose {
  /**
   * A section's frame as a basis: its planar origin and axes, the third axis `v x u` signed out of the host or into the child.
   *
   * @param frame The section's frame, mm.
   * @param sign The sign that turns `v x u` to the third axis.
   * @returns The basis, or null when the frame's axes span no plane.
   */
  export function basis(
    frame: { origin: readonly number[]; u: readonly number[]; v: readonly number[] },
    sign: 1 | -1,
  ): IAutoMovieConstructionSplitCompose.IBasis | null {
    const u: Vec3 = [frame.u[0]!, frame.u[1]!, frame.u[2]!];
    const v: Vec3 = [frame.v[0]!, frame.v[1]!, frame.v[2]!];
    const x: Vec3 | null = unit(u);
    const y: Vec3 | null = unit(v);
    const z: Vec3 | null = unit(scale(AutoMovieSolidVector.cross(v, u), sign));
    if (x === null || y === null || z === null) return null;
    return { origin: [frame.origin[0]!, frame.origin[1]!, frame.origin[2]!], x, y, z };
  }

  /** A declared plane in kernel coordinates: metres in its frame to mm, its normal made unit; null for a zero normal. */
  export function plane(declared: IAutoMovieConstructionSplit.IPlane, frame: IAutoMovieConstructionSplitCompose.IBasis | null): IAutoMovieConstructionSkinCut.IPlane | null {
    const S: number = AutoMovieConstructionViews.SCALE;
    const carry = (a: readonly number[], length: number): Vec3 =>
      frame === null
        ? [a[0]! * length, a[1]! * length, a[2]! * length]
        : add(add(scale(frame.x, a[0]! * length), scale(frame.y, a[1]! * length)), scale(frame.z, a[2]! * length));
    const normal: Vec3 | null = unit(carry(declared.normal, 1));
    if (normal === null) return null;
    return { point: frame === null ? carry(declared.point, S) : add(frame.origin, carry(declared.point, S)), normal };
  }

  /**
   * A child's declared rail (`IAutoMovieConstructionSplit.ICut`), or the refusal.
   *
   * @param declared The cut.
   * @param host The host end section's frame.
   * @param child The child.
   * @param samples Phases at which the cut is admitted, the band's columns.
   * @returns The cut, or the refusal naming the child.
   */
  export function cut(
    declared: IAutoMovieConstructionSplit.ICut,
    host: IAutoMovieConstructionSplitCompose.IBasis,
    child: IAutoMovieConstructionSplitCompose.IChild,
    samples: number,
  ): IAutoMovieConstructionSkinCut.ICut | string {
    const frame: IAutoMovieConstructionSplitCompose.IBasis | null = declared.frame === "tree" ? null : declared.frame === "host" ? host : child.basis;
    const planes: IAutoMovieConstructionSkinCut.IPlane[] = [];
    for (const p of declared.planes) {
      const made: IAutoMovieConstructionSkinCut.IPlane | null = plane(p, frame);
      if (made === null) return `the child face ${child.name}'s cut has a plane without a normal`;
      planes.push(made);
    }
    const made: IAutoMovieConstructionSkinCut.ICut | string = SkinCut.create({
      surface: child.surface,
      planes,
      ...(declared.round === undefined ? {} : { round: declared.round * AutoMovieConstructionViews.SCALE }),
      into: child.into,
      stations: child.stations,
      samples,
    });
    return typeof made === "string" ? `the child face ${child.name}'s cut: ${made}` : made;
  }

  /**
   * Bind the child's cut to the same physical plane and wall consumed by the composed split.
   */
  export function section(
    plane: IAutoMovieConstructionSkinCut.IPlane,
    child: IAutoMovieConstructionSplitCompose.IChild,
    count: number,
  ): IAutoMovieConstructionSplitCompose.ISection | string {
    const cut = SkinCut.create({ surface: child.surface, planes: [plane], into: child.into, stations: child.stations, samples: count });
    if (typeof cut === "string") return "the child face " + child.name + "'s section is not admitted in the end plane: " + cut;
    const section = ComposedEnd.section(child.name, child.surface, cut, child.into, count);
    return typeof section === "string" ? section : { child, plane, count, cut, section };
  }

  /**
   * Derive a composed end (`IAutoMovieConstructionSplit.ICompose`), or the refusal.
   *
   * Each child's section is its skin cut by the end plane; the composition gives each pair's forks and seam plane
   * (`AutoMovieConstructionComposedEnd`). Seam `j`'s host phases are the two crossings of its plane with the host's end ring, `a` where
   * the ring passes to the lower children's side and `b` where it returns, moved by whole turns so that each seam encloses the one
   * before. Each child's rail is its skin cut by the end plane and its seam planes, each moved along the child's axis by its rail distance.
   *
   * @param input The declaration, the host's ring and frame, the children and the band's columns.
   * @param prepared The engine's own previously prepared cuts on these same sources and physical plane.
   * @returns The derived members, or the refusal.
   */
  export function derive(
    input: IAutoMovieConstructionSplitCompose.IInput,
    prepared?: readonly IAutoMovieConstructionSplitCompose.ISection[],
  ): IAutoMovieConstructionSplitCompose.IDerived | string {
    const { compose, host, children, count }: typeof input = input;
    const S: number = AutoMovieConstructionViews.SCALE;
    const turn: number = 2 * Math.PI;
    const end: IAutoMovieConstructionSkinCut.IPlane | null = plane(compose.plane, compose.frame === "tree" ? null : host.basis);
    if (end === null) return "the composed end's plane has no normal";

    // Each child's section in the end plane.
    const sections: IAutoMovieConstructionComposedEnd.ISection[] = [];
    if (prepared !== undefined && prepared.length !== children.length) return "the prepared child sections have different membership";
    for (const [index, child] of children.entries()) {
      const bound = prepared === undefined ? section(end, child, count) : prepared[index]!;
      if (typeof bound === "string") return bound;
      if (bound.child !== child || bound.count !== count ||
          !end.point.every((v, i): boolean => v === bound.plane.point[i]) ||
          !end.normal.every((v, i): boolean => v === bound.plane.normal[i]))
        return "the prepared section of " + child.name + " has a different physical source or end plane";
      sections.push(bound.section);
    }
    const composition: IAutoMovieConstructionComposedEnd.IComposition | string = ComposedEnd.create({
      point: end.point,
      normal: end.normal,
      sections,
      samples: count,
    });
    if (typeof composition === "string") return composition;

    // Each seam's forks on the host's ring: where its plane crosses the ring.
    const ring = (phi: number): Vec3 => {
      const p: readonly number[] = host.surface.jet(host.station, phi).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    const m: number = 8 * count;
    const seams: [number, number][] = [];
    for (const [j, seam] of composition.seams.entries()) {
      const side = (phi: number): number => dot(seam.normal, sub(ring(phi), seam.forks[0].point));
      const values: number[] = Array.from({ length: m }, (_: unknown, k: number): number => side((turn * k) / m));
      const falls: number[] = [];
      const rises: number[] = [];
      for (let k: number = 0; k < m; ++k) {
        const [here, next]: [number, number] = [values[k]!, values[(k + 1) % m]!];
        if (here > 0 === next > 0) continue;
        let [lo, hi]: [number, number] = [(turn * k) / m, (turn * (k + 1)) / m];
        for (let step: number = 0; step < 200; ++step) {
          const mid: number = (lo + hi) / 2;
          if (mid === lo || mid === hi) break;
          if (side(mid) > 0 === here > 0) lo = mid;
          else hi = mid;
        }
        (here > 0 ? falls : rises).push(hi);
      }
      if (falls.length !== 1 || rises.length !== 1)
        return `seam ${j}'s plane crosses the host's end ring ${falls.length + rises.length} times, not twice`;
      let a: number = falls[0]!;
      if (j > 0) {
        const before: [number, number] = seams[j - 1]!;
        a -= turn * Math.ceil((a - before[0]) / turn);
        if (a === before[0]) a -= turn;
      } else if (a > Math.PI) a -= turn;
      let b: number = rises[0]!;
      b += turn * Math.ceil((a - b) / turn);
      if (b === a) b += turn;
      if (j > 0 && !(b > seams[j - 1]![1] && seams[j - 1]![0] - a < turn && b < a + turn))
        return `seam ${j}'s forks on the host's end ring, phases [${a}, ${b}], do not enclose seam ${j - 1}'s [${seams[j - 1]![0]}, ${seams[j - 1]![1]}]`;
      seams.push([a, b]);
    }

    // The host's end ring against the composed outline, in the end plane: a band spans what stands between them, so a ring farther
    // from the outline than the shortest band is long is refused; beyond that the band's columns would run more across the children
    // than along them.
    let [most, sum]: [number, number] = [0, 0];
    for (let k: number = 0; k < m; ++k) {
      const d: number = composition.outline.distance(ring((turn * k) / m));
      most = Math.max(most, d);
      sum += d;
    }
    const least: number = Math.min(...children.map((child: IAutoMovieConstructionSplitCompose.IChild): number => child.rail));
    if (!(most <= least))
      return `the host's end ring stands up to ${most} mm (mean ${sum / m} mm) from the composed outline in the end plane, more than the band's length ${least} mm`;

    // Each child's boundary in the composition: its skin cut by the end plane and its seam planes where they stand.
    const wedge = (i: number, shift: Vec3): IAutoMovieConstructionSkinCut.IPlane[] => {
      const planes: IAutoMovieConstructionSkinCut.IPlane[] = [{ point: add(end.point, shift), normal: end.normal }];
      if (i > 0) planes.push({ point: add(composition.seams[i - 1]!.forks[0].point, shift), normal: composition.seams[i - 1]!.normal });
      if (i < composition.seams.length)
        planes.push({ point: add(composition.seams[i]!.forks[0].point, shift), normal: scale(composition.seams[i]!.normal, -1) });
      return planes;
    };
    const bounds: IAutoMovieConstructionSkinCut.ICut[] = [];
    for (const [i, child] of children.entries()) {
      const made: IAutoMovieConstructionSkinCut.ICut | string = SkinCut.create({ surface: child.surface, planes: wedge(i, [0, 0, 0]), into: child.into, stations: child.stations, samples: count });
      if (typeof made === "string") return `the child face ${child.name}'s boundary in the composition: ${made}`;
      bounds.push(made);
    }

    // Each seam's valley: where the union of the two children crosses the seam plane, the deeper of the two children's own cuts by
    // that plane at each place along the chord between the forks, read at the seam's inner columns' shares of that chord.
    const q: number = count / 4;
    const valleys: [number, number][][] = [];
    for (const [j, seam] of composition.seams.entries()) {
      const A: Vec3 = ring(seams[j]![0]);
      const B: Vec3 = ring(seams[j]![1]);
      const e1: Vec3 | null = unit(sub(B, A));
      if (e1 === null) return `seam ${j}'s forks on the host's end ring coincide`;
      const across: Vec3 | null = unit(sub(seam.heading, scale(e1, dot(seam.heading, e1))));
      if (across === null) return `seam ${j}'s bisector runs along its chord on the host's end ring`;
      const e2: Vec3 = dot(across, end.normal) < 0 ? scale(across, -1) : across;
      const place = (p: readonly number[]): [number, number] => {
        const d: Vec3 = sub([p[0]!, p[1]!, p[2]!], A);
        return [dot(d, e1), dot(d, e2)];
      };
      const ends: [number, number] = [place(seam.forks[0].point)[0], place(seam.forks[1].point)[0]];
      /** One child's cut by the seam plane as a depth at a place along the chord, by bisection on its phase over its covered arc. */
      const depth = (i: number, which: 0 | 1): ((along: number) => number) | string => {
        const child: IAutoMovieConstructionSplitCompose.IChild = children[i]!;
        const [pa, pb]: [number, number] = [seam.forks[0].phases[which], seam.forks[1].phases[which]];
        const free = (psi: number): boolean =>
          composition.lobes[i]!.some(([from, to]: [number, number]): boolean => {
            const x: number = (((psi - from) % turn) + turn) % turn;
            return x > 0 && x < to - from;
          });
        // The arc from fork 0 to fork 1 that no lobe holds, by increasing or by decreasing phase.
        const up: number = pa + ((((pb - pa) % turn) + turn) % turn);
        const to: number = free((pa + up) / 2) ? up - turn : up;
        const at = (psi: number): [number, number] => place(child.surface.jet(bounds[i]!.at(psi)[0], psi).p);
        if (!(Math.sign(at(to)[0] - at(pa)[0]) === Math.sign(ends[1] - ends[0])))
          return `the child face ${child.name}'s cut by seam ${j}'s plane does not run from fork to fork`;
        return (along: number): number => {
          let [lo, hi]: [number, number] = [pa, to];
          for (let step: number = 0; step < 200; ++step) {
            const mid: number = (lo + hi) / 2;
            if (mid === lo || mid === hi) break;
            if (at(mid)[0] < along === ends[0] < ends[1]) lo = mid;
            else hi = mid;
          }
          return at((lo + hi) / 2)[1];
        };
      };
      const [lower, upper]: [((along: number) => number) | string, ((along: number) => number) | string] = [depth(j, 0), depth(j + 1, 1)];
      if (typeof lower === "string") return lower;
      if (typeof upper === "string") return upper;
      // Only the common along-chord domain is represented by this seam. An
      // internal composed fork remains a depth-zero knot. An external fork
      // belongs to the child outline; the actual host fork owns the seam's
      // end and tangent there. Read the skin at new interior stations instead
      // of carrying a point beyond the host chord or clamping its position.
      const chord: number = place(B)[0];
      const from: number = Math.max(0, Math.min(...ends));
      const to: number = Math.min(chord, Math.max(...ends));
      if (!(from < to)) return `seam ${j}'s composed and host chords do not overlap`;
      // A fork within 1e-9 mm is the ring's own to the two solves' roundoff.
      const knots: [number, number][] = from > 1e-9 ? [[from, 0]] : [];
      for (let i: number = 1; i < q; ++i) {
        const along: number = from + ((to - from) * i) / q;
        knots.push([along, Math.max(lower(along), upper(along))]);
      }
      if (to < chord - 1e-9) knots.push([to, 0]);
      valleys.push(knots);
    }

    // Each child's rail: the end plane and its seam planes, each moved along the child's axis by its rail distance, so the rail is the
    // child's boundary in the composition moved along its stations.
    const cuts: IAutoMovieConstructionSkinCut.ICut[] = [];
    for (const [i, child] of children.entries()) {
      const shift: Vec3 = scale(sections[i]!.axis, child.rail);
      const planes: IAutoMovieConstructionSkinCut.IPlane[] = wedge(i, shift);
      const made: IAutoMovieConstructionSkinCut.ICut | string = SkinCut.create({
        surface: child.surface,
        planes,
        ...(compose.round === undefined ? {} : { round: compose.round * S }),
        into: child.into,
        stations: child.stations,
        samples: count,
      });
      if (typeof made === "string") return `the child face ${child.name}'s rail: ${made}`;
      cuts.push(made);
    }
    return {
      seams,
      headings: composition.seams.map((seam: IAutoMovieConstructionComposedEnd.ISeam): Vec3 => seam.heading),
      valleys,
      host: { max: most, mean: sum / m },
      cuts,
      composition,
    };
  }
}
