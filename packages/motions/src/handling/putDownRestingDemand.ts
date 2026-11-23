import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropFrame } from "../perform/HumanPropFrame";
import { StrikingRoll } from "../striking/StrikingRoll";

/**
 * The pose a put down that lays its prop at an authored resting attitude (a
 * card turned face up) demands of the grip an earlier pick up is choosing: the
 * prop at its place and attitude, held as the candidate grip holds it.
 *
 * The attitude is the placement's outcome, so the grip must be one the arm can
 * lay it down with (`putDown`'s authored limits hold the same two points to the
 * same bound). The goal posture is planned first and the grasp chosen for it,
 * the end-state comfort a person shows when taking up a thing they will turn
 * over (Rosenbaum, Meulenbroek, Vaughan and Jansen 2001); a grip chosen for the
 * reach alone leaves a card pinched from above, which the forearm's twist
 * cannot turn face up.
 *
 * The demanded line is the prop's own up axis through its origin, kept for a
 * hand's length: the two points the placement's limits hold, so the demand
 * judges the grip as the placement will.
 *
 * @param ahead The put down as known before it is planned, with the candidate
 *   grip.
 * @returns The demanded pose, or none when the placement asks no resting
 *   attitude, names a socket or a bone, or is not this grip's.
 */
export function putDownRestingDemand(
  ahead: IAutoMovieMotionHumanActionLaw.IAhead<IAutoMovieMotionHumanPutDown.IParams>,
): IAutoMovieMotionHumanActionLaw.IDemand | undefined {
  const params: IAutoMovieMotionHumanPutDown.IParams = ahead.params;
  if (
    params.rotation === undefined ||
    params.to === undefined ||
    params.onto !== undefined ||
    params.on !== undefined ||
    ahead.grip.prop !== params.prop ||
    ahead.grip.side !== (params.hand ?? "right")
  )
    return undefined;

  // The grip's hold of the prop, read through any of its contacts: only the
  // prop's frame in the grip (`held`) is kept.
  const contacts: readonly IAutoMovieAffordance[] =
    ahead.prop(params.prop).prop.affordances ?? [];
  if (contacts.length === 0) return undefined;
  const read: IAutoMovieMotionHumanStrikingHeld.ITool = ahead.grip.tool({
    tip: contacts[0]!.id,
  });
  if (read.held === undefined) return undefined;
  const inGrip: IAutoMovieRigidTransform = read.held.frame;
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(inGrip.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });

  // The line has no edge of its own: its roll about the up axis is the
  // heading the placement leaves free.
  const across: IAutoMovieVector3 =
    Math.abs(axis.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 };
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = {
    ...read,
    tip: inGrip.position,
    axis,
    edge: Vector3.normalize(
      Vector3.subtract(across, Vector3.scale(axis, Vector3.dot(across, axis))),
    ),
    rolls: true,
    length: ahead.body.measure.hand,
    span: null,
  };
  const frame: IAutoMovieRigidTransform = HumanPropFrame.parent(
    {
      position: params.to,
      rotation: Quaternion.normalize(params.rotation),
    },
    inGrip,
  );
  return {
    posture: ahead.grip.posture,
    tool,
    frame: { point: frame.position, rotation: frame.rotation },
    back: tool.length,
    bound: StrikingRoll.MISS,
  };
}
