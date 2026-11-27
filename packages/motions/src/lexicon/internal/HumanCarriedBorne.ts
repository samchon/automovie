import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanCarried } from "./HumanCarried";
import { HumanCarriedCoupling } from "./HumanCarriedCoupling";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedLift } from "./HumanCarriedLift";

/*
 * The plan of being carried in a named carry (`HumanCarried.borne`): the borne
 * body on the bearer by the carry's coupled meeting, with the lift and the
 * set-down, and the seconds reader both carry laws share.
 */
export namespace HumanCarriedBorne {
  /*
   * Plan being carried; `HumanCarried.borne` states the law.
   * Parameter context: The carried person's context.
   * Returns: The plan.
   * As `HumanCarried.borne` states.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBorne>,
  ): IAutoMovieMotionHumanActionPlan {
    const by: string | undefined = context.params.partner;
    const seconds: number = lasting(context.params.hold ?? 2);
    if (by === context.subject)
      throw new AutoMovieMotionHumanRefusal({
        kind: "participant",
        axis: "partner",
        value: by,
        reason: "a person is carried by someone else",
        fix: "name the carrier",
      });
    const carry: IAutoMovieMotionHumanCarried.Carry =
      context.params.carry ?? "piggyback";
    const row: IAutoMovieMotionHumanCarried.IRow = HumanCarried.CARRIES[carry];
    const body: IAutoMovieMotionHumanBody = context.body;
    const carrier: IAutoMovieMotionHumanPerformerReader | undefined =
      by === undefined ? undefined : context.performer(by);

    // A second helper takes the carry's other side.
    const second: string | undefined = context.params.with;
    if (
      second !== undefined &&
      (by === undefined || HumanCarriedCoupling.PAIRED[carry] === undefined)
    )
      throw new AutoMovieMotionHumanRefusal({
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
    const helper: IAutoMovieMotionHumanPerformerReader | undefined =
      second === undefined ? undefined : context.performer(second);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const [hip, knee, apart]: readonly [number, number, number] = row.legs;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      leftUpperLeg: [hip, apart, 0],
      rightUpperLeg: [hip, apart, 0],
      leftLowerLeg: [knee, 0, 0],
      rightLowerLeg: [knee, 0, 0],
    };

    // A carrier makes the carry a coupled meeting: the borne body
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
    // The fixed coupling names exactly the anchor and gripping regions read
    // from each bearer's actual displayed pose; all their needed fits remain.
    const demanded = (
      who: IAutoMovieMotionHumanPerformerReader,
      role: string,
    ): ReadonlySet<AutoMovieHumanoidBone> => {
      const selected: Set<AutoMovieHumanoidBone> = new Set();
      const region = (name: AutoMovieHumanoidRegion): void => {
        const bone: AutoMovieHumanoidBone | undefined =
          who.body.surfaces.regions[name]?.bone;
        if (bone !== undefined) selected.add(bone);
      };
      if (coupling === undefined) {
        selected.add("hips");
        region(row.theirs);
        for (const name of row.clings) if (name !== null) region(name);
      } else {
        if (role === coupling.bearer) selected.add(coupling.anchor);
        for (const contact of coupling.contacts)
          if (contact.kind === "grip" && contact.on.role === role)
            region(contact.on.region);
      }
      return selected;
    };
    const carrierBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      carrier === undefined
        ? undefined
        : demanded(carrier, HumanCarriedCoupling.BEARER);
    const helperBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      helper === undefined
        ? undefined
        : demanded(helper, HumanCarriedCoupling.SECOND);
    const carried:
      | ReturnType<typeof HumanCarriedCouplingPose.preparePosture>
      | undefined =
      coupling === undefined
        ? undefined
        : HumanCarriedCouplingPose.preparePosture(body, coupling, row);
    const legacy: IAutoMovieMotionHumanPosture =
      HumanCarriedCouplingPose.key(row);
    const ownRegion: IAutoMovieVector3 | undefined =
      carrier === undefined || coupling !== undefined
        ? undefined
        : HumanCarriedCouplingPose.region(
            body,
            HumanTrunk.resolve(
              body,
              { ...legacy, yaw: 0 },
              undefined,
              undefined,
              new Set<AutoMovieHumanoidBone>([
                body.surfaces.regions[row.mine].bone,
              ]),
            ),
            row.mine,
          );
    // Unless `lift` says otherwise, the body is lifted into the carry over the
    // time the bearer's hands take to reach their hold (`HumanCarried.TAKE`),
    // so it never jumps onto the carrier. It is set down only when `setDown` asks: a carry may
    // end with the body still borne.
    return HumanCarriedLift.over(
      {
        ...context,
        params: {
          ...context.params,
          lift: context.params.lift ?? HumanCarried.TAKE,
        },
      },
      {
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
        posture: (
          at: number,
          _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        ): IAutoMovieMotionHumanPosture => {
          // With no carrier the carry's posture is taken where the body stands.
          if (carrier === undefined)
            return { ...entry, pitch: row.pitch, joints, limbs: {} };
          if (carried !== undefined) {
            const t: number =
              context.start + Math.min(seconds, Math.max(0, at));
            return carried({
              [HumanCarriedCoupling.BEARER]: {
                body: carrier.body,
                bones: carrier.bones(t, carrierBones),
              },
              ...(helper === undefined
                ? {}
                : {
                    [HumanCarriedCoupling.SECOND]: {
                      body: helper.body,
                      bones: helper.bones(t, helperBones),
                    },
                  }),
            });
          }
          const theirs: ReturnType<
            IAutoMovieMotionHumanPerformerReader["bones"]
          > = carrier.bones(
            context.start + Math.min(seconds, Math.max(0, at)),
            carrierBones,
          );
          const hips: IAutoMovieResolvedBone | undefined = theirs.get("hips");
          const turned: IAutoMovieMotionHumanPosture = {
            ...legacy,
            yaw:
              (hips === undefined
                ? 0
                : HumanFrame.heading(hips.worldRotation)) + row.turn,
          };

          // The root that puts the resting region on the carrier's region.
          const posture: IAutoMovieMotionHumanPosture = {
            ...turned,
            root: Vector3.subtract(
              Vector3.add(
                HumanCarriedCouplingPose.region(
                  carrier.body,
                  theirs,
                  row.theirs,
                ),
                {
                  x: 0,
                  y:
                    (row.rise ?? 0) *
                    (carrier.body.measure.upperArm +
                      carrier.body.measure.forearm),
                  z: 0,
                },
              ),
              Quaternion.rotateVector(HumanFrame.turn(turned.yaw), ownRegion!),
            ),
          };
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
          (["left", "right"] as const).forEach(
            (side: AutoMovieHumanSide, index: number): void => {
              const region: AutoMovieHumanoidRegion | null =
                row.clings[index] ?? null;
              if (region !== null)
                limbs[`${side}Arm`] = {
                  point: HumanCarriedCouplingPose.region(
                    carrier.body,
                    theirs,
                    region,
                  ),
                  bend: AutoMovieMotionHumanBend.hang(body, posture, side),
                };
            },
          );
          return { ...posture, limbs };
        },
      },
    );
  }

  /*
   * A carry's seconds, refused when not positive.
   * Parameter seconds: The seconds.
   * Returns: The seconds.
   * A `parameter` refusal on `seconds`.
   */
  export function lasting(seconds: number): number {
    return HumanBound.above("hold", seconds, 0, "s");
  }
}
