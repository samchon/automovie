import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanLimb, AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanLimbReference, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSupport, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { prepareSupportContactForm } from "./prepareSupportContactForm";

/*
 * Read the held joints and contact datums at the two solved support keys.
 * Parameter body: The unchanged body that owns the anatomical sockets.
 * Parameter a: The solved departure posture.
 * Parameter b: The solved arrival posture.
 * Parameter limbs: The hands and feet present at both keys.
 * Parameter place: The resolved contact target lookup.
 * Parameter read: The synchronous pose-resolution workspace.
 * Parameter project: The body's posture projector.
 * Parameter socket: The sole socket each floor foot holds through its window; the
 * lower of its heel and ball at the key before when absent.
 * Returns: World key frames and the rotation pivot in the end-bone frame.
 */
export function prepareSupportHeldFrames(
  body: IAutoMovieMotionHumanBody,
  a: IAutoMovieMotionHumanPosture,
  b: IAutoMovieMotionHumanPosture,
  limbs: readonly prepareSupportHeldFrames.IHeld[],
  place: (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => IAutoMovieVector3 | null,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
  socket?: prepareSupportHeldFrames.Socket,
): prepareSupportHeldFrames.IHeldFrames[] {
  if (limbs.length === 0) return [];
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  const form: ReturnType<typeof prepareSupportContactForm> =
    prepareSupportContactForm(body, false);
  const targets: (IAutoMovieMotionHumanBodyFitTypes.ITarget | undefined)[] =
    limbs.map(
      (
        limb: prepareSupportHeldFrames.IHeld,
      ): IAutoMovieMotionHumanBodyFitTypes.ITarget | undefined => {
        requested.add(limb.end);
        requested.add(limb.middle);
        const contact: ReturnType<typeof form> = form(
          limb.contact,
          place(limb.contact),
        );
        if (contact.bearing !== undefined) return undefined;
        requested.add(contact.target.bone);
        return contact.target;
      },
    );

  // A held foot's heel and ball sockets, which ride the foot bone itself.
  const soles = (
    limb: prepareSupportHeldFrames.IHeld,
  ): IAutoMovieHumanoidSurfaces.IFrame[] => {
    const side: Capitalize<AutoMovieHumanSide> = limb.end.startsWith("left")
      ? "Left"
      : "Right";
    return [
      body.surfaces.sockets[`heel${side}`],
      body.surfaces.sockets[`ball${side}`],
    ];
  };
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const at: (
    posture: IAutoMovieMotionHumanPosture,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    frames(
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        read,
        requested,
        project,
      ).pose,
      read(),
    );
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = at(a);
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = at(b);
  /*
   * Resolve the same anatomical datum the key's support fit constrained.
   */
  const world = (
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 => {
    const pose: IAutoMovieResolvedBone = bones.get(target.bone)!;
    return target.point === undefined
      ? { ...pose.worldPosition }
      : AutoMovieEngineVector3.add(
          pose.worldPosition,
          AutoMovieEngineQuaternion.rotateVector(pose.worldRotation, target.point),
        );
  };
  return limbs.map(
    (
      limb: prepareSupportHeldFrames.IHeld,
      index: number,
    ): prepareSupportHeldFrames.IHeldFrames => {
      const a0: IAutoMovieResolvedBone = before.get(limb.end)!;
      const b0: IAutoMovieResolvedBone = after.get(limb.end)!;
      const frames: prepareSupportHeldFrames.IHeldFrames = {
        limb: limb.limb,
        elevated: targets[index] !== undefined,
        point: [{ ...a0.worldPosition }, { ...b0.worldPosition }],
        rotation: [{ ...a0.worldRotation }, { ...b0.worldRotation }],
        bend: [
          { ...before.get(limb.middle)!.worldPosition },
          { ...after.get(limb.middle)!.worldPosition },
        ],
        reference: [angles(a, limb), angles(b, limb)],
      };
      const target: IAutoMovieMotionHumanBodyFitTypes.ITarget | undefined =
        targets[index];
      if (target === undefined && !limb.end.endsWith("Foot")) return frames;

      // Floor feet keep their heel/ball rocker. A raised contact instead uses
      // the same anatomical point as its key, expressed in the end bone.
      let pivot: IAutoMovieVector3;
      if (target !== undefined) pivot = world(target, before);
      else {
        const [heel, ball]: IAutoMovieVector3[] = soles(limb).map(
          (frame: IAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
            AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(frame, a0),
        );
        // The socket the foot holds through its whole window, so every
        // interval of the window turns it about the same point.
        const named: ReturnType<prepareSupportHeldFrames.Socket> = socket?.(
          limb.contact,
        );
        pivot =
          named === "heel"
            ? heel!
            : named === "ball"
              ? ball!
              : heel!.y <= ball!.y
                ? heel!
                : ball!;
      }
      const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(a0.worldRotation),
        AutoMovieEngineVector3.subtract(pivot, a0.worldPosition),
      );
      return {
        ...frames,
        pivot: {
          local,
          at: [
            { ...pivot },
            target === undefined
              ? AutoMovieEngineVector3.add(
                  b0.worldPosition,
                  AutoMovieEngineQuaternion.rotateVector(b0.worldRotation, local),
                )
              : world(target, after),
          ],
        },
      };
    },
  );
}

/*
 * The retained contact selection and the solved frames used by support
 * playback.
 */
export namespace prepareSupportHeldFrames {
  /*
   * The sole socket a floor foot holds through its window, by its contact; none
   * for a contact that holds none.
   */
  export type Socket = (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => PrepareSupportHeldFramesSocket2;

  /*
   * A limb retained between two support keys and the bones defining its fit.
   */
  export interface IHeld {
    /*
     * The limb goal's name.
     */
    limb: AutoMovieHumanLimb;

    /*
     * The wrist's or ankle's bone.
     */
    end: AutoMovieHumanoidBone;

    /*
     * The elbow's or knee's bone.
     */
    middle: AutoMovieHumanoidBone;

    /*
     * The shared contact supplying the end-effector datum.
     */
    contact: IAutoMovieMotionHumanSupport.IContact;
  }
  /*
   * The solved frames and held datum for one limb at both support keys.
   */
  export interface IHeldFrames {
    /*
     * The limb.
     */
    limb: IHeld["limb"];

    /*
     * This limb bears on a fitted above-floor contact.
     */
    elevated: boolean;

    /*
     * The end joint's position at the key before, then after.
     */
    point: readonly [IAutoMovieVector3, IAutoMovieVector3];

    /*
     * The end joint's rotation at the key before, then after.
     */
    rotation: readonly [IAutoMovieQuaternion, IAutoMovieQuaternion];

    /*
     * The middle joint's position at the key before, then after, the bend's
     * pole.
     */
    bend: readonly [IAutoMovieVector3, IAutoMovieVector3];

    /*
     * The limb's own upper and lower bone angles at the key before, then after:
     * the configuration the analytic fit keeps where the end and the pole leave
     * one free (the upper bone's twist), so the fitted limb is each key's own
     * at its ends.
     */
    reference: readonly [
      IAutoMovieHumanLimbReference,
      IAutoMovieHumanLimbReference,
    ];

    /*
     * The held anatomical point in the wrist or ankle frame and its world place
     * at both keys.
     */
    pivot?: IPrepareSupportHeldFramesHeldFramesPivot;
  }

  /*
   * The record of `IPrepareSupportHeldFramesHeldFramesPivot`'s site.
   */
  type IPrepareSupportHeldFramesHeldFramesPivot = {
    /*
     * The offset in the end bone's frame, metres.
     */
    local: IAutoMovieVector3;

    /*
     * The socket's world place at the key before, then after.
     */
    at: readonly [IAutoMovieVector3, IAutoMovieVector3];
  };
}

/*
 * A limb's upper and lower bone angles in a key posture, degrees.
 */
function angles(
  posture: IAutoMovieMotionHumanPosture,
  limb: prepareSupportHeldFrames.IHeld,
): IAutoMovieHumanLimbReference {
  const side: AutoMovieHumanSide = limb.limb.startsWith("left")
    ? "left"
    : "right";
  const arm: boolean = limb.limb.endsWith("Arm");
  const zero: readonly [number, number, number] = [0, 0, 0];
  const upper: AutoMovieHumanoidBone = arm
    ? `${side}UpperArm`
    : `${side}UpperLeg`;
  const lower: AutoMovieHumanoidBone = arm
    ? `${side}LowerArm`
    : `${side}LowerLeg`;
  return {
    upper: posture.joints[upper] ?? zero,
    lower: posture.joints[lower] ?? zero,
  };
}

/*
 * The alternatives of `PrepareSupportHeldFramesSocket2`'s site.
 */
type PrepareSupportHeldFramesSocket2 = "heel" | "ball" | undefined;
