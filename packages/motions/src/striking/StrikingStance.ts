import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "./StrikingBody";
import { StrikingReach } from "./StrikingReach";

/**
 * The fighting stance and its guard as goals measured on the body: a
 * staggered base on separate tracks, both knees soft, the body turned so the
 * lead shoulder faces the line, and each glove placed relative to the
 * performer's own head.
 *
 * Coaching sources (IBA coaching manual pp. 34 to 39; kickboxing and Muay
 * Thai guides summarised in the kickboxing research of #3201) give the
 * relations, not the numbers; the numbers are stated readings, each named:
 *
 * - stance length along the line 1.2 shoulder widths (guides: 1.0 to 1.3);
 * - the feet on their own hip tracks, so the lateral spacing is the hip
 *   joint spacing;
 * - the body turned 30 degrees from the line, lead shoulder forward (IBA p.34
 *   overhead feet), the lead foot pointing 15 degrees off the line toward the
 *   body's heading and the rear foot 45 degrees out (provisional readings of
 *   the same drawing);
 * - both knees flexed 32 degrees, inside the 25 to 45 degree translated range
 *   (soft knees, ready to lift either leg), by sinking the root;
 * - the rear glove's knuckles beside the rear jaw and the lead glove one
 *   forearm length ahead of the lead cheek at chin height, elbows down by the
 *   ribs (IBA guard; "gloves cover the jaw and temple, elbows near the ribs").
 *
 * Orthodox leads with the left side; southpaw with the right. Every distance
 * reads the body's measure, so the stance fits any stature and proportion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each stance relation with its coaching source and which numbers are readings or provisional.
 * @evidence contracts/development/design.md#principled-representation The stance as a lead side and a line heading in degrees; feet, root sink and limb goals in world metres measured on the body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named constants, the stance type and the queries the guard, footwork, strikes and reactions read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the foot placement, frame and posture-goal types; no stature is special-cased.
 */
export namespace StrikingStance {
  /** Stance length along the line in shoulder widths (coaching 1.0 to 1.3). */
  export const LENGTH_SHARE: number = 1.2;

  /** Body turn from the line, degrees, lead shoulder forward (IBA p.34 reading). */
  export const TURN: number = 30;

  /** Stance knee flexion, degrees (translated range 25 to 45). */
  export const KNEE_FLEXION: number = 32;

  /** Lead foot heading off the line toward the body's turn, degrees (provisional reading of IBA p.34). */
  export const LEAD_TOE: number = 15;

  /** Rear foot heading off the line, degrees (provisional reading of IBA p.34). */
  export const REAR_TOE: number = 45;

  /**
   * A stance: which side leads and the heading of the line to the opponent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and the heading's convention.
   * @evidence contracts/development/design.md#principled-representation A closed lead union and a heading in degrees about +Y.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values every stance query reads; queries needing only the lead take that part.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStance {
    /** The leading side: `left` is orthodox, `right` southpaw. */
    lead: "left" | "right";

    /** Heading of the line toward the opponent, degrees about +Y (0 faces +Z). */
    line: number;
  }

  /**
   * The rear side of a stance.
   *
   * @param stance The stance.
   * @returns The rear side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The side opposite the lead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rear(stance: Pick<IStance, "lead">): "left" | "right" {
    return stance.lead === "left" ? "right" : "left";
  }

  /**
   * The body's heading in a stance: turned from the line so the lead
   * shoulder comes forward (a turn to the right for an orthodox stance).
   *
   * @param stance The stance.
   * @returns Degrees about +Y.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turn's direction for each lead and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The line turned by the stance turn toward the rear side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function heading(stance: IStance): number {
    return stance.line + (stance.lead === "left" ? -TURN : TURN);
  }

  /**
   * Stance length along the line, metres.
   *
   * @param body The body.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit; the constant states the share and its range.
   * @evidence contracts/development/implementation.md#principled-implementation The coached share of the body's shoulder width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function length(body: IHumanBody): number {
    return LENGTH_SHARE * 2 * body.measure.shoulderHalfWidth;
  }

  /**
   * The feet of a stance about its centre on the floor.
   *
   * @param body The body.
   * @param stance The stance.
   * @param centre The stance centre on the floor, world metres.
   * @returns Each foot's placement, flat on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and that the feet are flat.
   * @evidence contracts/development/implementation.md#principled-implementation Each ankle on its hip's track, half a stance length ahead or behind along the line, at ankle height, the toes turned by the coached lead and rear angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stance frame and one placement per foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the toe angles are named provisional readings.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function feet(
    body: IHumanBody,
    stance: IStance,
    centre: IAutoMovieVector3,
  ): Record<"left" | "right", HumanFoot.IPlacement> {
    const frame: HumanFrame.IFrame = {
      origin: { x: centre.x, y: 0, z: centre.z },
      yaw: stance.line,
    };
    const half: number = length(body) / 2;
    const out = {} as Record<"left" | "right", HumanFoot.IPlacement>;
    for (const side of ["left", "right"] as const) {
      const lead: boolean = side === stance.lead;
      const x: number = (side === "left" ? 1 : -1) * body.measure.hipHalfWidth;
      const ankle: IAutoMovieVector3 = HumanFrame.point(frame, {
        x,
        y: body.measure.ankleHeight,
        z: lead ? half : -half,
      });
      const outward: number = side === "left" ? 1 : -1;
      const toe: number =
        stance.line +
        (lead
          ? stance.lead === "left"
            ? -LEAD_TOE
            : LEAD_TOE
          : outward * REAR_TOE);
      out[side] = { ankle, rotation: HumanFoot.rotation(toe, 0) };
    }
    return out;
  }

  /**
   * The root height that flexes both knees at least {@link KNEE_FLEXION}
   * over given feet: each leg's hip-to-ankle distance at that flexion (law
   * of cosines on the thigh and shank), its vertical part over the feet's
   * horizontal offset, and the lower of the two legs.
   *
   * @param body The body.
   * @param root The root's floor position, world metres (its height ignored).
   * @param yaw The body heading, degrees.
   * @param ankles The ankle points, world metres.
   * @param flexion The knee flexion, degrees.
   * @returns The root's height offset, metres (negative: sunk).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the derivation, the ignored root height and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Each leg's hip-to-ankle span at the flexion by the law of cosines, its vertical part over the horizontal offset from the rest hip, and the lower of the two legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One span and one pass over the legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot farther than the span gives a zero vertical part rather than a complex root; the offset never raises the root above zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function sink(
    body: IHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    ankles: Record<"left" | "right", IAutoMovieVector3>,
    flexion: number = KNEE_FLEXION,
  ): number {
    const span: number = StrikingReach.reach(
      body.measure.thigh,
      body.measure.shank,
      flexion,
    );
    let lowest: number = 0;
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = HumanFrame.point(
        { origin: { ...root, y: 0 }, yaw },
        body.rest.get(`${side}UpperLeg`)!,
      );
      const dx: number = hip.x - ankles[side].x;
      const dz: number = hip.z - ankles[side].z;
      const vertical: number = Math.sqrt(
        Math.max(0, span * span - dx * dx - dz * dz),
      );
      lowest = Math.min(lowest, ankles[side].y + vertical - hip.y);
    }
    return lowest;
  }

  /**
   * The guard's glove goals for a posture: the rear fist beside the rear jaw,
   * the lead fist one forearm length ahead of the lead cheek at chin height,
   * both vertical fists (knuckles up and forward, palms in), elbows bending
   * down toward the ribs. Placed on the posture's own head, so the guard
   * follows every root, turn and lean.
   *
   * @param body The body.
   * @param posture The posture whose trunk carries the head.
   * @param stance The stance.
   * @param drop How far each glove sags below its guard, metres.
   * @returns The two arm goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each glove's place, the fists' orientation, the elbows and that the guard follows the posture's head.
   * @evidence contracts/development/implementation.md#principled-implementation The gloves placed from the posture's own chin, jaw and face regions in forearm lengths and radii, the elbows bent toward a point below and ahead of each shoulder, each turned into a knuckle goal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution, then one goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offsets are measured on the body; the comment states why the gloves sit where the elbow stays in range.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function guard(
    body: IHumanBody,
    posture: IHumanPosture,
    stance: Pick<IStance, "lead">,
    drop: Partial<Record<"left" | "right", number>> = {},
  ): Pick<IHumanPosture["limbs"], "leftArm" | "rightArm"> {
    const bones = StrikingBody.trunk(body, posture);
    const m = body.measure;
    const chin: IAutoMovieVector3 = StrikingBody.region(
      body,
      bones,
      "chin",
    ).point;
    const forward: IAutoMovieVector3 = horizontal(
      StrikingBody.region(body, bones, "face").normal,
    );
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const out: Pick<IHumanPosture["limbs"], "leftArm" | "rightArm"> = {};
    for (const side of ["left", "right"] as const) {
      const lead: boolean = side === stance.lead;
      const jaw = StrikingBody.region(
        body,
        bones,
        side === "left" ? "jawLeft" : "jawRight",
      );
      const outward: IAutoMovieVector3 = horizontal(jaw.normal);
      // The rear fist a quarter forearm in front of the jaw and the lead fist
      // most of a forearm ahead of the cheek: closer, the elbow would have to
      // fold past its range to keep down by the ribs.
      const fistAt: IAutoMovieVector3 = lead
        ? Vector3.add(
            Vector3.add(
              { ...jaw.point, y: chin.y },
              Vector3.scale(forward, m.forearm),
            ),
            Vector3.scale(outward, -0.5 * m.forearmRadius),
          )
        : Vector3.add(
            Vector3.add(jaw.point, Vector3.scale(outward, m.forearmRadius)),
            Vector3.scale(forward, 2 * m.forearmRadius + 0.25 * m.forearm),
          );
      const sag: IAutoMovieVector3 = {
        ...fistAt,
        y: fistAt.y - (drop[side] ?? 0),
      };
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm` as AutoMovieHumanoidBone,
      )!.worldPosition;
      const bend: IAutoMovieVector3 = Vector3.add(
        shoulder,
        Vector3.add(
          Vector3.scale(up, -0.8 * m.upperArm),
          Vector3.scale(forward, 0.5 * m.upperArm),
        ),
      );

      out[side === "left" ? "leftArm" : "rightArm"] = glove(
        body,
        side,
        sag,
        bend,
      );
    }
    return out;
  }

  /**
   * An arm goal that puts the fist's knuckles on a point with the elbow
   * bending toward a hint, the fist continuing the forearm: no wrist
   * rotation is imposed, so the limb fit keeps the elbow on its hint and the
   * hand follows the forearm, and the wrist lies the fist socket's distance
   * back along the line from the hint to the point.
   *
   * @param body The body.
   * @param side The arm.
   * @param fist Where the knuckles go, world metres.
   * @param elbow Where the elbow bends toward, world metres.
   * @returns The arm goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why no wrist rotation is set and where the wrist lies.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist one fist-socket distance back from the knuckles along the hint-to-fist line, the hint passed through as the bend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direction and one offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function glove(
    body: IHumanBody,
    side: "left" | "right",
    fist: IAutoMovieVector3,
    elbow: IAutoMovieVector3,
  ): IHumanPosture.IGoal {
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(fist, elbow),
    );
    const reach: number = Vector3.length(
      body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"].point,
    );
    return {
      point: Vector3.subtract(fist, Vector3.scale(along, reach)),
      bend: elbow,
    };
  }

  /**
   * Planted leg goals on placed feet: the knee's bend hint lies up the leg
   * from the ankle and out along the foot's own three-dimensional forward
   * (its heading and its pitch, so a heel raised on a ball pivot tips the
   * hint with it), which under the engine's hinged knee fit decides the knee's
   * side; the foot's rotation itself goes through as the effector rotation,
   * which the fit carries with the hip's swivel.
   *
   * @param body The body.
   * @param feet The feet.
   * @param planted Which feet bear on the floor.
   * @returns The leg goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the hint's construction and why, and that the foot's rotation passes through.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle goal at each foot with a knee hint one shank up and half a shank along the foot's forward, which picks the hinged knee's side in the engine's fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function legs(
    body: IHumanBody,
    feet: Record<"left" | "right", HumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean> = { left: true, right: true },
  ): Pick<IHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    const out: Pick<IHumanPosture["limbs"], "leftLeg" | "rightLeg"> = {};
    for (const side of ["left", "right"] as const) {
      const foot: HumanFoot.IPlacement = feet[side];
      const toes: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation, {
        x: 0,
        y: 0,
        z: 1,
      });
      const bend: IAutoMovieVector3 = Vector3.add(
        foot.ankle,
        Vector3.add(Vector3.scale(toes, 0.5 * body.measure.shank), {
          x: 0,
          y: body.measure.shank,
          z: 0,
        }),
      );
      out[side === "left" ? "leftLeg" : "rightLeg"] = {
        point: foot.ankle,
        bend,
        rotation: foot.rotation,
        ...(planted[side] ? { planted: true } : {}),
      };
    }
    return out;
  }

  /**
   * The stance's trunk and hand angles that no effector goal expresses: the
   * chin tucked 12 degrees (cervical flexion, the lower third of its range)
   * and both fists closed.
   *
   * @returns Clinical angles by bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chin tuck, its range basis and the closed fists.
   * @evidence contracts/development/implementation.md#principled-implementation Fixed clinical angles inside their ranges, with the fist curl of both hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One object.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A constant table built per call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function joints(): Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > {
    return {
      neck: [12, 0, 0],
      ...StrikingBody.curl("left"),
      ...StrikingBody.curl("right"),
    };
  }
}

/** A direction's horizontal part, normalised; forward (+Z) when vertical. */
function horizontal(v: IAutoMovieVector3): IAutoMovieVector3 {
  const h: IAutoMovieVector3 = { x: v.x, y: 0, z: v.z };
  return Vector3.length(h) > 1e-9 ? Vector3.normalize(h) : { x: 0, y: 0, z: 1 };
}
