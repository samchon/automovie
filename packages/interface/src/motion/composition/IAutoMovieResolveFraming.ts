import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the ResolveFraming operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The camera position and target are world metres, the bounding radius is metres and vertical field of view is radians. resolveAutoMovieFraming checks the goal's subject list, fill, elevation and field of view; callers supply valid bounding spheres.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieResolveFraming contracts used by packages/engine/src/composition/resolveAutoMovieFraming.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation The camera position and target are world metres, the bounding radius is metres and vertical field of view is radians. resolveAutoMovieFraming checks the goal's subject list, fill, elevation and field of view; callers supply valid bounding spheres. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveFraming contract belongs to interface; packages/engine/src/composition/resolveAutoMovieFraming.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieResolveFraming {
  /**
   * A resolved camera.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The camera position and target are world metres, the bounding radius is metres and vertical field of view is radians. resolveAutoMovieFraming checks the goal's subject list, fill, elevation and field of view; callers supply valid bounding spheres.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResolveFraming.ICamera keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The camera position and target are world metres, the bounding radius is metres and vertical field of view is radians. resolveAutoMovieFraming checks the goal's subject list, fill, elevation and field of view; callers supply valid bounding spheres. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveFraming.ICamera contract belongs to interface; packages/engine/src/composition/resolveAutoMovieFraming.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface ICamera {
    /** Camera position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at target, world metres. */
    target: IAutoMovieVector3;

    /** Vertical field of view, radians. */
    fieldOfView: number;

    /** Radius of the framed bounding sphere, metres. */
    radius: number;
  }
}
