import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanEdgeRescue,
  IAutoMovieMotionHumanMutual,
} from "@automovie/interface";

import { planEdgeRescue } from "../coupled/planEdgeRescue";

/**
 * The cliffhanger rescue at a ledge: the `edgeRescue` law each role
 * performs (`planEdgeRescue`), and the mutual record that casts the rescuer
 * and the faller with one scene. Register `HumanEdgeRescue.edgeRescue` and
 * compose `HumanEdgeRescue.rescue` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, the record and the registration.
 * @evidence contracts/development/design.md#principled-representation A law over the shared scene and a mutual record that hands each role the scene, its role and its partner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one law and its one record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No ledge is special-cased; the scene reads it from the prop.
 */
export namespace HumanEdgeRescue {
  /** One role of an edge rescue. It cancels no other action and leaves no channel to overlays. */
  export const edgeRescue: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanEdgeRescue.IParams> =
    {
      name: "edgeRescue",
      interrupts: {},
      yields: [],
      plan: planEdgeRescue,
    };

  /** Both roles of an edge rescue over one scene: the rescuer catches and hauls, the faller hangs, falls and is hauled. */
  export const rescue: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanEdgeRescue.IScene,
    IAutoMovieMotionHumanEdgeRescue.Role
  > = {
    name: "rescue",
    roles: ["rescuer", "faller"],
    act: (
      role: IAutoMovieMotionHumanEdgeRescue.Role,
      params: IAutoMovieMotionHumanEdgeRescue.IScene,
      cast: Readonly<Record<IAutoMovieMotionHumanEdgeRescue.Role, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "edgeRescue",
      params: {
        ...params,
        role,
        partner: cast[role === "rescuer" ? "faller" : "rescuer"],
      } satisfies IAutoMovieMotionHumanEdgeRescue.IParams,
    }),
  };
}
