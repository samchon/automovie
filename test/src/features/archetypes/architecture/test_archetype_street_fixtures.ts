import { AutoMovieArchetypeUnits, AutoMovieArchetypeStreetFixture, } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";
/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;
/**
 * Traffic cones, bollards, hydrants and lamp posts stand at their sources' sizes, with their contacts where a hand meets them.
 *
 * Scenarios:
 * 1. Over 200 seeds a cone stands exactly the MUTCD's 18 or 28 in, each drawn, its base 13.4 in for every 28 in of height as the Brimar cone's, lifted by a handle at its top.
 * 2. A bollard stands Reliance's 36 in, over 200 seeds exactly one of its R-1007 pipes, 4.50, 6.625, 8.625 or 10.750 in across at 76, 133, 200 or 284 lb, pipe and mass together, each drawn, its post a bar the shaft's height and its top a face at the top.
 * 3. A hydrant stands AMERICAN-Darling's 30.5 in with its nozzles' centreline 18 in up, the pumper's face 8.84 in out toward `+Z` and the hose nozzles' 8.48 in toward `+X` and `-X`, each face a socket, its nut a knob on top.
 * 4. A lamp post's shaft stands Wave's 12 ft on a 9 1/4 in base under Sternberg's 21 in by 40 in luminaire, its post a bar from the base's top to the shaft's top.
 * 5. A sign post holds a STOP sign, over 200 seeds exactly 30 or 36 in, each drawn, with its bottom edge at the MUTCD's 7 ft on Atkore's 2 in post, the post below the sign a bar.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies five street fixtures and their distinct handle, knob, top and sign contacts.
 * @evidence contracts/development/testing.md#behavioral-verification Measures public fixture models across seeded dimensions and whole catalogue entries. It reads actual contact placement and rejects conflating a bollard's size with another entry's mass.
 * @evidence contracts/development/testing.md#independent-expectations Uses the fixture's MUTCD and maker figures in metres and paired bollard sizes and masses. Measured component faces locate each corresponding contact.
 */
export function test_archetype_street_fixtures(): void {
    const findings: string[] = [];
    const near = (what: string, got: number, wanted: number): void => {
        if (!(Math.abs(got - wanted) <= MM))
            findings.push(`${what}: ${got}, ${wanted} expected`);
    };
    const make = (kind: AutoMovieArchetypeStreetFixture.Kind, seed: number): ReturnType<typeof AutoMovieArchetypeStreetFixture.create> => AutoMovieArchetypeStreetFixture.create({ kind }, seed);
    // 1. The cone.
    findings.push(...archetypeModelSweep([
        {
            name: "cone height",
            measure: (seed: number): readonly number[] => [
                archetypeExtent(make("trafficCone", seed), "y").size,
            ],
            models: [
                [18 * AutoMovieArchetypeUnits.INCH],
                [28 * AutoMovieArchetypeUnits.INCH],
            ],
            source: "MUTCD 6F.64",
        },
        {
            name: "bollard pipe and mass",
            measure: (seed: number): readonly number[] => {
                const bollard: ReturnType<typeof AutoMovieArchetypeStreetFixture.create> = make("bollard", seed);
                return [archetypeExtent(bollard, "x").size, bollard.properties.mass];
            },
            models: [
                [4.5, 76],
                [6.625, 133],
                [8.625, 200],
                [10.75, 284],
            ].map(([inches, pounds]: number[]): number[] => [
                inches! * AutoMovieArchetypeUnits.INCH,
                pounds! * AutoMovieArchetypeUnits.POUND,
            ]),
            source: "Reliance R-1007",
        },
    ]));
    for (const seed of [0, 9]) {
        const cone: ReturnType<typeof AutoMovieArchetypeStreetFixture.create> = make("trafficCone", seed);
        const height: number = archetypeExtent(cone, "y").size;
        near(`cone ${seed}: the base`, archetypeExtent(cone, "x", ["base"]).size, (13.4 / 28) * height);
        near(`cone ${seed}: the handle at the top`, cone.affordance("top").frame.translation.y, height);
    }
    // 2. The bollard.
    const bollard: ReturnType<typeof AutoMovieArchetypeStreetFixture.create> = make("bollard", 3);
    near("the bollard's height", archetypeExtent(bollard, "y").high, 36 * AutoMovieArchetypeUnits.INCH);
    near("the bollard's post", bollard.affordance("post").length!, 36 * AutoMovieArchetypeUnits.INCH);
    near("the bollard's top", bollard.affordance("top").frame.translation.y, 36 * AutoMovieArchetypeUnits.INCH);
    // 3. The hydrant.
    const hydrant: ReturnType<typeof AutoMovieArchetypeStreetFixture.create> = make("hydrant", 3);
    near("the hydrant's height", archetypeExtent(hydrant, "y").high, 30.5 * AutoMovieArchetypeUnits.INCH);
    near("the pumper's face", hydrant.affordance("pumper").frame.translation.z, 8.84 * AutoMovieArchetypeUnits.INCH);
    near("the left hose face", hydrant.affordance("hoseLeft").frame.translation.x, 8.48 * AutoMovieArchetypeUnits.INCH);
    near("the right hose face", hydrant.affordance("hoseRight").frame.translation.x, -8.48 * AutoMovieArchetypeUnits.INCH);
    for (const part of ["pumper", "hose-left", "hose-right"]) {
        const y: {
            low: number;
            high: number;
        } = archetypeExtent(hydrant, "y", [
            part,
        ]);
        near(`the hydrant's ${part} centreline`, (y.low + y.high) / 2, 18 * AutoMovieArchetypeUnits.INCH);
    }
    const barrel: number = archetypeExtent(hydrant, "x", ["barrel"]).high;
    if (!(archetypeExtent(hydrant, "z", ["pumper"]).high > barrel))
        findings.push("the pumper nozzle does not face +Z");
    if (!(archetypeExtent(hydrant, "x", ["hose-left"]).high > barrel &&
        archetypeExtent(hydrant, "x", ["hose-right"]).low < -barrel))
        findings.push("the hose nozzles do not face +X and -X");
    const nut: IAutoMovieAffordance = hydrant.affordance("nut");
    near("the hydrant's nut", nut.frame.translation.y, 30.5 * AutoMovieArchetypeUnits.INCH);
    // 4. The lamp post.
    const lamp: ReturnType<typeof AutoMovieArchetypeStreetFixture.create> = make("lampPost", 3);
    near("the lamp post's height", archetypeExtent(lamp, "y", ["shaft"]).high, 12 * AutoMovieArchetypeUnits.FOOT);
    near("the luminaire's width", archetypeExtent(lamp, "x", ["luminaire"]).size, 21 * AutoMovieArchetypeUnits.INCH);
    near("the luminaire's height", archetypeExtent(lamp, "y", ["luminaire"]).size, 40 * AutoMovieArchetypeUnits.INCH);
    near("the lamp post's base", archetypeExtent(lamp, "x", ["base"]).size, (9 + 1 / 4) * AutoMovieArchetypeUnits.INCH);
    const post: IAutoMovieAffordance = lamp.affordance("post");
    near("the lamp post's bar", post.length!, 12 * AutoMovieArchetypeUnits.FOOT -
        archetypeExtent(lamp, "y", ["base"]).high);
    // 5. The sign post.
    findings.push(...archetypeModelSweep([
        {
            name: "STOP sign side",
            measure: (seed: number): readonly number[] => [
                archetypeExtent(make("signPost", seed), "x", ["sign"]).size,
            ],
            models: [
                [30 * AutoMovieArchetypeUnits.INCH],
                [36 * AutoMovieArchetypeUnits.INCH],
            ],
            source: "MUTCD Table 2B-1",
        },
    ]));
    const sign: ReturnType<typeof AutoMovieArchetypeStreetFixture.create> = make("signPost", 3);
    near("the sign's bottom edge", archetypeExtent(sign, "y", ["sign"]).low, 7 * AutoMovieArchetypeUnits.FOOT);
    near("the sign post's side", archetypeExtent(sign, "x", ["post"]).size, 2 * AutoMovieArchetypeUnits.INCH);
    near("the sign post's bar", sign.affordance("post").length!, 7 * AutoMovieArchetypeUnits.FOOT);
    TestValidator.equals("street fixtures stand at their sources", findings, []);
}
