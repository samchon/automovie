import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { walk } from "../actions/walk";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingRoll } from "../striking/StrikingRoll";
import { pushSledStance } from "./pushSledStance";

/**
 * A pushed load's handles held in both hands through a walk: a sled push.
 * The body walks as the walk law plans it to `to`, slowly and with no arm
 * swing; the trunk leans into the load, the hands go to the two
 * handles where the load stands, close on them, and from then on are carried
 * with the chest along the floor at the handles' own height, so the load,
 * gripped, goes where the hands go, as a held prop does, and stays on the
 * floor while the arms take the walk's rise and fall.
 *
 * The lean is the trunk's incline from the vertical, a hinge at the hips
 * shared by the pelvis and the spine (at least `lean`, if asked), coming in
 * over `SETTLE` seconds with the arms; lower handles are pushed with the
 * trunk nearer the horizontal, as far as measured pushers incline at the
 * handles' height (`pushSledStance`), and from bent knees, the body sinking
 * as far as keeps each wrist within the arm's reach as the walk rises;
 * the hands reach the handles in that time and grip them from its end, each
 * fist's grip socket on its handle as a grasp lays it (`HumanHand.reach`:
 * the palm into the bar along the handle's `-Y`, the thumb's side along its
 * `+X`), turned about the handle as far as its symmetry makes the same grasp
 * and slid along its grip band to whichever grasp the arm, its wrist within
 * range, keeps nearest the handle through the push (the shared chooser,
 * `HumanFreedomChoice`), so the handle is in the fist. Each hand's place is
 * then kept in the chest's frame for the rest of the push, its turn kept
 * with it; a turn the arm cannot meet gives way about the grip socket.
 *
 * First pass: the load slides with the grip and is not dragged by a
 * friction; the push's force and the slowing it brings to the walk are not
 * modelled.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lean, how the hands come to the handles and stay, how the load moves and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A walk with both arms and a trunk lean written over it, the load moved by the grip relation every held prop has; not an overlay, since a walk does not yield its trunk.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the settle's and the grasp search's constants, the parameters and the plan; the bound a fist may stray off its handle is the held-tool verdict's (`StrikingRoll.MISS`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are the prop's own affordances, read where the prop stands.
 */
export namespace pushSled {
  /** The action's name. */
  export const name: HumanActionKey = "pushSled";

  /** Cancel table: the push may be left at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };


  /** Seconds to lean in and take the handles (provisional). */
  export const SETTLE: number = 0.6;

  /** The instants of the push after the grip a grasp is judged at, shares of the push (search resolution: a quarter of it apart). */
  export const SAMPLES: readonly number[] = [0.25, 0.5, 0.75, 1];

  /** The refinement step of a hand's turn about a round handle, and the spacing of the turns tried first round it, degrees (search resolution: an eighth of a turn, halving to under 6). */
  export const TURN: number = 45;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The load, its two handles, the lean and the length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are named affordances of the prop.
   */
  export interface IParams {
    /** The pushed prop's subject id. */
    sled: string;

    /** Where the walk goes, world metres. */
    to: IAutoMovieVector3;

    /** The handle the left hand takes, an affordance id; `left` when absent. */
    left?: string;

    /** The handle the right hand takes, an affordance id; `right` when absent. */
    right?: string;

    /** How far the trunk leans into the load at least, degrees from the vertical in [0, `pushSledStance.RANGE`]; absent, the trunk leans as measured pushers do at the handles' height (`pushSledStance.INCLINES`), which a lean beyond it overrides. */
    lean?: number;
  }

  /**
   * Plan a push.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the lean is out of range, the walk is shorter than the settle, the prop lacks a named handle, or a fist does not reach its handle as the grip closes; and whatever the walk refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The handles are read on the prop's frame at the start; each hand's place on its handle is taken into the leaning chest's frame where the hands arrive and carried with it after, so the load follows the trunk through the grip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The handles, the lean, the chest-held places, the contacts, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bounds refuse; a missing handle refuses with the prop's handles.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per frame a trunk resolve for each hand's carry and elbow and one posture resolve; once per plan, per hand, the tried turns (eight round a round post, `TURN` apart) and at most `HumanFreedomChoice.FITS` refined grasps, each fitted at the grip and at the `SAMPLES` only until it cannot win.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the walk law, the trunk resolver, the shared grasp chooser (`HumanFreedomChoice`), the arm carry and the grip relation; one carry places the hands both in the chooser's judgement and in the posture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan and the held places.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const lean: number = p.lean ?? 0;
    HumanBound.within("lean", lean, 0, pushSledStance.RANGE, "degrees");

    const read: IHumanActionContext.IProp = context.prop(p.sled);
    const frame: IHumanProp.IFrame = read.frame(context.start);
    // A handle where it stands at the grip: its frame (the point, the palm's
    // way in and the wrapped axis), how its grasp repeats about that axis
    // and its grip band's length, none when it declares no band.
    type Handle = {
      frame: HumanHand.IFrame;
      symmetry: IAutoMovieAffordance["symmetry"];
      length: number;
    };
    const handle = (id: string): Handle => {
      const found: IAutoMovieAffordance | undefined = (
        read.prop.affordances ?? []
      ).find((a: IAutoMovieAffordance): boolean => a.id === id);
      if (found === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "handle",
          value: `${p.sled}.${id}`,
          feasible: {
            kind: "alternatives",
            values: (read.prop.affordances ?? []).map(
              (a: IAutoMovieAffordance): string => a.id,
            ),
          },
          reason: `${p.sled} has no handle named ${id}`,
          fix: "name the prop's handles as `left` and `right`",
        });
      // The hand arrives along the handle's -Y, the palm into the bar, and
      // wraps its +X, the thumb's side toward it (`HumanGrasp`).
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        frame.rotation,
        found.frame.rotation,
      );
      return {
        frame: {
          point: Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, found.frame.translation),
          ),
          normal: Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 }),
          forward: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
        },
        symmetry: found.symmetry,
        length: found.length ?? 0,
      };
    };
    const grips: Record<HumanHand.Side, Handle> = {
      left: handle(p.left ?? "left"),
      right: handle(p.right ?? "right"),
    };
    const sockets: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: HumanHand.offset(body, "left", "grip", "fist").point,
      right: HumanHand.offset(body, "right", "grip", "fist").point,
    };
    const walking: IHumanActionContext<walk.IParams> = {
      ...context,
      params: { to: p.to, pace: "slow", armSwing: 0 },
    } as IHumanActionContext<walk.IParams>;
    const base: IHumanActionPlan = walk.plan(walking);
    const duration: number = base.duration;
    HumanBound.above("walk", duration, SETTLE, "s");

    // The trunk inclined into the push by a hinge at the hips, the pelvis
    // and the spine sharing it by the lumbopelvic rhythm
    // (`AutoMovieMotionHumanTrunk.sunk`), and the sink onto bent knees, both
    // read from the handles (`pushSledStance`), a share of the way in.
    const stance: pushSledStance.IStance = pushSledStance.solved(
      body,
      base,
      SETTLE,
      context.entry.feet,
      { left: grips.left.frame, right: grips.right.frame },
      lean,
    );
    const leaned = (posture: IHumanPosture, share: number): IHumanPosture =>
      AutoMovieMotionHumanTrunk.sunk(
        body,
        posture,
        stance.sink * share,
        stance.incline * share,
        0,
      );
    const chest = (posture: IHumanPosture): IAutoMovieResolvedBone =>
      HumanTrunk.resolve(body, posture).get("chest")!;
    const elbow = (
      posture: IHumanPosture,
      side: HumanHand.Side,
    ): IAutoMovieVector3 => {
      const c: IAutoMovieResolvedBone = chest(posture);
      return Vector3.add(
        c.worldPosition,
        Quaternion.rotateVector(c.worldRotation, {
          x: (side === "left" ? 1 : -1) * 0.35,
          y: -0.3,
          z: 0,
        }),
      );
    };

    // A turn's heading about the vertical, degrees; the load turns with the
    // chest's from where the hands arrive (`carry`).
    const heading = (q: IAutoMovieQuaternion): number => {
      const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
        x: 0,
        y: 0,
        z: 1,
      });
      return (Math.atan2(f.x, f.z) * 180) / Math.PI;
    };
    const taking: IHumanPosture = leaned(base.posture(SETTLE), 1);
    const arrived: IAutoMovieResolvedBone = chest(taking);
    const facing: number = heading(arrived.worldRotation);

    // A wrist taken at the grip, on a pushing posture: the load slides on
    // the floor as one rigid thing with the hands, carried along it with the
    // chest's place at the wrist's own height, so the arms take the walk's
    // rise and fall, and turned only with the chest's heading (`turn`, the
    // load's turn there), never tilted by its sway, so both fists keep their
    // places on it.
    const carry = (
      posture: IHumanPosture,
      wrist: HumanHand.IWrist,
    ): { wrist: HumanHand.IWrist; turn: IAutoMovieQuaternion } => {
      const c: IAutoMovieResolvedBone = chest(posture);
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        heading(c.worldRotation) - facing,
      );
      const carried: IAutoMovieVector3 = Vector3.add(
        c.worldPosition,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(wrist.point, arrived.worldPosition),
        ),
      );
      return {
        wrist: {
          point: { x: carried.x, y: wrist.point.y, z: carried.z },
          rotation: Quaternion.normalize(
            Quaternion.multiply(turn, wrist.rotation),
          ),
        },
        turn,
      };
    };

    // An arm's goal on a wrist: where the arm cannot meet its turn, the grip
    // socket stays on the handle and the turn gives.
    const goal = (
      posture: IHumanPosture,
      side: HumanHand.Side,
      wrist: HumanHand.IWrist,
    ): IHumanPosture.IGoal => ({
      point: wrist.point,
      rotation: wrist.rotation,
      contact: sockets[side],
      bend: elbow(posture, side),
    });
    const fit = (
      posture: IHumanPosture,
      side: HumanHand.Side,
      wrist: HumanHand.IWrist,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      limbs[`${side}Arm`] = goal(posture, side, wrist);
      return poseBones(body, resolveHumanPosture(body, { ...posture, limbs }));
    };

    // Where the arms take the handles when the grips close: each hand's turn
    // about its handle, wrapped the whole way round a round post and held at
    // the authored turn (or its half turn) otherwise, and its place along the
    // grip band, chosen by the shared chooser (`HumanFreedomChoice`), judged
    // by the fitted arm at the grip and at `SAMPLES` of the push, the worst
    // counting: the fist sits where the wrist's range holds it through the
    // push. The wrist the arm takes it with is what the push keeps, so the
    // hands never ask a turn the arms gave up, and the load riding one hand
    // stays where the other holds it.
    const pushing: IHumanPosture[] = SAMPLES.map(
      (share: number): IHumanPosture =>
        leaned(base.posture(SETTLE + share * (duration - SETTLE)), 1),
    );
    type Grasp = {
      point: IAutoMovieVector3;
      wrist: HumanHand.IWrist;
      off: number;
    };
    type Held = { wrist: HumanHand.IWrist; off: number };
    const take = (side: HumanHand.Side): Held => {
      const { frame: at, symmetry, length } = grips[side];

      // A turn and a place on the handle: the point, the wrist the arm takes
      // it with, and how far the fitted fist is off the point.
      const grasp = (values: readonly number[]): Grasp => {
        const point: IAutoMovieVector3 = Vector3.add(
          at.point,
          Vector3.scale(at.forward, values[1]!),
        );
        const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          fit(
            taking,
            side,
            HumanHand.reach(
              body,
              side,
              "grip",
              {
                point,
                normal: Quaternion.rotateVector(
                  Quaternion.fromAxisAngle(at.forward, values[0]!),
                  at.normal,
                ),
                forward: at.forward,
              },
              "fist",
            ),
          );
        const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        return {
          point,
          wrist: { point: hand.worldPosition, rotation: hand.worldRotation },
          off: Vector3.length(
            Vector3.subtract(
              HumanHand.frame(body, bones, side, "grip", "fist").point,
              point,
            ),
          ),
        };
      };
      // The turns tried first: round a round post `TURN` apart, nearest the
      // authored turn first, so the search starts on every side of it (the
      // wrist's ranges leave several basins); a half turn on a flat handle.
      const turns: number[] = [0];
      if (symmetry === "round")
        for (let k: number = TURN; k <= 180; k += TURN)
          turns.push(...(k < 180 ? [k, -k] : [k]));
      else if (symmetry === "half") turns.push(180);
      const choice: HumanFreedomChoice.IChoice = HumanFreedomChoice.chosen({
        tried: turns.map((turn: number): number[] => [turn, 0]),
        freedoms: [
          {
            kind: "wrapped",
            step: symmetry === "round" ? TURN : 0,
            period: 360,
          },
          {
            kind: "bounded",
            step: length / 4,
            least: -length / 2,
            greatest: length / 2,
          },
        ],
        judge: function* (
          values: readonly number[],
        ): Generator<number, void, undefined> {
          const taken: Grasp = grasp(values);
          yield taken.off;

          // Through the push the hands and the load are carried as one.
          for (const posture of pushing) {
            const carried: {
              wrist: HumanHand.IWrist;
              turn: IAutoMovieQuaternion;
            } = carry(posture, taken.wrist);
            yield Vector3.length(
              Vector3.subtract(
                HumanHand.frame(
                  body,
                  fit(posture, side, carried.wrist),
                  side,
                  "grip",
                  "fist",
                ).point,
                Vector3.add(
                  carried.wrist.point,
                  Quaternion.rotateVector(
                    carried.turn,
                    Vector3.subtract(taken.point, taken.wrist.point),
                  ),
                ),
              ),
            );
          }
        },
      });
      return { wrist: grasp(choice.values).wrist, off: choice.miss };
    };
    const taken: Record<HumanHand.Side, Held> = {
      left: take("left"),
      right: take("right"),
    };

    // A handle the fist does not keep, as the grip closes or through the
    // push, would be held in the air: the push is refused, the body to stand
    // nearer.
    const most: number = StrikingRoll.MISS;
    for (const side of ["left", "right"] as const) {
      const off: number = taken[side].off;
      if (!(off <= most))
        throw new HumanRefusal({
          kind: "reach",
          axis: "sled",
          value: off,
          feasible: { kind: "range", minimum: 0, maximum: most, unit: "m" },
          reason: `the ${side} fist stays ${(off * 1000).toFixed(0)} mm off its handle at worst as the grip closes or through the push, the arms leaning in at full reach`,
          fix: "stand nearer the sled before pushing it, or push one whose handles are within the arms' reach",
        });
    }

    // The hands reach for the wrists they keep, so the reach ends where the
    // hold begins.
    const kept: Record<HumanHand.Side, HumanHand.IWrist> = {
      left: taken.left.wrist,
      right: taken.right.wrist,
    };
    const fist = {
      ...HumanHand.shape("left", "fist"),
      ...HumanHand.shape("right", "fist"),
    };
    const sides: HumanHand.Side[] = ["left", "right"];
    return {
      duration,
      events: [...base.events, { name: "gripped", share: SETTLE / duration }],
      contacts: [
        ...base.contacts,
        ...sides.map(
          (side: HumanHand.Side): IHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: SETTLE / duration,
            to: 1,
            support: { kind: "prop", subject: p.sled },
          }),
        ),
      ],
      hands: sides,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const share: number = minimumJerk(Math.min(1, t / SETTLE)).s;
        const posture: IHumanPosture = leaned(base.posture(t), share);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of sides)
          limbs[`${side}Arm`] = goal(
            posture,
            side,
            t < SETTLE ? kept[side] : carry(posture, kept[side]).wrist,
          );
        const walked = resolveHumanPosture(body, posture);
        return AutoMovieMotionHumanArm.carry(
          body,
          {
            ...posture,
            joints: { ...posture.joints, ...(t >= SETTLE ? fist : {}) },
            limbs,
          },
          {
            left: AutoMovieMotionHumanArm.angles(walked, "left"),
            right: AutoMovieMotionHumanArm.angles(walked, "right"),
          },
          share,
        );
      },
    };
  }
}
