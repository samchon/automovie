import { AquaticCrew } from "./AquaticCrew";

/*
 * The sailing law's bounds: the close-hauled limit, the ease, the helm and hand
 * sites, the crouch, and the control a sailor holds.
 */
export namespace AquaticSailBounds {
  /*
   * Close-hauled mainsail trim of a small dinghy, degrees of boom travel off
   * the centreline. A provisional staging value: upwind the boom is sheeted to
   * within a few degrees of the quarter, ahead of the transom corner.
   */
  export const CLOSE_HAULED: number = 12;

  /*
   * Seconds over which a foot's heel rises before its lift and lowers after its
   * landing: provisional, a fraction of the swing.
   */
  export const EASE: number = 0.2;

  /*
   * Share of the maneuver by which the sailors have crouched and taken their
   * controls (`helmIn`).
   */
  export const HELM_IN: number = 0.2;

  /*
   * The tiller hand's point ahead of the pelvis, over stature: provisional,
   * ahead of a crouched chest.
   */
  export const HAND_FORE: number = 0.25;

  /*
   * The tiller hand's point above the pelvis, over stature: provisional.
   */
  export const HAND_UP: number = 0.2;

  /*
   * The tiller hand's point to its own side of the pelvis, over stature:
   * provisional, outside the trunk.
   */
  export const HAND_SIDE: number = 0.1;

  /*
   * How far the crouch lowers the pelvis, over stature: provisional, below a
   * dinghy's boom.
   */
  export const CROUCH: number = 0.2;

  /*
   * One hand on one of the craft's declared handle controls.
   */
  export interface IControl {
    /*
     * The holding hand.
     */
    side: AquaticCrew.Side;

    /*
     * The craft's handle affordance id, such as the tiller or the mainsheet.
     */
    handle: string;
  }
}
