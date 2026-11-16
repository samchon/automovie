import {
  type IAutoMovieResolvedBone,
  Vector3,
  carriedRate,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
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
import { handspringKeys } from "./handspringKeys";
import { salto } from "./salto";
import { prepareGymnasticsPlacement } from "./prepareGymnasticsPlacement";

/**
 * A front handspring (#3377): from standing, the body reaches forward into
 * a lunge, turns head over heels in pitch over its hands, leaves them and
 * flies to its feet, landing arched and rising to stand.
 *
 * Two phases, each turning about one axis, the body's left one:
 *
 * 1. Supported: the body rolls as a wheel (`GymnasticsWheel`) over its feet,
 *    its leading foot and its two hands, its shape going from standing to
 *    the lunge `lunged` by the angle `REACH` and from there to the arched
 *    line `arched` by `RELEASE`, where the hands leave. The angle grows
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
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, flight physics/rate, landing, bound, vault, first pass and events. The unchanged lunged alias names handspringKeys.lunged's left-leading provisional shape; arched names handspringKeys.arched's provisional line used by the wheel and flight.
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

  /**
   * The body-dependent lunge with the left leg leading, constructed by
   * `handspringKeys.lunged` with the law's existing provisional angles.
   */
  export const lunged: typeof handspringKeys.lunged = handspringKeys.lunged;

  /**
   * The body-dependent arched line of the wheel and flight, constructed by
   * `handspringKeys.arched` with the law's existing provisional angles.
   */
  export const arched: typeof handspringKeys.arched = handspringKeys.arched;

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
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the actual descending-hand midpoint in world metres and refusal for an off-surface place.
     * @evidence contracts/development/implementation.md#principled-implementation The floor provider accepts its unbounded plane; vault's actual provider transforms the midpoint into its declared top frame and compares original width/depth half-extents.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure handspring calls the supplied surface owner once on the actual two-hand mean; that owner keeps the existing bounds check and refusal text.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An off-top place is refused and never moved, clamped or replaced by the support's centre.
     * @evidence contracts/development/implementation.md#efficient-algorithms Existing floor and vault providers perform constant work; requested hand-only FK reduces only the caller's unobserved hierarchy work, without reducing checks.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The callback reads the same fixed declared top/frame used to author this vault's actual hand support, without a cached acceptance answer.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Actual providers retain no queried point, result, numerical workspace or handle; the construction-time call lends one fresh midpoint and returns or throws synchronously.
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Demanded spoke FK per table row, two-hand-only surface observation and forty unchanged bisection steps of closed-form fall times remain. The fixed arched flight prepares one canonical local COM/projected articulation; each flight query rotates that offset and copies original joints without another FK/mass scan or eligible projection. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses wheel/flight owners, jump landing durations and standing plan. Three fixed key pairs prepare their ordered blend unions once; only the immutable arched flight shares local COM and checked projected joints, while changing supported shapes retain their actual row computations. Landing lowering may explicitly borrow its synchronous parent's exact FK workspace.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its table, body mass model, three fixed key-pair readers and one copied arched flight articulation/local COM. Returned postures own fresh joint records; an optional borrowed reader stays with its synchronous query caller and never enters the plan or output evidence.
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
    const ease: (x: number) => number = (x: number): number => minimumJerk.share(x);
    const reached: ExerciseKey.IKey = left
      ? lunged(body)
      : ExerciseKey.mirror(lunged(body));
    const line: ExerciseKey.IKey = arched(body);
    const stood: ExerciseKey.IKey = ExerciseKey.standing(body);
    const entering: ReturnType<typeof ExerciseKey.prepareBlend> = ExerciseKey.prepareBlend(stood, reached);
    const arching: ReturnType<typeof ExerciseKey.prepareBlend> = ExerciseKey.prepareBlend(reached, line);
    const rising: ReturnType<typeof ExerciseKey.prepareBlend> = ExerciseKey.prepareBlend(line, stood);

    // The shape at an angle of forward tip.
    const shaped: (angle: number) => IHumanPosture = (angle: number): IHumanPosture => ({
      ...ExerciseKey.posed(
        angle <= REACH
          ? entering(ease(angle / REACH))
          : arching(ease((angle - REACH) / (RELEASE - REACH))),
        yaw,
      ),
      pitch: angle,
    });

    // The spokes: both feet, the leading foot, the other, both hands.
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose, undefined, new Set<AutoMovieHumanoidBone>(["leftFoot", "rightFoot"]));
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
    const placedAt: (angle: number) => IHumanPosture = (angle: number): IHumanPosture => ({
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
      StrikingBody.trunk(body, placedAt(down.angle), undefined, new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]));
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
      ...ExerciseKey.posed(line, yaw),
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
    const miss: (rate: number) => number = (rate: number): number => {
      const t: number | null = GymnasticsFlight.fall(
        cr.y,
        slope.y * rate,
        height,
      );
      return t === null ? -turn : rate * t - turn;
    };
    // No rate the body can turn at (the salto's bound) lands it: the turn it
    // makes at the bound falls short. A higher top to push from gives the
    // flight more time; the floor has no other surface, so a floor
    // handspring is refused on the base it is thrown from.
    const bound: number = salto.RATE * 360;
    if (miss(bound) < 0) {
      const reached: number = miss(bound) + turn;
      const prop: boolean = surface.support.kind === "prop";
      throw new HumanRefusal({
        kind: prop ? "reach" : "base",
        axis: prop ? "on" : "base",
        value: prop ? surface.height : reached,
        feasible: prop
          ? {
              kind: "range",
              minimum: surface.height,
              maximum: null,
              unit: "m",
              open: "minimum",
            }
          : { kind: "range", minimum: turn, maximum: null, unit: "degrees" },
        reason: `turning at its fastest, ${bound} degrees a second, the body turns ${reached.toFixed(0)} of the ${turn} degrees from ${RELEASE} to ${LAND} before its centre comes down${prop ? `, pushing from a top ${surface.height.toFixed(2)} m high` : " from the floor"}`,
        fix: prop
          ? "vault from a higher top, whose push gives the flight the time to turn"
          : "throw it over a vault's top (`vault`), whose push gives the flight the time to turn, or answer with a round-off or a salto",
      });
    }
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
    const angleAt: (t: number) => number = (t: number): number =>
      RELEASE * Math.min(1, t / support) ** 2;
    const share: (angle: number) => number = (angle: number): number =>
      (support * Math.sqrt(angle / RELEASE)) / duration;

    // The flight posture at seconds since the release.
    const placeFlight: ReturnType<typeof prepareGymnasticsPlacement> =
      prepareGymnasticsPlacement(body, model, ExerciseKey.posed(line, yaw));
    const flying: (t: number) => IHumanPosture = (t: number): IHumanPosture =>
      placeFlight(
        { yaw: yaw + line.yaw, pitch: RELEASE + rate * t, roll: line.roll },
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
    const footRotations: Record<"left" | "right", IAutoMovieQuaternion> = {
      left: HumanFoot.rotation(yaw + stand.TOE_OUT, 0),
      right: HumanFoot.rotation(yaw - stand.TOE_OUT, 0),
    };
    const bends: Record<"left" | "right", IAutoMovieVector3> = {
      left: Vector3.add(landed.left, { x: forward.x, y: body.measure.hipHeight / 2, z: forward.z }),
      right: Vector3.add(landed.right, { x: forward.x, y: body.measure.hipHeight / 2, z: forward.z }),
    };
    const span: number = jump.ABSORB + jump.RISE;
    const after: (t: number, resolution?: Parameters<IHumanActionPlan["posture"]>[2]) => IHumanPosture = (t: number, resolution?: Parameters<IHumanActionPlan["posture"]>[2]): IHumanPosture => {
      const u: number = ease(t / span);
      const root: IAutoMovieVector3 = Vector3.add(
        Vector3.lerp(rootDown, rootUp, u),
        Vector3.scale(rootSpeed, carriedRate(span, t)),
      );
      const limbs: IHumanPosture["limbs"] = {};
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = {
          point: landed[side],
          rotation: { ...footRotations[side] },
          bend: { ...bends[side] },
          planted: true,
        };
      return resolveHumanPosture.lower(body, {
        ...ExerciseKey.posed(rising(u), yaw),
        // The same tip as the flight's, written below a whole turn so the
        // landing ends at 0 and the next action does not unwind a turn.
        pitch: (LAND - 360) * (1 - u),
        root,
        limbs,
      }, undefined, resolution);
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
      posture: (seconds: number, _channels?: Parameters<IHumanActionPlan["posture"]>[1], resolution?: Parameters<IHumanActionPlan["posture"]>[2]): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t < support) return placedAt(angleAt(t));
        if (t < touchdown) return flying(t - support);
        return after(t - touchdown, resolution);
      },
    };
  }
}
