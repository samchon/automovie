import {
  type AutoMovieLoftFrame,
  AutoMovieNaturalSpline,
  type AutoMovieViewAxis,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadLipContact } from "./AutoMovieHumanHeadLipContact";

/**
 * Lip views across the mouth, with a shared resting contact curve. Each
 * section's u axis follows the own actual-parent border/resting chord, so the
 * supplied vermilion height is a Euclidean distance, not a Y projection.
 *
 * The upper border passes the centre and both crista philtri. Their width
 * relative to mouth width uses FaceBase adult means (women 11.8/48.1,
 * men 13.3/50.9). Their unknown rise is the unique natural cubic of least
 * bending whose derivative vanishes at those two peaks: geometric fairing,
 * not a measured bow depth. The common LS/LI datum supplies each chord's
 * midline independently of section relief. The latter is an explicit
 * shape prior, not a measured clinical peak or a target for that peak.
 * Both lips borrow one complete native parent field. Their resting contact
 * and their borders at other heights read its actual forward branch.
 * Source: docs/sources/weinberg-2016-3d-facial-norms.md.
 *
 * @evidence contracts/common.md#principled-implementation Owns the original borders, shared contact and section frame from supplied distances plus explicitly stated fairing and attachment conventions.
 * @evidence contracts/common.md#clear-and-simple-design One builder returns one upper or lower view; neither lip reads the sibling's output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit f1 or move the completed lip onto a parent; the unknown bow rise is not represented as survey data.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes Euclidean chord, anatomical site, population ratio and geometric convention, and states the parallel-plane axis requirement.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size bow solves precede linear border preparation. One parent admission serves the field; each uncached axis read uses an outline lookup and the contact owner's bounded native chord inverse and world2 queries.
 * @evidence contracts/performance.md#reuse-equivalent-work Each lip uses the same declared contact law and one prepared own border.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned view and its call-owned spline/axis closure survive.
 */
export namespace AutoMovieHumanHeadLipPart {
  /**
   * One actual parent contact reading, with analytic lateral derivatives.
   * @evidence contracts/common.md#principled-implementation Separates the original point from availability of its implicit lateral derivatives.
   * @evidence contracts/common.md#clear-and-simple-design A point and one optional derivative pair serve both consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A singular inverse is null, never a zero-filled derivative.
   * @evidence contracts/common.md#meaningful-documentation Fields state world-mm and physical lateral derivative units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contact reader owns reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reader returns owned fixed-size vectors.
   */
  export type IContactReading = AutoMovieHumanHeadLipContact.IReading;

  /**
   * Shared original parent field, retained with its frame and full scalar source.
   * @evidence contracts/common.md#principled-implementation Keeps the actual parent, complete signed scalar source and section frame together.
   * @evidence contracts/common.md#clear-and-simple-design One field supplies both lip builders.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A corner pair or emitted mesh cannot stand in for this source.
   * @evidence contracts/common.md#meaningful-documentation Members identify original ownership and world-mm queries.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The factory owns shared preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its composition retains the actual parent and prepared scalar sources for both lips.
   */
  export type IContact = AutoMovieHumanHeadLipContact.IContact;

  /** Hidden depth inside the face, mm; the existing lip-root construction allowance. */
  const INSET: number = 3;

  /** Angular intervals in the pole parameter; the named peaks and centre are included independently. */
  const INTERVALS: number = 24;

  /**
   * Draw one lip; its planes remain parallel while their centres follow the
   * contact and border. The tree must preserve these actual planes, rather
   * than reinterpret this axis as a rotation-minimizing course.
   *
   * @param plan Common border datums and public distances, calibration mm.
   * @param upper Whether to author the upper lip.
   * @param mass The identical original material parent.
   * @param attachment One native contact field borrowed by both lips.
   * @returns The original lip source, retaining its actual parent callback.
   *
   * @evidence contracts/common.md#principled-implementation Both resting guides evaluate the same native parent curve; each other border reads that same parent's actual height, with the supplied Euclidean midline distance and the declared lateral bow.
   * @evidence contracts/common.md#clear-and-simple-design Original source functions own all four outlines and the axis; the engine performs the loft.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps hidden roots separate from visible borders and uses no emitted mesh, parent-foot translation or person branch.
   * @evidence contracts/common.md#meaningful-documentation Explains border fairing, parallel lateral planes, native incidence and Euclidean distances; true corners retain a finite frame value while physical frame2 is unavailable.
   * @evidence contracts/performance.md#efficient-algorithms Border preparation is linear in named sites. A default contact admits the parent once; each uncached section uses one outline reading and the contact owner's at-most-48-step chord inverse, original section inverses and world2 queries. Selected-coordinate jets add constant vector arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work The prepared border supplies both frames and supporting outlines; one last-section record shares repeated at/jet and polar queries without retaining a growing station cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one call-owned view, with no global generated data.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    upper: boolean,
    mass: IAutoMovieViewPart,
    attachment: IContact = contact(mass, plan.stomion),
  ): IAutoMovieViewPart {
    const half: number = plan.mouthWidth;
    const height: number = upper ? plan.upperLip : plan.lowerLip;
    const relief: number = plan.lips[upper ? 0 : 1];
    const ratio: number = plan.sex === 1 ? 11.8 / 48.1 : 13.3 / 50.9;
    const peak: number = ratio * half;
    const theta: (s: number) => number = (s: number): number =>
      Math.acos(Math.max(-1, Math.min(1, -s / half)));
    const xs: number[] = [0, theta(-peak), Math.PI / 2, theta(peak), Math.PI];
    const base: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      xs,
      [0, 0, height, 0, 0],
    );
    const unit: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      xs,
      [0, 1, 0, 1, 0],
    );
    const bowHeight: number =
      -AutoMovieNaturalSpline.derivative(base, xs[3]!)[0] /
      AutoMovieNaturalSpline.derivative(unit, xs[3]!)[0];
    const bow: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      xs,
      [0, bowHeight, height, bowHeight, 0],
    );
    const angles: number[] = Array.from(
      { length: INTERVALS + 1 },
      (_: unknown, i: number): number => (Math.PI * i) / INTERVALS,
    );
    const lower: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      angles,
      angles.map((angle: number, i: number): number =>
        i === 0 || i === INTERVALS ? 0 : height * Math.sin(angle),
      ),
    );
    /** The border height in the engine's two-pole parameter; endpoints are exact shared corners. */
    const border: (s: number) => number = (s: number): number =>
      Math.abs(s) >= half
        ? 0
        : AutoMovieNaturalSpline.evaluate(upper ? bow : lower, theta(s));
    if (attachment.parent !== mass)
      throw new Error("Lip contact belongs to a different material parent");
    const sites: Map<number, string> = new Map();
    for (let i: number = 0; i <= INTERVALS; i++)
      sites.set(
        i === INTERVALS / 2 ? 0 : -half * Math.cos((Math.PI * i) / INTERVALS),
        `lip.${upper ? "upper" : "lower"}.${i}`,
      );
    sites.set(-half, "cheilion.right");
    sites.set(half, "cheilion.left");
    sites.set(0, upper ? "labrale.superius" : "labrale.inferius");
    // Border sites do not resample or redefine the borrowed contact field.
    sites.set(
      -peak,
      upper ? "crista.philtri.right" : "lip.lower.philtral-alignment.right",
    );
    sites.set(
      peak,
      upper ? "crista.philtri.left" : "lip.lower.philtral-alignment.left",
    );
    const stations: number[] = [...sites.keys()].sort(
      (a: number, b: number): number => a - b,
    );
    /** Supporting curve at every named section, handed unchanged to the engine. */
    const outline: (
      read: (s: number) => number,
    ) => IAutoMovieViewPart.IOutline = (
      read: (s: number) => number,
    ): IAutoMovieViewPart.IOutline => ({
      knots: stations.map(
        (station: number): IAutoMovieViewPart.IKnot => ({
          site: sites.get(station)!,
          station,
          value: station === -half || station === half ? 0 : read(station),
        }),
      ),
    });
    const positive: IAutoMovieViewPart.IOutline = outline(
      (s: number): number => border(s) / 2,
    );
    const prepared:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(positive, {
      bottom: -half,
      top: half,
    });
    if ("detail" in prepared)
      throw new Error(`Lip border source: ${prepared.detail}`);
    const sign: number = upper ? 1 : -1;
    let cachedStation: number | undefined;
    let cachedSection: AutoMovieHumanHeadLipContact.ISection | undefined;

    /** Retain just the last actual section for paired value/jet and polar reads. */
    const section: (s: number) => AutoMovieHumanHeadLipContact.ISection = (
      s: number,
    ): AutoMovieHumanHeadLipContact.ISection => {
      if (s === cachedStation && cachedSection !== undefined)
        return cachedSection;
      const own: AutoMovieViewOutline.IReading | string =
        AutoMovieViewOutline.at(prepared, s);
      if (typeof own === "string") throw new Error(`Lip border: ${own}`);
      cachedSection = attachment.section(
        s,
        2 * own.value,
        sign,
        own.stationJet === null
          ? null
          : [2 * own.stationJet[0], 2 * own.stationJet[1]],
      );
      cachedStation = s;
      return cachedSection;
    };
    const frame: (s: number) => AutoMovieLoftFrame.IFrame = (
      s: number,
    ): AutoMovieLoftFrame.IFrame => section(s).frame;
    const axis: AutoMovieViewAxis.IAxis = {
      at: frame,
      jet: (
        s: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> => {
        const physical: ReturnType<
          NonNullable<AutoMovieViewAxis.IAxis["jet"]>
        > = section(s).jet;
        if (physical === null) return null;
        const inverse: [number, number] | null =
          parameter === undefined
            ? [1, 0]
            : AutoMovieViewParameter.inverseJet(parameter, s);
        if (inverse === null) return null;
        const first: AutoMovieLoftFrame.IFrame = {
          origin: [0, 0, 0],
          u: [0, 0, 0],
          v: [0, 0, 0],
        };
        const second: AutoMovieLoftFrame.IFrame = {
          origin: [0, 0, 0],
          u: [0, 0, 0],
          v: [0, 0, 0],
        };
        for (const key of ["origin", "u", "v"] as const)
          for (let i: number = 0; i < 3; i++) {
            first[key][i] = physical.first[key][i]! * inverse[0];
            second[key][i] =
              physical.second[key][i]! * inverse[0] ** 2 +
              physical.first[key][i]! * inverse[1];
          }
        return { value: physical.value, first, second };
      },
    };
    return {
      name: upper ? "lip.upper" : "lip.lower",
      axis,
      stations,
      front: {
        positive,
        negative: outline((s: number): number => -border(s) / 2),
      },
      side: {
        positive: outline((s: number): number => relief * Math.sin(theta(s))),
        negative: outline((s: number): number => -INSET * Math.sin(theta(s))),
      },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [-half, half].map(
            (station: number): IAutoMovieViewPart.IKnot => ({
              site: "lip.section",
              station,
              value: AutoMovieViewSection.ELLIPSE,
            }),
          ),
        },
      },
      pole: "both",
      order: 32,
      samples: 128,
    };
  }

  /**
   * Borrow the complete native material section at the resting contact.
   *
   * @param parent The identical material source.
   * @param height World-level contact station, calibration mm.
   * @returns One full native source and its forward cross-coordinate reader.
   *
   * @evidence contracts/common.md#principled-implementation Reads every signed support and effective quarter from the original source and inverts its actual forward conic branch in the parent's own level frame.
   * @evidence contracts/common.md#clear-and-simple-design One immutable field serves both lips, including the same point and available inverse derivatives.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No corner parabola, output section, positive-side reflection or missing derivative substitutes for the original field.
   * @evidence contracts/common.md#meaningful-documentation World mm and the required level chart are explicit; singular inverse derivatives remain null.
   * @evidence contracts/performance.md#efficient-algorithms Delegates linear scalar admission and actual frame query to the contact owner. Deferred queries retain that owner's native inverse, original world2 and bounded chord-solve costs.
   * @evidence contracts/performance.md#reuse-equivalent-work Both consumers retain the same prepared complete scalar source and actual parent axis.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns the field and its parent; no global cache or emitted mesh survives.
   */
  export function contact(
    parent: IAutoMovieViewPart,
    height: number,
  ): IContact {
    return AutoMovieHumanHeadLipContact.create(parent, height);
  }

  /**
   * The own source's ls or li at the midline, calibration mm. Its distance
   * to stomion is the supplied Euclidean vermilion height.
   *
   * @evidence contracts/common.md#principled-implementation Reads the common material-source datum used by the lip builder; the public border chord is independent of clinical peak protrusion and profile residuals.
   * @evidence contracts/common.md#clear-and-simple-design Publishes the generating site to philtrum and sulcus consumers without building or observing the sibling part.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not project onto a parent, introduce a new measured site or fit an individual.
   * @evidence contracts/common.md#meaningful-documentation Names ls/li, units, shared owner and the Euclidean metric.
   * @evidence contracts/performance.md#efficient-algorithms Constant vector arithmetic without a loft or spline solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the canonical datum also consumed by the material profile; the border builder independently reads that actual parent field.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one owned three-number site and retains nothing.
   */
  export function midline(
    plan: IAutoMovieHumanHeadLayout,
    upper: boolean,
  ): [number, number, number] {
    const point: [number, number] = upper
      ? plan.landmarks.labraleSuperius
      : plan.landmarks.labraleInferius;
    return [point[0], point[1], 0];
  }
}
