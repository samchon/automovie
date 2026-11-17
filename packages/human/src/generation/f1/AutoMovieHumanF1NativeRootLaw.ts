import { AutoMovieHumanF1NativeRootLevel as Level } from "./AutoMovieHumanF1NativeRootLevel";
import {
  type AutoMovieConstructionSplitBand,
  AutoMovieSolidVector,
  type AutoMovieViewAxis,
  AutoMovieLoftViewFullSource as Full,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
  AutoMovieNaturalSpline as Natural,
  AutoMovieConstructionPortCurve as PortCurve,
} from "@automovie/engine";

import { AutoMovieHumanF1NativeRootClock as Clock } from "./AutoMovieHumanF1NativeRootClock";
import { AutoMovieHumanF1NativeRootControl as Control } from "./AutoMovieHumanF1NativeRootControl";
import { AutoMovieHumanF1NativeRootResolve } from "./AutoMovieHumanF1NativeRootResolve";
import type { AutoMovieHumanF1NativeRootTypes as Types } from "./AutoMovieHumanF1NativeRootTypes";

/** Qualified shared-original root construction; every native entry consumes this same coordinated law. */
export namespace AutoMovieHumanF1NativeRootLaw {
  /** Canonical V units, ownership and failure meaning are defined by NativeRootTypes. */
  export type V = Types.V;
  /** Canonical ITargets units, ownership and failure meaning are defined by NativeRootTypes. */
  export type ITargets = Types.ITargets;
  /** Canonical ICurves units, ownership and failure meaning are defined by NativeRootTypes. */
  export type ICurves = Types.ICurves;
  /** Canonical IOriginal units, ownership and failure meaning are defined by NativeRootTypes. */
  export type IOriginal = Types.IOriginal;
  /** Canonical ICalibration units, ownership and failure meaning are defined by NativeRootTypes. */
  export type ICalibration = Types.ICalibration;
  /** Canonical IRootRow units, ownership and failure meaning are defined by NativeRootTypes. */
  export type IRootRow = Types.IRootRow;
  /** Canonical IRootSpec units, ownership and failure meaning are defined by NativeRootTypes. */
  export type IRootSpec = Types.IRootSpec;
  /** Canonical ISeed units, ownership and failure meaning are defined by NativeRootTypes. */
  export type ISeed = Types.ISeed;
  /** Canonical ISeedTransport units, ownership and failure meaning are defined by NativeRootTypes. */
  export type ISeedTransport = Types.ISeedTransport;
  /** Canonical IPrepared units, ownership and failure meaning are defined by NativeRootTypes. */
  export type IPrepared = Types.IPrepared;
  /** Canonical IInspection units, ownership and failure meaning are defined by NativeRootTypes. */
  export type IInspection = Types.IInspection;

  /** Same complete-control target owner used by actual source construction. */
  export const targets: typeof Control.targets = Control.targets;
  /** Original-residual-preserving native coordinate increment. */
  export const address: typeof Control.address = Control.address;
  /** Actual admitted periodic phase graph and original-clock inverse. */
  export const phaseCurve: typeof Clock.phaseCurve = Clock.phaseCurve;
  /** Existing-pole positive radial graph, retaining original target inverse addresses. */
  export const reclock: typeof Clock.reclock = Clock.reclock;
  const turn: number = 2 * Math.PI;

  /** Original source controls and exact existing operator correspondence, prepared once without lofting. */
  export function calibrate(input: IOriginal): ICalibration {
    if (
      input.count < 4 ||
      !Number.isInteger(input.count) ||
      input.rails.length === 0 ||
      !input.rails.every(Number.isFinite)
    )
      throw new Error(
        "complete original root clock/rail required: " + input.name,
      );
    const parentReader: Full.IReader = Full.create(input.parent);
    const childReader: Full.IReader = Full.create(input.child);
    const charts: [number, number][] = PortCurve.chart(
      input.loop,
      input.count,
    ).addresses;
    const parent: V[] = charts.map(
      ([s, t]: [number, number]): V => parentReader.point(s, t),
    );
    const childRail: (phase: number) => number =
      input.rails.length === 1
        ? (): number => input.rails[0]!
        : Natural.periodic([...input.rails]);
    const side: AutoMovieConstructionSplitBand.ISide = {
      surface: surface(input.child.name, childReader),
      station: input.rails[0]!,
      into: 1,
      along: childRail,
    };
    const phases: number[] | string = PortCurve.correspondence(
      side,
      parent,
      input.correspondence,
    );
    if (typeof phases === "string")
      throw new Error(input.name + ": original " + phases);
    const child: V[] = phases.map(
      (phase: number): V => childReader.point(childRail(phase), phase),
    );
    const level: Level.IOriginal = Level.original(input, parentReader, charts, parent);
    return { input, charts, parent, child, childPhases: phases, childRail, level };
  }

  /** One range-independent course followed by one actual native root-control resolution. */
  export function prepare(
    original: ICalibration,
    parent: IAutoMovieViewPart,
    scale: readonly [number, number],
  ): IPrepared {
    if (
      !scale.every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      )
    )
      throw new Error("root caliper factors must be positive finite");
    const reader: Full.IReader = Full.create(parent);
    const anchor: V = original.parent[0]!,
      at: [number, number] = original.charts[0]!;
    const delta: V = AutoMovieSolidVector.sub(
      reader.point(at[0], at[1]),
      anchor,
    );
    const mapper: Control.IAffine = Control.create(
      original.input.basis,
      scale,
      anchor,
    );
    return {
      axis: mapper.axis(original.input.child.axis, delta),
      cutterAxis: (axis: AutoMovieViewAxis.IAxis): AutoMovieViewAxis.IAxis =>
        mapper.axis(axis, delta),
      resolve: (candidate: IAutoMovieViewPart): IRootSpec =>
        AutoMovieHumanF1NativeRootResolve({
          original,
          parent,
          scale,
          reader,
          candidate,
        }),
    };
  }

  /** Direct complete native source adapter used only by the existing original clock calculation. */
  function surface(name: string, reader: Full.IReader): IAutoMovieSolidSurface {
    return {
      name,
      period: turn,
      orientation: 1,
      domain: [...reader.domain],
      point: reader.point,
      jet: reader.jet,
    };
  }
}
