import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanHandAttitude } from "../posture/HumanHandAttitude";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmCarryHung } from "./AutoMovieMotionHumanArmCarryHung";
import { AutoMovieMotionHumanArmCarrySpan } from "./AutoMovieMotionHumanArmCarrySpan";
import { AutoMovieMotionHumanArmChain } from "./AutoMovieMotionHumanArmChain";
import { AutoMovieMotionHumanArmFollow } from "./AutoMovieMotionHumanArmFollow";
import { AutoMovieMotionHumanArmJointCarry } from "./AutoMovieMotionHumanArmJointCarry";
import { AutoMovieMotionHumanArmJointCourse } from "./AutoMovieMotionHumanArmJointCourse";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmPlayed } from "./AutoMovieMotionHumanArmPlayed";
import { AutoMovieMotionHumanChannel as HumanChannels } from "./AutoMovieMotionHumanChannel";

/** The alternatives of `CarriedLimb`'s site. */
type CarriedLimb = "leftArm" | "rightArm";

/**
 * An arm carried toward a goal: the joint-space carry between held angles
 * (`AutoMovieMotionHumanArmAngles`) and a goal, and the primitive that writes
 * an arm, planned over its action (`AutoMovieMotionHumanArmPlanned`) or
 * carried, the members `AutoMovieMotionHumanArm` names.
 */
export namespace AutoMovieMotionHumanArmCarry {
  /**
   * Deprecated: the joint-space carry between held angles and a goal
   * (`AutoMovieMotionHumanArmJointCarry`).
   */
  export const carry: typeof AutoMovieMotionHumanArmJointCarry =
    AutoMovieMotionHumanArmJointCarry;

  /**
   * An arm carried toward a goal by a weight: the arm's whole action planned
   * once as one trajectory with the other arms of its group
   * (`AutoMovieMotionHumanArmPlanned.planned`), read off the posture so far the
   * composer gives, over the span the caller states in its clock's instants, or
   * the span its weight states (`AutoMovieMotionHumanArmPlanned.stated`).
   * Without a span the arm keeps the deprecated joint-space carry (`carry`),
   * each law's until it states its span. A planned arm that follows a person
   * (`ICarry.tracked`) is the plan with a bounded correction toward the goal
   * read at each second of the hold
   * (`AutoMovieMotionHumanArmFollow.follower`).
   *
   * @param props The carry.
   * @returns The primitive, on the arm's channel.
   * @throws {HumanRefusal} When a planned arm has no trajectory that meets its
   *   constraints: when its action is composed (`prepare`), or at the first
   *   second written where nothing composes it.
   */
  export function carried(
    props: IAutoMovieMotionHumanArmCarry.ICarry,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: CarriedLimb = `${props.side}Arm`;
    const fingers: AutoMovieMotionHumanChannel = `${props.side}Hand`;
    const span: IAutoMovieMotionHumanArmPlanned.ISpan | undefined = props.span;

    // The arm's whole action, solved once over its span, with the other
    // arms of its group.
    const group: IAutoMovieMotionHumanArmPlanned.ITogether =
      props.beside ??
      props.together ??
      AutoMovieMotionHumanArmPlanned.together();
    group.carries.push(props);

    // A group planned beside solves each member alone on the shared base
    // (`IAutoMovieMotionHumanArmCarry.beside`): two problems of one arm's
    // nine coordinates, where one problem of both arms' eighteen costs
    // several times as much (measured on a six-second stretch: 95 s of a
    // 146 s spec in the joint problem's optimiser).
    // Each member leaves and regains the arm hanging as the body around it
    // lets it hang there (`hung`), the arm its writes hold off the plan.
    const solve = (
      before: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played> =>
      props.beside === undefined
        ? AutoMovieMotionHumanArmPlanned.planned(
            props.body,
            // One problem over every member's span, each arm on its own hold.
            AutoMovieMotionHumanArmCarrySpan(group.carries, span!),
            group.carries.map(
              (
                member: IAutoMovieMotionHumanArmCarry.ICarry,
              ): IAutoMovieMotionHumanArmCarry.ICarry =>
                AutoMovieMotionHumanArmCarryHung(
                  member,
                  AutoMovieMotionHumanArmCarrySpan([member], span!),
                  before,
                ),
            ),
            before,
            group,
            AutoMovieMotionHumanArmCarry.pace(group.carries),
          )
        : new Map(
            group.carries.flatMap(
              (
                member: IAutoMovieMotionHumanArmCarry.ICarry,
              ): [
                AutoMovieHumanSide,
                IAutoMovieMotionHumanArmTrajectory.Played,
              ][] => [
                ...AutoMovieMotionHumanArmPlanned.planned(
                  member.body,
                  member.span === undefined ? span! : member.span,
                  [
                    AutoMovieMotionHumanArmCarryHung(
                      member,
                      member.span === undefined ? span! : member.span,
                      before,
                    ),
                  ],
                  before,
                  group,
                  AutoMovieMotionHumanArmCarry.pace([member]),
                ),
              ],
            ),
          );
    const planned = (
      before: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanArmTrajectory.Played => {
      if (group.solved === undefined) {
        // A refusal is the solve's outcome as a solution is: read again, it
        // is thrown again, not solved again.
        if (group.refused !== undefined) throw group.refused;
        if (group.solving === true)
          throw new Error(
            "Two arms moved together are solved from the first of them",
          );
        group.solving = true;
        try {
          group.solved = solve(before);
        } catch (error: unknown) {
          if (error instanceof HumanRefusal) group.refused = error;
          throw error;
        } finally {
          group.solving = false;
        }
      }
      return group.solved.get(props.side)!;
    };
    // What the arm reads of other performers, solved once the performance is
    // placed (`ready`): a followed arm's correction grid
    // (`AutoMovieMotionHumanArmFollow.follower`); an arm with no span's goal
    // along the action's course (`AutoMovieMotionHumanArmChain`), each knot
    // continuing the swivel the course chose before it, on the posture so
    // far; and the arm's room as it entered the action (`entering`). Before,
    // a write reads each at its own second.
    let follow:
      | ReturnType<typeof AutoMovieMotionHumanArmFollow.follower>
      | undefined;
    let chain:
      | ReturnType<typeof AutoMovieMotionHumanArmChain.continued>
      | undefined;
    let handed: HumanArmSwing.Entered | undefined;
    // The joint-space carry off the plan, solved at knots once the performance
    // is placed (`AutoMovieMotionHumanArmJointCourse`).
    let course: AutoMovieMotionHumanArmJointCourse.Course | undefined;
    const goaled = (
      at: IAutoMovieMotionHumanPosture,
      t: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projector?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): IAutoMovieMotionHumanPosture => ({
      ...at,
      limbs: {
        ...at.limbs,
        [limb]: props.goal(at, t, resolution, projector),
      },
    });
    // The carry's inputs at a second: the goaled posture so far, along the
    // arm's course where it has no span, from its rest by its weight.
    const input = (
      at: IAutoMovieMotionHumanPosture,
      t: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projector?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): AutoMovieMotionHumanArmJointCourse.IInput => {
      const weight: number = props.weight(t);
      const aimed: IAutoMovieMotionHumanPosture = goaled(
        at,
        t,
        resolution,
        projector,
      );
      return {
        posture: chain !== undefined && weight > 0 ? chain(t, aimed) : aimed,
        from: { [props.side]: props.rest },
        share: weight,
      };
    };
    return {
      channels: [limb],
      // A planned arm plays its hand's fingers as its plan carries them
      // (`AutoMovieMotionHumanArmPlayed`), over the hand's own primitive.
      ...(span === undefined ? {} : { plays: [fingers] }),
      // An arm that follows a person reads that person live (`follower`).
      ...(span !== undefined && props.tracked === true
        ? { follows: true }
        : {}),
      reads: (seconds: number): readonly AutoMovieMotionHumanChannel[] =>
        span !== undefined &&
        props.tracked !== true &&
        props.attitude === undefined &&
        seconds > span.start &&
        (seconds <= span.end || span.relax >= span.end)
          ? []
          : HumanChannels.ORDER,
      from: props.from,
      to: props.to,
      // The group is planned when the action is, on the posture so far
      // before its first member, which leaves every member's arm out.
      ...(span === undefined
        ? {}
        : {
            prepare: (
              before: (seconds: number) => IAutoMovieMotionHumanPosture,
            ): void => void planned(before),
          }),
      ready: (before: IAutoMovieMotionHumanPrimitive.Reader): void => {
        handed = AutoMovieMotionHumanArmCarryHung.entering(
          props,
          before(props.from),
        );
        if (span === undefined)
          chain = AutoMovieMotionHumanArmChain.continued(
            props.body,
            props.to,
            (t: number): IAutoMovieMotionHumanPosture =>
              goaled(before(t), t),
            [props.side],
          );
        else if (props.tracked === true)
          follow = AutoMovieMotionHumanArmFollow.follower(
            props.body,
            props,
            span,
            planned(before),
            before,
          );
        course = AutoMovieMotionHumanArmJointCourse(
          props.body,
          props.to,
          (at: number): AutoMovieMotionHumanArmJointCourse.IInput =>
            input(before(at), at),
        );
      },
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        before?: (seconds: number) => IAutoMovieMotionHumanPosture,
        source?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
      ): IAutoMovieMotionHumanPosture => {
        const weight: number = props.weight(seconds);
        let out: IAutoMovieMotionHumanPosture;
        // The plan holds over its span, and on past its end where the hand
        // stays on its site to the end (`ISpan.relax` at `end`), as nothing
        // returns it. An arm that follows a person is the plan with a bounded
        // correction toward the goal read at each second of the hold.
        const so: (seconds: number) => IAutoMovieMotionHumanPosture =
          before ?? ((): IAutoMovieMotionHumanPosture => posture);
        // A followed arm before the performance is placed shows its plan.
        const arm = (at: number): IAutoMovieMotionHumanArmClearance.IArm =>
          follow === undefined ? planned(so)(at) : follow(at);
        // The planned arm at an instant, its hand's fingers as the plan
        // plays them there (`AutoMovieMotionHumanArmPlayed.written`).
        const placed = (at: number): IAutoMovieMotionHumanPosture =>
          AutoMovieMotionHumanArmPlayed.written(
            posture,
            props.side,
            arm(at),
            planned(so)(at).digits,
          );
        // The planned course holds through its span's last instant: a return
        // ends on its `back` there, and the rest-to-goal blend outside the
        // span, whose weight has fallen to none at that instant, would show
        // the rest instead. It holds from its first instant too, its rest,
        // the arm the display shows as the course takes over: the blend there
        // would show the goal's own fit where the course starts on its hold,
        // another elbow for the same hand.
        const onPlan: boolean =
          span !== undefined &&
          seconds >= span.start &&
          (seconds <= span.end || span.relax >= span.end);
        if (onPlan) out = placed(seconds);
        else {
          const carried: AutoMovieMotionHumanArmJointCourse.IInput = input(
            posture,
            seconds,
            source,
            projection,
          );
          out =
            course === undefined
              ? carry(
                  props.body,
                  carried.posture,
                  carried.from,
                  carried.share,
                  undefined,
                  source,
                  projection,
                )
              : course(seconds, carried);
        }
        // Off its plan at weight 0 the arm hangs at its rest, which the legs
        // and trunk the action moves may come into: it is let out as any
        // hanging arm is (`HumanArmSwing.of`), the same arm a planned span
        // leaves and regains (`hung`).
        if (!onPlan && !(weight > 0))
          out = HumanArmSwing(
            props.body,
            out,
            [props.side],
            source,
            projection,
            undefined,
            handed ?? AutoMovieMotionHumanArmCarryHung.entering(props, so(props.from)),
          );
        if (props.attitude === undefined || !(weight > 0 && weight < 1))
          return out;

        // The hand held to its attitude on the arm as written
        // (`HumanHandAttitude`), between the hands its two ends show: weight 1
        // writes a planned arm's own hand, so its end is the plan's at the
        // hold's nearer edge, carried on the trunk now; the goal's fit else.
        const requested: ReadonlySet<AutoMovieHumanoidBone> =
          new Set<AutoMovieHumanoidBone>([`${props.side}Hand`]);
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const hand: (
          at: IAutoMovieMotionHumanPosture,
        ) => IAutoMovieQuaternion = (
          at: IAutoMovieMotionHumanPosture,
        ): IAutoMovieQuaternion =>
          poseBones(
            props.body,
            resolveHumanPosture.seeded(
              props.body,
              at,
              undefined,
              undefined,
              resolution,
              requested,
              projection,
            ).pose,
            resolution(),
            requested,
          ).get(`${props.side}Hand`)!.worldRotation;
        const ended: IAutoMovieMotionHumanPosture = onPlan
          ? placed(seconds <= span!.ready ? span!.ready : span!.relax)
          : {
              ...posture,
              limbs: {
                ...posture.limbs,
                [limb]: props.goal(posture, seconds, resolution, projection),
              },
            };
        return HumanHandAttitude.held(
          props.body,
          out,
          props.side,
          props.attitude(
            posture,
            seconds,
            hand(out),
            hand(
              carry(
                props.body,
                posture,
                { [props.side]: props.rest },
                0,
                undefined,
                resolution,
                projection,
              ),
            ),
            hand(ended),
            weight,
          ),
          resolution,
          projection,
        );
      },
    };
  }

  /**
   * The law's own speed bound over a group of carries: at each second the
   * fastest any of them declares (`ICarry.pace`); none where no carry declares
   * one, and the planner reads its reach pace.
   *
   * @param carries The carries planned together.
   * @returns The bound, metres per second by the action's seconds, or
   *   undefined.
   */
  export function pace(
    carries: readonly IAutoMovieMotionHumanArmCarry.ICarry[],
  ): ((seconds: number) => number) | undefined {
    const declared: IAutoMovieMotionHumanArmCarry.ICarry[] = carries.filter(
      (c: IAutoMovieMotionHumanArmCarry.ICarry): boolean =>
        c.pace !== undefined,
    );
    if (declared.length === 0) return undefined;
    return (seconds: number): number =>
      Math.max(
        ...declared.map((c: IAutoMovieMotionHumanArmCarry.ICarry): number =>
          c.pace!(seconds),
        ),
      );
  }
}
