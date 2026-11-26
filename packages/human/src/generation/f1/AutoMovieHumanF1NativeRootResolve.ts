import {
  AutoMoviePeriodicCubic,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieConstructionPortCurve as PortCurve,
  AutoMovieSolidVector as Vector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSplitBand,
  IAutoMovieHumanF1NativeRoot,
  IAutoMovieLoftViewFullSource,
  IAutoMoviePeriodicCubic,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanF1NativeRootClock as Clock } from "./AutoMovieHumanF1NativeRootClock";
import { AutoMovieHumanF1NativeRootControl as Control } from "./AutoMovieHumanF1NativeRootControl";
import { AutoMovieHumanF1NativeRootLevel as Level } from "./AutoMovieHumanF1NativeRootLevel";

/**
 * Issue an actual parent-source level loop, the existing native child rail and
 * their actual operator correspondence. Off-surface affine targets survive only
 * as observations of the discarded hypothesis, never as constraints.
 */
export function AutoMovieHumanF1NativeRootResolve(
  input: IInput,
): IAutoMovieHumanF1NativeRoot.IRootSpec {
  const { original, parent, scale, reader, candidate }: IInput = input;
  const child: IAutoMovieLoftViewFullSource.IReader = Full.create(candidate);
  const cut: IAutoMovieHumanF1NativeRoot.ILevelResult = Level.create({
    original,
    prepared: original.level,
    parent,
    reader,
    candidate,
    scale,
  });
  const rails: number[] = [...original.input.rails];
  const periodic: IAutoMoviePeriodicCubic.IPrepared | undefined =
    rails.length === 1 ? undefined : AutoMoviePeriodicCubic.create(rails);
  const range: readonly [number, number] =
    periodic === undefined ? [rails[0]!, rails[0]!] : periodic.range();
  if (range[0] < child.domain[0] || range[1] > child.domain[1])
    throw new Error(
      original.input.name +
        ": original material rail enclosure leaves the actual candidate source domain",
    );
  const railAt: (phase: number) => number =
    periodic === undefined ? (): number => rails[0]! : periodic.at;
  const chart: [number, number][] = PortCurve.chart(
    cut.loop,
    original.input.count,
  ).addresses;
  const points: V[] = chart.map(
    ([s, t]: [number, number]): V =>
      point(reader, parent.name, "published-parent-chart", s, t),
  );
  const surface: IAutoMovieSolidSurface = {
    name: candidate.name,
    period: turn,
    orientation: 1,
    domain: [...child.domain],
    point: (s: number, t: number): V =>
      point(child, candidate.name, "operator-child-ring", s, t),
    jet: (s: number, t: number): IAutoMovieSolidSurface.IJet =>
      jet(child, candidate.name, "operator-child-ring-physical2", s, t),
  };
  const side: IAutoMovieConstructionSplitBand.ISide = {
    surface,
    station: rails[0]!,
    into: 1,
    along: railAt,
  };
  const phases: number[] | string = PortCurve.correspondence(
    side,
    points,
    original.input.correspondence,
  );
  if (typeof phases === "string")
    throw new Error(original.input.name + ": actual source clock: " + phases);

  // A local source-control identity borrows the original clock exactly. It
  // makes no person-level selection and never suppresses changed controls.
  const originalPoints: boolean = points.every((p: V, k: number): boolean =>
    p.every((v: number, j: number): boolean =>
      Object.is(v, original.parent[k]![j]),
    ),
  );
  const childPoints: V[] = phases.map(
    (phase: number): V =>
      point(child, candidate.name, "issued-child-rail", railAt(phase), phase),
  );
  const unchanged: boolean =
    scale[0] === 1 &&
    scale[1] === 1 &&
    originalPoints &&
    phases.every(
      (phase: number, k: number): boolean =>
        Object.is(phase, original.childPhases[k]) &&
        childPoints[k]!.every((v: number, j: number): boolean =>
          Object.is(v, original.child[k]![j]),
        ),
    );
  const wall: V[] = original.charts.map(
    ([s, t]: [number, number]): V =>
      point(reader, parent.name, "discarded-target-original-address", s, t),
  );
  const diagnostic: IAutoMovieHumanF1NativeRoot.ICurves = Control.targets({
    parent: original.parent,
    child: original.child,
    wall,
    basis: original.input.basis,
    scale,
  });
  const clockParent: ReturnType<typeof Clock.vectorJet> = Clock.vectorJet(
    diagnostic.parent,
  );
  const clockChild: ReturnType<typeof Clock.vectorJet> = Clock.vectorJet(
    diagnostic.child,
  );
  const rows: IAutoMovieHumanF1NativeRoot.IRootRow[] = phases.map(
    (phase: number, k: number): IAutoMovieHumanF1NativeRoot.IRootRow => {
      const address: [number, number] = chart[k]!;
      const station: number = railAt(phase);

      // Both real physical2 capabilities are premises of publishing this root.
      // In particular a value-only candidate cannot invent transverse data.
      jet(
        reader,
        parent.name,
        "published-parent-physical2",
        address[0],
        address[1],
      );
      jet(child, candidate.name, "issued-child-physical2", station, phase);
      const eC: V = Vector.sub(points[k]!, diagnostic.parent[k]!);
      const eQ: V = Vector.sub(childPoints[k]!, diagnostic.child[k]!);
      return {
        level: cut.columns[k]!,
        clock: (turn * k) / original.input.count,
        sourceClock: (turn * k) / original.input.count,
        parentAddress: address,
        targetChildAddress: [station, phase],
        targetParent: diagnostic.parent[k]!,
        targetChild: diagnostic.child[k]!,
        actualParent: points[k]!,
        actualChild: childPoints[k]!,
        eC,
        eQ,
        pairedGap: Vector.sub(eQ, eC),
      };
    },
  );

  /**
   * Candidate/final source equality is separate from the discarded-target
   * residual.
   */
  const inspect: IAutoMovieHumanF1NativeRoot.IRootSpec["inspect"] = (
    part: IAutoMovieViewPart,
  ): IAutoMovieHumanF1NativeRoot.IInspection[] => {
    const final: IAutoMovieLoftViewFullSource.IReader = Full.create(part);
    return rows.map(
      (
        row: IAutoMovieHumanF1NativeRoot.IRootRow,
      ): IAutoMovieHumanF1NativeRoot.IInspection => {
        const [s, phase]: [number, number] = row.targetChildAddress;
        try {
          const parent2: IAutoMovieSolidSurface.IJet = jet(
            reader,
            parent.name,
            "inspect-parent-physical2",
            ...row.parentAddress,
          );
          const candidate2: IAutoMovieSolidSurface.IJet = jet(
            child,
            candidate.name,
            "inspect-candidate-physical2",
            s,
            phase,
          );
          const actual2: IAutoMovieSolidSurface.IJet = jet(
            final,
            part.name,
            "inspect-final-physical2",
            s,
            phase,
          );
          const eQ: V = Vector.sub(actual2.p, row.targetChild);
          const signed: IAutoMovieSolidSurface.IJet = {
            p: Vector.sub(actual2.p, candidate2.p),
            u: Vector.sub(actual2.u, candidate2.u),
            v: Vector.sub(actual2.v, candidate2.v),
            uu: Vector.sub(actual2.uu, candidate2.uu),
            uv: Vector.sub(actual2.uv, candidate2.uv),
            vv: Vector.sub(actual2.vv, candidate2.vv),
          };
          return {
            ...row,
            kind: "available",
            targetClock2: {
              parent: clockParent(row.sourceClock),
              child: clockChild(row.sourceClock),
            },
            railReclockStationResidualMm: s - row.targetChildAddress[0],
            normalAndTangent: {
              parent: components(row.eC, parent2),
              candidate: components(row.eQ, candidate2),
              final: components(eQ, actual2),
            },
            physicalParent2: parent2,
            physicalCandidate2: candidate2,
            physicalFinal2: actual2,
            protectedSourceSigned: signed,
            candidateResidual: {
              eC: row.eC,
              eQ: row.eQ,
              pairedGap: row.pairedGap,
            },
            finalResidual: {
              eC: row.eC,
              eQ,
              pairedGap: Vector.sub(eQ, row.eC),
            },
            units:
              "actual physical2: station-mm/phase-radians; affine-target clock2 and eC/eQ/g are discarded-hypothesis diagnostics, not the new source-membership residual",
          };
        } catch (error: unknown) {
          return { ...row, kind: "unavailable", unavailable: message(error) };
        }
      },
    );
  };

  /**
   * Retain an original search line only under unchanged root and material
   * bindings.
   */
  const seed: IAutoMovieHumanF1NativeRoot.IRootSpec["seed"] = (
    beforePart: IAutoMovieViewPart,
    afterPart: IAutoMovieViewPart,
    old: IAutoMovieHumanF1NativeRoot.ISeed,
  ): IAutoMovieHumanF1NativeRoot.ISeedTransport => {
    if (
      !(
        Number.isFinite(old.phase) &&
        old.from >= 0 &&
        old.to <= 1 &&
        old.to > old.from
      )
    )
      throw new Error("original seed window/phase must be finite and ordered");
    const before: IAutoMovieLoftViewFullSource.IReader =
      Full.create(beforePart);
    const after: IAutoMovieLoftViewFullSource.IReader = Full.create(afterPart);
    const controls: IAutoMovieHumanF1NativeRoot.ISeedTransport["controls"] = [
      old.from,
      (old.from + old.to) / 2,
      old.to,
    ].map(
      (
        share: number,
      ): IAutoMovieHumanF1NativeRoot.ISeedTransport["controls"][number] => {
        const s: number =
          before.domain[0] + share * (before.domain[1] - before.domain[0]);
        const p: V = point(
          before,
          beforePart.name,
          "original-search-material",
          s,
          old.phase,
        );
        const q: V = point(
          after,
          afterPart.name,
          "current-search-material",
          s,
          old.phase,
        );
        return {
          original: [s, old.phase],
          actual: [s, old.phase],
          target: p,
          point: q,
          residual: Vector.sub(q, p),
          sourceClock: 0,
        };
      },
    );
    const literal: boolean =
      unchanged &&
      before.domain[0] === after.domain[0] &&
      before.domain[1] === after.domain[1] &&
      controls.every(
        (
          c: IAutoMovieHumanF1NativeRoot.ISeedTransport["controls"][number],
        ): boolean =>
          c.point.every((v: number, j: number): boolean =>
            Object.is(v, c.target[j]),
          ),
      );
    const lo: number = controls[0]!.actual[0];
    const hi: number = controls[2]!.actual[0];
    if (!(lo >= after.domain[0] && hi <= after.domain[1] && hi > lo))
      throw new Error(
        "original physical seed controls leave their current cutter source domain",
      );
    const span: number = after.domain[1] - after.domain[0];
    return {
      seed: literal
        ? { ...old }
        : {
            phase: old.phase,
            from: (lo - after.domain[0]) / span,
            to: (hi - after.domain[0]) / span,
          },
      unchanged: literal,
      controls,
      qualification:
        "original physical material search controls; changed production roots use their separately named actual band-chart point prior, never this as a failed-search fallback",
    };
  };
  return {
    loop: cut.loop,
    railStations: rails,
    railDistances: rails.map((s: number): number => s - child.domain[0]),
    range,
    rows,
    unchanged,
    inspect,
    seed,
    qualification:
      "qualified actual parent-source elliptic-level P, original child material rail and actual operator angle/length clock; finite-column branch checks, no all-domain uniqueness or clinical claim; old affine eC/eQ/g remain discarded-hypothesis diagnostics",
  };
}

/** Complete current sources from one invocation, before lofting or any band. */
interface IInput {
  /** Borrowed original control, source and actual-clock calibration. */
  original: IAutoMovieHumanF1NativeRoot.ICalibration;
  /** Current complete parent source and its already prepared reader. */
  parent: IAutoMovieViewPart;
  /** Independent caliper ratios in the original directional basis. */
  scale: readonly [number, number];
  /** Complete current parent, including its source-owned reliefs and shifts. */
  reader: IAutoMovieLoftViewFullSource.IReader;
  /** Independently generated complete child root definition. */
  candidate: IAutoMovieViewPart;
}

type V = AutoMovieVector3Tuple;
const turn: number = 2 * Math.PI;

/** Actual normal/tangent projection, preserving singular physical-source data. */
function components(
  error: V,
  jet: IAutoMovieSolidSurface.IJet,
): IAutoMovieHumanF1NativeRoot.IProjection {
  const n: V = Vector.cross(jet.u, jet.v);
  const length: number = Math.hypot(...n);
  if (!(Number.isFinite(length) && length > 0))
    return { unavailable: "actual physical source normal is singular" };
  const normal: number = Vector.dot(error, n) / length;
  return {
    normal,
    tangent: error.map(
      (v: number, k: number): number => v - (normal * n[k]!) / length,
    ) as V,
  };
}

/** Keep the original admission reason without inventing a numeric substitute. */
function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Add callsite coordinates to the original Point0 refusal, with one reader
 * call.
 */
function point(
  reader: IAutoMovieLoftViewFullSource.IReader,
  source: string,
  stage: string,
  s: number,
  t: number,
): V {
  try {
    return reader.point(s, t);
  } catch (error: unknown) {
    throw refusal(error, source, stage, reader.domain, s, t);
  }
}

/** Add physical2 callsite context without evaluating Point0 or another jet. */
function jet(
  reader: IAutoMovieLoftViewFullSource.IReader,
  source: string,
  stage: string,
  s: number,
  t: number,
): IAutoMovieSolidSurface.IJet {
  try {
    return reader.jet(s, t);
  } catch (error: unknown) {
    throw refusal(error, source, stage, reader.domain, s, t);
  }
}

/** Keep nonfinite coordinates explicit rather than losing them to JSON null. */
function refusal(
  error: unknown,
  source: string,
  stage: string,
  domain: readonly [number, number],
  s: number,
  t: number,
): Error {
  return new Error(
    message(error) +
      "; diagnostic=" +
      JSON.stringify(
        {
          source,
          stage,
          address: [s, t],
          domain,
          value: "unavailable:original reader refused this query",
        },
        (_key: string, value: unknown): unknown =>
          typeof value === "number" && !Number.isFinite(value)
            ? "nonfinite:" + String(value)
            : value,
      ),
  );
}
