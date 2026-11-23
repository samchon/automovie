import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentModule,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import type { createLift } from "./createLift";

/** Metre or unit-axis proximity used only to recognize equivalent authoring frames. */
const ALIGNMENT: number = 1e-6;

/**
 * Resolve named stops on an upright shaft, in increasing local height.
 * A referenced sill must coincide with the local vertical axis and its +Z
 * direction must face the same landing as the lift. A numeric stop gives
 * its local height directly. A result never changes the shaft's scale.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the input and output frames and explains stops and their refusal conditions.
 * @evidence contracts/development/implementation.md#principled-implementation Projects anchor positions onto the rigid shaft basis and checks horizontal residual and axis alignment at 1e-6 m and unit-vector distance. A level's y is a projection, not a nearest-floor search.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve a stop and check the sorted floor intervals. The exterior geometry receives the admitted values.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses contradictory anchor geometry, names and storey heights without changing the supplied placement or car.
 * @evidence contracts/development/implementation.md#efficient-algorithms One anchor lookup per referenced stop, O(N log N) sort and one interval pass for N stops.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Callers place each lift once and owning context supplies the shared anchor lookup.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one sorted row per stop and retains no reference resolver.
 */
export function liftStopHeights(
  context: IAutoMovieEnvironmentModule.IContext,
  stops: createLift.IProps["stops"],
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
    ([id, value]: [string, createLift.Stop]): liftStopHeights.IStop => {
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
      if (
        ![local.x, local.y, local.z].every(Number.isFinite) ||
        Math.hypot(local.x, local.z) > ALIGNMENT
      )
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
    if (!Number.isFinite(rise) || rise <= doorHeight)
      throw new Error(
        `Lift ${context.id} stops ${before.id} and ${next.id} need more than ${doorHeight} metres between sills for distinct openings.`,
      );
  }
  return result;
}

/**
 * The resolved layout record shared by lift geometry and clip lowering.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies admitted stop data and its two consumers.
 * @evidence contracts/development/design.md#principled-representation A stop is named and measured from the fixed shaft frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the result type at the point where it is checked.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no duplicate world transform or inferred coordinate.
 */
export namespace liftStopHeights {
  /**
   * One stop of an upright shaft in its authored local frame.
   * The model and clip builders share the stop name and admitted metre height.
   */
  export interface IStop {
    /** Unique stop name within the lift. */
    id: string;

    /** Elevation of the cab sill in shaft-local metres. */
    height: number;
  }
}
