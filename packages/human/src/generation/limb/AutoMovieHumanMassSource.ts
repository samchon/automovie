import {
  AutoMovieConstructionViews,
  AutoMovieIllinois,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieSolidVector,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";

import type { AutoMovieHumanGlutealParent } from "../trunk/AutoMovieHumanGlutealParent";
import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";
import type { AutoMovieHumanSiteViewPart as Site } from "./AutoMovieHumanSiteViewPart";

/** World calibration-mm point. */
type Vec3 = [number, number, number];

/** Preserve an actual supported mass source, or prepend only an inward extension while retaining all its old scalar functions and both jets. */
export namespace AutoMovieHumanMassSource {
  /** Actual root-curve point and the same parent chord that supports it. */
  export interface IContact {
    /** World point in calibration mm. */
    point: Vec3;
    /** Whole-parent boundary owners, physical stations and phases. */
    chord: AutoMovieHumanGlutealParent.IChord;
  }
  /** Actual parent-derived placement, not a central curvature estimate. */
  export interface IConnection {
    /** Identical whole-parent fields consumed by the actual parent lofts. */
    parent: AutoMovieHumanGlutealParent.IParent;
    /** Original wall at the unchanged public apex Y/Z, mm. */
    wall: Vec3;
    /** Anatomical AP outward unit axis. */
    normal: Vec3;
    /** Public apex's positive distance from the actual wall, mm. */
    amplitude: number;
    /** Shared-parent-supported internal root origin, mm. */
    root: Vec3;
    /** Root-to-wall distance along the outward axis, mm. */
    embed: number;
    /** Parent-derived common AP interval for the same footprint, after bounded numerical phase refinement; not an interval certificate. */
    rootInterval?: readonly [number, number];
    /** Exact source before any internal extension, retained for source ownership and comparison. */
    original?: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView };
    /** Whether the original supported root was kept or only a new inward prefix was authored. */
    transfer?: "original-root" | "inner-prefix";
    /** Same whole-parent reader that determined the root, with its explicit absence. */
    contact(phi: number): IContact | string;
  }

  /** Actual original-parent exit on the declared lower source guide; the final kept atlas still validates this owner. */
  export interface ISeed {
    /** Boundary source name consumed by the join's hostFace. */
    owner: string;
    /** Actual mass chart [physical station mm, phase radians]. */
    part: [number, number];
    /** Actual original-parent chart [physical station mm, phase radians]. */
    host: [number, number];
    /** Original world point, calibration mm. */
    point: Vec3;
  }

  /**
   * Locate the lower guide's actual exit from the same composite parent.
   * @evidence contracts/common.md#principled-implementation Reads the actual signed guide and axis, then the consumed whole-parent chord at each point; the exiting boundary supplies the host face.
   * @evidence contracts/common.md#clear-and-simple-design Returns one source-owned seed datum or a named unsupported premise, before final solid construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not assume the central wall or root-contact owner is the crossing owner, substitute a support maximum, or fabricate a kept face.
   * @evidence contracts/common.md#meaningful-documentation Bounded discovery checks one declared lower guide and cannot certify all phases, global loop count or the final trimmed atlas.
   * @evidence contracts/performance.md#efficient-algorithms Named/critical partitions have eight discovery subdivisions each and one bounded existing Illinois solve; no raw loft is built.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the mass original and its retained parent reader; final construction consumes the resulting owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The result holds one point/name/station and the synchronous discovery retains no cache or surface.
   */
  export function seed(
    part: IAutoMovieViewPart,
    connection: IConnection,
  ): ISeed | string {
    const first: number = part.stations[0]!;
    const last: number = part.stations.at(-1)!;
    const outline:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      part.front.negative,
      { top: last },
    );
    if ("detail" in outline) return outline.detail;
    const at: (station: number) =>
      | {
          residual: number;
          point: Vec3;
          boundary: AutoMovieHumanGlutealParent.IBoundary;
        }
      | string = (
      station: number,
    ):
      | {
          residual: number;
          point: Vec3;
          boundary: AutoMovieHumanGlutealParent.IBoundary;
        }
      | string => {
      const edge: number | string = AutoMovieViewOutline.value(
        outline,
        station,
      );
      if (typeof edge === "string") return edge;
      const frame: ReturnType<typeof part.axis.at> = part.axis.at(station);
      const point: Vec3 = AutoMovieSolidVector.add(
        frame.origin,
        AutoMovieSolidVector.scale(frame.u, edge),
      );
      const chords: AutoMovieHumanGlutealParent.IChord[] | string =
        connection.parent.chord(point[1], point[2]);
      if (typeof chords === "string") return chords;
      if (chords.length !== 1)
        return "The lower source guide has no unique admitted parent chord";
      const boundary: AutoMovieHumanGlutealParent.IBoundary =
        connection.normal[0] > 0 ? chords[0]!.front : chords[0]!.back;
      return {
        residual: connection.normal[0] * (point[0] - boundary.x),
        point,
        boundary,
      };
    };
    const anchors: number[] = [
      ...new Set([
        first,
        last,
        ...outline.knots.map(
          (k: IAutoMovieViewPart.IKnot): number => k.station,
        ),
        ...AutoMovieViewOutline.criticalStations(outline),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const stations: number[] = anchors.flatMap(
      (station: number, index: number): number[] =>
        index + 1 === anchors.length
          ? [station]
          : Array.from(
              { length: 8 },
              (_: unknown, k: number): number =>
                station + ((anchors[index + 1]! - station) * k) / 8,
            ),
    );
    let prior: { station: number; value: number } | undefined;
    let bracket: [number, number] | undefined;
    for (const station of stations) {
      const value: ReturnType<typeof at> = at(station);
      if (typeof value === "string") return value;
      if (!Number.isFinite(value.residual))
        return "The lower source guide has a non-finite parent residual";
      if (prior === undefined && !(value.residual < 0))
        return "The lower source guide does not start inside its actual parent";
      if (prior !== undefined && prior.value <= 0 && value.residual > 0) {
        if (bracket !== undefined)
          return "The lower source guide has multiple sampled exits from its parent";
        bracket = [prior.station, station];
      }
      if (prior !== undefined && prior.value > 0 && value.residual < 0)
        return "The lower source guide re-enters its parent";
      prior = { station, value: value.residual };
    }
    if (bracket === undefined)
      return "The lower source guide has no sampled parent exit bracket";
    let failure: string | undefined;
    const station: number | null = AutoMovieIllinois.root(
      (station: number): number => {
        const value: ReturnType<typeof at> = at(station);
        if (typeof value === "string") {
          failure = value;
          return NaN;
        }
        return value.residual;
      },
      bracket[0],
      bracket[1],
      1e-9,
      100,
    );
    if (failure !== undefined) return failure;
    if (station === null)
      return "The lower source parent exit did not converge";
    const value: ReturnType<typeof at> = at(station);
    return typeof value === "string"
      ? value
      : Math.abs(value.residual) > 1e-9
        ? "The lower source parent exit has an unsupported residual"
        : {
            owner: value.boundary.owner,
            point: value.point,
            part: [station, Math.PI],
            host: [value.boundary.station, value.boundary.phase],
          };
  }

  /**
   * Keep an original root supported by the same actual parent. Otherwise
   * translate every old knot, including the old start, and prepend only an
   * inward extension. No old inner span is stretched. Values, whole old
   * polynomials, both jets and world placement survive that translation.
   * The added prefix and numerical root support do not certify a final join.
   */
  export function rebase(
    definition: Site.IDefinition,
    connection: IConnection,
  ): Site.IDefinition {
    if (definition.part === null || definition.view === null) return definition;
    const original: IAutoMovieViewPart = definition.part;
    const record: IAutoMovieConstructionView = definition.view;
    if (record.axis.type !== "straight" || original.pole !== "top")
      throw new Error(
        "A mass connection requires its actual straight top-pole source",
      );
    const wall: number | undefined = original.front.positive.knots.find(
      (k: IAutoMovieViewPart.IKnot): boolean => k.site === "footprint",
    )?.station;
    if (
      wall === undefined ||
      !(wall > 0) ||
      !(connection.embed > 0) ||
      original.stations[0] !== 0
    )
      throw new Error(
        "A mass connection requires a positive source-owned embedding from station zero",
      );
    if (
      ![
        ...connection.wall,
        ...connection.root,
        ...connection.normal,
        connection.embed,
        connection.amplitude,
      ].every(Number.isFinite)
    )
      throw new Error("A mass connection needs finite source placement");
    const n: Vec3 = AutoMovieSolidVector.cross(
      [record.axis.v.x, record.axis.v.y, record.axis.v.z],
      [record.axis.u.x, record.axis.u.y, record.axis.u.z],
    );
    const oldOrigin: Vec3 = AutoMovieConstructionViews.point(
      record.axis.origin,
    );
    const scale: number = Math.max(
      1,
      ...connection.wall.map(Math.abs),
      ...connection.root.map(Math.abs),
    );
    const error: number = 64 * Number.EPSILON * scale;
    for (let c: number = 0; c < 3; c++)
      if (
        Math.abs(n[c]! - connection.normal[c]!) > 64 * Number.EPSILON ||
        Math.abs(
          connection.root[c]! + connection.embed * n[c]! - connection.wall[c]!,
        ) > error ||
        Math.abs(oldOrigin[c]! + wall * n[c]! - connection.wall[c]!) > error
      )
        throw new Error(
          "Mass root, wall, embedding and original axis do not share one frame and unit",
        );
    const delta: number = connection.embed - wall;
    const oldTop: number = original.stations.at(-1)!;
    if (Math.abs(oldTop - wall - connection.amplitude) > error)
      throw new Error(
        "A mass connection changed the original wall-to-apex clock",
      );
    const prepared: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(original);
    if (prepared === null || prepared.source === null)
      throw new Error("The original mass root field is unavailable");
    const values: AutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(prepared.source, 0);
    if (typeof values === "string") throw new Error(values);
    const rootShape: ReturnType<typeof AutoMovieLoftSectionNative.point> =
      AutoMovieLoftSectionNative.point(values);
    const rootFrame: ReturnType<typeof original.axis.at> = original.axis.at(0);
    const originalContact: (phi: number) => IContact | string = (
      phi: number,
    ): IContact | string => {
      if (!Number.isFinite(phi)) return "Mass contact needs a finite phase";
      const local: [number, number] = rootShape(phi);
      const point: Vec3 = AutoMovieSolidVector.add(
        rootFrame.origin,
        AutoMovieSolidVector.add(
          AutoMovieSolidVector.scale(rootFrame.u, local[0]),
          AutoMovieSolidVector.scale(rootFrame.v, local[1]),
        ),
      );
      const chords: AutoMovieHumanGlutealParent.IChord[] | string =
        connection.parent.chord(point[1], point[2]);
      if (typeof chords === "string") return chords;
      const chord: AutoMovieHumanGlutealParent.IChord | undefined = chords.find(
        (candidate: AutoMovieHumanGlutealParent.IChord): boolean =>
          point[0] > candidate.back.x && point[0] < candidate.front.x,
      );
      return chord === undefined
        ? "Original mass root leaves the actual parent"
        : { point, chord };
    };
    if (
      connection.rootInterval !== undefined &&
      (!connection.rootInterval.every(Number.isFinite) ||
        !(connection.rootInterval[1] > connection.rootInterval[0]))
    )
      throw new Error(
        "Mass root support needs its actual finite increasing parent interval",
      );
    if (
      connection.rootInterval !== undefined &&
      oldOrigin[0] > connection.rootInterval[0] &&
      oldOrigin[0] < connection.rootInterval[1]
    ) {
      for (let k: number = 0; k < 64; k++) {
        const contact: IContact | string = originalContact(
          (2 * Math.PI * k) / 64,
        );
        if (typeof contact === "string") throw new Error(contact);
      }
      return {
        ...definition,
        massConnection: {
          ...connection,
          root: oldOrigin,
          embed: wall,
          transfer: "original-root",
          original: { part: original, view: record },
          contact: originalContact,
        },
      };
    }
    if (delta < 0)
      throw new Error(
        "A shallower unsupported mass root requires an explicit source-domain transfer; no inner rescaling is defined",
      );
    const newTop: number = oldTop + delta;
    const station: (s: number) => number = (s: number): number => s + delta;
    const convert: (
      outline: IAutoMovieViewPart.IOutline,
      radial: boolean,
    ) => IAutoMovieViewPart.IOutline = (
      outline: IAutoMovieViewPart.IOutline,
      radial: boolean,
    ): IAutoMovieViewPart.IOutline => {
      const source:
        | AutoMovieViewOutline.IOutline
        | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
        outline,
        radial ? { top: oldTop } : {},
      );
      if ("detail" in source) throw new Error(source.detail);
      const parameter: IAutoMovieViewPart.IOutline["parameter"] = radial
        ? { type: "root", end: "top", pole: newTop }
        : source.parameter;
      if (!radial && parameter !== undefined)
        throw new Error(
          "Mass fullness transfer needs its original physical-station clock",
        );
      const span: number =
        AutoMovieViewParameter.at(parameter, newTop) -
        AutoMovieViewParameter.at(parameter, 0);
      const knots: IAutoMovieViewPart.IKnot[] = source.knots.map(
        (knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => {
          const read: AutoMovieViewOutline.IReading | string =
            AutoMovieViewOutline.at(source, knot.station);
          if (typeof read === "string") throw new Error(read);
          return {
            site:
              delta > 0 && knot.station === 0 ? "retained embedded" : knot.site,
            station: station(knot.station),
            value: read.value,
            jet: {
              first: read.parameterJet[0] * span,
              second: read.parameterJet[1] * span * span,
            },
          };
        },
      );
      if (delta > 0)
        knots.unshift({
          site: "embedded",
          station: 0,
          value: knots[0]!.value,
          jet: { first: 0, second: 0 },
        });
      const result: IAutoMovieViewPart.IOutline = {
        ...outline,
        parameter,
        knots,
      };
      const check:
        | AutoMovieViewOutline.IOutline
        | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
        result,
        radial ? { top: newTop } : {},
      );
      if ("detail" in check) throw new Error(check.detail);
      if (radial)
        for (const s of [
          0,
          delta,
          ...AutoMovieViewOutline.criticalStations(check).filter(
            (s: number): boolean => s < delta,
          ),
        ]) {
          const value: number | string = AutoMovieViewOutline.value(check, s);
          if (
            typeof value === "string" ||
            (knots[0]!.value > 0 ? !(value > 0) : !(value < 0))
          )
            throw new Error(
              "The new inward prefix does not keep its signed radial source",
            );
        }
      return result;
    };
    if (
      original.fullness.kind !== "shoulder" ||
      original.fullness.departures !== undefined
    )
      throw new Error(
        "Mass source transfer requires its declared common fullness",
      );
    const axis: IAutoMovieConstructionView["axis"] = {
      ...record.axis,
      origin: AutoMovieHumanConstructionView.point(connection.root),
    };
    const frame: ReturnType<typeof AutoMovieConstructionViews.frame> =
      AutoMovieConstructionViews.frame(axis);
    if (typeof frame === "string") throw new Error(frame);
    const part: IAutoMovieViewPart = {
      ...original,
      axis: frame,
      stations: [...new Set([0, ...original.stations.map(station)])],
      front: {
        positive: convert(original.front.positive, true),
        negative: convert(original.front.negative, true),
      },
      side: {
        positive: convert(original.side.positive, true),
        negative: convert(original.side.negative, true),
      },
      fullness: {
        kind: "shoulder",
        shoulder: convert(original.fullness.shoulder, false),
      },
    };
    return {
      part,
      view: AutoMovieHumanConstructionView.of(part, axis),
      diagnostics: [...definition.diagnostics],
      massConnection: {
        ...connection,
        transfer: delta === 0 ? "original-root" : "inner-prefix",
        original: { part: original, view: record },
      },
    };
  }
}
