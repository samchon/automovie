import type { AutoMovieLoftContract } from "@automovie/engine";
import type { IAutoMovieConstructionParallelAxis } from "@automovie/interface";
import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";

/** A generating point or foot-axis direction in calibration coordinates. */
type Vec3 = [number, number, number];

/**
 * Toe skin from foot-axis observations, with parallel source section planes.
 * The retained across means and breadth gaps were measured in that foot
 * frame, not in planes normal to a toe bone. Its affine centre may drift across the
 * foot while the fixed plane owns those original measurements. Station is
 * foot-along distance, so every point of a section has that same foot-along
 * coordinate, including a cap whose centre course is oblique.
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing parallel-axis declaration to retain the foot-axis skin observation frame while original origin curves pass through the generating centres and apex.
 * @evidence contracts/common.md#clear-and-simple-design One toe-specific source builder separates foot-axis skin data from a finger's bone-normal walk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not rotate measured breadth into a new normal plane, clamp a point, offset a cap or wait for an unrelated world-extremum solver.
 * @evidence contracts/common.md#meaningful-documentation States the measuring frame, authored station, generating-centre meaning and independence from a skeletal toe model or final join.
 * @evidence contracts/performance.md#efficient-algorithms Converts n generating points into three coordinate curves and O(n) named sites; the existing shared operator owns loft cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One parallel-axis AST supplies production conversion, original inspection and the tree without a second frame implementation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned source results without caches, samplers or realized skin references.
 */
export namespace AutoMovieHumanToePart {
  /**
   * The toe's original point course and foot-axis section laws, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Keeps generating centres and apex separate from the fixed directions that own their measured across/depth chart.
   * @evidence contracts/common.md#clear-and-simple-design Point course, one foot direction and site laws are the complete source input.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No point is labeled as an observed MTP/PIP/DIP or recovered from a loft.
   * @evidence contracts/common.md#meaningful-documentation Members state units, station meaning and the distal apex's separate ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The input type declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source builder owns preparation and sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generating caller owns the points and laws during the synchronous build.
   */
  export interface IInput {
    /** Anatomical source name, toe.left.1 through toe.right.5. */
    name: string;

    /** Named generating points on the affine hidden-start-to-apex course, through root and intermediate sites to the centre before the cap; not measured joints. */
    centres: Vec3[];

    /** Declared generated skin apex; no further pulp reach is added. */
    apex: Vec3;

    /** Unit level foot-along direction owning the observation's longitudinal coordinate. */
    along: Vec3;

    /** Constant standing axis height, calibration mm; its negative directly owns the plantar edge without a depth-ratio round trip. */
    height: number;

    /** Original breadth/depth laws in the fixed foot chart, using the existing generating-site names. */
    law: AutoMovieHumanDigitWalk.IInput["law"];

    /** Optional closed scalar source bounds in that same up/across chart. */
    ranges: AutoMovieHumanSiteViewPart.IInput["ranges"];

    /** Section control count and ring phase count. */
    order: number;

    /** Maximum source layer spacing in foot-along millimetres. */
    gap: number;
  }

  /**
   * Build the actual toe source and production AST in its observation frame.
   *
   * @evidence contracts/common.md#principled-implementation Projects each generating point onto the supplied foot direction for station, keeps up/across fixed, and gives the original coordinate curves and signed edge laws to SiteViewPart.
   * @evidence contracts/common.md#clear-and-simple-design Existing parallel-axis and site owners perform interpolation and lofting; this builder only owns the anatomical chart and named source data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects non-increasing stations instead of clipping a root or tip; no tangent-normal reinterpretation, fitted compensation or final geometry readback is used.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes foot-along station from centreline arclength and a generated apex from a bony endpoint that needs another cap reach.
   * @evidence contracts/performance.md#efficient-algorithms Uses O(n) point projection and site conversion before one shared source/loft build.
   * @evidence contracts/performance.md#reuse-equivalent-work The identical authored axis record is passed to source evaluation and retained on the returned production view.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All arrays belong to the returned source result; no cross-person state or host surface is retained.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    const declaration: AutoMovieHumanSiteViewPart.IInput | AutoMovieHumanSiteViewPart.IResult = source(input);
    return "diagnostics" in declaration ? declaration : AutoMovieHumanSiteViewPart.create(declaration);
  }

  /**
   * Declare the actual affine-origin source without running any section or
   * loft. Intermediate generating points name stations on that same line;
   * their mismatch may only be binary64 coordinate-construction roundoff,
   * admitted here within 64 EPSILON times the coordinate/length scale.
   * The factor is an engineering roundoff policy: the current generating
   * affine combinations take fewer than twenty basic roundings per
   * coordinate, and projection/reconstruction adds roughly twenty more.
   * Sixty-four leaves conservative headroom for the norm and unit bridge;
   * it is not an interval error certificate or an anatomical tolerance.
   * Degenerate/ill-conditioned input may still be refused. A failed
   * premise returns its unavailable-source diagnostic without moving points.
   *
   * @evidence contracts/common.md#principled-implementation Two physical-station endpoint knots per coordinate declare an affine source, while projected generating points own the same named site stations.
   * @evidence contracts/common.md#clear-and-simple-design Returns the exact SiteViewPart input that create consumes, so original metric queries need no temporary loft or alternate geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects a non-affine point course outside explicit binary64 construction allowance instead of fitting a new curve or moving a point.
   * @evidence contracts/common.md#meaningful-documentation States affine ownership, physical station, the roundoff allowance and the unavailable-source failure boundary.
   * @evidence contracts/performance.md#efficient-algorithms Projects and checks n points once; each origin coordinate has exactly two knots and no loft is performed.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned declaration is the actual production input and serves independent input-dimension source queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned input arrays or one failure without retaining geometry or a sampler.
   */
  export function source(input: IInput): AutoMovieHumanSiteViewPart.IInput | AutoMovieHumanSiteViewPart.IResult {
    const points: Vec3[] = [...input.centres, input.apex];
    const first: Vec3 = points[0]!;
    const stations: number[] = points.map((point: Vec3): number => point.reduce((sum: number, value: number, coordinate: number): number => sum + (value - first[coordinate]!) * input.along[coordinate]!, 0));
    if (points.length < 4 || !(input.height > 0) || !points.every((point: Vec3): boolean => point[1] === input.height) || !stations.every((station: number, index: number): boolean => Number.isFinite(station) && (index === 0 || station > stations[index - 1]!))) {
      const diagnostic: AutoMovieLoftContract.IDiagnostic = { producer: `view.${input.name}`, level: 2, contract: "toe source stations", detail: `generating centres and apex need common positive height ${input.height} mm and increasing foot-along stations: [${stations}] mm` };
      return { part: null, loft: null, view: null, diagnostics: [diagnostic] };
    }
    const total: number = stations.at(-1)!;
    const roundoff: number = 64 * Number.EPSILON * Math.max(1, total, ...points.flatMap((point: Vec3): number[] => point.map(Math.abs)));
    for (let index: number = 0; index < points.length; index++) {
      const mismatch: number = Math.hypot(...points[index]!.map((value: number, coordinate: number): number => value - first[coordinate]! - (input.apex[coordinate]! - first[coordinate]!) * stations[index]! / total));
      if (!Number.isFinite(mismatch) || mismatch > roundoff) return { part: null, loft: null, view: null, diagnostics: [{ producer: `view.${input.name}`, level: 2, contract: "affine toe origin", detail: `centre ${index} misses the declared affine origin by ${mismatch} mm beyond binary64 construction allowance ${roundoff} mm` }] };
    }
    const coordinate = (axis: 0 | 1 | 2): IAutoMovieConstructionParallelAxis["origin"]["x"] => AutoMovieHumanConstructionView.length({ knots: [{ site: "hidden start", station: 0, value: first[axis] }, { site: "apex", station: total, value: input.apex[axis] }] });
    const axis: IAutoMovieConstructionParallelAxis = {
      type: "parallel",
      origin: { x: coordinate(0), y: coordinate(1), z: coordinate(2) },
      u: { x: 0, y: 1, z: 0 },
      v: { x: input.along[2], y: 0, z: -input.along[0] },
    };
    const site = (name: string, station: number): AutoMovieHumanSiteViewPart.ISite => {
      const law: AutoMovieHumanDigitWalk.ISiteLaw = input.law(name);
      return { site: name, station, edges: [law.depth - input.height, law.breadth / 2, -input.height, -law.breadth / 2], fullness: { shoulder: law.shoulder }, ...(law.jets === undefined ? {} : { jets: law.jets }) };
    };
    const sites: AutoMovieHumanSiteViewPart.ISite[] = [];
    for (let index: number = 0; index + 1 < input.centres.length; index++) {
      sites.push(site(`shaft ${index}`, (stations[index]! + stations[index + 1]!) / 2));
      sites.push(site(index + 2 === input.centres.length ? "end" : `joint ${index + 1}`, stations[index + 1]!));
    }
    return { name: input.name, axis, sites, pole: { end: "both", bottom: 0, top: total }, ...(input.ranges === undefined ? {} : { ranges: input.ranges }), order: input.order, samples: input.order, gap: input.gap };
  }
}
