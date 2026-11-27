import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanHand } from "../../posture/internal/HumanHand";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanSurfaceBoard } from "./HumanSurfaceBoard";
import type { prepareSurfboardPhrase } from "./prepareSurfboardPhrase";

/**
 * The posture of a staged surfboard phrase (`prepareSurfboardPhrase`) at a
 * second: the mount from the water entry onto the prone deck, the paddle
 * outside the rails, the palms' brace and press, the pelvis tucked under the
 * braced chest, and the stand into the side stance on the feet, each carried by
 * the board's frame. Read from the phrase's body, board, phase shares, entry
 * and prone references.
 *
 * @param scope What the phrase stages its posture from.
 * @returns The posture at a second.
 */
export function prepareSurfboardPosture(
  scope: prepareSurfboardPosture.IScope,
): (seconds: number) => IAutoMovieMotionHumanPosture {
  const {
    body,
    board,
    duration,
    at,
    phases,
    lead,
    firstFoot,
    start,
    pronePose,
    proneBones,
    proneHeight,
    inverseProne,
    entryHip,
    entryJoints,
    hips,
    leg,
    prone,
    front,
    rear,
    stanceMid,
    palms,
    SIDES,
  }: prepareSurfboardPosture.IScope = scope;
  return (seconds: number): IAutoMovieMotionHumanPosture => {
    const share: number = Math.max(0, Math.min(1, seconds / duration));
    if (share === 0) return start;
    const frame: IAutoMovieRigidTransform = at(share);
    const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanSurfaceBoard.world(frame, point);
    const fade = (from: number, to: number): number =>
      HumanSurfaceBoard.ease(share, from, to);
    const mount: number = fade(0, phases.mount);
    const brace: number = fade(phases.paddleEnd, phases.palms);
    const press: number = fade(phases.palms, phases.release);
    const standUp: number = fade(phases.release, phases.settle);
    const pitchUp: number = fade(phases.release, phases.feet);
    const frontFacing: number = HumanSurfaceBoard.heading(frame.rotation) + 180;
    const stanceSide: number = lead === "left" ? -1 : 1;
    const stanceTurn: number = stanceSide * STANCE_TURN;
    const yaw: number =
      start.yaw + mount * wrap(frontFacing - start.yaw) + standUp * stanceTurn;
    // Turn the pelvis under the braced chest so the lead knee can fold
    // without driving the sole through the deck. Unfold both after release.
    const tuck: number = press * (1 - pitchUp);
    const pitch: number =
      start.pitch +
      (pronePose.pitch - start.pitch) * mount -
      PRESS_PITCH * press -
      PRESS_PITCH * pitchUp -
      TUCK_PITCH * tuck;
    const torso: TorsoAngles = { yaw, pitch, roll: 0 };
    const bodyRotation: IAutoMovieQuaternion = humanPostureHeading(torso);
    // Keep the shoulders in reach while the palms bear. Centre between the
    // new foot targets before rising over both soles.
    const balance: number = fade(phases.palms, firstFoot);
    const supportCentre: IAutoMovieVector3 = Vector3.lerp(
      prone,
      stanceMid,
      balance,
    );
    const bodyHeight: number =
      proneHeight +
      (BRACE_RISE * brace +
        PRESS_RISE * press +
        TUCK_RISE * tuck +
        STAND_RISE * standUp) *
        leg;
    const hip: IAutoMovieVector3 = Vector3.lerp(
      entryHip,
      world({ ...supportCentre, y: supportCentre.y + bodyHeight }),
      mount,
    );
    const root: IAutoMovieVector3 = Vector3.subtract(
      hip,
      Quaternion.rotateVector(bodyRotation, hips),
    );
    const carry: IAutoMovieQuaternion = Quaternion.multiply(
      bodyRotation,
      inverseProne,
    );
    const fromProne = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(root, Quaternion.rotateVector(carry, point));
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of entryJoints) {
      const from: readonly [number, number, number] = start.joints[bone] ?? [
        0, 0, 0,
      ];
      const to: readonly [number, number, number] = pronePose.joints[bone] ?? [
        0, 0, 0,
      ];
      joints[bone] = [
        from[0] + mount * (to[0] - from[0]),
        from[1] + mount * (to[1] - from[1]),
        from[2] + mount * (to[2] - from[2]),
      ];
    }
    // Bend the trunk toward the boardside grip while freeing the hips to
    // swing the lead leg under the body.
    const spine: readonly [number, number, number] = joints.spine ?? [0, 0, 0];
    joints.spine = [spine[0] + TUCK_SPINE * tuck, spine[1], spine[2]];
    const rest: IAutoMovieMotionHumanPosture = {
      root,
      ...torso,
      joints,
      limbs: {},
    };
    const goals: Partial<
      Record<AutoMovieHumanSide, Omit<IAutoMovieHumanLimbGoal, "bend">>
    > = {};
    const swing: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
    for (const side of SIDES) {
      const site: IAutoMovieVector3 = side === lead ? front : rear;
      const acquired: number = side === lead ? firstFoot : phases.feet;
      const raise: number = fade(phases.palms, acquired);
      swing[side] = raise;
      if (raise === 0) continue;
      const heading: number =
        180 + stanceSide * (side === lead ? LEAD_FOOT_TURN : TRAIL_FOOT_TURN);
      const settledRotation: IAutoMovieQuaternion = Quaternion.multiply(
        frame.rotation,
        HumanFoot.rotation(heading, 0),
      );
      const ankle: IAutoMovieResolvedBone = proneBones.get(`${side}Foot`)!;
      const free: IAutoMovieVector3 = fromProne(
        HumanFoot.point(body, side, "sole", {
          ankle: ankle.worldPosition,
          rotation: ankle.worldRotation,
        }),
      );
      const reach: IAutoMovieVector3 = Vector3.lerp(free, world(site), raise);
      goals[side] = HumanSurfaceBoard.ankle(
        body,
        side,
        reach,
        Quaternion.slerp(
          Quaternion.multiply(carry, ankle.worldRotation),
          settledRotation,
          raise,
        ),
        share >= acquired,
      );
    }
    const ankles: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: goals.left?.point ?? hip,
      right: goals.right?.point ?? hip,
    };
    const legs: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(
      body,
      root,
      yaw,
      ankles,
    );
    for (const side of SIDES) {
      const limb: AutoMovieHumanLimb = side === "left" ? "leftLeg" : "rightLeg";
      const goal: Omit<IAutoMovieHumanLimbGoal, "bend"> | undefined =
        goals[side];
      if (goal !== undefined)
        rest.limbs[limb] = {
          ...goal,
          bend: Vector3.lerp(
            fromProne(proneBones.get(`${side}LowerLeg`)!.worldPosition),
            legs[limb]!.bend,
            swing[side],
          ),
        };

      // A paddle lies outside the rail in the water. Palms then transfer
      // onto material sites and recover away from them after their release.
      if (share <= phases.mount) continue;
      const palm: IAutoMovieVector3 = palms[side];
      const outward: number = side === "left" ? -1 : 1;
      const phase: number =
        2 * Math.PI * ((share - phases.mount) / (phases.palms - phases.mount)) +
        (side === "left" ? 0 : Math.PI);
      const paddle: number = Math.sin(
        Math.PI * fade(phases.mount, phases.palms),
      );
      const lift: number = fade(phases.release, phases.settle);
      const p: IAutoMovieVector3 = world({
        x:
          palm.x +
          outward *
            (paddle * board.width * PADDLE_REACH +
              lift * body.measure.upperArm * RECOVER_SPREAD),
        y:
          palm.y +
          PADDLE_DIP * paddle * Math.cos(phase) +
          lift * RECOVER_RISE * leg,
        z:
          palm.z +
          PADDLE_STROKE * leg * paddle * Math.sin(phase) +
          RECOVER_FORWARD * lift * leg,
      });
      const palmNormal: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        { x: 0, y: -1, z: 0 },
      );
      const palmForward: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        { x: 0, y: 0, z: -1 },
      );
      const wrist: ReturnType<typeof HumanHand.reach> = HumanHand.reach(
        body,
        side,
        "palm",
        { point: p, normal: palmNormal, forward: palmForward },
        "flat",
      );
      const arm: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
      const proneWrist: IAutoMovieResolvedBone = proneBones.get(`${side}Hand`)!;
      const paddleStart: number = fade(
        phases.mount,
        (phases.mount + phases.palms) / 2,
      );
      rest.limbs[arm] = {
        point: Vector3.lerp(
          fromProne(proneWrist.worldPosition),
          wrist.point,
          paddleStart,
        ),
        rotation: Quaternion.slerp(
          Quaternion.multiply(carry, proneWrist.worldRotation),
          wrist.rotation,
          paddleStart,
        ),
        bend: Vector3.lerp(
          fromProne(proneBones.get(`${side}LowerArm`)!.worldPosition),
          world({
            ...palm,
            x: palm.x + outward * body.measure.upperArm,
            y: palm.y + body.measure.upperArm,
            z: palm.z + body.measure.upperArm,
          }),
          paddleStart,
        ),
        contact: HumanHand.offset(body, side, "palm", "flat").point,
        planted: share >= phases.palms && share <= phases.release,
      };
    }
    return rest;
  };
}

/** What the posture of a staged surfboard phrase reads. */
export namespace prepareSurfboardPosture {
  /** What a surfboard phrase stages its posture from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The board's deck. */
    board: HumanSurfaceBoard.IDeck;

    /** The phrase's seconds. */
    duration: number;

    /**
     * The board's frame at a share of the phrase.
     *
     * @param share The share.
     * @returns The frame.
     */
    at: (share: number) => IAutoMovieRigidTransform;

    /** The phase shares (`prepareSurfboardPhrase.SHARES`). */
    phases: typeof prepareSurfboardPhrase.SHARES;

    /** The lead foot. */
    lead: AutoMovieHumanSide;

    /** The share the first foot takes the deck at. */
    firstFoot: number;

    /** The entry posture. */
    start: IAutoMovieMotionHumanPosture;

    /** The prone paddling posture. */
    pronePose: IAutoMovieMotionHumanPosture;

    /** The prone posture's bones. */
    proneBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The prone hips' height over the sternum, metres. */
    proneHeight: number;

    /** The inverse of the prone heading. */
    inverseProne: IAutoMovieQuaternion;

    /** The entry hips, world metres. */
    entryHip: IAutoMovieVector3;

    /** The joints the mount blends. */
    entryJoints: readonly AutoMovieHumanoidBone[];

    /** The rest hips' offset from the root. */
    hips: IAutoMovieVector3;

    /** The leg's length, metres. */
    leg: number;

    /** The prone site on the deck. */
    prone: IAutoMovieVector3;

    /** The front stance site on the deck. */
    front: IAutoMovieVector3;

    /** The rear stance site on the deck. */
    rear: IAutoMovieVector3;

    /** The middle of the stance sites. */
    stanceMid: IAutoMovieVector3;

    /** Each palm's site on the deck. */
    palms: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /** The two sides, fitted independently. */
    SIDES: readonly AutoMovieHumanSide[];
  }
}
/** The alternatives of `TorsoAngles2`'s site. */
type TorsoAngles2 = "yaw" | "pitch" | "roll";

/** The whole-body heading, pitch and roll of a staged surf posture, degrees. */
type TorsoAngles = Pick<IAutoMovieMotionHumanPosture, TorsoAngles2>;

// The staging coefficients below are provisional. The cited study orders
// the palm and foot supports but measures no posture angles or heights, so
// each value is an authored staging choice that the board-sport test
// bounds through its support and clearance checks, not a measurement.

/**
 * Turn of the standing body from the nose into the side stance, degrees
 * (provisional).
 */
const STANCE_TURN: number = 52;

/**
 * Trunk pitch removed as the palms press, and again as the feet take the deck,
 * degrees (provisional).
 */
const PRESS_PITCH: number = 38;

/**
 * Further pitch removed while the pelvis tucks under the braced chest, degrees
 * (provisional).
 */
const TUCK_PITCH: number = 48;

/** Spine flexion added at the full tuck, degrees (provisional). */
const TUCK_SPINE: number = 75;

/**
 * Hip rise over the prone height at the full brace, in leg lengths
 * (provisional).
 */
const BRACE_RISE: number = 0.07;

/** Hip rise at the full palm press, in leg lengths (provisional). */
const PRESS_RISE: number = 0.16;

/** Hip rise at the full tuck, in leg lengths (provisional). */
const TUCK_RISE: number = 0.08;

/** Hip rise when standing on the deck, in leg lengths (provisional). */
const STAND_RISE: number = 0.45;

/**
 * Lead foot turn from board-backward toward the stance side, degrees
 * (provisional).
 */
const LEAD_FOOT_TURN: number = 25;

/**
 * Trail foot turn from board-backward toward the stance side, degrees
 * (provisional).
 */
const TRAIL_FOOT_TURN: number = 45;

/** Outward paddle reach, as a share of the board's width (provisional). */
const PADDLE_REACH: number = 0.45;

/** Vertical paddle dip around the palm site, metres (provisional). */
const PADDLE_DIP: number = 0.06;

/** Fore-aft paddle stroke around the palm site, in leg lengths (provisional). */
const PADDLE_STROKE: number = 0.23;

/** Outward hand spread after release, in upper-arm lengths (provisional). */
const RECOVER_SPREAD: number = 0.7;

/** Hand rise after release, in leg lengths (provisional). */
const RECOVER_RISE: number = 0.55;

/** Forward hand travel after release, in leg lengths (provisional). */
const RECOVER_FORWARD: number = 0.25;

/** Express one angular displacement on the closest arc. */
function wrap(degrees: number): number {
  return degrees - 360 * Math.round(degrees / 360);
}
