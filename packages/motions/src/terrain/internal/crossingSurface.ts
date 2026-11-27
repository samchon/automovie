import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanCrossing,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";

/**
 * The extent of a crossing's named top surface in the crossing's own frame: `x`
 * across the path, `y` up and `z` along it from the entry, in metres. The
 * surface must belong to a fixed prop and lie level and square to the path, so
 * its four edges are the frame's lines.
 */
export namespace crossingSurface {
  /** A level top's edges and height in the crossing frame, metres. */
  export interface IExtent {
    /** The edge at the lower x. */
    left: number;

    /** The edge at the higher x. */
    right: number;

    /** The edge nearer the entry. */
    near: number;

    /** The edge farther along the path. */
    far: number;

    /** The surface's height above the frame's origin. */
    height: number;
  }

  /**
   * Read a named surface's extent.
   *
   * @param context The action's context, whose props are read at its start.
   * @param frame The crossing frame.
   * @param ref The surface.
   * @returns Its extent.
   * @throws {HumanRefusal} If the prop moves or the surface is missing,
   *   undimensioned, sloped or skewed.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext,
    frame: HumanFrame.IPrepared,
    ref: IAutoMovieMotionHumanCrossing.ISurface,
  ): IExtent {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(ref.prop);
    const prop: IAutoMovieMotionHumanProp = reader.prop;
    const surface: IAutoMovieAffordance | undefined = prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean =>
        item.id === ref.point && item.kind === "surface",
    );
    if (
      prop.fixed !== true ||
      prop.motion !== undefined ||
      prop.hasArticulations === true ||
      surface?.width === undefined ||
      surface.depth === undefined
    )
      throw refusal(
        "surface.point",
        ref.point,
        "the crossing needs a fixed level and dimensioned surface",
      );
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      world.rotation,
      surface.frame.rotation,
    );
    const at: IAutoMovieVector3 = Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, surface.frame.translation),
    );
    const center: IAutoMovieVector3 = frame.local(at);
    const across: IAutoMovieVector3 = frame.local(
      Vector3.add(at, Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 })),
    );
    const ahead: IAutoMovieVector3 = frame.local(
      Vector3.add(at, Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 })),
    );
    if (
      Quaternion.rotateVectorY(rotation, { x: 0, y: 1, z: 0 }) < 0.999 ||
      Math.abs(across.z - center.z) > 0.03 ||
      Math.abs(ahead.x - center.x) > 0.03
    )
      throw refusal(
        "surface.point",
        ref.point,
        "the top must be level and square to the crossing path",
      );
    return {
      left: center.x - surface.width / 2,
      right: center.x + surface.width / 2,
      near: center.z - surface.depth / 2,
      far: center.z + surface.depth / 2,
      height: center.y,
    };
  }

  /**
   * The crossing's affordance refusal.
   *
   * @param axis The refused parameter's path.
   * @param value The refused value.
   * @param reason Why it is refused.
   * @returns The refusal to throw.
   */
  export function refusal(
    axis: string,
    value: string,
    reason: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "affordance",
      axis,
      value,
      reason,
      fix: "align the approach and select a reachable fixed crossing geometry",
    });
  }
}
