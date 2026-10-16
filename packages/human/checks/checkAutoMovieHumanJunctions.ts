// Refuse a build whose skin parts do not close. Every part opens its rings on
// the shared boundary of shapeAutoMovieHumanRing, so for any person the
// junction must weld every site; this joins the whole skin for people across
// sex, age and stature and fails, naming each person, site and gap, when any
// ring pair does not coincide, or when the joined limit surface's girth along
// a ring whose girth the identity measures is more than a millimetre off it.
import { AUTOMOVIE_HUMAN_PART_GENERATORS } from "../src/human/AUTOMOVIE_HUMAN_PART_GENERATORS";
import { IAutoMovieHumanPartGenerators } from "../src/human/IAutoMovieHumanPartGenerators";
import { generateAutoMovieHumanCages } from "../src/human/generateAutoMovieHumanCages";
import { joinAutoMovieHumanCages } from "../src/human/joinAutoMovieHumanCages";
import { AUTOMOVIE_HUMAN_RINGS } from "../src/junction/AUTOMOVIE_HUMAN_RINGS";
import { AutoMovieHumanPart } from "../src/junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../src/junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingDefinition } from "../src/junction/IAutoMovieHumanRingDefinition";
import { IAutoMovieHumanCage } from "../src/junction/IAutoMovieHumanCage";
import { measureAutoMovieHumanJunctionGirth } from "../src/junction/measureAutoMovieHumanJunctionGirth";
import { shapeAutoMovieHumanRing } from "../src/junction/shapeAutoMovieHumanRing";
import { AutoMovieHumanConverter } from "../src/measure/AutoMovieHumanConverter";
import { IAutoMovieHumanMeasurements } from "../src/measure/IAutoMovieHumanMeasurements";
import { resolveAutoMovieHumanMeasurements } from "../src/measure/resolveAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../src/skeleton/IAutoMovieHumanSkeleton";
import { generateAutoMovieHumanSkeleton } from "../src/skeleton/generateAutoMovieHumanSkeleton";
import { IAutoMovieHumanTraits } from "../src/structures/IAutoMovieHumanTraits";
import { checkAutoMovieHumanHandUv } from "./checkAutoMovieHumanHandUv";
/** People to join: both sexes at infancy, puberty and old age, and adults at either end of stature. */
const PEOPLE: Array<[
    sex: "female" | "male",
    age: number,
    stature: number
]> = [
    ["female", 1, 1],
    ["male", 1, 1],
    ["female", 12, 1],
    ["male", 12, 1],
    ["female", 30, 0.9],
    ["male", 30, 1.1],
    ["female", 80, 1],
    ["male", 80, 1],
];
/** Sites whose girth the identity measures, where the joined limit girth must reproduce it; the neck and ear rings carry designed sections instead. */
const MEASURED: ReadonlySet<string> = new Set([
    "upperArm",
    "wrist",
    "thigh",
    "ankle",
]);
/** Largest difference between a ring's joined limit girth and the girth its shape sets, millimetres. */
const GIRTH_TOLERANCE: number = 1;
/** Parts on the body's midline, which have no side. */
const MIDLINE: ReadonlySet<AutoMovieHumanPart> = new Set([
    "trunk",
    "neck",
    "head",
]);
/** Every problem of one person's skin, empty when it closes with every girth in tolerance. */
/** With `--girths`, every ring's joined limit girth and its shape's girth are printed for every person, the measured sites asserted as always. */
const REPORT: boolean = process.argv.includes("--girths");
const inspect: (measurements: IAutoMovieHumanMeasurements, who: string) => string[] = (measurements: IAutoMovieHumanMeasurements, who: string): string[] => {
    const problems: string[] = [];
    const skeleton: IAutoMovieHumanSkeleton = generateAutoMovieHumanSkeleton(measurements);
    const cages: {
        part: AutoMovieHumanPart;
        side: AutoMovieHumanSide | null;
        cage: IAutoMovieHumanCage;
    }[] = generateAutoMovieHumanCages(measurements, skeleton, AUTOMOVIE_HUMAN_PART_GENERATORS);
    // the join reuses the cages just generated instead of generating every part again
    const generated: IAutoMovieHumanPartGenerators = Object.fromEntries((Object.keys(AUTOMOVIE_HUMAN_PART_GENERATORS) as AutoMovieHumanPart[]).map((part: AutoMovieHumanPart): [
        AutoMovieHumanPart,
        {
            part: AutoMovieHumanPart;
            generate: (props: {
                side: AutoMovieHumanSide | null;
            }) => IAutoMovieHumanCage;
        }
    ] => [
        part,
        {
            part,
            generate: (props: {
                side: AutoMovieHumanSide | null;
            }): IAutoMovieHumanCage => cages.find((c: {
                part: AutoMovieHumanPart;
                side: AutoMovieHumanSide | null;
                cage: IAutoMovieHumanCage;
            }): boolean => c.part === part && c.side === props.side)!.cage,
        },
    ])) as unknown as IAutoMovieHumanPartGenerators;
    try {
        joinAutoMovieHumanCages(measurements, skeleton, generated);
    }
    catch (cause) {
        problems.push(cause instanceof Error ? cause.message : String(cause));
    }
    for (const definition of Object.values(AUTOMOVIE_HUMAN_RINGS).filter((d: IAutoMovieHumanRingDefinition<"neckBase"> | IAutoMovieHumanRingDefinition<"neckTop"> | IAutoMovieHumanRingDefinition<"upperArm"> | IAutoMovieHumanRingDefinition<"wrist"> | IAutoMovieHumanRingDefinition<"thigh"> | IAutoMovieHumanRingDefinition<"ankle"> | IAutoMovieHumanRingDefinition<"ear">): boolean => REPORT || MEASURED.has(d.site)))
        for (const side of definition.bilateral
            ? (["left", "right"] as const)
            : [null]) {
            const cage: (part: AutoMovieHumanPart) => IAutoMovieHumanCage = (part: AutoMovieHumanPart): IAutoMovieHumanCage => cages.find((c: {
                part: AutoMovieHumanPart;
                side: AutoMovieHumanSide | null;
            }): boolean => c.part === part && c.side === (MIDLINE.has(part) ? null : side))!.cage;
            const target: number = shapeAutoMovieHumanRing({
                skeleton,
                measurements,
                site: definition.site,
                side,
                part: definition.proximal,
            }).girth;
            const girth: number = measureAutoMovieHumanJunctionGirth({
                site: definition.site,
                side,
                proximal: cage(definition.proximal),
                distal: cage(definition.distal),
            });
            const share: (only: "proximal" | "distal") => string = (only: "proximal" | "distal"): string => (measureAutoMovieHumanJunctionGirth({
                site: definition.site,
                side,
                proximal: cage(definition.proximal),
                distal: cage(definition.distal),
                only,
            }) - target).toFixed(1);
            if (REPORT)
                process.stdout.write(`${who}	${side === null ? "" : `${side} `}${definition.site}	joined ${girth.toFixed(1)} mm	shape ${target.toFixed(1)} mm	difference ${(girth - target).toFixed(1)} mm (${((100 * (girth - target)) / target).toFixed(1)}%)	${definition.proximal} alone ${share("proximal")}	${definition.distal} alone ${share("distal")}
`);
            if (MEASURED.has(definition.site) &&
                Math.abs(girth - target) > GIRTH_TOLERANCE)
                problems.push(`${side === null ? "" : `${side} `}${definition.site} limit girth ${girth.toFixed(1)} mm, its shape sets ${target.toFixed(1)}`);
        }
    return problems;
};
const main: () => void = (): void => {
    const converter: AutoMovieHumanConverter = new AutoMovieHumanConverter();
    const failures: string[] = [];
    for (const [sex, age, scale] of PEOPLE) {
        const traits: IAutoMovieHumanTraits = {
            version: 1,
            sex,
            age,
            stature: null,
            population: "european",
            build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
        };
        const median: number = converter.toIdentity(traits).body.stature;
        const problems: string[] = inspect(resolveAutoMovieHumanMeasurements(converter.toIdentity({ ...traits, stature: median * scale })), `${sex} ${age} y, stature x${scale}`);
        if (problems.length !== 0)
            failures.push(`${sex} ${age} y, stature x${scale}: ${problems.join("; ")}`);
    }
    if (failures.length !== 0) {
        process.stderr.write(`human junctions: ${failures.length} people fail\n${failures.join("\n")}\n`);
        process.exit(1);
    }
    process.stdout.write(`human junctions: ${PEOPLE.length} people close at every junction with every limit girth within ${GIRTH_TOLERANCE} mm\n`);
};
main();
checkAutoMovieHumanHandUv();
