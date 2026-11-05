import type { BodyRig } from "../rig/BodyRig";
import { Ease } from "../rig/Ease";
import { Foot } from "../rig/Foot";
import { Vec3 } from "../rig/Vec3";
import { BoutScript } from "./BoutScript";
import { FighterBody } from "./FighterBody";
import { Reaction } from "./Reaction";
import { Strike } from "./Strike";

/** Glove sphere radius used when two gloves or a glove and a body meet, metres. */
const GLOVE: number = 0.095;

/**
 * Turns every performer's frame into IK requests, resolving goals that depend on the other body.
 *
 * Order: trunks (actual and nominal) → passive hands (guard, cover, catch,
 * block, counterbalance) and passive legs (placements, checks) → attacks,
 * which aim at the opponent's nominal head line, passive gloves, ribs or
 * checking shin → reactive parries, which meet the attacking glove's goal.
 * No step reads a solved limb, so there is no circular dependency.
 *
 * @evidence contracts/common.md#implementation-and-ownership Contact is built in by construction: a covered punch's glove centre stops one glove diameter short of the covering glove along the punch line; a body shot stops a glove radius off the rib point; a kick centres the shin on its target. Evaded punches extend through the nominal head line. The measured gaps after solving are reported separately as contact receipts.
 * @evidence contracts/common.md#authoring-interface `frames` maps performer ids to frames; `rigs` supplies each body. Fighters are "a" and "b"; any other id (the referee) only uses placement, point and pose intents.
 */
export namespace Resolve {
  /**
   * Requests and the attack goals used for contact measurement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Result of one resolution pass.
   * @evidence contracts/common.md#authoring-interface Requests keyed by performer id; heads in world metres.
   */
  export interface Output {
    /** IK request per performer. */ requests: Record<string, BodyRig.Request>;
    /** Head joint per performer after placement, world metres. */ heads: Record<
      string,
      Vec3.Value
    >;
  }

  /** Per-performer derived geometry. */
  interface Context {
    frame: FighterBody.Frame;
    rig: BodyRig;
    root: BodyRig.Placement;
    pose: ReturnType<typeof FighterBody.pose>;
    trunk: BodyRig.Trunk;
    nominal: BodyRig.Trunk;
    forward: Vec3.Value;
    left: Vec3.Value;
    arms: Partial<Record<"left" | "right", BodyRig.Goal>>;
    legs: Partial<Record<"left" | "right", BodyRig.Goal>>;
  }

  /**
   * Resolve all requests for one film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Trunks with a support-reach pull, then passive hands and legs, attacks against the opponent's passive geometry, then parries; no step reads a solved limb.
   * @evidence contracts/common.md#authoring-interface Frames and rigs keyed by performer id; returns IK requests.
   */
  export function requests(
    frames: Record<string, FighterBody.Frame>,
    rigs: Record<string, BodyRig>,
  ): Output {
    const contexts: Record<string, Context> = {};
    for (const [id, frame] of Object.entries(frames)) {
      const rig: BodyRig = rigs[id]!;
      const pose = FighterBody.pose(frame);
      let root: BodyRig.Placement = FighterBody.placement(frame);
      let trunk: BodyRig.Trunk = rig.trunk(pose, root);

      // Support reach: a body cannot travel farther from a planted foot than its leg
      // reaches. Pull the root back toward any planted ankle goal beyond 95% of the leg
      // (the rest is left for the hip's extension limit in a driving rear leg), so
      // planted feet never slide or lift because the authored body overran them.
      const reach: number = 0.95 * (rig.legLengths[0] + rig.legLengths[1]);
      const pull: Vec3.Value = (["left", "right"] as const).reduce(
        (sum: Vec3.Value, side: "left" | "right"): Vec3.Value => {
          const leg: FighterBody.Leg = frame.legs[side];
          if (leg.kind !== "place") return sum;
          const ankle: Vec3.Value = Foot.goals(
            leg.placement,
            rig.footVector,
          ).ankle;
          const offset: Vec3.Value = Vec3.sub(ankle, trunk.hipJoints[side]);
          const excess: number = Vec3.length(offset) - reach;
          return excess > 0
            ? Vec3.add(sum, Vec3.scale(Vec3.normalize(offset), excess))
            : sum;
        },
        [0, 0, 0],
      );
      if (Vec3.length(pull) > 0) {
        root = {
          position: Vec3.add(root.position, pull),
          rotation: root.rotation,
        };
        trunk = rig.trunk(pose, root);
      }
      const evading: boolean =
        frame.evade.lateral !== 0 ||
        frame.evade.flexion !== 0 ||
        frame.evade.drop !== 0 ||
        frame.evade.shift !== 0;
      const nominalRoot: BodyRig.Placement = FighterBody.placement(frame, true);
      const nominal: BodyRig.Trunk = evading
        ? rig.trunk(FighterBody.pose(frame, true), {
            position: Vec3.add(nominalRoot.position, pull),
            rotation: nominalRoot.rotation,
          })
        : trunk;
      contexts[id] = {
        frame,
        rig,
        root,
        pose,
        trunk,
        nominal,
        forward: Vec3.rotateY([1, 0, 0], frame.heading),
        left: Vec3.rotateY([0, 0, 1], frame.heading),
        arms: {},
        legs: {},
      };
    }

    // Three stages, because goals depend on each other across bodies: passive hands
    // (guard, catch, swing, point) first; then attacks, which aim at the opponent's
    // passive geometry; then parries, which meet the attacking glove. A blended hand
    // (an interrupted action handing over to the next) resolves in the latest stage
    // any of its parts needs.
    for (const stage of [0, 1, 2] as const)
      for (const [id, c] of Object.entries(contexts)) {
        const opponent: Context | undefined =
          contexts[id === "a" ? "b" : id === "b" ? "a" : ""];
        for (const side of ["left", "right"] as const) {
          const hand: FighterBody.Hand = c.frame.hands[side];
          if (stageOf(hand) === stage) {
            const goal: BodyRig.Goal | undefined = handGoal(
              c,
              opponent,
              side,
              hand,
            );
            if (goal) c.arms[side] = goal;
          }
          if (stage === 0) {
            const leg: FighterBody.Leg = c.frame.legs[side];
            if (leg.kind === "place") c.legs[side] = placed(c, leg.placement);
            else if (leg.kind === "check") c.legs[side] = check(c, side, leg);
            else if (leg.kind === "point")
              c.legs[side] = {
                point: leg.ankle,
                ...(leg.knee
                  ? { aim: { bone: "knee", point: leg.knee, weight: 0.7 } }
                  : {}),
              };
          } else if (stage === 1 && opponent) {
            const leg: FighterBody.Leg = c.frame.legs[side];
            if (leg.kind === "kick")
              c.legs[side] = kick(c, opponent, side, leg);
          }
        }
      }

    const requests: Record<string, BodyRig.Request> = {};
    const heads: Record<string, Vec3.Value> = {};
    for (const [id, c] of Object.entries(contexts)) {
      requests[id] = { root: c.root, pose: c.pose, arms: c.arms, legs: c.legs };
      heads[id] = c.trunk.head;
    }
    return { requests, heads };
  }

  /**
   * Face centre in front of the head joint, world metres.
   *
   * @evidence contracts/common.md#implementation-and-ownership Fixed offset in front of and above the skull-base joint.
   * @evidence contracts/common.md#authoring-interface World metres.
   */
  export function face(trunk: BodyRig.Trunk, forward: Vec3.Value): Vec3.Value {
    return Vec3.add(
      Vec3.add(trunk.head, Vec3.scale(forward, 0.075)),
      [0, 0.06, 0],
    );
  }

  /** Guard glove goal relative to the head, with elbows tucked. */
  function guard(
    c: Context,
    side: "left" | "right",
    tight: number,
    reach: number = 0,
  ): BodyRig.Goal {
    const lead: boolean = side === "left";
    const f: number = (lead ? Ease.lerp(0.27, 0.18, tight) : 0.14) + reach;
    const u: number = lead
      ? Ease.lerp(-0.05, 0.0, tight)
      : Ease.lerp(-0.07, -0.02, tight);
    const l: number = lead
      ? Ease.lerp(0.07, 0.09, tight)
      : Ease.lerp(-0.13, -0.11, tight);
    const point: Vec3.Value = Vec3.add(
      c.trunk.head,
      Vec3.add(
        Vec3.add(Vec3.scale(c.forward, f), [0, u, 0]),
        Vec3.scale(c.left, l),
      ),
    );
    const elbow: Vec3.Value = Vec3.add(
      c.trunk.shoulders[side],
      Vec3.add(Vec3.scale(c.forward, 0.1), [0, -0.24, 0]),
    );
    return { point, aim: { bone: "elbow", point: elbow, weight: 0.25 } };
  }

  /** Latest resolution stage a hand intent (or any part of a blend) needs. */
  function stageOf(hand: FighterBody.Hand): number {
    if (hand.kind === "blend")
      return Math.max(stageOf(hand.from), stageOf(hand.to));
    return hand.kind === "attack" ? 1 : hand.kind === "parry" ? 2 : 0;
  }

  /** Glove goal of any hand intent; a blend cross-fades its two resolved parts. */
  function handGoal(
    c: Context,
    o: Context | undefined,
    side: "left" | "right",
    hand: FighterBody.Hand,
  ): BodyRig.Goal | undefined {
    switch (hand.kind) {
      case "guard":
        return guard(c, side, hand.tight, hand.reach ?? 0);
      case "catch":
        return lerpGoal(
          guard(c, side, 0),
          catchGoal(c, side, hand.low),
          hand.amount,
        );
      case "swing":
        return lerpGoal(guard(c, side, 0), swingGoal(c, side), hand.amount);
      case "point": {
        const goal: BodyRig.Goal = {
          point: hand.point,
          ...(hand.elbow
            ? {
                aim: {
                  bone: "elbow",
                  point: hand.elbow,
                  weight: hand.weight ?? 0.4,
                },
              }
            : {}),
        };
        return hand.amount === undefined
          ? goal
          : lerpGoal(guard(c, side, 0), goal, hand.amount);
      }
      case "attack":
        return o
          ? punch(c, o, side, hand.action, hand.extension)
          : guard(c, side, 0);
      case "parry": {
        const base: BodyRig.Goal = guard(c, side, 0);
        const incoming: BodyRig.Goal | undefined =
          o?.arms[BoutScript.specs[hand.action.technique].side];
        if (!incoming) return base;
        const push: number = side === "right" ? -1 : 1;
        const meet: Vec3.Value = Vec3.add(
          Vec3.add(incoming.point, Vec3.scale(c.left, push * GLOVE * 1.7)),
          Vec3.scale(c.forward, -0.02),
        );
        return lerpGoal(base, { point: meet }, hand.amount);
      }
      case "blend": {
        const from: BodyRig.Goal | undefined = handGoal(c, o, side, hand.from);
        const to: BodyRig.Goal | undefined = handGoal(c, o, side, hand.to);
        return from && to ? lerpGoal(from, to, hand.weight) : (to ?? from);
      }
      case "pose":
        return undefined;
    }
  }

  /** Glove lowered in front of the ribs on one side (block raises it toward the elbow line). */
  function catchGoal(
    c: Context,
    side: "left" | "right",
    low: number,
  ): BodyRig.Goal {
    const sign: number = side === "left" ? 1 : -1;
    const point: Vec3.Value = Vec3.add(
      c.trunk.chest,
      Vec3.add(
        Vec3.add(Vec3.scale(c.forward, 0.2), [0, -0.2 * low + 0.04, 0]),
        Vec3.scale(c.left, 0.12 * sign),
      ),
    );
    const elbow: Vec3.Value = Vec3.add(
      c.trunk.chest,
      Vec3.add(
        Vec3.add(Vec3.scale(c.forward, 0.05), [0, -0.24, 0]),
        Vec3.scale(c.left, 0.17 * sign),
      ),
    );
    return { point, aim: { bone: "elbow", point: elbow, weight: 0.5 } };
  }

  /** Counterbalancing arm swung down and back beside the hip during a kick. */
  function swingGoal(c: Context, side: "left" | "right"): BodyRig.Goal {
    const sign: number = side === "left" ? 1 : -1;
    return {
      point: Vec3.add(
        c.trunk.hipJoints[side],
        Vec3.add(
          Vec3.add(Vec3.scale(c.forward, -0.18), [0, 0.05, 0]),
          Vec3.scale(c.left, 0.2 * sign),
        ),
      ),
    };
  }

  /** Ankle and ball goals of a placed foot. */
  function placed(c: Context, placement: Foot.Placement): BodyRig.Goal {
    const goals: Foot.Goals = Foot.goals(placement, c.rig.footVector);
    return {
      point: goals.ankle,
      aim: { bone: "ball", point: goals.ball, weight: 0.7 },
    };
  }

  /** Lead leg raised with the shin turned out against a low kick. */
  function check(
    c: Context,
    side: "left" | "right",
    leg: Extract<FighterBody.Leg, { kind: "check" }>,
  ): BodyRig.Goal {
    const from: Foot.Goals = Foot.goals(leg.from, c.rig.footVector);
    const to: Foot.Goals = Foot.goals(leg.to, c.rig.footVector);
    const k: number = leg.amount;
    const ground: Vec3.Value = Vec3.lerp(
      from.ankle,
      to.ankle,
      Ease.smoother(leg.progress),
    );
    const ankle: Vec3.Value = Vec3.add(
      ground,
      Vec3.add(
        Vec3.add([0, 0.3 * k, 0], Vec3.scale(c.forward, 0.06 * k)),
        Vec3.scale(c.left, 0.04 * k),
      ),
    );
    const knee: Vec3.Value = Vec3.add(
      c.trunk.hipJoints[side],
      Vec3.add(
        Vec3.add(Vec3.scale(c.forward, 0.34), [0, -0.2, 0]),
        Vec3.scale(c.left, 0.1),
      ),
    );
    return {
      point: ankle,
      aim: { bone: "knee", point: knee, weight: 0.7 * k },
    };
  }

  /** Punch glove goal against the opponent's resolved geometry. */
  function punch(
    c: Context,
    o: Context,
    side: "left" | "right",
    action: BoutScript.Action,
    extension: number,
  ): BodyRig.Goal {
    const home: BodyRig.Goal = guard(c, side, 0);
    const shoulder: Vec3.Value = c.trunk.shoulders[side];
    const target: Vec3.Value = punchTarget(c, o, action, shoulder);
    const outward: Vec3.Value = Vec3.scale(c.left, side === "left" ? 1 : -1);
    const point: Vec3.Value = Strike.glove(
      action.technique,
      home.point,
      target,
      outward,
      extension,
    );
    const hook: boolean =
      action.technique === "hook" || action.technique === "body-hook";
    const elbow: Vec3.Value = hook
      ? Vec3.add(
          Vec3.add(shoulder, Vec3.scale(outward, 0.22)),
          Vec3.add(Vec3.scale(c.forward, 0.12), [
            0,
            action.technique === "hook" ? -0.02 : -0.16,
            0,
          ]),
        )
      : Vec3.add(
          shoulder,
          Vec3.add(Vec3.scale(c.forward, 0.2 * extension + 0.1), [
            0,
            -0.24 * (1 - extension) - 0.04,
            0,
          ]),
        );
    return {
      point,
      aim: { bone: "elbow", point: elbow, weight: hook ? 0.45 : 0.15 },
    };
  }

  /** Where a punch's glove centre should be at full extension. */
  function punchTarget(
    c: Context,
    o: Context,
    action: BoutScript.Action,
    shoulder: Vec3.Value,
  ): Vec3.Value {
    const receiver: "left" | "right" = Reaction.struck(action);
    const along = (point: Vec3.Value, back: number): Vec3.Value =>
      Vec3.sub(
        point,
        Vec3.scale(Vec3.normalize(Vec3.sub(point, shoulder)), back),
      );
    const nominalFace: Vec3.Value = face(o.nominal, o.forward);
    switch (action.defense) {
      case "cover":
      case "catch":
      case "block": {
        if (action.technique === "hook")
          return along(
            Vec3.add(
              passive(o, receiver).point,
              Vec3.scale(o.left, receiver === "right" ? -0.05 : 0.05),
            ),
            GLOVE * 1.95,
          );
        if (action.technique === "uppercut") {
          // Rise into the underside of the covering glove, a quarter of the way in
          // from it toward the midline, touching it whatever the guard's width.
          const mid: Vec3.Value = Vec3.lerp(
            passive(o, "left").point,
            passive(o, "right").point,
            0.5,
          );
          return Vec3.add(Vec3.lerp(passive(o, receiver).point, mid, 0.25), [
            0,
            -GLOVE,
            0,
          ]);
        }
        return along(passive(o, receiver).point, GLOVE * 1.95);
      }
      case "parry":
        return Vec3.add(
          nominalFace,
          Vec3.add(
            Vec3.scale(o.left, receiver === "right" ? 0.15 : -0.15),
            Vec3.scale(c.forward, 0.02),
          ),
        );
      case "hit":
        return along(ribs(o, receiver), GLOVE + 0.012);
      case "check":
      case "slip":
      case "weave": {
        if (action.technique === "hook")
          return Vec3.add(
            nominalFace,
            Vec3.scale(o.left, receiver === "right" ? -0.14 : 0.14),
          );
        return Vec3.add(
          nominalFace,
          Vec3.scale(Vec3.normalize(Vec3.sub(nominalFace, shoulder)), 0.07),
        );
      }
    }
  }

  /**
   * A receiver's glove goal for aiming: its resolved passive goal, or its guard
   * when that hand is itself attacking or parrying (not yet resolved this frame).
   */
  function passive(o: Context, side: "left" | "right"): BodyRig.Goal {
    return o.arms[side] ?? guard(o, side, 0);
  }

  /** Rib surface point on one side of a performer. */
  function ribs(o: Context, side: "left" | "right"): Vec3.Value {
    const sign: number = side === "left" ? 1 : -1;
    return Vec3.add(
      o.trunk.chest,
      Vec3.add(
        Vec3.add(Vec3.scale(o.forward, 0.07), [0, -0.17, 0]),
        Vec3.scale(o.left, 0.13 * sign),
      ),
    );
  }

  /** Kicking leg goals against the opponent's resolved geometry. */
  function kick(
    c: Context,
    o: Context,
    side: "left" | "right",
    leg: Extract<FighterBody.Leg, { kind: "kick" }>,
  ): BodyRig.Goal {
    const action: BoutScript.Action = leg.action;
    const receiver: "left" | "right" = Reaction.struck(action);
    const swing: Vec3.Value = Vec3.scale(c.left, side === "right" ? 1 : -1);
    const toward: Vec3.Value = Vec3.normalize(
      Vec3.sub(c.trunk.hips, o.trunk.hips),
    );
    let target: Vec3.Value;
    if (action.technique === "low-kick") {
      const checking: BodyRig.Goal | undefined = o.legs.left;
      target =
        action.defense === "check" && checking?.aim
          ? Vec3.add(
              Vec3.lerp(checking.aim.point, checking.point, 0.3),
              Vec3.scale(toward, 0.09),
            )
          : Vec3.add(
              Vec3.add(o.trunk.hipJoints[receiver], [0, -0.22, 0]),
              Vec3.scale(toward, 0.09),
            );
    } else if (action.technique === "body-kick")
      target =
        action.defense === "block"
          ? Vec3.add(
              passive(o, receiver).point,
              Vec3.add([0, -0.1, 0], Vec3.scale(toward, 0.1)),
            )
          : Vec3.add(ribs(o, receiver), Vec3.scale(toward, 0.06));
    else
      target = Vec3.add(
        Vec3.add(
          o.trunk.head,
          Vec3.add(
            Vec3.add(
              Vec3.scale(o.forward, 0.06),
              Vec3.scale(o.left, receiver === "right" ? -0.07 : 0.07),
            ),
            [0, -0.05, 0],
          ),
        ),
        Vec3.scale(toward, 0.06),
      );
    const standing = (placement: Foot.Placement): Strike.Leg => {
      const ankle: Vec3.Value = Foot.goals(placement, c.rig.footVector).ankle;
      return {
        ankle,
        knee: Vec3.add(
          ankle,
          Vec3.add([0, 0.43, 0], Vec3.scale(c.forward, 0.08)),
        ),
      };
    };
    const goals: Strike.Leg = Strike.kick(action, c.frame.time, {
      hip: c.trunk.hipJoints[side],
      forward: c.forward,
      swing,
      target,
      start: standing(leg.from),
      land: standing(leg.to),
    });
    return {
      point: goals.ankle,
      aim: {
        bone: "knee",
        point: goals.knee,
        weight: action.technique === "high-kick" ? 0.5 : 0.85,
      },
    };
  }

  /** Blend two goals (point and aim). */
  function lerpGoal(a: BodyRig.Goal, b: BodyRig.Goal, u: number): BodyRig.Goal {
    const point: Vec3.Value = Vec3.lerp(a.point, b.point, u);
    if (a.aim && b.aim)
      return {
        point,
        aim: {
          bone: a.aim.bone,
          point: Vec3.lerp(a.aim.point, b.aim.point, u),
          weight: Ease.lerp(a.aim.weight, b.aim.weight, u),
        },
      };
    const aim = u < 0.5 ? a.aim : b.aim;
    return aim ? { point, aim } : { point };
  }
}
