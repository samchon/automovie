import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** The alternatives of `OfContext`'s site. */
type OfContext = "prop" | "start";

/**
 * Read a push's two handles.
 *
 * @param context The action's context.
 * @param sled The pushed prop's subject id.
 * @param left The left hand's handle id.
 * @param right The right hand's handle id.
 * @returns Each hand's handle.
 * @throws {HumanRefusal} An `affordance` refusal on `handle` when the prop has
 *   no handle of that name, listing its affordances.
 */
export function pushSledHandles(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  sled: string,
  left: string,
  right: string,
): Record<AutoMovieHumanSide, pushSledHandles.IHandle> {
  const read: IAutoMovieMotionHumanPropReader = context.prop(sled);
  const frame: IAutoMovieRigidTransform = read.frame(context.start);
  const handle = (id: string): pushSledHandles.IHandle => {
    const found: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === id);
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "handle",
        value: `${sled}.${id}`,
        feasible: {
          kind: "alternatives",
          values: (read.prop.affordances ?? []).map(
            (a: IAutoMovieAffordance): string => a.id,
          ),
        },
        reason: `${sled} has no handle named ${id}`,
        fix: "name the prop's handles as `left` and `right`",
      });
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      found.frame.rotation,
    );
    return {
      frame: {
        point: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, found.frame.translation),
        ),
        normal: Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 }),
        forward: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
      },
      symmetry: found.symmetry,
      length: found.length ?? 0,
    };
  };
  return { left: handle(left), right: handle(right) };
}

/**
 * The two handles a sled push (`pushSled`) takes, read on the pushed prop where
 * it stands at the push's start.
 */
export namespace pushSledHandles {
  /** A handle where it stands at the grip. */
  export interface IHandle {
    /**
     * Its frame: the point, the palm's way in (`normal`) and the wrapped axis
     * (`forward`).
     */
    frame: IAutoMovieMotionHumanHand.IFrame;

    /** How its grasp repeats about the wrapped axis. */
    symmetry: IAutoMovieAffordance["symmetry"];

    /**
     * Its grip band's length along the wrapped axis, metres; 0 when it declares
     * no band.
     */
    length: number;
  }
}
