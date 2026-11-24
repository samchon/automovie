import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type AutoMovieArchetypeFracture,
  AutoMovieArchetypeFrame,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A fragment keeps its declared contacts and complete articulations exactly
 * once. Cross-piece references detach in authored neutral coordinates.
 *
 * Three authored unit boxes have total mass 3 kg. Box a carries an explicitly
 * assigned grip that rides box b's slider; box b also carries a second riding
 * grip. The remaining box c follows that slider by f(0)=0.5 m, f(2)=1 m and
 * carries its own grip. Two sets release a and b at 1 J with zero momentum.
 *
 * Scenarios:
 * 1. The explicit grip belongs only to a, overriding the automatic carrier on b.
 *    Its missing carrier detaches; b keeps its slider and automatic riding grip.
 * 2. c keeps its independent slider and grip, dropping the absent driver's
 *    coupling. Its authored neutral x=0 replaces the original default x=0.5;
 *    broken does not promise to bake the displayed coupled pose.
 * 3. Both surviving sliders still move their actual geometry and carried grips
 *    through public articulate, and every resulting model is admitted.
 * 4. A set cannot explicitly carry an articulation bound to another set's parts.
 * 5. Each box's declared surface transfers only to the piece owning that box;
 *    removed part ids return null from the public surface query.
 */
export function test_unit_archetypes_core_fracture_ownership(): void {
  const findings: string[] = [];
  /** The fixture's articulations and grips retain their public ids after split. */
  type Id = "driver" | "follower" | "body" | "rider" | "kept";
  const builder: AutoMovieArchetypeBuilder<Id, never> = fixture();
  const model: AutoMovieArchetype<Id, never> = builder
    .fracture([
      { id: "a", parts: ["a"], affordances: ["body"] },
      { id: "b", parts: ["b"] },
    ])
    .build(3, { restitution: 0, outcome: { fracture: 1 } });
  const broken: ReturnType<typeof model.broken> = model.broken({
    energy: 1,
    momentum: { x: 0, y: 0, z: 0 },
  });
  if (broken === null || broken.remainder === null) {
    findings.push(
      "the authored boxes did not produce two fragments and a remainder",
    );
  } else {
    const a: AutoMovieArchetypeFracture.IPiece<never, Id> | undefined =
      broken.fragments.find(
        (f: AutoMovieArchetypeFracture.IPiece<never, Id>): boolean =>
          f.id === "a",
      );
    const b: AutoMovieArchetypeFracture.IPiece<never, Id> | undefined =
      broken.fragments.find(
        (f: AutoMovieArchetypeFracture.IPiece<never, Id>): boolean =>
          f.id === "b",
      );
    if (a === undefined || b === undefined)
      findings.push("a fragment identity is missing");
    else {
      const remainder: AutoMovieArchetype<Id, never> = broken.remainder;
      if (
        contacts(a.archetype) !== "body" ||
        contacts(b.archetype) !== "driver,rider" ||
        contacts(remainder) !== "follower,kept"
      )
        findings.push(
          "explicit and automatic contacts were lost, duplicated or assigned to the wrong piece",
        );
      if (
        a.archetype.affordance("body").rides !== undefined ||
        remainder.affordance("follower").follows !== undefined
      )
        findings.push("a cross-piece carrier or driver is still referenced");
      if (
        !(
          Math.abs(x(model, "c") - 0.5) <= 1e-12 &&
          x(remainder, "c") === 0 &&
          model.affordance("kept").frame.translation.x === 0.5 &&
          remainder.affordance("kept").frame.translation.x === 0
        )
      )
        findings.push(
          "detached coupling did not reset to the documented authored neutral coordinates",
        );
      for (const [piece, own, surface] of [
        [a.archetype, "a", "steel"],
        [b.archetype, "b", "wood"],
        [remainder, "c", "rubber"],
      ] as const)
        for (const id of ["a", "b", "c"])
          if (piece.surface(id) !== (id === own ? surface : null))
            findings.push(
              `${piece.id}: surface ${id} belongs to a different piece`,
            );
      const movedB: AutoMovieArchetype<Id, never> = b.archetype.articulate({
        driver: 2,
      });
      const movedC: AutoMovieArchetype<Id, never> = remainder.articulate({
        follower: 0.75,
      });
      if (
        !(
          Math.abs(x(movedB, "b") - 2) <= 1e-12 &&
          Math.abs(movedB.affordance("rider").frame.translation.x - 2) <=
            1e-12 &&
          Math.abs(x(movedC, "c") - 0.75) <= 1e-12 &&
          Math.abs(movedC.affordance("kept").frame.translation.x - 0.75) <=
            1e-12
        )
      )
        findings.push(
          "a surviving slider no longer moves its geometry and carried grip",
        );
      for (const piece of [
        model,
        a.archetype,
        b.archetype,
        remainder,
        movedB,
        movedC,
      ])
        if (!validateModel({ model: piece }).success)
          findings.push(
            `${piece.id}: fractured contact ownership is not admitted`,
          );
    }
  }
  let refused: boolean = false;
  try {
    fixture()
      .fracture([{ id: "a", parts: ["a"], affordances: ["driver"] }])
      .build(3, { restitution: 0, outcome: { fracture: 1 } })
      .broken({ energy: 1, momentum: { x: 0, y: 0, z: 0 } });
  } catch (error) {
    refused =
      error instanceof Error &&
      error.message.includes("bound outside its parts");
  }
  if (!refused)
    findings.push(
      "an explicit contact bound outside its fragment was accepted",
    );
  TestValidator.equals(
    "fracture preserves unique declared and carried contacts",
    findings,
    [],
  );

  /** Sorted semantic ids expose ownership independently of producer order. */
  function contacts(value: AutoMovieArchetype<Id, never>): string {
    return value.affordances
      .map((a: IAutoMovieAffordance): string => a.id)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
  }

  /** A missing geometry record must fail a finite-safe coordinate assertion. */
  function x(value: AutoMovieArchetype<Id, never>, id: string): number {
    return (
      value.parts.find((p: IAutoMovieModelPart): boolean => p.id === id)
        ?.transform?.translation.x ?? Number.NaN
    );
  }

  /** Authored neutral boxes and couplings isolate contact-transfer mechanics. */
  function fixture(): AutoMovieArchetypeBuilder<Id, never> {
    const result: AutoMovieArchetypeBuilder<Id, never> =
      new AutoMovieArchetypeBuilder<Id, never>({
        material: "steel",
        name: "ownership fixture",
        draw: new AutoMovieArchetypeDrawSession<never>(
          "ownership-fixture",
          {},
          undefined,
        ),
      });
    for (const [index, id] of ["a", "b", "c"].entries())
      result.box(
        id,
        { x: 1, y: 1, z: 1 },
        { x: 0, y: index + 0.5, z: 0 },
        { surface: id === "a" ? "steel" : id === "b" ? "wood" : "rubber" },
      );
    const frame: ReturnType<typeof AutoMovieArchetypeFrame.upright> =
      AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
    result.affordance({
      id: "driver",
      kind: "slider",
      extent: null,
      frame,
      travel: 2,
      parts: ["b"],
    });
    result.affordance({
      id: "follower",
      kind: "slider",
      extent: null,
      frame,
      travel: 1,
      parts: ["c"],
      follows: {
        id: "driver",
        table: [
          [0, 0.5],
          [2, 1],
        ],
      },
    });
    for (const [id, rides, y] of [
      ["body", "driver", 0.5],
      ["rider", "driver", 1.5],
      ["kept", "follower", 2.5],
    ] as const)
      result.affordance({
        id,
        rides,
        kind: "handle",
        symmetry: "round",
        extent: null,
        frame: AutoMovieArchetypeFrame.upright({ x: 0, y, z: 0 }),
        length: 1,
        aperture: 1,
      });
    return result;
  }
}
