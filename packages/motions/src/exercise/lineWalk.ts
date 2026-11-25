import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLineWalk,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { AutoMovieMotionHumanFootSwing } from "../compose/AutoMovieMotionHumanFootSwing";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanToesOnFloor } from "../compose/AutoMovieMotionHumanToesOnFloor";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { ExerciseKey } from "./ExerciseKey";
import type { ILineWalkFall } from "./ILineWalkFall";
import { lineWalkFootprints } from "./lineWalkFootprints";
import { lineWalkPole } from "./lineWalkPole";

/**
 * A walk along a line too narrow for a normal gait (balance beam, tightrope).
 * Each step puts a foot one foot's length ahead of the other on the line, heel
 * to toe, turned out `TURN` degrees from it; a stepping foot swings over
 * `SWING` of a `PERIOD`-second step while the other bears, passing the bearing
 * shank on its own side by the two shanks' radii at the crossing; a foot holds
 * the line under its ball and its heel rises about that ball. The hips travel
 * along the line between the feet on minimum-jerk progress and sway across it,
 * `SWAY` of the stature at the stride's period, corrected back over the line at
 * each footfall; the arms are held out to the sides for balance.
 *
 * The line is the prop's: a beam's `surface` along its depth, a rope's or a
 * bar's `bar` along its length, at its top. Refused: an entry whose feet are
 * not on the line's top, and a stopping point beyond either end of the line.
 *
 * A rope or wire may sag (`sag`): the footprints follow the parabola of that
 * sag, and a sag too shallow for the span is refused because the tension it
 * needs, `W L / (4 sag)`, exceeds the line's working load `LOAD`. A balancing
 * pole (`pole`, `lineWalkPole`) is held in both hands at its grips, carried
 * with the hips.
 *
 * First pass: the sway is kinematic, not a balance controller; the line's sag
 * is static, not deflected under each step.
 *
 * Events: `step1` to `stepN` at each footfall, `relax`.
 */
export namespace lineWalk {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "balanceWalk";

  /**
   * Cancel table: once the last foot is down, into standing or another line
   * walk.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      balanceWalk: ["fromRelax", "smooth"],
    });

  /** Seconds per step, a careful balance walk's (provisional). */
  export const PERIOD: number = 0.9;

  /** The share of a step the stepping foot is in the air (provisional). */
  export const SWING: number = 0.5;

  /** Each foot's turn out from the line, degrees (provisional). */
  export const TURN: number = 15;

  /**
   * The hips' sway across the line, a share of the stature (provisional, within
   * a few centimetres).
   */
  export const SWAY: number = 0.01;

  /**
   * How far the hips walk below their standing height, a share of the stature:
   * the soft knees of a balance walk (provisional).
   */
  export const CROUCH: number = 0.03;

  /**
   * A tightrope's working load, newtons (provisional: a walking wire's rated
   * tension).
   */
  export const LOAD: number = lineWalkFootprints.LOAD;

  /**
   * How far an entry foot may stand off the line's top, metres: half a foot's
   * width.
   */
  export const ON: number = 0.05;

  /**
   * Plan a line walk.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the prop lacks the affordance, an entry foot is
   *   off the line's top, the step count is not a positive whole number, or the
   *   stopping point lies beyond the line.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLineWalk.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanLineWalk.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The line: its top point, direction and half length.
    const id: string = p.on.affordance ?? "surface";
    const read: IAutoMovieMotionHumanPropReader = context.prop(p.on.prop);
    const placed: IAutoMovieRigidTransform = read.frame(context.start);
    const found: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === id);
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: p.on.prop,
        reason: `${p.on.prop} declares no ${id}`,
        fix: "name a beam's surface or a rope's bar",
      });
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      placed.rotation,
      found.frame.rotation,
    );
    const top: IAutoMovieVector3 = Vector3.add(
      placed.position,
      Quaternion.rotateVector(placed.rotation, found.frame.translation),
    );
    const along: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(
        rotation,
        found.kind === "bar" ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 },
      ),
    );
    const half: number =
      ((found.kind === "bar" ? found.length : found.depth) ?? Infinity) / 2;
    const ankle: number = body.rest.get("leftFoot")!.y;
    const onLine: (point: IAutoMovieVector3) => number = (
      p: IAutoMovieVector3,
    ): number => Vector3.dot(Vector3.subtract(p, top), along);

    // The entry stands on the line's top.
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieVector3 = context.entry.feet[side].ankle;
      const off: number = Math.abs(foot.y - ankle - top.y);
      const across: number = Vector3.length(
        Vector3.subtract(
          { ...Vector3.subtract(foot, top), y: 0 },
          Vector3.scale(along, onLine(foot)),
        ),
      );
      if (
        off > ON ||
        across > ON + Math.abs(body.rest.get(`${side}UpperLeg`)!.x)
      )
        throw new HumanRefusal({
          kind: "base",
          axis: "on",
          value: p.on.prop,
          reason: `the ${side} foot stands ${(off * 1000).toFixed(0)} mm above or below and ${(across * 1000).toFixed(0)} mm beside the line`,
          fix: "stand on the line before walking along it",
        });
    }

    // The footprints: a foot's length apart along the line to the stop.
    const start: number = onLine(entry.root);
    const stop: number = onLine(p.to);
    if (!(Math.abs(stop) <= half))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: stop,
        feasible: { kind: "range", minimum: -half, maximum: half, unit: "m" },
        reason: `the stop lies ${stop.toFixed(2)} m along a line ${(2 * half).toFixed(2)} m long`,
        fix: "stop on the line",
      });
    const length: number = body.measure.footLength;
    const { steps, step }: lineWalkFootprints.IPace = lineWalkFootprints.pace(
      start,
      stop,
      length,
      p.steps,
    );
    const sign: number = Math.sign(step) || 1;
    const yaw: number =
      (Math.atan2(along.x * sign, along.z * sign) * 180) / Math.PI;
    // A sagging line: the walker's weight at the middle needs a tension
    // `W L / (4 sag)`, refused beyond the line's working load.
    const sag: number = p.sag ?? 0;
    lineWalkFootprints.sagged(body.profile.mass, half, sag);
    const point: (s: number) => IAutoMovieVector3 = (
      s: number,
    ): IAutoMovieVector3 => {
      const u: number = half === Infinity ? 0.5 : (s + half) / (2 * half);
      return {
        ...Vector3.add(top, Vector3.scale(along, s)),
        y: top.y + ankle - 4 * sag * u * (1 - u),
      };
    };
    const print: (
      side: AutoMovieHumanSide,
      s: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
      s: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: point(s),
      rotation: HumanFoot.rotation(yaw + (side === "left" ? TURN : -TURN), 0),
    });
    const first: AutoMovieHumanSide = "right";
    const other: (side: AutoMovieHumanSide) => AutoMovieHumanSide = (
      side: AutoMovieHumanSide,
    ): AutoMovieHumanSide => (side === "left" ? "right" : "left");
    const duration: number = steps * PERIOD;
    const events: IAutoMovieMotionEvent[] = [];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    const support: IAutoMovieMotionHumanContactWindow["support"] = {
      kind: "prop",
      subject: p.on.prop,
    };

    // Each foot's footfall seconds and placements: the stepping foot of
    // step k lands at the k-th footprint at the end of its swing.
    const falls: Record<AutoMovieHumanSide, ILineWalkFall[]> = {
      left: [
        {
          at: 0,
          place: {
            ankle: context.entry.feet.left.ankle,
            rotation: context.entry.feet.left.rotation,
          },
        },
      ],
      right: [
        {
          at: 0,
          place: {
            ankle: context.entry.feet.right.ankle,
            rotation: context.entry.feet.right.rotation,
          },
        },
      ],
    };
    for (let k: number = 1; k <= steps; k++) {
      const side: AutoMovieHumanSide = k % 2 === 1 ? first : other(first);
      const lands: number = (k - 1) * PERIOD + SWING * PERIOD;
      falls[side].push({ at: lands, place: print(side, start + k * step) });
      events.push({ name: `step${k}`, share: lands / duration });
    }
    // The foot that does not step last closes beside the other.
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    // Each foot's own side of the line, and how far a swinging ankle passes the bearing one: the two shank colliders' radii.
    const heading: IAutoMovieVector3 = Vector3.scale(along, sign);
    const leftward: IAutoMovieVector3 = Vector3.normalize({
      x: heading.z,
      y: 0,
      z: -heading.x,
    });
    const outward: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: leftward,
      right: Vector3.scale(leftward, -1),
    };
    const passing: number = 2 * body.measure.shankRadius;
    for (const side of ["left", "right"] as const) {
      const list: ILineWalkFall[] = falls[side];
      const placementAt: (t: number) => IAutoMovieMotionHumanFoot.IPlacement = (
        t: number,
      ): IAutoMovieMotionHumanFoot.IPlacement => {
        // The last footfall landed by now, and the next one it swings to.
        let i: number = 0;
        while (i + 1 < list.length && list[i + 1]!.at <= t) i++;
        const next: ILineWalkFall | undefined = list[i + 1];
        if (next === undefined) return list[i]!.place;
        const lift: number = next.at - SWING * PERIOD;
        if (t <= lift) return list[i]!.place;
        const time: number = (t - lift) / (SWING * PERIOD);
        const swung: IAutoMovieMotionHumanFoot.IPlacement =
          AutoMovieMotionHumanFootSwing(
            body,
            side,
            list[i]!.place,
            next.place,
            0.03 * body.measure.stature,
            time,
          );
        // Heel to toe on one line, a swinging foot passes the bearing shank on
        // its own side (`passing`), back on the line at each end.
        return {
          ...swung,
          ankle: Vector3.add(
            swung.ankle,
            Vector3.scale(
              outward[side],
              passing * Math.sin(Math.PI * Math.min(1, Math.max(0, time))),
            ),
          ),
        };
      };
      // The second the foot last landed, or the start.
      const lands: (t: number) => number = (t: number): number => {
        let at: number = -Infinity;
        for (const f of list) if (f.at > 0 && f.at <= t) at = f.at;
        return at;
      };
      // The second the foot next lifts, or never.
      const lifts: (t: number) => number = (t: number): number => {
        for (const f of list)
          if (f.at > 0 && f.at - SWING * PERIOD >= t)
            return f.at - SWING * PERIOD;
        return Infinity;
      };
      const planted: (t: number) => boolean = (t: number): boolean =>
        list.every(
          (f: ILineWalkFall): boolean =>
            !(t > f.at - SWING * PERIOD && t < f.at) || f.at === 0,
        );
      const leg: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.place(
        {
          body,
          side,
          from: 0,
          to: duration,
          placement: (
            posture: IAutoMovieMotionHumanPosture,
            t: number,
          ): IAutoMovieMotionHumanFoot.IPlacement =>
            AutoMovieMotionHumanFootRelax(
              body,
              posture,
              side,
              placementAt(t),
              planted(t)
                ? AutoMovieMotionHumanFootRelax.load(t, lifts(t), lands(t))
                : 0,
              true,
              true,
            ),
          planted,
        },
      );
      // A foot risen on its ball bends its toes back onto the line, so their
      // tips never pass under it and slide as the heel rises.
      primitives.push(
        AutoMovieMotionHumanToesOnFloor.row(
          body,
          side,
          leg,
          (at: IAutoMovieVector3): number => point(onLine(at)).y - ankle,
        ),
      );
      for (let i: number = 0; i < list.length; i++) {
        const from: number = list[i]!.at;
        const to: number =
          i + 1 < list.length ? list[i + 1]!.at - SWING * PERIOD : duration;
        if (to > from)
          contacts.push({
            part: `${side}Foot`,
            kind: "plant",
            from: from / duration,
            to: to / duration,
            support,
            socket: "ball",
          });
      }
    }

    // The hips between the feet, swaying across the line; the arms out.
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const across: IAutoMovieVector3 = { x: along.z, y: 0, z: -along.x };
    const arms: IAutoMovieMotionHumanExerciseKey.IKey["joints"] =
      ExerciseKey.from(body, {}, { shoulder: 0, raise: 80, elbow: 10 }).joints;
    const hipsAt: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      // Step k carries the hips one step on along the line.
      const k: number = Math.min(steps - 1, Math.floor(t / PERIOD));
      const s: number =
        start + step * (k + minimumJerk.share(Math.min(1, t / PERIOD - k)));
      const sway: number =
        SWAY * body.measure.stature * Math.sin((Math.PI * t) / PERIOD);
      return Vector3.add(
        {
          ...point(s),
          y: point(s).y - ankle + hipsRest.y - CROUCH * body.measure.stature,
        },
        Vector3.scale(across, sway),
      );
    };
    // A balancing pole: each hand keeps its grip where it held it at the
    // start, in the frame that travels with the hips.
    const pole: ReturnType<typeof lineWalkPole> | undefined =
      p.pole === undefined
        ? undefined
        : lineWalkPole(context, p.pole, { origin: hipsAt(0), yaw });
    if (pole !== undefined) contacts.push(...pole.contacts);
    primitives.push({
      channels: ["root", "trunk", "leftArm", "rightArm"],
      reads: ["root", "trunk"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
      ): IAutoMovieMotionHumanPosture => {
        const hips: IAutoMovieVector3 = hipsAt(t);
        const turned: IAutoMovieMotionHumanPosture = {
          ...posture,
          yaw,
          joints:
            pole !== undefined
              ? posture.joints
              : {
                  ...posture.joints,
                  leftUpperArm: arms.leftUpperArm ?? [0, 0, 0],
                  rightUpperArm: arms.rightUpperArm ?? [0, 0, 0],
                  leftLowerArm: arms.leftLowerArm ?? [0, 0, 0],
                  rightLowerArm: arms.rightLowerArm ?? [0, 0, 0],
                },
          limbs:
            pole === undefined
              ? posture.limbs
              : { ...posture.limbs, ...pole.limbs({ origin: hips, yaw }) },
        };
        return {
          ...turned,
          root: Vector3.subtract(
            hips,
            Quaternion.rotateVector(humanPostureHeading(turned), hipsRest),
          ),
        };
      },
    });
    events.push({ name: "relax", share: 1 });
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(
      duration,
      events.map(
        (e: IAutoMovieMotionEvent): IAutoMovieMotionClockInstant => ({
          name: e.name,
          seconds: e.share * duration,
        }),
      ),
    );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      primitives,
    });
  }
}
