import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanObstacle } from "../perform/HumanObstacle";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";

/** The alternatives of `FeintContext`'s site. */
type FeintContext = "body" | "performer";

/** The alternatives of `BehindContext`'s site. */
type BehindContext = "body" | "obstacles";

/** The alternatives of `AheadContext`'s site. */
type AheadContext = "body" | "performer";

/**
 * The room a striker has to close on another person: how far its body may
 * travel along a line before its arms, held as they are, meet the other body. A
 * strike steps in until its arm reaches, and where the other body stands nearer
 * than that step (a guard held forward of the target, a taller person's arms
 * above a shorter one's), the step would walk the striker's guard into it; the
 * step is bounded by the space in front of the striker, not only by the
 * stance.
 *
 * Each arm is swept as the points of its three capsules (the upper arm, the
 * forearm and the fist, the capsules the performance resolves contacts on,
 * {@link StrikingWeapon.posed}): the ends and the middle of each, with that
 * capsule's radius. A point swept a distance `d` along the line covers the
 * segment from it to `d` further on, whose signed distance to the other body's
 * colliders only falls as `d` grows, so the first `d` at which the swept point
 * touches is found by bisection. The arms lead a guard, so they meet the other
 * body first; the trunk and the legs behind them are not swept.
 *
 * A step back, before a target nearer than the arm's band, has room too
 * ({@link behind}): the scene's solids behind the feet bound it as the other
 * person bounds a step in.
 *
 * A feint has room of its own: it stops short of the other person's guard
 * ({@link feint}), so the defender bites on a fist that never touches.
 */
export namespace StrikingRoom {
  /** What the room is measured between. */
  export interface IProps {
    /** The striker's body. */
    body: IAutoMovieMotionHumanBody;

    /** The striker's posed bones, world frame. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The other person's body. */
    other: IAutoMovieMotionHumanBody;

    /** The other person's posed bones, world frame. */
    others: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The horizontal unit line the striker travels along. */
    line: IAutoMovieVector3;

    /** The farthest travel asked, metres; positive. */
    limit: number;
  }

  /**
   * The original proximal/midpoint/distal sample order, shared as immutable
   * geometry.
   */
  const SHARES: readonly number[] = [0, 0.5, 1];

  /** The bisection's halvings: a 0.4 m stance step over 2^14 is under 0.03 mm. */
  const HALVINGS: number = 14;

  /**
   * How far the striker may travel along the line before an arm meets the other
   * body, at most the limit.
   *
   * @param props The two bodies, the line and the limit.
   * @returns Metres in `[0, limit]`; zero when an arm already touches.
   */
  export function along(props: IProps): number {
    const geometry: ReturnType<typeof HumanColliders.reading> =
      HumanColliders.reading(props.other, props.others);
    const radii: ReturnType<typeof StrikingWeapon.armRadii> =
      StrikingWeapon.armRadii(props.body);
    // Read both arm axes before distance queries so missing frames still fail first.
    const axes: readonly [IAutoMovieVector3[], IAutoMovieVector3[]] = [
      StrikingWeapon.posed(props.body, props.bones, "left"),
      StrikingWeapon.posed(props.body, props.bones, "right"),
    ];
    const gap: (
      point: IAutoMovieVector3,
      radius: number,
      distance: number,
    ) => number = (
      point: IAutoMovieVector3,
      radius: number,
      distance: number,
    ): number =>
      geometry.segment(
        point,
        Vector3.add(point, Vector3.scale(props.line, distance)),
      ).distance - radius;
    const samples: ISample[] = [];
    for (const ends of axes)
      for (let segment: number = 0; segment < radii.length; segment++)
        for (const share of SHARES)
          samples.push({
            point: Vector3.lerp(ends[segment]!, ends[segment + 1]!, share),
            radius: StrikingWeapon.girth(radii[segment]!, share),
          });
    return room(samples, gap, props.limit);
  }

  /** A sampled point of a striking limb and its girth there. */
  export interface ISample {
    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** The limb's radius there, metres. */
    radius: number;
  }

  /**
   * The room a limb has to travel along a line: the least distance, within a
   * limit, at which any sample's swept gap closes, bisected inside the room
   * left; none when a sample already touches.
   *
   * @param samples The limb's sampled points and girths.
   * @param gap The clearance of a sample swept a distance along the line.
   * @param limit The room sought, metres.
   * @returns The room, metres.
   */
  export function room(
    samples: readonly ISample[],
    gap: (point: IAutoMovieVector3, radius: number, distance: number) => number,
    limit: number,
  ): number {
    let room: number = limit;
    for (const { point, radius } of samples) {
      if (gap(point, radius, room) > 0) continue;
      if (gap(point, radius, 0) <= 0) return 0;
      room = AutoMovieEngineMath.bracketedBisection(
        (distance: number): boolean => gap(point, radius, distance) <= 0,
        room,
        0,
        room / 2 ** HALVINGS,
      );
    }
    return room;
  }

  /**
   * A strike's room toward its target, as the strike reads it one look-back
   * before its launch ({@link StrikingTarget.LOOK}): the room toward the person
   * it aims at, up to one stance length (the longest step a strike takes), or
   * no bound for a target that is not a person.
   *
   * @param context The striker's action context.
   * @param target What the strike aims at.
   * @param bones The striker's bones at the launch, world frame.
   * @param line The horizontal unit line of the step.
   * @param launch Film second of the launch.
   * @returns Metres, or infinity for a target that is not a person.
   */
  export function ahead(
    context: Pick<IAutoMovieMotionHumanActionContext, AheadContext>,
    target: IAutoMovieMotionTarget,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    line: IAutoMovieVector3,
    launch: number,
  ): number {
    if (target.kind !== "person") return Infinity;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    return along({
      body: context.body,
      bones,
      other: other.body,
      others: other.bones(
        launch - StrikingTarget.LOOK,
        HumanColliders.bones(other.body),
      ),
      line,
      limit: StrikingStance.length(context.body),
    });
  }

  /**
   * How far a striker may step back along the line before a heel meets one of
   * the scene's solids, at most one stance length (the longest step a strike
   * takes).
   *
   * @param context The striker's action context.
   * @param feet Where the feet stand at the launch.
   * @param line The horizontal unit line toward the target; the step back runs
   *   along its opposite.
   * @returns Metres in `[0, stance length]`.
   */
  export function behind(
    context: Pick<IAutoMovieMotionHumanActionContext, BehindContext>,
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
    >,
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
      const block: IAutoMovieMotionHumanObstacle.IBlock | null =
        HumanObstacle.blocking(
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
   * guard. The guard's depth is the farthest that person's hands and forearms
   * stand toward the striker from the aimed point one look-back before the
   * launch, and the fist keeps clear of it by its own reach past the wrist and
   * the two forearms' radii (derived: the surfaces that would otherwise
   * touch).
   *
   * @param context The striker's action context.
   * @param target What the feint aims at.
   * @param feint The feint's path.
   * @returns The share, in `[0, declared]`; the declared share for a target
   *   that is not a person or a path with no travel along the line.
   */
  export function feint(
    context: Pick<IAutoMovieMotionHumanActionContext, FeintContext>,
    target: IAutoMovieMotionTarget,
    feint: IFeint,
  ): number {
    if (target.kind !== "person") return feint.declared;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    const theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      other.bones(feint.launch - StrikingTarget.LOOK, GUARD);
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
    return share(
      feint,
      guard,
      context.body.measure.forearmRadius + other.body.measure.forearmRadius,
    );
  }
  /**
   * How far a feint may run before it meets the guard: the share of its whole
   * way out that stays clear of the farthest guarding hand or forearm by the
   * reach and both forearms' girth, no more than declared.
   *
   * @param feint The feint's declared share, aim, ends, reach and line.
   * @param guard How far the guard stands out along the line from the aim,
   *   metres.
   * @param girth Both forearms' radii, metres.
   * @returns The share, 0 to the declared.
   */
  export function share(feint: IFeint, guard: number, girth: number): number {
    const whole: number = Vector3.dot(
      Vector3.subtract(feint.end, feint.origin),
      feint.line,
    );
    if (!(whole > 1e-6)) return feint.declared;
    const clear: number =
      Vector3.dot(Vector3.subtract(feint.aimed, feint.origin), feint.line) -
      guard -
      feint.reach -
      girth;
    return Math.min(feint.declared, Math.max(0, clear / whole));
  }
}

/** A feint reads only the four actual guard joints and their required ancestry. */
const GUARD: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "leftHand",
    "rightHand",
    "leftLowerArm",
    "rightLowerArm",
  ]);
