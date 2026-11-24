import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExercise,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanLegPhrase } from "../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanFrame } from "../posture/HumanFrame";
import { exercise } from "./exercise";
import { exerciseLunge } from "./exerciseLunge";

/** The alternatives of `PlanPlantPart2`'s site. */
type PlanPlantPart2 = "leftFoot" | "rightFoot";

/** The alternatives of `PlanPlantPart`'s site. */
type PlanPlantPart = "leftFoot" | "rightFoot";

/**
 * Plan an exercise.
 *
 * @param context The action's context.
 * @returns The plan.
 * @throws {HumanRefusal} When the count is not a positive whole number or a
 *   tempo span is negative.
 */
export function exercisePlan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanExercise.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanExercise.IParams = context.params;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const m: IAutoMovieMotionHumanActionContext["body"]["measure"] = body.measure;
  const reps: number = HumanBound.whole("count", p.count ?? 3);
  const tempo: readonly [number, number, number] = p.tempo ?? [2, 0, 1];
  for (const span of tempo) HumanBound.least("tempo", span, 0, "s");
  const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
    context,
    p.manner,
  );
  const top: number = 0.3;
  const timed: IAutoMovieMotionClock = AutoMovieMotionClock.sequence([
    ...AutoMovieMotionClock.repeat(
      [
        { name: "eccentricStart", seconds: tempo[0] },
        { name: "bottom", seconds: tempo[1] },
        { name: "concentricStart", seconds: tempo[2] },
        { name: "top", seconds: top },
      ],
      reps,
    ),
  ]);
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock(timed.duration, [
      ...timed.instants,
      { name: "relax", seconds: timed.duration },
    ]),
    modifiers,
    { holds: [] },
  );
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const stance: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanFoot.IPlacement
  > = {
    left: {
      ankle: context.entry.feet.left.ankle,
      rotation: context.entry.feet.left.rotation,
    },
    right: {
      ankle: context.entry.feet.right.ankle,
      rotation: context.entry.feet.right.rotation,
    },
  };
  const frame: IAutoMovieMotionHumanFrame = {
    origin: { x: 0, y: 0, z: 0 },
    yaw: entry.yaw,
  };
  const forward: IAutoMovieVector3 = HumanFrame.point(frame, {
    x: 0,
    y: 0,
    z: 1,
  });
  const left: IAutoMovieVector3 = HumanFrame.point(frame, {
    x: 1,
    y: 0,
    z: 0,
  });
  const lead: AutoMovieHumanSide = p.side ?? "right";
  const trail: AutoMovieHumanSide = lead === "right" ? "left" : "right";
  // The share of the way into repetition i's low (or open) position.
  const envelopes: ((seconds: number) => number)[] = Array.from(
    { length: reps },
    (_: unknown, index: number): ((seconds: number) => number) =>
      AutoMovieMotionClock.prepareEnvelope(
        clock,
        [`eccentricStart${index + 1}`, `bottom${index + 1}`],
        [`concentricStart${index + 1}`, `top${index + 1}`],
      ),
  );
  const into: (i: number, seconds: number) => number = (
    i: number,
    seconds: number,
  ): number => envelopes[i - 1]!(seconds);
  const any: (seconds: number) => number = (seconds: number): number => {
    let w: number = 0;
    for (let i: number = 1; i <= reps; i++) w = Math.max(w, into(i, seconds));
    return w;
  };
  const primitives: IAutoMovieMotionHumanPrimitive[] = [];
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];

  // A foot's plant windows between the spans it travels in, as shares of
  // the duration: it bears from the start, between its moves and to the
  // end, a window of no length left out.
  const share: (instant: string) => number = (instant: string): number =>
    clock.at(instant) / clock.duration;
  const plant: (
    part: PlanPlantPart,
    moves: readonly (readonly [number, number])[],
  ) => IAutoMovieMotionHumanContactWindow[] = (
    part: PlanPlantPart2,
    moves: readonly (readonly [number, number])[],
  ): IAutoMovieMotionHumanContactWindow[] => {
    const windows: IAutoMovieMotionHumanContactWindow[] = [];
    let from: number = 0;
    for (const [start, end] of [...moves, [1, 1] as const]) {
      if (start > from)
        windows.push({
          part,
          kind: "plant",
          from,
          to: start,
          support: { kind: "ground" },
        });
      from = Math.max(from, end);
    }
    return windows;
  };
  const shifted: (
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    by: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanFoot.IPlacement = (
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    by: IAutoMovieVector3,
  ): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle: Vector3.add(placement.ankle, by),
    rotation: placement.rotation,
  });
  const root: (
    offset: (seconds: number) => IAutoMovieVector3,
  ) => IAutoMovieMotionHumanPrimitive = (
    offset: (seconds: number) => IAutoMovieVector3,
  ): IAutoMovieMotionHumanPrimitive => ({
    channels: ["root"],
    reads: ["root"],
    from: 0,
    to: clock.duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      root: Vector3.add(posture.root, offset(seconds)),
    }),
  });

  const window: HumanPhysics.Window = HumanPhysics.fromClock(
    p,
    p.kind === "squat" ? { balance: { by: "hips" } } : {},
    context.start,
    clock,
    context.instant,
  );
  if (window !== null && p.kind !== "squat")
    HumanPhysics.unsupported(
      window.by,
      "only the squat exercise has a planted hip counterbalance",
    );
  switch (p.kind) {
    case "squat": {
      const depth: IAutoMovieMotionHumanExercise.Depth = p.depth ?? "parallel";
      for (let i: number = 1; i <= reps; i++)
        primitives.push(
          AutoMovieMotionHumanTrunk.crouch(
            {
              body,
              standing: entry,
              clock,
              rise: [`eccentricStart${i}`, `bottom${i}`],
              fall: [`concentricStart${i}`, `top${i}`],
              depth: exercise.drop(m, depth) * modifiers.extent,
              pitch: exercise.PITCH[depth] * modifiers.extent,
            },
            window,
          ),
        );
      contacts.push(...AutoMovieMotionHumanBase.plants());
      break;
    }
    case "lunge": {
      const lunge: ReturnType<typeof exerciseLunge.plan> = exerciseLunge.plan({
        body,
        entry,
        stance,
        forward,
        lead,
        any,
        extent: modifiers.extent,
        duration: clock.duration,
      });
      primitives.push(...lunge.primitives);
      contacts.push(...lunge.contacts);
      break;
    }
    case "highKnees": {
      const raised: (
        side: AutoMovieHumanSide,
      ) => IAutoMovieMotionHumanFoot.IPlacement = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanFoot.IPlacement => {
        const hip: IAutoMovieVector3 = HumanFrame.point(
          { origin: entry.root, yaw: entry.yaw },
          body.rest.get(`${side}UpperLeg`)!,
        );
        return {
          ankle: Vector3.add(
            { x: hip.x, y: hip.y - m.shank, z: hip.z },
            Vector3.scale(forward, m.thigh * modifiers.extent),
          ),
          rotation: stance[side].rotation,
        };
      };
      const sideOf: (i: number) => AutoMovieHumanSide = (
        i: number,
      ): AutoMovieHumanSide => (i % 2 === 1 ? lead : trail);
      const lifted: (side: AutoMovieHumanSide, s: number) => number = (
        side: AutoMovieHumanSide,
        s: number,
      ): number => {
        let w: number = 0;
        for (let i: number = 1; i <= reps; i++)
          if (sideOf(i) === side) w = Math.max(w, into(i, s));
        return w;
      };
      const half: number =
        Vector3.length(
          Vector3.subtract(stance.left.ankle, stance.right.ankle),
        ) / 2;
      primitives.push(
        root(
          (s: number): IAutoMovieVector3 =>
            Vector3.scale(
              left,
              half * (lifted("right", s) - lifted("left", s)),
            ),
        ),
      );
      for (const side of ["left", "right"] as const)
        primitives.push(
          AutoMovieMotionHumanLeg.place({
            body,
            side,
            from: 0,
            to: clock.duration,
            placement: (
              _: IAutoMovieMotionHumanPosture,
              s: number,
            ): IAutoMovieMotionHumanFoot.IPlacement =>
              AutoMovieMotionHumanLegPhrase.between(
                stance[side],
                raised(side),
                lifted(side, s),
              ),
            planted: (s: number): boolean => lifted(side, s) <= 0,
          }),
        );

      // Each foot bears except over its own repetitions, from their
      // lowering's start to their top.
      for (const side of ["left", "right"] as const) {
        const moves: [number, number][] = [];
        for (let i: number = 1; i <= reps; i++)
          if (sideOf(i) === side)
            moves.push([share(`eccentricStart${i}`), share(`top${i}`)]);
        contacts.push(...plant(`${side}Foot`, moves));
      }
      break;
    }
    case "jumpingJack": {
      const width: number = 1.5 * m.shoulderHalfWidth * modifiers.extent;

      // The hop lifts the root and both travelling feet alike, so the
      // legs keep their length while the feet are off the floor.
      const hop: (s: number) => number = (s: number): number => {
        const w: number = any(s);
        return 0.04 * 4 * w * (1 - w);
      };
      primitives.push(
        root((s: number): IAutoMovieVector3 => ({ x: 0, y: hop(s), z: 0 })),
      );
      for (const side of ["left", "right"] as const) {
        const out: IAutoMovieMotionHumanFoot.IPlacement = shifted(
          stance[side],
          Vector3.scale(
            left,
            (side === "left" ? 1 : -1) *
              Math.max(
                0,
                width -
                  Math.abs(
                    Vector3.dot(
                      Vector3.subtract(stance[side].ankle, entry.root),
                      left,
                    ),
                  ),
              ),
          ),
        );
        const open: ReturnType<
          typeof AutoMovieMotionHumanLegPhrase.prepareBetween
        > = AutoMovieMotionHumanLegPhrase.prepareBetween(stance[side], out);
        primitives.push(
          AutoMovieMotionHumanLeg.place({
            body,
            side,
            from: 0,
            to: clock.duration,
            placement: (
              _: IAutoMovieMotionHumanPosture,
              s: number,
            ): IAutoMovieMotionHumanFoot.IPlacement => {
              const placed: IAutoMovieMotionHumanFoot.IPlacement = open(any(s));
              return {
                ...placed,
                ankle: { ...placed.ankle, y: placed.ankle.y + hop(s) },
              };
            },
            planted: (s: number): boolean => any(s) <= 0 || any(s) >= 1,
          }),
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
            weight: any,
            place: (posture: IAutoMovieMotionHumanPosture) => ({
              point: AutoMovieMotionHumanPlaced.grid(body, posture, side, {
                height: "overhead",
                lateral: "outside",
                distance: "close",
              }),
              facing: HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                { x: side === "left" ? -1 : 1, y: 0, z: 0 },
              ),
            }),
            bend: "raised",
          }),
        );
      }

      // Both feet bear while closed and while open, and travel in the
      // jumps out and in.
      const moves: [number, number][] = [];
      for (let i: number = 1; i <= reps; i++)
        moves.push(
          [share(`eccentricStart${i}`), share(`bottom${i}`)],
          [share(`concentricStart${i}`), share(`top${i}`)],
        );
      contacts.push(...plant("leftFoot", moves), ...plant("rightFoot", moves));
      break;
    }
  }
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
    });
  return { ...plan, ...HumanPhysics.declared(context.params, window) };
}
