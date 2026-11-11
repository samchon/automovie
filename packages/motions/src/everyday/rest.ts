import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { handGoals } from "./handGoals";
import { poseBones } from "../posture/poseBones";

/**
 * Standing with the hands at rest places: in the front pockets, on the hips,
 * arms crossed, clasped in front or behind, behind the head, or the chin on
 * a fist, each hand moved there and held.
 *
 * Every rest place is an effector goal on the body's own surface: a hand
 * surface is laid on a region with the palm facing into it; the palm and
 * fist sockets lie on the hand's own collider surface, so a laid hand touches
 * the region rather than sinking into it ({@link HumanHand}). The places, with
 * the surface and region each uses:
 *
 * - `side`: no goal; the arm hangs relaxed as the stand law holds it.
 * - `pocket`: the palm on the front pocket region of the same side's thigh,
 *   fingers down, as a hand slipped into a front pocket shows from outside.
 * - `hip`: the palm on the side of the pelvis midway between the hip
 *   region and the waist, fingers forward and down, elbow out (akimbo).
 * - `crossed`: each palm lies on the front of the other upper arm three
 *   quarters of the way to its elbow, fingers round its outside, so the
 *   forearms cross in front of the lower chest. Each arm's pose depends on
 *   the other's goal, so both upper arms are set first: hanging forward at
 *   least 20 degrees (provisional) and enough for the forearms to clear the
 *   chest, the elbows drawn in until each palm lies one forearm from its own
 *   elbow; each elbow's hint is then that elbow, so the solved arms are the
 *   arms the palms were laid on.
 * - `claspedFront`: the left palm faces the body ahead of the groin, fingers
 *   toward the right, and the right palm lies on the back of the left hand.
 * - `claspedBehind`: the back of the left hand rests on the sacrum, palm
 *   facing back, and the right palm lies in it.
 * - `behindHead`: each palm on the back of the head beside the midline,
 *   elbows wide.
 * - `chinRest`: the top of the fist under the chin, fingers up and palm
 *   facing in, the elbow low and forward.
 * - `elbowSupport`: the palm under the other arm's elbow while that hand is
 *   at `chinRest`, the thinking pose.
 *
 * Each hand travels from where the entry left it to its place on a
 * minimum-jerk path over the free-space time of its distance
 * (`AutoMovieMotionHumanTiming.transport`) and holds there; the place follows the body,
 * so breathing and sway carry the hands with it. A hand at `side` is not
 * moved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
 */
export namespace rest {
  /** The action's name. */
  export const name: HumanActionName = "rest";

  /** A rest place. */
  export type Place =
    | "side"
    | "pocket"
    | "hip"
    | "crossed"
    | "claspedFront"
    | "claspedBehind"
    | "behindHead"
    | "chinRest"
    | "elbowSupport";

  /** Cancel table: holding a rest place has no stroke, so it can be cut anywhere. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    look: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    gesture: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    rest: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The left hand's place; `side` when absent. */
    left?: Place;

    /** The right hand's place; `side` when absent. */
    right?: Place;

    /** How long, seconds; 2 when absent. */
    seconds?: number;
  }

  /** Places that hold both hands together, so both hands must name them. */
  export const PAIRED: readonly Place[] = [
    "crossed",
    "claspedFront",
    "claspedBehind",
    "behindHead",
  ];

  /**
   * Plan a rest.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When a paired place names one hand only, or the time is not positive.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const places: Record<HumanHand.Side, Place> = {
      left: context.params.left ?? "side",
      right: context.params.right ?? "side",
    };
    for (const place of PAIRED)
      if ((places.left === place) !== (places.right === place))
        throw new Error(
          `${context.subject}: ${place} holds both hands; name it for both`,
        );
    for (const side of ["left", "right"] as const)
      if (
        places[side] === "elbowSupport" &&
        places[side === "left" ? "right" : "left"] !== "chinRest"
      )
        throw new Error(
          `${context.subject}: elbowSupport holds the other arm's elbow; the other hand must be at chinRest`,
        );
    const duration: number = context.params.seconds ?? 2;
    if (!(duration > 0)) throw new Error("A rest lasts a positive time");
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    const at0: IHumanPosture = base.posture(0);
    const frame0: HumanFrame.IFrame = { origin: at0.root, yaw: at0.yaw };

    // Goals, solved once in the performer's frame and carried by the body.
    const goals: Partial<Record<HumanHand.Side, IGoal>> = rest.goals(
      body,
      at0,
      places,
    );
    const entry: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
    );
    const begin: Partial<
      Record<
        HumanHand.Side,
        {
          point: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          travel: number;
        }
      >
    > = {};
    for (const side of ["left", "right"] as const) {
      const goal: IGoal | undefined = goals[side];
      if (goal === undefined) continue;
      const from: IAutoMovieVector3 = HumanHand.frame(
        body,
        entry,
        side,
        goal.surface,
      ).point;
      begin[side] = {
        point: HumanFrame.local(frame0, from),
        rotation: Quaternion.multiply(
          HumanFrame.turn(-frame0.yaw),
          entry.get(`${side}Hand`)!.worldRotation,
        ),
        travel: Math.min(
          duration,
          AutoMovieMotionHumanTiming.transport(
            Vector3.length(Vector3.subtract(from, goal.point)),
          ),
        ),
      };
    }
    const local: Partial<Record<HumanHand.Side, IGoal>> = {};
    for (const side of ["left", "right"] as const) {
      const goal: IGoal | undefined = goals[side];
      if (goal !== undefined)
        local[side] = {
          ...goal,
          point: HumanFrame.local(frame0, goal.point),
          rotation: Quaternion.multiply(
            HumanFrame.turn(-frame0.yaw),
            goal.rotation,
          ),
          elbow: HumanFrame.local(frame0, goal.elbow),
        };
    }
    const arrive: number = Math.max(
      0,
      ...Object.values(begin).map((b) => b!.travel),
    );

    return {
      duration,
      events: [{ name: "placed", share: arrive / duration }],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t);
        const frame: HumanFrame.IFrame = {
          origin: posture.root,
          yaw: posture.yaw,
        };
        const turn: IAutoMovieQuaternion = HumanFrame.turn(frame.yaw);
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        const requests: AutoMovieMotionHumanArm.ISided[] = [];
        for (const side of ["left", "right"] as const) {
          const goal: IGoal | undefined = local[side];
          const from = begin[side];
          if (goal === undefined || from === undefined) continue;
          const s: number = minimumJerk(t / from.travel).s;
          requests.push({
            side,
            surface: goal.surface,
            shape: goal.shape,
            point: HumanFrame.point(
              frame,
              Vector3.lerp(from.point, goal.point, s),
            ),
            rotation: Quaternion.multiply(
              turn,
              Quaternion.slerp(from.rotation, goal.rotation, s),
            ),
            bend: HumanFrame.point(frame, goal.elbow),
          });
          Object.assign(joints, HumanHand.shape(side, goal.shape));
        }
        return handGoals(body, { ...posture, joints }, requests);
      },
    };
  }

  /** A hand's rest goal in world metres. */
  export interface IGoal {
    /** The surface laid on the place. */
    surface: HumanHand.Surface;

    /** The hand shape. */
    shape: HumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres. */
    elbow: IAutoMovieVector3;
  }

  /**
   * Both hands' rest goals on a posture.
   *
   * Each place states where the elbow points, as a bend preset of
   * `AutoMovieMotionHumanBend` (`BENDS`):
   * akimbo and behind-the-head elbows go out wide, chin-rest elbows forward
   * and down, the others down beside the body; crossed arms set their elbows
   * exactly (`crossedArms`).
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param places Each hand's place.
   * @returns The goals of the hands that move.
   */
  export function goals(
    body: IHumanBody,
    posture: IHumanPosture,
    places: Record<HumanHand.Side, Place>,
  ): Partial<Record<HumanHand.Side, IGoal>> {
    const out: Partial<Record<HumanHand.Side, IGoal>> = {};
    const m = body.measure;
    const region = (
      name: AutoMovieHumanoidRegion,
    ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =>
      HumanTrunk.region(body, posture, name);
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const dir = (x: number, y: number, z: number): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
        { x, y, z },
      );
    // The hint rides the root and the heading only, as the rest places were
    // captured: a standing rest does not pitch or roll the trunk.
    const elbow = (
      side: HumanHand.Side,
      place: keyof typeof BENDS,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.arm(
        body,
        { root: posture.root, yaw: posture.yaw },
        side,
        BENDS[place],
      );
    const lay = (
      side: HumanHand.Side,
      place: keyof typeof BENDS,
      surface: HumanHand.Surface,
      shape: HumanHand.Shape,
      point: IAutoMovieVector3,
      fingers: IAutoMovieVector3,
      palm: IAutoMovieVector3,
    ): IGoal => ({
      surface,
      shape,
      point,
      rotation: HumanHand.rotation(side, { fingers, palm }),
      elbow: elbow(side, place),
    });
    for (const side of ["left", "right"] as const) {
      const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
      const sign: number = side === "left" ? 1 : -1;
      const place: Place = places[side];
      switch (place) {
        case "side":
        case "crossed":
        case "elbowSupport":
          break;
        case "pocket": {
          const pocket = region(`pocketFront${Side}`);
          out[side] = lay(
            side,
            place,
            "palm",
            "relaxed",
            pocket.point,
            dir(0, -1, 0.35),
            dir(-sign, 0, -0.4),
          );
          break;
        }
        case "hip": {
          const hip = region(`hip${Side}`);
          const up: number = 0.5 * (m.waistHeight - m.hipHeight);
          out[side] = lay(
            side,
            place,
            "palm",
            "flat",
            Vector3.add(hip.point, { x: 0, y: up, z: 0 }),
            dir(0, -0.6, 0.8),
            Vector3.scale(hip.normal, -1),
          );
          break;
        }
        case "claspedFront": {
          if (side === "right") break;
          const groin = region("groin");
          const ahead: IAutoMovieVector3 = dir(0, 0, 1);
          const centre: IAutoMovieVector3 = Vector3.add(
            { ...groin.point, y: groin.point.y + 0.03 * m.stature },
            Vector3.scale(ahead, 0.04 * m.stature),
          );
          out.left = lay(
            "left",
            place,
            "palm",
            "relaxed",
            centre,
            dir(-1, -0.3, 0),
            Vector3.scale(ahead, -1),
          );
          out.right = onPalm(
            body,
            out.left,
            "right",
            elbow("right", place),
            dir(1, -0.3, 0),
          );
          break;
        }
        case "claspedBehind": {
          if (side === "right") break;
          const back = region("lowerBack");
          const low: IAutoMovieVector3 = {
            ...back.point,
            y: back.point.y - 0.03 * m.stature,
          };
          out.left = lay(
            "left",
            place,
            "handBack",
            "relaxed",
            low,
            dir(-0.5, -1, 0),
            back.normal,
          );
          out.right = onPalm(
            body,
            out.left,
            "right",
            elbow("right", place),
            dir(0.5, -1, 0),
          );
          break;
        }
        case "behindHead": {
          const head = region("headBack");
          const beside: IAutoMovieVector3 = Vector3.add(
            head.point,
            Vector3.scale(dir(1, 0, 0), sign * 0.25 * m.headRadius),
          );
          out[side] = lay(
            side,
            place,
            "palm",
            "flat",
            beside,
            dir(-sign, 0.6, 0),
            Vector3.scale(head.normal, -1),
          );
          break;
        }
        case "chinRest": {
          const chin = region("chin");
          out[side] = lay(
            side,
            place,
            "fist",
            "fist",
            chin.point,
            dir(0, 1, 0),
            dir(-sign, 0, 0),
          );
          break;
        }
      }
    }
    if (places.left === "crossed")
      Object.assign(out, crossedArms(body, posture));
    for (const side of ["left", "right"] as const) {
      if (places[side] !== "elbowSupport") continue;
      const other: HumanHand.Side = side === "left" ? "right" : "left";
      out[side] = support(
        body,
        posture,
        side,
        out[other]!,
        elbow(side, "elbowSupport"),
      );
    }
    return out;
  }

  /** The elbow's bend preset by place. */
  export const BENDS: Readonly<
    Record<Exclude<Place, "side" | "crossed">, AutoMovieMotionHumanBend.Arm>
  > = {
    pocket: "tucked",
    hip: "akimbo",
    claspedFront: "front",
    claspedBehind: "behind",
    behindHead: "raised",
    chinRest: "forward",
    elbowSupport: "folded",
  };

  /** The least forward hang of each upper arm when the arms are crossed, degrees (provisional). */
  export const CROSSED_FLEXION: number = 20;
}

/** The other hand's palm laid on the left hand's palm. */
function onPalm(
  body: IHumanBody,
  left: rest.IGoal,
  side: HumanHand.Side,
  elbow: IAutoMovieVector3,
  fingers: IAutoMovieVector3,
): rest.IGoal {
  const wrist: HumanHand.IWrist = HumanHand.place(
    body,
    "left",
    left.surface,
    left.point,
    left.rotation,
    left.shape,
  );
  const palm = HumanHand.offset(body, "left", "palm");
  const point: IAutoMovieVector3 = Vector3.add(
    wrist.point,
    Quaternion.rotateVector(wrist.rotation, palm.point),
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    wrist.rotation,
    palm.normal,
  );
  return {
    surface: "palm",
    shape: "relaxed",
    point,
    rotation: HumanHand.rotation(side, {
      fingers,
      palm: Vector3.scale(normal, -1),
    }),
    elbow,
  };
}

/**
 * Both crossed-arms goals on upper arms set before the goals: each hangs
 * forward by `CROSSED_FLEXION` or, if more, until its elbow stands the
 * forearm's radius ahead of the sternum, so the forearms clear the chest;
 * the elbows then draw in, both alike, until each palm (laid on the front of
 * the other upper arm three quarters of the way to its elbow, fingers round
 * its outside) leaves its wrist one forearm from its own elbow, found by
 * bisection since drawing in brings the wrists nearer. The elbow hint is the
 * elbow itself, which then lies on the arm's solution circle, so the solved
 * upper arms are the ones the palms were laid on. Elbows that cannot draw in
 * far enough, or need not draw in at all, keep the nearest feasible width.
 */
function crossedArms(
  body: IHumanBody,
  posture: IHumanPosture,
): Record<HumanHand.Side, rest.IGoal> {
  const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
  const turn = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, local);
  const bones = poseBones(body, resolveHumanPosture(body, posture));
  const length = (
    side: HumanHand.Side,
    from: "UpperArm" | "LowerArm",
    to: "LowerArm" | "Hand",
  ): number =>
    Vector3.length(
      Vector3.subtract(
        body.rest.get(`${side}${to}`)!,
        body.rest.get(`${side}${from}`)!,
      ),
    );
  const shoulder = (side: HumanHand.Side): IAutoMovieVector3 =>
    HumanFrame.local(frame, bones.get(`${side}UpperArm`)!.worldPosition);
  const sternum: IAutoMovieVector3 = HumanFrame.local(
    frame,
    HumanTrunk.region(body, posture, "sternum").point,
  );
  const elbowAt = (side: HumanHand.Side, inward: number): IAutoMovieVector3 => {
    const s: IAutoMovieVector3 = shoulder(side);
    const upper: number = length(side, "UpperArm", "LowerArm");
    const ahead: number = Math.min(
      0.9 * upper,
      Math.max(
        upper * Math.sin((rest.CROSSED_FLEXION * Math.PI) / 180),
        sternum.z + body.measure.forearmRadius - s.z,
      ),
    );
    const across: number = Math.min(
      inward,
      Math.sqrt(upper * upper - ahead * ahead),
    );
    const down: number = Math.sqrt(
      Math.max(0, upper * upper - ahead * ahead - across * across),
    );
    return HumanFrame.point(frame, {
      x: s.x - (side === "left" ? 1 : -1) * across,
      y: s.y - down,
      z: s.z + ahead,
    });
  };
  const goal = (
    side: HumanHand.Side,
    inward: number,
  ): { goal: rest.IGoal; excess: number } => {
    const other: HumanHand.Side = side === "left" ? "right" : "left";
    const from: IAutoMovieVector3 = HumanFrame.point(frame, shoulder(other));
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(elbowAt(other, inward), from),
    );
    const ahead: IAutoMovieVector3 = turn({ x: 0, y: 0, z: 1 });
    const front: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ahead, Vector3.scale(axis, Vector3.dot(ahead, axis))),
    );
    const point: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        from,
        Vector3.scale(axis, 0.75 * length(other, "UpperArm", "LowerArm")),
      ),
      Vector3.scale(front, body.measure.upperArmRadius),
    );
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: turn({ x: other === "left" ? 1 : -1, y: 0, z: 0 }),
      palm: Vector3.scale(front, -1),
    });
    const elbow: IAutoMovieVector3 = elbowAt(side, inward);
    const wrist: IAutoMovieVector3 = HumanHand.place(
      body,
      side,
      "palm",
      point,
      rotation,
      "relaxed",
    ).point;
    return {
      goal: { surface: "palm", shape: "relaxed", point, rotation, elbow },
      excess:
        Vector3.length(Vector3.subtract(wrist, elbow)) -
        length(side, "LowerArm", "Hand"),
    };
  };
  const excess = (inward: number): number =>
    (goal("left", inward).excess + goal("right", inward).excess) / 2;
  let lo: number = 0;
  let hi: number = Math.abs(shoulder("left").x - shoulder("right").x) / 2;
  if (excess(lo) <= 0) hi = lo;
  else if (excess(hi) > 0) lo = hi;
  for (let i: number = 0; i < 30 && hi - lo > 1e-5; i++) {
    const mid: number = (lo + hi) / 2;
    if (excess(mid) > 0) lo = mid;
    else hi = mid;
  }
  return { left: goal("left", hi).goal, right: goal("right", hi).goal };
}

/**
 * The supporting hand's goal: its palm under the other arm's elbow (the
 * olecranon region) as that arm holds its chin-rest goal, fingers toward the
 * outside of that elbow.
 */
function support(
  body: IHumanBody,
  posture: IHumanPosture,
  side: HumanHand.Side,
  chin: rest.IGoal,
  elbow: IAutoMovieVector3,
): rest.IGoal {
  const other: HumanHand.Side = side === "left" ? "right" : "left";
  const solved: IHumanPosture = handGoals(
    body,
    {
      ...posture,
      joints: { ...posture.joints, ...HumanHand.shape(other, chin.shape) },
    },
    [
      {
        side: other,
        surface: chin.surface,
        shape: chin.shape,
        point: chin.point,
        rotation: chin.rotation,
        bend: chin.elbow,
      },
    ],
  );
  const bones = poseBones(body, resolveHumanPosture(body, solved));
  const frame =
    body.surfaces.regions[other === "left" ? "elbowLeft" : "elbowRight"];
  const placed = resolveAutoMovieHumanoidSurfaces.place(
    frame,
    bones.get(frame.bone)!,
  );
  const outward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
    { x: other === "left" ? 1 : -1, y: 0, z: 0 },
  );
  return {
    surface: "palm",
    shape: "relaxed",
    point: placed.point,
    rotation: HumanHand.rotation(side, {
      fingers: outward,
      palm: Vector3.scale(placed.normal, -1),
    }),
    elbow,
  };
}
