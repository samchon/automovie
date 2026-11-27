import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanPerformance } from "@automovie/motions";

import { collectTakeClean } from "./collectTakeClean";

/**
 * What the playground ride specs share: the rides' tolerance, the
 * installations' placement and the readings of a displayed take.
 */
export namespace playgroundTake {
  /** The two hands and feet. */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /** The established seat and grip contact tolerance of the ride tests, metres. */
  export const HOLD: number = 0.02;

  /** Each installation at the origin, unturned. */
  export const ORIGIN: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };

  /** A body key of the shared canonical bodies. */
  export type BodyKey = "m-average" | "f-small";

  /** One performer as a performance takes it. */
  export type Performer = ConstructorParameters<
    typeof AutoMovieMotionHumanPerformance
  >[0]["performers"][number];

  /**
   * A world transform in the rigid form a prop takes.
   *
   * @param transform The transform.
   * @returns Its position and rotation.
   */
  export function rigid(
    transform: IAutoMovieTransform,
  ): IAutoMovieRigidTransform {
    return { position: transform.translation, rotation: transform.rotation };
  }

  /**
   * A world point in a support's frame.
   *
   * @param frame The support's frame.
   * @param point The world point.
   * @returns The point in the frame.
   */
  export function local(
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(frame.rotation),
      AutoMovieEngineVector3.subtract(point, frame.position),
    );
  }

  /**
   * A displayed joint.
   *
   * @param film The take.
   * @param bone The bone.
   * @param at Film seconds.
   * @param subject The performer.
   * @returns Its world position.
   */
  export function joint(
    film: AutoMovieMotionHumanPerformance,
    bone: Parameters<ReturnType<AutoMovieMotionHumanPerformance["bones"]>["get"]>[0],
    at: number,
    subject: string = "a",
  ): IAutoMovieVector3 {
    return film.bones(subject, at).get(bone)!.worldPosition;
  }

  /**
   * The shipped take verdicts over a take, as a complaint.
   *
   * @param label What the take is.
   * @param take The take.
   * @param failures Where a fault is recorded.
   */
  export function clean(
    label: string,
    take: AutoMovieMotionHumanPerformance,
    failures: string[],
  ): void {
    collectTakeClean(label, take, failures);
  }
}
