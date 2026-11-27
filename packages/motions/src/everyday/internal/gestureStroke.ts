import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanTrunk } from "./HumanTrunk";
import { gestureJoints } from "./gestureJoints";
import { gestureStrokeTables } from "./gestureStrokeTables";
import { gestureStrokeUpright } from "./gestureStrokeUpright";
import { gestureTouch } from "./gestureTouch";

/*
 * The stroke of each gesture: where each hand surface goes, turned which way
 * and in which shape, as a function of the stroke's progress, and which joints
 * a gesture moves directly.
 *
 * Hand gestures are effector goals. Each names a hand surface, a world point
 * and a hand rotation; the gesture law transports the hand there in the
 * preparation phase and back in the retraction, and the arm is solved by
 * inverse kinematics (HumanHand). Points are built in the performer's
 * own frame (`x` left, `y` up, `z` forward from the root) from the body's
 * measure, or on a target or on the body's own face, so every gesture fits any
 * stature and proportion. A place of the air is written in the names of
 * AutoMovieMotionHumanTargetGrid.Place (a height, a lateral and a
 * distance, with a nudge in arm lengths where the stroke moves about it), a
 * hand's turn in the axes of HumanHand.Direction, and a joint angle as a
 * level of AutoMovieMotionHumanRange:
 *
 * - `wave`: the open palm faces forward beside the head, at eye height, outside
 *   the shoulder and near; the hand swings side to side `0.06` arm lengths,
 *   tilting as the forearm turns about the elbow, about 2.5 cycles a second
 *   (provisional).
 * - `raiseHand`: the open palm forward, raised from the shoulder to overhead by
 *   the extent; `cheer` raises both fists and pumps them `0.08` arm lengths.
 * - `stopPalm`: the open palm faces forward at shoulder height, inside the
 *   shoulder and far, pushed `0.05` arm lengths further in the stroke.
 * - `point`: the index fingertip on the line from the eye on the pointing side to
 *   the target, as people point (Henriques and Crawford 2002, J Neurophysiol
 *   87:1677, found the fingertip placed on the line from the dominant eye; the
 *   side's eye is the provisional choice), at the distance where the arm
 *   reaches with `0.95` of its length, the fingers along the line and the palm
 *   down.
 * - `palmsUp`: both open palms up, forearms forward at the waist, turned a
 *   quarter of the way out, set `0.15` arm lengths out and forward and lifted
 *   `0.03` in the stroke, the offering and not-knowing gesture; `shrug` adds it
 *   under raised shoulders.
 * - `beckon`: the palm up at chest height, `0.05` arm lengths lower and nearer,
 *   while the fingers curl and open, about 1.7 cycles a second (provisional).
 * - `clap`: both palms face each other ahead of the chest, `0.1` arm lengths
 *   below and `0.17` ahead of its place, part `0.09` and meet at the midpoint
 *   on each beat, four beats a second (free applause clusters near 4 Hz, faster
 *   than the near-2 Hz synchronised rhythm, Neda et al. 2000, Nature 403:849).
 * - `thumbsDown`: the fist ahead of the chest, the palm outward and the knuckles
 *   ahead and 45 degrees down, so a straight thumb, which leans toward the
 *   knuckles, points down; the elbow is asked out at the shoulder's height,
 *   which leaves the forearm a quarter turn instead of a half (provisional
 *   place, tip and elbow).
 * - `rubHands`: the palms together, sliding `0.03` arm lengths opposite ways
 *   along the fingers.
 * - `palmsTogether`: the palms pressed together ahead of the chest, the fingers
 *   up and forward, held: the clap's hand pose without its parting (a prayer, a
 *   wai or gassho greeting).
 * - `touchFace`: the index fingertip, hand flat, on a face region with the palm
 *   toward the face and the fingers up, held; `pushGlasses` slides it 12 mm up
 *   the nose bridge; `scratchHead` rubs it 15 mm on the head's side four times
 *   a second (provisional).
 *
 * Gestures of the head, shoulders and trunk are joint angles, stated by
 * gestureJoints; pointing and self-touch read the posed trunk in
 * gestureTouch; the strokes ride the signals of gestureSignal.
 * Amplitudes and distances that express the gesture's size scale with the
 * Effort extent; contact points and the pointing line do not. Each hand goal
 * widens the elbow's hanging hint by its own share of the upper arm (`out`: 0.3
 * for a wave, 0.2 for a raised hand, a cheer and open palms, 0.1 for palms
 * together, none for the rest; provisional, read from no measured source).
 * Every value above without a source is provisional.
 */
export namespace gestureStroke {
  /*
   * The interface stroke input with the gesture's prepared touch geometry. The
   * record (`gestureTouch.IPrepared`) holds motions' own readers, so it extends
   * the dependency-free contract here instead of entering it.
   */
  export interface IInput extends IAutoMovieMotionHumanGestureStroke.IInput {
    /*
     * The plan's touch geometry for this hand, when the gesture prepared it; a
     * stroke read without it computes the geometry itself.
     */
    prepared?: gestureTouch.IPrepared;

    /*
     * The bend of the trunk the gesture was entered on, read once per plan
     * (`bend`); a straight trunk when absent.
     */
    bend?: gestureStroke.IBend;
  }

  /*
   * Each gesture's timing (`gestureStrokeTables.RHYTHM`), read here with its
   * kind.
   */
  export const RHYTHM: typeof gestureStrokeTables.RHYTHM =
    gestureStrokeTables.RHYTHM;

  /*
   * Which hands each gesture moves (`gestureStrokeTables.HANDS`), read here
   * with its kind.
   */
  export const HANDS: typeof gestureStrokeTables.HANDS =
    gestureStrokeTables.HANDS;

  /*
   * Extra finger flexion of a stroke, independent of its world hand goal. Only
   * beckoning adds this curl; all other strokes keep their named shape.
   * Parameter kind: The gesture's closed kind.
   * Parameter u: Its stroke share in [0, 1].
   * Parameter cycles: Its repetition count.
   * Parameter extent: The fixed effort amplitude multiplier.
   * Returns: Extra flexion, degrees, before the transport envelope.
   */
  export function curl(
    kind: IAutoMovieMotionHumanGestureStroke.Kind,
    u: number,
    cycles: number,
    extent: number,
  ): number {
    return kind === "beckon"
      ? gestureJoints.ANGLES.beckon *
          extent *
          (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u))
      : 0;
  }
  /*
   * A hand's goal at a share of the stroke.
   * Parameter kind: The gesture.
   * Parameter side: The hand.
   * Parameter u: Stroke share in [0, 1]; 0 is the goal the preparation reaches.
   * Parameter cycles: Stroke cycles.
   * Parameter input: The instant's inputs.
   * Returns: The goal.
   * For a gesture that moves no hand, or `point` without a
   * target.
   */
  export function hand(
    kind: IAutoMovieMotionHumanGestureStroke.Kind,
    side: AutoMovieHumanSide,
    u: number,
    cycles: number,
    input: gestureStroke.IInput,
  ): IAutoMovieMotionHumanGestureStroke.IHand {
    const goal: IAutoMovieMotionHumanGestureStroke.IHand = gestureStrokeUpright(
      kind,
      side,
      u,
      cycles,
      input,
    );
    // A place of the air is named in the body's heading frame; a body not
    // upright carries it with its upper trunk. A tilt of the whole posture
    // (a prone swimmer, a leaning rider) turns the goal about the root by the
    // posture's pitch and roll beyond its heading, read at every instant from
    // the posture alone. A bend of the spine (a trunk bent over a hand that
    // bears) moves the chest off the tilted trunk too, where the bent trunk
    // brought the head into the place (a wave over a braced hand, the head
    // 5.8 mm inside the waving hand): that bend is measured once per plan, on
    // the posture the gesture is entered on (`bend`), and carried in the
    // heading frame. Pointing and self-touch already read the posed trunk.
    if (TRUNK_POSED.has(kind)) return goal;
    const heading: IAutoMovieQuaternion = humanPostureHeading(input.base);
    const tilt: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      heading,
      AutoMovieEngineQuaternion.inverse(HumanFrame.turn(input.base.yaw)),
    );
    const bent: gestureStroke.IBend | undefined = input.bend;
    if (
      AutoMovieEngineQuaternion.angle(tilt, AutoMovieEngineQuaternion.identity()) < 1e-9 &&
      bent === undefined
    )
      return goal;
    const root: IAutoMovieVector3 = input.base.root;
    let point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      root,
      AutoMovieEngineQuaternion.rotateVector(tilt, AutoMovieEngineVector3.subtract(goal.point, root)),
    );
    let rotation: IAutoMovieQuaternion | undefined =
      goal.rotation === undefined
        ? undefined
        : AutoMovieEngineQuaternion.multiply(tilt, goal.rotation);
    if (bent !== undefined) {
      const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(heading),
        AutoMovieEngineVector3.subtract(point, root),
      );
      point = AutoMovieEngineVector3.add(
        root,
        AutoMovieEngineQuaternion.rotateVector(
          heading,
          AutoMovieEngineVector3.add(
            bent.to,
            AutoMovieEngineQuaternion.rotateVector(
              bent.rotation,
              AutoMovieEngineVector3.subtract(local, bent.from),
            ),
          ),
        ),
      );
      if (rotation !== undefined)
        rotation = AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.multiply(
            AutoMovieEngineQuaternion.multiply(heading, bent.rotation),
            AutoMovieEngineQuaternion.inverse(heading),
          ),
          rotation,
        );
    }
    return {
      ...goal,
      point,
      ...(rotation === undefined ? {} : { rotation }),
    };
  }

  /*
   * The bend of a posture's spine from a reference trunk, in the posture's
   * heading frame about its root. Read once on the gesture's entry.
   * Parameter body: The body.
   * Parameter posture: The posture.
   * Parameter reference: Trunk joints defining the gesture's neutral placement.
   * Each omitted joint is straight.
   * Returns: The bend, or none for a straight trunk.
   */
  export function bend(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    reference: IAutoMovieMotionHumanPosture["joints"] = STRAIGHT,
  ): gestureStroke.IBend | undefined {
    const posed: IAutoMovieResolvedBone = HumanTrunk.resolve(
      body,
      posture,
      undefined,
      undefined,
      HumanBoneGroups.CHEST,
    ).get("chest")!;
    const straight: IAutoMovieResolvedBone = HumanTrunk.resolve(
      body,
      posture,
      {
        ...posture.joints,
        hips: reference.hips ?? STRAIGHT.hips,
        spine: reference.spine ?? STRAIGHT.spine,
        chest: reference.chest ?? STRAIGHT.chest,
      },
      undefined,
      HumanBoneGroups.CHEST,
    ).get("chest")!;
    const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      posed.worldRotation,
      AutoMovieEngineQuaternion.inverse(straight.worldRotation),
    );
    if (
      AutoMovieEngineQuaternion.angle(turn, AutoMovieEngineQuaternion.identity()) < 1e-9 &&
      AutoMovieEngineVector3.distance(posed.worldPosition, straight.worldPosition) < 1e-9
    )
      return undefined;
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      humanPostureHeading(posture),
    );
    const heading: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(inverse);
    return {
      rotation: AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.multiply(inverse, turn),
        heading,
      ),
      from: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(straight.worldPosition, posture.root),
      ),
      to: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(posed.worldPosition, posture.root),
      ),
    };
  }

  /*
   * A spine's bend in the heading frame about the root (`bend`).
   */
  export interface IBend {
    /*
     * The chest's turn off the straight trunk.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The straight trunk's chest.
     */
    from: IAutoMovieVector3;

    /*
     * The posed chest.
     */
    to: IAutoMovieVector3;
  }

  /*
   * The trunk's joints of a body standing straight.
   */
  const STRAIGHT = {
    hips: [0, 0, 0],
    spine: [0, 0, 0],
    chest: [0, 0, 0],
  } as const satisfies IAutoMovieMotionHumanPosture["joints"];

  /*
   * The gesture kinds whose hand goals read the posed trunk already.
   */
  const TRUNK_POSED: ReadonlySet<IAutoMovieMotionHumanGestureStroke.Kind> =
    new Set<IAutoMovieMotionHumanGestureStroke.Kind>([
      "point",
      "touchFace",
      "pushGlasses",
      "scratchHead",
    ]);
}
