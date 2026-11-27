import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * The prop the entry holds in one hand or both, with an end.
 * Parameter context: The action's context.
 * Parameter prop: The prop's subject id.
 * Parameter end: The end's affordance id.
 * Returns: The pole; undefined when no hand holds it or it declares no such
 * end.
 */
export function walkPoleFrame(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  prop: string,
  end: string,
): walkPoleFrame.IPole | undefined {
  const hands: walkPoleFrame.IHand[] = [];
  let at: IAutoMovieVector3 | undefined;
  for (const side of ["right", "left"] as const) {
    if (context.entry.holds[side] !== prop) continue;
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      side,
      prop,
    );
    const found: IAutoMovieAffordance | undefined = held.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === end,
    );
    if (found === undefined) return undefined;
    at = found.frame.translation;
    // The grip socket in the hand, holding the prop as it entered.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        context.body,
        context.entry.pose,
        undefined,
        HumanHand.frameBones(context.body, side, "grip"),
      );
    const bone: IAutoMovieResolvedBone = entered.get(`${side}Hand`)!;
    // The forearm's way in the hand at the wrist's neutral: the arm at
    // clinical zero.
    const hung: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(
        context.body,
        context.entry.posture,
        {
          ...context.entry.posture.joints,
          [`${side}UpperArm`]: [0, 0, 0],
          [`${side}LowerArm`]: [0, 0, 0],
          [`${side}Hand`]: [0, 0, 0],
        },
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`]),
      );
    const hand: IAutoMovieResolvedBone = hung.get(`${side}Hand`)!;
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      held.frame.rotation,
    );
    hands.push({
      side,
      held: held.frame,
      socket: AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(bone.worldRotation),
        AutoMovieEngineVector3.subtract(
          HumanHand.frame(context.body, entered, side, "grip").point,
          bone.worldPosition,
        ),
      ),
      proximal: AutoMovieEngineVector3.normalize(
        AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(hand.worldRotation),
          AutoMovieEngineVector3.subtract(
            hung.get(`${side}LowerArm`)!.worldPosition,
            hand.worldPosition,
          ),
        ),
      ),
      grip: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.scale(held.frame.position, -1),
      ),
    });
  }
  if (hands.length === 0 || at === undefined) return undefined;
  const tip: IAutoMovieVector3 = at;
  hands.sort(
    (a: walkPoleFrame.IHand, b: walkPoleFrame.IHand): number =>
      AutoMovieEngineVector3.distance(b.grip, tip) - AutoMovieEngineVector3.distance(a.grip, tip),
  );
  const carrying: walkPoleFrame.IHand = hands[0]!;
  const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(tip, carrying.grip),
  );
  return {
    prop,
    hands,
    end: tip,
    axis,
    length: AutoMovieEngineVector3.distance(tip, carrying.grip),
    fulcrum:
      hands.length > 1
        ? AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(hands[1]!.grip, carrying.grip), axis)
        : 0,
  };
}

/*
 * A long prop held in one hand or two, placed by its line: the carrying hand's
 * grip, the prop's axis from that grip to its end, and its roll about that
 * axis. Each hand holds the prop rigidly as it took it
 * (`AutoMovieMotionHumanHeld`), so the prop's frame fixes every holding hand's
 * rotation and grip: a vaulter's top hand and the lower hand a pole's length
 * apart along it.
 *
 * The roll is free, the prop being held round its axis, so it is chosen to keep
 * the arms at their ease: each hand's way from the wrist toward its elbow, as
 * the hand sits on the forearm at the wrist's neutral, turned as near as it
 * goes to the way from the grip to that arm's shoulder, which leaves the elbow
 * between them and the wrist and the forearm twist near their neutral. The roll
 * ψ maximising Σ (R(ψ) v_k) · t_k about the axis a is ψ = atan2(B, A), A = Σ
 * (v_k · t_k − (a · v_k)(a · t_k)), B = Σ (a × v_k) · t_k.
 */
export namespace walkPoleFrame {
  /*
   * A hand holding the prop.
   */
  export interface IHand {
    /*
     * The hand.
     */
    side: AutoMovieHumanSide;

    /*
     * The prop's frame in the hand's grip frame: inverse(hand) times prop, the
     * grip socket its origin.
     */
    held: IAutoMovieRigidTransform;

    /*
     * The grip from the wrist, metres, in the hand bone's axes.
     */
    socket: IAutoMovieVector3;

    /*
     * The unit way from the wrist toward the elbow with the wrist at its
     * neutral, in the hand bone's axes.
     */
    proximal: IAutoMovieVector3;

    /*
     * The hand's grip in the prop's frame, metres.
     */
    grip: IAutoMovieVector3;
  }

  /*
   * A long prop and the hands that hold it.
   */
  export interface IPole {
    /*
     * The prop's subject id.
     */
    prop: string;

    /*
     * The holding hands, the carrying one (the farther from the end) first.
     */
    hands: IHand[];

    /*
     * The end, metres, in the prop's frame.
     */
    end: IAutoMovieVector3;

    /*
     * The unit axis from the carrying hand's grip to the end, in the prop's
     * frame.
     */
    axis: IAutoMovieVector3;

    /*
     * The carrying hand's grip to the end, metres.
     */
    length: number;

    /*
     * How far along the axis the other hand holds from the carrying hand,
     * metres: the fulcrum; 0 with one hand.
     */
    fulcrum: number;
  }

  /*
   * A holding hand's goal.
   */
  export interface IGoal {
    /*
     * The hand.
     */
    side: AutoMovieHumanSide;

    /*
     * The wrist, world metres.
     */
    wrist: IAutoMovieVector3;

    /*
     * The hand's world rotation.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The grip, world metres.
     */
    grip: IAutoMovieVector3;
  }

  /*
   * Each holding hand's goal for the prop placed by its line.
   * Parameter pole: The prop and its hands.
   * Parameter grip: The carrying hand's grip, world metres.
   * Parameter axis: The unit way from that grip to the end, world.
   * Parameter shoulder: Each holding arm's shoulder joint, world metres.
   * Returns: One goal per holding hand, the carrying one first.
   */
  export function place(
    pole: IPole,
    grip: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    shoulder: (side: AutoMovieHumanSide) => IAutoMovieVector3,
  ): IGoal[] {
    const turn: IAutoMovieQuaternion = shortest(pole.axis, axis);
    const carrying: IHand = pole.hands[0]!;
    // The roll about the line that best turns each forearm toward its
    // shoulder.
    let a: number = 0;
    let b: number = 0;
    for (const hand of pole.hands) {
      const v: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        turn,
        AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(hand.held.rotation),
          hand.proximal,
        ),
      );
      const at: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        grip,
        AutoMovieEngineQuaternion.rotateVector(
          turn,
          AutoMovieEngineVector3.subtract(hand.grip, carrying.grip),
        ),
      );
      const t: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
        AutoMovieEngineVector3.subtract(shoulder(hand.side), at),
      );
      a += AutoMovieEngineVector3.dot(v, t) - AutoMovieEngineVector3.dot(axis, v) * AutoMovieEngineVector3.dot(axis, t);
      b += AutoMovieEngineVector3.dot(AutoMovieEngineVector3.cross(axis, v), t);
    }
    const frame: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.fromAxisAngle(axis, (Math.atan2(b, a) * 180) / Math.PI),
        turn,
      ),
    );
    const origin: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      grip,
      AutoMovieEngineQuaternion.rotateVector(frame, carrying.grip),
    );
    return pole.hands.map((hand: IHand): IGoal => {
      const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(frame, AutoMovieEngineQuaternion.inverse(hand.held.rotation)),
      );
      const at: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        origin,
        AutoMovieEngineQuaternion.rotateVector(frame, hand.grip),
      );
      return {
        side: hand.side,
        wrist: AutoMovieEngineVector3.subtract(
          at,
          AutoMovieEngineQuaternion.rotateVector(rotation, hand.socket),
        ),
        rotation,
        grip: at,
      };
    });
  }

  /*
   * The posture with each holding hand's goal: its wrist and rotation, the
   * elbow left to the body where the rotation is met best (`strain`), the
   * hanging hint serving where no place is legal.
   * Parameter posture: The posture.
   * Parameter goals: The holding hands' goals.
   * Parameter bend: Each arm's elbow hint, world metres.
   * Returns: The posture with those goals.
   */
  export function write(
    posture: IAutoMovieMotionHumanPosture,
    goals: readonly IGoal[],
    bend: (side: AutoMovieHumanSide) => IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const goal of goals)
      limbs[`${goal.side}Arm`] = {
        point: goal.wrist,
        rotation: goal.rotation,
        bend: bend(goal.side),
        elbow: "strain",
      };
    return { ...posture, limbs };
  }

  /*
   * The angle between the carrying forearm and the pole's way to its end with
   * the wrist at its neutral, degrees: the power grip's own angle, the pole
   * crossing the palm, read from the carrying hand's hold.
   * Parameter pole: The prop and its hands.
   * Returns: The angle, degrees in [0, 180].
   */
  export function neutral(pole: IPole): number {
    const hand: IHand = pole.hands[0]!;
    const along: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      hand.held.rotation,
      pole.axis,
    );
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(1, -AutoMovieEngineVector3.dot(hand.proximal, AutoMovieEngineVector3.normalize(along))),
        ),
      ) *
        180) /
      Math.PI
    );
  }

  /*
   * A body's power-grip angle before it holds anything: the angle between the
   * forearm, the wrist at its neutral, and the bar a grasp wraps
   * (`HumanGraspHand` lays the grip frame's forward along the bar's wrapped
   * axis), on the bar's side that makes it acute, as a grasp from a bar's
   * declared frame leaves the planted end (`neutral` reads the same angle off a
   * hold).
   * Parameter body: The body.
   * Parameter side: The hand.
   * Returns: The angle, degrees in [0, 90].
   */
  export function power(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): number {
    const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "grip",
      "flat",
    );
    const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(grip.normal);
    const forward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(
        grip.forward,
        AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(grip.forward, normal)),
      ),
    );
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const hung: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(
        body,
        posture,
        {
          [`${side}UpperArm`]: [0, 0, 0],
          [`${side}LowerArm`]: [0, 0, 0],
          [`${side}Hand`]: [0, 0, 0],
        },
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`]),
      );
    const hand: IAutoMovieResolvedBone = hung.get(`${side}Hand`)!;
    const fore: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(hand.worldRotation),
        AutoMovieEngineVector3.subtract(
          hand.worldPosition,
          hung.get(`${side}LowerArm`)!.worldPosition,
        ),
      ),
    );
    const angle: number =
      (Math.acos(Math.max(-1, Math.min(1, AutoMovieEngineVector3.dot(fore, forward)))) * 180) /
      Math.PI;
    return Math.min(angle, 180 - angle);
  }

  /*
   * The straight carrying arm's elevation at a plant, and the grip's height and
   * the pole's elevation it gives: the arm raised so the forearm meets the pole
   * at the grip's neutral angle (`neutral`), the pole running from the grip to
   * its end on the floor ahead. With the grip at height h(e) = s + r·sin e and
   * the pole at −asin(h / ℓ) below the horizontal, the angle between them, e +
   * asin(h(e) / ℓ), rises with e, so it meets the neutral angle at one
   * elevation, found by bisection on that monotone function, no higher than
   * lets the pole lean `lean` from upright.
   * Parameter shoulder: The carrying shoulder's height above the floor, metres.
   * Parameter reach: The carrying arm's shoulder-to-wrist length, metres.
   * Parameter length: The carrying grip's distance from the pole's end, metres.
   * Parameter neutral: The grip's neutral angle, degrees (`neutral`).
   * Parameter lean: The pole's least lean from upright, degrees.
   * Returns: The plant; undefined when the pole is too short to reach the floor
   * from the lowest grip.
   */
  export function plant(
    shoulder: number,
    reach: number,
    length: number,
    neutral: number,
    lean: number,
  ): IPlant | undefined {
    const top: number =
      (length * Math.cos((lean * Math.PI) / 180) - shoulder) / reach;
    if (top < -1) return undefined;
    const angle = (e: number): number =>
      e + Math.asin(Math.min(1, (shoulder + reach * Math.sin(e)) / length));
    const want: number = (neutral * Math.PI) / 180;
    let low: number = -Math.PI / 2;
    let high: number = Math.asin(Math.min(1, top));
    if (angle(high) <= want) low = high;
    else if (angle(low) < want)
      for (let k: number = 0; k < SPLITS; k++) {
        const middle: number = (low + high) / 2;
        if (angle(middle) < want) low = middle;
        else high = middle;
      }
    const grip: number = shoulder + reach * Math.sin(low);
    return {
      arm: (low * 180) / Math.PI,
      high: grip,
      pole: (-Math.asin(Math.min(1, grip / length)) * 180) / Math.PI,
    };
  }

  /*
   * A plant's straight carrying arm.
   */
  export interface IPlant {
    /*
     * The arm's elevation above the horizontal ahead, degrees.
     */
    arm: number;

    /*
     * The grip's height above the floor, metres.
     */
    high: number;

    /*
     * The pole's elevation from the grip to its end, degrees, below the
     * horizontal.
     */
    pole: number;
  }

  /*
   * The halvings the plant's bisection takes: a half turn to a millionth of a
   * degree.
   */
  const SPLITS: number = 28;

  /*
   * The shortest turn carrying one unit direction onto another.
   */
  function shortest(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.cross(from, to);
    return AutoMovieEngineVector3.length(axis) < 1e-9
      ? AutoMovieEngineQuaternion.identity()
      : AutoMovieEngineQuaternion.fromAxisAngle(
          axis,
          (Math.acos(Math.max(-1, Math.min(1, AutoMovieEngineVector3.dot(from, to)))) * 180) /
            Math.PI,
        );
  }
}

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "body" | "entry" | "prop";
