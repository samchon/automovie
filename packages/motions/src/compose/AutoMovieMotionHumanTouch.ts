import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTouchContacts } from "./AutoMovieMotionHumanTouchContacts";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/**
 * The touch stroke: one hand effector brought onto a surface region, moved on
 * it by the touch's kind and taken back. Every touch of the social, the
 * self-directed and the hand-to-face families is a row of this generator
 * over `(effector, region, kind, timing)` (campaign note on #3201; #3284,
 * #3285, #3234).
 *
 * The kinds and their movement in the region's frame are
 * `AutoMovieMotionHumanTouchForm`'s, the effector (a hand surface or a held
 * tool's tip) `AutoMovieMotionHumanTouchEffector`'s. The effector travels
 * from where the entry held it to the region on a path that bows away from
 * the surface and toward the performer, the hand turning as the arm carries
 * it (`AutoMovieMotionHumanTouchPath`), so it arrives from the free side and
 * the arm never sweeps through the body it is about to touch;
 * the arm's angles leave the entry's over the path's first share
 * (`AutoMovieMotionHumanArm.carried`) and follow the path's solution after
 * it, its goal standing off the region along the normal by the share still
 * to go, so the hand arrives and leaves along the normal. The fingers take
 * their shape on the same envelope, and the elbow's
 * hint is solved once, on the entry posture, and carried with the root, so
 * the arm keeps one side of its swivel through the whole stroke.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the generator does, which owners it reads and how the arm, the fingers and the elbow are moved.
 * @evidence contracts/development/design.md#principled-representation A touch is an effector frame laid against a region frame with a periodic offset in that frame, the form the social touch taxonomy describes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The touch record, the region resolver, the primitive, the elbow hint, the laid reference and the rest goal both are built on.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the arm carry, the hand shapes, the region frames and the target resolver; no body or action is named.
 */
export namespace AutoMovieMotionHumanTouch {
  /**
   * A region of a target as a frame: a person's region or a prop's point
   * through the context's aim, a trunk or head region of the performer on
   * the posture, and a limb region of the performer on the entry pose, which
   * a touch that does not move that limb leaves where it was.
   *
   * @param context The action's context.
   * @param target The target.
   * @param seconds Film seconds.
   * @param posture The posture so far.
   * @param entry The entry pose's resolved bones, or a supplier of the bones to read a region off the trunk on, called only for such a region.
   * @returns The point and the outward normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which pose each kind of region is read on and why.
   * @evidence contracts/development/implementation.md#principled-implementation A limb is solved after the trunk, so a limb region of the performer is placed on the entry's displayed bone; everything else goes through the target resolver.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch for a self limb region, one delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb region on the moving arm is the caller's error; the region is not re-read on the solved arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's surface placement and `AutoMovieMotionHumanTarget.resolve`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One placement or one resolve per call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function region(
    context: Pick<IAutoMovieMotionHumanActionContext, "aim" | "body">,
    target: IAutoMovieMotionTarget,
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    entry:
      | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
      | (() => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>),
    resolution?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[2],
  ): Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
    if (target.kind === "self") {
      const frame: IAutoMovieHumanoidSurfaces.IFrame = context.body.surfaces.regions[target.region];
      if (!AutoMovieMotionHumanTarget.TRUNK.has(frame.bone)) {
        // The bones are read only here: a caller whose bones cost a pose
        // lends a supplier, which a region on the trunk never calls.
        const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> = resolveAutoMovieHumanoidSurfaces.place(
          frame,
          (typeof entry === "function" ? entry() : entry).get(frame.bone)!,
        );
        return { point: placed.point, normal: placed.normal };
      }
    }
    return AutoMovieMotionHumanTarget.resolve(
      context,
      target,
      seconds,
      posture,
      AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      resolution,
    );
  }

  /**
   * A touch: the arm and the fingers on one clock. The arm's whole touch is
   * planned as one trajectory (`AutoMovieMotionHumanArmPlanned`): its reach
   * from its entry angles, its hold on the goal laid on the region from
   * `ready` to `relax` and its return, clear of the body all the way; a hand
   * path solved second by second would let the elbow change sides between them.
   * Between `strokeStart` and `strokeEnd` the goal is lifted along the
   * region's normal by `lift sin^2(pi n u)`, which touches down at every
   * repetition's end, and moved along its tangent by the clock's windowed
   * wave of `n` cycles. A held vessel keeps its attitude on the way
   * (`AutoMovieMotionHumanDrinkingArm.carried`).
   *
   * @param props The touch.
   * @returns The arm's and the hand's primitives, the arm's alone when the fingers are kept; the arm carries the contact window from `ready` to `relax` when a support is given and the hand, not a held tool, is what touches it, and one `lie` window over the same span for each of its segments declared resting (`ITouch.rests`).
   * @throws {Error} When the count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases, the lift and travel formulas and the contact window.
   * @evidence contracts/development/implementation.md#principled-implementation A reach that lays a hand on a region is a motion-planning problem: the arm's whole action is one trajectory optimisation toward the goal laid on the region frame at each second of the hold, with the kind's offsets in that frame (`AutoMovieMotionHumanArm.carried` with a span).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm carry and one hand form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lift and travel are shares of the hand; a count that is not whole throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trajectory planned per touch (or per pair of hands), its goal read once per waypoint; per written second one cubic read of it; a vessel laid upright adds the attitude's three hand readings and one hand solve (`AutoMovieMotionHumanArm.ICarry.attitude`).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArm.carried`, `AutoMovieMotionHumanHand.form` and the effector's goal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props and one hint.
   */
  export function touch(props: IAutoMovieMotionHumanTouch.ITouch): IAutoMovieMotionHumanPrimitive[] {
    const { body, clock, side } = props;
    const form: IAutoMovieMotionHumanTouchForm.IForm =
      AutoMovieMotionHumanTouchForm.FORMS[props.kind];
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side,
        from: 0,
        to: clock.duration,
        rest: props.rest,
        weight: (seconds: number): number => share(clock, seconds),
        goal: goal(props),
        // A person read as perceived when the plan starts, then followed on the hold.
        ...(props.perceived === undefined
          ? {}
          : {
              perceived: goal({ ...props, ...props.perceived }),
              tracked: true,
            }),
        // The whole touch planned as one trajectory: the reach from `start`,
        // the hold from `ready` to `relax` and the return by `end`.
        span: {
          start: clock.at("start"),
          ready: clock.at("ready"),
          relax: clock.at("relax"),
          end: clock.at("end"),
        },
        ...(props.together === undefined ? {} : { together: props.together }),
        ...(props.rests === undefined ? {} : { rests: props.rests }),
        ...(props.skinDistance === undefined ? {} : { skinDistance: props.skinDistance }),
        ...(props.disc === undefined ? {} : { disc: props.disc }),
        ...(props.on === undefined ? {} : { on: props.on }),
        ...(props.lay !== "upright"
          ? {}
          : {
              attitude: AutoMovieMotionHumanDrinkingArm.carried(
                props,
                // The lean's share shown at a weight: none until the last `TIP`.
                (weight: number): number =>
                  minimumJerk.share(Math.max(0, (weight - (1 - TIP)) / TIP)),
              ),
            }),
      },
    );
    // A held tool's point touches the body, not the hand: the hand gripping
    // the tool is not laid on the region, so it declares no contact with
    // the body there, and nothing excuses its fingers' depth in it.
    const tool: boolean =
      props.held !== undefined || props.effector.tool !== undefined;
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      AutoMovieMotionHumanTouchContacts.windows(
        clock,
        side,
        tool && props.contact?.kind === "person" ? undefined : props.contact,
        props.rests ?? [],
      );
    return [
      {
        ...arm,
        ...(contacts.length === 0 ? {} : { contacts }),
      },
      ...(props.fingers === "keep"
        ? []
        : [
            AutoMovieMotionHumanHand.form(
              clock,
              side,
              ["start", "ready"],
              ["relax", "end"],
              props.effector.shape,
              form.curl,
            ),
          ]),
    ];
  }

  /**
   * How far a touch's arm is from its entry angles to its goal at a second:
   * the clock's envelope, rising from `start` to `ready` and falling from
   * `relax` to `end`.
   *
   * @param clock The touch's clock.
   * @param seconds Seconds since the action's start.
   * @returns A share in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ramps and the range.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's carry and the goal's stand-off read one envelope, so the hand arrives on the region as the carry completes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to the clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The instants are the clock's own names.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionClock.IClock.envelope`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function share(
    clock: IAutoMovieMotionClock,
    seconds: number,
  ): number {
    return clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  }

  /** The last share of a carry's progress (`share`) over which a vessel leaned at the face (`ITouch.lean`) tips toward it, and the first share of the way back over which it is righted, by the hand's attitude (provisional: a drinker tips the glass at the lips). */
  export const TIP: number = 0.25;

  /**
   * The goal a touch's arm is carried toward at each second: the effector
   * laid on the region, lifted along its normal by `lift sin^2(pi n u)` and
   * moved along its tangent by the clock's windowed wave of `n` cycles
   * between `strokeStart` and `strokeEnd`, and stood off along the normal
   * by the share of the carry still to go. Another arm that works with the
   * same hand (a second hand on a held tool) reads the same goal.
   *
   * @param props The touch.
   * @returns The goal at a posture and a second since the action's start.
   * @throws {Error} When the count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the lift, the travel, the stand-off and who else reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The goal is laid on the region frame each second with the kind's offsets in that frame; a held rotation turns with the heading and the wrist follows from it so the effector still meets its place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The constants once, then one region read, the offsets and one effector goal per second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lift, the travel and the stand-off are shares of the hand; a count that is not whole throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms One region read per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector, laid direction and tangent owners. One wave of the touch's count, prepared at its first stroke sample, serves every later one. Current FK/genuine ROM metadata is forwarded to region/collider callbacks for that invocation only.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function retains props, fixed entry-frame hints and at most one count-bound wave reader until release. Query metadata remains callback arguments and never enters the retained reader or returned goal; no time/result history is stored.
   */
  export function goal(
    props: IAutoMovieMotionHumanTouch.ITouch,
  ): IAutoMovieMotionHumanArmCarry.ICarry["goal"] {
    HumanBound.whole("count", props.count);
    const { body, clock, side } = props;
    const form: IAutoMovieMotionHumanTouchForm.IForm =
      AutoMovieMotionHumanTouchForm.FORMS[props.kind];
    const hand: number = body.measure.hand * (props.extent ?? 1);
    const standoff: number =
      (props.standoff ?? 0) +
      AutoMovieMotionHumanTouchEffector.pad(body, side, props.effector);
    const held: IAutoMovieMotionHumanFrame = {
      origin: props.entry.root,
      yaw: props.entry.yaw,
    };
    const hint: IAutoMovieVector3 = HumanFrame.local(held, props.bend);
    const from: IAutoMovieVector3 | undefined =
      props.from === undefined ? undefined : HumanFrame.local(held, props.from);
    let wave: ((seconds: number) => number) | undefined;
    const oscillation: (seconds: number) => number = (seconds: number): number =>
      (wave ??= AutoMovieMotionClock.prepareWave(clock, ["strokeStart", "strokeEnd"], props.count))(seconds);
    return (posture: IAutoMovieMotionHumanPosture, seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[3]): IAutoMovieHumanLimbGoal => {
      const place: ReturnType<IAutoMovieMotionHumanTouch.ITouch["region"]> = props.region(posture, seconds, resolution, projection);
      const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
      const along: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
        normal,
        posture.yaw,
        props.tangent ?? "up",
        side,
      );
      const u: number = clock.linear("strokeStart", "strokeEnd", seconds);
      const lift: number =
        form.lift * hand * Math.sin(Math.PI * props.count * u) ** 2;
      const travel: number =
        form.travel === 0
          ? 0
          : form.travel *
            hand *
            oscillation(seconds);
      // The vessel as it is held at the lips: the arm is carried toward the
      // arm that holds it there, the one the drinking search admitted, and
      // the vessel's own tip on the way is the hand's attitude's (`TIP`,
      // `AutoMovieMotionHumanDrinkingArm.carried`).
      const lean: number = props.lean ?? 0;
      const at: IAutoMovieVector3 = Vector3.add(
        Vector3.add(place.point, Vector3.scale(normal, standoff + lift)),
        Vector3.scale(along, travel),
      );
      const frame: IAutoMovieMotionHumanFrame = {
        origin: posture.root,
        yaw: posture.yaw,
      };
      const laid: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchEffector.goal(
        body,
        side,
        props.effector,
        at,
        ...AutoMovieMotionHumanTouchLaid.lie(
          body,
          posture,
          side,
          props.lay,
          place.point,
          normal,
          along,
          props.facing,
          props.elbow,
          from === undefined ? undefined : HumanFrame.point(frame, from),
          lean,
        ),
        HumanFrame.point(frame, hint),
        props.lay === "reach",
      );

      // A held rotation turns with the heading and leans with the vessel.
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        posture.yaw - props.entry.yaw,
      );
      const rotation: IAutoMovieQuaternion | undefined =
        props.held === undefined
          ? undefined
          : Quaternion.normalize(
              Quaternion.multiply(
                AutoMovieMotionHumanTouchUpright.tip(normal, lean),
                Quaternion.multiply(turn, props.held),
              ),
            );
      return {
        ...laid,
        ...(rotation === undefined
          ? {}
          : {
              rotation,
              point: Vector3.subtract(
                at,
                Quaternion.rotateVector(
                  rotation,
                  laid.contact ?? { x: 0, y: 0, z: 0 },
                ),
              ),
            }),
        ...(props.reference === undefined
          ? {}
          : { reference: props.reference }),
        ...props.others?.(posture, seconds, resolution, projection),
      };
    };
  }
}
