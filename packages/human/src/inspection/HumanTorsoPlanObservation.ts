import { AutoMovieLoftSectionNative, AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanTorsoPlan } from "../generation/trunk/AutoMovieHumanTorsoPlan";
import { AutoMovieHumanTorsoWall } from "../generation/trunk/AutoMovieHumanTorsoWall";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { HumanTorsoObservation } from "./HumanTorsoObservation";
import { NodeCanvasCamera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/** Actual authoring datums and the original neck course, independently of admitting a complete composed torso. */
export namespace HumanTorsoPlanObservation {
  /** Actual input drawings and facts, without a substitute successful S00 source. */
  export type IOutput = Pick<
    HumanTorsoObservation.IOutput,
    "selections" | "diagnostics" | "provenance"
  >;

  /** Show all physical order/domain inputs together before choosing a material transition. */
  export function create(parameters: IAutoMovieHumanParameters): IOutput {
    const started: number = performance.now();
    return evaluate(AutoMovieHumanTorsoPlan.define(parameters), started);
  }

  /** Display the same independent definition after a closed consumer refuses; no alternate lower radius is supplied. */
  export function evaluate(plan: AutoMovieHumanTorsoPlan.IDefinition, started: number = performance.now()): IOutput {
    const diagnostics: { id: string; detail: string }[] = [];
    const normal: NonNullable<typeof plan.neckPreparation.definition> = plan.neckPreparation.definition!;
    const normalStarted: number = performance.now();
    const native: ReturnType<typeof AutoMovieLoftSectionNative.point> = AutoMovieLoftSectionNative.point({
      extents: [...normal.extents], shoulders: normal.extents.map((): number => AutoMovieViewSection.ELLIPSE),
    });
    const normalPoints: [number, number][] = Array.from({ length: 128 }, (_: unknown, at: number): [number, number] => native(2 * Math.PI * at / 128));
    const normalPointReading: number = performance.now() - normalStarted;
    let wall: AutoMovieHumanTorsoWall.IOutput | undefined;
    const wallStarted: number = performance.now();
    try {
      wall = AutoMovieHumanTorsoWall.create(plan);
    } catch (error: unknown) {
      diagnostics.push({ id: "S00.available-wall", detail: error instanceof Error ? (error.stack ?? error.message) : String(error) });
    }
    const wallPreparation: number = performance.now() - wallStarted;
    const prepared: number = performance.now();
    const multiplier: number = 1 / (plan.scale * 1000);
    const curves: N.Curve[] = [];
    let wallNativeEvaluation: number = 0;
    let coordinateMapping: number = 0;

    /** Display conversion preserves every original body coordinate. */
    const scaled: (point: readonly number[]) => N.Point = (
      point: readonly number[],
    ): N.Point => {
      const converting: number = performance.now();
      const result: N.Point = [point[0]! * multiplier, point[1]! * multiplier, point[2]! * multiplier];
      coordinateMapping += performance.now() - converting;
      return result;
    };
    for (const site of plan.wall.sites)
      curves.push({
        id: "S00.datum.plane." + site.site,
        closed: true,
        colour:
          site.site === "acromion" || site.site === "axilla"
            ? "c52247"
            : "787878",
        points: [
          [site.front, site.y, site.half],
          [site.back, site.y, site.half],
          [site.back, site.y, -site.half],
          [site.front, site.y, -site.half],
        ].map(scaled),
      });
    for (const region of plan.regions) {
      const [x, y, z]: readonly [number, number, number] = region.apex;
      curves.push({
        id: region.name + ".control.vertical",
        closed: false,
        colour: "367b38",
        points: [
          scaled([x, y - region.footprint[2], z]),
          scaled([x, y + region.footprint[0], z]),
        ],
      });
      curves.push({
        id: region.name + ".control.lateral",
        closed: false,
        colour: "367b38",
        points: [
          scaled([x, y, z - region.side * region.footprint[3]]),
          scaled([x, y, z + region.side * region.footprint[1]]),
        ],
      });
    }
    const neck: N.Curve[] = [...new Set(normal.band)].map((y: number): N.Curve => ({
      id: "neck.original.normal-band.section." + y, closed: true, colour: "276bad",
      points: normalPoints.map((p: [number, number]): N.Point => {
        return scaled([normal.planeOrigin[0] + normal.slope * (y - normal.planeOrigin[1]) + p[0], y, p[1]]);
      }),
    }));
    neck.push({ id: "neck.original.axis-normal-course", closed: true, colour: "ef8300",
      points: normalPoints.map((p: [number, number]): N.Point => {
        const y: number = normal.planeOrigin[1] - normal.slope * p[0] / (1 + normal.slope * normal.slope);
        return scaled([normal.planeOrigin[0] + normal.slope * (y - normal.planeOrigin[1]) + p[0], y, p[1]]);
      }),
    });
    if (wall !== undefined) {
      const phases: number[] = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
      const points: N.Point[][] = phases.map((): N.Point[] => []);
      const failed: Set<number> = new Set();
        for (let at: number = 0; at < 257; at++) {
          const y: number = at === 256 ? plan.domain[1] : plan.domain[0] + (plan.domain[1] - plan.domain[0]) * at / 256;
          const reading: number = performance.now();
          let row: ([number, number] | undefined)[];
          try {
            row = phases.map((phase: number, index: number): [number, number] | undefined => {
              if (failed.has(index)) return undefined;
              try { return wall!.point(y, phase); }
              catch (error: unknown) {
                failed.add(index);
                diagnostics.push({ id: "S00.wall-candidate.original.guide." + phase,
                  detail: "At physical Y=" + y + ": " + (error instanceof Error ? (error.stack ?? error.message) : String(error)) });
                return undefined;
              }
            });
          } finally {
            wallNativeEvaluation += performance.now() - reading;
          }
          row.forEach((p: [number, number] | undefined, phase: number): void => {
            if (p !== undefined) points[phase]!.push(scaled([p[0], y, p[1]]));
          });
        }
        curves.push(...phases.flatMap((phase: number, at: number): N.Curve[] => failed.has(at) ? [] : [{ id: "S00.wall-candidate.original.guide." + phase,
          closed: false, colour: "c52247", points: points[at]! }]));
    }
    const groups: { id: string; curves: N.Curve[] }[] = [
      { id: "S00.available-wall-and-normal", curves: [...curves, ...neck] },
      {
        id: "S00.available-normal-and-shoulder-datums",
        curves: [
          ...curves.filter(
            (curve: N.Curve): boolean =>
              curve.id.endsWith(".acromion") ||
              curve.id.endsWith(".axilla") ||
              curve.id.endsWith(".neck"),
          ),
          ...neck,
        ],
      },
    ];
    return {
      diagnostics,
      selections: groups.map(
        (group: {
          id: string;
          curves: N.Curve[];
        }): HumanTorsoObservation.ISelection => ({
          ...group,
          cameras: ["front", "left", "top", "high-oblique"].map(
            (name: string): N.Camera => ({
              ...NodeCanvasCamera.fit(
                name,
                group.curves.flatMap((curve: N.Curve): N.Point[] => [
                  ...curve.points,
                ]),
              ),
              annotations: false,
            }),
          ),
        }),
      ),
      provenance: {
        producer:
          "HumanTorsoPlanObservation -> actual TorsoPlan.define and shared normal source",
        stage: "independent-wall-and-normal-originals",
        source:
          "no composed S00 supplied by this independent reader; no substitute part or geometry-success claim",
        wallSites: plan.wall.sites,
        regions: plan.regions,
        neck: {
          constantBand: normal.band,
          bandKind: normal.band[0] === normal.band[1] ? "single-plane" : "interval",
          extents: normal.extents,
          planeOrigin: normal.planeOrigin,
          planeNormal: normal.planeNormal,
          jointDatum: plan.neckJointDatum,
          split: plan.neck.boundary,
          normalMeasured: normal.normalMeasured,
          lowerFamily: "unresolved; no lower-radius original or collar is displayed",
          lowerFamilyInputs: normal.input.base,
        },
        constraints: plan.constraints,
        milliseconds: {
          definitionStages: plan.preparationMilliseconds,
          wallOwnerPreparation: wallPreparation,
          normalNativePreparationAnd128PhaseReads: normalPointReading,
          wallNativePointEvaluationIncludingFirstStationPreparation: wallNativeEvaluation,
          displayCoordinateMapping: coordinateMapping,
          displayAndLazyNativeEvaluation: performance.now() - prepared,
          elapsedBeforeDisplay: prepared - started,
          firstOriginalRequest: performance.now() - started,
        },
        sampling:
          "display only; plane boxes/control crosses are authoring aids, not section outlines",
        unverified: [
          "complete S00 composition",
          "whole-domain regularity and simplicity",
          "coupled torso constraints",
          "raw loft",
          "final skin",
          "binding and 32-input integration",
        ],
      },
    };
  }
}
