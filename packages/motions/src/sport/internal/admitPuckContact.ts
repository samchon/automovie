import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStickBall,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropFrame } from "../../perform/HumanPropFrame";
import { HumanPropHold } from "../../perform/HumanPropHold";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** A puck blade's world up before its fitted rotation. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Ball-strike contact allowance reused from the 15 mm instep verification. */
const PUCK_CONTACT_ALLOWANCE: number = 0.015;

/**
 * Reconstruct the finite ice blade face from the fitted grip sockets at closure
 * and impact. The nominal shaft frame can remain inside both arm lengths even
 * though the body cannot put its wrists there.
 *
 * @param context The actor's body and any held entry grips.
 * @param action The composed stroke on its own support or carrier.
 * @param initial The stick's world frame before the new grips close.
 * @param blade The stick model's blade face, with local X across, Y out and Z
 *   up its face.
 * @param rim The world point on the puck's rim that the blade must meet.
 * @param direction The authored puck's horizontal departure direction.
 * @param seconds The action-local contact second.
 * @param closed The action-local second the new grips close at: 0 for grips
 *   held from the entry, the end of the reach for a stick the hands take.
 * @throws {HumanRefusal} If the achieved finite face cannot make the authored
 *   contact.
 */
export function admitPuckContact(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStickBall.IParams>,
  action: IAutoMovieMotionHumanActionPlan,
  initial: IAutoMovieRigidTransform,
  blade: IAutoMovieAffordance,
  rim: IAutoMovieVector3,
  direction: IAutoMovieVector3,
  seconds: number,
  closed: number,
): void {
  const body: typeof context.body = context.body;
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      body.surfaces.sockets.gripLeft.bone,
      body.surfaces.sockets.gripRight.bone,
    ]);
  const fittedHands = (at: number): ReturnType<typeof poseBones> =>
    poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        action.posture(at),
        undefined,
        {},
        undefined,
        requested,
      ).pose,
      undefined,
      requested,
    );
  const entry: ReturnType<typeof poseBones> = fittedHands(closed);
  const impact: ReturnType<typeof poseBones> = fittedHands(seconds);
  const grip = (side: AutoMovieHumanSide): HumanPropHold.IHand => ({
    hand: HumanPropHold.frame(body, impact, { side }),
    offset:
      context.entry.holds[side] === context.params.stick
        ? AutoMovieMotionHumanHeld(context, side, context.params.stick).frame
        : HumanPropFrame.relative(
            HumanPropHold.frame(body, entry, { side }),
            initial,
          ),
  });
  const fitted: IAutoMovieRigidTransform = HumanPropHold.fit(
    grip("left"),
    grip("right"),
  );
  const face: IAutoMovieRigidTransform = HumanPropFrame.compose(fitted, {
    position: blade.frame.translation,
    rotation: blade.frame.rotation,
  });
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(face.rotation),
    Vector3.subtract(rim, face.position),
  );
  const miss: number = Math.hypot(
    Math.max(0, Math.abs(local.x) - (blade.width ?? 0) / 2),
    local.y,
    Math.max(0, Math.abs(local.z) - (blade.depth ?? 0) / 2),
  );
  if (miss > PUCK_CONTACT_ALLOWANCE)
    throw new HumanRefusal({
      kind: "reach",
      axis: "stick",
      value: miss,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: PUCK_CONTACT_ALLOWANCE,
        unit: "m",
      },
      reason: `the fitted blade face misses the puck rim by ${(miss * 1000).toFixed(1)} mm`,
      fix: "place the performer and stick so both fitted hands can keep the blade at the puck",
    });
  const facing: number = Vector3.dot(
    Quaternion.rotateVector(face.rotation, UP),
    direction,
  );
  if (facing <= 0)
    throw new HumanRefusal({
      kind: "reach",
      axis: "stick",
      value: facing,
      reason: "the fitted blade face points away from the puck's departure",
      fix: "place the performer and stick so the blade's working face points along the pass",
    });
}
