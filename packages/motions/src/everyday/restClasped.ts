import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import type { rest } from "./rest";

/**
 * The rest goals of two hands laid one on the other against the trunk: in
 * front of the pelvis or behind it.
 *
 * The left hand lies on the trunk's own surface and the right hand on the
 * left one, both the same way round, as one hand rests on the other:
 *
 * - In front the left palm lies on the front of the pelvis and the right palm
 *   on the back of the left hand, so both palms face the body.
 * - Behind, the back of the left hand lies on the sacrum and the back of the
 *   right hand in the left palm, so both palms face back.
 *
 * The place on the trunk is a point of its colliders on the midline
 * (`HumanTrunk.surface`), and the hand surface faces into the surface's own
 * normal there, so the hand touches the body where the body is. Each hand
 * continues its forearm: the fingers point along the forearm's direction as
 * far as the surface the hand lies on allows, which leaves the wrist near
 * neutral in flexion and deviation. The forearm is the one of the arm's two
 * segments on the shoulder, the wrist and the elbow's bend hint; the wrist
 * follows from the fingers, so the two are settled by a few rounds of
 * substitution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which surface lies on which, where the place and the hand's turn come from, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Two functions that return both hands' goals, since either place holds both hands and the right hand's goal depends on the left one's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two places and the one constant the front place reads; the rest law's goal table is the only caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Returns the rest law's own goal type; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation A point and normal of the true colliders, a comfortable elbow flexion for the height, and a neutral wrist from the arm's triangle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One surface point per place, one laid hand, one hand stacked on it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The height is bounded by the regions the trunk names, not moved until a verdict passes; a ray that misses the trunk throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms A 12-step bisection of ray casts for the front height and three substitutions per hand; run once per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.surface` for the colliders and `HumanHand` for the hand's surfaces and turn.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure functions that retain nothing.
 */
export namespace restClasped {
  /**
   * The elbow flexion the hands clasped in front settle at, degrees
   * (provisional: no measurement of this stance was located; the arms hang
   * a little short of straight).
   */
  export const FLEXION: number = 30;

  /**
   * Both hands' goals clasped in front of the pelvis.
   *
   * The left palm lies on the front midline of the trunk at the height where
   * the farther of the two wrists, as both goals place them, is as far from
   * its shoulder as the arm reaches with the elbow flexed by `FLEXION`; the
   * covering hand lies a hand's thickness farther out, so it is usually the
   * one. Found by bisection since a higher place is nearer the shoulder. The
   * height stays
   * between the groin and the abdomen regions: a long arm bends more at the
   * groin and a short one straightens toward the abdomen.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param elbows Each elbow's bend hint, world metres.
   * @returns Both goals.
   * @throws {Error} When the trunk has no front surface at the height.
   */
  export function front(
    body: IHumanBody,
    posture: IHumanPosture,
    elbows: Record<HumanHand.Side, IAutoMovieVector3>,
  ): Record<HumanHand.Side, rest.IGoal> {
    const ahead: IAutoMovieVector3 = heading(posture);
    const groin: IAutoMovieVector3 = HumanTrunk.region(
      body,
      posture,
      "groin",
    ).point;
    const abdomen: IAutoMovieVector3 = HumanTrunk.region(
      body,
      posture,
      "abdomen",
    ).point;
    const shoulders: Record<HumanHand.Side, IAutoMovieVector3> = joints(
      body,
      posture,
    );
    const at = (
      y: number,
    ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =>
      HumanTrunk.surface(
        body,
        posture,
        {
          ...Vector3.add(groin, Vector3.scale(ahead, body.measure.stature)),
          y,
        },
        Vector3.scale(ahead, -1),
      );
    const goals = (y: number): Record<HumanHand.Side, rest.IGoal> => {
      const place = at(y);
      const left: rest.IGoal = laid(
        body,
        "left",
        "palm",
        place.point,
        place.normal,
        shoulders.left,
        elbows.left,
      );
      return {
        left,
        right: stacked(
          body,
          left,
          "handBack",
          "right",
          "palm",
          shoulders.right,
          elbows.right,
        ),
      };
    };
    // How far the farther of the two wrists lies beyond its arm's reach at
    // the comfortable flexion, metres.
    const excess = (y: number): number => {
      const both: Record<HumanHand.Side, rest.IGoal> = goals(y);
      return Math.max(
        ...(["left", "right"] as const).map((side: HumanHand.Side): number => {
          const goal: rest.IGoal = both[side];
          const upper: number = segment(body, side, "UpperArm", "LowerArm");
          const lower: number = segment(body, side, "LowerArm", "Hand");
          return (
            Vector3.length(
              Vector3.subtract(
                HumanHand.place(
                  body,
                  side,
                  goal.surface,
                  goal.point,
                  goal.rotation,
                  goal.shape,
                ).point,
                shoulders[side],
              ),
            ) -
            Math.sqrt(
              upper * upper +
                lower * lower +
                2 * upper * lower * Math.cos((FLEXION * Math.PI) / 180),
            )
          );
        }),
      );
    };
    let lo: number = groin.y;
    let hi: number = abdomen.y;
    if (excess(lo) <= 0) hi = lo;
    else if (excess(hi) >= 0) lo = hi;
    else
      for (let i: number = 0; i < 12; i++) {
        const mid: number = (lo + hi) / 2;
        if (excess(mid) > 0) lo = mid;
        else hi = mid;
      }
    return goals((lo + hi) / 2);
  }

  /**
   * Both hands' goals clasped behind the pelvis: the back of the left hand on
   * the back midline of the trunk 0.03 of the stature below the lower back
   * region (the sacrum; provisional), and the back of the right hand in the
   * left palm.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param elbows Each elbow's bend hint, world metres.
   * @returns Both goals.
   * @throws {Error} When the trunk has no back surface at the height.
   */
  export function behind(
    body: IHumanBody,
    posture: IHumanPosture,
    elbows: Record<HumanHand.Side, IAutoMovieVector3>,
  ): Record<HumanHand.Side, rest.IGoal> {
    const ahead: IAutoMovieVector3 = heading(posture);
    const back: IAutoMovieVector3 = HumanTrunk.region(
      body,
      posture,
      "lowerBack",
    ).point;
    const shoulders: Record<HumanHand.Side, IAutoMovieVector3> = joints(
      body,
      posture,
    );
    const place = HumanTrunk.surface(
      body,
      posture,
      {
        ...Vector3.subtract(back, Vector3.scale(ahead, body.measure.stature)),
        y: back.y - 0.03 * body.measure.stature,
      },
      ahead,
    );
    const left: rest.IGoal = laid(
      body,
      "left",
      "handBack",
      place.point,
      place.normal,
      shoulders.left,
      elbows.left,
    );
    return {
      left,
      right: stacked(
        body,
        left,
        "palm",
        "right",
        "handBack",
        shoulders.right,
        elbows.right,
      ),
    };
  }
}

/** The unit direction a posture faces, world frame. */
function heading(posture: IHumanPosture): IAutoMovieVector3 {
  return HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
}

/** Both shoulder joints of a posture, world metres: they ride the trunk, not the arm's goal. */
function joints(
  body: IHumanBody,
  posture: IHumanPosture,
): Record<HumanHand.Side, IAutoMovieVector3> {
  const bones = HumanTrunk.resolve(body, posture);
  return {
    left: bones.get("leftUpperArm")!.worldPosition,
    right: bones.get("rightUpperArm")!.worldPosition,
  };
}

/** A rest length between two joints of an arm, metres. */
function segment(
  body: IHumanBody,
  side: HumanHand.Side,
  from: "UpperArm" | "LowerArm",
  to: "LowerArm" | "Hand",
): number {
  return Vector3.length(
    Vector3.subtract(
      body.rest.get(`${side}${to}`)!,
      body.rest.get(`${side}${from}`)!,
    ),
  );
}

/** A vector's unit component across a unit normal. */
function across(
  normal: IAutoMovieVector3,
  vector: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.normalize(
    Vector3.subtract(
      vector,
      Vector3.scale(normal, Vector3.dot(vector, normal)),
    ),
  );
}

/**
 * The unit direction of a forearm, from the elbow to the wrist: the elbow
 * lies on the circle the arm's two segments allow about the line from the
 * shoulder to the wrist, on the side of the bend hint.
 */
function forearm(
  body: IHumanBody,
  side: HumanHand.Side,
  shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  hint: IAutoMovieVector3,
): IAutoMovieVector3 {
  const upper: number = segment(body, side, "UpperArm", "LowerArm");
  const lower: number = segment(body, side, "LowerArm", "Hand");
  const span: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
  const axis: IAutoMovieVector3 = Vector3.normalize(span);
  const reach: number = Math.min(
    upper + lower,
    Math.max(Math.abs(upper - lower), Vector3.length(span), 1e-9),
  );
  const along: number =
    (upper * upper - lower * lower + reach * reach) / (2 * reach);
  const off: number = Math.sqrt(Math.max(0, upper * upper - along * along));
  const elbow: IAutoMovieVector3 = Vector3.add(
    Vector3.add(shoulder, Vector3.scale(axis, along)),
    Vector3.scale(across(axis, Vector3.subtract(hint, shoulder)), off),
  );
  return Vector3.normalize(
    Vector3.subtract(Vector3.add(shoulder, Vector3.scale(axis, reach)), elbow),
  );
}

/**
 * A hand surface laid on a surface point: its normal turned into the
 * surface's outward normal exactly, and the fingers along the forearm as far
 * as that allows. The wrist depends on the fingers and the forearm on the
 * wrist, so the direction starts at the line from the shoulder to the point
 * and is substituted three times.
 */
function laid(
  body: IHumanBody,
  side: HumanHand.Side,
  surface: HumanHand.Surface,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  shoulder: IAutoMovieVector3,
  elbow: IAutoMovieVector3,
): rest.IGoal {
  const local: HumanHand.IFrame = HumanHand.offset(body, side, surface);
  const into: IAutoMovieVector3 = Vector3.scale(normal, -1);
  const turned = (fingers: IAutoMovieVector3): IAutoMovieQuaternion =>
    HumanHand.align(
      {
        normal: local.normal,
        forward: { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      },
      { normal: into, forward: fingers },
    );
  let rotation: IAutoMovieQuaternion = turned(
    across(into, Vector3.subtract(point, shoulder)),
  );
  for (let i: number = 0; i < 3; i++)
    rotation = turned(
      across(
        into,
        forearm(
          body,
          side,
          shoulder,
          HumanHand.place(body, side, surface, point, rotation).point,
          elbow,
        ),
      ),
    );
  return { surface, shape: "relaxed", point, rotation, elbow };
}

/**
 * A hand surface laid on a surface of the left hand as the left hand holds
 * its own goal.
 */
function stacked(
  body: IHumanBody,
  left: rest.IGoal,
  on: HumanHand.Surface,
  side: HumanHand.Side,
  surface: HumanHand.Surface,
  shoulder: IAutoMovieVector3,
  elbow: IAutoMovieVector3,
): rest.IGoal {
  const wrist: HumanHand.IWrist = HumanHand.place(
    body,
    "left",
    left.surface,
    left.point,
    left.rotation,
    left.shape,
  );
  const face: HumanHand.IFrame = HumanHand.offset(body, "left", on, left.shape);
  return laid(
    body,
    side,
    surface,
    Vector3.add(
      wrist.point,
      Quaternion.rotateVector(wrist.rotation, face.point),
    ),
    Quaternion.rotateVector(wrist.rotation, face.normal),
    shoulder,
    elbow,
  );
}
