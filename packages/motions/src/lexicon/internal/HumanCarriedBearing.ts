import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "../../compose/internal/AutoMovieMotionHumanHand";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { bendLower } from "../../everyday/internal/bendLower";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { HumanCarried } from "./HumanCarried";
import { HumanCarriedBorne } from "./HumanCarriedBorne";
import { HumanCarriedCoupling } from "./HumanCarriedCoupling";
import { HumanCarriedCouplingLoad } from "./HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedGrip } from "./HumanCarriedGrip";
import { HumanCarriedLean } from "./HumanCarriedLean";
import { HumanCarriedLift } from "./HumanCarriedLift";
import { HumanCarriedWristCircle } from "./HumanCarriedWristCircle";

/**
 * The plan of holding a person in a named carry (`HumanCarried.bearing`): the
 * bearer's hands where the coupled carry lays the held regions, for a first or
 * a second helper.
 */
export namespace HumanCarriedBearing {
  /**
   * Plan the carrier's hold; `HumanCarried.bearing` states the law.
   *
   * @param context The carrier's context.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBearing>,
  ): IAutoMovieMotionHumanActionPlan {
    const seconds: number = HumanCarriedBorne.lasting(context.params.hold ?? 2);
    const carry: IAutoMovieMotionHumanCarried.Carry =
      context.params.carry ?? "piggyback";
    const row: IAutoMovieMotionHumanCarried.IRow = HumanCarried.CARRIES[carry];
    const body: IAutoMovieMotionHumanBody = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;

    // With the carried person named, each holding hand goes where the
    // coupled carry lays the held region, in the frame of the carrier's own bone the borne body rides
    //; the carried body is never read, only its rest body.
    const of: string | undefined = context.params.of;
    const beside: string | undefined = context.params.beside;

    // With two helpers, the one whose carry is the other side of a
    // paired carry is the second; the meeting's kind is the first's.
    const first: IAutoMovieMotionHumanCarried.Carry | undefined =
      beside === undefined
        ? undefined
        : (
            Object.keys(
              HumanCarriedCoupling.PAIRED,
            ) as IAutoMovieMotionHumanCarried.Carry[]
          ).find(
            (c: IAutoMovieMotionHumanCarried.Carry): boolean =>
              HumanCarriedCoupling.PAIRED[c] === carry,
          );
    const role: string =
      first === undefined
        ? HumanCarriedCoupling.BEARER
        : HumanCarriedCoupling.SECOND;
    const keyed: IAutoMovieMotionHumanCarried.Carry = first ?? carry;
    const coupling: IAutoMovieMotionCoupling | undefined =
      of === undefined
        ? undefined
        : context.meeting(
            HumanCarriedCoupling.kind(
              keyed,
              HumanCarried.CARRIES,
              context.params.mass,
              beside !== undefined,
            ),
            role,
            [
              { role: HumanCarriedCoupling.BORNE, subject: of },
              ...(beside === undefined
                ? []
                : [
                    {
                      role:
                        role === HumanCarriedCoupling.SECOND
                          ? HumanCarriedCoupling.BEARER
                          : HumanCarriedCoupling.SECOND,
                      subject: beside,
                    },
                  ]),
            ],
          ).coupling;
    const coupled: ReturnType<typeof HumanCarriedCouplingPose.holds> | null =
      coupling === undefined || of === undefined
        ? null
        : HumanCarriedCouplingPose.holds(
            context.performer(of).body,
            coupling,
            HumanCarried.CARRIES[keyed],
            role,
          );
    const cradle: IAutoMovieMotionHumanPerformerReader | undefined =
      carry === "cradle" && of !== undefined && coupling !== undefined
        ? context.performer(of)
        : undefined;
    const transfer: HumanCarriedLift.IPhase | undefined =
      cradle === undefined
        ? undefined
        : HumanCarriedLift.timing(
            {
              lift: context.params.lift ?? HumanCarried.TAKE,
              ...(context.params.setDown === undefined
                ? {}
                : { setDown: context.params.setDown }),
            },
            seconds,
          );
    const ready: number =
      transfer?.take ?? Math.min(seconds, HumanCarried.TAKE);
    const released: number = transfer?.release ?? seconds;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(seconds, [
      { name: "held", seconds: ready },
      ...(transfer === undefined
        ? []
        : [{ name: "released", seconds: released }]),
    ]);
    const weight = (at: number): number =>
      (ready === 0
        ? 1
        : clock.progress(AutoMovieMotionClock.START, "held", at)) *
      (released >= seconds
        ? 1
        : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((at - released) / (seconds - released)));
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const anchorBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      coupled === null
        ? undefined
        : new Set<AutoMovieHumanoidBone>([coupled.anchor]);
    // The stance the coupled grips are placed on: the carrier's at the hold,
    // or the coupling's key stance.
    const gripStance: IAutoMovieMotionHumanPosture | undefined =
      coupled === null || coupling === undefined
        ? undefined
        : (context.carrier?.posture(clock.at("held")) ??
          HumanCarriedCouplingPose.stance(
            body,
            role === coupling.bearer
              ? coupling.key.stance
              : { incline: 0, depth: 0 },
          ));
    let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    (["left", "right"] as const).forEach(
      (side: AutoMovieHumanSide, index: number): void => {
        const hold: IAutoMovieMotionHumanCarried.IHold | null =
          row.holds[index] ?? null;
        if (hold === null) return;
        const local: IAutoMovieMotionHumanCarriedCouplingPose.IGrip | null =
          coupled?.places[index] ?? null;
        const tangent: IAutoMovieVector3 | undefined =
          coupled === null || local === null || gripStance === undefined
            ? undefined
            : HumanCarriedGrip(
                body,
                gripStance,
                side,
                coupled.anchor,
                local,
                hold,
                coupled.places[1 - index] === null,
              );
        const palm: ReturnType<typeof HumanHandTarget.prepareGoal> | null =
          local === null
            ? null
            : HumanHandTarget.prepareGoal(body, side, {
                bend: local.forward === undefined ? "hang" : "front",
                ...(hold.shape === undefined ? {} : { shape: hold.shape }),
              });
        const holdBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
          local === null
            ? new Set([body.surfaces.regions[hold.region].bone])
            : undefined;
        const region: AutoMovieHumanoidRegion | undefined =
          cradle === undefined
            ? undefined
            : (HumanCarriedCoupling.HOLDS.cradle[index] ?? undefined);
        const heldBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
          cradle === undefined || region === undefined
            ? undefined
            : new Set([cradle.body.surfaces.regions[region].bone]);
        const shoulder: AutoMovieHumanoidBone = `${side}UpperArm`;
        const shoulders: ReadonlySet<AutoMovieHumanoidBone> = new Set([
          shoulder,
        ]);
        const surface =
          body.surfaces.regions[side === "left" ? "palmLeft" : "palmRight"];
        primitives.push(
          carryPalm(
            {
              body,
              side,
              from: 0,
              to: seconds,
              rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
              goal: (
                posture: IAutoMovieMotionHumanPosture,
                time: number,
              ): IAutoMovieHumanLimbGoal => {
                if (coupled !== null && local !== null && palm !== null) {
                  // The hold rides the same anchor bone as the borne body, and
                  // the palm, not the wrist, lies on the held region, facing it.
                  // The goal is attached to that bone (`IGoal.on`), so a layer
                  // that tips the body after this plan, as a walked carry's
                  // lean does, carries the hand with the body it holds.
                  const anchor: IAutoMovieResolvedBone =
                    HumanCarriedCouplingPose.bones(
                      body,
                      posture,
                      coupled.anchor,
                      resolution,
                      anchorBones,
                    ).get(coupled.anchor)!;
                  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
                    anchor.worldRotation,
                  );
                  const toBone = (
                    point: IAutoMovieVector3,
                  ): IAutoMovieVector3 =>
                    Quaternion.rotateVector(
                      inverse,
                      Vector3.subtract(point, anchor.worldPosition),
                    );
                  const moving: boolean =
                    cradle !== undefined &&
                    region !== undefined &&
                    transfer !== undefined &&
                    (time < transfer.lift || time > seconds - transfer.setDown);
                  const carried = {
                    point: Vector3.add(
                      anchor.worldPosition,
                      Quaternion.rotateVector(
                        anchor.worldRotation,
                        local.point,
                      ),
                    ),
                    normal: Quaternion.rotateVector(
                      anchor.worldRotation,
                      local.normal,
                    ),
                  };
                  const poses:
                    | ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]>
                    | undefined = moving
                    ? cradle!.bones(context.start + time, heldBones)
                    : undefined;
                  const current: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
                    poses === undefined
                      ? carried
                      : StrikingBody.region(cradle!.body, poses, region!);
                  const forward: IAutoMovieVector3 | undefined =
                    tangent === undefined
                      ? undefined
                      : Quaternion.rotateVector(anchor.worldRotation, tangent);
                  let world: IAutoMovieHumanLimbGoal = palm(
                    posture,
                    current,
                    forward,
                  );
                  if (poses !== undefined) {
                    const origin: IAutoMovieVector3 = HumanTrunk.resolve(
                      body,
                      posture,
                      undefined,
                      resolution,
                      shoulders,
                    ).get(shoulder)!.worldPosition;
                    const reach = (
                      place: IAutoMovieMotionHumanCarriedCouplingPose.IHold,
                      grip: IAutoMovieHumanLimbGoal,
                    ): IAutoMovieHumanLimbGoal => {
                      if (Vector3.distance(grip.point, origin) <= arm)
                        return grip;
                      const circle: ReturnType<typeof HumanCarriedWristCircle> =
                        HumanCarriedWristCircle(
                          place.point,
                          place.normal,
                          grip.point,
                          origin,
                        );
                      const direction: IAutoMovieVector3 =
                        forward ??
                        Quaternion.rotateVector(
                          grip.rotation!,
                          surface.forward!,
                        );
                      return palm(
                        posture,
                        place,
                        Quaternion.rotateVector(
                          Quaternion.fromAxisAngle(
                            place.normal,
                            circle.degrees,
                          ),
                          direction,
                        ),
                      );
                    };
                    world = reach(current, world);
                  }
                  return {
                    ...world,
                    point: toBone(world.point),
                    bend: toBone(world.bend),
                    ...(world.rotation === undefined
                      ? {}
                      : {
                          rotation: Quaternion.multiply(
                            inverse,
                            world.rotation,
                          ),
                        }),
                    on: coupled.anchor,
                    ...(moving ? {} : { clearanceOn: local.clearance }),
                  };
                }
                return {
                  point: Vector3.add(
                    HumanCarriedCouplingPose.region(
                      body,
                      HumanTrunk.resolve(
                        body,
                        posture,
                        undefined,
                        resolution,
                        holdBones,
                      ),
                      hold.region,
                    ),
                    HumanFrame.point(
                      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                      {
                        x: (side === "left" ? 1 : -1) * hold.offset.out * arm,
                        y: hold.offset.up * arm,
                        z: hold.offset.forward * arm,
                      },
                    ),
                  ),
                  bend: AutoMovieMotionHumanBend.hang(body, posture, side),
                };
              },
              weight,
            },
            transfer !== undefined && transfer.lift + transfer.setDown > 0,
          ),
        );
        if (local !== null && hold.shape !== undefined)
          primitives.push(
            AutoMovieMotionHumanHand.shape({
              side,
              shape: hold.shape,
              from: 0,
              to: seconds,
              weight,
            }),
          );
      },
    );
    // A coupled bearer tips about its feet by the pair's balance as its hands
    // take the body, which rides it and so tips with it. Two helpers keep
    // their stances: the body rides the first, so a tip of either would
    // carry the other's contacts off it.
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, seconds);
    const directsBody: boolean =
      context.carrier === undefined &&
      coupling !== undefined &&
      coupling.bearers === undefined;
    const tip: ReturnType<typeof HumanCarriedCouplingLoad.lean> = !directsBody
      ? { pitch: 0, roll: 0 }
      : HumanCarriedCouplingLoad.lean(body, coupling!, role);
    // A lone bearer takes the stance the coupling placed the body on, its
    // trunk inclined and its knees lowered as the hands take the body
    // (`bendLower.lower`, the stance's own lowering); upright it keeps its
    // base.
    const stance: IAutoMovieMotionCoupling["key"]["stance"] = !directsBody
      ? { incline: 0, depth: 0 }
      : coupling!.key.stance;
    const bent = (
      posture: IAutoMovieMotionHumanPosture,
      w: number,
    ): IAutoMovieMotionHumanPosture =>
      (stance.incline === 0 && stance.depth === 0) ||
      posture.limbs.leftLeg === undefined ||
      posture.limbs.rightLeg === undefined
        ? posture
        : bendLower.lower(
            body,
            posture,
            "squat",
            stance.incline * w,
            stance.depth * w,
            0,
          );
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: {
          ...base,
          // The coupling declares the borne side of every bearing contact.
          // Its holding palms declare the same closed contacts from this
          // side, so overlays and transitions retain them until release.
          contacts: [
            ...base.contacts,
            ...(of === undefined || coupling === undefined
              ? []
              : coupling.contacts
                  .filter(
                    (contact): boolean =>
                      contact.kind === "bear" &&
                      contact.on.role === role &&
                      (contact.on.region === "palmLeft" ||
                        contact.on.region === "palmRight"),
                  )
                  .map(
                    (contact): IAutoMovieMotionHumanContactWindow => ({
                      part:
                        contact.on.region === "palmLeft"
                          ? "leftHand"
                          : "rightHand",
                      kind: "grip",
                      from: clock.at("held") / seconds,
                      to: released / seconds,
                      load: 0,
                      support: {
                        kind: "person",
                        subject: of,
                        region: contact.region,
                      },
                    }),
                  )),
          ],
          posture: (
            at: number,
            _channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): IAutoMovieMotionHumanPosture => {
            const underlying: IAutoMovieMotionHumanPosture = base.posture(
              at,
              undefined,
              source,
              projection,
            );
            if (!directsBody) return underlying;
            const w: number = clock.progress(
              AutoMovieMotionClock.START,
              "held",
              at,
            );
            return HumanCarriedLean.tipped(
              bent(underlying, w),
              tip.pitch * w,
              tip.roll * w,
            );
          },
        },
        clock,
        primitives,
      });
    return {
      ...composed,
      posture: (
        at: number,
        channels?: readonly AutoMovieMotionHumanChannel[],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const previous: typeof resolution = resolution;
        resolution = prepareHumanPoseResolution(source);
        try {
          return composed.posture(at, channels, resolution, projection);
        } finally {
          resolution = previous;
        }
      },
    };
  }
}

/** Keep the held arm's actual surface goal for the display's swivel course. */
function carryPalm(
  props: IAutoMovieMotionHumanArmCarry.ICarry,
  holdSurface: boolean,
): IAutoMovieMotionHumanPrimitive {
  const motion: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanArm.carried(props);
  if (!holdSurface) return motion;
  return {
    ...motion,
    write: (
      posture,
      seconds,
      before,
      resolution,
      projection,
      evaluation,
    ): IAutoMovieMotionHumanPosture => {
      if (props.weight(seconds) < 1)
        return motion.write(
          posture,
          seconds,
          before,
          resolution,
          projection,
          evaluation,
        );
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [`${props.side}Arm`]: props.goal(
            posture,
            seconds,
            resolution,
            projection,
          ),
        },
      };
    },
  };
}
