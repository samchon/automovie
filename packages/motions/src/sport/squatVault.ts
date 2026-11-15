import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { stand } from "../actions/stand";
import { support } from "../actions/support";
import { supportKey } from "../actions/supportKey";
import type { IHumanBody } from "../body/IHumanBody";
import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { getUp } from "../floor/getUp";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A squat vault over a box: the hands set on the near edge of the box's
 * top, the body tucked over them, a push-off into a flight over the box and
 * a landing on both feet beyond its far edge.
 *
 * The support phase is the support planner's (`support`): from standing
 * the palms are laid on the top at its near edge, then the body tucks over
 * the hands alone in the floor laws' squat (`getUp.POSES`). The flight is
 * ballistic in the root from the push-off under standard gravity
 * (`AutoMovieGravity.STANDARD`), the vertical speed nought there (a
 * horizontal push), its time the fall from the tucked root to the
 * landing's and its horizontal speed the distance over that time, the
 * joints blended from the tuck to the landing on minimum-jerk shares; the
 * flight is declared without turns, so the flight pass gives the whole
 * body's rotation from the angular momentum of none
 * (`IHumanActionPlan.IFlight`, `HumanPerformanceFlight`). The landing is
 * the stand law's quiet stance (`stand.posture`, its joints `getUp.quiet`)
 * with the heels a foot's length past the far edge (provisional), held for
 * `seconds`.
 *
 * The box is the prop's own `surface` affordance: its point the top's
 * middle and its declared `depth` along the prop's own Z, the far edge the
 * end of that depth farther along the heading. A push-off no higher than
 * the landing's root is refused: a horizontal push cannot fly from it.
 * Events: `handsDown`, `tucked` (the push-off), `touchdown`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases with their owners, the flight's derivation, the box's reading, the refusal, the events and the provisional landing place.
 * @evidence contracts/development/design.md#principled-representation A law record composing the support planner's keys, a ballistic flight and the quiet stance, over the prop's own affordance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The box is the prop's affordance, gravity the engine's and the speeds follow from the heights; no height or speed is typed.
 */
export namespace squatVault {
  /** The action's name. */
  export const name: HumanActionKey = "squatVault";

  /** Cancel table: a vault in the air cannot be cut; standing again once it has landed. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0.9, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The box by its subject id and the landing's hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A subject id, resolved through the prop's own affordance.
   */
  export interface IParams {
    /** The box vaulted over, its subject id; its `surface` is the top the hands are set on. */
    on: string;

    /** How long the landing is held, seconds; 0.5 when absent. */
    seconds?: number;
  }

  /**
   * Plan a squat vault.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the prop has no `surface`, the support planner refuses its stances, or the push-off is no higher than the landing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The support planner's keys to the push-off, then a ballistic root under gravity from rest vertically, then the quiet stance beyond the far edge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The box's edges, the support plan, the landing, the flight, one posture function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A box too low to fly from is refused, never given a made-up vertical speed.
   * @evidence contracts/development/implementation.md#efficient-algorithms The support keys are solved once; a flight posture is one blend and a closed-form root.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the support planner, its key blend, the workout's support reading, the engine's gravity and the stand law's posture.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the support plan and the landing.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const g: number = AutoMovieGravity.STANDARD;
    const yaw: number = context.entry.posture.yaw;
    const heading: IAutoMovieVector3 = HumanFrame.forward(yaw);

    // The box's top and its two edges along its own depth; the far one is
    // the one farther along the heading.
    const top: IAutoMovieVector3 = WorkoutSupport.at(context, {
      prop: context.params.on,
      affordance: "surface",
    });
    const read: IHumanActionContext.IProp = context.prop(context.params.on);
    const rotation: IAutoMovieQuaternion = read.frame(context.start).rotation;
    const declared: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === "surface");
    const half: number = (declared?.depth ?? 0) / 2;
    const ends: IAutoMovieVector3[] = [-1, 1].map(
      (sign: number): IAutoMovieVector3 =>
        Vector3.add(
          top,
          Quaternion.rotateVector(rotation, { x: 0, y: 0, z: sign * half }),
        ),
    );
    const along = (p: IAutoMovieVector3): number => Vector3.dot(p, heading);
    const [near, far] = (
      along(ends[0]!) <= along(ends[1]!) ? ends : [ends[1]!, ends[0]!]
    ) as [IAutoMovieVector3, IAutoMovieVector3];

    // The support phase: the palms on the near edge, then the tuck over them.
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );
    const palm = (side: "left" | "right"): HumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "bear",
      target: {
        kind: "point",
        frame: "world",
        at: Vector3.add(
          near,
          Vector3.scale(
            left,
            (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth,
          ),
        ),
      } as AutoMovieMotionTarget,
    });
    const feet: HumanSupport.IContact[] = [
      { part: "leftFoot", kind: "bear" },
      { part: "rightFoot", kind: "bear" },
    ];
    const held: IHumanActionPlan = support.plan({
      ...context,
      params: {
        stances: [
          {
            contacts: [...feet, palm("left"), palm("right")],
            event: "handsDown",
          },
          {
            contacts: [palm("left"), palm("right")],
            prefer: getUp.POSES.squat,
            event: "tucked",
          },
        ],
      },
    });
    const push: number = held.duration;
    const tucked: IHumanPosture = held.posture(push);

    // The landing: the quiet stance with the heels a foot's length past the
    // far edge.
    const heel: number = -HumanFoot.offset(body, "left", "heel").z;
    const ground: IAutoMovieVector3 = Vector3.add(
      { ...far, y: 0 },
      Vector3.scale(heading, heel + body.measure.footLength),
    );
    const landing: IHumanPosture = stand.posture(body, ground, yaw);
    // The landing by its joints alone, its legs' goals resolved, which the
    // flight's blend reaches (`getUp.quiet`).
    const landed: IHumanPosture = {
      ...landing,
      joints: { ...landing.joints, ...getUp.quiet(body).joints },
      limbs: {},
    };

    // The flight: a horizontal push, so the time is the fall from the
    // tucked root to the landing's.
    const drop: number = tucked.root.y - landing.root.y;
    if (!(drop > 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "on",
        value: context.params.on,
        reason: `the push-off's root stands ${(-drop).toFixed(3)} m below the landing's, so no horizontal push flies over ${context.params.on}`,
        fix: "vault a box high enough to push off from",
      });
    const flight: number = Math.sqrt((2 * drop) / g);
    const speed: IAutoMovieVector3 = Vector3.scale(
      { ...Vector3.subtract(landing.root, tucked.root), y: 0 },
      1 / flight,
    );
    const hold: number = context.params.seconds ?? 0.5;
    const touchdown: number = push + flight;
    const duration: number = touchdown + hold;
    const share = (s: number): number => (s * push) / duration;
    return {
      duration,
      base: { kind: "standing" },
      events: [
        ...held.events.map(
          (e: { name: string; share: number }): { name: string; share: number } => ({
            name: e.name,
            share: share(e.share),
          }),
        ),
        { name: "touchdown", share: touchdown / duration },
      ],
      contacts: [
        ...held.contacts.map(
          (w: IHumanContactWindow): IHumanContactWindow => ({
            ...w,
            from: share(w.from),
            to: share(w.to),
          }),
        ),
        ...(["leftFoot", "rightFoot"] as const).map(
          (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
            part,
            kind: "plant",
            from: touchdown / duration,
            to: 1,
            support: { kind: "ground" },
          }),
        ),
      ],
      flight: {
        from: push / duration,
        to: touchdown / duration,
        momentum: { kind: "turns", somersault: 0, twist: 0 },
      },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= push) return held.posture(t);
        if (t >= touchdown) return landing;
        const u: number = t - push;
        const shaped: IHumanPosture = supportKey.blended(
          body,
          tucked,
          landed,
          minimumJerk(u / flight).s,
        );
        return {
          ...shaped,
          root: {
            x: tucked.root.x + speed.x * u,
            y: tucked.root.y - 0.5 * g * u * u,
            z: tucked.root.z + speed.z * u,
          },
        };
      },
    };
  }
}
