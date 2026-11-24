import { AutoMovieArchetypeUnits, createObstacle } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../../internal/archetypeModelSweep";
import { archetypePlaced } from "../../../internal/archetypePlaced";

/**
 * The obstacles are placed where they were put, declare the contacts a stepping, leaning or lifting act reads, and their sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. A crosstie, a sandbag, a concrete barrier, a crowd barrier and the rope and posts placed on a line through the public chain, each turned a different way: each rests at its placement on the floor within a millimetre, and every contact is a named point of the prop.
 * 2. Each kind declares exactly its contacts: `top` and `edge` on the crosstie, the sandbag and the concrete barrier, with the sandbag's `leftEnd` and `rightEnd` handles; the crowd barrier's `rail`; the rope and its two posts.
 * 3. Over 200 seeds: the crosstie exactly one of FOR-108's sections, 7 x 9, 6 x 8 or 7 x 8 in, and one of its lengths, 8 ft, 8 ft 6 in or 9 ft, every combination drawn; the laid sandbag 102 mm high and 305 mm long (USACE); the concrete barrier 813 mm high on a 610 mm base, its top 152 mm deep, its mass 669.7 to 818.5 kg per metre of its length (FHWA-RD-89-036); the crowd barrier's rail top 1.092 m (provisional listings); the posts' tops 1.016 m and the rope 1.829 m from post to post (provisional listings).
 * 4. Every `edge` lies on the front face of the top it bounds: at the top's height and at its `+Z` side.
 */
export function test_unit_archetypes_gym_obstacle_placed(): void {
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
    ...archetypeModelSweep([
      {
        name: "crosstie section and length",
        measure: (s: number): readonly number[] => {
          const tie: ReturnType<typeof createObstacle> = make("crosstie", s);
          return [
            archetypeExtent(tie, "y").high,
            archetypeExtent(tie, "z").size,
            archetypeExtent(tie, "x").size,
          ];
        },
        models: [
          [7, 9],
          [6, 8],
          [7, 8],
        ].flatMap(([depth, face]: number[]): number[][] =>
          [
            8 * AutoMovieArchetypeUnits.FOOT,
            8.5 * AutoMovieArchetypeUnits.FOOT,
            9 * AutoMovieArchetypeUnits.FOOT,
          ].map((length: number): number[] => [
            depth! * AutoMovieArchetypeUnits.INCH,
            face! * AutoMovieArchetypeUnits.INCH,
            length,
          ]),
        ),
        source: FOR108,
      },
    ]),
    ...archetypeBandSweep([
      row(
        "sandbag height",
        AutoMovieArchetypeUnits.FOOT / 3,
        AutoMovieArchetypeUnits.FOOT / 3,
        "USACE",
        (s: number): number => archetypeExtent(make("sandbag", s), "y").high,
      ),
      row(
        "sandbag length",
        AutoMovieArchetypeUnits.FOOT,
        AutoMovieArchetypeUnits.FOOT,
        "USACE",
        (s: number): number => archetypeExtent(make("sandbag", s), "x").size,
      ),
      row(
        "barrier height",
        32 * AutoMovieArchetypeUnits.INCH,
        32 * AutoMovieArchetypeUnits.INCH,
        "FHWA-RD-89-036",
        (s: number): number =>
          archetypeExtent(make("jerseyBarrier", s), "y").high,
      ),
      row(
        "barrier base",
        24 * AutoMovieArchetypeUnits.INCH,
        24 * AutoMovieArchetypeUnits.INCH,
        "FHWA-RD-89-036",
        (s: number): number =>
          archetypeExtent(make("jerseyBarrier", s), "z").size,
      ),
      row(
        "barrier top",
        6 * AutoMovieArchetypeUnits.INCH,
        6 * AutoMovieArchetypeUnits.INCH,
        "FHWA-RD-89-036",
        (s: number): number =>
          make("jerseyBarrier", s).affordance("top").depth!,
      ),
      row(
        "barrier mass per metre",
        (450 * AutoMovieArchetypeUnits.POUND) / AutoMovieArchetypeUnits.FOOT,
        (550 * AutoMovieArchetypeUnits.POUND) / AutoMovieArchetypeUnits.FOOT,
        "FHWA-RD-89-036, 450 to 550 lb/ft",
        (s: number): number => {
          const barrier: ReturnType<typeof createObstacle> = make(
            "jerseyBarrier",
            s,
          );
          return barrier.body.mass / archetypeExtent(barrier, "x").size;
        },
      ),
      row(
        "crowd barrier rail top",
        43 * AutoMovieArchetypeUnits.INCH,
        43 * AutoMovieArchetypeUnits.INCH,
        "listings",
        (s: number): number =>
          archetypeExtent(make("crowdBarrier", s), "y").high,
      ),
      row(
        "post top",
        40 * AutoMovieArchetypeUnits.INCH,
        40 * AutoMovieArchetypeUnits.INCH,
        "listings",
        (s: number): number =>
          archetypeExtent(make("ropeAndPosts", s), "y", ["leftPost-post"]).high,
      ),
      row(
        "post to post",
        6 * AutoMovieArchetypeUnits.FOOT,
        6 * AutoMovieArchetypeUnits.FOOT,
        "listings",
        (s: number): number => {
          const posts: ReturnType<typeof createObstacle> = make(
            "ropeAndPosts",
            s,
          );
          return (
            posts.affordance("leftPost").frame.translation.x -
            posts.affordance("rightPost").frame.translation.x
          );
        },
      ),
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
