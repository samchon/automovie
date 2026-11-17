import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanCourseRuns as Runs,
  AutoMovieHumanKnotRule as Rule,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
} from "@automovie/interface";

/**
 * A family's station knots at its landmarks, for the fit tool: its run ends, its measurement sites and the extrema of its wall's own
 * outlines, each as a place in its run, no two closer than the form's scale (`AutoMovieHumanKnotRule`).
 *
 * The fit tool chooses a wall's knots today by seeding and pruning against the fit's residual, which puts them where one person's trace
 * needed them. This module gives the knots from the part itself, so a fit takes them as given: one call with the family as it stands
 * (its course, its layout and a wall whose outlines can be read: the stored wall, or a first fit on any knots) and the stations of its
 * sites.
 *
 * - Run ends: the family's first and last fitted station and every joint of its course between them (`AutoMovieHumanCourseRuns.joints`),
 *   or the stations given as `joints` where the course has none of its own (the trunk's segment origins on its straight course).
 * - Outlines: each extreme's own coordinate along the course, a `u` anchor's `u` and a `v` anchor's `v`, read through the wall's fields.
 * - Scale: the mean of those coordinates' sizes at a station, the section's mean reach.
 */
export namespace FamilyConicLandmarkKnots {
  /** What places a family's knots besides the family. */
  export interface IOptions {
    /** The measurement sites' stations on the family's course, mm; those outside its fitted stations are left out. */
    sites: readonly number[];

    /** Run ends that replace the course's own joints, mm; absent, the course's joints. */
    joints?: readonly number[];

    /** The last station knotted, mm; absent, the last station the fields own (the cap's start, or the last knot). */
    to?: number;

    /** The least distance between two knots as a share of the section's mean reach; absent, one half. */
    share?: number;

    /** The spacing the outlines are searched at, mm. */
    step: number;
  }

  /** One knot with its basis and its place in its run. */
  export interface IKnot {
    /** Its station, mm. */
    station: number;

    /** What put it there. */
    basis: Rule.IKnot["basis"];

    /** The index of its run among the family's runs. */
    run: number;

    /** Its place in that run, `(station - start) / (end - start)`. */
    tau: number;
  }

  /** The least spacing's share where none is given: half the section's mean reach, the scale of the form a wall carries. */
  const SHARE: number = 0.5;

  /** A family's knots at its landmarks, in station order. */
  export function knots(family: IAutoMovieHumanConicLoft.IFamily, options: IOptions): IKnot[] {
    const read: (s: number) => number[] = H.reader(family);
    const first: number = family.knots[0]!;
    const last: number = Math.min(family.tips?.[1]?.from ?? Infinity, family.knots.at(-1)!, options.to ?? Infinity);
    const joints: readonly number[] = options.joints ?? Runs.joints(family.centres, family.halves);
    const runs: number[] = [first, ...joints.filter((s: number): boolean => s > first + 1e-9 && s < last - 1e-9), last];

    // Each extreme's own coordinate: a `u` anchor's `u`, a `v` anchor's `v`.
    const { at }: { at: number[] } = S.offsets(family.layout);
    const fields: number[] = family.layout.anchors.flatMap((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): number[] => (anchor.kind === "u" ? [at[k]!] : anchor.kind === "v" ? [at[k]! + 1] : []));
    const found: Rule.IKnot[] = Rule.knots({
      runs,
      sites: options.sites.filter((s: number): boolean => s >= first && s <= last),
      outlines: fields.map((field: number): ((s: number) => number) => (s: number): number => read(s)[field]!),
      reach: (s: number): number => {
        const values: number[] = read(s);
        return fields.reduce((sum: number, field: number): number => sum + Math.abs(values[field]!), 0) / fields.length;
      },
      share: options.share ?? SHARE,
      step: options.step,
    });
    return found.map((knot: Rule.IKnot): IKnot => ({ ...knot, ...Runs.place(knot.station, runs) }));
  }

  /** The knots' stations as the fit tool's argument, rounded to a hundredth of a millimetre: `--knots=<s1>,<s2>,...`. */
  export function argument(found: readonly IKnot[]): string {
    return "--knots=" + found.map((knot: IKnot): string => String(Math.round(knot.station * 100) / 100)).join(",");
  }
}
