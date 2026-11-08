import {
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine/geometry/curve";
import type { IAutoMovieRecoveryHermiteCurve } from "@automovie/recovery";

import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/**
 * Display-only scaffolds for one actual saved polynomial cubic span in its original mm frame.
 * Hermite handles use the engine's exact same-parameter basis conversion and original phase width.
 * Control points need not lie on the curve. The box is the control hull's axis-aligned bound in
 * this frame, not a tight curve bound or a bound after a nonlinear placement. No source is fitted.
 * All returned lines use the existing metre display contract; source arrays remain borrowed.
 */
export namespace HumanInspectionCurveScaffold {
  /** Original supported coefficients, without admitting rational or higher-degree sources. */
  export type Curve = C.Cubic | IAutoMovieRecoveryHermiteCurve;

  /** One finite span's separate source and authoring aids. */
  export interface Result {
    /** The original curve's display samples, not a generated anatomical curve. */
    curve: N.Curve;

    /** Polygon, endpoint handles, control markers and hull box, with distinct stable ids. */
    aids: N.Curve[];

    /** Exact converted controls in the unchanged original mm frame. */
    controlsMm: C.Span;

    /** Convex-hull box, sufficient only in this polynomial coordinate frame. */
    boundsMm: { minimum: C.Vector; maximum: C.Vector };

    /** Original parameter width, in the source's declared phaseUnit. */
    phaseWidth: number;
  }

  /**
   * Make the requested span's controls visible on demand. Fixed 64 display chords carry no
   * tessellation-error promise. Cross markers are a display-size choice; zero handles remain
   * zero and publish no invented tangent direction. O(1) fixed-degree work retains no cache.
   */
  export function of(source: Curve, spanIndex: number): Result {
    if (
      !["cubicHermite", "cubicBezier"].includes(source.type) ||
      source.unit !== "mm" ||
      !Number.isSafeInteger(spanIndex) ||
      spanIndex < 0 ||
      spanIndex >= source.spans.length
    )
      throw new Error("Select one actual polynomial cubic span in millimetres");
    const width: number = source.phaseIntervals[spanIndex]!;
    if (!(width > 0 && Number.isFinite(width)))
      throw new Error("The original positive finite phase width is required");
    let controls: M.Span;
    if (source.type === "cubicHermite") {
      const span: IAutoMovieRecoveryHermiteCurve["spans"][number] =
        source.spans[spanIndex]!;
      [span.start, span.end, span.startDerivative, span.endDerivative].forEach(
        vector,
      );
      controls = M.hermite(
        M.clone(span.start),
        M.clone(span.end),
        M.clone(span.startDerivative),
        M.clone(span.endDerivative),
        width,
      );
    } else {
      const span: C.Span = source.spans[spanIndex]!;
      if (!Array.isArray(span) || span.length !== 4)
        throw new Error("Exactly four polynomial cubic controls are required");
      span.forEach(vector);
      controls = [
        M.clone(span[0]),
        M.clone(span[1]),
        M.clone(span[2]),
        M.clone(span[3]),
      ];
    }
    controls.forEach(vector);
    const minimum: M.V = [0, 0, 0];
    const maximum: M.V = [0, 0, 0];
    for (let axis: number = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(
        ...controls.map((point: M.V): number => point[axis]!),
      );
      maximum[axis] = Math.max(
        ...controls.map((point: M.V): number => point[axis]!),
      );
    }
    const prefix: string = "reference." + source.name + "/span." + spanIndex;
    const aids: N.Curve[] = [
      line(prefix + "/control-polygon", controls, "b8860b"),
    ];
    aids.push(
      line(
        prefix + "/start-tangent-handle",
        [controls[0], controls[1]],
        "008b8b",
      ),
    );
    aids.push(
      line(
        prefix + "/end-tangent-handle",
        [controls[2], controls[3]],
        "008b8b",
      ),
    );

    // The hull box remains in the same fixed spatial frame as the saved reference coefficients.
    const corners: M.V[] = Array.from(
      { length: 8 },
      (_value: unknown, index: number): M.V => [
        (index & 1) === 0 ? minimum[0] : maximum[0],
        (index & 2) === 0 ? minimum[1] : maximum[1],
        (index & 4) === 0 ? minimum[2] : maximum[2],
      ],
    );
    for (let index: number = 0; index < 8; index++)
      for (let axis: number = 0; axis < 3; axis++)
        if ((index & (1 << axis)) === 0)
          aids.push(
            line(
              prefix + "/box." + index + "." + axis,
              [corners[index]!, corners[index | (1 << axis)]!],
              "9aa2ad",
            ),
          );
    const marker: number = Math.max(
      Math.hypot(
        ...maximum.map(
          (value: number, axis: number): number => value - minimum[axis]!,
        ),
      ) * 0.012,
      0.01,
    );
    controls.forEach((point: C.Vector, index: number): void => {
      for (let axis: number = 0; axis < 3; axis++) {
        const before: M.V = M.clone(point);
        const after: M.V = M.clone(point);
        before[axis] = before[axis]! - marker;
        after[axis] = after[axis]! + marker;
        aids.push(
          line(
            prefix + "/control." + index + "." + axis,
            [before, after],
            index === 0 || index === 3 ? "2367ba" : "b8860b",
          ),
        );
      }
    });
    return {
      curve: line(
        prefix + "/source",
        Array.from(
          { length: 65 },
          (_value: unknown, index: number): C.Vector =>
            M.cubic(controls, index / 64),
        ),
        "2367ba",
      ),
      aids,
      controlsMm: controls,
      boundsMm: { minimum, maximum },
      phaseWidth: width,
    };
  }

  /** Require finite complete triples before conversion or rendering. */
  function vector(value: unknown): asserts value is C.Vector {
    if (
      !Array.isArray(value) ||
      value.length !== 3 ||
      ![0, 1, 2].every(
        (axis: number): boolean =>
          Object.hasOwn(value, axis) &&
          typeof value[axis] === "number" &&
          Number.isFinite(value[axis]),
      )
    )
      throw new Error("Finite three-component curve coefficients are required");
  }

  /** One display line converts mm to metres exactly once and never closes a single span. */
  function line(
    id: string,
    points: readonly C.Vector[],
    colour: string,
  ): N.Curve {
    return {
      id,
      closed: false,
      colour,
      points: points.map(
        (point: C.Vector): N.Point => [
          point[0] / 1000,
          point[1] / 1000,
          point[2] / 1000,
        ],
      ),
    };
  }
}
