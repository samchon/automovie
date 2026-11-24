import { createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanGraspUse,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanPropFrame } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** One two-weapon pairing: the right and left hands' swords. */
interface IPair {
  /** The pairing's label. */
  name: string;

  /** The right hand's sword parameters. */
  right: createSword.IParams;

  /** The left hand's sword parameters. */
  left: createSword.IParams;
}

/** Rapier and main-gauche, and paired arming swords. */
const PAIRS: readonly IPair[] = [
  {
    name: "rapier and dagger",
    right: { kind: "rapier" },
    left: { kind: "dagger" },
  },
  {
    name: "paired swords",
    right: { kind: "armingSword", model: "knight" },
    left: { kind: "armingSword", model: "poitiers" },
  },
];

/** The performers' separation, metres. */
const APART: number = 1.7;
/** A held grip holds within this, metres: the grip bound. */
const HOLD: number = 0.005;
/** Two blades bind within this of each other's axis, metres: two blade widths. */
const BIND: number = 0.06;
/** A thrust's point lands within this of its target region's joint, metres: a trunk's half depth. */
const LAND: number = 0.15;
/** The off hand's block leads the opponent's contact by this, seconds: authored. */
const LEAD: number = 0.4;

/**
 * Two-weapon fighting: the off hand's blade parries an opponent's cut while
 * the main hand's blade answers with a thrust, each weapon addressed by its
 * hand on one clock.
 *
 * Scenarios, for rapier and dagger and for paired swords:
 * 1. Both hands keep their own blade's grip through the exchange.
 * 2. The left blade meets the opponent's cut in a bind at its contact, the
 *    block leading it by the authored lead.
 * 3. The right blade's thrust starts as the block ends and lands on the
 *    opponent's chest at its own contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pairings, the per-hand grips, the bind and the thrust checks.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered blade rows per hand through HumanPerformance and reads hands, blades, bones and the placed schedule.
 * @evidence contracts/development/testing.md#independent-expectations The lead is authored; the bind and landing bounds are blade widths and a trunk's half depth.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairings, left against right hand, block against answer.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_blade_two_weapon(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const checks: motionComplaints.IGatherer = motionComplaints();
  const use: IAutoMovieMotionHumanGraspUse.IUse = {
    tip: "point",
    line: "forearm",
  };
  for (const pair of PAIRS)
    try {
      const right = createSword(pair.right);
      const left = createSword(pair.left);
      const opponent = createSword({ kind: "sabre" });
      const lay = (
        subject: string,
        model: typeof right,
        root: IAutoMovieVector3,
        yaw: number,
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanProp => {
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          yaw,
        );
        const grip: IAutoMovieVector3 =
          model.affordance("grip").frame.translation;
        return HumanObject.prop(subject, model, {
          position: Vector3.add(
            root,
            Quaternion.rotateVector(turn, {
              x: (side === "right" ? -0.1 : 0.1) * body.measure.stature,
              y: 0.6 * body.measure.stature,
              z: 0.18 * body.measure.stature - grip.y,
            }),
          ),
          rotation: Quaternion.multiply(
            turn,
            Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          ),
        });
      };
      const fencer: IAutoMovieMotionHumanChain = HumanChain.subject("a")
        .pickUp({ prop: "a.right", handle: "grip", hand: "right", use })
        .pickUp({ prop: "a.left", handle: "grip", hand: "left", use })
        .registered(
          AutoMovieMotionHumanBlade.HumanBlade.parry.name,
          { blade: "a.left", hand: "left", against: "b.cut" },
          "a.block",
        )
        .sync({ of: "b.cut", offset: -LEAD })
        .registered(
          AutoMovieMotionHumanBlade.HumanBlade.thrust.name,
          {
            blade: "a.right",
            hand: "right",
            target: { kind: "person", subject: "b", region: "chestRight" },
          },
          "a.thrust",
        );
      const attacker: IAutoMovieMotionHumanChain = HumanChain.subject("b")
        .pickUp({
          prop: "b.sabre",
          handle: "grip",
          hand: "right",
          use: { tip: "point", line: "oblique" },
        })
        .stand({ hold: 1.2, sway: 0 })
        .registered(
          AutoMovieMotionHumanBlade.HumanBlade.cut.name,
          {
            blade: "b.sabre",
            target: { kind: "person", subject: "a", region: "shoulderLeft" },
            outcome: "parried",
          },
          "b.cut",
        );
      const film: HumanPerformance = new HumanPerformance({
        seed: "two-weapon-" + pair.name,
        laws: [...Object.values(AutoMovieMotionHumanBlade.HumanBlade)],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body,
            at: { x: 0, y: 0, z: APART },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          lay("a.right", right, { x: 0, y: 0, z: 0 }, 0, "right"),
          lay("a.left", left, { x: 0, y: 0, z: 0 }, 0, "left"),
          lay("b.sabre", opponent, { x: 0, y: 0, z: APART }, 180, "right"),
        ],
        composition: attacker.with(fencer).node,
      });
      const placed = (anchor: string): IAutoMovieScheduleEntry =>
        film.schedule.entries.find(
          (entry: IAutoMovieScheduleEntry): boolean =>
            entry.intent.anchor === anchor,
        )!;
      const cut: IAutoMovieScheduleEntry = placed("b.cut");
      const block: IAutoMovieScheduleEntry = placed("a.block");
      const thrust: IAutoMovieScheduleEntry = placed("a.thrust");
      const contact: number = cut.contact!;
      const inHand = (
        side: AutoMovieHumanSide,
        prop: string,
        t: number,
      ): IAutoMovieRigidTransform => {
        const hand: IAutoMovieResolvedBone = film
          .bones("a", t)
          .get(`${side}Hand`)!;
        return HumanPropFrame.relative(
          HumanPropFrame.bone(hand),
          film.prop(prop, t),
        );
      };
      for (const [side, prop] of [
        ["right", "a.right"],
        ["left", "a.left"],
      ] as const) {
        const rest: IAutoMovieRigidTransform = inHand(side, prop, block.start);
        for (let i: number = 1; i <= 12; ++i) {
          const t: number = block.start + ((thrust.end - block.start) * i) / 12;
          checks.check(
            `${pair.name}: the ${side} hand keeps its blade at ${t.toFixed(2)}`,
            Vector3.distance(inHand(side, prop, t).position, rest.position) <=
              HOLD,
          );
        }
      }
      const tip = (
        prop: string,
        model: typeof right,
        t: number,
      ): IAutoMovieVector3 => {
        const frame: IAutoMovieRigidTransform = film.prop(prop, t);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            model.affordance("point").frame.translation,
          ),
        );
      };
      const axis = (
        prop: string,
        model: typeof right,
        t: number,
        s: number,
      ): IAutoMovieVector3 => {
        const frame: IAutoMovieRigidTransform = film.prop(prop, t);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            Vector3.scale(model.affordance("point").frame.translation, s),
          ),
        );
      };
      let bind: number = Infinity;
      for (let i: number = 0; i <= 20; ++i)
        for (let j: number = 0; j <= 20; ++j)
          bind = Math.min(
            bind,
            Vector3.distance(
              axis("a.left", left, contact, i / 20),
              axis("b.sabre", opponent, contact, j / 20),
            ),
          );
      checks.check(
        `${pair.name}: the left blade binds the cut at its contact (${bind.toFixed(3)} m)`,
        bind <= BIND && Math.abs(block.start - (contact - LEAD)) <= 1e-6,
      );
      const chest: IAutoMovieVector3 = film
        .bones("b", thrust.contact!)
        .get("chest")!.worldPosition;
      const landed: number = Vector3.distance(
        tip("a.right", right, thrust.contact!),
        chest,
      );
      checks.check(
        `${pair.name}: the right blade's thrust follows the block (${(thrust.start - block.end).toFixed(3)} s) and lands on the chest (${landed.toFixed(3)} m)`,
        Math.abs(thrust.start - block.end) <= 1e-6 && landed <= LAND,
      );
      assertTakeClean(`${pair.name} two-weapon exchange`, film);
    } catch (error: unknown) {
      checks.check(`${pair.name} refused: ${String(error)}`, false);
    }
  checks.assert("two-weapon fighting");
}
