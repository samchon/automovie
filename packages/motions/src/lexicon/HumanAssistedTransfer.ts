import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAssistedTransfer,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { supportContact } from "../actions/supportContact";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { getUp } from "../floor/getUp";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanObject } from "../perform/HumanObject";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Roles performing the same support phase. */
type Role = IAutoMovieMotionHumanAssistedTransfer.Role;

/** Actual seated contact and the foot stance immediately in front of it. */
interface ISeat {
  /** Original model affordance address. */
  target: Extract<IAutoMovieMotionTarget, { kind: "prop" }>;

  /** Seat descriptor used by the existing seated actions. */
  seat: IAutoMovieMotionHumanSeated.ISeat;

  /** World contact inside the seat. */
  at: IAutoMovieVector3;

  /** Heading of the seat relative to the original performer in degrees. */
  turn: number;

  /** Left and right foot placements outside the facing edge. */
  feet: readonly IAutoMovieMotionHumanSupport.IContact[];
}

/** The bearing parts of the transfer are not constrained to the chair's base. */
const FEET: readonly IAutoMovieMotionHumanSupport.IContact[] = [
  { part: "leftFoot", kind: "bear" },
  { part: "rightFoot", kind: "bear" },
];

/** Acquire, rise, step, align, settle, and release. */
const PHASE: number = 0.55;

/** Reject a model reference at the source or destination that exposed it. */
function refuse(axis: string, value: string | number, reason: string): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix: "stage a reachable chair and care surface with named seats",
  });
}

/** Resolve the named seat from the actual model and build its interior and floor targets. */
function placedSeat(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
  axis: "from" | "to",
): ISeat {
  const ref: IAutoMovieMotionHumanAssistedTransfer.ISeatReference =
    context.params[axis];
  const placed: ReturnType<typeof context.prop> = context.prop(ref.prop);
  const model: { affordances: IAutoMovieAffordance[] } = {
    affordances: [...(placed.prop.affordances ?? [])],
  };
  const candidate: IAutoMovieAffordance | undefined = model.affordances.find(
    (value: IAutoMovieAffordance): boolean =>
      value.id === ref.point && value.kind === "seat",
  );
  if (
    candidate === undefined ||
    candidate.depth === undefined ||
    candidate.width === undefined
  )
    return refuse(axis, ref.point, "the staged affordance has no bounded seat");
  const frame: IAutoMovieRigidTransform = placed.frame(context.start);
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    model,
    { position: frame.position, rotation: frame.rotation },
    ref.point,
  );
  const vertical: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, candidate.frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  if (
    vertical.y < 0.999 ||
    seat.at.y <= 0 ||
    seat.at.y >= context.body.measure.stature * 0.4
  )
    return refuse(
      axis,
      ref.point,
      "the seat is not level and within the admitted grounded transfer height",
    );
  const turns: number = seat.yaw - context.entry.posture.yaw;
  const turn: number = ((((turns + 180) % 360) + 360) % 360) - 180;
  const along: number = ref.along ?? 0;
  if (!Number.isFinite(along) || Math.abs(along) >= candidate.width / 2)
    return refuse(
      axis,
      along,
      "the requested seated station lies beyond the edge",
    );
  const local: { origin: IAutoMovieVector3; yaw: number } = {
    origin: seat.at,
    yaw: seat.yaw,
  };
  const floor: readonly IAutoMovieVector3[] = supportContact.onFloors(
    context.body,
    context.entry.posture,
    ["leftFoot", "rightFoot"],
  );
  const station: number = Math.min(
    candidate.depth / 2,
    context.body.measure.stature * 0.1,
  );
  const spacing: number = Vector3.distance(floor[0]!, floor[1]!) / 2;
  const feet: IAutoMovieMotionHumanSupport.IContact[] = (
    ["left", "right"] as const
  ).map((side): IAutoMovieMotionHumanSupport.IContact => {
    const foot: IAutoMovieVector3 = HumanFrame.point(local, {
      x: along + (side === "left" ? spacing : -spacing),
      y: -seat.at.y,
      z: station,
    });
    return {
      part: `${side}Foot`,
      kind: "bear",
      target: {
        kind: "point",
        frame: "world",
        at: foot,
        normal: { x: 0, y: 1, z: 0 },
      },
    };
  });
  return {
    target: { kind: "prop", subject: ref.prop, point: ref.point },
    seat: { ...seat, at: HumanFrame.point(local, { x: along, y: 0, z: 0 }) },
    at: HumanFrame.point(local, { x: along, y: 0, z: -station }),
    turn,
    feet,
  };
}

/** Read the actual projected seat contact supplied by the preceding sit. */
function seatedContact(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
  from: ISeat,
): IAutoMovieVector3 {
  if (
    context.entry.base.kind !== "seated" ||
    context.entry.base.seat === undefined ||
    Vector3.distance(context.entry.base.seat.at, from.seat.at) > 0.01
  )
    return refuse(
      "from",
      from.target.point,
      "the helped actor must already be seated on the named source",
    );
  const contact: IAutoMovieMotionHumanSupport.IContact = {
    part: "seat",
    kind: "bear",
    target: from.target,
  };
  const point: IAutoMovieVector3 = supportContact.points(
    context.body,
    context.entry.posture,
    [{ contact, at: from.at }],
  )[0]!;
  return { ...point, y: from.seat.at.y };
}

/** Attach the actual displayed palm to the shared clasp over its nominated span. */
function gripReader(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
  plan: IAutoMovieMotionHumanActionPlan,
  side: "left" | "right",
  seconds: number,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const region = side === "left" ? "palmLeft" : "palmRight";
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
  const limb = side === "left" ? "leftArm" : "rightArm";
  const start: number = seconds;
  const clasped: number = 1.5 * seconds;
  const released: number = 6 * seconds;
  const bare: number = 7 * seconds;

  /** Fixed shared point, with one visible arrival and release. */
  const weight = (at: number): number =>
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
 * helper's clasp stays until the new seat bears. The paired measurements
 * in [Riccoboni et al.](https://pubmed.ncbi.nlm.nih.gov/33070065/) motivate
 * observing the helper and occupant separately over the same motion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the role clock, continuously held clasp, actual source and destination, and final release.
 * @evidence contracts/development/design.md#principled-representation The law uses one common world grip point and distinct body support targets, on the existing stance representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the contact sequence. The native support plan owns fitting and transitions and the archetype owns seat geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named seat contacts are resolved on actual staged prop state. The action uses no precomputed body poses except the shared standing and sitting preferences.
 */
export const HumanAssistedTransfer: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanAssistedTransfer.IRoleParams> & {
  mutual: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanAssistedTransfer,
    Role
  >;
} = {
  name: "assistedTransferBody",
  interrupts: {},
  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { params }: typeof context = context;
    const seconds: number = params.seconds ?? PHASE;
    const { x, y, z }: IAutoMovieVector3 = params.clasp;
    if (![x, y, z, seconds].every(Number.isFinite) || seconds <= 0)
      return refuse(
        "seconds",
        seconds,
        "the clasp and phase duration must be finite and the duration positive",
      );
    const side: "left" | "right" = params.hand ?? "right";
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
    const from: ISeat | undefined = helped
      ? placedSeat(context, "from")
      : undefined;
    const to: ISeat | undefined = helped
      ? placedSeat(context, "to")
      : undefined;
    const source: IAutoMovieVector3 | undefined =
      from === undefined ? undefined : seatedContact(context, from);
    if (from !== undefined && to !== undefined) {
      if (from.target.subject === to.target.subject)
        return refuse(
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
      phase("leadingFoot", [to.feet[0]!, FEET[1]!], to.turn, getUp.POSES.stood);
      phase("destinationFeet", [...to.feet], to.turn, getUp.POSES.stood);
      phase(
        "destinationSupported",
        [destination, ...to.feet],
        to.turn,
        getUp.POSES.sit,
      );
      phase("released", [destination, ...to.feet], to.turn, getUp.POSES.sit);
    } else {
      const stance = getUp.quiet(context.body);
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
      aim: (target, time): ReturnType<typeof context.aim> => {
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
