import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { AutoMovieLoftFrame, AutoMovieViewOutline } from "@automovie/engine";
import { AutoMovieHumanConicSection as Section } from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftRelief,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Observe original definitions independently of section/mesh admission; no curve is recovered from a skin. */
export namespace FamilyConicOriginalCatalog {
  /**
   * Actual source owner, optionally paired with the invocation's fixed authored-F1 counterpart.
   *
   * @evidence contracts/development/design.md#principled-representation Actual source identity and existing family factories identify before-cutter definitions; fixed authored counterparts remain distinct from private-reference surfaces.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SourceCapture supplies the production family reader and declared role; optional raw family controls are borrowed from Human.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry type is duplicated; missing counterpart and failed factories remain runtime unavailable evidence.
   * @evidence contracts/development/common.md#meaningful-documentation Members name source identity, factory ownership, before-cutter scope and fixed comparison role.
   */
  export interface IEntry {
    /** Logical source identity, including its actual reflected name. */
    id: string;

    /** Before-cutter family scope is distinct from a construction's applied cutter. */
    role: "family-original" | "cutter-family-original";

    /** Actual existing family factory; one failure does not hide other originals. */
    read: () => IAutoMovieViewPart;

    /** Existing fixed F1 source factory for matched chart framing; absence stays unavailable. */
    reference?: () => IAutoMovieViewPart;

    /** Borrowed original control declaration, not a reverse fit to sampled geometry. */
    family?: IAutoMovieHumanConicLoft.IFamily;
  }

  /**
   * One original scalar in its own units and interpolation parameter.
   *
   * @evidence contracts/development/design.md#principled-representation An exact owner/path, declared mm/rad/share unit, original outline and qualified readings keep scalar parameters and normalized jets distinct.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The engine owns outline and reading types; original metadata and scalar charts consume them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed read retains its cause and original definition rather than a fabricated ordinate or surface value.
   * @evidence contracts/development/common.md#meaningful-documentation Members document units, normalized jets, original knots and failure cause.
   */
  export interface IScalar {
    /** Source path, such as family/front.positive or family/fullness.pieces[0][0].angle. */
    id: string;

    /** Owning actual source name. */
    owner: string;

    /** Scalar units; radians and shares are never interpreted as physical millimetres. */
    unit: "mm" | "rad" | "share";

    /** Exact interpolation knots/normalized jets/range/parameter, borrowed unchanged. */
    definition: IAutoMovieViewPart.IOutline;

    /** Existing Outline.at observations, with parameter/station derivative qualifications intact. */
    readings: IAutoMovieViewOutline.IReading[];

    /** First failing premise, or null when these scalar observations were available. */
    cause: string | null;
  }

  /**
   * Actual part definition retained only for this source observation lifetime.
   *
   * @evidence contracts/development/design.md#principled-representation One actual part definition and optional fixed authored counterpart retain their own runtime axes and stations in world mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both definitions use IAutoMovieViewPart; capture owns only identity, original role and comparison association.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The counterpart is neither a recovered private reference nor a generated-case camera fit.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish actual and fixed definitions and absent comparison.
   */
  export interface IPart {
    /** Logical source identity. */
    id: string;

    /** Explicit original or before-cutter scope. */
    role: IEntry["role"];

    /** Actual scalar definitions and runtime-only axis reader. */
    definition: IAutoMovieViewPart;

    /** Fixed authored counterpart, never a private-reference mesh or a generated-case fit. */
    reference: IAutoMovieViewPart | null;
  }

  /**
   * Original height and station-shift controls in their station-mm/phase-radian material chart.
   *
   * @evidence contracts/development/design.md#principled-representation The existing loft relief type preserves height and station-shift controls in station-mm/phase-radian material coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Metadata consumes the borrowed engine definition under the exact source/feature owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Control declarations are not relabeled as evaluated surface or world control points.
   * @evidence contracts/development/common.md#meaningful-documentation Members document ownership and material-chart control scope.
   */
  export interface INet {
    /** Full source and feature path. */
    id: string;

    /** Owning actual source. */
    owner: string;

    /** Exact control net; its controls are not interpolated surface points. */
    definition: IAutoMovieLoftRelief;
  }

  /**
   * Bounded source evidence; a missing definition remains named and unavailable.
   *
   * @evidence contracts/development/design.md#principled-representation Borrowed original parts/scalars/nets/family data, world-metre guide samples and named unavailable rows represent one observation lifetime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source, raw and realized consumers share this original catalog while the engine and Human own all geometric types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Native handles and registered reference curves remain unavailable; raw lofts and skin do not substitute for them.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish original definitions, sampling units, guide points and explicit failures.
   */
  export interface IResult {
    /** Actual source declarations, independent of successful loft/mesh admission. */
    parts: IPart[];

    /** Fixed authored definitions survive an unavailable actual factory independently. */
    counterparts: {
      id: string;
      role: IEntry["role"];
      definition: IAutoMovieViewPart;
    }[];

    /** Every named scalar, including a failed original with its raw controls. */
    scalars: IScalar[];

    /** Original feature control declarations, without fabricated control-site geometry. */
    nets: INet[];

    /** Existing family controls; native axis handles are not inferred from these. */
    families: {
      id: string;
      definition: Pick<
        IAutoMovieHumanConicLoft.IFamily,
        | "centres"
        | "halves"
        | "up"
        | "roll"
        | "layout"
        | "knots"
        | "values"
        | "tips"
        | "reliefs"
        | "pitch"
        | "phase"
        | "turn"
      >;
      units: string[];
      samplingUnits: { pitch: "mm"; phase: "rad"; turn: "rad" };
    }[];

    /** Actual axis/extreme-guide value lines in world metres, distinct from raw loft rings. */
    curves: N.Curve[];

    /** Missing factories/readings/metadata are not replaced by rings, zeros or another case. */
    unavailable: { id: string; cause: string }[];
  }

  /** Reuse the scalar owner's named knots and analytic extrema plus bounded display samples. */
  function stations(outline: IAutoMovieViewOutline.IOutline): number[] {
    const [a, b]: readonly [number, number] = outline.domain;
    return [
      ...new Set([
        ...outline.knots.map(
          (knot: IAutoMovieViewPart.IKnot): number => knot.station,
        ),
        ...AutoMovieViewOutline.criticalStations(outline),
        ...Array.from(
          { length: 17 },
          (_: unknown, i: number): number => a + ((b - a) * i) / 16,
        ),
      ]),
    ]
      .filter((s: number): boolean => Number.isFinite(s) && s >= a && s <= b)
      .sort((a: number, b: number): number => a - b);
  }

  /** Keep unavailable readers named; a missing point never joins two surviving fragments. */
  function line(
    result: IResult,
    id: string,
    at: readonly number[],
    read: (s: number) => readonly number[],
    colour: string,
    xray: boolean = false,
  ): void {
    let points: N.Point[] = [];
    let fragment: number = 0;
    const flush: () => void = (): void => {
      if (points.length >= 2)
        result.curves.push({
          id: fragment === 0 ? id : id + "/fragment/" + fragment,
          points,
          closed: false,
          colour,
          xray,
        });
      points = [];
      fragment++;
    };
    for (const s of at) {
      try {
        const value: readonly number[] = read(s);
        if (value.length !== 3 || !value.every(Number.isFinite))
          throw new Error("actual source point is nonfinite");
        points.push([value[0]! / 1000, value[1]! / 1000, value[2]! / 1000]);
      } catch (error: unknown) {
        result.unavailable.push({
          id: id + "@" + s,
          cause: error instanceof Error ? error.message : String(error),
        });
        flush();
      }
    }
    flush();
  }

  /**
   * Observe each original scalar and its own axis before any loft/mesh admission.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing Outline.create/at/criticalStations preserve original scalar parameters and qualified jets; axis.at and Frame.place supply actual world guides including transverse touch. Original controls remain borrowed rather than inferred from a ring.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Actual factories precede exhaustive scalar/control enumeration, then value-only axis/guides; failures remain at their own source path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No scalar solver, source2 fallback, numerical derivative, recovered reference, ring-mean axis, raw-loft reconstruction or final skin enters this observer.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source knots/normalized jets, mm/rad/share scalar values, world-metre display lines, raw family controls and unavailable native-axis/control/reference correspondence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Every factory is read once; per-scalar work uses its actual knots/extrema and17 display samples, with bounded value-only guide observations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each scalar is prepared once and shared by readings and all dependent guides; original and raw-loft/skin stages remain separate consumers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed definitions and observed points live in one returned case catalog; no cache, process, reference asset or realized mesh is retained.
   */
  export function create(entries: readonly IEntry[]): IResult {
    const result: IResult = {
      parts: [],
      counterparts: [],
      scalars: [],
      nets: [],
      families: [],
      curves: [],
      unavailable: [],
    };
    for (const entry of entries) {
      if (entry.family !== undefined) {
        const f: IAutoMovieHumanConicLoft.IFamily = entry.family;
        result.families.push({
          id: entry.id,
          definition: {
            centres: f.centres,
            halves: f.halves,
            up: f.up,
            roll: f.roll,
            layout: f.layout,
            knots: f.knots,
            values: f.values,
            tips: f.tips,
            reliefs: f.reliefs,
            pitch: f.pitch,
            phase: f.phase,
            turn: f.turn,
          },
          samplingUnits: { pitch: "mm", phase: "rad", turn: "rad" },
          units: Section.units(f.layout).map(
            (unit: ReturnType<typeof Section.units>[number]): string =>
              unit === "angle" ? "rad" : unit,
          ),
        });
      }
      let reference: IAutoMovieViewPart | null = null;
      if (entry.reference !== undefined) {
        try {
          reference = entry.reference();
          if (reference.name !== entry.id)
            throw new Error(
              "Fixed counterpart name differs: " + reference.name,
            );
          result.counterparts.push({
            id: entry.id,
            role: entry.role,
            definition: reference,
          });
        } catch (error: unknown) {
          reference = null;
          result.unavailable.push({
            id: entry.id + "/authored-reference",
            cause: error instanceof Error ? error.message : String(error),
          });
        }
      }
      let part: IAutoMovieViewPart;
      try {
        part = entry.read();
      } catch (error: unknown) {
        result.unavailable.push({
          id: entry.id,
          cause: error instanceof Error ? error.message : String(error),
        });
        continue;
      }
      if (part.name !== entry.id) {
        result.unavailable.push({
          id: entry.id,
          cause: "Actual source name differs: " + part.name,
        });
        continue;
      }
      result.parts.push({
        id: entry.id,
        role: entry.role,
        definition: part,
        reference,
      });
      for (const relief of part.reliefs ?? [])
        result.nets.push({
          id: entry.id + "/relief/" + relief.name,
          owner: entry.id,
          definition: relief,
        });

      const first: number = part.stations[0] ?? NaN;
      const last: number = part.stations.at(-1) ?? NaN;
      const ends: IAutoMovieViewOutline.IEnds = {
        ...(part.pole === "bottom" || part.pole === "both"
          ? { bottom: first }
          : {}),
        ...(part.pole === "top" || part.pole === "both" ? { top: last } : {}),
      };
      const prepared: Map<string, IAutoMovieViewOutline.IOutline> = new Map();
      const scalar: (
        path: string,
        unit: IScalar["unit"],
        definition: IAutoMovieViewPart.IOutline,
        radial: boolean,
      ) => void = (
        path: string,
        unit: IScalar["unit"],
        definition: IAutoMovieViewPart.IOutline,
        radial: boolean,
      ): void => {
        const row: IScalar = {
          id: entry.id + "/" + path,
          owner: entry.id,
          unit,
          definition,
          readings: [],
          cause: null,
        };
        result.scalars.push(row);
        try {
          const source:
            | IAutoMovieViewOutline.IOutline
            | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
            definition,
            radial ? ends : {},
          );
          if ("contract" in source) throw new Error(source.detail);
          prepared.set(path, source);
          for (const s of stations(source)) {
            const value: IAutoMovieViewOutline.IReading | string =
              AutoMovieViewOutline.at(source, s);
            if (typeof value === "string") {
              row.cause ??= value;
              result.unavailable.push({ id: row.id + "@" + s, cause: value });
            } else row.readings.push(value);
          }
        } catch (error: unknown) {
          row.cause = error instanceof Error ? error.message : String(error);
          result.unavailable.push({ id: row.id, cause: row.cause });
        }
      };
      scalar("front.positive", "mm", part.front.positive, true);
      scalar("front.negative", "mm", part.front.negative, true);
      scalar("side.positive", "mm", part.side.positive, true);
      scalar("side.negative", "mm", part.side.negative, true);
      if (part.fullness.kind === "top") {
        const top: IAutoMovieViewPart.ITop = part.fullness;
        top.shoulders.forEach(
          (value: IAutoMovieViewPart.IOutline, q: number): void =>
            scalar("fullness.shoulders[" + q + "]", "share", value, false),
        );
        top.touch?.forEach(
          (value: IAutoMovieViewPart.IOutline, q: number): void =>
            scalar("fullness.touch[" + q + "]", "mm", value, true),
        );
        const split: (
          path: string,
          value: IAutoMovieViewPart.ISplit,
        ) => void = (path: string, value: IAutoMovieViewPart.ISplit): void => {
          scalar(path + ".u", "mm", value.u, true);
          scalar(path + ".v", "mm", value.v, true);
          scalar(path + ".angle", "rad", value.angle, false);
          scalar(path + ".shoulder", "share", value.shoulder, false);
        };
        top.splits?.forEach(
          (value: IAutoMovieViewPart.ISplit, q: number): void =>
            split("fullness.splits[" + q + "]", value),
        );
        top.pieces?.forEach(
          (values: IAutoMovieViewPart.ISplit[], q: number): void =>
            values.forEach(
              (value: IAutoMovieViewPart.ISplit, j: number): void =>
                split("fullness.pieces[" + q + "][" + j + "]", value),
            ),
        );
      } else {
        if (part.fullness.kind === "girth")
          scalar("fullness.girth", "mm", part.fullness.girth, true);
        else
          scalar("fullness.shoulder", "share", part.fullness.shoulder, false);
        part.fullness.departures?.forEach(
          (value: IAutoMovieViewPart.IOutline, q: number): void =>
            scalar("fullness.departures[" + q + "]", "share", value, false),
        );
      }

      // Guide locations come from the actual signed extrema/touch sources, not uniform polar clocks.
      if (!(Number.isFinite(first) && Number.isFinite(last) && first < last)) {
        result.unavailable.push({
          id: entry.id + "/axis",
          cause: "Actual declared source interval is not finite/increasing",
        });
        continue;
      }
      const at: number[] = [
        ...new Set([
          ...part.stations,
          ...[...prepared.values()].flatMap(stations),
        ]),
      ]
        .filter((s: number): boolean => s >= first && s <= last)
        .sort((a: number, b: number): number => a - b);
      line(
        result,
        entry.id + "/axis",
        at,
        (s: number): readonly number[] => part.axis.at(s).origin,
        "d08000",
        true,
      );
      const value: (path: string, s: number) => number = (
        path: string,
        s: number,
      ): number => {
        const source: IAutoMovieViewOutline.IOutline | undefined =
          prepared.get(path);
        if (source === undefined)
          throw new Error("Original scalar unavailable: " + path);
        const result: number | string = AutoMovieViewOutline.value(source, s);
        if (typeof result === "string") throw new Error(result);
        return result;
      };
      const paths: readonly string[] = [
        "front.positive",
        "side.positive",
        "front.negative",
        "side.negative",
      ];
      for (let q: number = 0; q < 4; q++) {
        const own: string = paths[q]!;
        line(
          result,
          entry.id + "/guide/" + own,
          at,
          (s: number): readonly number[] => {
            const extent: number = value(own, s);
            const touch: number =
              part.fullness.kind === "top" && part.fullness.touch !== undefined
                ? value("fullness.touch[" + q + "]", s)
                : 0;
            return AutoMovieLoftFrame.place(
              part.axis.at(s),
              q % 2 === 0 ? extent : touch,
              q % 2 === 0 ? touch : extent,
            );
          },
          "2656a0",
        );
      }
      if (part.fullness.kind === "top") {
        const point: (path: string) => void = (path: string): void =>
          line(
            result,
            entry.id + "/guide/" + path,
            at,
            (s: number): readonly number[] =>
              AutoMovieLoftFrame.place(
                part.axis.at(s),
                value(path + ".u", s),
                value(path + ".v", s),
              ),
            "6d3c9e",
          );
        part.fullness.splits?.forEach(
          (_: IAutoMovieViewPart.ISplit, q: number): void =>
            point("fullness.splits[" + q + "]"),
        );
        part.fullness.pieces?.forEach(
          (items: IAutoMovieViewPart.ISplit[], q: number): void =>
            items.forEach((_: IAutoMovieViewPart.ISplit, j: number): void =>
              point("fullness.pieces[" + q + "][" + j + "]"),
            ),
        );
      }
      result.unavailable.push({
        id: entry.id + "/axis/controls",
        cause:
          "IAxis publishes actual at/jet readers, not original analytic handles; raw family course controls are separate metadata",
      });
      result.unavailable.push({
        id: entry.id + "/registered-reference",
        cause:
          "No corresponding registered reference curve/cut/region was supplied; a raw loft or skin distance is not its substitute",
      });
    }
    return result;
  }
}
