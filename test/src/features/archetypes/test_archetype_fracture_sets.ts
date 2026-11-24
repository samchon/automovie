import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  createDoor,
  createDrinkware,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A breakable archetype breaks into its declared fragments at its threshold and not below it, its pieces together keeping its mass and parts.
 *
 * Scenarios:
 * 1. An empty and a full beer bottle break at their read energies, 40 J and 30 J (Bolliger et al. 2009), and not 1 J below: the `shards` fragment is the body, the remainder the neck holding the `neck` grip, the `mouth` and the `lip`, and no longer the `body` grip, which the shards carry away.
 * 2. The fragment's and the remainder's masses sum to the bottle's within 1e-9 kg, and every part is in exactly one of them.
 * 3. The fragment leaves with the hit's momentum over its mass, the perfectly inelastic share.
 * 4. A part-filled bottle, whose threshold is unread, and a mug, which declares no fracture, never break.
 * 4b. A hinged door's leaf leaves its frame whole at the 80 J that breaks an unreinforced softwood frame under ASTM F476's ram (US 11280110 B1), and not at 79 J, the pieces weighing the door; the frame keeps only its `aperture`, the hinge, the latch and the handles riding them leaving with the leaf.
 * 5. A fracture set naming an unrecorded part, a part another set carries or a part twice, a set id declared twice, a set of no part, a contact not declared, and a contact two sets carry are each refused by the builder.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Breaks real bottles at and below their thresholds and reads the pieces' masses, parts, contacts and velocities; a bottle that breaks below its energy, loses mass, duplicates a part, keeps the wrong contacts or flies off at another speed is caught.
 * @evidence contracts/development/testing.md#independent-expectations The energies are the cited drop-tower figures, written here; the velocity is momentum over mass, worked here.
 * @evidence contracts/development/testing.md#distinguishing-cases Empty and full, at and below the threshold, a part-filled bottle, a mug, a door and seven builder refusals.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_fracture_sets(): void {
  const findings: string[] = [];
  const momentum: { x: number; y: number; z: number } = { x: 0, y: 0, z: 2 };
  for (const [fill, energy] of [
    [0, 40],
    [1, 30],
  ] as const) {
    const bottle: ReturnType<typeof createDrinkware> = createDrinkware({
      kind: "beerBottle",
      fill,
    });
    const label: string = `a beer bottle filled ${fill}`;
    if (bottle.broken({ energy: energy - 1, momentum }) !== null)
      findings.push(`${label} breaks below ${energy} J`);
    const broken: ReturnType<typeof bottle.broken> = bottle.broken({
      energy,
      momentum,
    });
    if (broken === null || broken.remainder === null) {
      findings.push(`${label} does not break at ${energy} J`);
      continue;
    }
    const shards: (typeof broken.fragments)[number] | undefined =
      broken.fragments.find((f: { id: string }): boolean => f.id === "shards");
    if (shards === undefined || broken.fragments.length !== 1) {
      findings.push(
        `${label}: fragments ${broken.fragments.map((f: { id: string }): string => f.id).join(", ")}`,
      );
      continue;
    }
    const ids: (parts: readonly IAutoMovieModelPart[]) => string[] = (
      parts: readonly IAutoMovieModelPart[],
    ): string[] =>
      parts
        .map((p: IAutoMovieModelPart): string => p.id)
        .sort((a: string, b: string): number => a.localeCompare(b));
    const all: string[] = ids(bottle.parts);
    const pieces: string[] = [
      ...ids(broken.remainder.parts),
      ...ids(shards.archetype.parts),
    ].sort((a: string, b: string): number => a.localeCompare(b));
    if (JSON.stringify(all) !== JSON.stringify(pieces))
      findings.push(
        `${label}: parts ${JSON.stringify(pieces)} against ${JSON.stringify(all)}`,
      );
    if (
      JSON.stringify(ids(shards.archetype.parts)) !== JSON.stringify(["body"])
    )
      findings.push(
        `${label}: the shards are ${JSON.stringify(ids(shards.archetype.parts))}`,
      );
    const mass: number =
      broken.remainder.body.mass + shards.archetype.body.mass;
    if (!(Math.abs(mass - bottle.body.mass) <= 1e-9))
      findings.push(
        `${label}: the pieces weigh ${mass} kg, the bottle ${bottle.body.mass} kg`,
      );
    const kept: string[] = broken.remainder.affordances.map(
      (a: { id: string }): string => a.id,
    );
    if (
      !kept.includes("neck") ||
      !kept.includes("mouth") ||
      !kept.includes("lip") ||
      kept.includes("body")
    )
      findings.push(`${label}: the neck keeps ${kept.join(", ")}`);
    if (
      shards.archetype.affordance("body").kind !== "handle" ||
      JSON.stringify(
        shards.archetype.affordances.map((a: { id: string }): string => a.id),
      ) !== JSON.stringify(["body"])
    )
      findings.push(`${label}: the departing body lost its public grip`);
    const v: number = momentum.z / shards.archetype.body.mass;
    if (
      !(Math.abs(shards.velocity.z - v) <= 1e-9) ||
      shards.velocity.x !== 0 ||
      shards.velocity.y !== 0
    )
      findings.push(
        `${label}: the shards leave at ${JSON.stringify(shards.velocity)}, ${v} m/s expected`,
      );
  }
  if (
    createDrinkware({ kind: "beerBottle", fill: 0.5 }).broken({
      energy: 1000,
      momentum,
    }) !== null
  )
    findings.push("a part-filled bottle breaks");
  if (
    createDrinkware({ kind: "mug" }).broken({ energy: 1000, momentum }) !== null
  )
    findings.push("a mug breaks");

  // A hinged door's leaf leaves its frame whole at 80 J, and not below.
  const door: ReturnType<typeof createDoor> = createDoor({ kind: "hinged" });
  if (door.broken({ energy: 79, momentum }) !== null)
    findings.push("a door breaks below 80 J");
  const kicked: ReturnType<typeof door.broken> = door.broken({
    energy: 80,
    momentum,
  });
  const leaf:
    | {
        archetype: {
          parts: readonly IAutoMovieModelPart[];
          body: { mass: number };
        };
      }
    | undefined = kicked?.fragments.find(
    (f: { id: string }): boolean => f.id === "leaf",
  );
  if (kicked === null || kicked.remainder === null || leaf === undefined)
    findings.push("a door does not lose its leaf at 80 J");
  else {
    if (
      !leaf.archetype.parts.some(
        (p: IAutoMovieModelPart): boolean => p.id === "leaf",
      )
    )
      findings.push("the door's fragment holds no leaf");
    if (
      !(
        Math.abs(
          kicked.remainder.body.mass +
            leaf.archetype.body.mass -
            door.body.mass,
        ) <= 1e-9
      )
    )
      findings.push("the door's pieces do not weigh the door");
    // The frame keeps its opening; the hinge, the latch and the handles that ride them leave with the leaf.
    const frame: string[] = kicked.remainder.affordances.map(
      (a: { id: string }): string => a.id,
    );
    if (JSON.stringify(frame) !== JSON.stringify(["aperture"]))
      findings.push(`the door's frame keeps ${frame.join(", ")}`);
  }

  // The builder's refusals.
  const builder: () => AutoMovieArchetypeBuilder<
    "top",
    never
  > = (): AutoMovieArchetypeBuilder<"top", never> =>
    new AutoMovieArchetypeBuilder<"top", never>({
      material: "steel",
      name: "fixture",
      draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
    })
      .box("a", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
      .box("b", Vector3.create(1, 1, 1), Vector3.create(0, 1.5, 0))
      .affordance({
        id: "top",
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 2, 0)),
        extent: null,
        width: 1,
        depth: 1,
      });
  for (const [label, sets] of [
    ["an unrecorded part", [{ id: "x", parts: ["c"] }]],
    [
      "a shared part",
      [
        { id: "x", parts: ["a"] },
        { id: "y", parts: ["a", "b"] },
      ],
    ],
    ["a part twice in one set", [{ id: "x", parts: ["a", "a"] }]],
    [
      "an id twice",
      [
        { id: "x", parts: ["a"] },
        { id: "x", parts: ["b"] },
      ],
    ],
    ["no part", [{ id: "x", parts: [] }]],
    [
      "an undeclared contact",
      [{ id: "x", parts: ["a"], affordances: ["side"] }],
    ],
    [
      "a contact two sets carry",
      [
        { id: "x", parts: ["a"], affordances: ["top"] },
        { id: "y", parts: ["b"], affordances: ["top"] },
      ],
    ],
  ] as const) {
    let threw: boolean = false;
    try {
      builder().fracture(sets);
    } catch {
      threw = true;
    }
    if (!threw) findings.push(`a fracture set naming ${label} was accepted`);
  }
  TestValidator.equals(
    "a bottle breaks into its declared pieces at its threshold",
    findings,
    [],
  );
}
