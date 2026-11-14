import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "@automovie/archetypes";
import { Quaternion, Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/** The fixture's articulations. */
type Id = "slide" | "swing" | "flap";

/** The degrees the `swing` hinge turns per metre of `slide`. */
const RATIO: number = 200;

/** The `flap` hinge's table: it rises with the slide and falls back, as a follower may. */
const TABLE: [number, number][] = [
  [0, 0],
  [0.1, 45],
  [0.3, 15],
];

/**
 * A fixture: a carriage on a 0.3 m slider leading two hinged leaves, `swing` by a ratio and `flap` by a table.
 *
 * @param flap The `flap` hinge's rule.
 * @param swing The `swing` hinge's rule.
 * @returns The fixture at rest.
 */
function fixture(
  flap: IAutoMovieAffordance.Follows = { id: "slide", table: TABLE },
  swing: IAutoMovieAffordance.Follows = { id: "slide", ratio: RATIO },
): Archetype<Id, never> {
  const v: typeof Vector3.create = Vector3.create;
  return new ArchetypeBuilder<Id, never>({
    archetype: "fixture",
    name: "fixture",
    dimensions: {},
  })
    .box("base", v(1, 0.1, 1), v(0, 0.05, 0))
    .box("carriage", v(0.1, 0.1, 0.1), v(0, 0.2, 0))
    .box("leaf", v(0.4, 0.3, 0.02), v(0.3, 0.5, 0))
    .box("flap-leaf", v(0.4, 0.3, 0.02), v(-0.5, 0.5, 0))
    .affordance({
      id: "slide",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(0, 0.2, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      travel: 0.3,
      parts: ["carriage"],
    })
    .affordance({
      id: "swing",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0.1, 0.5, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      travel: 90,
      parts: ["leaf"],
      follows: swing,
    })
    .affordance({
      id: "flap",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(-0.3, 0.5, 0), v(0, 1, 0), v(-1, 0, 0)),
      extent: null,
      travel: 60,
      parts: ["flap-leaf"],
      follows: flap,
    })
    .build(10);
}

/** Where a part's centre is in its model. */
function centre(archetype: Archetype<Id, never>, part: string): IAutoMovieVector3 {
  return archetype.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === part,
  )!.transform!.translation;
}

/** A point turned about the upright through a pivot. */
function turned(
  point: IAutoMovieVector3,
  pivot: IAutoMovieVector3,
  degrees: number,
): IAutoMovieVector3 {
  return Vector3.add(
    pivot,
    Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, degrees),
      Vector3.subtract(point, pivot),
    ),
  );
}

/** The paths of a model's violations, or none when it is admitted. */
function faults(model: IAutoMovieModel): string[] {
  const validation: IAutoMovieValidation = validateModel({ model });
  return validation.success
    ? []
    : validation.violations.map(
        (v: IAutoMovieConstraintViolation): string => v.path,
      );
}

/**
 * An articulation that follows another moves with its leader by its declared rule, a state names only leaders, and the archetypes and the engine refuse every way a `follows` can be wrong.
 *
 * Scenarios, on a fixture whose 0.3 m slider leads a hinge by a ratio of 200 degrees per metre and another by a table that rises to 45 degrees and falls back to 15:
 * 1. At 11 travels across the slider's range, each hinged leaf's centre sits where turning its rest centre about its hinge by the rule's angle puts it, within 1e-9 m; `travel` reads each follower's angle and the state names the slider alone.
 * 2. A follower named in the state is refused at its own id with its leader as the one alternative.
 * 3. Two hinges that follow each other are refused when the model is built, at one of the two, listing the slider among the articulations that may lead.
 * 4. A table that leads a 60-degree hinge to 75 degrees at mid-slide is admitted at rest and refused at that travel with the hinge's range, 0 to 60 degrees.
 * 5. A follower's rule serialises as data in the model.
 * 6. The engine admits the fixture and refuses, each at its own path: a leader that does not resolve, a `follows` on a contact that does not travel, a rule with both a ratio and a table, a ratio that is not finite, a table that stops short of its leader's range, a table whose leader travels do not increase, a ratio that drives its follower past its range, a ratio on an endless crank leading a bounded hinge, and a chain through `follows` and `rides` that returns to the follower.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Articulates a built archetype and reads its moved parts and travels, and runs the engine's model admission on copies broken one way each; a follower left at rest, set by the wrong rule, admitted in a state, resolved through a cycle, or driven out of its range unrefused is caught, as is an admission that lets a malformed rule through.
 * @evidence contracts/development/testing.md#independent-expectations Each leaf's place is the rest centre turned about its hinge's upright by the rule's angle, computed here: the ratio's product and the table's linear interpolation written in this test, the turn by the engine's quaternion arithmetic, not by the articulation code. The rules the engine enforces are those `IAutoMovieAffordance.Follows` states.
 * @evidence contracts/development/testing.md#distinguishing-cases A ratio and a non-monotone table, the slider's two ends and nine travels between, a follower and a leader in the state, a cycle, a table inside and outside its follower's range, and one engine copy per rule; the car's road wheels, a real producer's followers, belong to `test_archetype_ride_car`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_contract_follows(): void {
  const findings: string[] = [];
  const rest: Archetype<Id, never> = fixture();
  const hinge = (id: Id): IAutoMovieVector3 =>
    rest.affordance(id).frame.translation;

  // 1. Each leaf turns by its rule at the slider's travel.
  const table = (s: number): number => {
    for (let k: number = 1; k < TABLE.length; k++) {
      const [x0, y0]: [number, number] = TABLE[k - 1]!;
      const [x1, y1]: [number, number] = TABLE[k]!;
      if (s <= x1) return y0 + ((y1 - y0) * (s - x0)) / (x1 - x0);
    }
    return TABLE[TABLE.length - 1]![1];
  };
  for (let k: number = 0; k <= 10; k++) {
    const slide: number = (0.3 * k) / 10;
    const posed: Archetype<Id, never> = rest.articulate({ slide });
    for (const [id, part, angle] of [
      ["swing", "leaf", RATIO * slide],
      ["flap", "flap-leaf", table(slide)],
    ] as const) {
      if (
        !vclose(
          centre(posed, part),
          turned(centre(rest, part), hinge(id), angle),
          1e-9,
        )
      )
        findings.push(`${part} at a slide of ${slide} m`);
      if (Math.abs(posed.travel(id) - angle) > 1e-9)
        findings.push(`${id}'s travel ${posed.travel(id)} at ${slide} m, not ${angle}`);
    }
    if (JSON.stringify(Object.keys(posed.state)) !== '["slide"]')
      findings.push(`the state names ${Object.keys(posed.state).join(", ")}`);
  }

  // 2. A follower is not set in a state.
  const named: ArchetypeRefusal | null = refused(() =>
    rest.articulate({ swing: 10 }),
  );
  if (
    named?.kind !== "articulation" ||
    named.axis !== "swing" ||
    named.feasible?.kind !== "alternatives" ||
    named.feasible.values.join() !== "slide"
  )
    findings.push(`a follower in the state: ${named?.message ?? "admitted"}`);

  // 3. Two followers of each other.
  const cycle: ArchetypeRefusal | null = refused(() =>
    fixture({ id: "swing", ratio: 1 }, { id: "flap", ratio: 1 }),
  );
  if (
    cycle?.kind !== "articulation" ||
    !["swing", "flap"].includes(cycle.axis) ||
    cycle.feasible?.kind !== "alternatives" ||
    !cycle.feasible.values.includes("slide")
  )
    findings.push(`a cycle of followers: ${cycle?.message ?? "admitted"}`);

  // 4. A table that leaves its follower's range at mid-slide.
  const over: Archetype<Id, never> = fixture({
    id: "slide",
    table: [
      [0, 0],
      [0.15, 75],
      [0.3, 0],
    ],
  });
  const beyond: ArchetypeRefusal | null = refused(() =>
    over.articulate({ slide: 0.15 }),
  );
  if (
    beyond?.kind !== "articulation" ||
    beyond.axis !== "flap" ||
    beyond.feasible?.kind !== "range" ||
    beyond.feasible.minimum !== 0 ||
    beyond.feasible.maximum !== 60 ||
    beyond.feasible.unit !== "degrees"
  )
    findings.push(`a table past its range: ${beyond?.message ?? "admitted"}`);
  if (refused(() => over.articulate({ slide: 0.05 })) !== null)
    findings.push("a table inside its range is refused");

  // 5. The rule serialises.
  const serialised: IAutoMovieModel = JSON.parse(
    JSON.stringify(rest),
  ) as IAutoMovieModel;
  TestValidator.equals(
    "a follower's rule serialises as data",
    serialised.affordances![1]!.follows,
    { id: "slide", ratio: RATIO },
  );

  // 6. The engine's admission of each rule.
  const copy = (
    edit: (affordances: IAutoMovieAffordance[]) => void,
  ): IAutoMovieModel => {
    const model: IAutoMovieModel = JSON.parse(
      JSON.stringify(rest),
    ) as IAutoMovieModel;
    edit(model.affordances!);
    return model;
  };
  const at = (k: number, field: string): string =>
    `$input.affordances[${k}].follows${field}`;
  const cases: readonly (readonly [
    string,
    (affordances: IAutoMovieAffordance[]) => void,
    string,
  ])[] = [
    [
      "an unknown leader",
      (a: IAutoMovieAffordance[]): void => {
        a[1]!.follows = { id: "ghost", ratio: 1 };
      },
      at(1, ".id"),
    ],
    [
      "a contact that does not travel",
      (a: IAutoMovieAffordance[]): void => {
        a.push({
          id: "grip",
          kind: "handle",
          frame: a[0]!.frame,
          extent: null,
          follows: { id: "slide", ratio: 1 },
        });
      },
      at(3, ""),
    ],
    [
      "a ratio and a table",
      (a: IAutoMovieAffordance[]): void => {
        // Both forms at once, which the type forbids, as a model read from JSON may still carry.
        a[1]!.follows = JSON.parse(
          JSON.stringify({ id: "slide", ratio: 1, table: TABLE }),
        ) as IAutoMovieAffordance.Follows;
      },
      at(1, ""),
    ],
    [
      "a ratio that is not finite",
      (a: IAutoMovieAffordance[]): void => {
        a[1]!.follows = { id: "slide", ratio: Number.POSITIVE_INFINITY };
      },
      at(1, ".ratio"),
    ],
    [
      "a table short of the range",
      (a: IAutoMovieAffordance[]): void => {
        a[2]!.follows = {
          id: "slide",
          table: [
            [0, 0],
            [0.2, 10],
          ],
        };
      },
      at(2, ".table"),
    ],
    [
      "a table that does not increase",
      (a: IAutoMovieAffordance[]): void => {
        a[2]!.follows = {
          id: "slide",
          table: [
            [0, 0],
            [0, 10],
            [0.3, 20],
          ],
        };
      },
      at(2, ".table[1][0]"),
    ],
    [
      "a ratio past the follower's range",
      (a: IAutoMovieAffordance[]): void => {
        a[1]!.follows = { id: "slide", ratio: 400 };
      },
      at(1, ""),
    ],
    [
      "an endless leader",
      (a: IAutoMovieAffordance[]): void => {
        const crank: IAutoMovieAffordance = { ...a[0]!, kind: "crank" };
        delete crank.travel;
        a[0] = crank;
      },
      at(1, ".ratio"),
    ],
    [
      "a cycle through follows and rides",
      (a: IAutoMovieAffordance[]): void => {
        a[0] = { ...a[0]!, rides: "swing" };
      },
      at(1, ".id"),
    ],
  ];
  TestValidator.equals(
    "the engine admits the fixture",
    faults(copy((): void => undefined)),
    [],
  );
  for (const [name, edit, path] of cases) {
    const got: string[] = faults(copy(edit));
    if (!got.includes(path))
      findings.push(
        `${name}: expected a fault at ${path}, got ${got.join(", ") || "none"}`,
      );
  }
  TestValidator.equals("an articulation follows its leader", findings, []);
}
/** Run an operation and return the refusal it raises, or null when it raises none or something else. */
function refused(operation: () => unknown): ArchetypeRefusal | null {
  try {
    operation();
  } catch (error) {
    return error instanceof ArchetypeRefusal ? error : null;
  }
  return null;
}
