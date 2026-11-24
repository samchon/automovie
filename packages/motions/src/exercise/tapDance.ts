import {
  ANKLE_DORSIFLEXION,
  AutoMovieGravity,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTapDance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../actions/walkLeg";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { DanceFootwork } from "./DanceFootwork";
import { ExerciseKey } from "./ExerciseKey";
import { dance } from "./dance";
import { prepareDanceBeats } from "./prepareDanceBeats";
import { tapDanceSteps } from "./tapDanceSteps";

/** The alternatives of `SetSocket`'s site. */
type SetSocket = "ball" | "heel";

/**
 * Tap dance on the dance law's beat clock. Each step is a table of strikes in
 * quarter beats from its first beat (`tapDanceSteps.STEPS`): which foot (the
 * leading one or the other), how it is set down (on the ball with the heel up
 * `PITCH` degrees, on the heel with the toes up, or flat), where (in place, or
 * `REACH` foot lengths ahead or behind where it stood), whether it then bears,
 * and the part that sounds, if any. A brush passes through its strike without
 * bearing.
 *
 * - Shuffle: the ball brushes forward on the "and" and back on the beat.
 * - Flap: a forward brush, then the ball steps down ahead and takes the weight.
 * - Ball change: weight to the ball behind, then back onto the other foot.
 * - Heel drop: up onto the ball, the heel dropped on the beat.
 * - Cramp roll: ball, ball, heel, heel, one a quarter beat.
 * - Time step (single): a shuffle, a hop on the other foot, a step, a flap and a
 *   step.
 *
 * A foot travels to a strike over at most `TRAVEL` of a beat, lifted `LIFT` of
 * the stature. The hips ride over the feet's midpoint, `CROUCH` of the stature
 * low on soft knees, no lower than a flat step's shank allows its unloaded
 * ankle as it lands; while no foot bears (the hop) they fly the ballistic arc
 * whose flight time that span is. Repeats alternate the leading foot, each
 * starting where the last left the feet.
 *
 * Events: `beat{k}`, each sounding strike's `strike{n}{Side}{Part}`, `relax`.
 */
export namespace tapDance {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "tapDance";

  /**
   * Cancel table: from the last beat, into standing, another tap step or a
   * dance.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      tapDance: ["fromRelax", "smooth"],
      dance: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The foot's pitch on its ball or its heel, degrees (provisional). */
  export const PITCH: number = 20;

  /**
   * How far a brush or a step reaches ahead or behind, foot lengths
   * (provisional).
   */
  export const REACH: number = 0.4;

  /** The longest travel into a strike, a share of a beat. */
  export const TRAVEL: number = 0.2;

  /** How high a travelling foot lifts, a share of the stature (provisional). */
  export const LIFT: number = 0.03;

  /** How low the hips ride on soft knees, a share of the stature (provisional). */
  export const CROUCH: number = 0.03;

  /**
   * Plan tap steps.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the tempo is not positive, the repeat count is
   *   not a positive whole number, or the locked track has too few beats.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTapDance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanTapDance.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const repeats: number = HumanBound.whole("repeats", p.repeats ?? 1);
    const step: tapDanceSteps.IStep = tapDanceSteps.STEPS[p.step];
    const beats: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
      context,
      p.bpm ?? dance.BPM,
      step.beats * repeats,
      p.lock,
    );
    const quarter: (k: number) => number = (k: number): number =>
      beats.at(1 + k / 4);
    const travel: number = TRAVEL * beats.period;
    const lift: number = LIFT * body.measure.stature;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const reach: number = REACH * body.measure.footLength;

    // Each foot's keys: the entry stance, then every strike in turn.
    const keys: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanDanceFootKey[]
    > = {
      left: [stood(context, "left")],
      right: [stood(context, "right")],
    };
    const ground: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: keys.left[0]!.place,
      right: keys.right[0]!.place,
    };
    const instants: IAutoMovieMotionClockInstant[] = [];
    const flats: IFlat[] = [];
    let sounded: number = 0;
    for (let r: number = 0; r < repeats; r++) {
      const lead: AutoMovieHumanSide =
        (r % 2 === 0) === ((p.side ?? "right") === "right") ? "right" : "left";
      const home: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.IPlacement
      > = {
        ...ground,
      };
      for (const strike of step.strikes) {
        const side: AutoMovieHumanSide =
          strike.foot === "lead" ? lead : lead === "left" ? "right" : "left";
        const at: number = quarter(4 * step.beats * r + strike.at);
        const list: IAutoMovieMotionHumanDanceFootKey[] = keys[side];
        const before: IAutoMovieMotionHumanDanceFootKey =
          list[list.length - 1]!;
        before.leave = Math.max(before.at, Math.min(before.leave, at - travel));
        const shift: number =
          strike.where === "front"
            ? reach
            : strike.where === "back"
              ? -reach
              : 0;
        const target: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: Vector3.add(home[side].ankle, Vector3.scale(forward, shift)),
          rotation: home[side].rotation,
        };
        if (strike.bears) ground[side] = target;
        if (strike.bears && strike.mode === "flat")
          flats.push({ at, ankle: target.ankle });
        list.push({
          at,
          leave: strike.bears ? Infinity : at,
          place: set(body, side, target, strike.mode),
          bears: strike.bears,
          clearance: strike.roll === true ? 0 : lift,
        });
        if (strike.sound !== undefined)
          instants.push({
            name: `strike${++sounded}${capital(side)}${capital(strike.sound)}`,
            seconds: at,
          });
      }
    }
    const end: number = beats.at(beats.count) + beats.period;
    for (const side of ["left", "right"] as const) {
      const final: IAutoMovieMotionHumanDanceFootKey =
        keys[side][keys[side].length - 1]!;
      final.leave = Math.max(final.at, end);
    }

    // The feet, and the spans where neither bears: the hop's flights.
    const support: IAutoMovieMotionHumanContactWindow["support"] = {
      kind: "ground",
    };
    const left: DanceFootwork.IFoot = DanceFootwork.foot(
      body,
      "left",
      keys.left,
      end,
      support,
    );
    const right: DanceFootwork.IFoot = DanceFootwork.foot(
      body,
      "right",
      keys.right,
      end,
      support,
    );
    const flights: readonly IFlight[] = unsupported(keys, end);
    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    const ankle: number = body.rest.get("leftFoot")!.y;
    // The hips ride `CROUCH` low, no lower than lets each flat step's foot
    // keep its shank within the unloaded ankle's range (`flat`), with the
    // hips over the feet's midpoint as far ahead of it as they are when it
    // lands: a flat step sounds heel and ball as it lands, before it bears.
    const crouch: number = Math.min(
      CROUCH * body.measure.stature,
      ...flats.map((f: IFlat): number =>
        flat(
          body,
          Vector3.dot(
            Vector3.subtract(
              Vector3.lerp(
                left.placed(f.at).ankle,
                right.placed(f.at).ankle,
                0.5,
              ),
              f.ankle,
            ),
            forward,
          ),
        ),
      ),
    );
    const floor: number =
      (context.entry.feet.left.ankle.y + context.entry.feet.right.ankle.y) / 2 -
      ankle;
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 10, raise: 25, elbow: 35 },
    ).joints;
    for (let k: number = 1; k <= beats.count; k++)
      instants.push({ name: `beat${k}`, seconds: beats.at(k) });
    instants.push({ name: "relax", seconds: beats.at(beats.count) });
    return DanceFootwork.compose(
      body,
      entry,
      {
        duration: end,
        left: keys.left,
        right: keys.right,
        hips: (t: number): IAutoMovieVector3 => {
          const mid: IAutoMovieVector3 = Vector3.lerp(
            left.placed(t).ankle,
            right.placed(t).ankle,
            0.5,
          );
          return {
            x: mid.x,
            y: floor + rest.y - crouch + hop(flights, t),
            z: mid.z,
          };
        },
        yaw: (): number => entry.yaw,
        joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
        instants,
      },
      support,
    );
  }
  /**
   * A flat step that takes the weight: when it lands and where its ankle is
   * set.
   */
  interface IFlat {
    /** Action seconds it lands. */
    at: number;

    /** Its ankle, world metres. */
    ankle: IAutoMovieVector3;
  }

  /** A span with no foot bearing, action seconds. */
  interface IFlight {
    /** When the last bearing foot leaves. */
    from: number;

    /** When the next lands. */
    to: number;
  }

  /**
   * The deepest crouch below straight legs at which a foot set down flat keeps
   * its shank within the unloaded ankle's dorsal range, less the walk's margin
   * (`ANKLE_DORSIFLEXION.unloaded − walkLeg.ANKLE`), with the hip `ahead` of
   * the ankle along the heading: the knee `s` from the ankle at that lean φ,
   * the hip `t` from the knee, so the hip stands `H = s·cos φ + √(t² − (ahead −
   * s·sin φ)²)` above the ankle at least (law of cosines on the leg's two
   * segments).
   */
  function flat(body: IAutoMovieMotionHumanBody, ahead: number): number {
    const t: number = body.measure.thigh;
    const s: number = body.measure.shank;
    const lean: number =
      ((ANKLE_DORSIFLEXION.unloaded - walkLeg.ANKLE) * Math.PI) / 180;
    const across: number = ahead - s * Math.sin(lean);
    const least: number =
      s * Math.cos(lean) + Math.sqrt(Math.max(0, t * t - across * across));
    const straight: number =
      body.rest.get("leftUpperLeg")!.y - body.rest.get("leftFoot")!.y;
    return Math.max(0, straight - least);
  }

  /** The entry stance's key. */
  function stood(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTapDance.IParams>,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanDanceFootKey {
    return {
      at: 0,
      leave: Infinity,
      place: {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      },
      bears: true,
      clearance: 0,
    };
  }

  /** The foot set down by a mode where it lands flat. */
  function set(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    moved: IAutoMovieMotionHumanFoot.IPlacement,
    mode: IAutoMovieMotionHumanTapDance.Part,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const heading: number = HumanFoot.heading(moved.rotation);
    if (mode === "flat") return moved;
    const socket: SetSocket = mode;
    return HumanFoot.pivot(
      body,
      side,
      socket,
      HumanFoot.point(body, side, socket, moved),
      heading,
      mode === "ball" ? -PITCH : PITCH,
    );
  }

  /** Where no foot bears between its keys. */
  function unsupported(
    keys: Record<
      AutoMovieHumanSide,
      readonly IAutoMovieMotionHumanDanceFootKey[]
    >,
    end: number,
  ): IFlight[] {
    const spans: (
      list: readonly IAutoMovieMotionHumanDanceFootKey[],
    ) => IFlight[] = (
      list: readonly IAutoMovieMotionHumanDanceFootKey[],
    ): IFlight[] =>
      list
        .filter((k: IAutoMovieMotionHumanDanceFootKey): boolean => k.bears)
        .map(
          (k: IAutoMovieMotionHumanDanceFootKey): IFlight => ({
            from: k.at,
            to: Math.min(end, k.leave),
          }),
        );
    const borne: IFlight[] = [...spans(keys.left), ...spans(keys.right)].sort(
      (a: IFlight, b: IFlight): number => a.from - b.from,
    );
    const flights: IFlight[] = [];
    let covered: number = 0;
    for (const span of borne) {
      if (span.from > covered + 1e-9)
        flights.push({ from: covered, to: span.from });
      covered = Math.max(covered, span.to);
    }
    return flights;
  }

  /** The hips' rise on the ballistic arc of the flight they are in. */
  function hop(flights: readonly IFlight[], t: number): number {
    for (const f of flights)
      if (t > f.from && t < f.to) {
        const u: number = (t - f.from) / (f.to - f.from);
        const span: number = f.to - f.from;
        return (
          4 * ((AutoMovieGravity.STANDARD * span * span) / 8) * u * (1 - u)
        );
      }
    return 0;
  }

  /** A word with its first letter capital. */
  function capital(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}
