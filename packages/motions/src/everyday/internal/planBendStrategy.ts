import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHand } from "../../compose/internal/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { HumanBalance } from "./HumanBalance";
import { HumanGaze } from "./HumanGaze";
import { admitBendBrace } from "./admitBendBrace";
import { bend } from "./bend";
import { bendFloorHand } from "./bendFloorHand";
import { bendLower } from "./bendLower";
import { bendReleasedFingers } from "./bendReleasedFingers";
import { braceOnThigh } from "./braceOnThigh";
import { prepareBendGoal } from "./prepareBendGoal";
import { prepareBendSquat } from "./prepareBendSquat";

/*
 * Fit one complete lowering of a bend: both arm courses and the held surface,
 * for the requested strategy.
 *
 * Moved unchanged from `bend` to keep that file under the repository's 500-line
 * limit; its caller and behaviour are unchanged.
 */
export function planBendStrategy(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBend.IParams>,
  requested: IAutoMovieMotionHumanBend.Strategy,
  target: IAutoMovieVector3,
  wristReach?: number,
  alignTrunk: boolean = false,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  const hold: number = context.params.hold ?? bend.HOLD;
  HumanBound.least("hold", hold, 0, "s");
  const probe: IAutoMovieMotionHumanActionPlan = stand.plan(
    { ...context, params: { hold: 1 } },
    side,
  );
  const upright: IAutoMovieMotionHumanPosture = probe.posture(0);
  // When the sagittal course is obstructed, direct the upper trunk's
  // inclination toward the unilateral contact. The angle is the lateral
  // displacement of the contact over the pelvis-to-shoulder lever.
  const lateralTilt: number = alignTrunk
    ? bendLower.lateralTilt(body, upright, target, side)
    : 0;
  const region: IAutoMovieHumanoidSurfaces.IFrame | undefined =
    context.params.target.kind === "self"
      ? body.surfaces.regions[context.params.target.region]
      : undefined;
  const floorContact: boolean =
    region === undefined &&
    probe.contacts.some(
      ({ support }): boolean =>
        support.kind === "ground" && target.y === (support.height ?? 0),
    );
  const goal: ReturnType<typeof prepareBendGoal> = prepareBendGoal(
    body,
    side,
    target,
    region,
    bend.REACH_OUT,
  );
  const fixedWrist: IAutoMovieVector3 | undefined =
    region === undefined ? goal(upright).point : undefined;
  const wristAt: bendLower.WristAt =
    fixedWrist === undefined
      ? (
          lowered: IAutoMovieMotionHumanPosture,
          read: ReturnType<typeof prepareHumanPoseResolution>,
        ): IAutoMovieVector3 => goal(lowered, read).point
      : () => fixedWrist;
  // The time of a movement that stops on a target, for the hand's travel
  // (`AutoMovieMotionHumanTiming.aimed`), scaled by skill.
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    bones(body, upright),
    side,
    "palm",
  ).point;
  const D: number = Vector3.length(Vector3.subtract(target, hand));
  const speed: number = HumanSkill.quantity(context.skill, "speed", 1.4, 1.0);
  const down: number = speed * AutoMovieMotionHumanTiming.aimed(D, 0);
  const duration: number = 2 * down + hold;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
    { name: "contact", seconds: down },
    { name: "deepest", seconds: down },
    { name: "upright", seconds: duration },
  ]);
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    context.params,
    bend,
    context.start,
    { duration, events: clock.events() },
    context.instant,
  );
  if (window !== null && window.by !== "hips")
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "balance.by",
      value: window.by,
      reason:
        "the bend carries its trunk inclination through the hips above planted feet",
      fix: "give hips for balance.by",
    });
  // A changing balance window can move the body during its hold.
  const moving: number = window === null ? 2 * down : duration;
  const rise: number = moving - down;
  // The body stands under the bend, its sway signed in the bending side's
  // frame, so a left bend mirrors a right one (`stand.plan`).
  const standing: IAutoMovieMotionHumanActionPlan = stand.plan(
    { ...context, params: { hold: 2 * down } },
    side,
  );
  const atContact: IAutoMovieMotionHumanPosture = standing.posture(down);
  const { strategy, lean, pitch }: IAutoMovieMotionHumanBendLower.ISolved =
    bend.lowering(
      body,
      atContact,
      target,
      side,
      requested,
      wristReach ??
        bendLower.REACH * (body.measure.upperArm + body.measure.forearm),
      undefined,
      wristAt,
      lateralTilt,
    );

  const squat: ReturnType<typeof prepareBendSquat> =
    strategy === "stoop"
      ? undefined
      : prepareBendSquat(
          body,
          atContact,
          bendLower.lower(
            body,
            atContact,
            strategy,
            pitch,
            1,
            lean * Math.sin((pitch * Math.PI) / 180),
            undefined,
            lateralTilt,
          ),
          strategy,
          side,
          fixedWrist === undefined
            ? (
                posture: IAutoMovieMotionHumanPosture,
                placed?: ReadonlyMap<
                  AutoMovieHumanoidBone,
                  IAutoMovieResolvedBone
                >,
              ): IAutoMovieVector3 =>
                goal(posture, undefined, undefined, placed).point
            : (): IAutoMovieVector3 => fixedWrist,
        );
  const base: IAutoMovieMotionHumanActionPlan =
    window === null
      ? standing
      : {
          ...standing,
          duration: moving,
          posture: (
            seconds,
            channels,
            resolution,
            projection,
          ): IAutoMovieMotionHumanPosture =>
            standing.posture(
              Math.min(down, seconds) + Math.max(0, seconds - rise),
              channels,
              resolution,
              projection,
            ),
        };

  // How far down the bend is at a second: down over the descent, held,
  // and up again over as long.
  const share: (seconds: number) => number = (seconds: number): number => {
    const t: number = Math.min(moving, Math.max(0, seconds));
    return 1 - AutoMovieEngineMotionSampling.minimumJerkShare(Math.max(down - t, t - rise, 0) / down);
  };

  const free: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const lowerAt: ReturnType<typeof bendLower.prepare> = bendLower.prepare(
    body,
    strategy,
  );
  const armSpan: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: down,
    relax: rise,
    end: moving,
  };
  const sink: IAutoMovieMotionHumanPrimitive = {
    channels: ["root", "trunk", "head", "leftLeg", "rightLeg"],
    reads: ["root", "trunk", "head", "leftLeg", "rightLeg"],
    from: 0,
    to: moving,
    write: (
      standing: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieMotionHumanPosture => {
      const s: number = share(seconds);
      const angle: number = pitch * s;
      const back: number = lean * Math.sin((angle * Math.PI) / 180);
      let lowered: IAutoMovieMotionHumanPosture = lowerAt(
        standing,
        angle,
        s,
        back,
        resolution,
        lateralTilt,
      );
      if (squat !== undefined) lowered = squat(lowered, s, standing);
      const weight: number = HumanPhysics.weightAt(window, seconds);
      if (weight > 0) {
        const support: IAutoMovieMotionHumanBalance.ISupport =
          HumanBalance.support(body, lowered, resolution);
        const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(
          support,
          HumanFrame.forward(lowered.yaw),
        );
        if (shift !== null && shift !== 0)
          lowered =
            squat === undefined
              ? lowerAt(
                  standing,
                  angle,
                  s,
                  back - weight * shift,
                  resolution,
                  lateralTilt,
                )
              : lowerHumanPosture(
                  body,
                  {
                    ...lowered,
                    root: Vector3.addScaled(
                      lowered.root,
                      HumanFrame.forward(lowered.yaw),
                      weight * shift,
                    ),
                  },
                  undefined,
                  resolution,
                );
      }
      return HumanGaze.aim(body, lowered, target, "head", {
        eyes: s,
        head: s,
        trunk: 0,
      });
    },
  };

  // The measured target and the supporting thigh are each held in their
  // own frames. The arm planner lays their routes on the lowered body.
  const arms: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArm.together();
  const lateral: number = HumanFrame.local(
    { origin: upright.root, yaw: upright.yaw },
    target,
  ).x;
  const apart: boolean = side === "left" ? lateral > 0 : lateral < 0;
  const lowerLegs: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftLowerLeg",
    "rightLowerLeg",
  ]);
  const readShins: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    lowerLegs,
  );
  const placeShins: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(body, lowerLegs);
  // The contact read's bones and their reader, prepared once with the plan.
  const contactBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
    region === undefined
      ? undefined
      : new Set<AutoMovieHumanoidBone>([
          ...lowerLegs,
          region.bone,
          `${side}UpperArm`,
        ]);
  const readContact: ReturnType<typeof poseBones.prepare> | undefined =
    contactBones === undefined
      ? undefined
      : poseBones.prepare(body, contactBones);
  const reach: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
    {
      body,
      side,
      from: 0,
      to: moving,
      span: armSpan,
      ...(region === undefined ? {} : { on: region.bone }),
      ...(apart ? { beside: arms } : { together: arms }),
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      weight: share,
      goal: (
        posture: IAutoMovieMotionHumanPosture,
        _seconds: number,
        source?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
      ): IAutoMovieHumanLimbGoal => {
        // Native target and shin readers observe one posture with no edit between them.
        // The union requests every chain required by either observation. Bind it only
        // after checking the actual body and loan, since binding itself is observable.
        if (
          strategy !== "stoop" &&
          region !== undefined &&
          contactBones !== undefined &&
          readContact !== undefined &&
          (projection === undefined || projection === body.projection)
        ) {
          const read: ReturnType<typeof prepareHumanPoseResolution> =
            prepareHumanPoseResolution(source);
          const frame: ReturnType<typeof resolveHumanPosture.seeded> =
            resolveHumanPosture.seeded(
              body,
              posture,
              undefined,
              {},
              read,
              contactBones,
              projection,
            );

          const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            readContact(frame.pose, read());
          return {
            ...goal(posture, source, projection, placed),
            clear: placeShins(placed),
          };
        }
        const site: IAutoMovieHumanLimbGoal = goal(posture, source, projection);
        if (strategy === "stoop") return site;
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const frame: ReturnType<typeof resolveHumanPosture.seeded> =
          resolveHumanPosture.seeded(
            body,
            posture,
            undefined,
            {},
            read,
            lowerLegs,
            projection,
          );
        return { ...site, clear: placeShins(readShins(frame.pose, read())) };
      },
    },
  );
  const brace: IAutoMovieMotionHumanPrimitive = braceOnThigh(
    body,
    free,
    AutoMovieMotionHumanArm.angles(context.entry.pose, free),
    moving,
    share,
    armSpan,
    arms,
    apart,
    squat === undefined ? undefined : { x: 0, y: 1, z: 0 },
  );
  const fingers: (
    hand: AutoMovieHumanSide,
  ) => IAutoMovieMotionHumanPrimitive = (
    hand: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPrimitive =>
    hand !== side || !floorContact
      ? AutoMovieMotionHumanHand.shape({
          side: hand,
          shape: "flat",
          from: 0,
          to: moving,
          weight: share,
        })
      : bendFloorHand(body, upright, hand, moving, share);
  const travel: IAutoMovieMotionClock = AutoMovieMotionClock(moving, [
    { name: "contact", seconds: down },
    { name: "deepest", seconds: down },
    { name: "upright", seconds: moving },
  ]);
  const armCourse: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock: travel,
      contact: "contact",
      primitives: [sink, reach, brace, fingers(side), fingers(free)],
    });
  const course: IAutoMovieMotionHumanActionPlan = floorContact
    ? composeAutoMovieMotionHumanAction({
        base: armCourse,
        clock: travel,
        contact: "contact",
        primitives: [
          bendReleasedFingers(body, side, moving, share, target.y, D),
        ],
      })
    : armCourse;
  // A bracing palm must bear on the front of its thigh (`admitBendBrace`).
  const braced: IAutoMovieMotionHumanPosture | undefined =
    region === undefined ? undefined : admitBendBrace(body, course, down, free);
  if (hold === 0 || window !== null)
    return { ...course, ...HumanPhysics.declared(context.params, window) };

  // Nothing changes while holding a bend. Measure one actual lowest
  // body with both hands placed. The reaching and returning courses
  // meet on this single key regardless of how long it is held.
  const held: IAutoMovieMotionHumanPosture = braced ?? course.posture(down);
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds,
    channels,
    resolution,
    projection,
  ) =>
    seconds < down || seconds > down + hold
      ? course.posture(
          seconds < down ? seconds : seconds - hold,
          channels,
          resolution,
          projection,
        )
      : held;
  return {
    ...course,
    ...HumanPhysics.declared(context.params, window),
    duration,
    events: clock.events(),
    posture,
  };
}

/*
 * World bones of a posture, limbs solved.
 */
function bones(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): ReturnType<typeof poseBones> {
  return poseBones(body, resolveHumanPosture(body, posture));
}
