import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
  createCannon,
  createCart,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Actual axle pitch and drawbar pitch close a hitch without lifting wheel
 * solids.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the 4 cm limber mismatch, reverse field-gun trail, four-wheel wagon steering/pole pitch, source geometry preservation, unsupported rigid heights, unreachable goals, contradictory options and prepared support snapshot ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual producer support readers and public towed rides; reads real wheel cylinder extrema, unchanged geometry records, source coupling world points and actual pole length at off-grid samples through straight/turn/straight paths.
 * @evidence contracts/development/testing.md#independent-expectations The manual's 144.58 in reach and 57 in wheel diameter with the actual construction's 0.04 m pole offset give pitch atan2(.04,144.58*.0254) and axle-anchored root rise r*(1-cos(pitch)). Independently projected actual cylinders must touch Y=0 and source geometry/shaft length must remain unchanged.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares single-axle body pitch with a four-wheel level chassis/actual pole hinge and reverse towing; refuses missing support, omitted shaft freedom, contradictory axles and physically unreachable heights, then mutates a returned descriptor after preparation.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit uses public archetypes/kinematic rides and fixed finite sampling; no renderer, Human/Motion consumer, patched method, background process or wall-time assertion is involved.
 */
export function test_towed_ground_support(): void {
  const findings: string[] = [];
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 4 },
      { kind: "turn", radius: 12, angle: 30 },
      { kind: "straight", length: 4 },
    ],
    cruise: 1,
    startSpeed: 1,
    endSpeed: 1,
  };
  const limber: ReturnType<typeof createCart> = createCart({ kind: "limber" });
  const leader: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.along(limber, course);
  const trailer: ReturnType<typeof createCart> = createCart({ kind: "limber" });
  const support: ReturnType<typeof createCart.towing> =
    createCart.towing(trailer);
  const towed: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", trailer, "coupling", {
    support,
  });
  const expectedPitch: number = Math.atan2(0.04, 144.58 * 0.0254);
  const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
    towed.at(0).placement,
    "z",
  );
  near(
    "manual limber pitch",
    Math.atan2(-axis.y, Math.hypot(axis.x, axis.z)),
    expectedPitch,
  );
  near(
    "actual axle anchored rise",
    towed.at(0).placement.translation.y,
    28.5 * 0.0254 * (1 - Math.cos(expectedPitch)),
  );
  inspect(trailer, towed, leader, "pintle", "coupling", [
    "wheel-left",
    "wheel-right",
  ]);
  const baseline: string = JSON.stringify(towed.at(1.137).placement);
  support.axle.y += 0.2;
  towed.at(2.371);
  if (baseline !== JSON.stringify(towed.at(1.137).placement))
    findings.push(
      "mutating a caller support descriptor changed a prepared ride",
    );
  refuses("missing support cannot translate the limber downward", (): unknown =>
    AutoMovieArchetypeRide.towed(leader, "pintle", trailer, "coupling"),
  );
  refuses("conflicting explicit axle", (): unknown =>
    AutoMovieArchetypeRide.towed(leader, "pintle", trailer, "coupling", {
      support: createCart.towing(trailer),
      axle: { x: 0, y: 0, z: 0 },
    }),
  );
  const gun: ReturnType<typeof createCannon> = createCannon({
    kind: "fieldGun",
  });
  const limbered: AutoMovieArchetypeRide.IRide<
    createCannon.Affordance,
    createCannon.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", gun, "limber", {
    support: createCannon.towing(gun),
  });
  inspect(gun, limbered, leader, "pintle", "limber", [
    "wheel-left",
    "wheel-right",
  ]);
  const wagon: ReturnType<typeof createCart> = createCart({ kind: "wagon" });
  const draw: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(hitched(1), course);
  const wagonSupport: ReturnType<typeof createCart.towing> =
    createCart.towing(wagon);
  const drawn: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(draw, "hitch", wagon, "coupling", {
    support: wagonSupport,
  });
  inspect(wagon, drawn, draw, "hitch", "coupling", [
    "rear-wheel-left",
    "rear-wheel-right",
    "front-wheel-left",
    "front-wheel-right",
  ]);
  near(
    "four-wheel body stays level",
    AutoMovieArchetypeFrame.axis(drawn.at(1.137).placement, "y").y,
    1,
  );
  if (Math.abs(drawn.at(1.137).archetype.travel("drawbarPitch")) < 1)
    findings.push(
      "the actual wagon pole hinge did not resolve its height mismatch",
    );
  const pole: IAutoMovieModelPart | undefined = wagon.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "pole",
  );
  if (
    pole?.geometry.type !== "primitive" ||
    pole.geometry.shape.type !== "cylinder"
  )
    findings.push("the actual wagon pole cylinder is missing");
  else
    near(
      "manual fixed tongue length",
      pole.geometry.shape.height,
      128 * 0.0254,
    );
  if (wagonSupport.kind === "fixedGround") {
    const rigid: typeof wagonSupport = {
      kind: "fixedGround",
      axle: wagonSupport.axle,
      front: wagonSupport.front,
    };
    refuses("rigid four-wheel support cannot fake a lift", (): unknown =>
      AutoMovieArchetypeRide.towed(draw, "hitch", wagon, "coupling", {
        support: rigid,
      }),
    );
  }
  const unreachable: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(hitched(100), course);
  refuses("unreachable rigid lever height", (): unknown =>
    AutoMovieArchetypeRide.towed(unreachable, "hitch", trailer, "coupling", {
      support: createCart.towing(trailer),
    }),
  );
  TestValidator.equals(
    "supported towing keeps actual wheel ground and rigid coupling",
    findings,
    [],
  );

  /**
   * Numeric bounds are independently chosen at nanometre scale for metre-size
   * rigs.
   */
  function near(label: string, actual: number, expected: number): void {
    if (Math.abs(actual - expected) > 1e-9)
      findings.push(`${label}: ${actual}, expected ${expected}`);
  }

  /**
   * Public support impossibilities must be actionable refusals, not incidental
   * errors.
   */
  function refuses(label: string, action: () => unknown): void {
    let error: unknown = null;
    try {
      action();
    } catch (caught) {
      error = caught;
    }
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.axis.length === 0
    )
      findings.push(`${label}: missing structured refusal (${String(error)})`);
  }

  /**
   * Observe actual cylinders independently of either support reader or
   * placement law.
   */
  function inspect<
    I extends string,
    D extends string,
    L extends string,
    E extends string,
  >(
    source: AutoMovieArchetype<I, D>,
    ride: AutoMovieArchetypeRide.IRide<I, D>,
    lead: AutoMovieArchetypeRide.IRide<L, E>,
    hitch: L,
    coupling: I,
    wheels: readonly string[],
  ): void {
    for (const seconds of [
      0,
      0.137,
      1.231,
      4.379,
      7.213,
      ride.duration - 0.137,
    ]) {
      const sample: AutoMovieArchetypeRide.ISample<I, D> = ride.at(seconds);
      const actual: IAutoMovieVector3 = ride.frame(
        coupling,
        seconds,
      ).translation;
      const expected: IAutoMovieVector3 = lead.frame(
        hitch,
        seconds,
      ).translation;
      near(
        `${source.id} coupling`,
        Math.hypot(
          actual.x - expected.x,
          actual.y - expected.y,
          actual.z - expected.z,
        ),
        0,
      );
      for (const original of source.parts) {
        const part: IAutoMovieModelPart | undefined =
          sample.archetype.parts.find(
            (candidate: IAutoMovieModelPart): boolean =>
              candidate.id === original.id,
          );
        if (
          part === undefined ||
          JSON.stringify(part.geometry) !== JSON.stringify(original.geometry)
        )
          findings.push(
            `${source.id}/${original.id}: source geometry changed during towing`,
          );
        if (part?.transform !== null && part?.transform !== undefined)
          for (const coordinate of ["x", "y", "z"] as const)
            near(
              `${source.id}/${original.id} unchanged scale`,
              part.transform.scale[coordinate],
              1,
            );
      }
      for (const id of wheels) {
        const part: IAutoMovieModelPart | undefined =
          sample.archetype.parts.find(
            (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
          );
        if (
          part?.geometry.type !== "primitive" ||
          part.geometry.shape.type !== "cylinder" ||
          part.transform === null ||
          part.transform === undefined
        ) {
          findings.push(`${source.id}/${id}: actual wheel cylinder is missing`);
          continue;
        }
        const frame: ReturnType<typeof AutoMovieArchetypeFrame.compose> =
          AutoMovieArchetypeFrame.compose(sample.placement, part.transform);
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(
          frame.rotation,
          { x: 0, y: 1, z: 0 },
        );
        const half: number =
          (Math.abs(direction.y) * part.geometry.shape.height) / 2 +
          part.geometry.shape.radius * Math.hypot(direction.x, direction.z);
        near(`${source.id}/${id} actual floor`, frame.translation.y - half, 0);
        for (const coordinate of ["x", "y", "z"] as const)
          near(`${source.id}/${id} unit scale`, frame.scale[coordinate], 1);
      }
    }
  }
}

/**
 * A real generic fixed-height hitch for the independent four-wheel support
 * case.
 */
function hitched(height: number): AutoMovieArchetype<"hitch", never> {
  return new AutoMovieArchetypeBuilder<"hitch", never>({
    material: "steel",
    name: "towing support fixture",
    draw: new AutoMovieArchetypeDrawSession<never>(
      "towingSupportFixture",
      {},
      undefined,
    ),
  })
    .box("body", { x: 1, y: 0.5, z: 1 }, { x: 0, y: 0.25, z: 0 })
    .affordance({
      id: "hitch",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright({ x: 0, y: height, z: -1 }),
      extent: null,
    })
    .build(20);
}
