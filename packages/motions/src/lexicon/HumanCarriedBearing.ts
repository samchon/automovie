import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/bendLower";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanCarried } from "./HumanCarried";
import { HumanCarriedBorne } from "./HumanCarriedBorne";
import { HumanCarriedCoupling } from "./HumanCarriedCoupling";
import { HumanCarriedCouplingLoad } from "./HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedLean } from "./HumanCarriedLean";

/**
 * The plan of holding a person in a named carry (`HumanCarried.bearing`):
 * the bearer's hands where the coupled carry lays the held regions (#3437),
 * for a first or a second helper.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned and for which law.
 * @evidence contracts/development/design.md#principled-representation The law's plan as a function of its context, kept beside the law record `HumanCarried` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record, the parameters and the rows stay `HumanCarried`'s.
 */
export namespace HumanCarriedBearing {
  /**
   * Plan the carrier's hold; `HumanCarried.bearing` states the law.
   *
   * @param context The carrier's context.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and where the law is documented.
   * @evidence contracts/development/implementation.md#principled-implementation With the carried person named, each holding palm goes where the coupled carry lays the held region in this bearer's displayed anchor frame, the bone the borne body rides (`HumanCarriedCouplingPose.holds`), a second helper's in its own, the goal attached to that bone (`IGoal.on`) so a layer's tip carries it, and a lone bearer's base takes the coupling's stance (`bendLower.lower`) and tips about the feet by the pair's balance (`HumanCarriedCouplingLoad.lean`) as the hands take the body, two helpers keeping their stances; otherwise each wrist goes to the row's place from one of the carrier's own regions, in arm lengths, and the base is kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The role, the coupling, one arm primitive per holding hand, then the inherited base tipped.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hands do not read the carried body's displayed bones; the rows' places are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each holding arm retains its actual goal/target calculations and any required whole posture fits. Final FK requests only its anchor or held-region owner, and both arm callbacks borrow one exact workspace within a single composed posture evaluation; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed role, coupling, hold rows and demanded bone metadata belong to this plan. Canonical query loans reach the same-body base and composed arm callbacks. One explicit synchronous posture call shares exact scalar FK prerequisites only; each arm still reads its actual current posture, so earlier arm writes, limb-anchor full fitting and rival clearance remain authoritative.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains its fixed coupling/role/hold metadata and entry state. A posture call owns at most one lazy FK reader, restoring any nested parent scope in finally; returned postures capture no reader or map and plan release drops fixed metadata.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBearing>,
  ): IAutoMovieMotionHumanActionPlan {
    const seconds: number = HumanCarriedBorne.lasting(
      context.params.seconds ?? 2,
    );
    const carry: IAutoMovieMotionHumanCarried.Carry = context.params.carry ?? "piggyback";
    const row: IAutoMovieMotionHumanCarried.IRow = HumanCarried.CARRIES[carry];
    const body: IAutoMovieMotionHumanBody = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;

    // With the carried person named, each holding hand goes where the
    // coupled carry lays the held region, in the frame of the carrier's own bone the borne body rides
    // (#3437); the carried body is never read, only its rest body.
    const of: string | undefined = context.params.of;
    const beside: string | undefined = context.params.beside;

    // With two helpers, the one whose carry is the other side of a
    // paired carry is the second; the meeting's kind is the first's.
    const first: IAutoMovieMotionHumanCarried.Carry | undefined =
      beside === undefined
        ? undefined
        : (
            Object.keys(HumanCarriedCoupling.PAIRED) as IAutoMovieMotionHumanCarried.Carry[]
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
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      seconds,
      [{ name: "held", seconds: Math.min(seconds, HumanCarried.TAKE) }],
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const anchorBones: ReadonlySet<AutoMovieHumanoidBone> | undefined = coupled === null
      ? undefined : new Set<AutoMovieHumanoidBone>([coupled.anchor]);
    let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    (["left", "right"] as const).forEach(
      (side: "left" | "right", index: number): void => {
        const hold: IAutoMovieMotionHumanCarried.IHold | null = row.holds[index] ?? null;
        if (hold === null) return;
        const holdBones: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([body.surfaces.regions[hold.region].bone]);
        primitives.push(
          AutoMovieMotionHumanArm.carried({
            body,
            side,
            from: 0,
            to: seconds,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
            goal: (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal => {
              const local: IAutoMovieMotionHumanCarriedCouplingPose.IHold | null =
                coupled?.places[index] ?? null;
              if (coupled !== null && local !== null) {
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
                const toBone = (point: IAutoMovieVector3): IAutoMovieVector3 =>
                  Quaternion.rotateVector(
                    inverse,
                    Vector3.subtract(point, anchor.worldPosition),
                  );
                const world: IAutoMovieHumanLimbGoal =
                  AutoMovieMotionHumanArmTarget.goal(
                    body,
                    side,
                    AutoMovieMotionHumanTarget.hand(
                      body,
                      posture,
                      side,
                      {
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
                      },
                      { surface: "palm", shape: "relaxed" },
                    ),
                  );
                return {
                  ...world,
                  point: toBone(world.point),
                  bend: toBone(world.bend),
                  ...(world.rotation === undefined
                    ? {}
                    : {
                        rotation: Quaternion.multiply(inverse, world.rotation),
                      }),
                  on: coupled.anchor,
                };
              }
              return {
                point: Vector3.add(
                  HumanCarriedBorne.placed(
                    body,
                    HumanTrunk.resolve(body, posture, undefined, resolution, holdBones),
                    hold.region,
                    "carry",
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
            weight: (at: number): number =>
              clock.progress(AutoMovieMotionClock.START, "held", at),
          }),
        );
      },
    );
    // A coupled bearer tips about its feet by the pair's balance as its hands
    // take the body, which rides it and so tips with it. Two helpers keep
    // their stances: the body rides the first, so a tip of either would
    // carry the other's contacts off it.
    const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      seconds,
    );
    const tip: { pitch: number; roll: number } =
      coupling === undefined || coupling.bearers !== undefined
        ? { pitch: 0, roll: 0 }
        : HumanCarriedCouplingLoad.lean(body, coupling, role);
    // A lone bearer takes the stance the coupling placed the body on, its
    // trunk inclined and its knees lowered as the hands take the body
    // (`bendLower.lower`, the stance's own lowering); upright it keeps its
    // base.
    const stance: { incline: number; depth: number } =
      coupling === undefined || coupling.bearers !== undefined
        ? { incline: 0, depth: 0 }
        : coupling.key.stance;
    const bent = (posture: IAutoMovieMotionHumanPosture, w: number): IAutoMovieMotionHumanPosture =>
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
    const composed: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
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
                    to: 1,
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
          _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
          source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
          projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
        ): IAutoMovieMotionHumanPosture => {
          const w: number = clock.progress(
            AutoMovieMotionClock.START,
            "held",
            at,
          );
          return HumanCarriedLean.tipped(
            bent(base.posture(at, undefined, source, projection), w),
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
