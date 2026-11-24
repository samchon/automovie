import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieMotionHumanThrowObjectLever,
  IAutoMovieMotionHumanThrowObjectParams,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { precisionThrow } from "./precisionThrow";
import { throwObjectForm } from "./throwObjectForm";
import { throwObjectLever } from "./throwObjectLever";
import { throwObjectRelease } from "./throwObjectRelease";

/** The throw's world-space places, stance and solved release. */
interface IThrowObjectAim {
  /** The entry probe frame from which the throw's places are measured. */
  frame: IAutoMovieMotionHumanFrame;

  /** The chamber grip point, in world metres. */
  chamber: IAutoMovieVector3;

  /** The follow-through grip point, in world metres. */
  finish: IAutoMovieVector3;

  /** The resolved target, in world metres. */
  target: IAutoMovieVector3;

  /** The unit direction toward the target across the floor. */
  toward: IAutoMovieVector3;

  /** World up, used to orient the grip. */
  up: IAutoMovieVector3;

  /** The optional style-specific stance, also used by the trunk primitive. */
  stance: ReturnType<typeof precisionThrow.stance>;

  /** The grip point at release, in world metres. */
  release: IAutoMovieVector3;

  /**
   * The optional authored implement used to transfer the grip's motion to the
   * projectile.
   */
  implement: IAutoMovieMotionHumanThrowObjectLever.IImplement | undefined;

  /** The released point, its velocity and the grip's share of the launch. */
  lever: throwObjectLever.ILever;

  /** The hand velocity carried through release, in world metres per second. */
  velocity: IAutoMovieVector3;

  /**
   * The acceleration phase duration, in seconds, including the carry to
   * release.
   */
  accelerate: number;

  /** The grip point immediately before the release carry, in world metres. */
  before: IAutoMovieVector3;

  /** The grip point immediately after the release carry, in world metres. */
  after: IAutoMovieVector3;
}

/**
 * Resolve the throw's chamber, finish, grip release and launch.
 *
 * @param context The throw's body, entry and authored target.
 * @param body The body whose arm measures determine the hand places.
 * @param style The admitted throwing style.
 * @param side The throwing hand.
 * @param outward The side's lateral sign, positive toward the performer's left.
 * @param arm The combined upper arm and forearm lengths, in metres.
 * @returns The solved release and the geometry needed by the later phases.
 * @throws {HumanRefusal} When the release angle cannot reach the target.
 */
export function throwObjectAim(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanThrowObjectParams>,
  body: IAutoMovieMotionHumanBody,
  style: IAutoMovieMotionHumanThrowObjectForm.Style,
  side: AutoMovieHumanSide,
  outward: number,
  arm: number,
): IThrowObjectAim {
  const probe: IAutoMovieMotionHumanPosture =
    style === "gridironSnap"
      ? (context.carrier?.posture(0) ?? context.entry.posture)
      : stand.plan({ ...context, params: { hold: 1 } }).posture(0);
  const yaw: number = probe.yaw;
  const frame: IAutoMovieMotionHumanFrame = { origin: probe.root, yaw };
  const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]);
  const shoulder: IAutoMovieVector3 = HumanFrame.local(
    frame,
    poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        probe,
        undefined,
        {},
        undefined,
        shoulderBones,
      ).pose,
      undefined,
      shoulderBones,
    ).get(`${side}UpperArm`)!.worldPosition,
  );
  const place: (share: IAutoMovieVector3) => IAutoMovieVector3 = (
    share: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    HumanFrame.point(frame, {
      x: shoulder.x + outward * share.x * arm,
      y: shoulder.y + share.y * arm,
      z: shoulder.z + share.z * arm,
    });
  const chamber: IAutoMovieVector3 = place(
    throwObjectForm.PLACES[style].chamber,
  );
  const finish: IAutoMovieVector3 = place(throwObjectForm.PLACES[style].finish);
  const target: IAutoMovieVector3 = context.aim(
    context.params.target,
    context.start,
  ).point;

  // The palm faces the target across the floor; the release is read from
  // the trunk's release pose ({@link throwObjectRelease}).
  const from: IAutoMovieVector3 = HumanFrame.point(frame, shoulder);
  const toward: IAutoMovieVector3 = Vector3.normalize({
    x: target.x - from.x,
    y: 0,
    z: target.z - from.z,
  });
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const held: IAutoMovieQuaternion = HumanHand.rotation(
    side,
    style === "overarm" || style === "gridironPass" || style === "cricket"
      ? { fingers: up, palm: toward }
      : { fingers: Vector3.scale(up, -1), palm: toward },
  );
  const stance: ReturnType<typeof precisionThrow.stance> =
    precisionThrow.stance(context, style);
  const release: IAutoMovieVector3 = throwObjectRelease.point({
    body,
    side,
    style,
    standing: stance?.(probe, 1) ?? probe,
    held,
  });

  // The launch velocity by the range equation at the style's angle, from
  // the lever's end; the hand carries its share (`throwObjectLever`).
  const delta: IAutoMovieVector3 = Vector3.subtract(target, release);
  const d: number = Math.hypot(delta.x, delta.z);
  const degrees: number = context.params.angle ?? throwObjectForm.ANGLE[style];
  const implement:
    | IAutoMovieMotionHumanThrowObjectLever.IImplement
    | undefined = context.params.implement;
  const lever: throwObjectLever.ILever | undefined = throwObjectLever({
    context,
    side,
    shoulder: from,
    release,
    held,
    target,
    degrees,
    implement,
    ...(context.params.prop === undefined ? {} : { prop: context.params.prop }),
  });
  if (lever === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: d,
      reason: `a ${style} throw at ${degrees} degrees cannot reach a target ${delta.y.toFixed(2)} m above and ${d.toFixed(2)} m from its release`,
      fix: "aim at a nearer or lower target, or choose a style with a steeper release",
    });

  // The fixed grip points at the ends of the constant-velocity carry.
  const velocity: IAutoMovieVector3 = lever.hand;
  const speed: number = Vector3.length(velocity);

  const before: IAutoMovieVector3 = Vector3.subtract(
    release,
    Vector3.scale(velocity, throwObjectForm.CARRY),
  );
  const after: IAutoMovieVector3 = Vector3.add(
    release,
    Vector3.scale(velocity, throwObjectForm.CARRY),
  );

  const accelerate: number =
    throwObjectForm.CARRY +
    (2 * Vector3.length(Vector3.subtract(before, chamber))) / speed;

  return {
    frame,
    chamber,
    finish,
    target,
    toward,
    up,
    stance,
    release,
    implement,
    lever,
    velocity,
    accelerate,
    before,
    after,
  };
}
