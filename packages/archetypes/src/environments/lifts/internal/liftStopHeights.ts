import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieEnvironmentModule, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../../core/AutoMovieArchetypeFrame";
import type { AutoMovieEnvironment } from "../../AutoMovieEnvironment";

/*
 * Resolve named stops on an upright shaft, in increasing local height. A
 * referenced sill must coincide with the local vertical axis and its +Z
 * direction must face the same landing as the lift. A numeric stop gives its
 * local height directly. A result never changes the shaft's scale.
 */
export function liftStopHeights(
  context: IAutoMovieEnvironmentModule.IContext,
  stops: AutoMovieEnvironment.ILiftProps["stops"],
  doorHeight: number,
): liftStopHeights.IStop[] {
  const up: IAutoMovieVector3 = Vector3.create(0, 1, 0);
  if (
    Vector3.distance(AutoMovieArchetypeFrame.axis(context.frame, "y"), up) >
    ALIGNMENT
  )
    throw new Error(`Lift ${context.id} must be upright.`);
  const inverse = Quaternion.inverse(context.frame.rotation);
  const forward: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
    context.frame,
    "z",
  );
  const result: liftStopHeights.IStop[] = Object.entries(stops).map(
    ([id, value]: [
      string,
      AutoMovieEnvironment.ILiftStop,
    ]): liftStopHeights.IStop => {
      const label: string = `Lift ${context.id} stop ${id}`;
      if (id.trim() !== id || id.length === 0 || id.includes("/"))
        throw new Error(`Lift ${context.id} has an invalid stop name: ${id}.`);
      const local: IAutoMovieVector3 = (() => {
        if (typeof value === "number") return Vector3.create(0, value, 0);
        const anchor: IAutoMovieTransform = context.anchor(value.anchor);
        if (
          Vector3.distance(AutoMovieArchetypeFrame.axis(anchor, "y"), up) >
            ALIGNMENT ||
          Vector3.distance(AutoMovieArchetypeFrame.axis(anchor, "z"), forward) >
            ALIGNMENT
        )
          throw new Error(
            `${label} sill must face the same upright landing as the shaft.`,
          );
        return Quaternion.rotateVector(
          inverse,
          Vector3.subtract(anchor.translation, context.frame.translation),
        );
      })();
      if (Math.hypot(local.x, local.z) > ALIGNMENT)
        throw new Error(`${label} sill must lie on the shaft's vertical axis.`);
      return { id, height: local.y };
    },
  );
  if (result.length < 2)
    throw new Error(`Lift ${context.id} requires at least two stops.`);
  result.sort(
    (a: liftStopHeights.IStop, b: liftStopHeights.IStop): number =>
      a.height - b.height,
  );
  for (let i: number = 1; i < result.length; ++i) {
    const before: liftStopHeights.IStop = result[i - 1]!;
    const next: liftStopHeights.IStop = result[i]!;
    const rise: number = next.height - before.height;
    if (rise <= doorHeight)
      throw new Error(
        `Lift ${context.id} stops ${before.id} and ${next.id} need more than ${doorHeight} metres between sills for distinct openings.`,
      );
  }
  return result;
}

/*
 * The resolved layout record shared by lift geometry and clip lowering.
 */
export namespace liftStopHeights {
  /*
   * One stop of an upright shaft in its authored local frame. The model and
   * clip builders share the stop name and admitted metre height.
   */
  export interface IStop {
    /*
     * Unique stop name within the lift.
     */
    id: string;

    /*
     * Elevation of the cab sill in shaft-local metres.
     */
    height: number;
  }
}

/*
 * Metre or unit-axis proximity used only to recognize equivalent authoring
 * frames.
 */
const ALIGNMENT: number = 1e-6;
