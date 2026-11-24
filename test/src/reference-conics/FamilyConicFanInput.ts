import {
  AutoMovieLoftViewFullSource,
  AutoMovieMeshExtract,
  AutoMovieNaturalSpline,
  AutoMovieConstructionSplitCompose as Split,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type {
  IAutoMovieConstructionSkinCut,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitCompose,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieMeshSectionChain,
  IAutoMovieMillimeterMesh,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { FamilyConicLoft } from "./FamilyConicLoft";

/**
 * Prepare a palm or forefoot fan from caller-owned conic controls and an
 * explicit observation mesh.
 */
export namespace FamilyConicFanInput {
  /** A placed wall and the fixed millimetre stations the native loft uses. */
  export interface IWall {
    /** Conic fields and their course in one world chart. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** The source's stations in increasing order, including both ends. */
    stations: readonly number[];
  }

  /** A digit's declared source and fit limits, all in millimetres. */
  export interface IDigit extends IWall {
    /** The first fixed distal knot. */
    mark: number;
    /** The physical width of the skin strip beyond the end plane. */
    rail: number;
  }

  /**
   * Ordered sources and sampling of one fan. The hand excludes its
   * side-attached thumb.
   */
  export interface IRequest {
    /** Anatomical role that fixes the number of axial children. */
    kind: "hand" | "foot";
    /** The palm or forefoot, terminating at its last station. */
    host: IWall;
    /** The four fingers or five toes in the split's traversal order. */
    digits: readonly IDigit[];
    /** The admitted split's phase count, a multiple of four at least eight. */
    count: number;
  }

  /**
   * Independent section evidence carries the original indexed cut chains in a
   * digit's own course plane.
   */
  export interface IObservation {
    /** Sample station, millimetres. */
    station: number;
    /** Whether the station belongs to the held distal material. */
    retained: boolean;
    /**
     * Every raw chain, including open chains and other material within the
     * plane.
     */
    loops: readonly IAutoMovieMeshSectionChain[];
  }

  /**
   * The exact source-side compose result. A failed initializer remains
   * available to the elastic fit.
   */
  export interface IReceipt {
    /**
     * All independent wall and end-plane cut refusals before the coupled
     * compose.
     */
    sources: readonly { name: string; refusal: string }[];
    /** The exact derived seams, valleys and rails once all walls are admitted. */
    derived: IAutoMovieConstructionSplitCompose.IDerived | null;
    /** The coupled refusal if valid individual cuts do not compose. */
    composition: string | null;
  }

  /**
   * Changed independent ordinates by digit, then field, then the reduced tail
   * basis's free knot order.
   */
  export type Candidate = ReadonlyMap<string, readonly (readonly number[])[]>;

  /**
   * Prepare the fixed host source, protected tail bases and complete fan
   * authority once.
   */
  export function prepare(input: IRequest) {
    const expected: number = input.kind === "hand" ? 4 : 5;
    if (input.digits.length !== expected)
      throw new Error(`${input.kind} fan requires ${expected} axial digits`);
    const names: Set<string> = new Set([
      input.host.family.name,
      ...input.digits.map(({ family }): string => family.name),
    ]);
    if (names.size !== 1 + expected || names.has(""))
      throw new Error(`${input.kind} fan sources require independent names`);
    if (
      !Number.isInteger(input.count) ||
      input.count < 8 ||
      input.count % 4 !== 0
    )
      throw new Error(
        "fan band columns must be a multiple of four and at least eight",
      );

    const hostView: IAutoMovieViewPart = view(input.host);
    const host = physical(hostView, 1);
    const compose: IAutoMovieConstructionSplit.ICompose = {
      frame: "host",
      plane: { point: [0, 0, 0], normal: [0, 0, 1] },
    };
    const plane: IAutoMovieConstructionSkinCut.IPlane | null = Split.plane(
      compose.plane,
      host.basis,
    );
    if (plane === null) throw new Error("fan end plane has no normal");
    const digits = input.digits.map((digit: IDigit) => {
      const { family, mark, rail, stations } = digit;
      checkStations(digit);
      if (!(rail > 0 && Number.isFinite(rail)))
        throw new Error(`${family.name} rail is not positive and finite`);
      const tail = FamilyConicLoft.constrainTail(
        family,
        mark,
        stations.filter((s: number): boolean => s < mark),
      );
      if (typeof tail === "string") throw new Error(`${family.name}: ${tail}`);
      const source: IAutoMovieHumanConicLoft.IFamily =
        family.origin === undefined
          ? family
          : {
              ...family,
              origin: refinedOrigin(family.knots, family.origin, tail.knots),
            };
      return {
        digit,
        tail,
        axis: AutoMovieHumanConicLoft.axis(family),
        expand: (
          values: readonly (readonly number[])[],
        ): IAutoMovieHumanConicLoft.IFamily => expand(source, tail, values),
      };
    });

    const read = (candidate: Candidate = new Map()): IReceipt => {
      if (
        [...candidate.keys()].some(
          (name: string): boolean =>
            !digits.some(({ digit }): boolean => digit.family.name === name),
        )
      )
        throw new Error(
          "fan candidate includes a wall outside its authored digit controls",
        );
      const sections: IAutoMovieConstructionSplitCompose.ISection[] = [];
      const sources: { name: string; refusal: string }[] = [];
      for (const { digit, expand } of digits) {
        const name: string = digit.family.name;
        try {
          const changed: readonly (readonly number[])[] | undefined =
            candidate.get(name);
          const family = changed === undefined ? digit.family : expand(changed);
          const wall = physical(view({ ...digit, family }), -1);
          const section = Split.section(
            plane,
            { ...wall, name, into: 1, rail: digit.rail },
            input.count,
          );
          if (typeof section === "string") throw new Error(section);
          sections.push(section);
        } catch (error: unknown) {
          sources.push({
            name,
            refusal: error instanceof Error ? error.message : String(error),
          });
        }
      }
      if (sources.length > 0)
        return { sources, derived: null, composition: null };
      try {
        const result = Split.derive(
          {
            compose,
            host,
            children: sections.map(({ child }) => child),
            count: input.count,
          },
          sections,
        );
        return {
          sources,
          derived: typeof result === "string" ? null : result,
          composition: typeof result === "string" ? result : null,
        };
      } catch (error: unknown) {
        return {
          sources,
          derived: null,
          composition: error instanceof Error ? error.message : String(error),
        };
      }
    };

    const observe = (
      mesh: IAutoMovieMillimeterMesh,
    ): ReadonlyMap<string, readonly IObservation[]> => {
      const outline = AutoMovieMeshExtract.prepareOutline(mesh);
      return new Map(
        digits.map(({ digit, axis }) => [
          digit.family.name,
          digit.stations.map((station: number): IObservation => {
            const frame = axis.at(station);
            const basis = Split.basis(frame, 1);
            if (basis === null)
              throw new Error(
                `${digit.family.name} has a degenerate course frame at ${station} mm`,
              );
            // The course frame already stands at the requested station. No synthetic bridge closes a raw mesh gap.
            const cut = outline(
              { origin: basis.origin, axes: [basis.z, basis.x, basis.y] },
              [0],
              0,
              undefined,
              0,
            )[0]!;
            return {
              station,
              retained: station >= digit.mark,
              loops: cut.loops,
            };
          }),
        ]),
      );
    };
    return {
      plane,
      compose,
      host,
      hostView,
      digits: digits.map(({ digit, tail, expand }) => ({
        digit,
        tail,
        expand,
      })),
      read,
      observe,
    };
  }

  /**
   * Evaluate the two original natural cubics on a refined grid. Inserting
   * interior knots preserves the same cubic and its jets.
   */
  function refinedOrigin(
    original: readonly number[],
    origin: IAutoMovieHumanConicRecentre.ILine,
    knots: readonly number[],
  ): IAutoMovieHumanConicRecentre.ILine {
    const subdivide = (row: readonly number[]): number[] => {
      const spline = AutoMovieNaturalSpline.create(original, row);
      return knots.map((s: number): number => {
        const index: number = original.indexOf(s);
        return index < 0
          ? AutoMovieNaturalSpline.evaluate(spline, s)
          : row[index]!;
      });
    };
    return { u: subdivide(origin.u), v: subdivide(origin.v) };
  }

  /**
   * Expand one digit's reduced proximal variables while checking its protected
   * distal value and derivatives.
   */
  function expand(
    family: IAutoMovieHumanConicLoft.IFamily,
    tail: FamilyConicLoft.ITailFit,
    fields: readonly (readonly number[])[],
  ): IAutoMovieHumanConicLoft.IFamily {
    if (
      fields.length !== tail.initial.length ||
      fields.some(
        (field): boolean =>
          field.length !== tail.free.length || !field.every(Number.isFinite),
      )
    )
      throw new Error(
        "candidate does not have the complete finite independent ordinates of this digit",
      );
    const result: IAutoMovieHumanConicLoft.IFamily = {
      ...family,
      knots: tail.knots,
      values: fields.map((field, f: number): number[] => tail.expand(f, field)),
    };
    const fault: string | null = tail.check(result);
    if (fault !== null) throw new Error(fault);
    return result;
  }

  /**
   * Fixed sampling is bounded by the actual family knots and directed from the
   * first station to the last.
   */
  function checkStations({ family, stations }: IWall): void {
    if (
      stations.length < 2 ||
      stations[0] !== family.knots[0] ||
      stations.at(-1) !== family.knots.at(-1) ||
      stations.some(
        (s: number, i: number): boolean =>
          !Number.isFinite(s) || (i > 0 && s <= stations[i - 1]!),
      )
    )
      throw new Error(
        `${family.name} needs two or more increasing stations over its complete field domain`,
      );
  }

  /** Build the source view on the fixed sampling grid of this fan. */
  export function view(wall: IWall): IAutoMovieViewPart {
    checkStations(wall);
    return AutoMovieHumanConicLoft.part(wall.family, [...wall.stations], false);
  }

  /** Read one end of the exact native loft used by the engine's composed end. */
  function physical(
    view: IAutoMovieViewPart,
    end: 1 | -1,
  ): IAutoMovieConstructionSplitCompose.IInput["host"] &
    Pick<IAutoMovieConstructionSplitCompose.IChild, "stations"> {
    const source = AutoMovieLoftViewFullSource.create(view);
    const station: number = source.domain[end > 0 ? 1 : 0];
    const basis = Split.basis(view.axis.at(station), end);
    if (basis === null)
      throw new Error(`${view.name} has no regular end frame`);
    return {
      surface: {
        name: view.name,
        domain: [...source.domain],
        period: 2 * Math.PI,
        orientation: 1,
        jet: source.jet,
      },
      station,
      basis,
      stations: view.stations.filter(
        (s: number): boolean => s >= source.domain[0] && s <= source.domain[1],
      ),
    };
  }
}
