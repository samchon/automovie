import { AutoMovieNaturalSpline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";

/**
 * Lip views across the mouth, with a shared resting contact curve. Each
 * section's u axis follows the own lip's ls-sto or sto-li chord, so the
 * supplied vermilion height is a Euclidean distance, not a Y projection.
 *
 * The upper border passes the centre and both crista philtri. Their width
 * relative to mouth width uses FaceBase adult means (women 11.8/48.1,
 * men 13.3/50.9). Their unknown rise is the unique natural cubic of least
 * bending whose derivative vanishes at those two peaks: geometric fairing,
 * not a measured bow depth. The contact arch is a parabola through both
 * cheek attachments and stomion; it is a construction convention, not an
 * inferred dental arch. Source: docs/sources/weinberg-2016-3d-facial-norms.md.
 *
 * @evidence contracts/common.md#principled-implementation Owns the original borders, shared contact and section frame from supplied distances plus explicitly stated fairing and attachment conventions.
 * @evidence contracts/common.md#clear-and-simple-design One builder returns one upper or lower view; neither lip reads the sibling's output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit f1 or move the completed lip onto a parent; the unknown bow rise is not represented as survey data.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes Euclidean chord, anatomical site, population ratio and geometric convention, and states the parallel-plane axis requirement.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed-size spline solves establish the upper peak height; one prepared border serves every frame and outline site.
 * @evidence contracts/performance.md#reuse-equivalent-work Each lip uses the same declared contact law and one prepared own border.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned view and its call-owned spline/axis closure survive.
 */
export namespace AutoMovieHumanHeadLipPart {
  /** Hidden depth inside the face, mm; the existing lip-root construction allowance. */
  const INSET: number = 3;

  /** Angular intervals in the pole parameter; the named peaks and centre are included independently. */
  const INTERVALS: number = 24;

  /**
   * Draw one lip; its planes remain parallel while their centres follow the
   * contact and border. The tree must preserve these actual planes, rather
   * than reinterpret this axis as a rotation-minimizing course.
   *
   * @evidence contracts/common.md#principled-implementation Both contact guides evaluate the same arch; a normalized own chord preserves the supplied three-dimensional vermilion distance at the midline.
   * @evidence contracts/common.md#clear-and-simple-design Original source functions own all four outlines and the axis; the engine performs the loft.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps hidden roots separate from visible borders and uses no emitted mesh, parent-foot translation or person branch.
   * @evidence contracts/common.md#meaningful-documentation Explains border fairing, pole parameter, fixed planes and the boundary between source curves and tree admission.
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of sites and bounded natural-spline reads produce a view.
   * @evidence contracts/performance.md#reuse-equivalent-work The prepared border supplies both frame origins and supporting outlines.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one call-owned view, with no global generated data.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, upper: boolean, mass: IAutoMovieViewPart): IAutoMovieViewPart {
    const half: number = plan.mouthWidth;
    const height: number = upper ? plan.upperLip : plan.lowerLip;
    const lead: number = plan.lips[upper ? 0 : 1];
    const u: [number, number, number] = direction(plan, upper);
    const v: [number, number, number] = [u[1], -u[0], 0];
    const ratio: number = plan.sex === 1 ? 11.8 / 48.1 : 13.3 / 50.9;
    const peak: number = ratio * half;
    const theta: (s: number) => number = (s: number): number => Math.acos(Math.max(-1, Math.min(1, -s / half)));
    const xs: number[] = [0, theta(-peak), Math.PI / 2, theta(peak), Math.PI];
    const base: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(xs, [0, 0, height, 0, 0]);
    const unit: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(xs, [0, 1, 0, 1, 0]);
    const bowHeight: number = -AutoMovieNaturalSpline.derivative(base, xs[3]!)[0] / AutoMovieNaturalSpline.derivative(unit, xs[3]!)[0];
    const bow: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(xs, [0, bowHeight, height, bowHeight, 0]);
    const angles: number[] = Array.from({ length: INTERVALS + 1 }, (_: unknown, i: number): number => (Math.PI * i) / INTERVALS);
    const lower: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(angles, angles.map((angle: number, i: number): number => i === 0 || i === INTERVALS ? 0 : height * Math.sin(angle)));
    /** The border height in the engine's two-pole parameter; endpoints are exact shared corners. */
    const border: (s: number) => number = (s: number): number => Math.abs(s) >= half ? 0 : AutoMovieNaturalSpline.evaluate(upper ? bow : lower, theta(s));
    const corner: number = AutoMovieHumanHeadMassPart.frontAt(mass, plan.stomion, half);
    /** A shared contact arch through the independently placed stomion and two cheek attachments. */
    const contact: (s: number) => [number, number, number] = (s: number): [number, number, number] => [corner + (plan.landmarks.stomion[0] - corner) * (1 - (s / half) ** 2), plan.stomion, s];
    const sites: Map<number, string> = new Map();
    for (let i: number = 0; i <= INTERVALS; i++) sites.set(i === INTERVALS / 2 ? 0 : -half * Math.cos((Math.PI * i) / INTERVALS), `lip.${upper ? "upper" : "lower"}.${i}`);
    sites.set(-half, "cheilion.right");
    sites.set(half, "cheilion.left");
    sites.set(0, upper ? "labrale.superius" : "labrale.inferius");
    // The same coordinate-source partition keeps the contact exactly
    // common after natural interpolation, even with different lip chords.
    sites.set(-peak, upper ? "crista.philtri.right" : "lip.lower.philtral-alignment.right");
    sites.set(peak, upper ? "crista.philtri.left" : "lip.lower.philtral-alignment.left");
    const stations: number[] = [...sites.keys()].sort((a: number, b: number): number => a - b);
    const coordinate: (component: 0 | 1 | 2) => IAutoMovieViewPart.IOutline = (component: 0 | 1 | 2): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((station: number): IAutoMovieViewPart.IKnot => ({ site: sites.get(station)!, station, value: contact(station)[component] + (component === 2 ? 0 : (upper ? 1 : -1) * border(station) * u[component] / 2) })),
      ...(component === 2 ? {} : { parameter: { type: "angle" as const, bottom: -half, top: half } }),
    });
    /** Supporting curve at every named section, handed unchanged to the engine. */
    const outline: (read: (s: number) => number) => IAutoMovieViewPart.IOutline = (read: (s: number) => number): IAutoMovieViewPart.IOutline => ({ knots: stations.map((station: number): IAutoMovieViewPart.IKnot => ({ site: sites.get(station)!, station, value: station === -half || station === half ? 0 : read(station) })) });
    return {
      name: upper ? "lip.upper" : "lip.lower",
      axis: AutoMovieHumanHeadSourceAxis.of({ x: coordinate(0), y: coordinate(1), z: coordinate(2) }, u, v),
      stations,
      front: { positive: outline((s: number): number => border(s) / 2), negative: outline((s: number): number => -border(s) / 2) },
      side: {
        positive: outline((s: number): number => lead * Math.sin(theta(s))),
        negative: outline((s: number): number => -INSET * Math.sin(theta(s))),
      },
      fullness: { kind: "shoulder", shoulder: { knots: [-half, half].map((station: number): IAutoMovieViewPart.IKnot => ({ site: "lip.section", station, value: AutoMovieViewSection.ELLIPSE })) } },
      pole: "both",
      order: 32,
      samples: 128,
    };
  }

  /**
   * The own source's ls or li at the midline, calibration mm. Its distance
   * to stomion is the supplied Euclidean vermilion height.
   *
   * @evidence contracts/common.md#principled-implementation Uses the identical normalized own chord and midline border height as the source lip; it is not a vertical projection of the input.
   * @evidence contracts/common.md#clear-and-simple-design Publishes the generating site to philtrum and sulcus consumers without building or observing the sibling part.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not project onto a parent, introduce a new measured site or fit an individual.
   * @evidence contracts/common.md#meaningful-documentation Names ls/li, units, shared owner and the Euclidean metric.
   * @evidence contracts/performance.md#efficient-algorithms Constant vector arithmetic without a loft or spline solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same chord helper as the actual source builder.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one owned three-number site and retains nothing.
   */
  export function midline(plan: IAutoMovieHumanHeadLayout, upper: boolean): [number, number, number] {
    const u: [number, number, number] = direction(plan, upper);
    const signed: number = upper ? plan.upperLip : -plan.lowerLip;
    return [plan.landmarks.stomion[0] + signed * u[0], plan.stomion + signed * u[1], 0];
  }

  /** Own chord's unit direction; supplied height is its Euclidean norm, not its Y component. */
  function direction(plan: IAutoMovieHumanHeadLayout, upper: boolean): [number, number, number] {
    const height: number = upper ? plan.upperLip : plan.lowerLip;
    const lead: number = plan.lips[upper ? 0 : 1];
    const norm: number = Math.hypot(height, lead);
    return [upper ? lead / norm : -lead / norm, height / norm, 0];
  }
}
