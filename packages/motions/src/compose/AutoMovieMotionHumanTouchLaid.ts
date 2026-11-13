import { Vector3, getConstraint } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouch } from "./AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchPath } from "./AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/**
 * An effector laid on a region at rest, before any stroke moves it: the arm
 * goal that lays it, what its two directions lie on by the touch's lay, the
 * elbow's hint for that goal, the arm solved there as the reference every
 * second of a stroke is held to, and the elbow settled with a hand that
 * meets its place end on. The touch stroke (`AutoMovieMotionHumanTouch`) and
 * every law that plans one read these once, on the entry posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved here, when, and who reads it.
 * @evidence contracts/development/design.md#principled-representation A laid effector is a goal, a hint and a reference of one arm, each a function of the body, the posture, the effector and the region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The goal, its directions, the hint, the reference, the settled elbow and a vessel's facing; split from the stroke so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the effector's goal, the bend solver, the posture resolver and the path's directions; no region, effector or body is named.
 */
export namespace AutoMovieMotionHumanTouchLaid {
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
   * @param facing What the effector faces, when the lay needs it.
   * @param elbow Where the elbow lies: the place of least strain, or `level` with the shoulder; least strain when absent.
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
    along: AutoMovieMotionHumanTouch.ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
    elbow: "natural" | "level" = "natural",
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
      ...lie(
        body,
        posture,
        side,
        along,
        place.point,
        normal,
        travel,
        facing,
        elbow,
      ),
      AutoMovieMotionHumanBend.hang(body, posture, side),
    );
    return (
      elbow === "level"
        ? AutoMovieMotionHumanBend.level
        : AutoMovieMotionHumanBend.solve
    )({
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
   * held to (`ITouch.reference`), its forearm twist kept `MARGIN` degrees
   * inside the forearm's range.
   *
   * @param body The body.
   * @param posture The entry posture.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region at the entry.
   * @param tangent Which tangent.
   * @param hint The elbow's hint (`bend`), world.
   * @param along What the effector's along axis lies on; the tangent when absent.
   * @param facing What the effector faces, when the lay needs it.
   * @param elbow Where the elbow lies, which `arm` lays the effector from; natural when absent.
   * @returns The reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when and on what the arm is solved and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation A limb fit has more than one arm for one hand place; a fit referred to one arm solved once returns the arm nearest it, so the seconds of a touch share a solution branch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal (`rest`), one posture solve and one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Solved by the posture resolver itself, so the reference is an arm the fit can return; its forearm twist is then kept `MARGIN` inside the forearm's range, since a reference at a range's end asks the fit to hold the joint at its limit.
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
    along: AutoMovieMotionHumanTouch.ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
    elbow?: AutoMovieMotionHumanTouch.ITouch["elbow"],
    from?: IAutoMovieVector3,
  ): NonNullable<IHumanPosture.IGoal["reference"]> {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const solved: IHumanPosture.IReference = resolveHumanPosture.reference(
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
            elbow,
            from,
          ),
        },
      }),
      limb,
    );

    // A law does not ask a joint at the end of its range: the forearm's
    // twist is kept `MARGIN` degrees inside the forearm's own range.
    const range: IAutoMovieAngleRange | null = getConstraint(
      `${side}LowerArm`,
      body.skeleton.bones.find(
        (b: IAutoMovieBone): boolean => b.bone === `${side}LowerArm`,
      )?.constraint ?? null,
    )?.twist ?? null;
    if (range === null || range.max - range.min <= 2 * MARGIN) return solved;
    return {
      ...solved,
      lower: [
        solved.lower[0],
        solved.lower[1],
        Math.min(range.max - MARGIN, Math.max(range.min + MARGIN, solved.lower[2])),
      ],
    };
  }

  /** How far inside the forearm's twist range a laid arm's reference keeps it, degrees (provisional). */
  export const MARGIN: number = 5;

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
   * @param facing What the effector faces, when the lay needs it.
   * @param elbow Where the elbow lies, which `arm` lays the effector from; natural when absent.
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
    along: AutoMovieMotionHumanTouch.ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
    elbow?: AutoMovieMotionHumanTouch.ITouch["elbow"],
    from?: IAutoMovieVector3,
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
      ...lie(
        body,
        posture,
        side,
        along,
        place.point,
        normal,
        travel,
        facing,
        elbow,
        from,
      ),
      hint,
    );
  }

  /**
   * The elbow's place of an effector that meets its place end on (`reach`),
   * settled with the hand it carries: the hand runs from the elbow to the
   * place, and the elbow is where the arm bends for that hand, so each is
   * solved from the other until they agree.
   *
   * @param body The body.
   * @param posture The entry posture.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region at the entry.
   * @param tangent Which tangent.
   * @param elbow Where the elbow lies: the place of least strain, or `level` with the shoulder; least strain when absent.
   * @returns The elbow's place, world: the lay's origin and the bend hint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two unknowns, why they depend on each other and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation A fixed-point iteration from the elbow the body's measures give: three rounds of the goal a hand from that elbow asks and the elbow that goal's wrist bends at.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of `rest` and one elbow solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The round count is fixed, so the result is a function of its inputs alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three bounded swivel sweeps per touch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `rest` and the bend solver.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function settled(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: AutoMovieMotionHumanTouchForm.Tangent,
    elbow: NonNullable<AutoMovieMotionHumanTouch.ITouch["elbow"]> = "natural",
  ): IAutoMovieVector3 {
    let from: IAutoMovieVector3 | undefined;
    let hint: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      posture,
      side,
    );
    for (let round: number = 0; round < 3; ++round) {
      const goal: IHumanPosture.IGoal = rest(
        body,
        posture,
        side,
        effector,
        place,
        tangent,
        hint,
        "reach",
        undefined,
        elbow,
        from,
      );
      hint = (
        elbow === "level"
          ? AutoMovieMotionHumanBend.level
          : AutoMovieMotionHumanBend.solve
      )({
        body,
        posture,
        side,
        point: goal.point,
        rotation: goal.rotation!,
        fallback: "hang",
      });
      from = hint;
    }
    return hint;
  }

  /**
   * The level direction a held vessel's effector faces against at a region:
   * the turn about the vessel's upright axis the arm reaches best.
   *
   * `AutoMovieMotionHumanTouchUpright` owns the search and states it.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @returns The level direction, world; the region's normal when it has no level part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned and who owns the search.
   * @evidence contracts/development/implementation.md#principled-implementation The facing of `AutoMovieMotionHumanTouchUpright.solve`, which solves every candidate turn about the vessel's axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation, kept so a stroke's caller reads the facing where it reads the hint and the reference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is decided here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the search's one owner.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The cost is the owner's.
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
    return AutoMovieMotionHumanTouchUpright.solve(
      body,
      posture,
      side,
      effector,
      place,
      hint,
    ).facing;
  }

  /**
   * What an effector's facing and along axes lie on at a region: the region's
   * normal and the travel's tangent, the arm's own direction across the normal
   * (`arm`), or the world's up with the effector facing against a level
   * direction (`upright`), the region's level normal unless one is given
   * (`upright`); a region facing straight up or down
   * with no direction given falls back to the first.
   */
  export function lie(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    lay: AutoMovieMotionHumanTouch.ITouch["lay"],
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    travel: IAutoMovieVector3,
    facing?: IAutoMovieVector3,
    elbow?: AutoMovieMotionHumanTouch.ITouch["elbow"],
    from?: IAutoMovieVector3,
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
          elbow,
        ),
      ];
    if (lay === "reach") {
      // The effector's facing axis runs along that line into the place, and
      // its along axis lies on the world's up as nearly as that allows.
      const way: IAutoMovieVector3 = AutoMovieMotionHumanTouchPath.reach(
        body,
        posture,
        side,
        point,
        elbow,
        from,
      );
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const across: IAutoMovieVector3 = Vector3.subtract(
        up,
        Vector3.scale(way, Vector3.dot(up, way)),
      );
      return [
        Vector3.scale(way, -1),
        Vector3.length(across) > 1e-6 ? Vector3.normalize(across) : travel,
      ];
    }
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
}
