import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The world box a simulated window's bodies can reach: every segment origin
 * their sampled poses cover, from the floor up, widened on every side but the
 * floor by a stature, the most a fallen body lies from where it stood, and by
 * the farthest its centre can coast over the window. That coasting speed is the
 * change the impulses give the lightest body, `sum |J| / m`, plus the fastest
 * its root moves in the samples; friction and the floor only slow it.
 * Parameter targets: Each simulated performer's sampled segment poses, by step.
 * Parameter bodies: The simulated performers' bodies, by subject.
 * Parameter impulses: The window's impulses.
 * Parameter rate: Steps per second.
 * Parameter floor: The floor's height, metres.
 * Returns: The box, metres.
 */
export function reachHumanSimulation(
  targets: ReadonlyMap<
    string,
    readonly Record<string, IAutoMovieRigidTransform>[]
  >,
  bodies: ReadonlyMap<string, IAutoMovieMotionHumanBody>,
  impulses: IAutoMoviePhysicalSimulationInput.IInput["impulses"],
  rate: number,
  floor: number,
): reachHumanSimulation.IBox {
  const people: IAutoMovieMotionHumanBody[] = [...bodies.values()];
  const stature: number = Math.max(
    ...people.map(
      (body: IAutoMovieMotionHumanBody): number => body.measure.stature,
    ),
  );
  const mass: number = Math.min(
    ...people.map(
      (body: IAutoMovieMotionHumanBody): number => body.profile.mass,
    ),
  );
  const struck: number = impulses.reduce(
    (
      sum: number,
      impulse: IAutoMoviePhysicalSimulationInput.IInput["impulses"][number],
    ): number => sum + Vector3.length(impulse.impulse),
    0,
  );
  let speed: number = 0;
  let steps: number = 0;
  const box: reachHumanSimulation.IBox = {
    minimum: { x: Infinity, y: floor, z: Infinity },
    maximum: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
  for (const [subject, samples] of targets) {
    const root: string = bodies
      .get(subject)!
      .skeleton.bones.find(
        (bone: IAutoMovieBone): boolean => bone.parent === null,
      )!.bone;
    steps = Math.max(steps, samples.length - 1);
    samples.forEach(
      (
        segments: Record<string, IAutoMovieRigidTransform>,
        step: number,
      ): void => {
        for (const pose of Object.values(segments))
          for (const axis of AXES) {
            box.minimum[axis] = Math.min(
              box.minimum[axis],
              pose.position[axis],
            );
            box.maximum[axis] = Math.max(
              box.maximum[axis],
              pose.position[axis],
            );
          }
        if (step > 0)
          speed = Math.max(
            speed,
            Vector3.length(
              Vector3.subtract(
                segments[root]!.position,
                samples[step - 1]![root]!.position,
              ),
            ) * rate,
          );
      },
    );
  }
  const margin: number = stature + (struck / mass + speed) * (steps / rate);
  for (const axis of AXES) {
    if (axis !== "y") box.minimum[axis] -= margin;
    box.maximum[axis] += margin;
  }
  return box;
}

/*
 * Companion types of reachHumanSimulation.
 */
export namespace reachHumanSimulation {
  /*
   * A world-axis box, metres.
   */
  export interface IBox {
    /*
     * Least corner.
     */
    minimum: IAutoMovieVector3;

    /*
     * Greatest corner.
     */
    maximum: IAutoMovieVector3;
  }
}

/*
 * The three world axes.
 */
const AXES: readonly (keyof IAutoMovieVector3)[] = ["x", "y", "z"];
