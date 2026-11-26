import { AutoMovieLoftChain } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanNeckSurface,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanNeckSurfaceSampling } from "./AutoMovieHumanNeckSurfaceSampling";

/**
 * A small display copy of the prepared body's actual neck and head exterior.
 *
 * The display band starts at the shoulder envelope's top mean height and uses
 * the public neck-length input as its requested height. This is an explicit
 * display convention, not a recovered menton or clinical neck landmark.
 * Continuous source centre-height selects its intermediate and upper courses; a
 * tilted course is not a horizontal surface cut. The skeleton's radii, joint
 * centres and clinical pose channels remain separate. Two further actual head
 * courses retain the existing one-third/two-thirds display heights toward the
 * source crown pole. No circle or horizontal radial direction replaces their
 * source shape. Both sides are sampled from the prepared full outline without
 * an independent reflection or fit.
 *
 * @evidence contracts/common.md#principled-implementation Actual source courses preserve the prepared exterior inside a requested-length display band; centre-height crossings assume no hidden reversal within a principal interval.
 * @evidence contracts/common.md#clear-and-simple-design One producer owns source addresses, measurements and the small display copy; the polygon consumer receives points rather than fitting another neck.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prepared body supplies every physical point; public targets, skeletal radii and head bevel dimensions do not resize them.
 * @evidence contracts/common.md#meaningful-documentation The namespace distinguishes source courses, display conventions, physical units and clinical measurements.
 * @evidence contracts/performance.md#efficient-algorithms Preparation measures the actual lower ring and resolves five crossings over principal intervals; six display rings and one pole are returned.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller supplies its already calibrated body and prepares this copy once per fixed body; the producer performs no BodyLaw call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The producer retains no body or cache; its caller owns six rings, a pole and scalar metadata after temporary measurements are released.
 */
export namespace AutoMovieHumanNeckSurface {
  /**
   * Copy four neck courses, two head courses and the prepared source crown.
   *
   * Principal intervals only bracket the continuous centre-height root; their
   * spacing never selects the resulting station. Bisection resolves a bracket
   * to 1e-6 calibration mm in height or station. The neck centre path must
   * cross each neck target once within head/head.lower and each head target
   * once in the head chains, without an interior reversal that hides further
   * crossings inside one principal interval. Endpoint brackets do not prove
   * that premise for arbitrary source curves. Missing or multiple detected
   * crossings are refused rather than clamped or replaced by a skeletal radius.
   * Tangential contacts without a crossing are outside this display
   * convention.
   *
   * The actual lower ring supplies its mean world height. Public neck length
   * defines only the display band's requested height; it neither resizes the
   * source exterior nor identifies a menton. Half and three-quarter heights
   * retain the collar taper and upper tube within this four-layer display LOD.
   * These fractions are display sampling positions, not anatomical landmarks.
   * The head keeps its existing one-third/two-thirds heights between the copied
   * neck top and actual head.upper crown pole; the final height is that pole,
   * not a finite ring. Per-course material phases and projected-polygon zipper
   * coordinates are separate because source chain charts need not coincide.
   *
   * Course lookup scans L principal intervals and performs at most 64
   * evaluations per crossing; only six eight-point rings and their metadata
   * survive. Dense measurement rings are temporary. No parameter, body or cache
   * is retained. A missing or non-positive public length is unsupported here.
   *
   * @param body The same final body used to derive the skeleton.
   * @param scale Calibration millimetres to physical metres, including stature.
   * @param publicTargetCircumferenceMm Public physical mm, separate from source
   *   C.
   * @param publicLengthMm Public physical mm defining the display band height.
   * @evidence contracts/common.md#principled-implementation The actual shoulder-top mean height and public neck length define an explicit display band; continuous Loft.axis crossings select actual source courses, with the stated crossing limitations.
   * @evidence contracts/common.md#clear-and-simple-design The function coordinates existing loft evaluation and returns six small sections and a terminal point without another calibration, anatomical landmark detector or rig path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture address, circumference adjustment, head-bevel clamp or skeletal-radius fallback supplies geometry; requested-length display sampling is explicitly distinguished from anatomical recovery.
   * @evidence contracts/common.md#meaningful-documentation The comment states the display convention, numerical tolerance, crossing premise, units, costs and unsupported cases.
   * @evidence contracts/performance.md#efficient-algorithms Five linear interval scans and at most 64 bisections per detected crossing avoid a dense address grid; six 256-phase ring measurements supply source metrics and eight-point projections supply display coordinates.
   * @evidence contracts/performance.md#reuse-equivalent-work The body and scale are supplied by one fixed-body preparation; BodyLaw is not called and pose updates reuse the returned descriptor through the caller.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Dense rings remain local; the returned six eight-point sections and one pole contain no body references or handles.
   */
  export function derive(
    body: IAutoMovieHumanBodyCalibration,
    scale: number,
    publicTargetCircumferenceMm: number | null,
    publicLengthMm: number | null,
  ): IAutoMovieHumanNeckSurface.IOutput {
    if (!(Number.isFinite(scale) && scale > 0))
      throw new Error("Neck exterior requires a positive physical scale");

    const upper: IAutoMovieLoftChain | undefined = body.chains.find(
      (chain: IAutoMovieLoftChain): boolean => chain.name === "upper",
    );
    if (upper === undefined)
      throw new Error("Neck exterior requires the shoulder envelope");

    if (
      publicLengthMm === null ||
      !(Number.isFinite(publicLengthMm) && publicLengthMm > 0)
    )
      throw new Error(
        "Neck exterior display requires a positive neck-length input",
      );

    const phases: number[] = Array.from(
      { length: 8 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 8,
    );
    const lowerStation: number = upper.layers[upper.layers.length - 1]!.y;
    const lowerHeight: number = AutoMovieLoftChain.axis(upper, lowerStation)[1];
    const lower: IAutoMovieHumanNeckSurface.ISection =
      AutoMovieHumanNeckSurfaceSampling.section(
        upper,
        lowerStation,
        lowerHeight,
        phases,
        scale,
      );

    const chains: IAutoMovieLoftChain[] = body.chains.filter(
      (chain: IAutoMovieLoftChain): boolean =>
        chain.name === "head" || chain.name === "head.lower",
    );
    const length: number = publicLengthMm / 1000 / scale;
    const middleHeight: number = lowerHeight + length / 2;
    const upperTubeHeight: number = lowerHeight + (3 * length) / 4;
    const topHeight: number = lowerHeight + length;
    const middle: ICourse = course(chains, middleHeight);
    const upperTube: ICourse = course(chains, upperTubeHeight);
    const top: ICourse = course(chains, topHeight);
    const sections: IAutoMovieHumanNeckSurface.ISection[] = [
      lower,
      AutoMovieHumanNeckSurfaceSampling.section(
        middle.chain,
        middle.station,
        middleHeight,
        phases,
        scale,
      ),
      AutoMovieHumanNeckSurfaceSampling.section(
        upperTube.chain,
        upperTube.station,
        upperTubeHeight,
        phases,
        scale,
      ),
      AutoMovieHumanNeckSurfaceSampling.section(
        top.chain,
        top.station,
        topHeight,
        phases,
        scale,
      ),
    ];

    // The canonical body pole already supplies the skeleton's head tip. This
    // display does not resolve generated chain.pole overrides. Its existing
    // three display heights end at this point, not at a new circle.
    const crown: IAutoMovieHumanSurfacePole | undefined = body.poles.find(
      (pole: IAutoMovieHumanSurfacePole): boolean =>
        pole.chain === "head.upper" && pole.end === "top",
    );
    const neckTopHeight: number =
      sections[sections.length - 1]!.centre[1] / scale;
    if (
      crown === undefined ||
      !crown.point.every(Number.isFinite) ||
      !(crown.point[1] > neckTopHeight)
    )
      throw new Error(
        "Head exterior display requires its source crown above the neck",
      );

    const headChains: IAutoMovieLoftChain[] = body.chains.filter(
      (chain: IAutoMovieLoftChain): boolean =>
        ["head", "head.lower", "head.middle", "head.upper"].includes(
          chain.name,
        ),
    );
    const headSections: [
      IAutoMovieHumanNeckSurface.ISection,
      IAutoMovieHumanNeckSurface.ISection,
    ] = [1, 2].map((index: number): IAutoMovieHumanNeckSurface.ISection => {
      const height: number =
        neckTopHeight + ((crown.point[1] - neckTopHeight) * index) / 3;
      const at: ICourse = course(headChains, height);
      return AutoMovieHumanNeckSurfaceSampling.section(
        at.chain,
        at.station,
        height,
        phases,
        scale,
      );
    }) as [
      IAutoMovieHumanNeckSurface.ISection,
      IAutoMovieHumanNeckSurface.ISection,
    ];

    return {
      units: "metres",
      bandDefinition: "requested-length",
      phases,
      sections,
      headSections,
      crown: {
        chain: crown.chain,
        end: crown.end,
        point: AutoMovieHumanNeckSurfaceSampling.scaled(crown.point, scale),
        critical: crown.critical,
      },
      visibleLength: sections[sections.length - 1]!.centre[1] - lower.centre[1],
      publicTargetLength: publicLengthMm / 1000,
      requestedMidHeight: middleHeight * scale,
      actualMidHeight: sections[1]!.centre[1],
      ...(publicTargetCircumferenceMm === null ||
      publicTargetCircumferenceMm === undefined
        ? {}
        : { publicTargetCircumference: publicTargetCircumferenceMm / 1000 }),
    };
  }
}

/**
 * One continuous source address found by centre-height crossing.
 *
 * @evidence contracts/common.md#principled-implementation A chain reference and material station identify the existing evaluated source course.
 * @evidence contracts/common.md#clear-and-simple-design The temporary pair is all the root finder needs to communicate with section sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The address is evaluated from the source rather than replaced by a copied fixture coordinate.
 * @evidence contracts/common.md#meaningful-documentation The members state ownership and calibration-mm station units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface executes no address search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface coordinates no computation or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its transient use is owned by course and derive; the type acquires no resource.
 */
interface ICourse {
  /** Actual chain owning the address. */
  chain: IAutoMovieLoftChain;

  /** Source material station in calibration mm. */
  station: number;
}

/**
 * Resolve a bracketed crossing of an actual centre path and a world height.
 * Adjacent principal intervals may report the same endpoint; that one address
 * is retained once. Distinct chain addresses remain distinct and are refused as
 * ambiguous, even when their heights happen to agree.
 *
 * @evidence contracts/common.md#principled-implementation Sign-changing principal intervals bracket continuous Loft.axis height; bisection resolves their addresses without station/world-height identity.
 * @evidence contracts/common.md#clear-and-simple-design One local search returns one source address and refuses missing or multiple detected roots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interval endpoints only bracket roots; the function never chooses a nearest layer or clamps an absent target.
 * @evidence contracts/common.md#meaningful-documentation The comment and derive contract state shared-endpoint deduplication, ambiguity and the unproved hidden-reversal limitation.
 * @evidence contracts/performance.md#efficient-algorithms The search scans L intervals with at most 64 evaluations for each sign-changing interval; its endpoint list is bounded by detected crossings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous single-target search coordinates no requests, phases or external effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Root references remain in the local array until return or throw; no chain reference enters the returned display descriptor.
 */
function course(
  chains: readonly IAutoMovieLoftChain[],
  height: number,
): ICourse {
  const roots: ICourse[] = [];
  function add(chain: IAutoMovieLoftChain, station: number): void {
    if (
      !roots.some(
        (root: ICourse): boolean =>
          root.chain === chain && Math.abs(root.station - station) <= 1e-6,
      )
    )
      roots.push({ chain, station });
  }

  for (const chain of chains)
    for (let i: number = 1; i < chain.layers.length; ++i) {
      let lo: number = chain.layers[i - 1]!.y;
      let hi: number = chain.layers[i]!.y;
      let a: number = AutoMovieLoftChain.axis(chain, lo)[1] - height;
      const b: number = AutoMovieLoftChain.axis(chain, hi)[1] - height;
      if (Math.abs(a) <= 1e-6) add(chain, lo);
      if (Math.abs(b) <= 1e-6) add(chain, hi);
      if (Math.abs(a) <= 1e-6 || Math.abs(b) <= 1e-6 || a * b >= 0) continue;

      // A source interval brackets the target; no world-Y/station identity is used.
      for (let iteration: number = 0; iteration < 64; ++iteration) {
        const mid: number = (lo + hi) / 2;
        const value: number = AutoMovieLoftChain.axis(chain, mid)[1] - height;
        if (Math.abs(value) <= 1e-6 || hi - lo <= 1e-6) {
          hi = mid;
          lo = mid;
          break;
        }
        if (a * value < 0) hi = mid;
        else {
          lo = mid;
          a = value;
        }
      }
      add(chain, (lo + hi) / 2);
    }

  if (roots.length !== 1)
    throw new Error(
      `Exterior display height ${height} has ${roots.length} source crossings`,
    );
  return roots[0]!;
}
