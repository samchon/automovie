import { Quaternion, Vector3 } from "@automovie/engine";
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

/** The alternatives of `OfContext`'s site. */
type OfContext = "body" | "entry" | "prop";

/**
 * The prop the entry holds in one hand or both, with an end.
 *
 * @param context The action's context.
 * @param prop The prop's subject id.
 * @param end The end's affordance id.
 * @returns The pole; undefined when no hand holds it or it declares no such
 *   end.
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
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      held.frame.rotation,
    );
    hands.push({
      side,
      held: held.frame,
      socket: Quaternion.rotateVector(
        Quaternion.inverse(bone.worldRotation),
        Vector3.subtract(
          HumanHand.frame(context.body, entered, side, "grip").point,
          bone.worldPosition,
        ),
      ),
      proximal: Vector3.normalize(
        Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            hung.get(`${side}LowerArm`)!.worldPosition,
            hand.worldPosition,
          ),
        ),
      ),
      grip: Quaternion.rotateVector(
        inverse,
        Vector3.scale(held.frame.position, -1),
      ),
    });
  }
  if (hands.length === 0 || at === undefined) return undefined;
  const tip: IAutoMovieVector3 = at;
  hands.sort(
    (a: walkPoleFrame.IHand, b: walkPoleFrame.IHand): number =>
      Vector3.distance(b.grip, tip) - Vector3.distance(a.grip, tip),
  );
  const carrying: walkPoleFrame.IHand = hands[0]!;
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(tip, carrying.grip),
  );
  return {
    prop,
    hands,
    end: tip,
    axis,
    length: Vector3.distance(tip, carrying.grip),
    fulcrum:
      hands.length > 1
        ? Vector3.dot(Vector3.subtract(hands[1]!.grip, carrying.grip), axis)
        : 0,
  };
}

/**
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
  /** A hand holding the prop. */
  export interface IHand {
    /** The hand. */
    side: AutoMovieHumanSide;

    /**
     * The prop's frame in the hand's grip frame: inverse(hand) times prop, the
     * grip socket its origin.
     */
    held: IAutoMovieRigidTransform;

    /** The grip from the wrist, metres, in the hand bone's axes. */
    socket: IAutoMovieVector3;

    /**
     * The unit way from the wrist toward the elbow with the wrist at its
     * neutral, in the hand bone's axes.
     */
    proximal: IAutoMovieVector3;

    /** The hand's grip in the prop's frame, metres. */
    grip: IAutoMovieVector3;
  }

  /** A long prop and the hands that hold it. */
  export interface IPole {
    /** The prop's subject id. */
    prop: string;

    /** The holding hands, the carrying one (the farther from the end) first. */
    hands: IHand[];

    /** The end, metres, in the prop's frame. */
    end: IAutoMovieVector3;

    /**
     * The unit axis from the carrying hand's grip to the end, in the prop's
     * frame.
     */
    axis: IAutoMovieVector3;

    /** The carrying hand's grip to the end, metres. */
    length: number;

    /**
     * How far along the axis the other hand holds from the carrying hand,
     * metres: the fulcrum; 0 with one hand.
     */
    fulcrum: number;
  }

  /** A holding hand's goal. */
  export interface IGoal {
    /** The hand. */
    side: AutoMovieHumanSide;

    /** The wrist, world metres. */
    wrist: IAutoMovieVector3;

    /** The hand's world rotation. */
    rotation: IAutoMovieQuaternion;

    /** The grip, world metres. */
    grip: IAutoMovieVector3;
  }

  /**
   * Each holding hand's goal for the prop placed by its line.
   *
   * @param pole The prop and its hands.
   * @param grip The carrying hand's grip, world metres.
   * @param axis The unit way from that grip to the end, world.
   * @param shoulder Each holding arm's shoulder joint, world metres.
   * @returns One goal per holding hand, the carrying one first.
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
      const v: IAutoMovieVector3 = Quaternion.rotateVector(
        turn,
        Quaternion.rotateVector(
          Quaternion.inverse(hand.held.rotation),
          hand.proximal,
        ),
      );
      const at: IAutoMovieVector3 = Vector3.add(
        grip,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(hand.grip, carrying.grip),
        ),
      );
      const t: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(shoulder(hand.side), at),
      );
      a += Vector3.dot(v, t) - Vector3.dot(axis, v) * Vector3.dot(axis, t);
      b += Vector3.dot(Vector3.cross(axis, v), t);
    }
    const frame: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(axis, (Math.atan2(b, a) * 180) / Math.PI),
        turn,
      ),
    );
    const origin: IAutoMovieVector3 = Vector3.subtract(
      grip,
      Quaternion.rotateVector(frame, carrying.grip),
    );
    return pole.hands.map((hand: IHand): IGoal => {
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(frame, Quaternion.inverse(hand.held.rotation)),
      );
      const at: IAutoMovieVector3 = Vector3.add(
        origin,
        Quaternion.rotateVector(frame, hand.grip),
      );
      return {
        side: hand.side,
        wrist: Vector3.subtract(
          at,
          Quaternion.rotateVector(rotation, hand.socket),
        ),
        rotation,
        grip: at,
      };
    });
  }

  /**
   * The posture with each holding hand's goal: its wrist and rotation, the
   * elbow left to the body where the rotation is met best (`strain`), the
   * hanging hint serving where no place is legal.
   *
   * @param posture The posture.
   * @param goals The holding hands' goals.
   * @param bend Each arm's elbow hint, world metres.
   * @returns The posture with those goals.
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

  /**
   * The angle between the carrying forearm and the pole's way to its end with
   * the wrist at its neutral, degrees: the power grip's own angle, the pole
   * crossing the palm, read from the carrying hand's hold.
   *
   * @param pole The prop and its hands.
   * @returns The angle, degrees in [0, 180].
   */
  export function neutral(pole: IPole): number {
    const hand: IHand = pole.hands[0]!;
    const along: IAutoMovieVector3 = Quaternion.rotateVector(
      hand.held.rotation,
      pole.axis,
    );
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(1, -Vector3.dot(hand.proximal, Vector3.normalize(along))),
        ),
      ) *
        180) /
      Math.PI
    );
  }

  /**
   * A body's power-grip angle before it holds anything: the angle between the
   * forearm, the wrist at its neutral, and the bar a grasp wraps
   * (`HumanGraspHand` lays the grip frame's forward along the bar's wrapped
   * axis), on the bar's side that makes it acute, as a grasp from a bar's
   * declared frame leaves the planted end (`neutral` reads the same angle off a
   * hold).
   *
   * @param body The body.
   * @param side The hand.
   * @returns The angle, degrees in [0, 90].
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
    const normal: IAutoMovieVector3 = Vector3.normalize(grip.normal);
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        grip.forward,
        Vector3.scale(normal, Vector3.dot(grip.forward, normal)),
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
    const fore: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(
          hand.worldPosition,
          hung.get(`${side}LowerArm`)!.worldPosition,
        ),
      ),
    );
    const angle: number =
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(fore, forward)))) * 180) /
      Math.PI;
    return Math.min(angle, 180 - angle);
  }

  /**
   * The straight carrying arm's elevation at a plant, and the grip's height and
   * the pole's elevation it gives: the arm raised so the forearm meets the pole
   * at the grip's neutral angle (`neutral`), the pole running from the grip to
   * its end on the floor ahead. With the grip at height h(e) = s + r·sin e and
   * the pole at −asin(h / ℓ) below the horizontal, the angle between them, e +
   * asin(h(e) / ℓ), rises with e, so it meets the neutral angle at one
   * elevation, found by bisection on that monotone function, no higher than
   * lets the pole lean `lean` from upright.
   *
   * @param shoulder The carrying shoulder's height above the floor, metres.
   * @param reach The carrying arm's shoulder-to-wrist length, metres.
   * @param length The carrying grip's distance from the pole's end, metres.
   * @param neutral The grip's neutral angle, degrees (`neutral`).
   * @param lean The pole's least lean from upright, degrees.
   * @returns The plant; undefined when the pole is too short to reach the floor
   *   from the lowest grip.
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

  /** A plant's straight carrying arm. */
  export interface IPlant {
    /** The arm's elevation above the horizontal ahead, degrees. */
    arm: number;

    /** The grip's height above the floor, metres. */
    high: number;

    /**
     * The pole's elevation from the grip to its end, degrees, below the
     * horizontal.
     */
    pole: number;
  }

  /**
   * The halvings the plant's bisection takes: a half turn to a millionth of a
   * degree.
   */
  const SPLITS: number = 28;

  /** The shortest turn carrying one unit direction onto another. */
  function shortest(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const axis: IAutoMovieVector3 = Vector3.cross(from, to);
    return Vector3.length(axis) < 1e-9
      ? Quaternion.identity()
      : Quaternion.fromAxisAngle(
          axis,
          (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(from, to)))) * 180) /
            Math.PI,
        );
  }
}
