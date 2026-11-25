import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAssistedTransfer,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { getUp } from "../floor/getUp";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { humanAssistedTransferSeat } from "./humanAssistedTransferSeat";

/** Roles performing the same support phase. */
type Role = IAutoMovieMotionHumanAssistedTransfer.Role;

/** The bearing parts of the transfer are not constrained to the chair's base. */
const FEET: readonly IAutoMovieMotionHumanSupport.IContact[] = [
  { part: "leftFoot", kind: "bear" },
  { part: "rightFoot", kind: "bear" },
];

/** Acquire, rise, step, align, settle, and release. */
const PHASE: number = 0.55;

/** Attach the actual displayed palm to the shared clasp over its nominated span. */
function gripReader(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
  plan: IAutoMovieMotionHumanActionPlan,
  side: AutoMovieHumanSide,
  seconds: number,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const region: AutoMovieHumanoidRegion =
    side === "left" ? "palmLeft" : "palmRight";
  const own: IAutoMovieHumanoidSurfaces.IFrame =
    context.body.surfaces.regions[region];
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([own.bone]);
  const partner: ReturnType<typeof context.performer> | undefined =
    context.params.role === "helper"
      ? context.performer(context.params.partner)
      : undefined;
  const other: IAutoMovieHumanoidSurfaces.IFrame | undefined =
    partner?.body.surfaces.regions[region];
  const targetBone: ReadonlySet<AutoMovieHumanoidBone> | undefined =
    other === undefined ? undefined : new Set([other.bone]);
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const start: number = seconds;
  const clasped: number = 1.5 * seconds;
  const released: number = 6 * seconds;
  const bare: number = 7 * seconds;

  /** Fixed shared point, with one visible arrival and release. */
  const weight: (at: number) => number = (at: number): number =>
    minimumJerk.share(
      Math.max(
        0,
        Math.min(
          1,
          (at - start) / (clasped - start),
          (bare - at) / (bare - released),
        ),
      ),
    );

  return (
    at,
    channels,
    resolution,
    projection,
  ): IAutoMovieMotionHumanPosture => {
    const source: IAutoMovieMotionHumanPosture = plan.posture(
      at,
      channels,
      resolution,
      projection,
    );
    const held: number = weight(at);
    if (held === 0 || (channels !== undefined && !channels.includes(limb)))
      return source;
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      resolveHumanPosture(context.body, source),
      undefined,
      requested,
    );
    const hand: IAutoMovieResolvedBone = bones.get(own.bone)!;
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      hand.worldRotation,
      own.point,
    );
    const target: IAutoMovieVector3 =
      partner === undefined || other === undefined
        ? context.params.clasp
        : resolveAutoMovieHumanoidSurfaces.point(
            other,
            partner.bones(context.start + at, targetBone).get(other.bone)!,
          );
    const point: IAutoMovieVector3 = Vector3.lerp(
      Vector3.add(hand.worldPosition, offset),
      target,
      held,
    );
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      context.body,
      source,
      side,
    );
    let wrist: IAutoMovieVector3 = Vector3.subtract(point, offset);
    let fitted: IAutoMovieMotionHumanPosture = source;
    let pose: IAutoMoviePose | undefined;
    for (let iteration: number = 0; iteration < 5; iteration++) {
      fitted = {
        ...source,
        limbs: { ...source.limbs, [limb]: { point: wrist, bend } },
      };
      pose = resolveHumanPosture(context.body, fitted);
      const actual: IAutoMovieResolvedBone = poseBones(
        context.body,
        pose,
        undefined,
        requested,
      ).get(own.bone)!;
      const delta: IAutoMovieVector3 = Vector3.subtract(
        point,
        resolveAutoMovieHumanoidSurfaces.point(own, actual),
      );
      if (Vector3.length(delta) <= 0.001) break;
      wrist = Vector3.add(wrist, delta);
    }
    if (pose === undefined) return fitted;
    const jointSet: ReadonlySet<string> = new Set([
      `${side}UpperArm`,
      `${side}LowerArm`,
      `${side}Hand`,
    ]);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...source.joints };
    for (const joint of pose.joints)
      if (jointSet.has(joint.bone))
        joints[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...source.limbs };
    delete limbs[limb];
    return { ...source, limbs, joints };
  };
}

/**
 * Stage one actor's role in a paired chair-to-care-seat transfer.
 *
 * The phases share the same explicit hand target and seconds. The occupant
 * transfers support through the feet before moving to the next seat. The
 * helper's clasp stays until the new seat bears. The paired measurements in
 * [Riccoboni et al.](https://pubmed.ncbi.nlm.nih.gov/33070065/) motivate
 * observing the helper and occupant separately over the same motion.
 */
export const HumanAssistedTransfer: IAutoMovieMotionHumanAssistedTransfer.ILaw =
  {
    name: "assistedTransferBody",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
    ): IAutoMovieMotionHumanActionPlan => {
      const { params }: typeof context = context;
      const seconds: number = params.seconds ?? PHASE;
      if (!(seconds > 0))
        return humanAssistedTransferSeat.refuse(
          "seconds",
          seconds,
          "the clasp and phase duration must be finite and the duration positive",
        );
      const side: AutoMovieHumanSide = params.hand ?? "right";
      const steps: IAutoMovieMotionHumanSupport.IStance[] = [];
      const phase = (
        event: string,
        contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
        turn: number = 0,
        prefer?: IAutoMovieMotionHumanSupport.IStance["prefer"],
      ): void => {
        steps.push({
          event,
          contacts,
          seconds,
          turn,
          ...(prefer === undefined ? {} : { prefer }),
        });
      };
      const helped: boolean = params.role === "helped";
      const from: humanAssistedTransferSeat.ISeat | undefined = helped
        ? humanAssistedTransferSeat.place(context, "from")
        : undefined;
      const to: humanAssistedTransferSeat.ISeat | undefined = helped
        ? humanAssistedTransferSeat.place(context, "to")
        : undefined;
      const source: IAutoMovieVector3 | undefined =
        from === undefined
          ? undefined
          : humanAssistedTransferSeat.occupied(context, from);
      if (from !== undefined && to !== undefined) {
        if (from.target.subject === to.target.subject)
          return humanAssistedTransferSeat.refuse(
            "to",
            to.target.subject,
            "the destination must be a distinct staged support",
          );
        const sourcePose: IAutoMovieMotionHumanSupport.IContact = {
          part: "seat",
          kind: "bear",
          target: from.target,
        };
        const destination: IAutoMovieMotionHumanSupport.IContact = {
          part: "seat",
          kind: "bear",
          target: to.target,
        };
        phase("sourceSupported", [sourcePose, ...FEET]);
        phase("clasped", [sourcePose, ...FEET]);
        phase("standingTogether", [...FEET], 0, getUp.POSES.stood);
        phase(
          "leadingFoot",
          [to.feet[0]!, FEET[1]!],
          to.turn,
          getUp.POSES.stood,
        );
        phase("destinationFeet", [...to.feet], to.turn, getUp.POSES.stood);
        phase(
          "destinationSupported",
          [destination, ...to.feet],
          to.turn,
          getUp.POSES.sit,
        );
        phase("released", [destination, ...to.feet], to.turn, getUp.POSES.sit);
      } else {
        const stance: IAutoMovieMotionHumanLieDown.IPose = getUp.quiet(
          context.body,
        );
        phase("sourceSupported", FEET, 0, stance);
        for (const event of [
          "clasped",
          "standingTogether",
          "leadingFoot",
          "destinationFeet",
          "destinationSupported",
        ])
          phase(event, FEET, 0, stance);
        phase("released", FEET, 0, stance);
      }

      const plan: IAutoMovieMotionHumanActionPlan = support.plan({
        ...context,
        params: { stances: steps },
        aim: (
          target: IAutoMovieMotionTarget,
          time: number,
        ): ReturnType<typeof context.aim> => {
          const result: ReturnType<typeof context.aim> = context.aim(
            target,
            time,
          );
          if (target.kind !== "prop") return result;
          if (
            target.subject === from?.target.subject &&
            target.point === from.target.point &&
            source !== undefined
          )
            return { ...result, point: source };
          if (
            target.subject === to?.target.subject &&
            target.point === to.target.point
          )
            return { ...result, point: to.at };
          return result;
        },
      });
      const posture: IAutoMovieMotionHumanActionPlan["posture"] = gripReader(
        context,
        plan,
        side,
        seconds,
      );
      return {
        ...plan,
        posture,
        yields: ["head"],
        contacts: [
          ...plan.contacts,
          {
            part: `${side}Hand`,
            kind: "grip",
            support: {
              kind: "person",
              subject: params.partner,
              region: side === "right" ? "palmRight" : "palmLeft",
            },
            from: (1.5 * seconds) / plan.duration,
            to: (6 * seconds) / plan.duration,
          },
        ],
        ...(to === undefined
          ? {}
          : { base: { kind: "seated", seat: to.seat } as const }),
      };
    },
    mutual: {
      name: "assistedTransfer",
      roles: ["helper", "helped"],
      act: (
        role: Role,
        params: IAutoMovieMotionHumanAssistedTransfer,
        cast: Readonly<Record<Role, string>>,
      ): IAutoMovieMotionHumanMutual.IAct => ({
        name: HumanAssistedTransfer.name,
        params: {
          ...params,
          role,
          partner: cast[role === "helper" ? "helped" : "helper"],
        },
      }),
    },
  };
