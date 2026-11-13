import {
  type IAutoMovieResolvedBone,
  Vector3,
  carriedRate,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { jump } from "../actions/jump";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { GymnasticsWheel } from "./GymnasticsWheel";
import { salto } from "./salto";

/**
 * A front handspring (#3377): from standing, the body reaches forward into
 * a lunge, turns head over heels in pitch over its hands, leaves them and
 * flies to its feet, landing arched and rising to stand.
 *
 * Two phases, each turning about one axis, the body's left one:
 *
 * 1. Supported: the body rolls as a wheel (`GymnasticsWheel`) over its feet,
 *    its leading foot and its two hands, its shape going from standing to
 *    the lunge `REACHED` by the angle `REACH` and from there to the arched
 *    line `ARCHED` by `RELEASE`, where the hands leave. The angle grows
 *    with constant angular acceleration from rest, so it arrives at the
 *    release with the rate the flight keeps.
 * 2. Flight: the centre of mass follows the parabola of the velocity the
 *    wheel gave it at the release, and the arched body keeps turning at the
 *    release's rate, its kept angular momentum, until the centre comes down
 *    to the height it has standing arched at `LAND`. That rate is the one
 *    whose turn over that flight time brings the body from `RELEASE` to
 *    `LAND`, found by bisection, since the flight time itself grows with the
 *    rate the wheel throws the centre at.
 *
 * Landing, the feet are planted where they came down, the body absorbs and
 * rises to stand over the jump's `ABSORB` and `RISE` seconds while its tip
 * comes up from `LAND`, the arched landing of the skill, with the root
 * carrying the touchdown velocity out.
 *
 * A rate past the salto's bound (`salto.RATE`) is refused. With the hands
 * on a prop's `surface` the same law is the vault (`vault`).
 *
 * First pass: the body is rigid through the flight (no repulsion from the
 * shoulders, no change of shape), so its pitch rate and its centre's speed
 * are tied by the wheel's radius and the flight is longer and faster than a
 * gymnast's, who shortens the body and pushes off the hands; the hands and
 * feet are carried by the shape and not laid flat by a solve.
 *
 * Events: `handsDown`, `release` (the hands leave), `touchdown`, `settled`
 * and `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases with their one axis each, the physics of the flight and how its rate is found, the landing, the bound, the vault, the first pass and the events.
 * @evidence contracts/development/design.md#principled-representation A wheel table and a parabola, both from the body's own joints and mass model; the rate is solved, not stated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the keyed shapes and angles, the parameters, the plan and the plan over a prop's top.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres and no speed stated: they follow from the spokes and the flight.
 */
export namespace handspring {
  /** The action's name. */
  export const name: HumanActionKey = "handspring";

  /** Cancel table: from the end, into standing, walking, another handspring or a salto. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      handspring: ["fromRelax", "smooth"],
      salto: ["fromRelax", "smooth"],
    });

  /** The angle by which the lunge is reached, degrees of forward tip (provisional). */
  export const REACH: number = 110;

  /** The angle at which the hands leave, degrees of forward tip (provisional: before the handstand, where the wheel still lifts the centre). */
  export const RELEASE: number = 145;

  /** The tip at which the feet come down, degrees: arched, the trunk 30 degrees behind upright (provisional). */
  export const LAND: number = 330;

  /** The lunge, the left leg leading: the leading leg bent under the body, the other stretched behind, the arms overhead (provisional angles). */
  export const REACHED: ExerciseKey.IKey = ExerciseKey.of(
    { neck: -15 },
    { shoulder: 175, raise: 10, elbow: 0 },
    { hip: 90, knee: 45, ankle: 15 },
    { hip: -15, knee: 0, ankle: -20 },
  );

  /** The arched line of the support and the flight: legs together, the back arched, the arms overhead (provisional angles). */
  export const ARCHED: ExerciseKey.IKey = ExerciseKey.of(
    { spine: [-10, 0, 0], chest: [-10, 0, 0] },
    { hip: -10, knee: 0, ankle: 0, shoulder: 175, raise: 10, elbow: 0 },
  );

  /** The angle between two rows of the wheel's table, degrees. */
  const STEP: number = 5;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The leading leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The value the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union.
   */
  export interface IParams {
    /** The leg that lunges; `left` when absent. */
    lead?: "left" | "right";
  }

  /**
   * What the hands land on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A height, a support frame and a check of the place.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the vault gives the plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISurface {
    /** The surface's height, world metres. */
    height: number;

    /** What the hands bear on. */
    support: IHumanContactWindow.Support;

    /**
     * Refuse a place for the hands' middle off the surface.
     *
     * @param point The hands' middle as they come down, world metres.
     * @throws {HumanRefusal} When the point is off the surface.
     */
    within(point: IAutoMovieVector3): void;
  }

  /**
   * Plan a front handspring on the floor.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hands do not come down before the release, or no rate up to the bound lands the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The floor at height 0 as the hands' surface, through `over`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `over`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work over `over`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing of its own.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    return over(context, {
      height: 0,
      support: { kind: "ground" },
      within: (): void => {},
    });
  }

  /**
   * Plan a front handspring whose hands land on a surface.
   *
   * @param context The action's context.
   * @param surface What the hands land on.
   * @returns The plan.
   * @throws {HumanRefusal} When the hands do not come down before the release, come down off the surface, or no rate up to the bound lands the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The wheel to the release, the release's centre and its rate of change with the angle read from the table, the rate solved so the flight's turn over its fall time reaches `LAND`, and the support's constant angular acceleration ending at that rate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shape, the table, the release, the rate, the timing, then the posture by phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rate past the bound or a landing no rate reaches is refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per table row, forty bisection steps of closed-form fall times, and one forward kinematics per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the wheel and flight kernels, the exercise keys, the jump's landing seconds and the standing plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the table and the mass model.
   */
  export function over(
    context: IHumanActionContext<IParams>,
    surface: ISurface,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const model: GymnasticsFlight.Model = GymnasticsFlight.model(body);
    const left: boolean = context.params.lead !== "right";
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const yaw: number = standing.yaw;
    const ease = (x: number): number => minimumJerk(x).s;
    const reached: ExerciseKey.IKey = left
      ? REACHED
      : ExerciseKey.mirror(REACHED);

    // The shape at an angle of forward tip.
    const shaped = (angle: number): IHumanPosture => ({
      ...ExerciseKey.posed(
        angle <= REACH
          ? ExerciseKey.blend(ExerciseKey.STOOD, reached, ease(angle / REACH))
          : ExerciseKey.blend(
              reached,
              ARCHED,
              ease((angle - REACH) / (RELEASE - REACH)),
            ),
        yaw,
      ),
      pitch: angle,
    });

    // The spokes: both feet, the leading foot, the other, both hands.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose);
    const ankle: number =
      (entered.get("leftFoot")!.worldPosition.y +
        entered.get("rightFoot")!.worldPosition.y) /
      2;
    const ground: IHumanContactWindow.Support = { kind: "ground" };
    const spokes: GymnasticsWheel.ISpoke[] = [
      { bones: ["leftFoot", "rightFoot"], height: ankle, support: ground },
      {
        bones: [left ? "leftFoot" : "rightFoot"],
        height: ankle,
        support: ground,
      },
      {
        bones: [left ? "rightFoot" : "leftFoot"],
        height: ankle,
        support: ground,
      },
      {
        bones: ["leftHand", "rightHand"],
        height: surface.height + GymnasticsWheel.laid(body),
        support: surface.support,
      },
    ];
    const hands: number = 3;
    const wheel: GymnasticsWheel.IWheel = GymnasticsWheel.roll({
      body,
      shaped,
      spokes,
      start: standing.root,
      until: RELEASE,
      step: STEP,
    });
    const placedAt = (angle: number): IHumanPosture => ({
      ...shaped(angle),
      root: wheel.root(angle),
    });

    // The hands must bear by the release, on the surface.
    const down: GymnasticsWheel.IRow | undefined = wheel.rows.find(
      (row: GymnasticsWheel.IRow): boolean => row.bears === hands,
    );
    if (down === undefined || wheel.rows.at(-1)!.bears !== hands)
      throw new HumanRefusal({
        kind: "reach",
        axis: "hands",
        value: surface.height,
        reason: `the hands do not bear on a surface ${surface.height.toFixed(2)} m high by the release at ${RELEASE} degrees of tip`,
        fix: "lower the surface, or place the hands' support where the lunge reaches",
      });
    const placing: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      StrikingBody.trunk(body, placedAt(down.angle));
    surface.within(
      Vector3.lerp(
        placing.get("leftHand")!.worldPosition,
        placing.get("rightHand")!.worldPosition,
        0.5,
      ),
    );

    // The release: the centre and its change with the angle, per degree.
    const cr: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      model,
      placedAt(RELEASE),
    );
    const slope: IAutoMovieVector3 = Vector3.subtract(
      cr,
      GymnasticsFlight.centre(body, model, placedAt(RELEASE - 1)),
    );

    // The landing's centre height: the arched body at `LAND` stood on its
    // ankles.
    const landing: IHumanPosture = {
      ...ExerciseKey.posed(ARCHED, yaw),
      pitch: LAND,
    };
    const feet: IAutoMovieVector3 = ExerciseKey.mean(body, landing, [
      "leftFoot",
      "rightFoot",
    ]);
    const standingOn: IHumanPosture = {
      ...landing,
      root: { x: 0, y: ankle - feet.y, z: 0 },
    };
    const height: number = GymnasticsFlight.centre(body, model, standingOn).y;

    // The rate, degrees a second, whose turn over the fall time reaches the
    // landing tip.
    const turn: number = LAND - RELEASE;
    const miss = (rate: number): number => {
      const t: number | null = GymnasticsFlight.fall(
        cr.y,
        slope.y * rate,
        height,
      );
      return t === null ? -turn : rate * t - turn;
    };
    const bound: number = salto.RATE * 360;
    if (miss(bound) < 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "rate",
        value: bound,
        feasible: { kind: "range", minimum: 0, maximum: bound, unit: "deg/s" },
        reason: `no rate of turn up to ${bound} degrees a second carries the body from ${RELEASE} to ${LAND} degrees before its centre comes down`,
        fix: "hand the body a higher surface to push from",
      });
    let low: number = 1;
    let high: number = bound;
    for (let i: number = 0; i < 40; i++) {
      const middle: number = (low + high) / 2;
      if (miss(middle) < 0) low = middle;
      else high = middle;
    }
    const rate: number = high;
    const velocity: IAutoMovieVector3 = Vector3.scale(slope, rate);
    const flight: number = GymnasticsFlight.fall(cr.y, velocity.y, height)!;

    // Timing: constant angular acceleration from rest to the release's rate.
    const support: number = (2 * RELEASE) / rate;
    const touchdown: number = support + flight;
    const settled: number = touchdown + jump.ABSORB;
    const duration: number = settled + jump.RISE;
    const angleAt = (t: number): number =>
      RELEASE * Math.min(1, t / support) ** 2;
    const share = (angle: number): number =>
      (support * Math.sqrt(angle / RELEASE)) / duration;

    // The flight posture at seconds since the release.
    const flying = (t: number): IHumanPosture =>
      GymnasticsFlight.placed(
        body,
        model,
        { ...ExerciseKey.posed(ARCHED, yaw), pitch: RELEASE + rate * t },
        GymnasticsFlight.at(cr, velocity, t),
      );

    // The landing: feet where they came down, the root carrying the
    // touchdown's velocity out to the standing place over them.
    const touched: IHumanPosture = flying(flight);
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      StrikingBody.trunk(body, touched);
    const landed: Record<"left" | "right", IAutoMovieVector3> = {
      left: shown.get("leftFoot")!.worldPosition,
      right: shown.get("rightFoot")!.worldPosition,
    };
    const rootDown: IAutoMovieVector3 = touched.root;
    const rootSpeed: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(rootDown, flying(flight - 1e-3).root),
      1e3,
    );
    const stoodFeet: IAutoMovieVector3 = Vector3.lerp(
      entered.get("leftFoot")!.worldPosition,
      entered.get("rightFoot")!.worldPosition,
      0.5,
    );
    const rootUp: IAutoMovieVector3 = {
      ...Vector3.add(
        Vector3.lerp(landed.left, landed.right, 0.5),
        Vector3.subtract(standing.root, stoodFeet),
      ),
      y: standing.root.y,
    };
    const forward: IAutoMovieVector3 = {
      x: Math.sin((yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((yaw * Math.PI) / 180),
    };
    const after = (t: number): IHumanPosture => {
      const span: number = jump.ABSORB + jump.RISE;
      const u: number = ease(t / span);
      const root: IAutoMovieVector3 = Vector3.add(
        Vector3.lerp(rootDown, rootUp, u),
        Vector3.scale(rootSpeed, carriedRate(span, t)),
      );
      const limbs: IHumanPosture["limbs"] = {};
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = {
          point: landed[side],
          rotation: HumanFoot.rotation(
            yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
            0,
          ),
          bend: Vector3.add(landed[side], {
            x: forward.x,
            y: body.measure.hipHeight / 2,
            z: forward.z,
          }),
          planted: true,
        };
      return resolveHumanPosture.lower(body, {
        ...ExerciseKey.posed(
          ExerciseKey.blend(ARCHED, ExerciseKey.STOOD, u),
          yaw,
        ),
        // The same tip as the flight's, written below a whole turn so the
        // landing ends at 0 and the next action does not unwind a turn.
        pitch: (LAND - 360) * (1 - u),
        root,
        limbs,
      });
    };

    const contacts: IHumanContactWindow[] = [
      ...GymnasticsWheel.contacts(wheel, spokes, share),
      ...(["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
          part,
          kind: "plant",
          from: touchdown / duration,
          to: 1,
          support: ground,
        }),
      ),
    ];
    const events: IAutoMovieMotionEvent[] = [
      { name: "handsDown", share: share(down.angle) },
      { name: "release", share: support / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
      { name: "relax", share: 1 },
    ];
    return {
      duration,
      events,
      contacts,
      contact: touchdown,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t < support) return placedAt(angleAt(t));
        if (t < touchdown) return flying(t - support);
        return after(t - touchdown);
      },
    };
  }
}
