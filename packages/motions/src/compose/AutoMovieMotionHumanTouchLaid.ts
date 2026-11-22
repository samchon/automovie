import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchPath } from "./AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";
import { HumanTouchArmReference } from "./HumanTouchArmReference";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The goal, its directions, the hint, the reference and the settled elbow (a vessel's facing and lean are `AutoMovieMotionHumanTouchUpright`'s); split from the stroke so each file holds one responsibility.
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
   * @param lean With `upright`, how far the vessel leans toward the region, degrees (`lie`); upright when absent.
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
    along: IAutoMovieMotionHumanTouch.ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
    elbow: "natural" | "level" = "natural",
    lean?: number,
  ): IAutoMovieVector3 {
    const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
    const travel: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
      normal,
      posture.yaw,
      tangent,
      side,
    );
    const g: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchEffector.goal(
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
        undefined,
        lean,
      ),
      AutoMovieMotionHumanBend.hang(body, posture, side),
      along === "reach",
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
   * @param from With `reach`, the elbow's place, world.
   * @param lean With `upright`, how far the vessel leans toward the region, degrees (`lie`); upright when absent.
   * @returns The reference.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when and on what the arm is solved and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation A limb fit has more than one arm for one hand place; a fit referred to one arm solved once returns the arm nearest it, so the seconds of a touch share a solution branch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal (`rest`) and its reference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arm is the posture resolver's own, through `reference`, which keeps the forearm's twist inside its range.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the laid goal (`rest`) and `reference`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per touch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function laid(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
    hint: IAutoMovieVector3,
    along: IAutoMovieMotionHumanTouch.ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
    elbow?: IAutoMovieMotionHumanTouch.ITouch["elbow"],
    from?: IAutoMovieVector3,
    lean?: number,
  ): NonNullable<IAutoMovieHumanLimbGoal["reference"]> {
    return reference(
      body,
      posture,
      side,
      rest(
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
        lean,
      ),
    );
  }

  /** The laid arm's reference, from its actual fit and forearm range. */
  export const reference: typeof HumanTouchArmReference.reference =
    HumanTouchArmReference.reference;

  /** Forearm twist room required by the laid reference, degrees. */
  export const MARGIN: number = HumanTouchArmReference.MARGIN;
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
   * @param from With `reach`, the elbow's place, world.
   * @param lean With `upright`, how far the vessel leans toward the region, degrees (`lie`); upright when absent.
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
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
    hint: IAutoMovieVector3,
    along: IAutoMovieMotionHumanTouch.ITouch["lay"] = "tangent",
    facing?: IAutoMovieVector3,
    elbow?: IAutoMovieMotionHumanTouch.ITouch["elbow"],
    from?: IAutoMovieVector3,
    lean?: number,
  ): IAutoMovieHumanLimbGoal {
    const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
    const travel: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
      normal,
      posture.yaw,
      tangent,
      side,
    );
    const at: IAutoMovieVector3 = Vector3.add(
      place.point,
      Vector3.scale(
        normal,
        AutoMovieMotionHumanTouchEffector.pad(body, side, effector),
      ),
    );
    const [faced, lying]: [IAutoMovieVector3, IAutoMovieVector3] = lie(
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
      lean,
    );
    return AutoMovieMotionHumanTouchEffector.goal(
      body,
      side,
      effector,
      at,
      faced,
      lying,
      hint,
      along === "reach",
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
   * @throws {HumanRefusal} A `reach` refusal on `elbow` when the elbow still moves by more than the solver resolves after the rounds a halving would need.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two unknowns, why they depend on each other, what is returned and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A fixed-point iteration from the elbow the body's measures give: rounds of the goal a hand from that elbow asks and the elbow that goal's wrist bends at, until the elbow moves less than the swivel resolution swept on the upper arm; the round bound is the halvings of two upper arms down to that tolerance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of `rest` and one elbow solve, stopped by the tolerance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance and the bound are derived from the solver's resolution and the arm, so the result is a function of its inputs alone; an elbow that does not settle is refused, never returned unsettled.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded swivel sweep a round, as many rounds as the elbow takes to settle and at most the derived bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `rest` and the bend solver.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function settled(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
    elbow: NonNullable<IAutoMovieMotionHumanTouch.ITouch["elbow"]> = "natural",
  ): IAutoMovieVector3 {
    let from: IAutoMovieVector3 | undefined;
    let hint: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      posture,
      side,
    );

    // Settled when the elbow moves less than the solver resolves it: its
    // swivel resolution (`hingedArmSwivel.RESOLUTION`) swept on the upper
    // arm. Two elbows of one shoulder lie within two upper arms, so a
    // settling at least as fast as halving meets that within as many rounds
    // as halvings of two upper arms down to it; one still moving refuses.
    const tolerance: number =
      (body.measure.upperArm * hingedArmSwivel.RESOLUTION * Math.PI) / 180;
    const rounds: number =
      Math.ceil(Math.log2((2 * body.measure.upperArm) / tolerance)) + 1;
    let moved: number = Infinity;
    for (
      let round: number = 0;
      round < rounds && !(moved <= tolerance);
      ++round
    ) {
      const goal: IAutoMovieHumanLimbGoal = rest(
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
      const next: IAutoMovieVector3 = (
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
      // The line into the place runs from the elbow the arm takes for that
      // hand on this bend, so the hand laid on it continues the forearm.
      const taken: IAutoMovieVector3 = poseBones(
        body,
        resolveHumanPosture(body, {
          ...posture,
          limbs: { ...posture.limbs, [`${side}Arm`]: { ...goal, bend: next } },
        }),
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}LowerArm`]),
      ).get(`${side}LowerArm`)!.worldPosition;
      moved = Math.max(
        Vector3.distance(next, hint),
        Vector3.distance(taken, from ?? hint),
      );
      hint = next;
      from = taken;
    }
    if (!(moved <= tolerance))
      throw new HumanRefusal({
        kind: "reach",
        axis: "elbow",
        value: elbow,
        feasible: null,
        reason: `the ${side} elbow and the hand it carries end on did not settle: after ${rounds} rounds the elbow still moved ${(moved * 1000).toFixed(1)} mm`,
        fix: "lay the effector across the region instead of end on, or move the region nearer the shoulder",
      });
    return hint;
  }

  /**
   * What an effector's facing and along axes lie on at a region: the
   * region's normal and the travel's tangent (`tangent`); the normal and the
   * arm's own direction across it (`arm`); the line from the elbow straight
   * into the place, with the along axis on the world's up as nearly as that
   * line allows (`reach`); or the world's up with the effector facing
   * against a level direction, the region's level normal unless one is
   * given (`upright`); or the touched limb's long axis (`facing`) square to
   * the normal (`limb`). An `upright` region facing straight up or down with
   * no direction given, and a `reach` line that runs straight up or down,
   * fall back to the travel's tangent for the along axis.
   *
   * @param body The body.
   * @param posture The posture the heading and the elbow are read on.
   * @param side The hand.
   * @param lay What the along axis lies on; the tangent when absent.
   * @param point The region's point, world.
   * @param normal The region's outward unit normal, world.
   * @param travel The travel's unit tangent on the region, world.
   * @param facing With `upright`, the level direction the effector faces against; the region's level normal when absent. With `limb`, the touched limb's long axis; the travel when absent.
   * @param elbow Where the elbow lies, which `arm` and `reach` lay the effector from; the place of least strain when absent.
   * @param from With `reach`, the elbow's place, world; read from the body's measures when absent.
   * @param lean With `upright`, how far the vessel's axis leans from the world's up toward the region, degrees, the facing turned with it; upright when absent.
   * @returns The direction the effector faces against and the direction its along axis lies on, world, as `AutoMovieMotionHumanTouchEffector.goal` takes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each lay's two directions, every input and the two fall-backs.
   * @evidence contracts/development/implementation.md#principled-implementation An effector's attitude is two directions, the one it presses against and the one its along axis follows; each lay names where the second comes from (the travel, the arm by `AutoMovieMotionHumanTouchPath.lay`, the elbow's line by `AutoMovieMotionHumanTouchPath.reach`, or the world's up for a vessel that must stand).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per lay, each returning the pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A direction that has no part across the line it must cross falls back to the travel instead of normalizing a zero vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the arm's and the elbow's directions to `AutoMovieMotionHumanTouchPath`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lie(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    side: AutoMovieHumanSide,
    lay: IAutoMovieMotionHumanTouch.ITouch["lay"],
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    travel: IAutoMovieVector3,
    facing?: IAutoMovieVector3,
    elbow?: IAutoMovieMotionHumanTouch.ITouch["elbow"],
    from?: IAutoMovieVector3,
    lean: number = 0,
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
    if (lay === "limb") {
      // A flat effector lies along the touched limb, square to the normal,
      // where the segment does not curve away under it.
      const axis: IAutoMovieVector3 = facing ?? travel;
      const across: IAutoMovieVector3 = Vector3.subtract(
        axis,
        Vector3.scale(normal, Vector3.dot(axis, normal)),
      );
      return [
        normal,
        Vector3.length(across) > 1e-6 ? Vector3.normalize(across) : travel,
      ];
    }
    if (lay !== "upright") return [normal, travel];
    const toward: IAutoMovieVector3 = facing ?? normal;
    const level: number = Math.hypot(toward.x, toward.z);
    if (!(level > 1e-6)) return [normal, travel];
    const faced: IAutoMovieVector3 = {
      x: toward.x / level,
      y: 0,
      z: toward.z / level,
    };
    // A vessel leaned toward the face, its facing turned with it.
    const turn: IAutoMovieQuaternion = AutoMovieMotionHumanTouchUpright.tip(
      normal,
      lean,
    );
    return [
      Quaternion.rotateVector(turn, faced),
      Quaternion.rotateVector(turn, { x: 0, y: 1, z: 0 }),
    ];
  }
}
