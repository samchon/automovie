import { AutoMovieEngineKinematics, Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanGuard, IAutoMovieMotionHumanPerformerReader, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanStrikingStance, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPerception } from "../../law/internal/HumanPerception";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/** The record of `IBackRoot`'s site. */
type IBackRoot = { position: IAutoMovieVector3; yaw: number };

/**
 * How far a guard facing a person steps back so that the two fighters' guards,
 * both held, stand clear of each other: no joint of either body inside the
 * other's colliders (the partner verdict's reading, `HumanColliders.distance`),
 * whatever the two bodies' sizes.
 *
 * Each fighter reads the other as it perceived them when its guard began, where
 * the guard's line reads them (`StrikingTarget.LOOK` and a reaction time,
 * `HumanPerception.REACTION`), so two guards reading each other never read each
 * other's guard while it is planned. From that reading it anticipates the
 * other's guard held at `set`: the stance the guard law lays for that body
 * about its feet, its lead the foot ahead, facing this fighter (`held`). The
 * two guards held where they stand would pass into each other by some step
 * along the floor's line between them; each fighter takes half of it, the
 * reciprocal share of optimal reciprocal collision avoidance (van den Berg,
 * Guy, Lin and Manocha 2011), so the two halves clear them together. The step
 * is the least at which they clear, bisected (`bracketedBisection`) from a
 * bracket doubled until it clears.
 */
export namespace StrikingGuardYield {
  /**
   * The step back of a guard from the person it faces, half of what keeps the
   * two guards held clear, or null when they already clear or the guard faces
   * no person.
   *
   * @param context The guard's context.
   * @param own The fighter's own guard held at `set`, as its stance lays it.
   * @returns The step, world metres on the floor, or null.
   */
  export function back(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuard.IParams>,
    own: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 | null {
    const facing: IAutoMovieMotionHumanGuard.IParams["facing"] =
      context.params.facing;
    if (facing === undefined || facing.kind !== "person") return null;
    const body: IAutoMovieMotionHumanBody = context.body;

    // The other as perceived where the guard's line reads them, a look back
    // and a reaction time before (`context.aim`): their hips, heading and
    // feet.
    const seen: number =
      context.start - StrikingTarget.LOOK - HumanPerception.REACTION;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      facing.subject,
    );
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      other.bones(seen, STANCE_BONES);
    const hips: IAutoMovieResolvedBone = shown.get("hips")!;
    const facingOf: IAutoMovieVector3 = Quaternion.rotateVector(
      hips.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    const root: IBackRoot = {
      position: hips.worldPosition,
      yaw: (Math.atan2(facingOf.x, facingOf.z) * 180) / Math.PI,
    };
    const toward: IAutoMovieVector3 = {
      x: root.position.x - context.entry.posture.root.x,
      y: 0,
      z: root.position.z - context.entry.posture.root.z,
    };
    const apart: number = Vector3.length(toward);
    if (!(apart > 0)) return null;
    const axis: IAutoMovieVector3 = Vector3.scale(toward, 1 / apart);

    // The other's guard held, facing this fighter's own faced region.
    const region: IAutoMovieMotionHumanBody["surfaces"]["regions"][keyof IAutoMovieMotionHumanBody["surfaces"]["regions"]] =
      body.surfaces.regions[facing.region];
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set([region.bone]),
    );
    const face: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      region,
      mine.get(region.bone)!,
    ).point;
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: shown.get("leftFoot")!.worldPosition,
      right: shown.get("rightFoot")!.worldPosition,
    };
    const ahead: number = Vector3.dot(
      Vector3.subtract(feet.right, feet.left),
      forwardOf(root.yaw),
    );
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        other.body,
        resolveHumanPosture(
          other.body,
          held(
            other.body,
            {
              // The foot ahead leads, as the guard law reads its entry
              // (`StrikingTarget.lead`).
              lead: ahead > LEAD ? "right" : "left",
              line: StrikingTarget.heading(
                StrikingTarget.line(root.position, face, root.yaw),
              ),
            },
            {
              x: (feet.left.x + feet.right.x) / 2,
              y: 0,
              z: (feet.left.z + feet.right.z) / 2,
            },
            entered(other, seen),
          ),
        ),
      );
    const ours: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, own),
    );
    const ownDistance = HumanColliders.reading(body, ours).segment;
    const otherDistance = HumanColliders.reading(other.body, theirs).segment;

    // Translate each query point instead of placing either body's colliders
    // again. The two poses remain fixed throughout the separation search.
    const gap: (step: number) => number = (step: number): number => {
      const move: IAutoMovieVector3 = Vector3.scale(axis, step);
      let least: number = Infinity;
      for (const bone of ours.values()) {
        const point: IAutoMovieVector3 = Vector3.subtract(
          bone.worldPosition,
          move,
        );
        least = Math.min(least, otherDistance(point, point).distance);
      }
      for (const bone of theirs.values()) {
        const point: IAutoMovieVector3 = Vector3.add(bone.worldPosition, move);
        least = Math.min(least, ownDistance(point, point).distance);
      }
      return least;
    };
    return separate(axis, apart, gap);
  }

  /**
   * Find the least clear separation on a floor axis, and share its displacement
   * equally between two animated bodies. The starting overlap sets the first
   * search scale and expansion stops at the separation of the bodies.
   *
   * @param axis The horizontal unit axis toward the other body.
   * @param apart The initial separation of the bodies, metres.
   * @param gap The signed clearance after one total separating move, metres.
   * @returns The first body's half displacement, or null when already clear.
   */
  export function separate(
    axis: IAutoMovieVector3,
    apart: number,
    gap: (step: number) => number,
  ): IAutoMovieVector3 | null {
    const inside: number = gap(0);
    if (inside >= 0) return null;
    let clear: number = -inside;
    while (gap(clear) < 0 && clear < apart) clear *= 2;
    const step: number = AutoMovieEngineMath.bracketedBisection(
      (s: number): boolean => gap(s) < 0,
      0,
      clear,
      TOLERANCE,
    );
    return Vector3.scale(axis, -step / 2);
  }

  /**
   * A body's guard held at `set` about a stance centre on the floor: the feet
   * on their stance places, the root sunk over them, turned to the stance
   * heading with the face kept on the line, the chin tucked and the gloves up,
   * over the angles the body entered with, as the guard law holds it.
   *
   * @param body The body.
   * @param stance The lead and the line.
   * @param centre The stance centre, world metres on the floor.
   * @param entry The clinical angles the body enters the guard with; none, the
   *   rest pose, when absent.
   * @returns The posture.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    stance: IAutoMovieMotionHumanStrikingStance.IStance,
    centre: IAutoMovieVector3,
    entry: IAutoMovieMotionHumanPosture["joints"] = {},
  ): IAutoMovieMotionHumanPosture {
    const to: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
      StrikingStance.feet(body, stance, centre);
    const heading: number = StrikingStance.heading(stance);
    const root: IAutoMovieVector3 = { x: centre.x, y: 0, z: centre.z };

    // The entry's angles under the stance's own, the neck and the head
    // turned back by half the body's turn from the line, as the guard law
    // sets them at `set`.
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry,
      ...StrikingStance.joints(entry),
    };
    const faced: number = -Math.max(
      -StrikingStance.FACING,
      Math.min(StrikingStance.FACING, 0.5 * (heading - stance.line)),
    );
    const neck: readonly [number, number, number] = joints.neck ?? [0, 0, 0];
    const head: readonly [number, number, number] = joints.head ?? [0, 0, 0];
    const lowered: IAutoMovieMotionHumanPosture = lowerHumanPosture(
      body,
      {
        root: {
          ...root,
          y: StrikingStance.sink(body, root, heading, {
            left: to.left.ankle,
            right: to.right.ankle,
          }),
        },
        yaw: heading,
        pitch: 0,
        roll: 0,
        joints: {
          ...joints,
          neck: [neck[0], neck[1], faced],
          head: [head[0], head[1], faced],
        },
        limbs: StrikingStance.legs(body, to),
      },
      lowerHumanPosture.KNEE,
    );
    return {
      ...lowered,
      limbs: {
        ...lowered.limbs,
        ...StrikingStance.guard(body, lowered, { lead: stance.lead }),
      },
    };
  }

  /**
   * How far one foot stands ahead of the other along the heading before it
   * leads, metres (`StrikingTarget.lead`'s).
   */
  export const LEAD: number = 0.02;

  /**
   * The width the step is bisected to, metres: a tenth of the millimetre the
   * partner verdict reports a depth in.
   */
  export const TOLERANCE: number = 1e-4;

  /**
   * The angles a person holds at a second as their placed actions write them,
   * the posture their guard keeps under its own; none, the rest pose, where the
   * reader has no placed path or their actions there are not placed yet (a
   * participant refusal of the reader).
   */
  function entered(
    other: IAutoMovieMotionHumanPerformerReader,
    seconds: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    if (other.posture === undefined) return {};
    try {
      return other.posture(seconds).joints;
    } catch (error) {
      if (error instanceof HumanRefusal && error.kind === "participant")
        return {};
      throw error;
    }
  }

  /** The horizontal forward of a heading. */
  function forwardOf(yaw: number): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }
}

/** The peer frames used to infer the stance center, heading and lead. */
const STANCE_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "hips",
  "leftFoot",
  "rightFoot",
]);
