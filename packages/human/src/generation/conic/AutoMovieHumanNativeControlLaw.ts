import {
  AutoMovieViewAxisJet,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
} from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
  IAutoMovieHumanNativeControlLaw,
} from "@automovie/interface";

/**
 * Share of an outline's extent E (its largest knot magnitude) within which a junction's bound value, station slope (per mm) and station
 * second derivative (per mm squared) must equal the changed source's: E·1e-9, E·1e-9 /mm and E·1e-9 /mm².
 *
 * Basis. The bound jet is written into a knot whose neighbours stand about 1 mm away (f1's source stations), and a value step δ blended
 * over a gap g by the quintic bends the wall by at most (10/√3)·δ/g². At 1e-9 of a 166 mm half-breadth every order adds under 1e-6 /mm,
 * 1e-4 of the wall's own 0.012 to 0.023 /mm (its 43 to 86 mm radii). Both readings are one law read by two owners, so coordinates agree
 * to binary64 rounding, about 1e-13 of E, and an anisotropic tangent angle to its two quintics' truncation between source knots, sixth
 * order in their spacing; the 0.064 mm step (4e-4 of E) that made a -3.9 /mm ridge at f1's underbust site under knot-sampled scaling
 * stands 4e5 above.
 */
const JUNCTION_AGREEMENT: number = 1e-9;

/** Native control operations in physical millimetres, before any loft. */
export namespace AutoMovieHumanNativeControlLaw {
  /** The precise source interval or junction protected during scaling. */
  export type IProtection = IAutoMovieHumanNativeControlLaw.IProtection;
  /**
   * Transform a complete planar original by positive directional scale and centre translation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A diagonal affine map carries every conic point and tangent while retaining its dimensionless shoulder; inputs share one physical section plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One point/tangent pass owns the whole conic rather than four extremes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source curves are transformed before realization; the increment form and identity branch preserve zero change without distant-centre cancellation.
   * @evidence contracts/development/common.md#meaningful-documentation Names the plane, units, complete controls and positive-scale premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear time and storage in the control count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An identity request borrows the whole original, including shoulders, guides and tangent owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned controls belong to the invocation with no retained cache.
   */
  export function section(
    original: IAutoMovieHumanConicSection.IChain,
    centre: AutoMovieVector2Tuple,
    delta: AutoMovieVector2Tuple,
    scale: AutoMovieVector2Tuple,
  ): IAutoMovieHumanConicSection.IChain {
    if (
      ![...centre, ...delta, ...scale].every(Number.isFinite) ||
      !scale.every((value: number): boolean => value > 0)
    )
      throw new Error("section requires finite coordinates and positive scale");
    if (delta[0] === 0 && delta[1] === 0 && scale[0] === 1 && scale[1] === 1)
      return original;
    return {
      guides: original.guides,
      input: {
        ...original.input,
        points: original.input.points.map(
          (point: AutoMovieVector2Tuple): AutoMovieVector2Tuple => [
            point[0] + delta[0] + (scale[0] - 1) * (point[0] - centre[0]),
            point[1] + delta[1] + (scale[1] - 1) * (point[1] - centre[1]),
          ],
        ),
        tangents: original.input.tangents.map(
          (point: AutoMovieVector2Tuple): AutoMovieVector2Tuple => [scale[0] * point[0], scale[1] * point[1]],
        ),
      },
    };
  }

  /**
   * Generate a skin-owned proximal course and its C2 handoff to the independent bone course.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The endpoint-flat quintic chooses skin through rail and bone past release; analytic product rules supply physical2. The two sources must declare the same oriented section planes; other plane rotations are refused rather than linearly blending a nonorthonormal basis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weight reader serves at and jet; existing AxisJet.parameter converts the resulting physical jet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Inputs are original axis definitions, not completed child curves, projected extremes or a final mesh; missing physical2 stays null and incompatible section bases are refused.
   * @evidence contracts/development/common.md#meaningful-documentation Names physical mm, the root/rail/release ordering and the parallel-plane scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic per axis read and one bounded closure at creation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Identical skin/bone owners return that exact axis; otherwise both readers are borrowed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the weight/axis closure and its two borrowed definitions, without a global cache.
   */
  export function root(
    skin: IAutoMovieViewAxis.IAxis,
    bone: IAutoMovieViewAxis.IAxis,
    rail: number,
    release: number,
  ): IAutoMovieViewAxis.IAxis {
    if (!(Number.isFinite(rail) && Number.isFinite(release) && release > rail))
      throw new Error("root release must follow its finite rail");
    if (skin === bone) return skin;
    const weight = (station: number): readonly [number, number, number] => {
      if (station <= rail) return [0, 0, 0];
      if (station >= release) return [1, 0, 0];
      const length: number = release - rail;
      const t: number = (station - rail) / length;
      return [
        t * t * t * (10 + t * (-15 + 6 * t)),
        (30 * t * t * (1 - t) ** 2) / length,
        (60 * t * (1 - t) * (1 - 2 * t)) / length ** 2,
      ];
    };
    const compatible = (
      a: IAutoMovieLoftSectionFrame,
      b: IAutoMovieLoftSectionFrame,
    ): void => {
      if (
        ![...a.origin, ...b.origin, ...a.u, ...a.v, ...b.u, ...b.v].every(
          Number.isFinite,
        ) ||
        ![0, 1, 2].every(
          (k: number): boolean =>
            Math.abs(a.u[k]! - b.u[k]!) <= 64 * Number.EPSILON &&
            Math.abs(a.v[k]! - b.v[k]!) <= 64 * Number.EPSILON,
        )
      )
        throw new Error(
          "root skin and bone require the same finite oriented section planes",
        );
    };
    return {
      at: (station: number): IAutoMovieLoftSectionFrame => {
        // Past the release the course is the bone's alone: the skin course is not read there, so the two need one set of
        // section planes only where both contribute. A person's knee turns at another arclength than the original's, and
        // the two courses' planes differ through that turn although the skin's weight is nothing there.
        if (station >= release) return bone.at(station);
        const a: IAutoMovieLoftSectionFrame = skin.at(station);
        const b: IAutoMovieLoftSectionFrame = bone.at(station);
        compatible(a, b);
        const h: number = weight(station)[0];
        return {
          origin: a.origin.map(
            (x: number, k: number): number => x + h * (b.origin[k]! - x),
          ) as [number, number, number],
          u: b.u,
          v: b.v,
        };
      },
      jet: (station: number, parameter): IAutoMovieViewAxisJet.IJet | null => {
        if (station >= release) return bone.jet?.(station, parameter) ?? null;
        const a: IAutoMovieViewAxisJet.IJet | null = skin.jet?.(station) ?? null;
        const b: IAutoMovieViewAxisJet.IJet | null = bone.jet?.(station) ?? null;
        if (a === null || b === null) return null;
        compatible(a.value, b.value);
        const [h, h1, h2]: readonly [number, number, number] = weight(station);
        const origin = (order: 0 | 1 | 2): [number, number, number] =>
          [0, 1, 2].map((k: number): number => {
            const d: number = b.value.origin[k]! - a.value.origin[k]!;
            const d1: number = b.first.origin[k]! - a.first.origin[k]!;
            const d2: number = b.second.origin[k]! - a.second.origin[k]!;
            return order === 0
              ? a.value.origin[k]! + h * d
              : order === 1
                ? a.first.origin[k]! + h1 * d + h * d1
                : a.second.origin[k]! + h2 * d + 2 * h1 * d1 + h * d2;
          }) as [number, number, number];
        return AutoMovieViewAxisJet.parameter(
          {
            value: { origin: origin(0), u: b.value.u, v: b.value.v },
            first: { origin: origin(1), u: b.first.u, v: b.first.v },
            second: { origin: origin(2), u: b.second.u, v: b.second.v },
          },
          parameter,
          station,
        );
      },
    };
  }

  /**
   * A skin-owned attachment's entire course follows its resolved skin datum.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Mammary/nasal source courses have no independent distal bone support; borrowing the whole skin-defined axis carries their tip and complete plane2 with that root.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The same explicit source policy is consumed by the real field law and its translated-root/free-course scenario.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hidden bone handoff pins a free mound tip or compensates its source later.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a skin-owned course from the independent bony limb handoff.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work with no allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the exact resolved skin course and its actual derivatives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the borrowed course lifetime; no extra state is retained.
   */
  export function skinCourse(
    skin: IAutoMovieViewAxis.IAxis,
  ): IAutoMovieViewAxis.IAxis {
    return skin;
  }
  /**
   * Preserve an original scalar interval through native shared-jet quintic interpolation, or bind a junction.
   *
   * A junction is a binding, never an overwrite: the original's value and station 2-jet at its station must equal the changed source's
   * within {@link JUNCTION_AGREEMENT} of the outline's extent, or it is refused with both readings. An admitted junction then holds the
   * original's reading at its knot, which that tolerance keeps from bending the wall. A junction written over a disagreeing changed
   * source spans only the gap to the nearest changed knot, so a step of δ there makes a second derivative of about 5.8 δ / gap²:
   * 0.9 mm across f1's 1 mm source stations made a -3.5 /mm ridge at the bust site. An interval's two ends are not checked this way.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Retains every original knot in the protected interval and its actual parameter2, transferred analytically into the changed source parameter and normalized by its new whole span. Shared endpoint jets preserve the original cubic spans and C2 joins. A junction compares the two sources' value and station jets at its station (transferred parameter jets at a singular endpoint) and refuses a disagreement instead of writing it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Original and changed sources are admitted once; one sorted union supplies every explicit native knot jet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads original scalar functions rather than a loft, refuses unavailable parameter transfer and retains source pole/parameter ownership.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes actual source interpolation from held knot values.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n log n) union ordering plus native O(n) preparation and O(log n) scalar reads; storage is O(n).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Identical source identity is borrowed only after request/domain admission and actual native parameter/pole-binding equivalence; a different valid junction binding uses the same analytic transfer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No source or evaluator is retained beyond the caller-owned result.
   */
  export function outline(
    original: IAutoMovieViewPart.IOutline,
    changed: IAutoMovieViewPart.IOutline,
    request: IProtection,
    originalEnds: IAutoMovieViewOutline.IEnds = {},
    changedEnds: IAutoMovieViewOutline.IEnds = {},
  ): IAutoMovieViewPart.IOutline {
    const held: readonly [number, number] =
      request.type === "interval"
        ? request.domain
        : [request.station, request.station];
    if (
      !(
        Number.isFinite(held[0]) &&
        Number.isFinite(held[1]) &&
        (request.type === "junction" || held[1] > held[0])
      )
    )
      throw new Error(
        "protected source interval/junction must be finite and ordered",
      );
    const old: IAutoMovieViewOutline.IOutline | IAutoMovieViewOutline.IFailure =
      AutoMovieViewOutline.create(original, originalEnds);
    const next: IAutoMovieViewOutline.IOutline | IAutoMovieViewOutline.IFailure =
      AutoMovieViewOutline.create(changed, changedEnds);
    if ("contract" in old) throw new Error(old.detail);
    if ("contract" in next) throw new Error(next.detail);
    const sameParameter: boolean =
      old.parameter === undefined
        ? next.parameter === undefined
        : next.parameter !== undefined &&
          (old.parameter.type === "root"
            ? next.parameter.type === "root" &&
              old.parameter.pole === next.parameter.pole &&
              old.parameter.end === next.parameter.end
            : next.parameter.type === "angle" &&
              old.parameter.bottom === next.parameter.bottom &&
              old.parameter.top === next.parameter.top);
    if (request.type === "interval" && !sameParameter)
      throw new Error(
        "exact interval preservation requires the same native polynomial parameter; use an explicit junction for a single boundary2",
      );
    if (
      held[0] < old.domain[0] ||
      held[1] > old.domain[1] ||
      held[0] < next.domain[0] ||
      held[1] > next.domain[1]
    )
      throw new Error("protected interval leaves an original source domain");
    if (original === changed && sameParameter) return original;
    const span: number =
      AutoMovieViewParameter.at(
        next.parameter,
        Math.max(next.domain[1], held[1]),
      ) -
      AutoMovieViewParameter.at(
        next.parameter,
        Math.min(next.domain[0], held[0]),
      );
    if (!(Number.isFinite(span) && span > 0))
      throw new Error("changed native source span is not representable");

    // A junction binds a boundary the changed source already holds; it never writes a different value over it. Station is the one
    // parameter both sources share, so the two readings are compared as value, slope per mm and second derivative per mm squared. At
    // a singular parameter endpoint, where no station jet exists, the original's parameter jet is transferred into the changed parameter.
    if (request.type === "junction") {
      const station: number = request.station;
      const bound: IAutoMovieViewOutline.IReading | string =
        AutoMovieViewOutline.at(old, station);
      const free: IAutoMovieViewOutline.IReading | string =
        AutoMovieViewOutline.at(next, station);
      const transfer: [number, number] | null =
        AutoMovieViewParameter.transferJet(
          old.parameter,
          next.parameter,
          station,
        );
      if (typeof bound === "string" || typeof free === "string" || transfer === null)
        throw new Error("protected junction parameter2 unavailable at " + station);
      const boundJet: readonly [number, number] | null = bound.stationJet;
      const freeJet: readonly [number, number] | null = free.stationJet;
      const regular: boolean = boundJet !== null && freeJet !== null;
      const [a, b]: [number, number] = transfer;
      const expected: number[] =
        boundJet !== null && freeJet !== null
          ? [bound.value, boundJet[0], boundJet[1]]
          : [
              bound.value,
              bound.parameterJet[0] * a,
              bound.parameterJet[1] * a * a + bound.parameterJet[0] * b,
            ];
      const actual: number[] =
        boundJet !== null && freeJet !== null
          ? [free.value, freeJet[0], freeJet[1]]
          : [free.value, free.parameterJet[0], free.parameterJet[1]];
      const extent: number = Math.max(
        ...[...old.knots, ...next.knots].map(
          (k: IAutoMovieViewPart.IKnot): number => Math.abs(k.value),
        ),
      );
      const limit: number = JUNCTION_AGREEMENT * extent;
      if (
        !expected.every(
          (x: number, k: number): boolean =>
            Number.isFinite(x) && Math.abs(x - actual[k]!) <= limit,
        )
      )
        throw new Error(
          `protected junction at ${station} disagrees with the changed source beyond ${limit} (extent ${extent}, ` +
            `${regular ? "station" : "changed-parameter"} derivatives): ` +
            `target value/slope/second ${expected.join("/")} against function ${actual.join("/")}; ` +
            "a junction binds a boundary the changed source already holds and never overwrites it",
        );
    }
    const stations: number[] = [
      ...new Set([
        ...changed.knots.map(
          (k: IAutoMovieViewPart.IKnot): number => k.station,
        ),
        ...(request.type === "interval"
          ? old.knots
              .filter(
                (k: IAutoMovieViewPart.IKnot): boolean =>
                  k.station >= held[0] && k.station <= held[1],
              )
              .map((k: IAutoMovieViewPart.IKnot): number => k.station)
          : []),
        ...held,
      ]),
    ].sort((a: number, b: number): number => a - b);
    const knots: IAutoMovieViewPart.IKnot[] = stations.map(
      (station: number): IAutoMovieViewPart.IKnot => {
        const keep: boolean = station >= held[0] && station <= held[1];
        const owner: IAutoMovieViewOutline.IOutline = keep ? old : next;
        const read: IAutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(owner, station);
        const transfer: [number, number] | null =
          AutoMovieViewParameter.transferJet(
            owner.parameter,
            next.parameter,
            station,
          );
        if (typeof read === "string" || transfer === null)
          throw new Error(
            "protected source parameter2 unavailable at " + station,
          );
        const [a, b]: [number, number] = transfer;
        const first: number = read.parameterJet[0] * a * span;
        const second: number =
          (read.parameterJet[1] * a * a + read.parameterJet[0] * b) *
          span *
          span;
        if (![read.value, first, second].every(Number.isFinite))
          throw new Error("protected source normalized2 is not representable");
        return {
          site: (keep ? "held." : "new.") + station,
          station,
          value: read.value,
          jet: { first, second },
        };
      },
    );
    return {
      ...changed,
      ...(next.parameter === undefined ? {} : { parameter: next.parameter }),
      knots,
    };
  }
}
