import type {
  AutoMovieConstructionAxis,
  AutoMovieConstructionFullness,
  AutoMovieConstructionParameter,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionOutlinePair,
  IAutoMovieConstructionSource,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParallelAxis } from "./AutoMovieViewParallelAxis";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";
import { rollAutoMovieViewAxis } from "./rollAutoMovieViewAxis";

/**
 * A construction tree's view part as the view-to-section operator's input (`IAutoMovieViewPart`): declared metres become kernel millimetres once, while an explicit source leaf reads its already evaluated input from this call's context.
 *
 * Lengths (stations, chart coordinates, girths, axis points, steps) are scaled by {@link SCALE}; shares, departures and directions are not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scale, what it applies to and what it does not.
 * @evidence contracts/development/design.md#principled-representation Represents A construction tree's view part as the view-to-section operator's input (`IAutoMovieViewPart`): declared metres become kernel millimetres once, while an explicit source leaf reads its already evaluated input from this call's context: companion namespace of 11 members (`SCALE`, `part`, `frame`, `parameter`, `point`, `vector`, ...); units and frames named in its text: metre, frame, metres, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionViews` in packages/engine/src/geometry/construction/AutoMovieConstructionViews.ts; its surface is the 11 members listed and the text shows 25 other files naming it, mostly packages/human (10), test (8), packages/engine (7), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConstructionViews {
  /** Millimetres per metre: the kernel's unit over the tree's. */
  export const SCALE: number = 1000;

  /**
   * The operator's part for a view.
   *
   * @param view A declarative metre view or an explicit evaluated-source leaf.
   * @param sources This invocation's immutable source map, containing millimetre inputs and their actual function owners.
   * @returns The part in millimetres, or the axis/source admission rule it broke.
   *   Outline/order/section admission belongs to ViewLoft, not this copy.
   *
   * @evidence contracts/development/implementation.md#principled-implementation An explicit source key reads the complete evaluated part unchanged; declarative views convert length fields by SCALE and dispatch their axis kind through frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source selection precedes the existing declarative conversion; source absence and name mismatch are string failures, not another geometry path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source functions are never sampled, redeclared or scaled again. Declarative copies are not sorted or clamped; their level-axis helper's existing parameter/jet metadata limitation remains separate.
   * @evidence contracts/development/common.md#meaningful-documentation States both input units, lookup-scoped map ownership, immutable generating dependencies for returned readers and source/axis string failures; ViewLoft owns numerical shape admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms Source lookup follows the supplied ReadonlyMap implementation with constant additional checks; declarative conversion copies all knots once plus axis preparation, without lofting.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns the source's actual prepared owners by reference or one newly converted axis; no name cache, registry or previous invocation selects geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Source results borrow the caller's immutable part and transitive functions; converted arrays are caller-owned. This function retains no map or global state; an authored callback may retain its own context.
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
   * @returns The axis in millimetres, or the admission rule it broke. An explicitly requested jointed material roll preserves the base origin/normal plane and scales its two physical stations once while retaining the caller's signed direction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Dispatches the declared axis kind to its own frame owner, scaling origin lengths and station parameters once while leaving direction vectors unchanged; optional jointed roll delegates its same-unit stations and signed target to the material-frame owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-union switch preserves each source plane meaning; parallel planes use their original coordinate curves instead of tangent transport.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no inferred axis kind or sampled replacement frame and retains builder admission failures.
   * @evidence contracts/development/common.md#meaningful-documentation States metre input, millimetre output, unscaled directions and explicit builder failures.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies each declared knot once before the chosen builder's preparation; it performs no source sampling or mesh realization.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns one prepared frame function for all stations of the converted view.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Converted data belongs to the returned axis builder; the dispatch retains no global state.
   */
  export function frame(
    axis: AutoMovieConstructionAxis,
  ): AutoMovieViewAxis.IAxis | string {
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
            (k): AutoMovieViewAxis.IAxisKnot => ({
              station: k.station * SCALE,
              point: point(k.point),
            }),
          ),
          vector(axis.u),
          axis.step * SCALE,
        );
      case "jointed": {
        const base: AutoMovieViewAxis.IAxis | string =
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
   * A join curve's parameter record as the trace's parameter, the angle's centre in millimetres.
   *
   * @param p The parameter, metres.
   * @returns The kernel's parameter.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Maps the closed phase/arc/angle union by discriminant, multiplying only an angle centre's world lengths by SCALE while copying normal/reference components unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch returns the trace's existing parameter record without constructing its numerical law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize directions, invent a degenerate angle basis or certify requested arc length; TraceLaw and Intersection own admission and the existing arc approximation.
   * @evidence contracts/development/common.md#meaningful-documentation States metre centre input and kernel output; a typed union is assumed and no numerical validation failure is returned here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant discriminant work and at most three three-component copies, independent of trace count or mesh size.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure record conversion coordinates no requests or effects; numerical basis preparation belongs to the later law builder.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and, for angle, three fresh vectors without retaining the source parameter or any trace history.
   */
  export function parameter(
    p: AutoMovieConstructionParameter,
  ): AutoMovieSolidIntersection.Parameter {
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
   * @param p World coordinates, metres; finite representable scaled values are a consumer premise.
   * @returns A new three-component millimetre vector, with nonfinite products left observable.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies the same metre-to-millimetre factor independently to x/y/z without changing the coordinate frame or component order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed tuple conversion serves axis origins, angle centres and trim landmarks, each of which represents a physical position.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no finite-value substitution, normalization or clamping; multiplication can expose nonfinite input or overflow for the downstream owner to reject.
   * @evidence contracts/development/common.md#meaningful-documentation Gives world-frame input/output units, fresh ownership and the representability premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exactly three scalar products and one fixed three-entry output, with no input-sized traversal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure scalar conversion coordinates no work or shared dependency.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the fresh tuple; no reference to p, cache entry or resource survives in the converter.
   */
  export function point(p: IAutoMovieVector3): [number, number, number] {
    return [p.x * SCALE, p.y * SCALE, p.z * SCALE];
  }

  /**
   * Copy a direction's components without a length-unit conversion.
   *
   * @param p Dimensionless direction in the construction's frame; this copy does not admit its length or angle.
   * @returns A new tuple with exactly the supplied components, without normalization.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A direction preserves its three components under a change of length units; axis and angle-law builders own any unit, nonzero or transverse requirement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Separates unchanged direction copying from point's length conversion at every axis/angle call site.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize or replace zero/nonfinite directions, so the actual builder receives the caller's authored values and owns any failure.
   * @evidence contracts/development/common.md#meaningful-documentation States dimensionless components, unchanged frame, fresh tuple ownership and absent numerical admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three property reads create one fixed three-entry tuple, with no geometry evaluation or scan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A direct pure component copy coordinates no computed or effectful work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned tuple belongs to its caller and does not alias p's storage; no global state or handle is retained.
   */
  export function vector(p: IAutoMovieVector3): [number, number, number] {
    return [p.x, p.y, p.z];
  }

  /**
   * An original length-valued outline in millimetres, with its source parameter preserved.
   *
   * Converts source station, scalar and parameter-endpoint lengths together by the metre-to-millimetre factor through the shared outline owner. Named knots and parameter identity survive without sampling. One linear knot copy and constant parameter conversion produce caller-owned data; the helper retains nothing and coordinates no effectful work.
   */
  function length(
    outline: IAutoMovieConstructionOutline,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieViewOutline.scale(outline, SCALE, SCALE);
  }

  /**
   * An original dimensionless outline, with only station and parameter-endpoint lengths converted to millimetres.
   *
   * Converts station and source-parameter endpoints once through the same owner as length outlines, preserving dimensionless values with a unit scalar factor. It neither scales a fullness share nor infers a parameter from sections. One linear knot copy and constant parameter conversion produce caller-owned data, with no retained state or effectful work to coordinate.
   */
  function share(
    outline: IAutoMovieConstructionOutline,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieViewOutline.scale(outline, SCALE, 1);
  }

  /** A scalar course of lengths in millimetres. */
  function knots(
    outline: IAutoMovieConstructionOutline,
  ): AutoMovieViewAxis.IAxisKnot1[] {
    return outline.knots.map(
      (k): AutoMovieViewAxis.IAxisKnot1 => ({
        station: k.station * SCALE,
        value: k.value * SCALE,
      }),
    );
  }

  /** A view's two edges in millimetres. */
  function pair(
    p: IAutoMovieConstructionOutlinePair,
  ): IAutoMovieViewPart.IPair {
    return { positive: length(p.positive), negative: length(p.negative) };
  }

  /** The fullness owner in the operator's records. */
  function fullness(
    f: AutoMovieConstructionFullness,
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
