import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedLimb } from "./AutoMovieArchetypeQuadrupedLimb";

/**
 * One limb's terminal support for the ride pose (`QuadrupedRidePose`): its exact oriented chain solver and the height of its endpoint above the terminal primitive's lowest surface, for any terminal orientation and support plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read once and what each binding returns.
 * @evidence contracts/development/design.md#principled-representation An actual chain and its terminal capsule or cylinder bound per orientation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Prepared by the ride pose for each limb.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No endpoint-only ground proxy is retained.
 */
export namespace QuadrupedRideTerminal {
  /**
   * One admitted terminal primitive and its exact fixed-orientation sole offset.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The solver and the clearance in metres.
   * @evidence contracts/development/design.md#principled-representation The actual chain with its terminal direction constrained by a pose goal, and its endpoint height above the terminal's lowest surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by a binding.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IEnd {
    /** Actual chain with its terminal direction constrained by a pose goal. */
    solver: AutoMovieArchetypeQuadrupedLimb.IOriented;
    /** Endpoint height above the terminal primitive's lowest surface, metres. */
    clearance: number;
  }

  /**
   * A limb's binding: its support for a terminal orientation, a lateral solve and a support plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The orientation rotates the terminal's neutral axis; the normal is the support plane's, the nominal floor when absent.
   * @evidence contracts/development/design.md#principled-representation A function of the pose goal's terminal state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Binding = (
    orientation: IAutoMovieQuaternion | undefined,
    lateral: boolean,
    normal?: IAutoMovieVector3,
  ) => IEnd;

  /**
   * Read one actual foot primitive and prepare its binding.
   *
   * @param limb The limb.
   * @param chain Its five actual joints, model space.
   * @param terminal Its terminal part.
   * @returns The binding.
   * @throws {RangeError} For a terminal that is not a capsule or cylinder bar, or an unrepresentable clearance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Preserve the actual terminal axis; the clearance is the bar's upward share of its length plus its radius, the cylinder's rim radius scaled by the bar's share across the support normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission, one default support, one support per bound orientation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The terminal radius is never ignored.
   * @evidence contracts/development/implementation.md#efficient-algorithms The neutral support is prepared once and reused.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exact limb owner's prepared chain.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the prepared chain and the terminal shape.
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
              : Quaternion.rotateVector(orientation, axis),
            true,
            normal,
          );

    /** Bind the exact support of the current terminal bar in model space. */
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
              : Vector3.length(Vector3.cross(direction, normal)));
      const vertical: number =
        normal === undefined ? direction.y : Vector3.dot(normal, direction);
      const clearance: number = Math.max(0, vertical) * shape.height + radial;
      if (!(Number.isFinite(clearance) && clearance >= 0))
        throw new RangeError(`The ${limb} sole clearance is not representable`);
      return { solver: prepared.oriented(direction, lateral), clearance };
    }
  }
}
