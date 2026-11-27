import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Refuse a surface shorter than the body or narrower than its shoulders, with
 * the room each lacks.
 * Parameter body: The body's stature, upper arm radius and rest shoulders.
 * Parameter surface: The lying surface, its depth the length and its width.
 * Parameter margin: The room kept at the head, the feet and either side, metres.
 * On `length` for a surface too short, on `width` for
 * one too narrow.
 */
export function lieOnSurfaceFits(
  body: lieOnSurfaceFits.IBody,
  surface: Pick<IAutoMovieAffordance, "depth" | "width">,
  margin: number,
): void {
  const length: number = surface.depth ?? 0;
  const width: number = surface.width ?? 0;
  const tall: number = body.measure.stature + margin;
  const broad: number =
    Vector3.distance(
      body.rest.get("leftUpperArm")!,
      body.rest.get("rightUpperArm")!,
    ) +
    2 * body.measure.upperArmRadius +
    2 * margin;
  if (length < tall)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "length",
      value: length,
      feasible: { kind: "range", minimum: tall, maximum: null, unit: "m" },
      reason: `the surface is ${(length * 1000).toFixed(0)} mm long, ${((tall - length) * 1000).toFixed(0)} mm short of this body lying`,
      fix: "use a longer bed or sofa",
    });
  if (width < broad)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "width",
      value: width,
      feasible: { kind: "range", minimum: broad, maximum: null, unit: "m" },
      reason: `the surface is ${(width * 1000).toFixed(0)} mm wide, ${((broad - width) * 1000).toFixed(0)} mm narrower than these shoulders need`,
      fix: "use a wider bed or sofa",
    });
}

/*
 * What a surface's fit reads of a body.
 */
export namespace lieOnSurfaceFits {
  /*
   * The body's stature, upper arm radius and rest shoulders.
   */
  export interface IBody {
    /*
     * The stature and the upper arm's radius, metres.
     */
    measure: Pick<IAutoMovieBodyMeasure, "stature" | "upperArmRadius">;

    /*
     * The rest joints, the shoulders among them, world metres.
     */
    rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
  }
}
