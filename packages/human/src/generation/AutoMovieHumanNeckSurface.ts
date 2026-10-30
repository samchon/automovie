import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanNeckSurfaceSampling } from "./AutoMovieHumanNeckSurfaceSampling";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * A small display copy of the prepared body's actual neck and head exterior.
 *
 * The display band starts at the shoulder envelope's top mean height and uses
 * the public neck-length input as its requested height. This is an explicit
 * display convention, not a recovered menton or clinical neck landmark.
 * Continuous source centre-height selects its intermediate and upper courses;
 * a tilted course is not a horizontal surface cut. The
 * skeleton's radii, joint centres and clinical pose channels remain separate.
 * Two further actual head courses retain the existing one-third/two-thirds
 * display heights toward the source crown pole. No circle or horizontal radial
 * direction replaces their source shape. Both sides are sampled from the
 * prepared full outline without an independent reflection or fit.
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
   * A registered world point in metres, or a dimensionless frame axis.
   *
   * @evidence contracts/common.md#principled-implementation Three Cartesian components preserve the registered source coordinates without a new point representation.
   * @evidence contracts/common.md#clear-and-simple-design One fixed tuple serves points and frame axes; each field states its units.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The tuple carries source coordinates without fixture-specific values or coercion.
   * @evidence contracts/common.md#meaningful-documentation The alias states the two field-dependent unit meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type declares three numbers and executes no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no computation or effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no live state or resources.
   */
  export type Vector = [number, number, number];

  /**
   * One actual source course, sampled at the common display phases.
   *
   * @evidence contracts/common.md#principled-implementation Owner and material station identify the source; sampled points preserve its frame and lift independently of scalar measurements.
   * @evidence contracts/common.md#clear-and-simple-design One record carries the source address, display geometry and independently measured metrics required by the polygon consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record separates requested height, actual centre and measured source perimeter instead of asserting that the display polygon meets a target.
   * @evidence contracts/common.md#meaningful-documentation Every field states its ownership, units or sampling meaning, including the millimetre material address.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares data and chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface coordinates no computation or effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resource ownership belongs to derive and its caller, not this structural declaration.
   */
  export interface ISection {
    /** Source chain owning this course. */
    chain: string;

    /** Continuous material address in calibration millimetres, not world Y. */
    stationMm: number;

    /** Requested world centre height in metres. */
    requestedHeight: number;

    /** Actual source section's phase-mean centre in registered world metres. */
    centre: Vector;

    /** Actual source frame: origin in metres and unmodified dimensionless basis. */
    frame: {
      /** Registered world origin in metres. */
      origin: Vector;

      /** Source basis vector carrying the section's depth coordinate. */
      u: Vector;

      /** Source basis vector carrying the section's lateral coordinate. */
      v: Vector;
    };

    /** Actual source world points in metres, in this course's material-phase order. */
    points: Vector[];

    /** Actual material phases in radians that evaluated these source points. */
    sourcePhases: number[];

    /**
     * Separate LOD zipper coordinates from arclength of the frame-projected
     * eight-point polygon, radians. These neither change the points nor recover
     * source event correspondence or exact three-dimensional arclength.
     */
    displayCoordinates: number[];

    /** Source perimeter measured at 256 phases, metres; not polygon perimeter. */
    circumference: number;

    /** Full world Z extent of the 256-phase source section, metres. */
    breadth: number;

    /** Full world X extent of the 256-phase source section, metres. */
    depth: number;
  }

  /**
   * Prepared neutral neck exterior; no full calibration is retained.
   *
   * @evidence contracts/common.md#principled-implementation Per-course phases retain source addresses while projected-polygon coordinates define display joins; requested height, achieved centre height and public circumference retain separate meanings.
   * @evidence contracts/common.md#clear-and-simple-design The result contains only neck and head geometry and metadata consumed by the existing polygon display.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public circumference is optional metadata and never replaces source measurements or points.
   * @evidence contracts/common.md#meaningful-documentation The fields distinguish physical units, source chart units, phase order and display conventions.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares the output and executes no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller's preparation lifecycle owns reuse; this type performs no coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural declaration acquires no body, cache or resource.
   */
  export interface IOutput {
    /** Physical output units; only stationMm retains the source chart's mm. */
    units: "metres";

    /** Public neck length defines a display band, not an anatomical jaw boundary. */
    bandDefinition: "requested-length";

    /** Source sample phases in radians; their numbers do not assert cross-chart material correspondence. */
    phases: number[];

    /** Actual lower boundary, half-height, three-quarter-height and upper courses. */
    sections: ISection[];

    /** Actual head courses at the existing one-third/two-thirds display heights. */
    headSections: [ISection, ISection];

    /**
     * Canonical calibration pole used by the skeleton, distinct from a finite
     * section. Generated chain.pole overrides are outside this display contract.
     */
    crown: {
      /** Actual source chain whose top this pole closes. */
      chain: string;

      /** Actual source end, retained without inventing a terminal ring. */
      end: "top" | "bottom";

      /** Registered source terminal point in physical metres. */
      point: Vector;

      /** Whether the source declares a recovered critical point. */
      critical: boolean;
    };

    /** Actual upper-minus-lower centre height, metres; not a bone or axis length. */
    visibleLength: number;

    /** Public physical neck-length input used as this display band's height, m. */
    publicTargetLength: number;

    /** Middle of the visible world-height band, metres. */
    requestedMidHeight: number;

    /** Evaluated centre height of the middle source course, metres. */
    actualMidHeight: number;

    /**
     * Public neck circumference input in metres, never used to resize points.
     * Its measurement site has not been identified with these display courses;
     * differences from their circumferences do not establish a target error.
     */
    publicTargetCircumference?: number;
  }

  /**
   * Copy four neck courses, two head courses and the prepared source crown.
   *
   * Principal intervals only bracket the continuous centre-height root; their
   * spacing never selects the resulting station. Bisection resolves a bracket
   * to 1e-6 calibration mm in height or station. The neck centre path must cross
   * each neck target once within head/head.lower and each head target once in
   * the head chains, without an interior reversal that
   * hides further crossings inside one principal interval. Endpoint brackets
   * do not prove that premise for arbitrary source curves. Missing or multiple
   * detected crossings are refused rather than clamped or replaced by a
   * skeletal radius. Tangential contacts without a crossing are outside this
   * display convention.
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
   * @param publicTargetCircumferenceMm Public physical mm, separate from source C.
   * @param publicLengthMm Public physical mm defining the display band height.
   *
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
  ): IOutput {
    if (!(Number.isFinite(scale) && scale > 0))
      throw new Error("Neck exterior requires a positive physical scale");

    const upper: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (chain: IAutoMovieHumanLoftChain): boolean => chain.name === "upper",
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
    const lowerHeight: number = AutoMovieHumanLoftChain.axis(
      upper,
      lowerStation,
    )[1];
    const lower: ISection = AutoMovieHumanNeckSurfaceSampling.section(
      upper,
      lowerStation,
      lowerHeight,
      phases,
      scale,
    );

    const chains: IAutoMovieHumanLoftChain[] = body.chains.filter(
      (chain: IAutoMovieHumanLoftChain): boolean =>
        chain.name === "head" || chain.name === "head.lower",
    );
    const length: number = publicLengthMm / 1000 / scale;
    const middleHeight: number = lowerHeight + length / 2;
    const upperTubeHeight: number = lowerHeight + (3 * length) / 4;
    const topHeight: number = lowerHeight + length;
    const middle: ICourse = course(chains, middleHeight);
    const upperTube: ICourse = course(chains, upperTubeHeight);
    const top: ICourse = course(chains, topHeight);
    const sections: ISection[] = [
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
    const crown: IAutoMovieHumanBodyCalibration.IPole | undefined =
      body.poles.find(
        (pole: IAutoMovieHumanBodyCalibration.IPole): boolean =>
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

    const headChains: IAutoMovieHumanLoftChain[] = body.chains.filter(
      (chain: IAutoMovieHumanLoftChain): boolean =>
        ["head", "head.lower", "head.middle", "head.upper"].includes(
          chain.name,
        ),
    );
    const headSections: [ISection, ISection] = [1, 2].map(
      (index: number): ISection => {
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
      },
    ) as [ISection, ISection];

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
  chain: IAutoMovieHumanLoftChain;

  /** Source material station in calibration mm. */
  station: number;
}

/**
 * Resolve a bracketed crossing of an actual centre path and a world height.
 * Adjacent principal intervals may report the same endpoint; that one address
 * is retained once. Distinct chain addresses remain distinct and are refused
 * as ambiguous, even when their heights happen to agree.
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
  chains: readonly IAutoMovieHumanLoftChain[],
  height: number,
): ICourse {
  const roots: ICourse[] = [];
  const add: (chain: IAutoMovieHumanLoftChain, station: number) => void = (
    chain: IAutoMovieHumanLoftChain,
    station: number,
  ): void => {
    if (
      !roots.some(
        (root: ICourse): boolean =>
          root.chain === chain && Math.abs(root.station - station) <= 1e-6,
      )
    )
      roots.push({ chain, station });
  };

  for (const chain of chains)
    for (let i: number = 1; i < chain.layers.length; ++i) {
      let lo: number = chain.layers[i - 1]!.y;
      let hi: number = chain.layers[i]!.y;
      let a: number = AutoMovieHumanLoftChain.axis(chain, lo)[1] - height;
      const b: number = AutoMovieHumanLoftChain.axis(chain, hi)[1] - height;
      if (Math.abs(a) <= 1e-6) add(chain, lo);
      if (Math.abs(b) <= 1e-6) add(chain, hi);
      if (Math.abs(a) <= 1e-6 || Math.abs(b) <= 1e-6 || a * b >= 0) continue;

      // A source interval brackets the target; no world-Y/station identity is used.
      for (let iteration: number = 0; iteration < 64; ++iteration) {
        const mid: number = (lo + hi) / 2;
        const value: number =
          AutoMovieHumanLoftChain.axis(chain, mid)[1] - height;
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
