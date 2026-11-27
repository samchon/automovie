import { AutoMovieEngineKinematics, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, AutoMovieMotionHumanActionName, AutoMovieMotionHumanChannel, IAutoMovieHumanoidSurfaces, IAutoMovieMotionClock, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanArmTarget, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanClinch, IAutoMovieMotionHumanPerformerReader, IAutoMovieMotionHumanPosture, IAutoMovieMotionManner, IAutoMoviePhysicalShapeNearest, IAutoMovieVector3 } from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Taking a clinch grip on a partner standing within reach and holding it: the
 * two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip
 * (`collarSleeve`, kumikata).
 *
 * The goals are the partner's regions, read on the partner's displayed body at
 * every second, so the grip follows the partner. In the plum both palms lie on
 * the back of the partner's neck (the `nape`), one each side of it (`SPREAD` of
 * the half shoulder width, provisional); in the collar and sleeve grip the
 * right hand closes on the partner's left collar (`neckLeft`) and the left hand
 * on the partner's right sleeve at the elbow (`elbowRight`), mirrored for a
 * left-handed grip. Each hand reaches its region in the aimed movement time to
 * a 5 cm grip (McIntosh et al. 2018), holds `hold` seconds and lets go. The
 * feet stay planted. Events: the phrase's `ready` (`grip`, both hands closed),
 * `strokeStart`, `stroke`, `strokeEnd`, `relax` (`release`).
 *
 * With `under` the clinch is a throw's entry (tsukuri): the body lowers and
 * moves across the floor through the reach until its fulcrum region stands at
 * the partner's region that lies on it, the contact the throw turns over, and
 * at the height of the partner's centre of mass, so the fulcrum is under the
 * body it turns; the throw itself is the partner's `perturb` under the pull.
 *
 * Not yet: pummelling, underhooks and overhooks, and the turn-in's own footwork
 * (Koshida et al. 2016).
 */
export namespace clinch {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "clinch";

  /*
   * Cancel table: a clinch goes into a knee or lets go at any time.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    knee: [
      { window: ["ready", 1], kind: "inertialize", entry: 0, blend: 0.15 },
    ],
    stand: [
      {
        window: [0, 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * How far each plum hand lies from the nape's middle, a share of the
   * partner's half shoulder width (provisional).
   */
  export const SPREAD: number = 0.35;

  /*
   * The partner's region each hand grips and the sideways offset across it, a
   * share of the partner's half shoulder width toward the partner's left.
   * Parameter grip: The grip.
   * Parameter collar: The collar hand.
   * Returns: The region and offset by hand.
   */
  export function regions(
    grip: IAutoMovieMotionHumanClinch.Grip,
    collar: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanClinch.IRegionsResult {
    if (grip === "plum")
      return {
        left: { region: "nape", across: -SPREAD },
        right: { region: "nape", across: SPREAD },
      };
    const sleeve: AutoMovieHumanSide = collar === "right" ? "left" : "right";
    return {
      [collar]: {
        region: collar === "right" ? "neckLeft" : "neckRight",
        across: 0,
      },
      [sleeve]: {
        region: collar === "right" ? "elbowRight" : "elbowLeft",
        across: 0,
      },
    } as Record<AutoMovieHumanSide, IRegionsEntry>;
  }

  /*
   * A partner's region on displayed bones, moved across by a share of the half
   * shoulder width toward the partner's left.
   * Parameter body: The partner's body.
   * Parameter bones: The partner's displayed bones.
   * Parameter region: The region.
   * Parameter across: The share across.
   * Returns: The point and outward normal, world.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    bones: ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]>,
    region: AutoMovieHumanoidRegion,
    across: number,
  ): IAutoMovieMotionHumanClinch.IPlaceResult {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[region];
    const placed: ReturnType<
      typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal
    > = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(
      frame,
      bones.get(frame.bone)!,
    );
    if (across === 0) return placed;
    const left: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
      ),
    );
    return {
      point: Vector3.add(
        placed.point,
        Vector3.scale(left, across * body.measure.shoulderHalfWidth),
      ),
      normal: placed.normal,
    };
  }

  /*
   * Plan a clinch.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClinch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    HumanPhysics.fixed(
      context.params,
      "the paired contact plan owns both grips and has no independent support correction",
    );
    const body: IAutoMovieMotionHumanBody = context.body;
    const hold: number = context.params.hold ?? 2;
    HumanBound.least("hold", hold, 0, "s");
    const grip: IAutoMovieMotionHumanClinch.Grip =
      context.params.grip ?? "plum";
    const table = regions(grip, context.params.hand ?? "right");
    const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
      context.params.partner,
    );
    const requested: Set<AutoMovieHumanoidBone> = new Set([
      partner.body.surfaces.regions[table.left.region].bone,
      partner.body.surfaces.regions[table.right.region].bone,
    ]);
    if (table.left.across !== 0 || table.right.across !== 0) {
      requested.add("leftUpperArm");
      requested.add("rightUpperArm");
    }
    /*
     * The partner's bones at an action second, read as the partner is shown.
     */
    const partnerAt = (
      seconds: number,
    ): ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]> =>
      partner.bones(context.start + seconds, requested);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      0.85 * (body.measure.upperArm + body.measure.forearm),
      0.05,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: AutoMovieMotionHumanTiming.PAUSES.brief,
        hold,
        retract: reach,
      }),
      modifiers,
      { holds: ["strokeEnd"] },
    );
    const duration: number = clock.duration;
    // The body stands under the clinch, its sway signed in the gripping
    // hand's frame, so a left clinch mirrors a right one (`stand.plan`).
    const base: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { hold: duration } },
      context.params.hand ?? "right",
    );
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]),
    );
    const placeColliders = HumanColliders.preparePlaced(
      partner.body,
      requested,
    );
    const arm = (side: AutoMovieHumanSide) =>
      AutoMovieMotionHumanArm.visit({
        body,
        clock,
        side,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          bones,
          {
            origin: context.entry.posture.root,
            yaw: context.entry.posture.yaw,
          },
          side,
          "palm",
        ),
        contact: {
          kind: "grip",
          support: {
            kind: "person",
            subject: context.params.partner,
            region: table[side].region,
          },
        },
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          _resolution?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[2],
          _projection?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[3],
        ) => {
          const partnerBones = partnerAt(seconds);
          const at = place(
            partner.body,
            partnerBones,
            table[side].region,
            table[side].across,
          );
          const bearing: AutoMovieHumanoidBone =
            partner.body.surfaces.regions[table[side].region].bone;
          let closest: IAutoMoviePhysicalShapeNearest.IResult | undefined;
          for (const segment of placeColliders(partnerBones)) {
            if (segment.bone !== bearing) continue;
            for (const shape of segment.shapes) {
              const witness = AutoMovieEnginePhysics.physicalShapeNearest(
                segment.pose,
                shape,
                at.point,
                at.point,
              );
              if (
                Vector3.dot(witness.normal, at.normal) > 0 &&
                (closest === undefined || witness.distance < closest.distance)
              )
                closest = witness;
            }
          }
          return AutoMovieMotionHumanTarget.hand(
            body,
            posture,
            side,
            closest ?? at,
            {
              surface: "palm",
              shape: "relaxed",
              ...(grip === "plum" ? {} : { bend: "forward" as const }),
            },
          );
        },
      });
    const under = context.params.under;
    function entryBase(): IAutoMovieMotionHumanActionPlan {
      // The entry (tsukuri): the fulcrum brought under the partner's region,
      // the region the throw turns over it, both read on the placed trunks at
      // the start; the root goes by their difference through the reach, down
      // only (a fulcrum already below the region is not raised) and across
      // the floor, so the fulcrum stands under the body it turns.
      if (under === undefined) return base;
      const point = (
        who: IAutoMovieMotionHumanBody,
        posture: IAutoMovieMotionHumanPosture,
        region: AutoMovieHumanoidRegion,
      ): IAutoMovieVector3 => {
        const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
          who.surfaces.regions[region];
        return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
          frame,
          HumanTrunk.resolve(
            who,
            posture,
            undefined,
            undefined,
            new Set<AutoMovieHumanoidBone>([frame.bone]),
          ).get(frame.bone)!,
        );
      };
      // The fulcrum goes across to the region and down to the partner's centre
      // of mass, under it, as the thrower's hips go below the thrown body's
      // in a hip or shoulder throw (Kano, Kodokan Judo, 1986).
      const theirs: IAutoMovieMotionHumanPosture | undefined =
        partner.posture?.(context.start);
      const gap: IAutoMovieVector3 =
        theirs === undefined
          ? { x: 0, y: 0, z: 0 }
          : Vector3.subtract(
              {
                ...point(partner.body, theirs, under.on),
                y: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
                  partner.body.massModel,
                  HumanTrunk.resolve(partner.body, theirs),
                ).y,
              },
              point(body, context.entry.posture, under.fulcrum),
            );
      const drop: number = Math.max(0, -gap.y);
      return {
        ...base,
        posture: (
          seconds: number,
          channels?: readonly AutoMovieMotionHumanChannel[],
          source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
          projection?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[3],
          evaluation?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[4],
        ): IAutoMovieMotionHumanPosture => {
          const posture: IAutoMovieMotionHumanPosture = base.posture(
            seconds,
            channels,
            source,
            projection,
            evaluation,
          );
          const entered: number = clock.progress(
            AutoMovieMotionClock.START,
            "ready",
            seconds,
          );
          return {
            ...posture,
            root: {
              x: posture.root.x + gap.x * entered,
              y: posture.root.y - drop * entered,
              z: posture.root.z + gap.z * entered,
            },
          };
        },
      };
    }
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: entryBase(),
        clock,
        contact: "stroke",
        primitives: [arm("left"), arm("right")],
      });
    return composed;
  }
}

/*
 * The record of `IRegionsEntry`'s site.
 */
type IRegionsEntry = { region: AutoMovieHumanoidRegion; across: number };
