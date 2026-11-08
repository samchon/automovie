import {
  type AutoMovieLoftContract,
  type AutoMovieViewAxis,
  AutoMovieViewParallelAxis,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionParallelAxis } from "@automovie/interface";

import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanToeVertical } from "./AutoMovieHumanToeVertical";

/** A generating point or foot-axis direction in calibration coordinates. */
type Vec3 = [number, number, number];

/**
 * Toe skin from foot-axis observations, with parallel source section planes.
 * The retained across means and breadth gaps were measured in that foot
 * frame, not in planes normal to a toe bone. Its plan-affine centre may drift across the
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

    /** Named generating points on the plan-affine hidden-start-to-apex course and the declared height source; not measured joints. */
    centres: Vec3[];

    /** Declared generated skin apex; no further pulp reach is added. */
    apex: Vec3;

    /** Unit level foot-along direction owning the observation's longitudinal coordinate. */
    along: Vec3;

    /** Retained distal half-depth, calibration mm; constant axis height only when the explicit vertical source is absent. */
    height: number;

    /** Actual local-parent transfer and one same-clock origin/plantar source; absent only for constant-height analytic fixtures. */
    vertical?: AutoMovieHumanToeVertical.ISource;

    /** Original breadth/depth laws in the fixed foot chart, using the existing generating-site names. */
    law: AutoMovieHumanDigitWalk.IInput["law"];

    /** Optional closed scalar source bounds in that same up/across chart. */
    ranges: AutoMovieHumanSiteViewPart.IInput["ranges"];

    /** Section control count and ring phase count. */
    order: number;

    /** Maximum source layer spacing in foot-along millimetres. */
    gap: number;
  }

  /** One exact millimetre origin and its canonical metre declaration, before any unit round trip or loft. */
  export interface ISource extends AutoMovieHumanSiteViewPart.IInput {
    /** Original coordinate curves; the same mm clock owns this origin and the signed radial curves. */
    origin: AutoMovieViewParallelAxis.IOrigin;
  }

  /** Final source plus the exact millimetre coordinate owner used by its axis and horizontal metric readers. */
  export interface IDefinition extends AutoMovieHumanSiteViewPart.IDefinition {
    /** Present on success; absent on an input/axis failure. */
    origin?: AutoMovieViewParallelAxis.IOrigin;
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
    return AutoMovieHumanSiteViewPart.loft(define(input));
  }

  /**
   * Prepare the actual original once, leaving realization to the caller.
   *
   * @evidence contracts/common.md#principled-implementation The same canonical parallel axis reads the authored height source, while final upper/lower curves retain that source's exact clock, knots and jets.
   * @evidence contracts/common.md#clear-and-simple-design Replaces only the two vertical original curves and unions their emission knots; horizontal guides and fullness retain their original ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not re-solve independent vertical sites or replace moving height with an endpoint affine approximation.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes optional constant-height fixtures from production's explicit local-parent vertical transfer.
   * @evidence contracts/performance.md#efficient-algorithms One O(n) shared preparation precedes a finite station union and view conversion, without lofting.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the same final part/view for metric reads and one later loft.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous caller owns the finite preparation and borrows only its own toe's original vertical source.
   */
  export function define(input: IInput): IDefinition {
    const declaration: ISource | AutoMovieHumanSiteViewPart.IResult =
      source(input);
    if ("diagnostics" in declaration) return declaration;
    const prepared: AutoMovieHumanSiteViewPart.IDefinition =
      AutoMovieHumanSiteViewPart.define(declaration);
    if (prepared.part === null) return prepared;
    const axis: AutoMovieViewAxis.IAxis | string =
      AutoMovieViewParallelAxis.create(
        declaration.origin,
        [0, 1, 0],
        [input.along[2], 0, -input.along[0]],
      );
    if (typeof axis === "string")
      return {
        part: null,
        view: null,
        diagnostics: [
          ...prepared.diagnostics,
          {
            producer: `view.${input.name}`,
            level: 2,
            contract: "axis",
            detail: axis,
          },
        ],
      };
    const part: IAutoMovieViewPart = {
      ...prepared.part,
      axis,
      ...(input.vertical === undefined
        ? {}
        : {
            front: {
              positive: input.vertical.upper,
              negative: input.vertical.lower,
            },
            stations: [
              ...new Set([
                ...prepared.part.stations,
                ...input.vertical.height.knots.map(
                  (knot: IAutoMovieViewPart.IKnot): number => knot.station,
                ),
              ]),
            ].sort((a: number, b: number): number => a - b),
          }),
    };
    return {
      ...prepared,
      part,
      origin: declaration.origin,
      view: AutoMovieHumanConstructionView.of(part, declaration.axis),
    };
  }

  /**
   * Declare the actual plan-affine origin and explicit height source without
   * running any section or loft. Intermediate generating points name stations
   * on that horizontal line and the identical supplied height curve. That
   * vertical original owns its named station clock; world-point projection
   * validates construction roundoff and never supplies a replacement end.
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
   * @evidence contracts/common.md#principled-implementation The original vertical source owns its station clock; two endpoint knots in X/Z share that exact mm clock and production Y retains its complete original. World projection checks the supplied points without redefining a closed parameter endpoint.
   * @evidence contracts/common.md#clear-and-simple-design Returns the exact SiteViewPart input that create consumes, so original metric queries need no temporary loft or alternate geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects a plan-affine or explicit-height mismatch outside the stated binary64 construction allowance instead of fitting a curve or moving a point.
   * @evidence contracts/common.md#meaningful-documentation States affine ownership, physical station, the roundoff allowance and the unavailable-source failure boundary.
   * @evidence contracts/performance.md#efficient-algorithms Projects and checks n points once; X/Z each have two knots and the existing Y source is shared, with no loft performed.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned declaration is the actual production input and serves independent input-dimension source queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned input arrays or one failure without retaining geometry or a sampler.
   */
  export function source(
    input: IInput,
  ): ISource | AutoMovieHumanSiteViewPart.IResult {
    const points: Vec3[] = [...input.centres, input.apex];
    const first: Vec3 = points[0]!;
    const projected: number[] = points.map((point: Vec3): number =>
      point.reduce(
        (sum: number, value: number, coordinate: number): number =>
          sum + (value - first[coordinate]!) * input.along[coordinate]!,
        0,
      ),
    );
    const stations: number[] =
      input.vertical === undefined
        ? projected
        : input.vertical.height.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          );
    if (
      points.length < 4 ||
      stations.length !== points.length ||
      stations[0] !== 0 ||
      !(input.height > 0) ||
      !points.every(
        (point: Vec3): boolean =>
          Number.isFinite(point[1]) &&
          (input.vertical === undefined
            ? point[1] === input.height
            : point[1] > 0),
      ) ||
      !stations.every(
        (station: number, index: number): boolean =>
          Number.isFinite(station) &&
          (index === 0 || station > stations[index - 1]!),
      )
    ) {
      const diagnostic: AutoMovieLoftContract.IDiagnostic = {
        producer: `view.${input.name}`,
        level: 2,
        contract: "toe source stations",
        detail: `generating centres and apex need finite positive heights and their original increasing foot-along clock: [${stations}] mm`,
      };
      return { part: null, loft: null, view: null, diagnostics: [diagnostic] };
    }
    const total: number = stations.at(-1)!;
    const roundoff: number =
      64 *
      Number.EPSILON *
      Math.max(
        1,
        total,
        ...points.flatMap((point: Vec3): number[] => point.map(Math.abs)),
      );
    for (let index: number = 0; index < points.length; index++) {
      const mismatch: number = Math.hypot(
        ...points[index]!.flatMap(
          (value: number, coordinate: number): number[] =>
            coordinate === 1 && input.vertical !== undefined
              ? [value - input.vertical.at(stations[index]!)[0]]
              : [
                  value -
                    first[coordinate]! -
                    ((input.apex[coordinate]! - first[coordinate]!) *
                      stations[index]!) /
                      total,
                ],
        ),
      );
      if (
        !Number.isFinite(mismatch) ||
        mismatch > roundoff ||
        Math.abs(projected[index]! - stations[index]!) > roundoff
      )
        return {
          part: null,
          loft: null,
          view: null,
          diagnostics: [
            {
              producer: `view.${input.name}`,
              level: 2,
              contract: "affine toe origin",
              detail: `centre ${index} misses the declared source origin by ${mismatch} mm or its owned station by ${projected[index]! - stations[index]!} mm beyond binary64 construction allowance ${roundoff} mm`,
            },
          ],
        };
    }
    const coordinate: (axis: 0 | 1 | 2) => IAutoMovieViewPart.IOutline = (
      axis: 0 | 1 | 2,
    ): IAutoMovieViewPart.IOutline => ({
      knots: [
        { site: "hidden start", station: 0, value: first[axis] },
        { site: "apex", station: total, value: input.apex[axis] },
      ],
    });
    const origin: AutoMovieViewParallelAxis.IOrigin = {
      x: coordinate(0),
      y: input.vertical?.height ?? coordinate(1),
      z: coordinate(2),
    };
    const axis: IAutoMovieConstructionParallelAxis = {
      type: "parallel",
      origin: {
        x: AutoMovieHumanConstructionView.length(origin.x),
        y: AutoMovieHumanConstructionView.length(origin.y),
        z: AutoMovieHumanConstructionView.length(origin.z),
      },
      u: { x: 0, y: 1, z: 0 },
      v: { x: input.along[2], y: 0, z: -input.along[0] },
    };
    const site = (
      name: string,
      station: number,
    ): AutoMovieHumanSiteViewPart.ISite => {
      const law: AutoMovieHumanDigitWalk.ISiteLaw = input.law(name);
      const vertical: [number, number, number, number] | undefined =
        input.vertical?.at(station);
      return {
        site: name,
        station,
        edges: [
          vertical?.[1] ?? law.depth - input.height,
          law.breadth / 2,
          vertical?.[2] ?? -input.height,
          -law.breadth / 2,
        ],
        fullness: { shoulder: law.shoulder },
        ...(input.vertical !== undefined || law.jets === undefined
          ? {}
          : { jets: law.jets }),
      };
    };
    const sites: AutoMovieHumanSiteViewPart.ISite[] = [];
    for (let index: number = 0; index + 1 < input.centres.length; index++) {
      sites.push(
        site(`shaft ${index}`, (stations[index]! + stations[index + 1]!) / 2),
      );
      sites.push(
        site(
          index + 2 === input.centres.length ? "end" : `joint ${index + 1}`,
          stations[index + 1]!,
        ),
      );
    }
    return {
      name: input.name,
      axis,
      origin,
      sites,
      pole: { end: "both", bottom: 0, top: total },
      ...(input.ranges === undefined ? {} : { ranges: input.ranges }),
      order: input.order,
      samples: input.order,
      gap: input.gap,
    };
  }
}
