import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieMotionCoupling, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarried, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanCarried } from "./HumanCarried";
import { HumanCarriedCoupling } from "./HumanCarriedCoupling";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedLift } from "./HumanCarriedLift";

/**
 * The plan of being carried in a named carry (`HumanCarried.borne`): the
 * borne body on the bearer by the carry's coupled meeting (#3437), with the
 * lift and the set-down, and the region and seconds readers both carry laws
 * share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned and for which law.
 * @evidence contracts/development/design.md#principled-representation The law's plan as a function of its context, kept beside the law record `HumanCarried` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan and the two readers the carry laws share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record, the parameters and the rows stay `HumanCarried`'s.
 */
export namespace HumanCarriedBorne {
  /**
   * Plan being carried; `HumanCarried.borne` states the law.
   *
   * @param context The carried person's context.
   * @returns The plan.
   * @throws {HumanRefusal} As `HumanCarried.borne` states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and where the law is documented.
   * @evidence contracts/development/implementation.md#principled-implementation The coupling is read from the meeting; each second the key posture rides the first bearer's displayed anchor bone at the key offset (`HumanCarriedCouplingPose.posture`); without a solid meeting the resting region is placed on the carrier's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The row, the coupling, the windows, then one posture function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A second helper on a carry with no other side is refused; the posture is rigid in the carry and its angles provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms One key resolution, one read of each bearer's bones and one frame composition per posture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBorne>,
  ): IAutoMovieMotionHumanActionPlan {
    const by: string | undefined = context.params.by;
    const seconds: number = lasting(context.params.seconds ?? 2);
    if (by === context.subject)
      throw new HumanRefusal({
        kind: "participant",
        axis: "by",
        value: by,
        reason: "a person is carried by someone else",
        fix: "name the carrier",
      });
    const carry: IAutoMovieMotionHumanCarried.Carry = context.params.carry ?? "piggyback";
    const row: IAutoMovieMotionHumanCarried.IRow = HumanCarried.CARRIES[carry];
    const body: IAutoMovieMotionHumanBody = context.body;
    const carrier: IAutoMovieMotionHumanActionContext.IPerformer | undefined =
      by === undefined ? undefined : context.performer(by);

    // A second helper takes the carry's other side (#3440).
    const second: string | undefined = context.params.with;
    if (
      second !== undefined &&
      (by === undefined || HumanCarriedCoupling.PAIRED[carry] === undefined)
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "with",
        value: second,
        feasible: {
          kind: "alternatives",
          values: Object.keys(HumanCarriedCoupling.PAIRED),
        },
        reason: `a second helper takes the other side of a carry that has one and a first bearer, and the ${carry} ${by === undefined ? "has no first bearer" : "has no other side"}`,
        fix: "name a first bearer and a carry with another side, or no second helper",
      });
    const helper: IAutoMovieMotionHumanActionContext.IPerformer | undefined =
      second === undefined ? undefined : context.performer(second);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const [hip, knee, apart]: readonly [number, number, number] = row.legs;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      leftUpperLeg: [hip, apart, 0],
      rightUpperLeg: [hip, apart, 0],
      leftLowerLeg: [knee, 0, 0],
      rightLowerLeg: [knee, 0, 0],
    };

    // A carrier makes the carry a coupled meeting (#3437): the borne body
    // rests on every contact of the coupling, each with its load share.
    const coupling: IAutoMovieMotionCoupling | undefined =
      by === undefined
        ? undefined
        : context.meeting(
            HumanCarriedCoupling.kind(
              carry,
              HumanCarried.CARRIES,
              context.params.mass,
              second !== undefined,
            ),
            HumanCarriedCoupling.BORNE,
            [
              { role: HumanCarriedCoupling.BEARER, subject: by },
              ...(second === undefined
                ? []
                : [{ role: HumanCarriedCoupling.SECOND, subject: second }]),
            ],
          ).coupling;
    return HumanCarriedLift.over(context, {
      duration: seconds,
      events: [],
      contacts:
        by === undefined
          ? []
          : coupling === undefined
            ? [
                {
                  part: "seat",
                  kind: "seat",
                  from: 0,
                  to: 1,
                  support: {
                    kind: "person",
                    subject: by,
                    region: row.theirs,
                  },
                },
              ]
            : coupling.contacts.map(
                (
                  contact: IAutoMovieMotionCoupling.IContact,
                ): IAutoMovieMotionHumanContactWindow => ({
                  part: contact.part,
                  kind: contact.kind,
                  region: contact.region,
                  from: 0,
                  to: 1,
                  load: contact.load,
                  // Each contact bears on its own bearer, or on the floor.
                  support:
                    contact.on.role === HumanCarriedCoupling.GROUND
                      ? { kind: "ground" }
                      : {
                          kind: "person",
                          subject:
                            contact.on.role === HumanCarriedCoupling.SECOND &&
                            second !== undefined
                              ? second
                              : by,
                          region: contact.on.region,
                        },
                }),
              ),
      posture: (at: number): IAutoMovieMotionHumanPosture => {
        // With no carrier the carry's posture is taken where the body stands.
        if (carrier === undefined)
          return { ...entry, pitch: row.pitch, joints, limbs: {} };
        if (coupling !== undefined) {
          const t: number = context.start + Math.min(seconds, Math.max(0, at));
          return HumanCarriedCouplingPose.posture(body, coupling, row, {
            [HumanCarriedCoupling.BEARER]: {
              body: carrier.body,
              bones: carrier.bones(t),
            },
            ...(helper === undefined
              ? {}
              : {
                  [HumanCarriedCoupling.SECOND]: {
                    body: helper.body,
                    bones: helper.bones(t),
                  },
                }),
          });
        }
        const theirs: ReturnType<IAutoMovieMotionHumanActionContext.IPerformer["bones"]> =
          carrier.bones(context.start + Math.min(seconds, Math.max(0, at)));
        const hips: IAutoMovieResolvedBone | undefined = theirs.get("hips");
        const turned: IAutoMovieMotionHumanPosture = {
          root: { x: 0, y: 0, z: 0 },
          yaw:
            (hips === undefined ? 0 : HumanFrame.heading(hips.worldRotation)) +
            row.turn,
          pitch: row.pitch,
          roll: 0,
          joints,
          limbs: {},
        };

        // The root that puts the resting region on the carrier's region.
        const posture: IAutoMovieMotionHumanPosture = {
          ...turned,
          root: Vector3.subtract(
            Vector3.add(placed(carrier.body, theirs, row.theirs, "carry"), {
              x: 0,
              y:
                (row.rise ?? 0) *
                (carrier.body.measure.upperArm + carrier.body.measure.forearm),
              z: 0,
            }),
            placed(body, HumanTrunk.resolve(body, turned), row.mine, "carry"),
          ),
        };
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
        (["left", "right"] as const).forEach(
          (side: "left" | "right", index: number): void => {
            const region: AutoMovieHumanoidRegion | null =
              row.clings[index] ?? null;
            if (region !== null)
              limbs[`${side}Arm`] = {
                point: placed(carrier.body, theirs, region, "carry"),
                bend: AutoMovieMotionHumanBend.hang(body, posture, side),
              };
          },
        );
        return { ...posture, limbs };
      },
    });
  }

  /**
   * A region's point on resolved bones, refused on a rig without its bone.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param region The region.
   * @param axis The parameter a refusal names.
   * @returns World metres.
   * @throws {HumanRefusal} A `parameter` refusal on `axis` when the rig lacks the region's bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's surface resolution of the region's frame on its bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone is refused, never read as the origin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `resolveAutoMovieHumanoidSurfaces.place`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function placed(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
    axis: string,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[region];
    const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
    if (bone === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis,
        value: region,
        reason: `the rig has no bone ${frame.bone} for the region ${region}`,
        fix: "carry on a body of the canonical humanoid rig",
      });
    return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
  }

  /**
   * A carry's seconds, refused when not positive.
   *
   * @param seconds The seconds.
   * @returns The seconds.
   * @throws {HumanRefusal} A `parameter` refusal on `seconds`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A carry lasts a positive time.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refused, never clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanBound.above`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lasting(seconds: number): number {
    return HumanBound.above("seconds", seconds, 0, "s");
  }
}
