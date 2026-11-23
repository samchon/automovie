import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  createCart,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A towed cart's ride. */
type Towed = AutoMovieArchetypeRide.ITowedRide<
  createCart.Affordance,
  createCart.Dimension
>;

/** The towed cart, once laid, for a held point that reads it. */
interface IHolder {
  /** The towed ride. */
  ride?: Towed;
}

/**
 * A cart's driving lines can end at a driver's displayed palm instead of their fixed material ends, so the hands may move the lines while they stay connected.
 *
 * Scenarios:
 * 1. With a hand reader, each driving line runs from the bit ring through the neck strap's ring and the terret to exactly the point the reader gives at that film second, a point moving against the cart; the last segment the driver's grip reads ends there too.
 * 2. Without one, each line still ends at the cart's fixed line end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Lays a real towed cart's lines with and without a held end and reads every point against the posed horse's balls, the reader and the cart's own frame.
 * @evidence contracts/development/testing.md#independent-expectations The held point is the test's own moving reader; the fixed points are the posed parts and the cart's affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases A held end against the default fixed end, at several seconds of a turn.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_draft_lines(): void {
  const horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, 3);
  const cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension> =
    createCart({ kind: "cart", withersHeight: 1.6 }, 3);
  const leader: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 4 },
      { kind: "turn", radius: 8, angle: 45 },
    ],
    cruise: 1.3,
    acceleration: 0.6,
    deceleration: 0.6,
  });
  const holder: IHolder = {};
  const held = (side: createCart.Side, seconds: number): IAutoMovieVector3 =>
    Vector3.add(
      holder.ride!.geometry(seconds).frame(`${side}LineGrip`).translation,
      {
        x: 0.02 * Math.sin(3 * seconds),
        y: 0.05 * Math.sin(2 * seconds),
        z: 0.04 * Math.cos(seconds),
      },
    );
  holder.ride = AutoMovieArchetypeRide.towed(
    leader,
    "hitch",
    cart,
    "coupling",
    {
      lines: createCart.lines(cart, held),
      support: createCart.towing(cart),
    },
  );
  const plain: Towed = AutoMovieArchetypeRide.towed(
    leader,
    "hitch",
    cart,
    "coupling",
    {
      lines: createCart.lines(cart),
      support: createCart.towing(cart),
    },
  );
  const issues: string[] = [];
  for (const seconds of [0.5, 2.3, 4.1, 6.7]) {
    const horseSample: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    > = leader.at(seconds);
    const ball = (id: string): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.compose(
        horseSample.placement,
        horseSample.archetype.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === id,
        )!.transform!,
      ).translation;
    for (const side of ["left", "right"] as const) {
      const line: AutoMovieArchetypeRide.ILineState | undefined = holder.ride
        .at(seconds)
        .lines?.find(
          (l: AutoMovieArchetypeRide.ILineState): boolean =>
            l.id === `line-${side}`,
        );
      const expected: IAutoMovieVector3[] = [
        ball(`bit-${side}`),
        ball(`ring-${side}`),
        ball(`terret-${side}`),
        held(side, seconds),
      ];
      if (
        line === undefined ||
        line.points.length !== 4 ||
        expected.some(
          (p: IAutoMovieVector3, k: number): boolean =>
            Vector3.distance(p, line.points[k]!) > 1e-9,
        )
      )
        issues.push(
          `${seconds} s: the held ${side} line leaves its bit, ring, terret or hand`,
        );
      const tail: readonly [IAutoMovieVector3, IAutoMovieVector3] | undefined =
        holder.ride.geometry(seconds).tail(`line-${side}`);
      if (
        tail === undefined ||
        Vector3.distance(tail[1], held(side, seconds)) > 1e-9
      )
        issues.push(
          `${seconds} s: the ${side} grip segment does not end at the hand`,
        );
      const fixed: AutoMovieArchetypeRide.ILineState | undefined = plain
        .at(seconds)
        .lines?.find(
          (l: AutoMovieArchetypeRide.ILineState): boolean =>
            l.id === `line-${side}`,
        );
      if (
        fixed === undefined ||
        Vector3.distance(
          fixed.points.at(-1)!,
          plain.frame(`${side}LineEnd`, seconds).translation,
        ) > 1e-9
      )
        issues.push(
          `${seconds} s: the default ${side} line leaves its fixed end`,
        );
    }
  }
  TestValidator.equals(
    "driving lines end at the hand that holds them",
    issues,
    [],
  );
}
