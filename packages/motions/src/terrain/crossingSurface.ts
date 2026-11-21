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

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The extent of a crossing's named top surface in the crossing's own
 * frame: `x` across the path, `y` up and `z` along it from the entry, in
 * metres. The surface must belong to a fixed prop and lie level and square
 * to the path, so its four edges are the frame's lines.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and admission.
 * @evidence contracts/development/design.md#principled-representation Edges and height of an axis-aligned rectangle in the crossing frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The extent record, its reader and the crossing refusal; planNamedCrossing and planNamedVault consume them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every edge is read from the placed affordance; a sloped or skewed top is refused rather than approximated.
 */
export namespace crossingSurface {
  /**
   * A level top's edges and height in the crossing frame, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation Signed coordinates in the crossing frame; left is below right and near below far.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The five values the gap and vault planners read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read from one placed surface, never authored.
   */
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
   * @throws {HumanRefusal} If the prop moves or the surface is missing, undimensioned, sloped or skewed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Transforms the affordance centre and its two in-plane axes into the frame; the normal must be within about 2.6 degrees of up (cosine 0.999) and the axes within 3 cm per metre, about 1.7 degrees, of the frame's (provisional tolerances).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission first, then one transform of three points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a surface it cannot represent instead of approximating it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the prop's affordances for the lookup, constant after.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation One refusal kind and fix for every crossing geometry refusal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names the actual parameter and value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
