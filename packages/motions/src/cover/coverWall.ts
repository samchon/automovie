import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A staged wall's face as cover reads it: the face's plane through the prop's
 * origin with its outward normal along the prop's `+Z`, its length along the
 * prop's `+X` and its two ends, in world metres. A wall archetype stands in its
 * `XY` plane with its front face toward `+Z` and names that face `face`, its
 * width the wall's length.
 */
export namespace coverWall {
  /** The time and prop reader for the fixed scenic face. */
  export type IContext = Pick<
    IAutoMovieMotionHumanActionContext,
    "prop" | "start"
  >;

  /** A wall face in world metres. */
  export interface IFace {
    /** The face's centre on the floor, world metres. */
    center: IAutoMovieVector3;

    /** Its outward horizontal unit normal. */
    normal: IAutoMovieVector3;

    /** Its horizontal unit length axis, toward its `right` end. */
    axis: IAutoMovieVector3;

    /** Half its length, metres. */
    half: number;
  }

  /**
   * Read a fixed prop's face.
   *
   * @param context The action's context.
   * @param subject The wall or window prop.
   * @param face The surface or aperture affordance whose width is the face's
   *   length.
   * @returns The face.
   * @throws {HumanRefusal} If the prop moves or has no such affordance with a
   *   width.
   */
  export function read(
    context: IContext,
    subject: string,
    face: string,
  ): IFace {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const affordance: IAutoMovieAffordance | undefined =
      reader.prop.affordances?.find(
        (item: IAutoMovieAffordance): boolean => item.id === face,
      );
    if (
      reader.prop.motion !== undefined ||
      affordance?.width === undefined ||
      !(affordance.width > 0)
    )
      throw refusal(
        "face",
        face,
        `${subject} has no fixed face ${face} with a width`,
      );
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.normalize({ x: v.x, y: 0, z: v.z });
    return {
      center: { ...world.position, y: 0 },
      normal: flat(
        Quaternion.rotateVector(world.rotation, { x: 0, y: 0, z: 1 }),
      ),
      axis: flat(Quaternion.rotateVector(world.rotation, { x: 1, y: 0, z: 0 })),
      half: affordance.width / 2,
    };
  }

  /**
   * The cover moves' refusal.
   *
   * @param axis The refused parameter's path.
   * @param value The refused value.
   * @param reason Why it is refused.
   * @returns The refusal to throw.
   */
  export function refusal(
    axis: string,
    value: unknown,
    reason: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "affordance",
      axis,
      value,
      reason,
      fix: "stage the performer against a fixed wall, window or door within reach",
    });
  }
}
