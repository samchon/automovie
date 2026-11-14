import {
  type Archetype,
  createBow,
  createProjectile,
  createRock,
  createTool,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * The cutlery, the longbow, the projectiles and the stones declare the surfaces their records state, and their bodies keep the named friction placeholder where no source measured their material on concrete.
 *
 * Scenarios:
 * 1. Each part below reads back the material its record states: a spoon's, a fork's and a ladle's steel, the longbow's wooden limbs and grip, an arrow's and a bolt's wooden shaft and a bolt's steel head, a round shot's and a grenade's iron or steel, a cobble's and a boulder's stone.
 * 2. Parts whose material no record states declare none: the longbow's string, a musket ball's lead, a grenade's fuze.
 * 3. Each of these bodies keeps the 0.5 placeholder and no kinetic friction, since none of their materials has a measured pair with concrete.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each model and reads its parts' declared surfaces and its body's friction; a material the record does not state, a part left bare that should not be, or a body given a coefficient no source measured is caught.
 * @evidence contracts/development/testing.md#independent-expectations The materials are the cited pages' (IKEA's stainless cutlery, Rösle's ladle, Aston and Spencer's elm bows and poplar arrows, the Met's steel-and-oak bolts, Roberts' cast-iron shot, the M67's steel sphere, Britannica's granite), written here as literals.
 * @evidence contracts/development/testing.md#distinguishing-cases Four producers, steel, wood and stone, declared and bare parts.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_surfaces(): void {
  const findings: string[] = [];
  const rows: readonly [
    string,
    Archetype,
    Readonly<Record<string, string | null>>,
  ][] = [
    [
      "spoon",
      createTool({ kind: "spoon" }, 1),
      { handle: "steel", bowl: "steel" },
    ],
    [
      "fork",
      createTool({ kind: "fork" }, 1),
      { handle: "steel", tines: "steel" },
    ],
    [
      "ladle",
      createTool({ kind: "ladle" }, 1),
      { handle: "steel", bowl: "steel" },
    ],
    [
      "longbow",
      createBow({ kind: "longbow" }, 1),
      { lowerLimb: "wood", upperLimb: "wood", grip: "wood", string: null },
    ],
    ["arrow", createProjectile({ kind: "arrow" }, 1), { shaft: "wood" }],
    [
      "bolt",
      createProjectile({ kind: "bolt" }, 1),
      { shaft: "wood", head: "steel" },
    ],
    ["ball", createProjectile({ kind: "ball" }, 1), { ball: null }],
    [
      "round shot",
      createProjectile({ kind: "roundShot" }, 1),
      { roundShot: "steel" },
    ],
    [
      "grenade",
      createProjectile({ kind: "grenade" }, 1),
      { grenade: "steel", fuze: null },
    ],
    ["cobble", createRock({ kind: "cobble" }, 1), { stone: "stone" }],
    ["boulder", createRock({ kind: "boulder" }, 1), { stone: "stone" }],
  ];
  for (const [name, model, surfaces] of rows) {
    for (const [part, material] of Object.entries(surfaces))
      if (model.surface(part) !== material)
        findings.push(
          `${name}: ${part} is ${model.surface(part)}, not ${material}`,
        );
    if (model.body.friction !== 0.5 || model.body.kineticFriction !== undefined)
      findings.push(`${name}: its body has friction no source measured`);
  }
  TestValidator.equals("surfaces are the records' materials", findings, []);
}
