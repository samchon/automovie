import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedLimb } from "../AutoMovieArchetypeQuadrupedLimb";

/*
 * One limb's terminal support for the ride pose (`QuadrupedRidePose`): its
 * exact oriented chain solver and the height of its endpoint above the terminal
 * primitive's lowest surface, for any terminal orientation and support plane.
 */
export namespace QuadrupedRideTerminal {
  /*
   * One admitted terminal primitive and its exact fixed-orientation sole
   * offset.
   */
  export interface IEnd {
    /*
     * Chain with its terminal direction constrained by a pose goal.
     */
    solver: AutoMovieArchetypeQuadrupedLimb.IOriented;
    /*
     * Endpoint height above the terminal primitive's lowest surface, metres.
     */
    clearance: number;
  }

  /*
   * A limb's binding: its support for a terminal orientation, a lateral solve
   * and a support plane.
   */
  export type Binding = (
    orientation: IAutoMovieQuaternion | undefined,
    lateral: boolean,
    normal?: IAutoMovieVector3,
  ) => IEnd;

  /*
   * Read one foot primitive and prepare its binding.
   * Parameter limb: The limb.
   * Parameter chain: Its five joints, model space.
   * Parameter terminal: Its terminal part.
   * Returns: The binding.
   * For a terminal that is not a capsule or cylinder bar,
   * or an unrepresentable clearance.
   */
  export function of(
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    chain: readonly IAutoMovieVector3[],
    terminal: IAutoMovieModelPart | undefined,
  ): Binding {
    if (
      terminal?.geometry.type !== "primitive" ||
      (terminal.geometry.shape.type !== "cylinder" &&
        terminal.geometry.shape.type !== "capsule")
    )
      throw new RangeError(`The ${limb} terminal solid is not a rigid bar`);
    const dx: number = chain[4]!.x - chain[3]!.x;
    const dy: number = chain[4]!.y - chain[3]!.y;
    const dz: number = chain[4]!.z - chain[3]!.z;
    const length: number = Math.hypot(dx, dy, dz);
    const axis: IAutoMovieVector3 = {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };
    const shape: typeof terminal.geometry.shape = terminal.geometry.shape;
    const prepared: AutoMovieArchetypeQuadrupedLimb.IPrepared =
      AutoMovieArchetypeQuadrupedLimb.prepare(chain, limb.endsWith("Fore"));
    const defaultSupport: IEnd = support(axis, false);
    return (
      orientation: IAutoMovieQuaternion | undefined,
      lateral: boolean,
      normal?: IAutoMovieVector3,
    ): IEnd =>
      orientation === undefined && !lateral && normal === undefined
        ? defaultSupport
        : support(
            orientation === undefined
              ? axis
              : AutoMovieEngineQuaternion.rotateVector(orientation, axis),
            true,
            normal,
          );

    /*
     * Bind the exact support of the current terminal bar in model space.
     */
    function support(
      direction: IAutoMovieVector3,
      lateral: boolean,
      normal?: IAutoMovieVector3,
    ): IEnd {
      const radial: number =
        shape.type === "capsule"
          ? shape.radius
          : shape.radius *
            (normal === undefined
              ? Math.hypot(direction.x, direction.z)
              : AutoMovieEngineVector3.length(AutoMovieEngineVector3.cross(direction, normal)));
      const vertical: number =
        normal === undefined ? direction.y : AutoMovieEngineVector3.dot(normal, direction);
      const clearance: number = Math.max(0, vertical) * shape.height + radial;
      if (!(clearance >= 0))
        throw new RangeError(`The ${limb} sole clearance is not representable`);
      return { solver: prepared.oriented(direction, lateral), clearance };
    }
  }
}
