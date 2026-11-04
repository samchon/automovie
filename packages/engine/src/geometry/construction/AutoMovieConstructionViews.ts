import type {
  AutoMovieConstructionAxis,
  AutoMovieConstructionFullness,
  AutoMovieConstructionParameter,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionOutlinePair,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import { AutoMovieViewParallelAxis } from "./AutoMovieViewParallelAxis";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * A construction tree's view part as the view-to-section operator's input (`IAutoMovieViewPart`): the tree's metres turned into the kernel's millimetres once, its axis record turned into the frame function it names, and its closed unions into the operator's own records.
 *
 * Lengths (stations, chart coordinates, girths, axis points, steps) are scaled by {@link SCALE}; shares, departures and directions are not.
 *
 * @evidence contracts/common.md#principled-implementation The tree's metres become the kernel's millimetres in one place with one factor, and each closed union maps to the operator's own record by its discriminant, so no length is scaled twice or not at all.
 * @evidence contracts/common.md#clear-and-simple-design One converter per record kind: part, frame, parameter, point and direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shares, departures and directions are left unscaled because they carry no length; an inadmissible axis returns its rule, not a substitute frame.
 * @evidence contracts/common.md#meaningful-documentation States the scale, what it applies to and what it does not.
 * @evidence contracts/performance.md#efficient-algorithms Every conversion is linear in the knots it copies.
 * @evidence contracts/performance.md#reuse-equivalent-work A view is converted once per realization, and its frame function is built once and shared by every station.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The converted records belong to the caller; nothing is cached here.
 */
export namespace AutoMovieConstructionViews {
  /** Millimetres per metre: the kernel's unit over the tree's. */
  export const SCALE: number = 1000;

  /**
   * The operator's part for a view.
   *
   * @param view The view part, metres.
   * @returns The part in millimetres, or the axis admission rule it broke.
   */
  export function part(view: IAutoMovieConstructionView): IAutoMovieViewPart | string {
    const axis: AutoMovieViewAxis.IAxis | string = frame(view.axis);
    if (typeof axis === "string") return axis;
    return {
      name: view.name,
      axis,
      stations: view.stations.map((s: number): number => s * SCALE),
      front: pair(view.front),
      side: pair(view.side),
      fullness: fullness(view.fullness),
      ...(view.pole === "open" ? {} : { pole: view.pole }),
      order: view.order,
      samples: view.samples,
    };
  }

  /**
   * The frame function an axis record names.
   *
   * @param axis The axis, metres.
   * @returns The axis in millimetres, or the admission rule it broke.
   *
   * @evidence contracts/common.md#principled-implementation Dispatches the declared axis kind to its own frame owner, scaling origin lengths and station parameters once while leaving direction vectors unchanged.
   * @evidence contracts/common.md#clear-and-simple-design One closed-union switch preserves each source plane meaning; parallel planes use their original coordinate curves instead of tangent transport.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no inferred axis kind or sampled replacement frame and retains builder admission failures.
   * @evidence contracts/common.md#meaningful-documentation States metre input, millimetre output, unscaled directions and explicit builder failures.
   * @evidence contracts/performance.md#efficient-algorithms Copies each declared knot once before the chosen builder's preparation; it performs no source sampling or mesh realization.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns one prepared frame function for all stations of the converted view.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Converted data belongs to the returned axis builder; the dispatch retains no global state.
   */
  export function frame(axis: AutoMovieConstructionAxis): AutoMovieViewAxis.IAxis | string {
    switch (axis.type) {
      case "straight":
        return AutoMovieViewAxis.straight(point(axis.origin), vector(axis.u), vector(axis.v));
      case "level":
        return axis.origin === null
          ? AutoMovieViewAxis.horizontal()
          : AutoMovieViewAxis.level(knots(axis.origin.x), knots(axis.origin.z));
      case "curved":
        return AutoMovieViewAxis.minimal(
          axis.knots.map((k): AutoMovieViewAxis.IAxisKnot => ({ station: k.station * SCALE, point: point(k.point) })),
          vector(axis.u),
          axis.step * SCALE,
        );
      case "jointed":
        return AutoMovieViewAxis.jointed(
          axis.centres.map(point),
          axis.halves.map((h: number): number => h * SCALE),
          vector(axis.up),
        );
      case "parallel":
        return AutoMovieViewParallelAxis.from(axis);
    }
  }

  /**
   * A join curve's parameter record as the trace's parameter, the angle's centre in millimetres.
   *
   * @param p The parameter, metres.
   * @returns The kernel's parameter.
   */
  export function parameter(p: AutoMovieConstructionParameter): AutoMovieSolidIntersection.Parameter {
    switch (p.type) {
      case "phase":
        return { kind: "phase" };
      case "arc":
        return { kind: "arc" };
      case "angle":
        return {
          kind: "angle",
          centre: point(p.centre),
          normal: vector(p.normal),
          reference: vector(p.reference),
        };
    }
  }

  /** A point in millimetres. */
  export function point(p: IAutoMovieVector3): [number, number, number] {
    return [p.x * SCALE, p.y * SCALE, p.z * SCALE];
  }

  /** A direction, unscaled. */
  export function vector(p: IAutoMovieVector3): [number, number, number] {
    return [p.x, p.y, p.z];
  }

  /**
   * An original length-valued outline in millimetres, with its source parameter preserved.
   *
   * Converts source station, scalar and parameter-endpoint lengths together by the metre-to-millimetre factor through the shared outline owner. Named knots and parameter identity survive without sampling. One linear knot copy and constant parameter conversion produce caller-owned data; the helper retains nothing and coordinates no effectful work.
   */
  function length(outline: IAutoMovieConstructionOutline): IAutoMovieViewPart.IOutline {
    return AutoMovieViewOutline.scale(outline, SCALE, SCALE);
  }

  /**
   * An original dimensionless outline, with only station and parameter-endpoint lengths converted to millimetres.
   *
   * Converts station and source-parameter endpoints once through the same owner as length outlines, preserving dimensionless values with a unit scalar factor. It neither scales a fullness share nor infers a parameter from sections. One linear knot copy and constant parameter conversion produce caller-owned data, with no retained state or effectful work to coordinate.
   */
  function share(outline: IAutoMovieConstructionOutline): IAutoMovieViewPart.IOutline {
    return AutoMovieViewOutline.scale(outline, SCALE, 1);
  }

  /** A scalar course of lengths in millimetres. */
  function knots(outline: IAutoMovieConstructionOutline): AutoMovieViewAxis.IAxisKnot1[] {
    return outline.knots.map((k): AutoMovieViewAxis.IAxisKnot1 => ({ station: k.station * SCALE, value: k.value * SCALE }));
  }

  /** A view's two edges in millimetres. */
  function pair(p: IAutoMovieConstructionOutlinePair): IAutoMovieViewPart.IPair {
    return { positive: length(p.positive), negative: length(p.negative) };
  }

  /** The fullness owner in the operator's records. */
  function fullness(f: AutoMovieConstructionFullness): IAutoMovieViewPart.Fullness {
    const quarters = (q: [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline]): IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> => [
      share(q[0]),
      share(q[1]),
      share(q[2]),
      share(q[3]),
    ];
    switch (f.type) {
      case "girth":
        return { kind: "girth", girth: length(f.girth), ...(f.departures === null ? {} : { departures: quarters(f.departures) }) };
      case "shoulder":
        return { kind: "shoulder", shoulder: share(f.shoulder), ...(f.departures === null ? {} : { departures: quarters(f.departures) }) };
      case "top":
        return { kind: "top", shoulders: quarters(f.shoulders) };
    }
  }
}
