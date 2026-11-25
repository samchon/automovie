import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPropDrive,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";

import { actingPerformanceState } from "./actingPerformanceState";
import { testAffordance } from "./testAffordance";

/**
 * A performance state whose person drives a door's hinge, for unit tests of the
 * prop articulation readers: the standing fixture with a door at the origin,
 * its `hinge` of 100 degrees' travel and a `mirror` coupled to it at ratio -1,
 * and a `pull` handle the hinge's travel moves along `+X`, one metre per
 * degree; and a box that nothing drives.
 *
 * The person's actions are replaced by the given ones, each a copy of the
 * fixture's first stand at its own placement with its own drives.
 *
 * @param actions The actions' placements and drives.
 * @returns The state, the door and the box.
 */
export async function drivenDoorState(
  actions: readonly drivenDoorState.IAction[],
): Promise<drivenDoorState.IResult> {
  const model: IAutoMovieMotionHumanObject.IModel = door(0);
  const prop: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop("door", model, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
    articulate: (state: Readonly<Record<string, number>>) => {
      const hinge: number = state.hinge ?? -(state.mirror ?? 0);
      if (hinge > 100) throw new Error(`hinge ${hinge} past 100`);
      return { affordances: door(hinge).affordances ?? [] };
    },
  };
  const box: IAutoMovieMotionHumanProp = HumanObject.prop(
    "box",
    { affordances: [testAffordance("lid", "handle", { x: 0, y: 0.5, z: 0 })] },
    { at: { x: 2, y: 0, z: 0 }, yaw: 0 },
  );
  const self: IAutoMovieMotionHumanPerformanceState =
    await actingPerformanceState(
      [prop, box],
      actions.map((action: drivenDoorState.IAction) => ({
        ...action,
        plan: { drives: action.drives },
      })),
    );
  return { self, door: prop, box };
}

/** Companion types of {@link drivenDoorState}. */
export namespace drivenDoorState {
  /** One action's placement and drives. */
  export interface IAction {
    /** Its plan's zero, film seconds. */
    start: number;

    /** When it entered, film seconds; its start by default. */
    entryTime?: number;

    /** Its end, film seconds. */
    end: number;

    /** Its plan's duration, seconds. */
    duration: number;

    /** Its drives. */
    drives: IAutoMovieMotionPropDrive[];
  }

  /** The state and its props. */
  export interface IResult {
    /** The state. */
    self: IAutoMovieMotionHumanPerformanceState;

    /** The driven door. */
    door: IAutoMovieMotionHumanProp;

    /** The box nothing drives. */
    box: IAutoMovieMotionHumanProp;
  }
}

/** The door's model at a hinge travel, degrees. */
function door(hinge: number): IAutoMovieMotionHumanObject.IModel {
  return {
    affordances: [
      testAffordance("hinge", "hinge", { x: 0, y: 1, z: 0 }, undefined, {
        travel: 100,
      }),
      testAffordance("mirror", "hinge", { x: 0, y: 1, z: 0 }, undefined, {
        follows: { id: "hinge", ratio: -1 },
      }),
      testAffordance("pull", "handle", { x: hinge, y: 1, z: 0 }),
    ],
  };
}
