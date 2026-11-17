import type { IAutoMovieConstructionSplit } from "@automovie/interface";

import { AutoMovieConstructionComposedEnd as ComposedEnd } from "./AutoMovieConstructionComposedEnd";
import { AutoMovieConstructionSkinCut as SkinCut } from "./AutoMovieConstructionSkinCut";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or direction, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;
const { add, dot, scale, sub, unit } = AutoMovieSolidVector;

/**
 * What a split derives from its declared planes (`IAutoMovieConstructionSplit.ICut`, `ICompose`): a child's rail as its skin cut by
 * planes written in a named frame, and from a composed end the forks on the host's ring, the seam planes and every child's rail.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two derivations and their sources.
 * @evidence contracts/development/design.md#principled-representation Planes fixed in a section's frame are resolved through that frame, and the composed end's forks, seam planes and rails are computed from the children's skins, so every result is a function of the parts' frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A frame record, a child record, the derived record and three functions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every failed premise is returned as a named refusal; nothing is clamped, tabulated or repaired.
 */
export namespace AutoMovieConstructionSplitCompose {
  /**
   * An orthonormal frame in kernel coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation An origin and three unit axes carry a point or a direction written in the frame into the kernel's coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four vectors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only.
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   */
  export interface IBasis {
    /** The origin, mm. */
    origin: Vec3;

    /** The first axis, unit. */
    x: Vec3;

    /** The second axis, unit. */
    y: Vec3;

    /** The third axis, unit. */
    z: Vec3;
  }

  /**
   * One child as the derivations read it.
   *
   * @evidence contracts/development/design.md#principled-representation The child's skin, its kept side, its own stations and its facing end's frame are what a cut of it needs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values only; the realization admits the face before it builds this record.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit.
   */
  export interface IChild {
    /** The child face's name in refusals. */
    name: string;

    /** The child's skin. */
    surface: IAutoMovieSolidSurface;

    /** The station's sign into the child's kept side. */
    into: 1 | -1;

    /** The child's own stations inside its domain, increasing, mm. */
    stations: readonly number[];

    /** The child's declared rail distance, mm. */
    rail: number;

    /** The child's facing end section's frame, its third axis into the child. */
    basis: IBasis;
  }

  /**
   * What a composed end gives the split.
   *
   * @evidence contracts/development/design.md#principled-representation The seams' host phases, their planes' headings and the children's rails are exactly the members the split otherwise reads from its declaration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values derived from the children's skins and the host's ring alone.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's indexing and unit.
   */
  export interface IDerived {
    /** Each seam's host phases `[a, b]` in the split's own convention, radians. */
    seams: [number, number][];

    /** Each seam plane's bisector, unit. */
    headings: Vec3[];

    /**
     * Each seam's valley as the seam's knots `[along, depth]`, mm, in the seam's own plane coordinates from its first fork on the host's
     * ring (`AutoMovieConstructionSplitSeam.create`): at each place along the chord the deeper of the two children's cuts by the seam plane.
     */
    valleys: [number, number][][];

    /** How far the host's end ring stands from the composed outline in the end plane, mm: the greatest and the mean over the ring's samples. */
    host: { max: number; mean: number };

    /** Each child's rail. */
    cuts: SkinCut.ICut[];

    /** The composition the rest was derived from. */
    composition: ComposedEnd.IComposition;
  }

  /**
   * A section's frame as a basis: its planar origin and axes, the third axis `v x u` signed out of the host or into the child.
   *
   * @param frame The section's frame, mm.
   * @param sign The sign that turns `v x u` to the third axis.
   * @returns The basis, or null when the frame's axes span no plane.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The stations advance along `v x u` of a section's frame, so the signed product is the direction out of an end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three normalizations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A degenerate frame returns null; no default axis is substituted.
   * @evidence contracts/development/common.md#meaningful-documentation States the axes and the null case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record.
   */
  export function basis(
    frame: { origin: readonly number[]; u: readonly number[]; v: readonly number[] },
    sign: 1 | -1,
  ): IBasis | null {
    const u: Vec3 = [frame.u[0]!, frame.u[1]!, frame.u[2]!];
    const v: Vec3 = [frame.v[0]!, frame.v[1]!, frame.v[2]!];
    const x: Vec3 | null = unit(u);
    const y: Vec3 | null = unit(v);
    const z: Vec3 | null = unit(scale(AutoMovieSolidVector.cross(v, u), sign));
    if (x === null || y === null || z === null) return null;
    return { origin: [frame.origin[0]!, frame.origin[1]!, frame.origin[2]!], x, y, z };
  }

  /** A declared plane in kernel coordinates: metres in its frame to mm, its normal made unit; null for a zero normal. */
  function plane(declared: IAutoMovieConstructionSplit.IPlane, frame: IBasis | null): SkinCut.IPlane | null {
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each plane is carried from its named frame into kernel coordinates and the rail is the child's skin on their common kept region (`AutoMovieConstructionSkinCut`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Frame, planes, then the cut.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero normal and every refusal of the cut are returned with the child's name.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms The cut's own cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One cut per child coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the caller-owned cut.
   */
  export function cut(
    declared: IAutoMovieConstructionSplit.ICut,
    host: IBasis,
    child: IChild,
    samples: number,
  ): SkinCut.ICut | string {
    const frame: IBasis | null = declared.frame === "tree" ? null : declared.frame === "host" ? host : child.basis;
    const planes: SkinCut.IPlane[] = [];
    for (const p of declared.planes) {
      const made: SkinCut.IPlane | null = plane(p, frame);
      if (made === null) return `the child face ${child.name}'s cut has a plane without a normal`;
      planes.push(made);
    }
    const made: SkinCut.ICut | string = SkinCut.create({
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
   * Derive a composed end (`IAutoMovieConstructionSplit.ICompose`), or the refusal.
   *
   * Each child's section is its skin cut by the end plane; the composition gives each pair's forks and seam plane
   * (`AutoMovieConstructionComposedEnd`). Seam `j`'s host phases are the two crossings of its plane with the host's end ring, `a` where
   * the ring passes to the lower children's side and `b` where it returns, moved by whole turns so that each seam encloses the one
   * before. Each child's rail is its skin cut by the end plane and its seam planes, each moved along the child's axis by its rail distance.
   *
   * @param input The declaration, the host's ring and frame, the children and the band's columns.
   * @returns The derived members, or the refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Sections, composition, the ring's crossings with each seam plane by sign change and bisection, then the offset wedge's cut of each child.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four steps in the order their results are needed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a section not admitted in the plane, every refusal of the composition, a seam plane that does not cross the ring twice, forks that do not nest and every refusal of a rail; no phase is authored or snapped. Two ring crossings between two of the ring's samples are not seen.
   * @evidence contracts/development/common.md#meaningful-documentation States each step and the refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per child two cuts; per seam one pass round the ring at eight samples per band column and two bisections.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each seam plane serves its host forks and both neighbours' rails.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the caller-owned record; the sections are released.
   */
  export function derive(input: {
    compose: IAutoMovieConstructionSplit.ICompose;
    host: { surface: IAutoMovieSolidSurface; station: number; basis: IBasis };
    children: readonly IChild[];
    count: number;
  }): IDerived | string {
    const { compose, host, children, count }: typeof input = input;
    const S: number = AutoMovieConstructionViews.SCALE;
    const turn: number = 2 * Math.PI;
    const end: SkinCut.IPlane | null = plane(compose.plane, compose.frame === "tree" ? null : host.basis);
    if (end === null) return "the composed end's plane has no normal";

    // Each child's section in the end plane.
    const sections: ComposedEnd.ISection[] = [];
    for (const child of children) {
      const across: SkinCut.ICut | string = SkinCut.create({
        surface: child.surface,
        planes: [end],
        into: child.into,
        stations: child.stations,
        samples: count,
      });
      if (typeof across === "string")
        return `the child face ${child.name}'s section is not admitted in the end plane: ${across}`;
      const section: ComposedEnd.ISection | string = ComposedEnd.section(child.name, child.surface, across, child.into, count);
      if (typeof section === "string") return section;
      sections.push(section);
    }
    const composition: ComposedEnd.IComposition | string = ComposedEnd.create({
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
    const least: number = Math.min(...children.map((child: IChild): number => child.rail));
    if (!(most <= least))
      return `the host's end ring stands up to ${most} mm (mean ${sum / m} mm) from the composed outline in the end plane, more than the band's length ${least} mm`;

    // Each child's boundary in the composition: its skin cut by the end plane and its seam planes where they stand.
    const wedge = (i: number, shift: Vec3): SkinCut.IPlane[] => {
      const planes: SkinCut.IPlane[] = [{ point: add(end.point, shift), normal: end.normal }];
      if (i > 0) planes.push({ point: add(composition.seams[i - 1]!.forks[0].point, shift), normal: composition.seams[i - 1]!.normal });
      if (i < composition.seams.length)
        planes.push({ point: add(composition.seams[i]!.forks[0].point, shift), normal: scale(composition.seams[i]!.normal, -1) });
      return planes;
    };
    const bounds: SkinCut.ICut[] = [];
    for (const [i, child] of children.entries()) {
      const made: SkinCut.ICut | string = SkinCut.create({ surface: child.surface, planes: wedge(i, [0, 0, 0]), into: child.into, stations: child.stations, samples: count });
      if (typeof made === "string") return `the child face ${child.name}'s boundary in the composition: ${made}`;
      bounds.push(made);
    }

    // Each seam's valley: where the union of the two children crosses the seam plane, the deeper of the two children's own cuts by
    // that plane at each place along the chord between the forks, read at the seam's inner columns' shares of that chord.
    const q: number = count / 4;
    const valleys: [number, number][][] = [];
    for (const [j, seam] of composition.seams.entries()) {
      const A: Vec3 = ring(seams[j]![0]);
      const e1: Vec3 | null = unit(sub(ring(seams[j]![1]), A));
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
        const child: IChild = children[i]!;
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
      const knots: [number, number][] = [];
      for (let i: number = 1; i < q; ++i) {
        const along: number = ends[0] + ((ends[1] - ends[0]) * i) / q;
        knots.push([along, Math.max(lower(along), upper(along))]);
      }
      // Where the host's ring is not the outline its forks stand outside the composition's on the same line, and the seam runs
      // through the composition's forks too; a fork within 1e-9 mm of the ring's, rounding of the two solves, is the ring's own.
      const chord: number = place(ring(seams[j]![1]))[0];
      const forks: [number, number][] = seam.forks.map((f: ComposedEnd.IFork): [number, number] => place(f.point));
      const ordered: [number, number][] = [forks[0]!, ...knots, forks[1]!];
      if (!(ends[0] < ends[1])) ordered.reverse();
      valleys.push(ordered.filter(([along]: [number, number], k: number): boolean => (k !== 0 && k !== ordered.length - 1) || (along > 1e-9 && along < chord - 1e-9)));
    }

    // Each child's rail: the end plane and its seam planes, each moved along the child's axis by its rail distance, so the rail is the
    // child's boundary in the composition moved along its stations.
    const cuts: SkinCut.ICut[] = [];
    for (const [i, child] of children.entries()) {
      const shift: Vec3 = scale(sections[i]!.axis, child.rail);
      const planes: SkinCut.IPlane[] = wedge(i, shift);
      const made: SkinCut.ICut | string = SkinCut.create({
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
      headings: composition.seams.map((seam: ComposedEnd.ISeam): Vec3 => seam.heading),
      valleys,
      host: { max: most, mean: sum / m },
      cuts,
      composition,
    };
  }
}
