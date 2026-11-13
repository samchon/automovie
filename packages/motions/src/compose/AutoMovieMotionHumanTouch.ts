import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchPath } from "./AutoMovieMotionHumanTouchPath";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

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
   * One touch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The phrase clock, the effector, the region as a frame of the posture and the kind with its repetitions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `touch` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is a frame function, so a partner's region and the performer's own fit one member.
   */
  export interface ITouch {
    /** The body. */
    body: IHumanBody;

    /** A phrase clock: arrive by `ready`, repeat from `strokeStart` to `strokeEnd`, leave from `relax`. */
    clock: AutoMovieMotionClock.IClock;

    /** The hand. */
    side: HumanHand.Side;

    /** The arm's angles before and after the touch. */
    rest: AutoMovieMotionHumanArm.IAngles;

    /** The effector. */
    effector: AutoMovieMotionHumanTouchEffector.IEffector;

    /**
     * The region at a second.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @returns The region's point in world metres and its unit normal, pointing away from the surface.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the space and unit of the point and the sense of the normal.
     * @evidence contracts/development/implementation.md#principled-implementation The region is read on the posture so far, so a region on a moving partner or on the performer's own body is followed frame by frame.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One query returning the surface frame's two quantities; the touch builds its lift and travel on them.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The normal is required, so the lift's direction is never guessed from the point alone.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    region(
      posture: IHumanPosture,
      seconds: number,
    ): Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

    /** The kind. */
    kind: AutoMovieMotionHumanTouchForm.Kind;

    /** How many repetitions; a positive whole number. */
    count: number;

    /** The travel's direction; `up` when absent. */
    tangent?: AutoMovieMotionHumanTouchForm.Tangent;

    /** The effector's stand-off from the region along its normal beyond the skin's pad, metres; 0 when absent. */
    standoff?: number;

    /** Factor on the lift and the travel; 1 when absent. */
    extent?: number;

    /** The elbow's bend hint, world, on the entry posture; carried with the root. */
    bend: IAutoMovieVector3;

    /** The arm laid on the region at the entry (`laid`), which every second's fit is held to; no reference when absent. */
    reference?: NonNullable<IHumanPosture.IGoal["reference"]>;

    /** What the effector's along axis lies on: the travel's tangent, or `arm`, the direction away from the hanging elbow (`AutoMovieMotionHumanTouchPath.lay`), or `upright`, the world's up as a held vessel stands, the effector facing against `facing`; the tangent when absent. */
    lay?: "tangent" | "arm" | "upright";

    /** With `upright`, the level world direction the effector faces against (`AutoMovieMotionHumanTouch.upright`); the region's level normal when absent. */
    facing?: IAutoMovieVector3;

    /** The entry posture the hint was solved on. */
    entry: Pick<IHumanPosture, "root" | "yaw">;

    /** What the hand bears on while it is on the region; no window when absent. */
    contact?: IHumanContactWindow.Support;

    /**
     * Another body's placed colliders the arm keeps clear of at a second (`IHumanPosture.IGoal.clear`); none when absent.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @returns The colliders, placed in the world.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the result's frame and the default.
     * @evidence contracts/development/implementation.md#principled-implementation A partner moves, so their colliders are read at the second the goal is written.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One query, written into the arm's goal.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the profile's, placed by the partner's displayed bones.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    others?(
      posture: IHumanPosture,
      seconds: number,
    ): readonly HumanColliders.IPlaced[];
  }

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
   * @param entry The entry pose's resolved bones.
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
    context: Pick<IHumanActionContext, "aim" | "body">,
    target: AutoMovieMotionTarget,
    seconds: number,
    posture: IHumanPosture,
    entry: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
    if (target.kind === "self") {
      const frame = context.body.surfaces.regions[target.region];
      if (!TRUNK.has(frame.bone)) {
        const placed = resolveAutoMovieHumanoidSurfaces.place(
          frame,
          entry.get(frame.bone)!,
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
    );
  }

  /**
   * A touch: the arm and the fingers on one clock. The arm is carried in
   * joint space from its entry angles to the arm laid on the region by
   * `ready` and back from `relax`, so the elbow keeps one course and the hand
   * turns with the arm; a hand path solved second by second would let the
   * elbow change sides between seconds while the hand is far from the region.
   * Between `strokeStart` and `strokeEnd` the goal is lifted along the
   * region's normal by `lift sin^2(pi n u)`, which touches down at every
   * repetition's end, and moved along its tangent by the clock's windowed
   * wave of `n` cycles.
   *
   * @param props The touch.
   * @returns The arm's and the hand's primitives; the arm carries the contact window from `ready` to `relax` when a support is given.
   * @throws {Error} When the count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases, the lift and travel formulas and the contact window.
   * @evidence contracts/development/implementation.md#principled-implementation A free arm movement is smooth in joint space (Soechting and Lacquaniti 1981) and carries the hand with it (Desmurget et al. 1996), so the transport is the joint-space carry on the clock's envelope toward the goal laid on the region frame each second, with the kind's offsets in that frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm carry and one hand form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lift and travel are shares of the hand; a count that is not whole throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms One region read and one posture solve per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanArm.carried`, `AutoMovieMotionHumanHand.form` and the effector's goal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props and one hint.
   */
  export function touch(props: ITouch): IAutoMovieMotionHumanPrimitive[] {
    HumanBound.whole("count", props.count);
    const { body, clock, side } = props;
    const form: AutoMovieMotionHumanTouchForm.IForm =
      AutoMovieMotionHumanTouchForm.FORMS[props.kind];
    const hand: number = body.measure.hand * (props.extent ?? 1);
    const standoff: number =
      (props.standoff ?? 0) +
      AutoMovieMotionHumanTouchEffector.pad(body, side, props.effector);
    const held: HumanFrame.IFrame = {
      origin: props.entry.root,
      yaw: props.entry.yaw,
    };
    const hint: IAutoMovieVector3 = HumanFrame.local(held, props.bend);
    const share = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side,
        from: 0,
        to: clock.duration,
        rest: props.rest,
        weight: share,
        goal: (
          posture: IHumanPosture,
          seconds: number,
        ): IHumanPosture.IGoal => {
          const place = props.region(posture, seconds);
          const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
          const along: IAutoMovieVector3 =
            AutoMovieMotionHumanTouchForm.tangent(
              normal,
              posture.yaw,
              props.tangent ?? "up",
            );
          const u: number = clock.linear("strokeStart", "strokeEnd", seconds);
          const lift: number =
            form.lift * hand * Math.sin(Math.PI * props.count * u) ** 2;
          const travel: number =
            form.travel === 0
              ? 0
              : form.travel *
                hand *
                AutoMovieMotionClock.wave(
                  clock,
                  ["strokeStart", "strokeEnd"],
                  props.count,
                  seconds,
                );
          // Arriving and leaving, the goal stands off the region along its
          // normal by the share of the carry still to go, up to a hand's
          // length, so the hand comes onto the region and draws back off it
          // along the normal instead of sinking along the surface.
          const off: number = APPROACH * hand * (1 - share(seconds));
          const at: IAutoMovieVector3 = Vector3.add(
            Vector3.add(
              place.point,
              Vector3.scale(normal, standoff + lift + off),
            ),
            Vector3.scale(along, travel),
          );
          const frame: HumanFrame.IFrame = {
            origin: posture.root,
            yaw: posture.yaw,
          };
          return {
            ...AutoMovieMotionHumanTouchEffector.goal(
              body,
              side,
              props.effector,
              at,
              ...lie(
                body,
                posture,
                side,
                props.lay,
                place.point,
                normal,
                along,
                props.facing,
              ),
              HumanFrame.point(frame, hint),
            ),
            ...(props.reference === undefined
              ? {}
              : { reference: props.reference }),
            ...(props.others === undefined
              ? {}
              : { clear: props.others(posture, seconds) }),
          };
        },
      },
    );
    return [
      {
        ...arm,
        ...(props.contact === undefined
          ? {}
          : {
              contacts: [
                {
                  part: `${side}Hand`,
                  kind: "grip",
                  from: clock.at("ready") / clock.duration,
                  to: clock.at("relax") / clock.duration,
                  support: props.contact,
                } satisfies IHumanContactWindow,
              ],
            }),
      },
      AutoMovieMotionHumanHand.form(
        clock,
        side,
        ["start", "ready"],
        ["relax", "end"],
        props.effector.shape,
        form.curl,
      ),
    ];
  }

  /**
   * The elbow hint of a touch, solved once on the entry posture for the
   * effector laid on the region there.
   *
   * @param body The body.
   * @param posture The entry posture.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region at the entry.
   * @param tangent Which tangent.
   * @param along What the effector's along axis lies on; the tangent when absent.
   * @returns The hint, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when and on what the hint is solved.
   * @evidence contracts/development/implementation.md#principled-implementation The least-strain elbow place of `AutoMovieMotionHumanBend.solve` for the goal at the entry, the hanging arm's where it refuses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal and one solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Solved once, so the swivel cannot flip between seconds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector's goal and the bend solver.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded swivel sweep per touch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function bend(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: AutoMovieMotionHumanTouchForm.Tangent,
    along: ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
    const travel: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
      normal,
      posture.yaw,
      tangent,
    );
    const g: IHumanPosture.IGoal = AutoMovieMotionHumanTouchEffector.goal(
      body,
      side,
      effector,
      place.point,
      ...lie(body, posture, side, along, place.point, normal, travel, facing),
      AutoMovieMotionHumanBend.hang(body, posture, side),
    );
    return AutoMovieMotionHumanBend.solve({
      body,
      posture,
      side,
      point: g.point,
      rotation: g.rotation!,
      fallback: "hang",
    });
  }

  /**
   * The arm of a touch laid on its region, solved once on the entry posture
   * with the elbow's hint: the reference every second's fit of the touch is
   * held to (`ITouch.reference`).
   *
   * @param body The body.
   * @param posture The entry posture.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region at the entry.
   * @param tangent Which tangent.
   * @param hint The elbow's hint (`bend`), world.
   * @param along What the effector's along axis lies on; the tangent when absent.
   * @returns The reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when and on what the arm is solved and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation A limb fit has more than one arm for one hand place; a fit referred to one arm solved once returns the arm nearest it, so the seconds of a touch share a solution branch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal (`rest`), one posture solve and one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Solved by the posture resolver itself, so the reference is an arm the fit can return.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector's goal, the posture resolver and its reference reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per touch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function laid(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: AutoMovieMotionHumanTouchForm.Tangent,
    hint: IAutoMovieVector3,
    along: ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
  ): NonNullable<IHumanPosture.IGoal["reference"]> {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    return resolveHumanPosture.reference(
      resolveHumanPosture(body, {
        ...posture,
        limbs: {
          ...posture.limbs,
          [limb]: rest(
            body,
            posture,
            side,
            effector,
            place,
            tangent,
            hint,
            along,
            facing,
          ),
        },
      }),
      limb,
    );
  }

  /**
   * The arm goal that lays an effector on a region at rest, before any lift
   * or travel: the goal `laid` solves and the wrist a lean is measured to.
   *
   * @param body The body.
   * @param posture The posture the region and the heading are read on.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region.
   * @param tangent Which tangent.
   * @param hint The elbow's hint, world.
   * @param along What the effector's along axis lies on; the tangent when absent.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is laid, where, and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The effector's pad stands off the region along its normal and the effector lies as the touch lays it (`lie`), so the goal is the arm a stroke's every second is held to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One tangent, one stand-off and one effector goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No lift or travel is added: they are a stroke's, not the region's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector's goal and pad and the form's tangent.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function rest(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: AutoMovieMotionHumanTouchForm.Tangent,
    hint: IAutoMovieVector3,
    along: ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
  ): IHumanPosture.IGoal {
    const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
    const travel: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
      normal,
      posture.yaw,
      tangent,
    );
    return AutoMovieMotionHumanTouchEffector.goal(
      body,
      side,
      effector,
      Vector3.add(
        place.point,
        Vector3.scale(
          normal,
          AutoMovieMotionHumanTouchEffector.pad(body, side, effector),
        ),
      ),
      ...lie(body, posture, side, along, place.point, normal, travel, facing),
      hint,
    );
  }

  /**
   * The level direction a held vessel's effector faces against at a region:
   * the turn about the vessel's upright axis the arm reaches best.
   *
   * Standing a vessel upright fixes one axis of the hand; its turn about that
   * axis is free, and most of those turns ask the forearm and the wrist for
   * more than their range, so the resolver gives way on the rotation and the
   * vessel tilts. Each candidate turns the region's level normal by a
   * multiple of `UPRIGHT_STEP` degrees within `UPRIGHT_SPAN` either way; each
   * is solved on the posture and the one whose reached hand keeps the
   * vessel's axis nearest the world's up is kept, the nearest to head on on
   * a tie; the turn about that axis is not counted, since it is free.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @returns The level direction, world; the region's normal when it has no level part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the free turn, why it matters, the candidates, the choice and the tie.
   * @evidence contracts/development/implementation.md#principled-implementation The vessel's constraint is its axis alone, so the free turn is the one the arm makes: the solved rotation is read off the resolver, which owns the ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of goal, solve and compare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turn is assumed for any region or hand; every candidate is solved.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per candidate, once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `rest`, the resolver and `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function upright(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6)) return place.normal;
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    let best: IAutoMovieVector3 = place.normal;
    let least: number = Infinity;
    for (let k: number = 0; k <= 2 * (UPRIGHT_SPAN / UPRIGHT_STEP); k++) {
      // Head on first, then alternately either way, so a tie keeps the one
      // nearest head on.
      const degrees: number =
        (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * UPRIGHT_STEP;
      const turn: number = (degrees * Math.PI) / 180;
      const facing: IAutoMovieVector3 = {
        x:
          (place.normal.x * Math.cos(turn) + place.normal.z * Math.sin(turn)) /
          level,
        y: 0,
        z:
          (place.normal.z * Math.cos(turn) - place.normal.x * Math.sin(turn)) /
          level,
      };
      const goal: IHumanPosture.IGoal = rest(
        body,
        posture,
        side,
        effector,
        place,
        "up",
        hint,
        "upright",
        facing,
      );
      const reached: IAutoMovieQuaternion = poseBones(
        body,
        resolveHumanPosture(body, {
          ...posture,
          limbs: { ...posture.limbs, [limb]: goal },
        }),
      ).get(`${side}Hand`)!.worldRotation;
      // The asked rotation lays the effector's along axis on the world's up,
      // so that axis at rest is the up turned back by it; the vessel's tilt
      // is how far the reached rotation carries it off the up.
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.normalize(reached),
        Quaternion.rotateVector(
          Quaternion.inverse(Quaternion.normalize(goal.rotation!)),
          up,
        ),
      );
      const error: number = Math.acos(
        Math.min(1, Math.max(-1, Vector3.dot(Vector3.normalize(axis), up))),
      );
      if (error < least - 1e-9) {
        least = error;
        best = facing;
      }
    }
    return best;
  }
}

/** How far off a region along its normal a touch's goal stands at the start of the arrival and the end of the leave, hand lengths (provisional: a hand draws back about its own length before it turns away). */
const APPROACH: number = 1;

/** The turn either way of head on a held vessel's facing is sought within, degrees (provisional: past it the palm faces away from the region). */
const UPRIGHT_SPAN: number = 90;

/** The step between a held vessel's facing candidates, degrees (provisional). */
const UPRIGHT_STEP: number = 15;

/**
 * What an effector's facing and along axes lie on at a region: the region's
 * normal and the travel's tangent, the arm's own direction across the normal
 * (`arm`), or the world's up with the effector facing against a level
 * direction (`upright`), the region's level normal unless one is given
 * (`AutoMovieMotionHumanTouch.upright`); a region facing straight up or down
 * with no direction given falls back to the first.
 */
function lie(
  body: IHumanBody,
  posture: Pick<IHumanPosture, "root" | "yaw">,
  side: HumanHand.Side,
  lay: AutoMovieMotionHumanTouch.ITouch["lay"],
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  travel: IAutoMovieVector3,
  facing?: IAutoMovieVector3,
): [IAutoMovieVector3, IAutoMovieVector3] {
  if (lay === "arm")
    return [
      normal,
      AutoMovieMotionHumanTouchPath.lay(
        body,
        posture,
        side,
        point,
        normal,
        travel,
      ),
    ];
  if (lay !== "upright") return [normal, travel];
  const toward: IAutoMovieVector3 = facing ?? normal;
  const level: number = Math.hypot(toward.x, toward.z);
  return level > 1e-6
    ? [
        { x: toward.x / level, y: 0, z: toward.z / level },
        { x: 0, y: 1, z: 0 },
      ]
    : [normal, travel];
}

/** The bones a posture places without solving a limb. */
const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "leftEye",
    "rightEye",
    "jaw",
    "leftShoulder",
    "rightShoulder",
  ]);
