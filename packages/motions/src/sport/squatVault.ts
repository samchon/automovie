import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSquatVault,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { support } from "../actions/support";
import { supportKey } from "../actions/supportKey";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { getUp } from "../floor/getUp";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * A squat vault over a box: the hands set on the near edge of the box's top,
 * the body tucked over them, a push-off into a flight over the box and a
 * landing on both feet beyond its far edge.
 *
 * The support phase is the support planner's (`support`): from standing the
 * palms are laid on the top at its near edge, then the body tucks over the
 * hands alone in the floor laws' squat (`getUp.POSES`). The flight is ballistic
 * in the root from the push-off under standard gravity
 * (`AutoMovieGravity.STANDARD`), on the least-speed arc from the tucked root to
 * the landing's (the push that reaches it with the least effort), the joints
 * blended from the tuck to the landing on minimum-jerk shares; the flight is
 * declared without turns, so the flight pass gives the whole body's rotation
 * from the angular momentum of none (`IHumanActionPlan.IFlight`,
 * `HumanPerformanceFlight`). The landing is the stand law's quiet stance
 * (`stand.posture`, its joints `getUp.quiet`) with the heels a foot's length
 * past the far edge (provisional), held for `seconds`.
 *
 * The box is the prop's own `surface` affordance: its point the top's middle
 * and its declared `depth` along the prop's own Z, the far edge the end of that
 * depth farther along the heading. A landing that lies no farther ahead than
 * the push-off is refused: no flight carries the body over the box to it.
 * Events: `handsDown`, `tucked` (the push-off), `touchdown`.
 */
export namespace squatVault {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "squatVault";

  /**
   * Cancel table: a vault in the air cannot be cut; standing again once it has
   * landed, from its `touchdown` on.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["touchdown", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /** A vault's least-speed flight. */
  export interface IArc {
    /** `h + sqrt(h² + d²)`, metres. */
    lift: number;

    /** The launch speed, `sqrt(g lift)`, m/s. */
    launch: number;

    /** The launch angle above the level, radians: `atan(lift / d)`. */
    angle: number;

    /** The flight's seconds, `d / (launch cos angle)`. */
    flight: number;

    /** The launch's rising speed, m/s. */
    rise: number;
  }

  /**
   * The least-speed ballistic arc that rises `h` over a run `d`: its speed
   * squared is `g (h + sqrt(h² + d²))` and its angle's tangent `(h + sqrt(h² +
   * d²)) / d`.
   *
   * @param h The rise, metres.
   * @param d The level run, metres.
   * @returns The arc.
   */
  export function arc(h: number, d: number): IArc {
    const lift: number = h + Math.sqrt(h * h + d * d);
    const launch: number = Math.sqrt(AutoMovieGravity.STANDARD * lift);
    const angle: number = Math.atan2(lift, d);
    return {
      lift,
      launch,
      angle,
      flight: d / (launch * Math.cos(angle)),
      rise: launch * Math.sin(angle),
    };
  }
  /**
   * Plan a squat vault.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the prop has no `surface`, the support planner
   *   refuses its stances, or the landing lies no farther ahead than the
   *   push-off.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSquatVault.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const g: number = AutoMovieGravity.STANDARD;
    const yaw: number = context.entry.posture.yaw;
    const heading: IAutoMovieVector3 = HumanFrame.forward(yaw);

    // The box's top and its two edges along its own depth; the far one is
    // the one farther along the heading.
    const surface: ReturnType<typeof WorkoutSupport.placed> =
      WorkoutSupport.placed(context, {
        prop: context.params.on,
        affordance: "surface",
      });
    const top: IAutoMovieVector3 = surface.point;
    const rotation: IAutoMovieQuaternion = surface.frame.rotation;
    const declared: IAutoMovieAffordance = surface.affordance;
    const half: number = (declared.depth ?? 0) / 2;
    const ends: IAutoMovieVector3[] = [-1, 1].map(
      (sign: number): IAutoMovieVector3 =>
        Vector3.add(
          top,
          Quaternion.rotateVector(rotation, { x: 0, y: 0, z: sign * half }),
        ),
    );
    const along: (p: IAutoMovieVector3) => number = (
      p: IAutoMovieVector3,
    ): number => Vector3.dot(p, heading);
    const [near, far]: [IAutoMovieVector3, IAutoMovieVector3] = (
      along(ends[0]!) <= along(ends[1]!) ? ends : [ends[1]!, ends[0]!]
    ) as [IAutoMovieVector3, IAutoMovieVector3];

    // The support phase: the palms on the near edge, then the tuck over them.
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );
    const palm: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanSupport.IContact = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
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
      } as IAutoMovieMotionTarget,
    });
    const feet: IAutoMovieMotionHumanSupport.IContact[] = [
      { part: "leftFoot", kind: "bear" },
      { part: "rightFoot", kind: "bear" },
    ];
    const held: IAutoMovieMotionHumanActionPlan = support.plan({
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
    const tucked: IAutoMovieMotionHumanPosture = held.posture(push);

    // The landing: the quiet stance with the heels a foot's length past the
    // far edge.
    const heel: number = -HumanFoot.offset(body, "left", "heel").z;
    const ground: IAutoMovieVector3 = Vector3.add(
      { ...far, y: 0 },
      Vector3.scale(heading, heel + body.measure.footLength),
    );
    const landing: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      ground,
      yaw,
    );
    // The landing by its joints alone, its legs' goals resolved, which the
    // flight's blend reaches (`getUp.quiet`).
    const landed: IAutoMovieMotionHumanPosture = {
      ...landing,
      joints: { ...landing.joints, ...getUp.quiet(body).joints },
      limbs: {},
    };
    const flyingShape: ReturnType<typeof supportKey.prepareBlended> =
      supportKey.prepareBlended(body, tucked, landed);

    // The flight: the least-speed ballistic arc from the tucked root to the
    // landing's, the push that reaches it with the least effort. For a rise
    // `h` over a run `d` its speed squared is `g (h + sqrt(h^2 + d^2))` and
    // its angle's tangent `(h + sqrt(h^2 + d^2)) / d`.
    const run: IAutoMovieVector3 = {
      ...Vector3.subtract(landing.root, tucked.root),
      y: 0,
    };
    const d: number = Vector3.length(run);
    const h: number = landing.root.y - tucked.root.y;
    if (!(d > 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "on",
        value: context.params.on,
        reason: `the landing beyond ${context.params.on} lies ${d.toFixed(3)} m ahead of the push-off, so no flight carries the body over it`,
        fix: "vault a box that lies ahead of the body",
      });
    const { flight, rise }: squatVault.IArc = arc(h, d);
    const speed: IAutoMovieVector3 = Vector3.scale(run, 1 / flight);
    const hold: number = context.params.hold ?? 0.5;
    const touchdown: number = push + flight;
    const duration: number = touchdown + hold;
    const share: (s: number) => number = (s: number): number =>
      (s * push) / duration;
    return {
      duration,
      prepare: (): void => held.prepare?.(),
      base: { kind: "standing" },
      events: [
        ...held.events.map(
          (e: IPlanE): IPlanResult => ({
            name: e.name,
            share: share(e.share),
          }),
        ),
        { name: "touchdown", share: touchdown / duration },
      ],
      contacts: [
        ...held.contacts.map(
          (
            w: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow => ({
            ...w,
            from: share(w.from),
            to: share(w.to),
          }),
        ),
        ...(["leftFoot", "rightFoot"] as const).map(
          (part: PlanPart): IAutoMovieMotionHumanContactWindow => ({
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
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= push) return held.posture(t, channels, resolution, projection);
        if (t >= touchdown) return landing;
        const u: number = t - push;
        const shaped: IAutoMovieMotionHumanPosture = flyingShape(
          minimumJerk.share(u / flight),
        );
        return {
          ...shaped,
          root: {
            x: tucked.root.x + speed.x * u,
            y: tucked.root.y + rise * u - 0.5 * g * u * u,
            z: tucked.root.z + speed.z * u,
          },
        };
      },
    };
  }
}

/** The alternatives of `PlanPart`'s site. */
type PlanPart = "leftFoot" | "rightFoot";

/** The record of `IPlanResult`'s site. */
type IPlanResult = { name: string; share: number };

/** The record of `IPlanE`'s site. */
type IPlanE = {
  name: string;
  share: number;
};
