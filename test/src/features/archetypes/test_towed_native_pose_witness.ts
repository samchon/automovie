import {
  AutoMovieArchetypeRide,
  createCart,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A towed native quadruped still observes its authored course on each role.
 *
 * Scenarios:
 * 1. Native and opaque leaders traverse the same short driven course. Even
 *    at repeated solver times, each route must observe the leg's getter as
 *    often as the ordinary route does.
 * 2. The wrapped leader has its own provenance and must receive no additional
 *    descriptor queries from the native route.
 * 3. Repeated, off-grid and backward reads produce the same signed placement
 *    and actual tail geometry from either route.
 * 4. A current frame reader and course reader replacement both observe their
 *    original calls after the tow was already prepared.
 * 5. A real source's live mass reads keep their original observation count
 *    across both routes, while public horse samples own separate primitive
 *    recipes and transforms.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes exact native geometry reuse, opaque callback observation and current physical carrier output.
 * @evidence contracts/development/testing.md#behavioral-verification Observes exact current geometry, callback counts and fresh returned transform ownership via the public tow.
 * @evidence contracts/development/testing.md#independent-expectations A wrapped old-method leader is the reference for signed same-time and arbitrary-order observations. The measured getter is a real course input, and the returned geometry comes from the actual harness and line spans.
 * @evidence contracts/development/testing.md#distinguishing-cases Native and wrapped sources, off-grid, backwards and repeated later observations separate ownership from matching scalar values.
 * @evidence contracts/development/testing.md#execution-ownership Builds genuine producer rides from a short in-memory course and compares actual observations through the public tow and horse reader.
 */
export function test_towed_native_pose_witness(): void {
  let descriptorReads: number = 0;

  /** Build an authored course whose access count is part of the observation. */
  const prepare = (opaque: boolean) => {
    let reads: number = 0;
    let massReads: number = 0;
    const horse: ReturnType<typeof createHorse> = createHorse(
      { tack: "harness" },
      4,
    );
    const cart: ReturnType<typeof createCart> = createCart(
      { kind: "cart", withersHeight: horse.dimensions.withersHeight! },
      4,
    );
    const leader: ReturnType<typeof rideHorse> = rideHorse(horse, {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        {
          get kind(): "straight" {
            ++reads;
            return "straight";
          },
          length: 3,
        },
      ],
      cruise: 1.3,
      acceleration: 0.5,
      deceleration: 0.5,
    });
    const mass: number = horse.properties.mass;
    Object.defineProperty(horse.properties, "mass", {
      configurable: true,
      enumerable: true,
      get: (): number => {
        ++massReads;
        return mass;
      },
    });
    const source: typeof leader = opaque
      ? new Proxy(leader, {
          getOwnPropertyDescriptor: (
            target: typeof leader,
            prop: string | symbol,
          ): PropertyDescriptor | undefined => {
            ++descriptorReads;
            return Object.getOwnPropertyDescriptor(target, prop);
          },
        })
      : leader;
    return {
      leader,
      tow: AutoMovieArchetypeRide.towed(source, "hitch", cart, "coupling", {
        lines: createCart.lines(cart),
        support: createCart.towing(cart),
      }),
      reads: (): number => reads,
      massReads: (): number => massReads,
    };
  };
  const native: ReturnType<typeof prepare> = prepare(false);
  const ordinary: ReturnType<typeof prepare> = prepare(true);
  TestValidator.equals(
    "the original integration observes the authored getter",
    native.reads(),
    ordinary.reads(),
  );
  TestValidator.predicate(
    "actual model metadata remains live at every original emission",
    native.massReads() > 0 && native.massReads() === ordinary.massReads(),
  );
  const when: number = native.tow.duration / 2;
  for (const seconds of [when + 0.013, 0, when, when + 0.013]) {
    const a: ReturnType<typeof native.tow.geometry> =
      native.tow.geometry(seconds);
    const b: ReturnType<typeof ordinary.tow.geometry> =
      ordinary.tow.geometry(seconds);
    const again: IAutoMovieTransform = native.tow.geometry(seconds).placement;
    for (const first of [a.placement, again]) {
      const expected: IAutoMovieTransform = b.placement;
      TestValidator.predicate(
        "every signed placement remains exact and privately owned",
        first !== expected &&
          (["x", "y", "z"] as const).every(
            (axis) =>
              Object.is(first.translation[axis], expected.translation[axis]) &&
              Object.is(first.rotation[axis], expected.rotation[axis]) &&
              Object.is(first.scale[axis], expected.scale[axis]),
          ) &&
          Object.is(first.rotation.w, expected.rotation.w),
      );
    }
    TestValidator.predicate(
      "repeated placement is freshly produced",
      a.placement !== again,
    );
    for (const line of ["line-left", "line-right"] as const) {
      const first: NonNullable<ReturnType<typeof a.tail>> = a.tail(line)!;
      const second: NonNullable<ReturnType<typeof b.tail>> = b.tail(line)!;
      TestValidator.predicate(
        "actual hitch carriers keep both driving lines exact",
        first.every((point, index) =>
          (["x", "y", "z"] as const).every((axis) =>
            Object.is(point[axis], second[index]![axis]),
          ),
        ),
      );
    }
    // Match the extra fresh native observation on the ordinary route.
    ordinary.tow.geometry(seconds);
  }
  TestValidator.equals(
    "all live authored course effects remain",
    native.reads(),
    ordinary.reads(),
  );
  TestValidator.equals(
    "demanded poses keep all actual mass observations",
    native.massReads(),
    ordinary.massReads(),
  );
  TestValidator.equals(
    "an unregistered leader incurs no descriptor queries",
    descriptorReads,
    0,
  );
  const observeCurrent = ({ leader, tow }: ReturnType<typeof prepare>) => {
    const originalFrame = leader.frame;
    const originalCourse = leader.plan.at;
    const calls: { operation: "frame" | "course"; second: number }[] = [];
    leader.frame = (id, second): IAutoMovieTransform => {
      calls.push({ operation: "frame", second });
      return originalFrame(id, second);
    };
    leader.plan.at = (second) => {
      calls.push({ operation: "course", second });
      return originalCourse(second);
    };
    tow.geometry(when + 0.013);
    return calls;
  };
  const current = observeCurrent(native);
  const expected = observeCurrent(ordinary);
  TestValidator.predicate(
    "current readers retain their original order",
    current.length === expected.length &&
      current.every(
        ({ operation, second }, index) =>
          operation === expected[index]?.operation &&
          Object.is(second, expected[index]?.second),
      ),
  );
  const atRequest = current.filter(({ second }) =>
    Object.is(second, when + 0.013),
  );
  TestValidator.predicate(
    "the replacement hitch runs once between current course and ground reads",
    atRequest.filter(({ operation }) => operation === "frame").length === 1 &&
      atRequest[0]?.operation === "course" &&
      atRequest.at(-1)?.operation === "course",
  );
  const first: IAutoMovieModelPart = native.leader.at(when).archetype.parts[0]!;
  const again: IAutoMovieModelPart = native.leader.at(when).archetype.parts[0]!;
  TestValidator.predicate(
    "current public part, primitive data and transform have independent ownership",
    first !== again &&
      first.geometry.type === "primitive" &&
      again.geometry.type === "primitive" &&
      first.geometry !== again.geometry &&
      first.geometry.shape !== again.geometry.shape &&
      first.transform !== again.transform,
  );
}
