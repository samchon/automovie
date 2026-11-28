import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";

/*
 * The world destination a put down asks an earlier pickup to plan for.
 *
 * The attitude is the placement's outcome, so the grip must be one the arm can
 * lay it down with (`putDown`'s authored limits hold the same two points to the
 * same bound). The goal posture is planned first and the grasp chosen for it,
 * the end-state comfort a person shows when taking up a thing they will turn
 * over (Rosenbaum, Meulenbroek, Vaughan and Jansen 2001); a grip chosen for the
 * reach alone leaves a card pinched from above, which the forearm's twist
 * cannot turn face up.
 *
 * Keep the mark for a free heading by collapsing the measured line to its
 * origin. The model's current rotation supplies only the fit's reference.
 * An authored attitude instead keeps the prop's up axis for a hand's length.
 * Parameter ahead: The put down as known before it is planned, with the candidate
 * grip.
 * Returns: The demanded pose, or none for attachments or a different grip.
 */
export function putDownRestingDemand(
  ahead: IAutoMovieMotionHumanActionLaw.IAhead<IAutoMovieMotionHumanPutDown.IParams>,
): IAutoMovieMotionHumanActionLaw.IDemand | undefined {
  const params: IAutoMovieMotionHumanPutDown.IParams = ahead.params;
  if (
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
  const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    inGrip.rotation,
    {
      x: 0,
      y: 1,
      z: 0,
    },
  );

  // The line has no edge of its own: its roll about the up axis is the
  // heading the placement leaves free.
  const across: IAutoMovieVector3 =
    Math.abs(axis.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 };
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = {
    ...read,
    tip: inGrip.position,
    axis,
    edge: AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(
        across,
        AutoMovieEngineVector3.scale(
          axis,
          AutoMovieEngineVector3.dot(across, axis),
        ),
      ),
    ),
    rolls: true,
    length: params.rotation === undefined ? 0 : ahead.body.measure.hand,
    span: null,
  };
  const frame: IAutoMovieRigidTransform = HumanPropFrame.parent(
    {
      position: params.to,
      rotation:
        params.rotation === undefined
          ? ahead.prop(params.prop).frame(ahead.start).rotation
          : AutoMovieEngineQuaternion.normalize(params.rotation),
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
