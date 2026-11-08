import {
  AutoMovieLoftFrame,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
} from "@automovie/engine";

import { AutoMovieHumanTorsoArmPort } from "../generation/trunk/AutoMovieHumanTorsoArmPort";
import { AutoMovieHumanTorsoArmSource } from "../generation/trunk/AutoMovieHumanTorsoArmSource";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { HumanTorsoObservation } from "./HumanTorsoObservation";
import { NodeCanvasCamera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/** Actual parent/arm originals, authored port loops and separate bind datums, prepared for existing PNG I/O only. */
export namespace HumanTorsoArmObservation {
  /** Original buffers retain their actual source owners and incomplete connection state. */
  export interface IOutput {
    /** Same S00 family and selected real arm definitions. */
    readonly neighbours: AutoMovieHumanTorsoArmSource.IOutput;
    /** Full parent chart loops, with retained/removed chart meaning. */
    readonly ports: readonly AutoMovieHumanTorsoArmPort.IPort[];
    /** Individual parent/child and neighbouring selections with four actual cameras. */
    readonly selections: readonly HumanTorsoObservation.ISelection[];
    /** Original context diagnostics are retained; no renderer success overrides them. */
    readonly diagnostics: HumanTorsoObservation.IOutput["diagnostics"];
    /** Explicit constructor/display, source/support and binding limitations. */
    readonly provenance: Readonly<Record<string, unknown>>;
  }

  /**
   * Evaluate selected original neighbours of an already prepared S00 without calling BodyPreparation.
   * Uses the actual native Point0 owner and axis at each requested station.
   * Original proximal cap controls remain support; this display starts at the
   * declared free deltoid row and does not pretend a production domain cut occurred.
   * No band, raw loft, mesh, skin, pose, reference fit or shared weight is computed.
   */
  export function create(
    parameters: IAutoMovieHumanParameters,
    base: HumanTorsoObservation.IOutput,
  ): IOutput {
    const started: number = performance.now();
    const neighbours: AutoMovieHumanTorsoArmSource.IOutput =
      AutoMovieHumanTorsoArmSource.create(parameters, base.original);
    const ports: readonly AutoMovieHumanTorsoArmPort.IPort[] =
      AutoMovieHumanTorsoArmPort.create(base.original, neighbours);
    const preparedAt: number = performance.now();
    const torso: HumanTorsoObservation.ISelection | undefined =
      base.selections.find(
        (selection: HumanTorsoObservation.ISelection): boolean =>
          selection.id === "S00.all-originals",
      );
    if (torso === undefined)
      throw new Error(
        "Actual torso originals are unavailable for neighbour observation",
      );
    const selections: HumanTorsoObservation.ISelection[] = [];
    const displayStages: Record<string, number | string>[] = [];
    const multiplier: number = 1 / (1000 * base.original.plan.scale);

    /** Apply the existing display unit conversion once, preserving the actual body frame. */
    const scale: (point: readonly number[]) => N.Point = (
      point: readonly number[],
    ): N.Point => [
      point[0]! * multiplier,
      point[1]! * multiplier,
      point[2]! * multiplier,
    ];

    /** One unchanged buffer set supplies each camera, without per-view source preparation. */
    const add: (id: string, curves: N.Curve[]) => void = (
      id: string,
      curves: N.Curve[],
    ): void => {
      if (
        curves.length === 0 ||
        curves.some(
          (curve: N.Curve): boolean =>
            curve.points.length < 2 ||
            curve.points.some(
              (point: N.Point): boolean => !point.every(Number.isFinite),
            ),
        )
      )
        throw new Error(
          "Selected neighbour has no complete finite original buffers: " + id,
        );
      selections.push({
        id,
        curves,
        cameras: ["front", "left", "top", "high-oblique"].map(
          (name: string): N.Camera => ({
            ...NodeCanvasCamera.fit(
              name,
              curves.flatMap((curve: N.Curve): N.Point[] => [...curve.points]),
            ),
            annotations: false,
          }),
        ),
      });
    };
    for (const port of ports) {
      const arm: AutoMovieHumanTorsoArmSource.IArm = port.child;
      const admitting: number = performance.now();
      const source: ReturnType<typeof AutoMovieLoftViewSource.create> =
        AutoMovieLoftViewSource.create(arm.part);
      if (source === null || source.source === null)
        throw new Error(
          "Selected neighbour has no actual native source: " + arm.name,
        );
      const native: AutoMovieLoftViewSource.ISource = source.source;
      const admitted: number = performance.now() - admitting;
      let scalarMilliseconds: number = 0;
      let nativeMilliseconds: number = 0;
      let evaluationMilliseconds: number = 0;
      let factories: number = 0;
      let queries: number = 0;
      let latest:
        | { station: number; point: (clock: number) => [number, number] }
        | undefined;

      /** One immutable native station preparation serves its original section or material guides. */
      const point: (station: number, clock: number) => N.Point = (
        station: number,
        clock: number,
      ): N.Point => {
        if (latest?.station !== station) {
          const reading: number = performance.now();
          const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
            AutoMovieLoftViewRead.values(native, station);
          if (typeof values === "string") throw new Error(values);
          scalarMilliseconds += performance.now() - reading;
          const preparing: number = performance.now();
          const read: (clock: number) => [number, number] =
            values.extents.every((extent: number): boolean => extent === 0)
              ? (): [number, number] => [0, 0]
              : AutoMovieLoftSectionNative.point(values);
          nativeMilliseconds += performance.now() - preparing;
          factories++;
          latest = { station, point: read };
        }
        const evaluating: number = performance.now();
        const local: [number, number] = latest.point(clock);
        const value: N.Point = scale(
          AutoMovieLoftFrame.place(
            arm.part.axis.at(station),
            local[0],
            local[1],
          ),
        );
        evaluationMilliseconds += performance.now() - evaluating;
        queries++;
        return value;
      };
      const stations: number[] = [
        ...new Set([
          arm.portStation,
          ...arm.part.stations.filter(
            (station: number): boolean => station >= arm.portStation,
          ),
        ]),
      ];
      const columns: number[] = stations.flatMap(
        (station: number, index: number): number[] =>
          index + 1 === stations.length
            ? [station]
            : Array.from(
                { length: 16 },
                (_: unknown, step: number): number =>
                  station + ((stations[index + 1]! - station) * step) / 16,
              ),
      );
      const curves: N.Curve[] = [0, 1, 2, 3].map(
        (quarter: number): N.Curve => ({
          id: arm.name + ".original.guide." + quarter,
          closed: false,
          colour: "1479d0",
          points: columns.map(
            (station: number): N.Point =>
              point(station, (quarter * Math.PI) / 2),
          ),
        }),
      );
      const authored: number[] = [
        ...new Set([
          arm.portStation,
          ...native.extents.flatMap(
            (
              outline: AutoMovieLoftViewSource.ISource["extents"][number],
            ): number[] =>
              outline.knots.map(
                (
                  knot: AutoMovieLoftViewSource.ISource["extents"][number]["knots"][number],
                ): number => knot.station,
              ),
          ),
        ]),
      ].filter((station: number): boolean => station >= arm.portStation);
      for (const station of authored)
        curves.push({
          id: arm.name + ".original.section." + station,
          closed: true,
          colour: "1479d0",
          points: Array.from(
            { length: 128 },
            (_: unknown, step: number): N.Point =>
              point(station, (2 * Math.PI * step) / 128),
          ),
        });
      const boundary: N.Curve = {
        id: port.id + ".parent",
        closed: true,
        colour: "ed8616",
        points: Array.from(
          { length: 128 },
          (_: unknown, step: number): N.Point =>
            scale(
              port.resolve(port.boundary((2 * Math.PI * step) / 128)).point,
            ),
        ),
      };
      const childBoundary: N.Curve = {
        id: port.id + ".child",
        closed: true,
        colour: "1479d0",
        points: Array.from(
          { length: 128 },
          (_: unknown, step: number): N.Point =>
            point(arm.portStation, (2 * Math.PI * step) / 128),
        ),
      };
      const datum: N.Curve = {
        id: port.id + ".acromion-to-GH",
        closed: false,
        colour: "21a05b",
        points: [scale(arm.acromion), scale(arm.joint)],
      };
      const supportStations: number[] = [
        ...arm.part.stations.filter(
          (station: number): boolean => station < arm.portStation,
        ),
        arm.portStation,
      ];
      const support: N.Curve[] = [0, 1, 2, 3].map(
        (quarter: number): N.Curve => ({
          id: arm.name + ".support-only.guide." + quarter,
          closed: false,
          colour: "9e7658",
          points: supportStations
            .flatMap((station: number, index: number): number[] =>
              index + 1 === supportStations.length
                ? [station]
                : Array.from(
                    { length: 16 },
                    (_: unknown, step: number): number =>
                      station +
                      ((supportStations[index + 1]! - station) * step) / 16,
                  ),
            )
            .map(
              (station: number): N.Point =>
                point(station, (quarter * Math.PI) / 2),
            ),
        }),
      );
      add(port.id + ".parent-original", [boundary, datum, ...support]);
      add(port.id + ".child-original", [...curves, childBoundary, datum]);
      add(port.id + ".neighbours", [
        ...torso.curves.map(
          (curve: N.Curve): N.Curve => ({ ...curve, colour: "d62f9b" }),
        ),
        ...curves,
        boundary,
        childBoundary,
        datum,
        ...support,
      ]);
      displayStages.push({
        name: arm.name,
        sourceAdmission: admitted,
        scalarRead: scalarMilliseconds,
        nativeFactory: nativeMilliseconds,
        pointAndFrame: evaluationMilliseconds,
        nativeFactories: factories,
        pointQueries: queries,
      });
    }
    return {
      neighbours,
      ports,
      selections,
      diagnostics: [
        ...base.diagnostics,
        ...neighbours.arms.flatMap(
          (
            arm: AutoMovieHumanTorsoArmSource.IArm,
          ): { id: string; detail: string }[] =>
            arm.diagnostics.map(
              (
                diagnostic: AutoMovieHumanTorsoArmSource.IArm["diagnostics"][number],
              ): { id: string; detail: string } => ({
                id: arm.name,
                detail: JSON.stringify(diagnostic),
              }),
            ),
        ),
      ],
      provenance: {
        stage: "selected-original-neighbours-and-authored-port-candidates",
        revision: neighbours.revision,
        ownerScope: neighbours.ownerScope,
        milliseconds: {
          constructors: preparedAt - started,
          arms: neighbours.milliseconds,
          inputAndPlacement: neighbours.inputAndPlacementMilliseconds,
          display: performance.now() - preparedAt,
          displayStages,
          armStages: neighbours.arms.map(
            (
              arm: AutoMovieHumanTorsoArmSource.IArm,
            ): Record<string, unknown> => ({
              name: arm.name,
              ...arm.milliseconds,
            }),
          ),
        },
        sourceDomains: neighbours.arms.map(
          (
            arm: AutoMovieHumanTorsoArmSource.IArm,
          ): Record<string, unknown> => ({
            name: arm.name,
            original: [arm.part.stations[0], arm.part.stations.at(-1)],
            displayed: [arm.portStation, arm.part.stations.at(-1)],
            supportOnly: [arm.part.stations[0], arm.portStation],
            actualProductionCut: "unrequested",
          }),
        ),
        ports: ports.map(
          (
            port: AutoMovieHumanTorsoArmPort.IPort,
          ): Record<string, unknown> => ({
            id: port.id,
            domain: port.domain,
            period: port.period,
            orientation: port.orientation,
            bounds: port.bounds,
            keptSide: port.keptSide,
            chartClassification: port.chartClassification,
            sharedWeights: port.sharedWeights,
          }),
        ),
        sampling:
          "16 display steps per original station span unchanged; authored source-knot sections and the child boundary use128 phase samples; brown proximal support is separate from kept blue originals. No construction fit, raw loft or global regularity certificate.",
        unverified: [
          "original bind-datum equivalence",
          "port anatomy and global world simplicity",
          "coupled measurements",
          "actual retained chart cuts",
          "known-port band",
          "shared weights",
          "raw loft",
          "final skin",
        ],
      },
    };
  }
}
