import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanObstacle } from "../perform/HumanObstacle";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";

/**
 * The room a striker has to close on another person: how far its body may
 * travel along a line before its arms, held as they are, meet the other
 * body. A strike steps in until its arm reaches, and where the other body
 * stands nearer than that step (a guard held forward of the target, a taller
 * person's arms above a shorter one's), the step would walk the striker's
 * guard into it; the step is bounded by the space in front of the striker,
 * not only by the stance.
 *
 * Each arm is swept as the points of its three capsules (the upper arm, the
 * forearm and the fist, the capsules the performance resolves contacts on,
 * {@link StrikingWeapon.posed}): the ends and the middle of each, with that
 * capsule's radius. A point swept a distance `d` along the line covers the
 * segment from it to `d` further on, whose signed distance to the other
 * body's colliders only falls as `d` grows, so the first `d` at which the
 * swept point touches is found by bisection. The arms lead a guard, so they
 * meet the other body first; the trunk and the legs behind them are not
 * swept.
 *
 * A step back, before a target nearer than the arm's band, has room too
 * ({@link behind}): the scene's solids behind the feet bound it as the other
 * person bounds a step in.
 *
 * A feint has room of its own: it stops short of the other person's guard
 * ({@link feint}), so the defender bites on a fist that never touches.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why a step is bounded, what is swept, the monotonicity the search rests on and what is not swept.
 * @evidence contracts/development/design.md#principled-representation A pure function of two posed bodies and a line in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The room between two posed bodies, a strike's reading of it toward its target, the room behind its feet and a feint's depth, which the punch's step and feint use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture package's collider distances and the weapon's arm axes.
 */
export namespace StrikingRoom {
  /**
   * What the room is measured between.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation Two bodies with their posed bones, a unit line and a positive limit in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch's step passes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the body and resolved bone types.
   */
  export interface IProps {
    /** The striker's body. */
    body: IHumanBody;

    /** The striker's posed bones, world frame. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The other person's body. */
    other: IHumanBody;

    /** The other person's posed bones, world frame. */
    others: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The horizontal unit line the striker travels along. */
    line: IAutoMovieVector3;

    /** The farthest travel asked, metres; positive. */
    limit: number;
  }

  /** The bisection's halvings: a 0.4 m stance step over 2^14 is under 0.03 mm. */
  const HALVINGS: number = 14;

  /**
   * How far the striker may travel along the line before an arm meets the
   * other body, at most the limit.
   *
   * @param props The two bodies, the line and the limit.
   * @returns Metres in `[0, limit]`; zero when an arm already touches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the range and the meaning of zero; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation The least first-touch travel over the swept capsule points, each found by bisection of a monotone signed distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the swept points and one bisection each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms A point clear over the room found so far costs one distance query; a touching one, one per halving.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function along(props: IProps): number {
    let room: number = props.limit;
    for (const { point, radius } of swept(props.body, props.bones)) {
      const gap = (d: number): number =>
        HumanColliders.distanceToSegment(
          props.other,
          props.others,
          point,
          Vector3.add(point, Vector3.scale(props.line, d)),
        ).distance - radius;
      if (gap(room) > 0) continue;
      if (gap(0) <= 0) return 0;
      let lo: number = 0;
      let hi: number = room;
      for (let i: number = 0; i < HALVINGS; i++) {
        const mid: number = (lo + hi) / 2;
        if (gap(mid) <= 0) hi = mid;
        else lo = mid;
      }
      room = lo;
    }
    return room;
  }

  /**
   * A strike's room toward its target, as the strike reads it one look-back
   * before its launch ({@link StrikingTarget.LOOK}): the room toward the person
   * it aims at, up to one stance length (the longest step a strike takes),
   * or no bound for a target that is not a person.
   *
   * @param context The striker's action context.
   * @param target What the strike aims at.
   * @param bones The striker's bones at the launch, world frame.
   * @param line The horizontal unit line of the step.
   * @param launch Film second of the launch.
   * @returns Metres, or infinity for a target that is not a person.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the other person is read, the limit and the unbounded case.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the aimed person at the strike's look-back, as every striking plan does, and measures the room with {@link along}.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One room measurement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The strike's geometry calls it once per build.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function ahead(
    context: Pick<IHumanActionContext, "body" | "performer">,
    target: AutoMovieMotionTarget,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    line: IAutoMovieVector3,
    launch: number,
  ): number {
    if (target.kind !== "person") return Infinity;
    const other: IHumanActionContext.IPerformer = context.performer(
      target.subject,
    );
    return along({
      body: context.body,
      bones,
      other: other.body,
      others: other.bones(launch - StrikingTarget.LOOK),
      line,
      limit: StrikingStance.length(context.body),
    });
  }

  /**
   * How far a striker may step back along the line before a heel meets one
   * of the scene's solids, at most one stance length (the longest step a
   * strike takes).
   *
   * @param context The striker's action context.
   * @param feet Where the feet stand at the launch.
   * @param line The horizontal unit line toward the target; the step back runs along its opposite.
   * @returns Metres in `[0, stance length]`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, from where, the bound and the range.
   * @evidence contracts/development/implementation.md#principled-implementation Each heel's straight path back along the line is clipped against the scene's obstacles (`HumanObstacle.blocking`, with the body's breadth and stature), and the nearer block bounds the step.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One path per heel, the least distance kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Other people behind are not read: the context lists no performers, only the scene's solids.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two clips, linear in the obstacles' edges.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanObstacle.blocking` and `HumanFoot.point`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function behind(
    context: Pick<IHumanActionContext, "body" | "obstacles">,
    feet: Readonly<Record<"left" | "right", HumanFoot.IPlacement>>,
    line: IAutoMovieVector3,
  ): number {
    const limit: number = StrikingStance.length(context.body);
    let room: number = limit;
    for (const side of ["left", "right"] as const) {
      const heel: IAutoMovieVector3 = HumanFoot.point(
        context.body,
        side,
        "heel",
        feet[side],
      );
      const block: HumanObstacle.IBlock | null = HumanObstacle.blocking(
        context.obstacles(),
        heel,
        Vector3.subtract(heel, Vector3.scale(line, limit)),
        {
          breadth: context.body.measure.chestBreadth,
          height: context.body.measure.stature,
        },
      );
      if (block !== null) room = Math.min(room, block.distance);
    }
    return room;
  }

  /**
   * A feint's wrist path toward its target, as the share of the committed
   * punch's way it may show.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation World points, a unit line, metres and a film second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch's feint passes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IFeint {
    /** The share of the way the feint declares, in (0, 1). */
    declared: number;

    /** The point aimed at, world metres. */
    aimed: IAutoMovieVector3;

    /** The wrist at the launch, world metres. */
    origin: IAutoMovieVector3;

    /** The committed punch's wrist at its contact, world metres. */
    end: IAutoMovieVector3;

    /** The fist's reach past the wrist, metres. */
    reach: number;

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** Film second of the launch. */
    launch: number;
  }

  /**
   * How deep a feint is shown, as a share of the way from the launch to the
   * committed punch's wrist: the declared share, but never into a person's
   * guard. The guard's depth is the farthest that person's hands and
   * forearms stand toward the striker from the aimed point one look-back
   * before the launch, and the fist keeps clear of it by its own reach past
   * the wrist and the two forearms' radii (derived: the surfaces that would
   * otherwise touch).
   *
   * @param context The striker's action context.
   * @param target What the feint aims at.
   * @param feint The feint's path.
   * @returns The share, in `[0, declared]`; the declared share for a target that is not a person or a path with no travel along the line.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the share, the guard's depth, the clearance's derivation and the cases left at the declared share.
   * @evidence contracts/development/implementation.md#principled-implementation The room along the line from the launch to the guard's front, less the surfaces that would touch, over the committed path's travel along the line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One guard depth and one ratio.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four bone reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The punch's geometry calls it once per build.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function feint(
    context: Pick<IHumanActionContext, "body" | "performer">,
    target: AutoMovieMotionTarget,
    feint: IFeint,
  ): number {
    if (target.kind !== "person") return feint.declared;
    const other: IHumanActionContext.IPerformer = context.performer(
      target.subject,
    );
    const theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      other.bones(feint.launch - StrikingTarget.LOOK);
    const guard: number = Math.max(
      0,
      ...(
        ["leftHand", "rightHand", "leftLowerArm", "rightLowerArm"] as const
      ).map((bone: AutoMovieHumanoidBone): number =>
        Vector3.dot(
          Vector3.subtract(feint.aimed, theirs.get(bone)!.worldPosition),
          feint.line,
        ),
      ),
    );
    const whole: number = Vector3.dot(
      Vector3.subtract(feint.end, feint.origin),
      feint.line,
    );
    if (!(whole > 1e-6)) return feint.declared;
    const clear: number =
      Vector3.dot(Vector3.subtract(feint.aimed, feint.origin), feint.line) -
      guard -
      feint.reach -
      context.body.measure.forearmRadius -
      other.body.measure.forearmRadius;
    return Math.min(feint.declared, Math.max(0, clear / whole));
  }

  /** The arms' capsule points with their radii: each capsule's ends and middle. */
  function swept(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): { point: IAutoMovieVector3; radius: number }[] {
    const radii: readonly (number | readonly [number, number])[] =
      StrikingWeapon.armRadii(body);
    const out: { point: IAutoMovieVector3; radius: number }[] = [];
    for (const side of ["left", "right"] as const) {
      const ends: IAutoMovieVector3[] = StrikingWeapon.posed(body, bones, side);
      radii.forEach(
        (radius: number | readonly [number, number], i: number): void => {
          for (const share of [0, 0.5, 1])
            out.push({
              point: Vector3.lerp(ends[i]!, ends[i + 1]!, share),
              radius: StrikingWeapon.girth(radius, share),
            });
        },
      );
    }
    return out;
  }
}
