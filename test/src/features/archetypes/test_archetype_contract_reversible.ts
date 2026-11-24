import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import {
  Vector3,
  affordanceLeadingTravel,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceCoupling,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The independent slider, its hinge and a second hinge coupled to that hinge. */
type Id = "drive" | "follower" | "tip";

/** Builds three independently bound parts with two coupled travel coordinates. */
function fixture(
  rule: IAutoMovieAffordanceCoupling,
  carried: boolean = false,
  driveLimit: number = 1,
  followerLimit: number = 90,
): AutoMovieArchetype<Id, never> {
  const v: typeof Vector3.create = Vector3.create;
  const frame: ReturnType<typeof AutoMovieArchetypeFrame.upright> =
    AutoMovieArchetypeFrame.upright(v(0, 0, 0));
  return new AutoMovieArchetypeBuilder<Id, never>({
    material: "steel",
    name: "reversible-fixture",
    draw: new AutoMovieArchetypeDrawSession<never>(
      "reversible-fixture",
      {},
      undefined,
    ),
  })
    .box("driver", v(0.1, 0.1, 0.1), v(0, 0, 0))
    .box("leaf", v(0.1, 0.1, 0.1), v(0.2, 0, 0))
    .box("tip-leaf", v(0.1, 0.1, 0.1), v(0.4, 0, 0))
    .affordance({
      id: "drive",
      kind: "slider",
      frame,
      extent: null,
      travel: driveLimit,
      reverse: driveLimit,
      parts: ["driver"],
      ...(carried ? { rides: "follower" } : {}),
    })
    .affordance({
      id: "follower",
      kind: "hinge",
      frame,
      extent: null,
      travel: followerLimit,
      reverse: followerLimit,
      parts: ["leaf"],
      follows: rule,
    })
    .affordance({
      id: "tip",
      kind: "hinge",
      frame,
      extent: null,
      travel: followerLimit / 2,
      reverse: followerLimit / 2,
      parts: ["tip-leaf"],
      follows: { id: "follower", ratio: 0.5, reversible: true },
    })
    .build(1);
}

/** Whether an authored state is refused through the product's structured refusal. */
function refused(operation: () => unknown): boolean {
  try {
    operation();
  } catch (error) {
    return error instanceof AutoMovieArchetypeRefusal;
  }
  return false;
}

/**
 * An explicitly reversible coupling accepts either coordinate of one degree of freedom, while travel and spatial dependency cycles remain separate.
 *
 * Scenarios:
 * 1. Positive and negative ratios invert exactly; increasing and decreasing piecewise-linear tables invert endpoints, interior knots and interior segments, including a two-edge reversible chain.
 * 2. A non-reversible follower, a travel outside a table's image, non-finite inputs, and duplicate inputs for one degree of freedom are refused, independently of their order.
 * 3. Engine admission rejects reversible zero ratios, plateaus and non-monotone tables. The inverse refuses malformed inputs without selecting a branch.
 * 4. A driver may spatially ride its follower, because travel resolution precedes spatial evaluation; a pure follows cycle and a pure rides cycle are both rejected.
 * 5. A ratio of either sign round-trips both bounds of a [-7, 7] leader through its actual forward values, despite binary64 inverse rounding; the immediately adjacent value outside either forward image is refused even inside the follower's own wider range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and states the coordinate, domain, refusal and graph semantics.
 * @evidence contracts/development/testing.md#behavioral-verification Drives real articulated fixtures from both coordinates, reads their travels, and validates copied models with malformed graphs and couplings; catches lost reversal, arbitrary branch choice, input-order precedence and cycle relaxation in either evaluation graph.
 * @evidence contracts/development/testing.md#independent-expectations Ratio inversion is division and table inversion is the linear segment equation. Exact endpoints are the authored legal bounds; 2.1000000000000005 is binary64's immediate successor of the ratio's endpoint 2.1. A spatial parent and a travel dependency are distinct graphs because forward articulation resolves all travels before any spatial parent.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ratio signs and bounds, adjacent invalid image values, both table directions, knots, a nested follower, absent opt-in, a plateau, reversal of slope, malformed values, both duplicate orders, mixed edges and cycles in each single graph; cannon_elevation owns the physical lead-screw consumer.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit test over producers, articulation and model admission; starts no host and alters no global or foreign method.
 */
export function test_archetype_contract_reversible(): void {
  const findings: string[] = [];
  const rules: readonly IAutoMovieAffordanceCoupling[] = [
    { id: "drive", ratio: 90, reversible: true },
    { id: "drive", ratio: -90, reversible: true },
    {
      id: "drive",
      table: [
        [-1, -60],
        [0, 0],
        [0.5, 20],
        [1, 90],
      ],
      reversible: true,
    },
    {
      id: "drive",
      table: [
        [-1, 60],
        [0, 0],
        [0.5, -20],
        [1, -90],
      ],
      reversible: true,
    },
  ];
  const samples: readonly (readonly [number, number])[] = [
    [-1, -60],
    [0, 0],
    [0.25, 10],
    [0.5, 20],
    [0.75, 55],
    [1, 90],
  ];
  for (const rule of rules) {
    const rest: AutoMovieArchetype<Id, never> = fixture(rule);
    if (!validateModel({ model: rest }).success)
      findings.push("a one-to-one coupling is refused by admission");
    for (const [drive, tableValue] of samples) {
      const follower: number =
        rule.table === undefined
          ? rule.ratio * drive
          : (rule.table[0]![1] > 0 ? -1 : 1) * tableValue;
      const posed: AutoMovieArchetype<Id, never> = rest.articulate({
        follower,
      });
      const nested: AutoMovieArchetype<Id, never> = rest.articulate({
        tip: follower / 2,
      });
      if (
        Math.abs(posed.travel("drive") - drive) > 1e-12 ||
        Math.abs(nested.travel("drive") - drive) > 1e-12 ||
        Math.abs(posed.travel("follower") - follower) > 1e-12
      )
        findings.push(`the inverse misses ${drive} from ${follower}`);
    }
    for (const state of [
      { drive: 0, follower: 1 },
      { follower: 1, drive: 0 },
      { drive: 0, follower: 0 },
      { follower: 0, drive: 0 },
    ])
      if (!refused(() => rest.articulate(state)))
        findings.push("duplicate degree-of-freedom inputs are admitted");
    for (const follower of [Number.NaN, Infinity, -Infinity, 91, -91])
      if (!refused(() => rest.articulate({ follower })))
        findings.push(`out-of-domain follower ${follower} is admitted`);
  }
  for (const reversible of [undefined, false]) {
    const ordinary: AutoMovieArchetype<Id, never> = fixture({
      id: "drive",
      ratio: 90,
      reversible,
    });
    if (!refused(() => ordinary.articulate({ follower: 10 })))
      findings.push("an unmarked follower is reverse-driven");
  }
  const narrow: AutoMovieArchetype<Id, never> = fixture({
    id: "drive",
    table: [
      [-1, -20],
      [1, 20],
    ],
    reversible: true,
  });
  if (!refused(() => narrow.articulate({ follower: 30 })))
    findings.push(
      "a travel inside the joint range but outside the image is admitted",
    );

  // Admission and the inverse reject different ways uniqueness can fail.
  for (const rule of [
    { id: "drive", ratio: 0, reversible: true },
    {
      id: "drive",
      table: [
        [-1, -20],
        [0, -20],
        [1, 20],
      ],
      reversible: true,
    },
    {
      id: "drive",
      table: [
        [-1, -20],
        [0, 20],
        [1, 0],
      ],
      reversible: true,
    },
  ] satisfies IAutoMovieAffordanceCoupling[]) {
    const invalid: AutoMovieArchetype<Id, never> = fixture(rule);
    if (validateModel({ model: invalid }).success)
      findings.push("a non-invertible reversible rule is admitted");
    if (affordanceLeadingTravel(rule, 0) !== null)
      findings.push("a non-invertible map has an inverse");
  }
  if (
    affordanceLeadingTravel({ id: "drive", ratio: Infinity }, 1) !== null ||
    affordanceLeadingTravel({ id: "drive", table: [] }, 0) !== null ||
    affordanceLeadingTravel(
      {
        id: "drive",
        table: [
          [0, 0],
          [0, 1],
        ],
      },
      0.5,
    ) !== null ||
    affordanceLeadingTravel(
      {
        id: "drive",
        table: [
          [-1, -Infinity],
          [1, 90],
        ],
      },
      0,
    ) !== null
  )
    findings.push("a malformed map has an inverse");

  // A mixed edge loop is valid: its two evaluation graphs remain acyclic.
  const mixed: AutoMovieArchetype<Id, never> = fixture(rules[0]!, true);
  if (
    !validateModel({ model: mixed }).success ||
    Math.abs(mixed.articulate({ follower: 45 }).travel("drive") - 0.5) > 1e-12
  )
    findings.push("a valid driver riding its follower is refused");
  for (const graph of ["follows", "rides"] as const) {
    const model: IAutoMovieModel = JSON.parse(
      JSON.stringify(mixed),
    ) as IAutoMovieModel;
    const driver: IAutoMovieAffordance = model.affordances![0]!;
    const follower: IAutoMovieAffordance = model.affordances![1]!;
    if (graph === "follows") driver.follows = { id: "follower", ratio: 1 / 90 };
    else follower.rides = "drive";
    if (validateModel({ model }).success)
      findings.push(`a pure ${graph} cycle is admitted`);
  }

  // Forward binary64 endpoints must reverse to their legal bounds, while
  // the next representable value outside the image remains invalid.
  for (const ratio of [0.3, -0.3]) {
    const rule: IAutoMovieAffordanceCoupling = {
      id: "drive",
      ratio,
      reversible: true,
    };
    const rest: AutoMovieArchetype<Id, never> = fixture(rule, false, 7, 3);
    if (!validateModel({ model: rest }).success)
      findings.push(`ratio ${ratio}: its wider follower range is not admitted`);
    for (const bound of [-7, 7]) {
      const image: number = rest
        .articulate({ drive: bound })
        .travel("follower");
      const reversed: AutoMovieArchetype<Id, never> = rest.articulate({
        follower: image,
      });
      if (
        reversed.travel("drive") !== bound ||
        reversed.travel("follower") !== image ||
        affordanceLeadingTravel(rule, image, { minimum: -7, maximum: 7 }) !==
          bound
      )
        findings.push(
          `ratio ${ratio}: ${image} does not recover the exact bound ${bound}`,
        );
      const outside: number = Math.sign(image) * 2.1000000000000005;
      if (
        !refused(() => rest.articulate({ follower: outside })) ||
        affordanceLeadingTravel(rule, outside, { minimum: -7, maximum: 7 }) !==
          null
      )
        findings.push(
          `ratio ${ratio}: the adjacent out-of-image value ${outside} is admitted`,
        );
    }
    for (const drive of [-7.000000000000001, 7.000000000000001])
      if (!refused(() => rest.articulate({ drive })))
        findings.push(
          `an authored leader outside its bound, ${drive}, is repaired`,
        );
  }
  TestValidator.equals(
    "reversible coupling and separate dependency graphs",
    findings,
    [],
  );
}
