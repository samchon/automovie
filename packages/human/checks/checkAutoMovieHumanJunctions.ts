// Refuse a build whose skin parts do not close. Every part opens its rings on
// the shared boundary of shapeAutoMovieHumanRing, so for any person the
// junction must weld every site; this joins the whole skin for people across
// sex, age and stature and fails, naming each site and gap, when any ring
// pair does not coincide.
import { AUTOMOVIE_HUMAN_PART_GENERATORS } from "../src/human/AUTOMOVIE_HUMAN_PART_GENERATORS";
import { joinAutoMovieHumanCages } from "../src/human/joinAutoMovieHumanCages";
import { AutoMovieHumanConverter } from "../src/measure/AutoMovieHumanConverter";
import { IAutoMovieHumanMeasurements } from "../src/measure/IAutoMovieHumanMeasurements";
import { resolveAutoMovieHumanMeasurements } from "../src/measure/resolveAutoMovieHumanMeasurements";
import { generateAutoMovieHumanSkeleton } from "../src/skeleton/generateAutoMovieHumanSkeleton";
import { IAutoMovieHumanTraits } from "../src/structures/IAutoMovieHumanTraits";

/** People to join: both sexes from infancy to old age, at the median and at either end of stature. */
const SEXES = ["female", "male"] as const;
const AGES: number[] = [1, 6, 12, 18, 30, 50, 80];
const STATURES: number[] = [0.9, 1, 1.1];

const main = (): void => {
  const converter: AutoMovieHumanConverter = new AutoMovieHumanConverter();
  const failures: string[] = [];
  for (const sex of SEXES)
    for (const age of AGES)
      for (const scale of STATURES) {
        const traits: IAutoMovieHumanTraits = {
          version: 1,
          sex,
          age,
          stature: null,
          population: "european",
          build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
        };
        const median: number = converter.toIdentity(traits).body.stature;
        const measurements: IAutoMovieHumanMeasurements =
          resolveAutoMovieHumanMeasurements(
            converter.toIdentity({ ...traits, stature: median * scale }),
          );
        try {
          joinAutoMovieHumanCages(
            measurements,
            generateAutoMovieHumanSkeleton(measurements),
            AUTOMOVIE_HUMAN_PART_GENERATORS,
          );
        } catch (cause) {
          failures.push(
            `${sex} ${age} y, stature x${scale}: ${cause instanceof Error ? cause.message : String(cause)}`,
          );
        }
      }
  if (failures.length !== 0) {
    process.stderr.write(
      `human junctions: ${failures.length} people do not close\n${failures.join("\n")}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `human junctions: ${SEXES.length * AGES.length * STATURES.length} people close at every junction\n`,
  );
};
main();
