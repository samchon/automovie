import {
  AutoMovieEnvelope as Ease,
  type preparePhysicalGeometry as Geometry,
  projectPhysicalSupportReach,
} from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { BoutDefense as Reaction } from "../defense/BoutDefense";
import { FighterBody } from "../fighter/FighterBody";
import type { FilmBodyRig as BodyRig } from "../rig/FilmBodyRig";
import { FilmVector as Vec3 } from "../rig/FilmVector";
import { Foot } from "../rig/Foot";
import { Strike } from "../striking/Strike";
import { filmContactIntent } from "./filmContactIntent";
import { filmGuard as guard } from "./filmGuard";
import { filmKickApproaches } from "./filmKickApproaches";
import { filmRibPoint as ribs } from "./filmRibPoint";
import { resolveCheckGoal } from "./resolveCheckGoal";
import { resolveKickGoal } from "./resolveKickGoal";

/** Glove sphere radius used when two gloves or a glove and a body meet, metres. */
const GLOVE: number = 0.095;

/** Depth a landing glove is aimed into the struck surface: past the audit's 1 cm landing compression. */
const SINK: number = 0.02;

/**
 * Turns every performer's frame into IK requests, resolving goals that depend on the other body.
 *
 * Order: trunks (actual and nominal) → passive hands (guard, cover, catch,
 * block, forward post) and passive legs (placements, checks) → attacks,
 * which aim at the opponent's nominal head line, passive gloves, ribs or
 * checking shin → reactive parries, which meet the attacking glove's goal.
 * Supplied receiver geometry belongs to one completed scene snapshot; staging never reads a half-updated opponent.
 *
 * @evidence contracts/common.md#implementation-and-ownership This resolver authors limb goals; collider bindings and shared fitting own achieved geometry. Punches retain their authored compression hints. Kicks aim a provider-derived shin witness at the actual receiver and declare reach through shared staging. An authored goal cannot qualify a solver contact receipt.
 * @evidence contracts/common.md#authoring-interface `frames` maps performer ids to frames; `rigs` supplies each body. Fighters are "a" and "b"; any other id (the referee) only uses placement, point and pose intents.
 */
export namespace Resolve {
  /** Existing movie travel/work policy, shared by support fitting and receiver-relative preparation. */
  const ROOT_PROJECTION: Omit<
    Parameters<typeof projectPhysicalSupportReach>[0],
    "supports"
  > = { maximumTranslation: 0.35, iterations: 8, tolerance: 0.001 };
  /**
   * Requests and the attack goals used for contact measurement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Result of one resolution pass.
   * @evidence contracts/common.md#authoring-interface Requests keyed by performer id; heads in world metres.
   */
  export interface Output {
    /** IK request per performer. */
    requests: Record<string, BodyRig.Request>;
    /** Head joint per performer after placement, world metres. */
    heads: Record<string, Vec3.Value>;
    /** Actual bounded staging projection and any remaining seed preference, separate from achieved contact. */
    approach: Record<string, ReturnType<typeof projectPhysicalSupportReach>>;
  }

  /** Per-performer derived geometry. */
  interface Context {
    /** Actual actor identity in the same scene snapshot. */
    id: string;
    frame: FighterBody.Frame;
    rig: BodyRig;
    root: BodyRig.Placement;
    pose: ReturnType<typeof FighterBody.pose>;
    trunk: BodyRig.Trunk;
    /** Authored FK already evaluated for this frame and root. */
    authored: BodyRig.Trunk;
    nominal: BodyRig.Trunk;
    forward: Vec3.Value;
    left: Vec3.Value;
    arms: Partial<Record<"left" | "right", BodyRig.Goal>>;
    legs: Partial<Record<"left" | "right", BodyRig.Goal>>;
    /** Exact collider queries, when prepared. */
    geometry?: Geometry.IQueries;
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
    trunks?: Readonly<Record<string, BodyRig.Trunk>>,
    options: { geometry?: Geometry.IQueries; approach?: boolean } = {},
  ): Output {
    const contexts: Record<string, Context> = {};
    for (const [id, frame] of Object.entries(frames)) {
      const rig: BodyRig = rigs[id]!;
      const pose: ReturnType<typeof FighterBody.pose> = FighterBody.pose(frame);
      let root: BodyRig.Placement = FighterBody.placement(frame);
      let trunk: BodyRig.Trunk = rig.trunk(pose, root);

      // Support reach: a body cannot travel farther from a planted foot than its leg
      // reaches. Pull the root back toward any planted ankle goal beyond 95% of the leg
      // (the rest is left for the hip's extension limit in a driving rear leg), so
      // planted feet never slide or lift because the authored body overran them.
      const reach: number = 0.95 * (rig.legLengths[0] + rig.legLengths[1]);
      const supports: Parameters<
        typeof projectPhysicalSupportReach
      >[0]["supports"] = (["left", "right"] as const).flatMap(
        (
          side: "left" | "right",
        ): Parameters<
          typeof projectPhysicalSupportReach
        >[0]["supports"][number][] => {
          const leg: FighterBody.Leg = frame.legs[side];
          if (leg.kind !== "place") return [];
          const ankle: Vec3.Value = Foot.goals(
            leg.placement,
            rig.footVector,
          ).ankle;
          return [
            {
              origin: Vec3.vector(trunk.hipJoints[side]),
              target: Vec3.vector(ankle),
              radius: reach,
            },
          ];
        },
      );
      const pull: Vec3.Value = Vec3.tuple(
        projectPhysicalSupportReach({ supports, ...ROOT_PROJECTION })
          .translation,
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
        id,
        frame,
        rig,
        root,
        pose,
        trunk: trunks?.[id] ?? trunk,
        authored: trunk,
        nominal: evading ? nominal : (trunks?.[id] ?? trunk),
        forward: Vec3.rotateY([1, 0, 0], frame.heading),
        left: Vec3.rotateY([0, 0, 1], frame.heading),
        arms: {},
        legs: {},
        ...(options.geometry ? { geometry: options.geometry } : {}),
      };
    }

    const approach: Output["approach"] = filmKickApproaches(
      contexts,
      ROOT_PROJECTION,
      {
        actualTrunks: trunks !== undefined,
        enabled: options.approach !== false,
        geometry: options.geometry,
      },
    );

    // Three stages, because goals depend on each other across bodies: passive hands
    // (guard, catch, forward post, point) first; then attacks, which aim at the opponent's
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
            else if (leg.kind === "check")
              c.legs[side] = resolveCheckGoal(c, side, leg);
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
              c.legs[side] = resolveKickGoal(
                c,
                opponent,
                leg,
                options.geometry,
              );
          }
        }
      }

    const requests: Record<string, BodyRig.Request> = {};
    const heads: Record<string, Vec3.Value> = {};
    for (const [id, c] of Object.entries(contexts)) {
      requests[id] = { root: c.root, pose: c.pose, arms: c.arms, legs: c.legs };
      heads[id] = c.trunk.head;
    }
    return { requests, heads, approach };
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
        return guard(c, side, hand.tight, hand.extension ?? 0, hand.reach ?? 0);
      case "catch":
        return lerpGoal(
          guard(c, side, 0),
          catchGoal(c, side, hand.low),
          hand.amount,
        );
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
          Vec3.add(incoming.point, Vec3.scale(c.left, push * GLOVE * 1.5)),
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

  /** Ankle and ball goals of a placed foot. */
  function placed(c: Context, placement: Foot.Placement): BodyRig.Goal {
    const goals: Foot.Goals = Foot.goals(placement, c.rig.footVector);
    return {
      point: goals.ankle,
      aim: { bone: "ball", point: goals.ball, weight: 0.7 },
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
      BoutScript.specs[action.technique].shape === "hook";
    const elbow: Vec3.Value = hook
      ? Vec3.add(
          Vec3.add(shoulder, Vec3.scale(outward, 0.22)),
          Vec3.add(Vec3.scale(c.forward, 0.12), [
            0,
            BoutScript.specs[action.technique].target === "head" ? -0.02 : -0.16,
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
        if (BoutScript.specs[action.technique].shape === "hook" && BoutScript.specs[action.technique].target === "head")
          return along(
            Vec3.add(
              passive(o, receiver).point,
              Vec3.scale(o.left, receiver === "right" ? -0.05 : 0.05),
            ),
            GLOVE * 1.8,
          );
        if (BoutScript.specs[action.technique].shape === "uppercut") {
          // Rise into the underside of the covering glove, a quarter of the way in
          // from it toward the midline, pressing into it whatever the guard's width.
          const mid: Vec3.Value = Vec3.lerp(
            passive(o, "left").point,
            passive(o, "right").point,
            0.5,
          );
          return Vec3.add(Vec3.lerp(passive(o, receiver).point, mid, 0.25), [
            0,
            -GLOVE * 1.6,
            0,
          ]);
        }
        return along(passive(o, receiver).point, GLOVE * 1.8);
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
      case "none": {
        // With prepared geometry the glove sinks into the receiver's actual
        // collider of the struck region, the same surface the audit measures.
        if (o.geometry) {
          const intent: filmContactIntent.IIntent = filmContactIntent(action);
          return along(surface(o, intent.targetBone, shoulder), GLOVE - SINK);
        }
        if (BoutScript.specs[action.technique].target === "head") {
          // The struck jaw-side point on the face turned toward the attacker; the
          // glove drives 5 cm into the cheek rather than stopping at it.
          const toward: Vec3.Value = Vec3.sub(c.root.position, o.trunk.head);
          const forward: Vec3.Value = Vec3.normalize([toward[0], 0, toward[2]]);
          const left: Vec3.Value = Vec3.rotateY(
            [0, 0, 1],
            Vec3.heading(forward),
          );
          const jaw: Vec3.Value = Vec3.add(
            o.trunk.head,
            Vec3.add(
              Vec3.add(
                Vec3.scale(forward, 0.06),
                Vec3.scale(left, receiver === "left" ? 0.07 : -0.07),
              ),
              [0, -0.05, 0],
            ),
          );
          return along(jaw, GLOVE - 0.05);
        }
        // The glove sinks about 2 cm into the ribs.
        return along(ribs(o, receiver), GLOVE - 0.025);
      }
      case "check":
      case "slip":
      case "weave":
      case "lean": {
        if (BoutScript.specs[action.technique].shape === "hook" && BoutScript.specs[action.technique].target === "head")
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

  /** Closest point of a receiver segment's actual colliders to a point. */
  function surface(o: Context, bone: string, from: Vec3.Value): Vec3.Value {
    let best: Vec3.Value | undefined;
    for (const segment of o.rig.profile.segments)
      if (segment.bone === bone)
        for (const shape of segment.shapes) {
          const point: Vec3.Value = Vec3.tuple(
            o.geometry!.project(
              { body: o.id, bone, shape, pose: o.trunk.segments[bone]! },
              Vec3.vector(from),
            ),
          );
          if (!best || Vec3.distance(point, from) < Vec3.distance(best, from)) best = point;
        }
    return best ?? o.trunk.chest;
  }

  /**
   * A receiver's glove goal for aiming: its resolved passive goal, or its guard
   * when that hand is itself attacking or parrying (not yet resolved this frame).
   */
  function passive(o: Context, side: "left" | "right"): BodyRig.Goal {
    return o.arms[side] ?? guard(o, side, 0);
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
