import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { AquaticPosture } from "./AquaticPosture";

/*
 * Seconds from the last stroke to standing: provisional.
 */
const DURATION: number = 1.8;

/*
 * Share at which the feet bear on the bottom, the load-bearing plant.
 */
const PLANT: number = 0.45;

/*
 * Share over which the feet settle onto the bottom before they bear.
 */
const LAND: number = 0.1;

/*
 * How far ahead of the entered root the feet plant, metres over stature:
 * provisional, under the hips as the legs swing down.
 */
const AHEAD: number = 0.2;

/*
 * The deepest water a swimmer stands up in, over stature: provisional, about
 * chest depth.
 */
const DEPTH: number = 0.75;

/*
 * Stand up out of the shallows at the end of a swim, as a triathlete or an
 * open-water swimmer does: the legs swing down under the hips as buoyancy is
 * given up, both feet bear on the bottom (`footDown`), and the trunk rises over
 * them to a standing posture on the ground (`upright`). The bottom is the world
 * ground; the water surface is the authored plane. The ground plant holds from
 * `footDown` to the end, so a run can leave from it.
 */
export namespace AquaticExit {
  /*
   * Plan the exit from the entered swim to standing in shallow water.
   */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    if (!(water > 0 && water <= DEPTH * body.measure.stature))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "water",
        value: water,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: DEPTH * body.measure.stature,
          unit: "m",
        },
        reason:
          "a swimmer stands up only where the bottom is within reach below the surface",
        fix: "exit where the water above the ground is shallower",
      });

    // Standing on the ground ahead of the entered root.
    const ground: IAutoMovieVector3 = AquaticPosture.along(
      entry.posture,
      AHEAD * body.measure.stature,
      0,
    );
    const stand: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(body, {}, {}),
      ground,
    );
    const crouch: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 35, spine: [15, 0, 0], neck: -15 },
        { hip: 75, knee: 80, shoulder: 20, raise: 30, elbow: 40 },
      ),
      ground,
    );
    const down: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      entry.posture,
      crouch,
    );
    const up: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      crouch,
      stand,
    );

    // The plants are under the crouch's feet at the standing key's ankle
    // height, so the feet reach the bottom from where the crouch has them.
    const feet: ReturnType<ReturnType<typeof AquaticPosture.markers>> =
      AquaticPosture.markers(body, ["leftFoot", "rightFoot"])(crouch);
    const upright: ReturnType<ReturnType<typeof AquaticPosture.markers>> =
      AquaticPosture.markers(body, ["leftFoot", "rightFoot"])(stand);
    const plants: Record<AutoMovieHumanSide, IResolvedFoot> = {
      left: plant(feet.get("leftFoot")!, upright.get("leftFoot")!),
      right: plant(feet.get("rightFoot")!, upright.get("rightFoot")!),
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] = (
      ["left", "right"] as const
    ).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`,
        kind: "plant",
        from: PLANT,
        to: 1,
        support: { kind: "ground" },
      }),
    );
    return {
      duration: DURATION,
      contacts,
      events: [
        { name: "lastStroke", share: 0 },
        { name: "footDown", share: PLANT },
        { name: "upright", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const u: number = Math.max(0, Math.min(1, seconds / DURATION));
        const shaped: IAutoMovieMotionHumanPosture =
          u < PLANT ? down(u / PLANT) : up((u - PLANT) / (1 - PLANT));
        if (u < PLANT - LAND) return shaped;

        // The feet settle from the crouch onto the bottom, then bear.
        const settle: number = Math.min(1, (u - PLANT + LAND) / LAND);
        const posture: IAutoMovieMotionHumanPosture = {
          ...shaped,
          limbs: { ...shaped.limbs },
        };
        for (const side of ["left", "right"] as const)
          posture.limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
            body,
            posture,
            side,
            {
              ankle: Vector3.lerp(
                plants[side].from,
                plants[side].ankle,
                settle,
              ),
              rotation: plants[side].rotation,
            },
            u >= PLANT,
          );
        return posture;
      },
    };
  }

  /*
   * A foot's plant on the bottom and where it settles from.
   */
  interface IResolvedFoot {
    /*
     * The crouch's ankle, world metres.
     */
    from: IAutoMovieVector3;

    /*
     * The plant's ankle on the ground, world metres.
     */
    ankle: IAutoMovieVector3;

    /*
     * The standing foot's rotation.
     */
    rotation: IAutoMovieQuaternion;
  }

  /*
   * Under the crouched foot at the standing ankle's height.
   */
  function plant(
    crouched: IAutoMovieResolvedBone,
    standing: IAutoMovieResolvedBone,
  ): IResolvedFoot {
    return {
      from: crouched.worldPosition,
      ankle: { ...crouched.worldPosition, y: standing.worldPosition.y },
      rotation: standing.worldRotation,
    };
  }
}
