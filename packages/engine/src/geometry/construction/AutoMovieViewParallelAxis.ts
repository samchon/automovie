import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieConstructionParallelAxis,
  IAutoMovieLoftFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewOutline,
  IAutoMovieViewParallelAxis,
} from "@automovie/interface";

import { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Parallel source planes: fixed chart axes translated by three admitted source-coordinate curves, independent of the origin course's tangent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source ownership, constant plane directions and the explicit admission/reading failure boundary.
 * @evidence contracts/development/design.md#principled-representation Represents Parallel source planes: fixed chart axes translated by three admitted source-coordinate curves, independent of the origin course's tangent: companion namespace of 6 members (`DECLARATIONS`, `IOrigin`, `create`, `from`, `source`, `copy`); units and frames named in its text: world, frame, second, metre, frames. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewParallelAxis` in packages/engine/src/geometry/construction/AutoMovieViewParallelAxis.ts; its surface is the 6 members listed and the text shows 11 other files naming it, mostly test (5), packages/human (4), packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewParallelAxis {
  /**
   * Original declarations keyed weakly by their actual prepared source axis.
   *
   * The weak identity lookup reuses the authored record without searching, sampling or rebuilding an interpolation. It contains only axes actually prepared from their declarations. Each live factory axis retains one copied declaration; a dead weak key releases that metadata. Public from/source own this serialization contract.
   */
  const DECLARATIONS: WeakMap<
    IAutoMovieViewAxis.IAxis,
    IAutoMovieConstructionParallelAxis
  > = new WeakMap();

  /**
   * Admit fixed planes and their original coordinate curves.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Requires finite orthonormal directions to binary64 roundoff and three admitted source curves, then places each origin directly from those curves without tangent transport.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns an ordinary source axis or the original basis/coordinate admission failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize an invalid basis or silently replace a failed coordinate; a later unrepresentable scalar query throws its original source failure for the caller to report.
   * @evidence contracts/development/common.md#meaningful-documentation Defines authored station, basis admission and source failure behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is linear in coordinate knots; at reads three value-only curves, while jet reads three value/parameter-jet records and constant coordinate transfers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Copies directions and prepares each source once; each analytic query reuses its source reading's value instead of reading all coordinates a second time.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closure lifetime owns the two three-component direction copies and three source preparations; each returned frame owns its vectors.
   */
  export function create(
    origin: IAutoMovieViewParallelAxis.IOrigin,
    u: AutoMovieVector3Tuple,
    v: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxis.IAxis | string {
    const U: AutoMovieVector3Tuple = [...u];
    const V: AutoMovieVector3Tuple = [...v];
    const tolerance: number = 64 * Number.EPSILON;
    if (
      ![...U, ...V].every(Number.isFinite) ||
      Math.abs(Math.hypot(...U) - 1) > tolerance ||
      Math.abs(Math.hypot(...V) - 1) > tolerance ||
      Math.abs(U[0] * V[0] + U[1] * V[1] + U[2] * V[2]) > tolerance
    )
      return "parallel chart directions must be finite, unit and perpendicular";
    const curves: IAutoMovieViewOutline.IOutline[] = [];
    for (const coordinate of ["x", "y", "z"] as const) {
      const source:
        | IAutoMovieViewOutline.IOutline
        | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
        origin[coordinate],
      );
      if ("detail" in source)
        return `parallel origin ${coordinate}: ${source.detail}`;
      curves.push(source);
    }
    const at: (station: number) => IAutoMovieLoftFrame.IFrame = (
      station: number,
    ): IAutoMovieLoftFrame.IFrame => {
      const point: AutoMovieVector3Tuple = [0, 0, 0];
      for (let c: number = 0; c < 3; c++) {
        const value: number | string = AutoMovieViewOutline.value(
          curves[c]!,
          station,
        );
        if (typeof value === "string")
          throw new Error(`parallel origin ${c}: ${value}`);
        point[c] = value;
      }
      return { origin: point, u: [...U], v: [...V] };
    };
    return {
      at,
      jet: (
        station: number,
        parameter?: IAutoMovieConstructionOutlineParameter,
      ): IAutoMovieViewAxisJet.IJet | null => {
        const point: AutoMovieVector3Tuple = [0, 0, 0];
        const first: AutoMovieVector3Tuple = [0, 0, 0];
        const second: AutoMovieVector3Tuple = [0, 0, 0];
        for (let c: number = 0; c < 3; c++) {
          const reading: IAutoMovieViewOutline.IReading | string =
            AutoMovieViewOutline.at(curves[c]!, station);
          if (typeof reading === "string") {
            const value: number | string = AutoMovieViewOutline.value(
              curves[c]!,
              station,
            );
            if (typeof value === "string")
              throw new Error(`parallel origin ${c}: ${value}`);
            return null;
          }
          const transfer: [number, number] | null =
            AutoMovieViewParameter.transferJet(
              curves[c]!.parameter,
              parameter,
              station,
            );
          if (transfer === null) return null;
          point[c] = reading.value;
          first[c] = reading.parameterJet[0] * transfer[0];
          second[c] =
            reading.parameterJet[1] * transfer[0] * transfer[0] +
            reading.parameterJet[0] * transfer[1];
        }
        if (![...first, ...second].every(Number.isFinite)) return null;
        return AutoMovieViewAxisJet.fixed(
          { origin: point, u: [...U], v: [...V] },
          first,
          second,
        );
      },
    };
  }

  /**
   * Prepare the source axis from its authoritative metre declaration, retaining that same declaration for tree serialization.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies the declared coordinate curves and basis, converts each station/value/parameter endpoint to millimetres once, and prepares the actual frame from that copied source.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source evaluation and later serialization share one authoritative declaration rather than reverse-engineering an axis function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not sample frames, invent knots or infer a parameter; a failed source remains its builder failure.
   * @evidence contracts/development/common.md#meaningful-documentation States metre input, millimetre evaluation and exact declaration ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear copying/conversion in the coordinate knot count plus the three source preparations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Retains the original declaration on the prepared axis so serialization does not reevaluate its course.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One copied declaration belongs to each live axis through a WeakMap key; failed preparations retain nothing and dead axes release their metadata.
   */
  export function from(
    declaration: IAutoMovieConstructionParallelAxis,
  ): IAutoMovieViewAxis.IAxis | string {
    const original: IAutoMovieConstructionParallelAxis = copy(declaration);
    const axis: IAutoMovieViewAxis.IAxis | string = create(
      {
        x: AutoMovieViewOutline.scale(original.origin.x, 1000, 1000),
        y: AutoMovieViewOutline.scale(original.origin.y, 1000, 1000),
        z: AutoMovieViewOutline.scale(original.origin.z, 1000, 1000),
      },
      [original.u.x, original.u.y, original.u.z],
      [original.v.x, original.v.y, original.v.z],
    );
    if (typeof axis !== "string") DECLARATIONS.set(axis, original);
    return axis;
  }

  /**
   * Copy the actual declaration of an axis prepared by from; return null for an arbitrary or other-kind axis.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads only factory-owned source metadata under the actual axis identity, preserving coordinate knots and parameters without observing final frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A nullable typed declaration distinguishes exact source preservation from an unsupported black-box reconstruction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer a declaration by sampling or expose mutable factory metadata.
   * @evidence contracts/development/common.md#meaningful-documentation States the supported producer and null meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant lookup plus O(n) source copying on success.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the retained authoritative source; it does not rerun interpolation or frame transport.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh declaration owned by the caller; the WeakMap retains no strong axis key.
   */
  export function source(
    axis: IAutoMovieViewAxis.IAxis,
  ): IAutoMovieConstructionParallelAxis | null {
    const original: IAutoMovieConstructionParallelAxis | undefined =
      DECLARATIONS.get(axis);
    return original === undefined ? null : copy(original);
  }

  /**
   * Copy one source declaration without converting its metre units.
   *
   * Copies every coordinate knot list, parameter record and basis to isolate retained metadata and returned declarations from caller mutation. No numeric input is fitted, sampled or replaced. O(n) copying in coordinate knot count produces fresh caller-owned curves and fixed-size basis records; it cannot alias an earlier mutable ownership copy.
   */
  function copy(
    declaration: IAutoMovieConstructionParallelAxis,
  ): IAutoMovieConstructionParallelAxis {
    return {
      type: "parallel",
      origin: {
        x: AutoMovieViewOutline.scale(declaration.origin.x, 1, 1),
        y: AutoMovieViewOutline.scale(declaration.origin.y, 1, 1),
        z: AutoMovieViewOutline.scale(declaration.origin.z, 1, 1),
      },
      u: { ...declaration.u },
      v: { ...declaration.v },
    };
  }
}
