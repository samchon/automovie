import {
  AutoMovieHumanNativeRootClock as Clock,
} from "./AutoMovieHumanNativeRootClock";
import {
  AutoMovieHumanNativeRootControl as Control,
} from "./AutoMovieHumanNativeRootControl";
import {
  AutoMovieHumanNativeRootLevel as Level,
} from "./AutoMovieHumanNativeRootLevel";
import { AutoMovieHumanNativeRootResolve } from "./AutoMovieHumanNativeRootResolve";
import {
  AutoMovieConstructionPortCurve as PortCurve,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieNaturalSpline as Natural,
  AutoMovieSolidVector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSplitBand,
  IAutoMovieHumanNativeRoot,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Qualified shared-original root construction; every native entry consumes this same coordinated law. */
export namespace AutoMovieHumanNativeRootLaw {

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
  export function calibrate(input: IAutoMovieHumanNativeRoot.IOriginal): IAutoMovieHumanNativeRoot.ICalibration {
    if (
      input.count < 4 ||
      !Number.isInteger(input.count) ||
      input.rails.length === 0 ||
      !input.rails.every(Number.isFinite)
    )
      throw new Error(
        "complete original root clock/rail required: " + input.name,
      );
    const parentReader: IAutoMovieLoftViewFullSource.IReader = Full.create(input.parent);
    const childReader: IAutoMovieLoftViewFullSource.IReader = Full.create(input.child);
    const charts: [number, number][] = PortCurve.chart(
      input.loop,
      input.count,
    ).addresses;
    const parent: AutoMovieVector3Tuple[] = charts.map(
      ([s, t]: [number, number]): AutoMovieVector3Tuple => parentReader.point(s, t),
    );
    const childRail: (phase: number) => number =
      input.rails.length === 1
        ? (): number => input.rails[0]!
        : Natural.periodic([...input.rails]);
    const side: IAutoMovieConstructionSplitBand.ISide = {
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
    const child: AutoMovieVector3Tuple[] = phases.map(
      (phase: number): AutoMovieVector3Tuple => childReader.point(childRail(phase), phase),
    );
    const level: IAutoMovieHumanNativeRoot.ILevelOriginal = Level.original(input, parentReader, charts, parent);
    return { input, charts, parent, child, childPhases: phases, childRail, level };
  }

  /** One range-independent course followed by one actual native root-control resolution. */
  export function prepare(
    original: IAutoMovieHumanNativeRoot.ICalibration,
    parent: IAutoMovieViewPart,
    scale: readonly [number, number],
  ): IAutoMovieHumanNativeRoot.IPrepared {
    if (
      !scale.every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      )
    )
      throw new Error("root caliper factors must be positive finite");
    const reader: IAutoMovieLoftViewFullSource.IReader = Full.create(parent);
    const anchor: AutoMovieVector3Tuple = original.parent[0]!,
      at: [number, number] = original.charts[0]!;
    const delta: AutoMovieVector3Tuple = AutoMovieSolidVector.sub(
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
      cutterAxis: (axis: IAutoMovieViewAxis.IAxis): IAutoMovieViewAxis.IAxis =>
        mapper.axis(axis, delta),
      resolve: (candidate: IAutoMovieViewPart): IAutoMovieHumanNativeRoot.IRootSpec =>
        AutoMovieHumanNativeRootResolve({
          original,
          parent,
          scale,
          reader,
          candidate,
        }),
    };
  }

  /** Direct complete native source adapter used only by the existing original clock calculation. */
  function surface(name: string, reader: IAutoMovieLoftViewFullSource.IReader): IAutoMovieSolidSurface {
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
