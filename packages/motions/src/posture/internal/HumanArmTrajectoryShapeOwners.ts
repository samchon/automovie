import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

/*
 * Each collider shape's segment, in the order `HumanArmShapes.colliders` places
 * the shapes.
 * Parameter colliders: The frame's colliders (`HumanArmGeometry.IFrame.colliders`).
 * Returns: The segment of the arm each shape rides on, shape by shape.
 */
export function HumanArmTrajectoryShapeOwners(
  colliders: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"],
): HumanArmTrajectoryShapeOwners.Owner[] {
  const out: HumanArmTrajectoryShapeOwners.Owner[] = [];
  for (const col of colliders)
    for (let s: number = 0; s < col.shapes.length; ++s) out.push(col.owner);
  return out;
}

/*
 * The segment a collider shape of the arm rides on.
 */
export namespace HumanArmTrajectoryShapeOwners {
  /*
   * The segment of the arm a collider shape rides on.
   */
  export type Owner =
    IAutoMovieMotionHumanArmGeometry.IFrame["colliders"][number]["owner"];
}
