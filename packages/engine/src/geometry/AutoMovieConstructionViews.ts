import type {
  IAutoMovieConstructionAxis,
  IAutoMovieConstructionFullness,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionOutlinePair,
  IAutoMovieConstructionParameter,
  IAutoMovieConstructionSource,
  IAutoMovieConstructionView,
  IAutoMovieSolidIntersection,
  IAutoMovieVector3,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParallelAxis } from "./AutoMovieViewParallelAxis";
import { rollAutoMovieViewAxis } from "./construction/internal/rollAutoMovieViewAxis";

/**
 * A construction tree's view part as the view-to-section operator's input
 * (`IAutoMovieViewPart`): declared metres become kernel millimetres once, while
 * an explicit source leaf reads its already evaluated input from this call's
 * context.
 *
 * Lengths (stations, chart coordinates, girths, axis points, steps) are scaled
 * by {@link SCALE}; shares, departures and directions are not.
 */
export namespace AutoMovieConstructionViews {
  /** Millimetres per metre: the kernel's unit over the tree's. */
  export const SCALE: number = 1000;

  /**
   * The operator's part for a view.
   *
   * @param view A declarative metre view or an explicit evaluated-source leaf.
   * @param sources This invocation's immutable source map, containing
   *   millimetre inputs and their actual function owners.
   * @returns The part in millimetres, or the axis/source admission rule it
   *   broke. Outline/order/section admission belongs to ViewLoft, not this
   *   copy.
   */
  export function part(
    view: IAutoMovieConstructionView | IAutoMovieConstructionSource,
    sources?: ReadonlyMap<string, IAutoMovieViewPart>,
  ): IAutoMovieViewPart | string {
    if (view.type === "source") {
      if (typeof view.source !== "string" || view.source.length === 0)
        return "an evaluated source needs a nonempty invocation key";
      const source: IAutoMovieViewPart | undefined = sources?.get(view.source);
      if (source === undefined)
        return `evaluated source ${view.source} is absent from this invocation`;
      if (source === null || source.name !== view.name)
        return `evaluated source ${view.source} does not name ${view.name}`;
      return source;
    }
    const axis: IAutoMovieViewAxis.IAxis | string = frame(view.axis);
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
   * @returns The axis in millimetres, or the admission rule it broke. An
   *   explicitly requested jointed material roll preserves the base
   *   origin/normal plane and scales its two physical stations once while
   *   retaining the caller's signed direction.
   */
  export function frame(
    axis: IAutoMovieConstructionAxis,
  ): IAutoMovieViewAxis.IAxis | string {
    switch (axis.type) {
      case "straight":
        return AutoMovieViewAxis.straight(
          point(axis.origin),
          vector(axis.u),
          vector(axis.v),
        );
      case "level":
        return axis.origin === null
          ? AutoMovieViewAxis.horizontal()
          : AutoMovieViewAxis.level(knots(axis.origin.x), knots(axis.origin.z));
      case "curved":
        return AutoMovieViewAxis.minimal(
          axis.knots.map(
            (k): IAutoMovieViewAxis.IAxisKnot => ({
              station: k.station * SCALE,
              point: point(k.point),
            }),
          ),
          vector(axis.u),
          axis.step * SCALE,
        );
      case "jointed": {
        const base: IAutoMovieViewAxis.IAxis | string =
          AutoMovieViewAxis.jointed(
            axis.centres.map(point),
            axis.halves.map((h: number): number => h * SCALE),
            vector(axis.up),
          );
        return typeof base === "string" || axis.roll === undefined
          ? base
          : rollAutoMovieViewAxis(
              base,
              axis.roll.from * SCALE,
              axis.roll.to * SCALE,
              vector(axis.roll.up),
            );
      }
      case "parallel":
        return AutoMovieViewParallelAxis.from(axis);
    }
  }

  /**
   * A join curve's parameter record as the trace's parameter, the angle's
   * centre in millimetres.
   *
   * @param p The parameter, metres.
   * @returns The kernel's parameter.
   */
  export function parameter(
    p: IAutoMovieConstructionParameter,
  ): IAutoMovieSolidIntersection.Parameter {
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

  /**
   * Copy a world point from construction-frame metres to kernel millimetres.
   *
   * @param p World coordinates, metres; finite representable scaled values are
   *   a consumer premise.
   * @returns A new three-component millimetre vector, with nonfinite products
   *   left observable.
   */
  export function point(p: IAutoMovieVector3): [number, number, number] {
    return [p.x * SCALE, p.y * SCALE, p.z * SCALE];
  }

  /**
   * Copy a direction's components without a length-unit conversion.
   *
   * @param p Dimensionless direction in the construction's frame; this copy
   *   does not admit its length or angle.
   * @returns A new tuple with exactly the supplied components, without
   *   normalization.
   */
  export function vector(p: IAutoMovieVector3): [number, number, number] {
    return [p.x, p.y, p.z];
  }

  /*
   * An original length-valued outline in millimetres, with its source parameter
   * preserved.
   *
   * Converts source station, scalar and parameter-endpoint lengths together by
   * the metre-to-millimetre factor through the shared outline owner. Named
   * knots and parameter identity survive without sampling. One linear knot copy
   * and constant parameter conversion produce caller-owned data; the helper
   * retains nothing and coordinates no effectful work.
   */
  function length(
    outline: IAutoMovieConstructionOutline,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieViewOutline.scale(outline, SCALE, SCALE);
  }

  /*
   * An original dimensionless outline, with only station and parameter-endpoint
   * lengths converted to millimetres.
   *
   * Converts station and source-parameter endpoints once through the same owner
   * as length outlines, preserving dimensionless values with a unit scalar
   * factor. It neither scales a fullness share nor infers a parameter from
   * sections. One linear knot copy and constant parameter conversion produce
   * caller-owned data, with no retained state or effectful work to coordinate.
   */
  function share(
    outline: IAutoMovieConstructionOutline,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieViewOutline.scale(outline, SCALE, 1);
  }

  /*
   * A scalar course of lengths in millimetres.
   */
  function knots(
    outline: IAutoMovieConstructionOutline,
  ): IAutoMovieViewAxis.IAxisKnot1[] {
    return outline.knots.map(
      (k): IAutoMovieViewAxis.IAxisKnot1 => ({
        station: k.station * SCALE,
        value: k.value * SCALE,
      }),
    );
  }

  /*
   * A view's two edges in millimetres.
   */
  function pair(
    p: IAutoMovieConstructionOutlinePair,
  ): IAutoMovieViewPart.IPair {
    return { positive: length(p.positive), negative: length(p.negative) };
  }

  /*
   * The fullness owner in the operator's records.
   */
  function fullness(
    f: IAutoMovieConstructionFullness,
  ): IAutoMovieViewPart.Fullness {
    const quarters = (
      q: [
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
      ],
    ): IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> => [
      share(q[0]),
      share(q[1]),
      share(q[2]),
      share(q[3]),
    ];
    switch (f.type) {
      case "girth":
        return {
          kind: "girth",
          girth: length(f.girth),
          ...(f.departures === null
            ? {}
            : { departures: quarters(f.departures) }),
        };
      case "shoulder":
        return {
          kind: "shoulder",
          shoulder: share(f.shoulder),
          ...(f.departures === null
            ? {}
            : { departures: quarters(f.departures) }),
        };
      case "top":
        return { kind: "top", shoulders: quarters(f.shoulders) };
    }
  }
}
