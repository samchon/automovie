import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  struckSurface
} from "../../../../../packages/motions/src/tasks/internal/struckSurface";
import { TestValidator } from "@nestia/e2e";

/** A struck surface contact turned by a rotation in its prop's frame. */
const surface = (
  id: string,
  rotation: IAutoMovieQuaternion,
): IAutoMovieAffordance => ({
  id,
  kind: "surface",
  frame: {
    translation: { x: 0, y: 0.9, z: 0 },
    rotation,
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
});

/** A prop's reader, the prop standing still unturned. */
const reader = (
  prop: Partial<IAutoMovieMotionHumanProp>,
): IAutoMovieMotionHumanPropReader => {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0.5 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  return {
    prop: { subject: "drum", frame, points: {}, ...prop },
    frame: (): IAutoMovieRigidTransform => frame,
  };
};

/**
 * `cymbalStrike` and `sideDrumStrike` admit their struck surface the same way
 * (`struckSurface`): the named `surface` contact (a cymbal's `edge`, a drum's
 * `head`) of a fixed, still prop, facing straight up at the action's start.
 *
 * Scenarios:
 *
 * 1. A fixed drum's level `head` is admitted.
 * 2. The same drum loose, its head tilted 10 degrees, or asked for an `edge` it
 *    lacks, is not.
 */
export function test_motions_tasks_struck_surface(): void {
  const level: IAutoMovieAffordance = surface("head", {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  });
  const tilted: IAutoMovieAffordance = surface(
    "head",
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 10),
  );
  TestValidator.predicate(
    "the level fixed head",
    struckSurface(reader({ fixed: true, affordances: [level] }), 0, "head") ===
      level,
  );
  TestValidator.equals(
    "loose, tilted or missing",
    [
      struckSurface(reader({ affordances: [level] }), 0, "head"),
      struckSurface(reader({ fixed: true, affordances: [tilted] }), 0, "head"),
      struckSurface(reader({ fixed: true, affordances: [level] }), 0, "edge"),
    ],
    [undefined, undefined, undefined],
  );
}
