import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanHandAttitude } from "../posture/HumanHandAttitude";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmCarryCourse } from "./AutoMovieMotionHumanArmCarryCourse";
import { AutoMovieMotionHumanArmChain } from "./AutoMovieMotionHumanArmChain";
import { AutoMovieMotionHumanArmFollow } from "./AutoMovieMotionHumanArmFollow";
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
   * Deprecated: a carry's path is the planner's, so a law moves its arm with
   * `carried` over its clock's span (`ICarry.span`), its goal's point and
   * contact the site, and this share-only carry and its clearing course
   * (`HumanArmClearing.course`) are retired once the last law has moved.
   *
   * A posture whose arms are carried in joint space between held angles and
   * their goals' solution: at share 0 each named arm holds the given angles, at
   * 1 the posture is returned as it is, and between them each joint is the
   * blend of its held rotation and the one the goal solves to
   * (`blendHumanJoint`), written as joints with the arm's goal removed.
   *
   * A hand leaving its rest for a goal, or returning, is on no surface, so
   * nothing asks its path to be straight; blending the solved joints keeps the
   * elbow on one course, where hand goals solved afresh each second may change
   * the arm's solution between seconds. The shoulder is blended as a rotation,
   * since a raised shoulder has two clinical triples and the solve may return
   * either; the elbow and the wrist, which lack a freedom, angle by angle so
   * they stay on their axes. The blended forearm is then kept clear of the
   * trunk, the thighs, the other arm and the bodies its goal names
   * (`HumanPosture.IGoal.clear`) by the shoulder's abduction and the elbow's
   * flexion (`HumanArmClearance.cleared`), each end keeping its room.
   *
   * @param body The body.
   * @param posture The posture, with the goals of the arms to carry.
   * @param from The held angles of each arm to carry; an arm absent is left as
   *   it is.
   * @param share How far each arm is from its held angles to its goal, clamped
   *   to [0, 1].
   * @param planned The posture with the goals the clearing course is planned
   *   against, the arrival's; the posture's own when absent. A course planned
   *   against a fixed arrival is a constant of the carry, so the arm moves
   *   continuously with the share; one planned against the goal of each second
   *   is solved again as the goal moves, and its least clear turn steps where
   *   it crosses a ridge of the room. The trade is that the keys are exactly
   *   clear for the arrival's goal and clear for the goal of a second only as
   *   far as that goal has moved from it.
   * @param source Optional same-body exact FK source borrowed only through this
   *   synchronous carry.
   * @param projection Optional genuine same-body direct ROM projector; both
   *   actual native pose solves still project every joint.
   * @returns The posture.
   */
  export function carry(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    from: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    share: number,
    planned?: IAutoMovieMotionHumanPosture,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieMotionHumanPosture {
    const s: number = Math.min(1, Math.max(0, share));
    const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => from[side] !== undefined,
    );
    if (s >= 1 || sides.length === 0) return posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    if (s <= 0) {
      for (const side of sides) {
        const held: IAutoMovieMotionHumanArmAngles.IAngles = from[side]!;
        joints[`${side}UpperArm`] = held.upper;
        joints[`${side}LowerArm`] = held.lower;
        joints[`${side}Hand`] = held.hand;
        delete limbs[`${side}Arm`];
      }
      return { ...posture, joints, limbs };
    }
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const solved: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    const planning: IAutoMoviePose =
      planned === undefined
        ? solved
        : resolveHumanPosture.seeded(
            body,
            planned,
            undefined,
            undefined,
            resolution,
            undefined,
            projection,
          ).pose;
    const courses: ReturnType<typeof AutoMovieMotionHumanArmCarryCourse.arms> =
      AutoMovieMotionHumanArmCarryCourse.arms(
        body,
        sides,
        from,
        solved,
        planning,
        posture.limbs,
        resolution,
      );
    for (const side of sides) {
      const arm: IAutoMovieMotionHumanArmClearance.IArm = courses[side]!(s);
      joints[`${side}UpperArm`] = arm.upper;
      joints[`${side}LowerArm`] = arm.lower;
      joints[`${side}Hand`] = arm.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

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
            union(group.carries, span!),
            group.carries.map(
              (
                member: IAutoMovieMotionHumanArmCarry.ICarry,
              ): IAutoMovieMotionHumanArmCarry.ICarry =>
                hung(member, union([member], span!), before),
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
                    hung(
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
    let follow:
      | ReturnType<typeof AutoMovieMotionHumanArmFollow.follower>
      | undefined;
    // An arm with no span solves its goal at each second along the action's
    // course (`AutoMovieMotionHumanArmChain`), each second continuing the
    // swivel the course chose before it, on the posture so far.
    let chain:
      | ReturnType<typeof AutoMovieMotionHumanArmChain.continued>
      | undefined;
    // The arm's room as it entered the action (`entering`), read once.
    let handed: HumanArmSwing.Entered | undefined;
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
          before ?? fixedPosture(posture);
        const arm = (at: number): IAutoMovieMotionHumanArmClearance.IArm =>
          props.tracked === true
            ? (follow ??= AutoMovieMotionHumanArmFollow.follower(
                props.body,
                props,
                span!,
                planned(so),
                so,
              ))(at, source, projection)
            : planned(so)(at);
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
        if (onPlan) out = placed(seconds);
        else
          out = carry(
            props.body,
            span === undefined && before !== undefined && weight > 0
              ? (chain ??= AutoMovieMotionHumanArmChain.continued(
                  props.body,
                  props.to,
                  (t: number): IAutoMovieMotionHumanPosture =>
                    goaled(before(t), t),
                  [props.side],
                ))(seconds, goaled(posture, seconds, source, projection))
              : goaled(posture, seconds, source, projection),
            { [props.side]: props.rest },
            weight,
            undefined,
            source,
            projection,
          );
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
            (handed ??= entering(props, so(props.from))),
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

/**
 * A planned carry whose rest ends are the arm hanging where its span leaves and
 * regains it: its rest let out by `HumanArmSwing.of` on the posture so far at
 * the span's start, and, where the span returns and names no arm of its own to
 * return to, at the span's end. Off the plan the carry writes that same hanging
 * arm, so the plan starts and ends on the arm shown.
 *
 * @param member The carry.
 * @param span Its span.
 * @param before The posture so far, the planned arms left out.
 * @returns The carry, itself where neither end is let out.
 */
function hung(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
  before: (seconds: number) => IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanArmCarry.ICarry {
  const handed: HumanArmSwing.Entered = entering(member, before(member.from));
  const rest: IAutoMovieMotionHumanArmAngles.IAngles = hanging(
    member,
    before(span.start),
    handed,
  );
  const back: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
    member.back !== undefined || !(span.relax < span.end)
      ? member.back
      : hanging(member, before(span.end), handed);
  if (rest === member.rest && (back === undefined || back === member.rest))
    return member;
  return {
    ...member,
    rest,
    ...(back === undefined ? {} : { back }),
  };
}

/**
 * The span one problem of a group is solved over: the first member's, or, where
 * the members' own spans differ (a hold handed from one hand to the other),
 * from the earliest start and reach to the latest release and end, each arm
 * keeping its own hold (`AutoMovieMotionHumanArmPlanned.planned`); its knots
 * are every member's.
 *
 * @param carries The group's members.
 * @param span The span of the member prepared first.
 * @returns The group's span.
 */
function union(
  carries: readonly IAutoMovieMotionHumanArmCarry.ICarry[],
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
): IAutoMovieMotionHumanArmPlanned.ISpan {
  const spans: IAutoMovieMotionHumanArmPlanned.ISpan[] = carries.map(
    (
      member: IAutoMovieMotionHumanArmCarry.ICarry,
    ): IAutoMovieMotionHumanArmPlanned.ISpan => member.span ?? span,
  );

  // Every member's constrained instants are waypoints of the one problem.
  const knots: number[] = [
    ...new Set<number>(
      spans.flatMap(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number[] => s.knots ?? [],
      ),
    ),
  ].sort((a: number, b: number): number => a - b);
  if (
    spans.every(
      (s: IAutoMovieMotionHumanArmPlanned.ISpan): boolean =>
        s.start === span.start &&
        s.ready === span.ready &&
        s.relax === span.relax &&
        s.end === span.end,
    )
  )
    return knots.length === 0 ? span : { ...span, knots };
  return {
    ...(knots.length === 0 ? {} : { knots }),
    start: Math.min(
      ...spans.map(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.start,
      ),
    ),
    ready: Math.min(
      ...spans.map(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.ready,
      ),
    ),
    relax: Math.max(
      ...spans.map(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.relax,
      ),
    ),
    end: Math.max(
      ...spans.map((s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.end),
    ),
  };
}

/**
 * A carry's rest arm hanging in a posture: its upper arm let out by the least
 * abduction that keeps it clear (`HumanArmSwing.of`).
 *
 * @param member The carry.
 * @param posture The posture the arm hangs in.
 * @param handed The arm's room as it entered the action (`entering`).
 * @returns The rest angles, the same record where nothing is let out.
 */
function hanging(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  posture: IAutoMovieMotionHumanPosture,
  handed: HumanArmSwing.Entered,
): IAutoMovieMotionHumanArmAngles.IAngles {
  const side: AutoMovieHumanSide = member.side;
  const upper: readonly [number, number, number] | undefined = HumanArmSwing(
    member.body,
    rested(member, posture),
    [side],
    undefined,
    undefined,
    undefined,
    handed,
  ).joints[`${side}UpperArm`];
  return upper === undefined || upper[1] === member.rest.upper[1]
    ? member.rest
    : { ...member.rest, upper };
}

/**
 * A carry's arm's room as it enters its action: its rest in the posture of the
 * action's first second, read as the hanging-arm owner reads a room
 * (`HumanArmClearance.baseline`). An arm the action before left lying on a
 * thigh enters deeper than it hangs in the quiet stance; the carry starts on
 * that arm, so its let-out reads that depth as the arm's own.
 *
 * @param member The carry.
 * @param posture The posture of the action's first second.
 * @returns The room, by the carry's side.
 */
function entering(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  posture: IAutoMovieMotionHumanPosture,
): HumanArmSwing.Entered {
  const out: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmClearance.IBaseline>
  > = {};
  out[member.side] = HumanArmClearance.baseline(
    member.body,
    resolveHumanPosture.seeded(member.body, rested(member, posture)).pose,
    member.side,
    member.rest,
  );
  return out;
}

/**
 * A posture with a carry's rest written on its arm and the arm's goal removed:
 * the arm as the carry holds it at weight 0.
 *
 * @param member The carry.
 * @param posture The posture.
 * @returns The posture with the rest arm.
 */
function rested(
  member: IAutoMovieMotionHumanArmCarry.ICarry,
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  const side: AutoMovieHumanSide = member.side;
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
  joints[`${side}UpperArm`] = member.rest.upper;
  joints[`${side}LowerArm`] = member.rest.lower;
  joints[`${side}Hand`] = member.rest.hand;
  delete limbs[`${side}Arm`];
  return { ...posture, joints, limbs };
}

/** A retained standalone follower needs only the original fixed posture. */
function fixedPosture(
  posture: IAutoMovieMotionHumanPosture,
): (seconds: number) => IAutoMovieMotionHumanPosture {
  return (): IAutoMovieMotionHumanPosture => posture;
}
