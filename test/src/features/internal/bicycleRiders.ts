import { AutoMovieArchetypeRefusal } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { fittedBicycle } from "./fittedBicycle";
import { motionHumanBody } from "./motionHumanBody";

/** One cycling take on the average man, recording each verdict fault. */
type AverageTake = (failures: string[]) => void;

/**
 * Run one cycling take on the average man and pin the small woman's
 * refusal, then assert both under one name.
 *
 * The bicycle's saddle band holds LeMond's 0.883 of an inseam from 0.70 m.
 * The 5th-percentile woman's crotch height is 0.712 m in ANSUR II (2012
 * Anthropometric Survey of U.S. Army Personnel, NATICK/TR-15/007, as
 * tabulated at https://ergoassessment.cam/ansur-2-data-explorer/). The
 * 1.48 m small woman stands below it, so her fitted saddle lies under the
 * band and the bicycle refuses her at `saddleHeight`.
 *
 * @param name The take's name, in the assertion.
 * @param seed The bicycle's seed, as the take fits it.
 * @param take The average man's take.
 */
export function bicycleRiders(
  name: string,
  seed: number,
  take: AverageTake,
): void {
  const failures: string[] = [];
  try {
    take(failures);
  } catch (error) {
    failures.push(
      `m-average: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let refusal: unknown;
  try {
    fittedBicycle(motionHumanBody("f-small"), seed);
  } catch (error) {
    refusal = error;
  }
  if (
    !(
      refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.axis === "saddleHeight"
    )
  )
    failures.push(
      `f-small: the bicycle refuses a saddle below its band (${String(refusal)})`,
    );
  TestValidator.equals(name, failures, []);
}
