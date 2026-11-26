import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewOutline,
  AutoMovieViewSection,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHeadEarRidge,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewAxis,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadEarRidgeAxis } from "./AutoMovieHumanHeadEarRidgeAxis";

/**
 * An ear ridge swept on its own anatomical course. A curved helix or crural
 * branch is not represented by a straight long dome. Source points and section
 * widths remain the modeler's inputs. Unbranched courses use the engine's
 * minimally transported planes. Each crural fork borrows its parent's complete
 * section and uses that normal's projected frame while its common coordinate
 * jet turns into the branch's remaining course.
 *
 * @evidence contracts/common.md#principled-implementation Sweeps native sections on named courses; a complete original fork owns each crural attachment's scalar family, coordinate2 and frame, independently of final Boolean joins.
 * @evidence contracts/common.md#clear-and-simple-design One view builder serves helix, antihelix and the two separate crura.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses source landmarks only, with no mesh/ray observation, parent-foot move or individual fit.
 * @evidence contracts/common.md#meaningful-documentation Separates course, section dimensions, frame ownership and the unverified joins.
 * @evidence contracts/performance.md#efficient-algorithms Cumulative chords and three coordinate-source preparations are linear in course knots. An unbound minimal axis independently prepares its own coordinate splines and retains its transport-step query cost; a bound axis reads the admitted coordinates.
 * @evidence contracts/performance.md#reuse-equivalent-work Both supporting outline pairs share stations and the same engine axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the view and prepared axis; no figure survives globally.
 */
export namespace AutoMovieHumanHeadEarRidge {
  /**
   * Draw one closed ridge, calibration mm, capped at both course ends.
   *
   * @param name Unique anatomical ridge name.
   * @param course Original anatomical course points, world calibration mm.
   * @param normal Initial chart normal for an unbound course.
   * @param height Positive normal relief half extent, calibration mm.
   * @param width Positive transverse half extent, calibration mm.
   * @param ports Named own ports or complete original parent ports.
   * @returns Original view together with its coordinate sources.
   * @evidence contracts/common.md#principled-implementation Named course points remain source knots; a borrowed fork supplies whole native support/fullness and available physical scalar2 with its original coordinate2 and section plane.
   * @evidence contracts/common.md#clear-and-simple-design Returns only a view, leaving merge and diff to the head tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not turn a failed join into a relocation or a compensating width.
   * @evidence contracts/common.md#meaningful-documentation States units, cap behavior and engine ownership of the loft.
   * @evidence contracts/performance.md#efficient-algorithms Source construction is linear in course points; an unbound minimal axis also prepares its own splines, while bound frame queries retain three admitted-outline lookup costs and fixed vector work.
   * @evidence contracts/performance.md#reuse-equivalent-work One station list supplies all source curves.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the returned source view and its axis knots.
   */
  export function of(
    name: string,
    course: ReadonlyArray<AutoMovieVector3Tuple>,
    normal: AutoMovieVector3Tuple,
    height: number,
    width: number,
    ports: IAutoMovieHumanHeadEarRidge.IPorts = {},
  ): IAutoMovieHumanHeadEarRidge.IRidge {
    const points: [number, number, number][] = course.map(
      (point: [number, number, number]): [number, number, number] => [...point],
    );
    function extend(
      endpoint: [number, number, number],
      neighbour: [number, number, number],
    ): [number, number, number] {
      const distance: number = Math.hypot(
        ...endpoint.map(
          (value: number, i: number): number => value - neighbour[i]!,
        ),
      );
      if (!(distance > 0))
        throw new Error(`Ear ridge ${name} has a degenerate junction course`);
      return endpoint.map(
        (value: number, i: number): number =>
          value +
          ((value - neighbour[i]!) * Math.max(height, width)) / distance,
      ) as [number, number, number];
    }
    // A named fork is a regular, nonzero section. The existing section's
    // largest half extent supplies overlap past it before the hidden pole;
    // this geometric port convention is not a new anatomical radius.
    if (ports.start !== undefined)
      points.unshift(
        typeof ports.start === "string"
          ? extend(course[0]!, course[1]!)
          : extension(ports.start, -Math.max(height, width)),
      );
    if (ports.end !== undefined)
      points.push(
        typeof ports.end === "string"
          ? extend(course.at(-1)!, course.at(-2)!)
          : extension(ports.end, Math.max(height, width)),
      );
    const source: number[] = [0];
    for (let i: number = 1; i < points.length; i++)
      source.push(
        source[i - 1]! +
          Math.hypot(
            ...points[i]!.map(
              (v: number, k: number): number => v - points[i - 1]![k]!,
            ),
          ),
      );
    // These are evaluation sites, not new shape knots. Three original
    // course sites with two poles still need two regular loft sections.
    const stations: number[] = [
      ...source,
      ...source
        .slice(1)
        .map((s: number, i: number): number => (s + source[i]!) / 2),
    ].sort((a: number, b: number): number => a - b);
    function port(
      i: number,
    ): string | IAutoMovieHumanHeadEarRidge.IPort | undefined {
      return i === 1
        ? ports.start
        : i === points.length - 2
          ? ports.end
          : undefined;
    }
    function site(i: number): string {
      const named: string | IAutoMovieHumanHeadEarRidge.IPort | undefined =
        port(i);
      return typeof named === "object" ? named.site : (named ?? `${name}.${i}`);
    }
    function outline(
      value: number,
      quarter: 0 | 1 | 2 | 3,
    ): IAutoMovieViewPart.IOutline {
      return {
        knots: source.map(
          (station: number, i: number): IAutoMovieViewPart.IKnot => {
            const shared:
              | string
              | IAutoMovieHumanHeadEarRidge.IPort
              | undefined = port(i);
            const sign: number = quarter < 2 ? 1 : -1;
            const jet: IAutoMovieViewPart.IKnot["jet"] =
              typeof shared === "object" && shared.jets !== null
                ? radialJet(
                    shared.jets.extents[quarter]!,
                    sign,
                    station,
                    source.at(-1)!,
                  )
                : undefined;
            return {
              site: site(i),
              station,
              value:
                i === 0 || i === source.length - 1
                  ? 0
                  : typeof shared === "object"
                    ? sign * shared.inputs.extents[quarter]!
                    : value,
              ...(jet === undefined ? {} : { jet }),
            };
          },
        ),
        range: {
          minimum: Math.min(
            0,
            value,
            ...[ports.start, ports.end]
              .filter(
                (
                  p: string | IAutoMovieHumanHeadEarRidge.IPort | undefined,
                ): p is IAutoMovieHumanHeadEarRidge.IPort =>
                  typeof p === "object",
              )
              .map(
                (p: IAutoMovieHumanHeadEarRidge.IPort): number =>
                  (quarter < 2 ? 1 : -1) * p.inputs.extents[quarter]!,
              ),
          ),
          maximum: Math.max(
            0,
            value,
            ...[ports.start, ports.end]
              .filter(
                (
                  p: string | IAutoMovieHumanHeadEarRidge.IPort | undefined,
                ): p is IAutoMovieHumanHeadEarRidge.IPort =>
                  typeof p === "object",
              )
              .map(
                (p: IAutoMovieHumanHeadEarRidge.IPort): number =>
                  (quarter < 2 ? 1 : -1) * p.inputs.extents[quarter]!,
              ),
          ),
        },
      };
    }
    const prepared: {
      axis: IAutoMovieViewAxis.IAxis;
      coordinates: IAutoMovieHumanHeadEarRidge.IRidge["coordinates"];
    } = AutoMovieHumanHeadEarRidgeAxis.of(name, points, source, normal, ports);
    return {
      name,
      axis: prepared.axis,
      coordinates: prepared.coordinates,
      stations,
      front: { positive: outline(height, 0), negative: outline(-height, 2) },
      side: { positive: outline(width, 1), negative: outline(-width, 3) },
      fullness: {
        kind: "top",
        shoulders: [0, 1, 2, 3].map(
          (quarter: number): IAutoMovieViewPart.IOutline => ({
            knots: source.map(
              (station: number, i: number): IAutoMovieViewPart.IKnot => {
                const shared:
                  | string
                  | IAutoMovieHumanHeadEarRidge.IPort
                  | undefined = port(i);
                const span: number = source.at(-1)! - source[0]!;
                const jet: IAutoMovieViewPart.IKnot["jet"] =
                  typeof shared === "object" && shared.jets !== null
                    ? {
                        first: shared.jets.shoulders[quarter]![1] * span,
                        second:
                          shared.jets.shoulders[quarter]![2] * span * span,
                      }
                    : undefined;
                return {
                  site: `${site(i)}.fullness.${quarter}`,
                  station,
                  value:
                    typeof shared === "object"
                      ? shared.inputs.shoulders[quarter]!
                      : AutoMovieViewSection.ELLIPSE,
                  ...(jet === undefined ? {} : { jet }),
                };
              },
            ),
          }),
        ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>,
      },
      pole: "both",
      order: 16,
      samples: 64,
    };
  }

  /**
   * Convert actual physical scalar2 into the child's two-pole normalized angle
   * clock.
   *
   * @evidence contracts/common.md#principled-implementation Applies the analytic inverse-angle first/second chain rule and whole-parameter normalization.
   * @evidence contracts/common.md#clear-and-simple-design One helper serves all four signed support sources.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Receives actual finite physical jets; no missing derivative is synthesized.
   * @evidence contracts/common.md#meaningful-documentation Input uses physical station mm and output uses normalized angle units.
   * @evidence contracts/performance.md#efficient-algorithms Constant trigonometric and scalar work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller shares the actual port jets.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one owned fixed-size record.
   */
  function radialJet(
    value: readonly number[],
    sign: number,
    station: number,
    length: number,
  ): NonNullable<IAutoMovieViewPart.IKnot["jet"]> {
    const theta: number = Math.acos(1 - (2 * station) / length);
    const first: number = (length * Math.sin(theta)) / 2;
    const second: number = (length * Math.cos(theta)) / 2;
    return {
      first: sign * value[1]! * first * Math.PI,
      second:
        sign *
        (value[2]! * first * first + value[1]! * second) *
        Math.PI *
        Math.PI,
    };
  }

  /**
   * Publish one complete regular fork from the identical authored ridge.
   *
   * @param owner The identical original ridge and coordinate sources.
   * @param site Named regular fork station.
   * @returns Whole native family, frame and actual available derivatives.
   * @evidence contracts/common.md#principled-implementation Retains the whole native source, effective quarter laws, actual frame, source-coordinate2 and available scalar2 at one named regular station.
   * @evidence contracts/common.md#clear-and-simple-design Both branches borrow this one port rather than independently preparing a fork.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads no emitted mesh and invents no missing minimal-transport frame jet; whole-phase geometry is retained with its author.
   * @evidence contracts/common.md#meaningful-documentation Every length and station uses calibration mm; phase and physical derivatives remain distinct.
   * @evidence contracts/performance.md#efficient-algorithms A linear site lookup and original scalar admission precede fixed-count scalar/coordinate queries at their knot-search costs and one actual-axis query at its owner's cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned complete field and original ridge serve both crura.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns the port and parent; no registry or global identity cache exists.
   */
  export function port(
    owner: IAutoMovieHumanHeadEarRidge.IRidge,
    site: string,
  ): IAutoMovieHumanHeadEarRidge.IPort {
    const knot: IAutoMovieViewPart.IKnot | undefined =
      owner.front.positive.knots.find(
        (k: IAutoMovieViewPart.IKnot): boolean => k.site === site,
      );
    if (knot === undefined)
      throw new Error(`Ear ridge ${owner.name} has no original port ${site}`);
    const admitted: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(owner);
    if (admitted === null || admitted.source === null)
      throw new Error(
        `Ear ridge ${owner.name} has no admitted original port field`,
      );
    const inputs: IAutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(admitted.source, knot.station);
    if (typeof inputs === "string")
      throw new Error(`Ear port ${site}: ${inputs}`);
    const jets: IAutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftViewRead.jets(admitted.source, knot.station);
    const coordinate: IAutoMovieViewOutline.IReading[] = owner.coordinates.map(
      (
        outline: IAutoMovieViewOutline.IOutline,
      ): IAutoMovieViewOutline.IReading => {
        const reading: IAutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(outline, knot.station);
        if (typeof reading === "string" || reading.stationJet === null)
          throw new Error(
            `Ear port ${site} has no finite original coordinate2`,
          );
        return reading;
      },
    );
    return {
      site,
      owner,
      station: knot.station,
      source: admitted.source,
      inputs,
      jets: typeof jets === "string" ? null : jets,
      jetFailure: typeof jets === "string" ? jets : null,
      frame: owner.axis.at(knot.station),
      originJet: [
        coordinate.map(
          (reading: IAutoMovieViewOutline.IReading): number =>
            reading.stationJet![0],
        ) as [number, number, number],
        coordinate.map(
          (reading: IAutoMovieViewOutline.IReading): number =>
            reading.stationJet![1],
        ) as [number, number, number],
      ],
      phase: AutoMovieLoftSectionNative.phase(inputs),
    };
  }

  /**
   * Extend the hidden pole along the same original fork's increasing station
   * direction.
   *
   * @evidence contracts/common.md#principled-implementation Uses the actual original coordinate tangent and retained ridge radius.
   * @evidence contracts/common.md#clear-and-simple-design One vector extension serves either hidden end.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A singular original tangent throws instead of acquiring a replacement direction.
   * @evidence contracts/common.md#meaningful-documentation Distance and coordinates use calibration mm.
   * @evidence contracts/performance.md#efficient-algorithms Constant three-vector work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The port owns tangent preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one owned vector.
   */
  function extension(
    port: IAutoMovieHumanHeadEarRidge.IPort,
    distance: number,
  ): [number, number, number] {
    const speed: number = Math.hypot(...port.originJet[0]);
    if (!(speed > 0 && Number.isFinite(speed)))
      throw new Error(`Ear port ${port.site} has no regular original course`);
    return port.frame.origin.map(
      (value: number, i: number): number =>
        value + (distance * port.originJet[0][i]!) / speed,
    ) as [number, number, number];
  }
}
