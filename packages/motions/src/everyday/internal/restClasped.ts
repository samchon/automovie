import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRest,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { HumanTrunk } from "./HumanTrunk";
import { restForearm } from "./restForearm";

/** The record of `IFrontGoalsPlace`'s site. */
type IFrontGoalsPlace = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/** The record of `IFrontAtResult`'s site. */
type IFrontAtResult = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/** The record of `IFrontAt`'s site. */
type IFrontAt = {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
};

/**
 * The rest goals of two hands laid one on the other against the trunk: in front
 * of the pelvis or behind it.
 *
 * The left hand lies on the trunk's own surface and the right hand on the left
 * one, both the same way round, as one hand rests on the other:
 *
 * - In front the left palm lies on the front of the pelvis and the right palm on
 *   the back of the left hand, so both palms face the body.
 * - Behind, the back of the left hand lies on the sacrum and the back of the
 *   right hand in the left palm, so both palms face back, the fingers of both
 *   hands extended (`behind`).
 *
 * The place on the trunk is a point of its colliders on the midline
 * (`HumanTrunk.surface`), and the hand surface faces into the surface's own
 * normal there, so the hand touches the body where the body is. Each hand
 * continues its forearm: the fingers point along the forearm's direction as far
 * as the surface the hand lies on allows, which leaves the wrist near neutral
 * in flexion and deviation. The forearm is the one of the arm's two segments on
 * the shoulder, the wrist and the elbow's bend hint; the wrist follows from the
 * fingers, so the two are settled by a few rounds of substitution.
 */
export namespace restClasped {
  /**
   * The elbow flexion the hands clasped in front settle at, degrees
   * (provisional: no measurement of this stance was located; the arms hang a
   * little short of straight).
   */
  export const FLEXION: number = 30;

  /**
   * Both hands' goals clasped in front of the pelvis.
   *
   * The left palm lies on the front midline of the trunk at the height where
   * the farther of the two wrists, as both goals place them, is as far from its
   * shoulder as the arm reaches with the elbow flexed by `FLEXION`; the
   * covering hand lies a hand's thickness farther out, so it is usually the
   * one. Found by bisection since a higher place is nearer the shoulder. The
   * height stays between the groin and the abdomen regions: a long arm bends
   * more at the groin and a short one straightens toward the abdomen.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param elbows Each elbow's bend hint, world metres.
   * @returns Both goals.
   * @throws {Error} When the trunk has no front surface at the height.
   */
  export function front(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    elbows: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal> {
    const trunk: HumanTrunk.IReading = HumanTrunk.prepare(
      body,
      posture,
      FRAMES,
    );
    const ahead: IAutoMovieVector3 = heading(posture);
    const groin: IAutoMovieVector3 = trunk.region("groin").point;
    const abdomen: IAutoMovieVector3 = trunk.region("abdomen").point;
    const shoulders: Record<AutoMovieHumanSide, IAutoMovieVector3> =
      joints(trunk);
    const ray: IAutoMovieVector3 = Vector3.addScaled(
      groin,
      ahead,
      body.measure.stature,
    );
    const inward: IAutoMovieVector3 = Vector3.scale(ahead, -1);
    const layLeft: Lay = prepareLaid(
      body,
      "left",
      "palm",
      shoulders.left,
      elbows.left,
      "relaxed",
    );
    const layRight: Lay = prepareLaid(
      body,
      "right",
      "palm",
      shoulders.right,
      elbows.right,
      "relaxed",
    );
    const at: (y: number) => IFrontAt = (y: number): IFrontAtResult =>
      trunk.surface(
        {
          ...ray,
          y,
        },
        inward,
      );
    const goals: (
      y: number,
    ) => Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal> = (
      y: number,
    ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal> => {
      const place: IFrontGoalsPlace = at(y);
      const left: IAutoMovieMotionHumanRest.IGoal = layLeft(
        place.point,
        place.normal,
      );
      return {
        left,
        right: stacked(body, left, "handBack", layRight),
      };
    };
    // How far the farther of the two wrists lies beyond its arm's reach at
    // the comfortable flexion, metres.
    const comfortable: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => {
      const upper: number = segment(body, side, "UpperArm", "LowerArm");
      const lower: number = segment(body, side, "LowerArm", "Hand");
      return Math.sqrt(
        upper * upper +
          lower * lower +
          2 * upper * lower * Math.cos((FLEXION * Math.PI) / 180),
      );
    };
    const reaches: Record<AutoMovieHumanSide, number> = {
      left: comfortable("left"),
      right: comfortable("right"),
    };
    const excess: (y: number) => number = (y: number): number => {
      const both: Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal> =
        goals(y);
      let far: number = -Infinity;
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieMotionHumanRest.IGoal = both[side];
        far = Math.max(
          far,
          Vector3.distance(
            HumanHand.place(
              body,
              side,
              goal.surface,
              goal.point,
              goal.rotation,
              goal.shape,
            ).point,
            shoulders[side],
          ) - reaches[side],
        );
      }
      return far;
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
   * left palm, the fingers of both hands extended and joined, as the drill
   * manual's parade rest holds them (TC 3-21.5, as the Army's Fort Jackson
   * drill modules reproduce it: "Keep the fingers of both hands extended and
   * joined, interlocking the thumbs so that the palm of the right hand is
   * outward"). Relaxed, the left fingers curled past the right wrist into the
   * right forearm.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param elbows Each elbow's bend hint, world metres.
   * @returns Both goals.
   * @throws {Error} When the trunk has no back surface at the height.
   */
  export function behind(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    elbows: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal> {
    const trunk: HumanTrunk.IReading = HumanTrunk.prepare(
      body,
      posture,
      FRAMES,
    );
    const ahead: IAutoMovieVector3 = heading(posture);
    const back: IAutoMovieVector3 = trunk.region("lowerBack").point;
    const shoulders: Record<AutoMovieHumanSide, IAutoMovieVector3> =
      joints(trunk);
    const place: HumanTrunk.ISurface = trunk.surface(
      {
        ...Vector3.subtract(back, Vector3.scale(ahead, body.measure.stature)),
        y: back.y - 0.03 * body.measure.stature,
      },
      ahead,
    );
    const layLeft: Lay = prepareLaid(
      body,
      "left",
      "handBack",
      shoulders.left,
      elbows.left,
      "flat",
    );
    const layRight: Lay = prepareLaid(
      body,
      "right",
      "handBack",
      shoulders.right,
      elbows.right,
      "flat",
    );
    const left: IAutoMovieMotionHumanRest.IGoal = layLeft(
      place.point,
      place.normal,
    );
    return {
      left,
      right: stacked(body, left, "palm", layRight),
    };
  }
}

/** The unit direction a posture faces, world frame. */
function heading(posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 {
  return HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
}

/**
 * Both shoulder joints of a posture, world metres: they ride the trunk, not the
 * arm's goal.
 */
function joints(
  trunk: HumanTrunk.IReading,
): Record<AutoMovieHumanSide, IAutoMovieVector3> {
  return {
    left: trunk.bones.get("leftUpperArm")!.worldPosition,
    right: trunk.bones.get("rightUpperArm")!.worldPosition,
  };
}

/** Midline collider and shoulder frames used by one clasp placement search. */
const FRAMES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "jaw",
    "leftUpperArm",
    "rightUpperArm",
  ]);
/** The alternatives of `SegmentTo`'s site. */
type SegmentTo = "LowerArm" | "Hand";

/** The alternatives of `SegmentFrom`'s site. */
type SegmentFrom = "UpperArm" | "LowerArm";

/** A rest length between two joints of an arm, metres. */
function segment(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  from: SegmentFrom,
  to: SegmentTo,
): number {
  return Vector3.distance(
    body.rest.get(`${side}${to}`)!,
    body.rest.get(`${side}${from}`)!,
  );
}

/** The record of `IPrepareLaidFixed`'s site. */
type IPrepareLaidFixed = {
  upper: number;
  lower: number;
  local: IAutoMovieMotionHumanHand.IFrame;
  align: ReturnType<typeof HumanHand.prepareAlignment>;
};

/**
 * A hand surface laid on a surface point in a shape: its normal turned into the
 * surface's outward normal exactly, and the fingers along the forearm as far as
 * that allows. The wrist depends on the fingers and the forearm on the wrist,
 * so the direction starts at the line from the shoulder to the point and is
 * substituted three times. The fixed hand and arm geometry is prepared with the
 * lay and shared across heights.
 */
function prepareLaid(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  surface: IAutoMovieMotionHumanHand.Surface,
  shoulder: IAutoMovieVector3,
  elbow: IAutoMovieVector3,
  shape: IAutoMovieMotionHumanHand.Shape,
): Lay {
  const upper: number = segment(body, side, "UpperArm", "LowerArm");
  const lower: number = segment(body, side, "LowerArm", "Hand");
  const local: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    side,
    surface,
  );
  const hand: IPrepareLaidFixed = {
    upper,
    lower,
    local,
    align: HumanHand.prepareAlignment({
      normal: local.normal,
      forward: { x: side === "left" ? 1 : -1, y: 0, z: 0 },
    }),
  };
  return (
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): IAutoMovieMotionHumanRest.IGoal => {
    const into: IAutoMovieVector3 = Vector3.scale(normal, -1);
    let rotation: IAutoMovieQuaternion = hand.align({
      normal: into,
      forward: restForearm.across(into, Vector3.subtract(point, shoulder)),
    });
    for (let i: number = 0; i < 3; i++)
      rotation = hand.align({
        normal: into,
        forward: restForearm.across(
          into,
          restForearm.direction(
            hand.upper,
            hand.lower,
            shoulder,
            placeHumanHandSurface(hand.local.point, point, rotation).point,
            elbow,
          ),
        ),
      });
    return { surface, shape, point, rotation, elbow };
  };
}

/** Actual world surface inputs of one fixed hand/shoulder configuration. */
type Lay = (
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
) => IAutoMovieMotionHumanRest.IGoal;

/**
 * A hand surface laid on a surface of the left hand as the left hand holds its
 * own goal.
 */
function stacked(
  body: IAutoMovieMotionHumanBody,
  left: IAutoMovieMotionHumanRest.IGoal,
  on: IAutoMovieMotionHumanHand.Surface,
  lay: Lay,
): IAutoMovieMotionHumanRest.IGoal {
  const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
    body,
    "left",
    left.surface,
    left.point,
    left.rotation,
    left.shape,
  );
  const face: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    "left",
    on,
    left.shape,
  );
  return lay(
    Vector3.add(
      wrist.point,
      Quaternion.rotateVector(wrist.rotation, face.point),
    ),
    Quaternion.rotateVector(wrist.rotation, face.normal),
  );
}
