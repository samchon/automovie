import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { prepareInstancePosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * A quarter turn and the fixture's position additions fit within 64 binary64
 * rounding units at the largest component, 9 m. The angle values are exact
 * input degrees and their differences fit in the same absolute allowance.
 */
const ROUNDING: number = 64 * Number.EPSILON * 9;

/**
 * Copy only the admissible rigid part of another member's posed motion.
 *
 * Scenarios:
 *
 * 1. A half-second lag offsets the template's translation and turns +Z into +X for
 *    the left arm's world goal. The bone-relative right arm stays local.
 * 2. A different body identity, absent reader or 2 degree template turn is refused
 *    before a posture is sampled.
 */
export function test_unit_motions_ensemble_instance_posture(): void {
  const body: object = {};
  const local: IAutoMovieHumanLimbGoal = {
    on: "chest",
    point: { x: 1, y: 2, z: 3 },
    bend: { x: 4, y: 5, z: 6 },
  };
  const posture = (time: number): IAutoMovieMotionHumanPosture => {
    const x: number = 2 + (time - 9.5);
    return {
      root: { x, y: 1, z: 3 },
      yaw: 0,
      pitch: 5,
      roll: 2,
      joints: {},
      limbs: {
        leftArm: {
          point: { x, y: 2, z: 4 },
          bend: { x: x + 1, y: 3, z: 3 },
          planted: true,
        },
        rightArm: local,
      },
    };
  };
  const inputs: prepareInstancePosture.IInput<object> = {
    name: "front",
    template: { body, posture },
    body,
    entered: { root: { x: 5, y: 9, z: 6 }, yaw: 90 },
    start: 10,
    duration: 1,
    lag: 0.5,
    turnLimit: 1,
    rate: 24,
  };
  const read: prepareInstancePosture.Reader = prepareInstancePosture(inputs);
  const end: IAutoMovieMotionHumanPosture = read(5);
  const start: IAutoMovieMotionHumanPosture = read(-1);
  TestValidator.predicate(
    "the instance borrows height and the lagged path but carries its own offset",
    vclose(start.root, { x: 5, y: 1, z: 6 }, ROUNDING) &&
      vclose(end.root, { x: 6, y: 1, z: 6 }, ROUNDING) &&
      nclose(end.yaw, 90, ROUNDING) &&
      nclose(end.pitch, 5, ROUNDING),
  );
  TestValidator.predicate(
    "world limb goals turn about the template root and bone goals stay local",
    end.limbs.leftArm !== undefined &&
      end.limbs.leftArm.planted === true &&
      vclose(end.limbs.leftArm.point, { x: 7, y: 2, z: 6 }, ROUNDING) &&
      vclose(end.limbs.leftArm.bend, { x: 6, y: 3, z: 5 }, ROUNDING) &&
      end.limbs.rightArm !== undefined &&
      end.limbs.rightArm.on === "chest" &&
      vclose(end.limbs.rightArm.point, local.point, ROUNDING),
  );
  TestValidator.predicate(
    "only a readable, same-body template that keeps its heading is admitted",
    throwsError(
      (): unknown => prepareInstancePosture({ ...inputs, body: {} }),
      "another body",
    ) &&
      throwsError(
        (): unknown =>
          prepareInstancePosture({ ...inputs, template: { body } }),
        "cannot be read",
      ) &&
      throwsError(
        (): unknown =>
          prepareInstancePosture({
            ...inputs,
            template: {
              body,
              posture: (time: number): IAutoMovieMotionHumanPosture => ({
                ...posture(time),
                yaw: time < 10 ? 0 : 2,
              }),
            },
          }),
        "turns 2.0 degrees",
      ),
  );
}
