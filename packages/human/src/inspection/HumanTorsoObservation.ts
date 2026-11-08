import { AutoMovieConstructionProfile } from "@automovie/engine";

import { AutoMovieHumanTorsoCourse } from "../generation/trunk/AutoMovieHumanTorsoCourse";
import { AutoMovieHumanTorsoSource } from "../generation/trunk/AutoMovieHumanTorsoSource";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { NodeCanvasCamera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/**
 * Pure modeler-owned original S00 evaluation into display buffers. The PNG consumer only draws these points and cameras.
 *
 * Sampling materializes original functions for inspection; it is never a construction fit, a continuity certificate or a new source. Every open original piece keeps its own ID. A full loop is not silently connected across a failed piece or endpoint mismatch. No raw loft, native Canvas, file access or reference fitting runs here.
 */
export namespace HumanTorsoObservation {
  /** Selected original generating owners copied by the existing executable; this is not a complete compiler/runtime dependency proof. */
  export const sourceFiles: readonly string[] = [
    ...[
      "Plan",
      "Source",
      "Measurements",
      "Thorax",
      "Closure",
      "Course",
      "Region",
      "Wall",
      "Partition",
    ].map(
      (name: string): string =>
        "packages/human/src/generation/trunk/AutoMovieHumanTorso" +
        name +
        ".ts",
    ),
    ...[
      "BodyLaw",
      "BodySources",
      "BodyFrame",
      "LimbRest",
      "LimbSources",
      "ShoulderDatum",
      "NeckBoundary",
      "BodyPlaces",
      "LegPrior",
      "ReferenceOutlines",
      "HeadInputs",
      "NeckSource",
      "NeckPrior",
      "NeckFamily",
      "NeckPart",
      "NeckSupport",
      "HeadArcs",
    ].map(
      (name: string): string =>
        "packages/human/src/generation/AutoMovieHuman" + name + ".ts",
    ),
    "packages/human/src/generation/IAutoMovieHumanHeadInputs.ts",
    "packages/human/src/generation/IAutoMovieHumanHeadNeck.ts",
    "packages/human/src/generation/limb/AutoMovieHumanSiteDefinition.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmSources.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmFrame.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmHandControls.ts",
    "packages/human/src/generation/limb/AutoMovieHumanSiteConstraints.ts",
    "packages/human/src/generation/limb/AutoMovieHumanSiteControls.ts",
    "packages/human/src/generation/limb/AutoMovieHumanSiteRegionControls.ts",
    "packages/human/src/generation/leg/AutoMovieHumanLegSources.ts",
    "packages/human/src/generation/leg/AutoMovieHumanLegRegion.ts",
    "packages/human/src/generation/limb/AutoMovieHumanConstructionView.ts",
    ...[
      "Pose",
      "NeckLayout",
      "NeckCurves",
      "NeckBase",
      "NeckBaseTrial",
      "NeckScalars",
      "Layout",
      "Lane",
      "MassPart",
    ].map(
      (name: string): string =>
        "packages/human/src/generation/head/AutoMovieHumanHead" + name + ".ts",
    ),
  ];

  /** Same-source side-neck/bust observation, kept distinct from original construction and raster work. */
  export interface ICourse {
    /** Defined endpoints and chord remain independent of crossing/metric success. */
    readonly endpoints: AutoMovieHumanTorsoCourse.IEndpoints;

    /** Actual sampled plane crossings, empty rows and taut length when that strict request succeeded. */
    readonly reading?: AutoMovieHumanTorsoCourse.IReading;

    /** Original metric refusal, absent only after a successful reading. */
    readonly failure?: string;

    /** Actual refused query, when the failure reached a source point request. */
    readonly failureQuery?: AutoMovieHumanTorsoCourse.IWork["failure"];

    /** Endpoint chord lower bound, calibration mm; not a replacement course. */
    readonly straightLowerBound: number;

    /** Existing display curves: raw plane intersections and the endpoint chord, not a fitted tape. */
    readonly curves: readonly N.Curve[];

    /** Source-course observation and display conversion costs, measured separately. */
    readonly milliseconds: Readonly<Record<"sourceCourse" | "display", number>>;
  }

  /** Read one explicit actual course once and reuse its buffers through every selected camera. */
  export function course(original: AutoMovieHumanTorsoSource.IOutput): ICourse {
    const started: number = performance.now();
    const prepared: AutoMovieHumanTorsoCourse.IPrepared =
      AutoMovieHumanTorsoCourse.prepare(original);
    const endpoints: AutoMovieHumanTorsoCourse.IEndpoints = prepared.endpoints;
    const work: AutoMovieHumanTorsoCourse.IWork = {};
    let reading: AutoMovieHumanTorsoCourse.IReading | undefined;
    let failure: string | undefined;
    try {
      reading = prepared.read(work);
    } catch (error: unknown) {
      failure =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
    }
    const readAt: number = performance.now();
    const multiplier: number = 1 / (original.plan.scale * 1000);
    const curves: N.Curve[] = [
      {
        id: "S00.course.side-neck-bust.endpoint-chord",
        colour: "205c99",
        closed: false,
        points: [endpoints.apex, endpoints.neck].map(
          (p: readonly number[]): N.Point => scale(p, multiplier),
        ),
      },
    ];
    if (reading !== undefined)
      curves.unshift({
        id: "S00.course.side-neck-bust.sampled-intersections",
        colour: "a67b13",
        closed: false,
        points: [reading.apex, ...reading.points, reading.neck].map(
          (p: readonly number[]): N.Point => scale(p, multiplier),
        ),
      });
    return {
      endpoints,
      reading,
      failure,
      failureQuery: work.failure,
      curves,
      straightLowerBound: endpoints.straightLowerBound,
      milliseconds: {
        sourceCourse: readAt - started,
        display: performance.now() - readAt,
      },
    };
  }

  /** One explicit original selection for the four required inspection cameras. */
  export interface ISelection {
    /** Stable group, individual guide or original piece id. */
    readonly id: string;

    /** Exact evaluated curves, in metres. */
    readonly curves: readonly N.Curve[];

    /** Actual cameras derived once from that selection's evaluated geometry. */
    readonly cameras: readonly N.Camera[];
  }

  /** Actual original buffers plus independent completion facts. */
  export interface IOutput {
    /** The same caller-owned original source and semantic constraint owner. */
    readonly original: AutoMovieHumanTorsoSource.IOutput;

    /** Actual original guides, per-piece sections and explicit groups. */
    readonly selections: readonly ISelection[];

    /** Source failures remain named observations; no partial polyline is substituted. */
    readonly diagnostics: readonly { id: string; detail: string }[];

    /** Sampling and ownership facts accompanying every PNG. */
    readonly provenance: Readonly<Record<string, unknown>>;
  }

  /** Prepare and evaluate only the new S00 original, independently of whole-body preparation or a 3D operator. */
  export function create(
    parameters: IAutoMovieHumanParameters,
    shared?: Parameters<typeof AutoMovieHumanTorsoSource.create>[2],
  ): IOutput {
    const started: number = performance.now();
    const original: AutoMovieHumanTorsoSource.IOutput =
      AutoMovieHumanTorsoSource.create(parameters, undefined, shared);
    const prepared: number = performance.now();
    return evaluate(original, { preparedMilliseconds: prepared - started });
  }

  /** Materialize one retained original at its named planes and guides; the caller owns the source epoch. */
  export function evaluate(
    original: AutoMovieHumanTorsoSource.IOutput,
    timing?: { preparedMilliseconds: number },
  ): IOutput {
    const started: number = performance.now();
    const prepared: AutoMovieConstructionProfile.IPrepared =
      AutoMovieConstructionProfile.create(original.source);
    const curves: N.Curve[] = [];
    const diagnostics: { id: string; detail: string }[] = [];
    const groups: Map<string, N.Curve[]> = new Map();
    const multiplier: number = 1 / (original.plan.scale * 1000);
    const curve: (
      id: string,
      read: () => N.Point[],
      closed: boolean,
      colour: string,
    ) => void = (
      id: string,
      read: () => N.Point[],
      closed: boolean,
      colour: string,
    ): void => {
      try {
        const points: N.Point[] = read();
        if (
          points.length < 2 ||
          points.some(
            (point: N.Point): boolean => !point.every(Number.isFinite),
          )
        )
          throw new Error("Original display has fewer than two finite points");
        curves.push({ id, points, closed, colour });
      } catch (error: unknown) {
        diagnostics.push({
          id,
          detail:
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
        });
      }
    };
    const anchors: number[] = [
      ...new Set([
        original.plan.domain[0],
        original.plan.domain[1],
        ...original.wall.stations,
        ...original.sections.map(
          (section: AutoMovieHumanTorsoSource.ISection): number =>
            section.station,
        ),
      ]),
    ].sort((a: number, b: number): number => a - b);
    for (const guide of original.guides) {
      const stations: number[] = [
        guide.domain[0],
        ...anchors.filter(
          (station: number): boolean =>
            station > guide.domain[0] && station < guide.domain[1],
        ),
        guide.domain[1],
      ];
      curve(
        "human.construction.profile.S00/guide." + guide.id,
        (): N.Point[] =>
          subdivide(stations, 16).map(
            (station: number): N.Point =>
              scale(guide.point(station), multiplier),
          ),
        false,
        guide.region === "trunk" ? "c52247" : "276bad",
      );
    }
    for (const name of ["collar.start", "neck.base", "neck.normal"] as const)
      curve(
        "human.construction.profile.S00/guide." + name,
        (): N.Point[] =>
          Array.from({ length: 128 }, (_: unknown, index: number): N.Point => {
            const phase: number = (2 * Math.PI * index) / 128;
            const station: number =
              name === "collar.start"
                ? original.collar.start(phase)[0]
                : name === "neck.base"
                  ? original.plan.neckFamily.height(phase)[0]
                  : original.plan.neckFamily.normalHeight(phase)[0];
            const p: [number, number] = original.point(station, phase);
            return scale([p[0], station, p[1]], multiplier);
          }),
        true,
        name === "collar.start"
          ? "367b38"
          : name === "neck.base"
            ? "ef8300"
            : "276bad",
      );
    curve(
      "human.construction.profile.S00/guide.neck.named-base-scaffold",
      (): N.Point[] =>
        original.plan.neckFamily.sites.map(
          (site: (typeof original.plan.neckFamily.sites)[number]): N.Point =>
            scale(site.point, multiplier),
        ),
      true,
      "205c99",
    );
    for (const section of original.sections) {
      const sectionCurves: N.Curve[] = [];
      for (const loop of original.source.definition.loops) {
        if (
          section.station < loop.domain[0] * 1000 ||
          section.station > loop.domain[1] * 1000
        )
          continue;
        for (const piece of loop.pieces) {
          const id: string =
            "human.construction.profile.S00/" + section.id + "/" + piece.id;
          const before: number = curves.length;
          curve(
            id,
            (): N.Point[] => {
              const surface: ReturnType<typeof prepared.surfaces.get> =
                prepared.surfaces.get(piece.id);
              const point: NonNullable<typeof surface>["point"] =
                surface?.point;
              if (point === undefined)
                throw new Error(
                  "Original piece Point0 is unavailable: " + piece.source,
                );
              prepared.section(section.station);
              return subdivide([0, 1], 64).map(
                (coordinate: number): N.Point =>
                  scale(point(section.station, coordinate), multiplier),
              );
            },
            false,
            "ad357f",
          );
          if (curves.length !== before) sectionCurves.push(curves.at(-1)!);
        }
      }
      groups.set(section.id, sectionCurves);
    }
    groups.set("S00.all-originals", curves);
    groups.set(
      "S00.guides",
      curves.filter((item: N.Curve): boolean => item.id.includes("/guide.")),
    );
    for (const item of curves) groups.set(item.id, [item]);
    const selections: ISelection[] = [...groups].map(
      ([id, selected]: [string, N.Curve[]]): ISelection => ({
        id,
        curves: selected,
        cameras:
          selected.length === 0
            ? []
            : ["front", "left", "top", "high-oblique"].map(
                (name: string): N.Camera => ({
                  ...NodeCanvasCamera.fit(
                    name,
                    selected.flatMap((item: N.Curve): N.Point[] => [
                      ...item.points,
                    ]),
                  ),
                  annotations: false,
                }),
              ),
      }),
    );
    return {
      original,
      selections,
      diagnostics,
      provenance: {
        producer:
          "HumanTorsoObservation -> AutoMovieConstructionProfile -> AutoMovieHumanTorsoSource",
        source: original.source.definition,
        constraints: original.plan.constraints,
        collar: {
          start: original.plan.collarStart,
          neckSupport: original.plan.neckFamily.curve.domain,
          originalBaseCourse: original.plan.neckFamily.controls.height,
          namedBaseSites: original.plan.neckFamily.sites,
          sideSiteMeaning:
            "Posterior quarter-depth caliper proxy on the same native family; greatest width, neck-shoulder inflection and clinical anterior trapezius correspondence remain unverified; neither phase nor front X is a measured input",
          normalPlane: {
            origin: original.plan.neckFamily.controls.planeOrigin,
            normal: original.plan.neckFamily.controls.planeNormal,
          },
          jointDatum: original.plan.neckJointDatum,
        },
        capability: original.capability,
        stage: "original-composed-source-candidate",
        finalRealization: "not-run",
        sampling: {
          stationsPerSourceSpan: 16,
          stepsPerOriginalPiece: 64,
          use: "display only; no source fitting or world-curve error certificate",
        },
        milliseconds: {
          originalPreparation: timing?.preparedMilliseconds ?? null,
          display: performance.now() - started,
          preparationStages: original.plan.preparationMilliseconds,
          sourceStages: original.milliseconds,
        },
        unverified: [
          "coupled semantic measurement closure",
          "full physical2 and regularity",
          "known ports and atlas",
          "raw loft",
          "final skin",
          "anatomical acceptance",
        ],
      },
    };
  }

  /**
   * Include exact boundaries and uniformly subdivide only display spans.
   *
   * @evidence contracts/common.md#principled-implementation Samples intervals in their given physical/source coordinate without altering either endpoint or the original evaluator.
   * @evidence contracts/common.md#clear-and-simple-design The same small display policy serves original and retained-loft curve adapters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies display coordinates only, never a fitted curve, fabricated jet or approximation certificate.
   * @evidence contracts/common.md#meaningful-documentation Caller-owned ordered anchors and positive integer steps determine uniform interior samples and one final endpoint.
   * @evidence contracts/performance.md#efficient-algorithms For N anchors and K subdivisions, emits O(NK) numbers with one pass and no geometry evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work Original and realized display consumers use this identical subdivision rule rather than different curve approximants.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh numeric array; the function retains no source, cache or handle.
   */
  export function subdivide(
    anchors: readonly number[],
    steps: number,
  ): number[] {
    return anchors.flatMap((station: number, index: number): number[] =>
      index + 1 === anchors.length
        ? [station]
        : Array.from(
            { length: steps },
            (_: unknown, at: number): number =>
              station + ((anchors[index + 1]! - station) * at) / steps,
          ),
    );
  }
}

/** Convert calibration millimetres to display metres once, without recentering the source. */
function scale(point: readonly number[], multiplier: number): N.Point {
  return [
    point[0]! * multiplier,
    point[1]! * multiplier,
    point[2]! * multiplier,
  ];
}
