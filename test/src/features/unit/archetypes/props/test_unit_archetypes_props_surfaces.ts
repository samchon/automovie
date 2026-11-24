import {
  type AutoMovieArchetype,
  createBow,
  createProjectile,
  createRock,
  createTool,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * The cutlery, the longbow, the projectiles and the stones declare the surfaces their records state, and each body's friction is its resting material's on concrete, or none where that material has no measured pair.
 *
 * Scenarios:
 * 1. Each part below reads back the material its record states: a spoon's, a fork's and a ladle's steel, the longbow's wooden limbs and grip, an arrow's and a bolt's wooden shaft and a bolt's steel head, a round shot's and a grenade's iron or steel, a cobble's and a boulder's stone.
 * 2. Parts whose material no record states declare none: the longbow's string, a musket ball's lead, a grenade's fuze.
 * 3. Each body carries its resting pair against concrete, as the sources give them: wood 0.61 to 0.88 static (0.745) with no kinetic for the longbow, the arrow and the bolt; steel 0.52 static and 0.46 kinetic for the cutlery, the round shot and the grenade; stone 0.57 and 0.53 for the cobble and the boulder; the musket ball, whose lead has no measured pair, no friction, static or kinetic.
 */
export function test_unit_archetypes_props_surfaces(): void {
  const findings: string[] = [];
  const wood: readonly [number | undefined, number | undefined] = [
    (0.61 + 0.88) / 2,
    undefined,
  ];
  const steel: readonly [number | undefined, number | undefined] = [0.52, 0.46];
  const stone: readonly [number | undefined, number | undefined] = [0.57, 0.53];
  const rows: readonly [
    string,
    AutoMovieArchetype,
    Readonly<Record<string, string | null>>,
    readonly [number | undefined, number | undefined],
  ][] = [
    [
      "spoon",
      createTool({ kind: "spoon" }, 1),
      { handle: "steel", bowl: "steel" },
      steel,
    ],
    [
      "fork",
      createTool({ kind: "fork" }, 1),
      { handle: "steel", tines: "steel" },
      steel,
    ],
    [
      "ladle",
      createTool({ kind: "ladle" }, 1),
      { handle: "steel", bowl: "steel" },
      steel,
    ],
    [
      "longbow",
      createBow({ kind: "longbow" }, 1),
      { lowerLimb: "wood", upperLimb: "wood", grip: "wood", string: null },
      wood,
    ],
    ["arrow", createProjectile({ kind: "arrow" }, 1), { shaft: "wood" }, wood],
    [
      "bolt",
      createProjectile({ kind: "bolt" }, 1),
      { shaft: "wood", head: "steel" },
      wood,
    ],
    [
      "ball",
      createProjectile({ kind: "ball" }, 1),
      { ball: null },
      [undefined, undefined],
    ],
    [
      "round shot",
      createProjectile({ kind: "roundShot" }, 1),
      { roundShot: "steel" },
      steel,
    ],
    [
      "grenade",
      createProjectile({ kind: "grenade" }, 1),
      { grenade: "steel", fuze: null },
      steel,
    ],
    ["cobble", createRock({ kind: "cobble" }, 1), { stone: "stone" }, stone],
    ["boulder", createRock({ kind: "boulder" }, 1), { stone: "stone" }, stone],
  ];
  for (const [name, model, surfaces, [friction, kinetic]] of rows) {
    for (const [part, material] of Object.entries(surfaces))
      if (model.surface(part) !== material)
        findings.push(
          `${name}: ${part} is ${model.surface(part)}, not ${material}`,
        );
    if (
      (friction === undefined
        ? model.body.friction !== undefined
        : Math.abs((model.body.friction ?? -1) - friction) > 1e-12) ||
      (kinetic === undefined
        ? model.body.kineticFriction !== undefined
        : Math.abs((model.body.kineticFriction ?? -1) - kinetic) > 1e-12)
    )
      findings.push(
        `${name}: friction ${model.body.friction} and ${model.body.kineticFriction}, not ${friction} and ${kinetic}`,
      );
  }
  TestValidator.equals("surfaces are the records' materials", findings, []);
}
