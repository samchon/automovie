import { Quaternion, sampleMotion } from "@automovie/engine";
import type {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";

import { Aftermath } from "../motion/reactions/Aftermath";
import type { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";
import { FilmVector as V } from "../motion/rig/FilmVector";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";

/** Explicit authored hint data for the kinematic comparison only; the simulated scene never reads this clip. */
export class BoutKinematicClip {
  /** Engine owns key selection, easing and rigid-transform interpolation. */
  private readonly motion: IAutoMovieMotion;
  public constructor(root: Rig.Placement, hip: V.Value) {
    const standing: V.Value = V.add(
      root.position,
      V.rotate(hip, root.rotation),
    );
    const direction: V.Value = Aftermath.fallDirection;
    const lieYaw: number = V.heading(direction) - Math.PI / 2;
    const startYaw: number = Math.atan2(
      2 * root.rotation[1] * root.rotation[3],
      1 - 2 * root.rotation[1] ** 2,
    );
    const buckled: V.Value = V.add(
      standing,
      V.add(V.scale(direction, 0.12), [0, 0.6 - standing[1], 0]),
    );
    const lying: V.Value = [
      Aftermath.fallenHips[0],
      0.15,
      Aftermath.fallenHips[1],
    ];
    const keys: readonly {
      seconds: number;
      hip: V.Value;
      yaw: number;
      roll: number;
    }[] = [
      { seconds: 0, hip: standing, yaw: startYaw, roll: 0 },
      { seconds: 0.1, hip: standing, yaw: startYaw, roll: 0 },
      {
        seconds: 0.5,
        hip: buckled,
        yaw: startYaw + (lieYaw - startYaw) * 0.4,
        roll: -25,
      },
      { seconds: 1, hip: lying, yaw: lieYaw, roll: -75 },
      { seconds: 1.3, hip: lying, yaw: lieYaw, roll: -90 },
      { seconds: 30, hip: lying, yaw: lieYaw, roll: -90 },
    ];
    this.motion = {
      id: "bout-kinematic-comparison-fall",
      skeleton: "authored-root",
      duration: 30,
      loop: false,
      keyframes: keys.map((key: (typeof keys)[number]): IAutoMovieKeyframe => {
        const yaw: ReturnType<typeof Quaternion.fromAxisAngle> =
          Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            (key.yaw * 180) / Math.PI,
          );
        const rotation: ReturnType<typeof Quaternion.multiply> =
          Quaternion.multiply(
            yaw,
            Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, key.roll),
          );
        const position: V.Value = V.sub(
          key.hip,
          V.rotate(hip, [rotation.x, rotation.y, rotation.z, rotation.w]),
        );
        return {
          time: key.seconds,
          pose: {
            skeleton: "authored-root",
            joints: [],
            root: {
              translation: V.vector(position),
              rotation,
              scale: { x: 1, y: 1, z: 1 },
            },
          },
          expression: null,
          easing: "easeInOut",
          bezier: null,
        };
      }),
    };
  }
  /** Sample the declared comparison clip; no solver, fall detector or hand-authored easing is hidden here. */
  public at(seconds: number): Rig.Placement {
    const root: NonNullable<ReturnType<typeof sampleMotion>["pose"]["root"]> =
      sampleMotion(this.motion, seconds - BoutScript.finish.at).pose.root!;
    return {
      position: [root.translation.x, root.translation.y, root.translation.z],
      rotation: [
        root.rotation.x,
        root.rotation.y,
        root.rotation.z,
        root.rotation.w,
      ],
    };
  }
}
