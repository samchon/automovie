import { AutoMovieEngineKinematics, Vector3, AutoMovieEngineCompositionPose } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSupport, IAutoMovieMotionMeeting, IAutoMovieMotionMeetingKind, IAutoMovieMotionMeetingRole, IAutoMovieMotionMeetingTiming, IAutoMovieResolveMutualGoal, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionMeeting } from "../../compose/internal/AutoMovieMotionMeeting";
import { getUp } from "../../floor/internal/getUp";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";

/** Contacts and instants of a paired support. */
const ROLES: readonly IAutoMovieMotionHumanSupport.AssistRole[] = [
  "helper",
  "helped",
];

/** Taking the lying palm, sitting under it, and transferring to the squat. */
const CONTACTS: readonly ["take", "seat", "lift"] = ["take", "seat", "lift"];

/**
 * Build a meeting from the lying palm and the two subsequent shoulder
 * configurations.
 */
function kind(side: AutoMovieHumanSide): IAutoMovieMotionMeetingKind {
  const seconds: number = supportAssist.step();
  return {
    name: `support-assist:${side}`,
    roles: ROLES,
    contacts: {
      take: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      seat: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      lift: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
    },
    timing: (): IAutoMovieMotionMeetingTiming => ({
      ready: seconds,
      stroke: 2 * seconds,
      relax: CONTACTS.length * seconds,
    }),
    place: (
      roles: readonly IAutoMovieMotionMeetingRole[],
    ): Record<Phase, IAutoMovieVector3> => {
      const helped: IAutoMovieMotionMeetingRole = roles.find(
        (r: IAutoMovieMotionMeetingRole): boolean => r.name === "helped",
      )!;
      const helper: IAutoMovieMotionMeetingRole = roles.find(
        (r: IAutoMovieMotionMeetingRole): boolean => r.name === "helper",
      )!;
      const entry: IAutoMovieMotionHumanPosture = posture(helped);
      const hip: IAutoMovieVector3 = helped.bones.get("hips")!.worldPosition;
      const seat: IAutoMovieVector3 = { x: hip.x, y: 0, z: hip.z };
      const sitting: IAutoMovieMotionHumanPosture = supportKey.preferred(
        helped.body,
        entry,
        {
          contacts: [{ part: "seat", kind: "bear" }],
          prefer: getUp.POSES.sit,
        },
        entry,
        (): IAutoMovieVector3 => seat,
      );

      // The helper stays on the same planted feet through both keys.
      const hold: IAutoMovieResolveMutualGoal.ISide = shoulder(
        helper,
        side,
        squat(helper, posture(helper)),
      );
      const frame: IAutoMovieHumanoidSurfaces.IFrame =
        helped.body.surfaces.regions[
          side === "left" ? "palmLeft" : "palmRight"
        ];
      return {
        take: AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
          frame,
          helped.bones.get(frame.bone)!,
        ),
        seat: AutoMovieEngineCompositionPose.mutualGoal({
          a: shoulder(helped, side, sitting),
          b: hold,
        }).point,
        lift: AutoMovieEngineCompositionPose.mutualGoal({
          a: shoulder(helped, side, squat(helped, sitting)),
          b: hold,
        }).point,
      };
    },
  };
}

/**
 * A role's actual entry or its neutral stance when no full posture was
 * supplied.
 */
function posture(
  role: IAutoMovieMotionMeetingRole,
): IAutoMovieMotionHumanPosture {
  return (
    role.entry?.posture ?? {
      ...role.posture,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }
  );
}

/** Lower or rise about the foot locations established in the preceding stance. */
function squat(
  role: IAutoMovieMotionMeetingRole,
  from: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  const feet: readonly IAutoMovieMotionHumanSupport.Part[] = [
    "leftFoot",
    "rightFoot",
  ];
  const floor: readonly IAutoMovieVector3[] = supportContact.onFloors(
    role.body,
    from,
    feet,
  );
  return supportKey.preferred(
    role.body,
    posture(role),
    {
      contacts: feet.map(
        (
          part: IAutoMovieMotionHumanSupport.Part,
        ): IAutoMovieMotionHumanSupport.IContact => ({ part, kind: "bear" }),
      ),
      prefer: getUp.POSES.squat,
    },
    from,
    (
      contact: IAutoMovieMotionHumanSupport.IContact,
    ): IAutoMovieVector3 | null => floor[feet.indexOf(contact.part)] ?? null,
  );
}

/**
 * One posed shoulder, its right-angle working reach and its full arm length in
 * metres.
 */
function shoulder(
  role: IAutoMovieMotionMeetingRole,
  side: AutoMovieHumanSide,
  at: IAutoMovieMotionHumanPosture,
): IAutoMovieResolveMutualGoal.ISide {
  const bone: AutoMovieHumanoidBone = `${side}UpperArm`;
  const position: IAutoMovieVector3 = poseBones(
    role.body,
    resolveHumanPosture(role.body, at),
    undefined,
    new Set<AutoMovieHumanoidBone>([bone]),
  ).get(bone)!.worldPosition;
  const { upperArm, forearm }: IAutoMovieMotionMeetingRole["body"]["measure"] =
    role.body.measure;
  return {
    shoulder: position,
    reach: Math.hypot(upperArm, forearm),
    limit: upperArm + forearm,
  };
}

/**
 * The synchronized grip's point at the current support key.
 *
 * @param context The support action's context.
 * @returns The grip reader if assistance is authored.
 */
export function supportAssist(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
): OptionalGripReader {
  const assist: IAutoMovieMotionHumanSupport.IAssist | undefined =
    context.params.assist;
  if (assist === undefined) return undefined;
  const meeting: IAutoMovieMotionMeeting = context.meeting(
    kind(assist.hand),
    assist.role,
    {
      role: assist.role === "helper" ? "helped" : "helper",
      subject: assist.partner,
    },
  );
  const hand: IAutoMovieMotionHumanSupport.Part = `${assist.hand}Hand`;
  const keys: readonly IAutoMovieVector3[] = CONTACTS.map(
    (phase: Phase): IAutoMovieVector3 =>
      AutoMovieMotionMeeting.place(meeting, phase, context.entry.posture).point,
  );
  return (
    contact: IAutoMovieMotionHumanSupport.IContact,
    phase: number,
  ): GripPoint => {
    if (
      contact.part !== hand ||
      contact.kind !== "grip" ||
      contact.target === "on" ||
      contact.target?.kind !== "person" ||
      contact.target.subject !== assist.partner
    )
      return undefined;
    const before: number = Math.floor(phase);
    const a: GripPoint = keys[before];
    const b: GripPoint = keys[before + 1];
    return a === undefined || b === undefined || phase === before
      ? a
      : Vector3.lerp(a, b, phase - before);
  };
}

/**
 * The common hand course of two supports during an assisted rise. First the
 * helper takes the supported person's displayed palm where it lies. Then both
 * bring the clasp up through sitting as the helped person takes weight on the
 * feet. The ordinary support planner owns the transitions.
 */
export namespace supportAssist {
  /**
   * Seconds per key, one equal part of the measured young adult floor rise.
   *
   * @returns A stance's share in seconds.
   */
  export function step(): number {
    return getUp.SECONDS / (CONTACTS.length + 1);
  }
}

/** The authored phase has a shared grip only while the hand is holding. */
type GripPoint = IAutoMovieVector3 | undefined;

/** Find a partner's grip at a whole or fractional phase index. */
type GripReader = (
  contact: IAutoMovieMotionHumanSupport.IContact,
  phase: number,
) => GripPoint;

/** Ordinary support has no shared grip reader. */
type OptionalGripReader = GripReader | undefined;

/** Lowered and rising keys of the holding hand. */
type Phase = (typeof CONTACTS)[number];
