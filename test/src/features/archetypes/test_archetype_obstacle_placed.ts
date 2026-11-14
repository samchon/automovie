import { createObstacle } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The obstacles are placed where they were put, declare the contacts a stepping, leaning or lifting act reads, and their sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. A crosstie, a sandbag, a concrete barrier, a crowd barrier and the rope and posts placed on a line through the public chain, each turned a different way: each rests at its placement on the floor within a millimetre, and every contact is a named point of the prop.
 * 2. Each kind declares exactly its contacts: `top` and `edge` on the crosstie, the sandbag and the concrete barrier, with the sandbag's `leftEnd` and `rightEnd` handles; the crowd barrier's `rail`; the rope and its two posts.
 * 3. Over 200 seeds: the crosstie 152 to 178 mm high, 203 to 229 mm wide and 2.438 to 2.743 m long (FOR-108); the laid sandbag 102 mm high and 305 mm long (USACE); the concrete barrier 813 mm high on a 610 mm base, its top 152 mm deep, its mass 669.7 to 818.5 kg per metre of its length (FHWA-RD-89-036); the crowd barrier's rail top 1.092 m (provisional listings); the posts' tops 1.016 m and the rope 1.829 m from post to post (provisional listings).
 * 4. Every `edge` lies on the front face of the top it bounds: at the top's height and at its `+Z` side.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every kind through the public chain and reads the displayed prop frames, measures colliders, contacts and mass on the produced obstacles; a floating obstacle, a missing edge, an edge off its top, or a size off its source fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the sources' numbers written here; the barrier's mass per metre is the measured mass over the measured length.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind for placement and contacts; stepping over the low ones and refusing the high ones belongs to `test_archetype_obstacle_step_over`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_obstacle_placed(): void {
  // 1. Placed.
  const findings: string[] = archetypePlaced(
    createObstacle.KINDS.map(
      (kind: createObstacle.Kind, index: number): archetypePlaced.IRow => ({
        name: `obstacle-${kind}`,
        archetype: createObstacle({ kind }),
        yaw: 45 * index,
      }),
    ),
  );

  // 2. The contacts and their kinds.
  const expected: Readonly<Record<createObstacle.Kind, string>> = {
    crosstie: "edge:ledge,top:surface",
    sandbag: "edge:ledge,leftEnd:handle,rightEnd:handle,top:surface",
    jerseyBarrier: "edge:ledge,top:surface",
    crowdBarrier: "rail:bar",
    ropeAndPosts: "leftPost:bar,rightPost:bar,rope:bar",
  };
  for (const kind of createObstacle.KINDS) {
    const declared: string = createObstacle({ kind })
      .affordances.map((a: IAutoMovieAffordance): string => `${a.id}:${a.kind}`)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
    if (declared !== expected[kind])
      findings.push(`${kind} declares ${declared}, ${expected[kind]} expected`);
  }

  // 3. The bands.
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  const make = (
    kind: createObstacle.Kind,
    seed: number,
  ): ReturnType<typeof createObstacle> => createObstacle({ kind }, seed);
  const FOR108: string = "FOR-108";
  findings.push(
    ...archetypeBandSweep([
      row("crosstie height", 0.152, 0.178, FOR108, (s: number): number =>
        archetypeExtent(make("crosstie", s), "y").high,
      ),
      row("crosstie width", 0.203, 0.229, FOR108, (s: number): number =>
        archetypeExtent(make("crosstie", s), "z").size,
      ),
      row("crosstie length", 2.438, 2.743, FOR108, (s: number): number =>
        archetypeExtent(make("crosstie", s), "x").size,
      ),
      row("sandbag height", 0.102, 0.102, "USACE", (s: number): number =>
        archetypeExtent(make("sandbag", s), "y").high,
      ),
      row("sandbag length", 0.305, 0.305, "USACE", (s: number): number =>
        archetypeExtent(make("sandbag", s), "x").size,
      ),
      row("barrier height", 0.813, 0.813, "FHWA-RD-89-036", (s: number): number =>
        archetypeExtent(make("jerseyBarrier", s), "y").high,
      ),
      row("barrier base", 0.61, 0.61, "FHWA-RD-89-036", (s: number): number =>
        archetypeExtent(make("jerseyBarrier", s), "z").size,
      ),
      row("barrier top", 0.152, 0.152, "FHWA-RD-89-036", (s: number): number =>
        make("jerseyBarrier", s).affordance("top").depth!,
      ),
      row(
        "barrier mass per metre",
        669.7,
        818.5,
        "FHWA-RD-89-036, 450 to 550 lb/ft",
        (s: number): number => {
          const barrier: ReturnType<typeof createObstacle> = make(
            "jerseyBarrier",
            s,
          );
          return barrier.body.mass / archetypeExtent(barrier, "x").size;
        },
      ),
      row("crowd barrier rail top", 1.092, 1.092, "listings", (s: number): number =>
        archetypeExtent(make("crowdBarrier", s), "y").high,
      ),
      row("post top", 1.016, 1.016, "listings", (s: number): number =>
        archetypeExtent(make("ropeAndPosts", s), "y", ["leftPost-post"]).high,
      ),
      row("post to post", 1.829, 1.829, "listings", (s: number): number => {
        const posts: ReturnType<typeof createObstacle> = make("ropeAndPosts", s);
        return (
          posts.affordance("leftPost").frame.translation.x -
          posts.affordance("rightPost").frame.translation.x
        );
      }),
    ]),
  );

  // 4. Each edge on its top's front side.
  for (const kind of ["crosstie", "sandbag", "jerseyBarrier"] as const) {
    const obstacle: ReturnType<typeof createObstacle> = createObstacle(
      { kind },
      9,
    );
    const top: IAutoMovieAffordance = obstacle.affordance("top");
    const edge: IAutoMovieAffordance = obstacle.affordance("edge");
    const front: number = top.frame.translation.z + top.depth! / 2;
    if (
      Math.abs(edge.frame.translation.y - top.frame.translation.y) > 1e-9 ||
      Math.abs(edge.frame.translation.z - front) > 1e-9 ||
      Math.abs(archetypeExtent(obstacle, "y").high - top.frame.translation.y) >
        1e-9
    )
      findings.push(
        `the ${kind}'s edge stands at (${edge.frame.translation.y}, ${edge.frame.translation.z}), its top's front at (${top.frame.translation.y}, ${front})`,
      );
  }
  TestValidator.equals("obstacles are placed and sized", findings, []);
}
