import { humanBodyMeasurementRule } from "../../body/measure/humanBodyMeasurementRule";
import { invertHumanMeasurement } from "../../common/measure/invertHumanMeasurement";
import { HUMAN_PERSON_MEASUREMENTS } from "../constants/HUMAN_PERSON_MEASUREMENTS";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonMeasuredChannelProps } from "../structures/IAutoMovieHumanPersonMeasuredChannelProps";
import type { IAutoMovieHumanPersonMeasuredChannelSolution } from "../structures/IAutoMovieHumanPersonMeasuredChannelSolution";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { humanPersonBodyReach } from "./humanPersonBodyReach";
import { measureHumanPersonDocument } from "./measureHumanPersonDocument";

/**
 * Solve one registered person measurement in metres by changing only its body channel. Both non-null endpoint sides must have paired head drivers, and the copied paired source reach supplies the bracket without modifying authoring domains. Trials use the protocol's actual rest/section route with its retained-control and acquisition limits; returned documents retain the caller's pose/expression and all other authored fields.
 *
 * The shared inverter owns finite target/bracket admission, sampled response reversal checks and half the 0.1 mm readout stopping policy. These sampled checks are not a global monotonicity or clinical accuracy proof. The protocol's population interval only labels source-sample membership; an outside-sample target is still attempted inside actual source support.
 *
 * @evidence contracts/common.md#principled-implementation Registered protocol, paired endpoint ownership and measured performed trials determine the single-channel inverse and source-sample label.
 * @evidence contracts/common.md#clear-and-simple-design Paired reach, protocol dispatch and safeguarded inversion remain existing owners; this adapter substitutes one channel and preserves other document fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing head-side drivers refuse rather than fitting half-moved geometry, no second channel conceals a miss, and population bounds do not become invented physiological limits.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre units, both-side driver requirement, retained controls, numerical stopping policy and sampled/clinical limitations.
 * @evidence contracts/performance.md#efficient-algorithms Reach scans source owners once; each inverter trial clones the document and pays its actual protocol build/read cost, with bounded safeguarded iterations owned by the inverter.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted rule/channel/support serves every trial; the final document and reading reuse the solved weight rather than solving a second inverse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trial clones/readings and inversion workspace are call-local; only the solution/reading escapes and no viewer, worker or asset task is acquired.
 */
export function solveHumanPersonMeasuredChannel(
  props: IAutoMovieHumanPersonMeasuredChannelProps,
): IAutoMovieHumanPersonMeasuredChannelSolution {
  const { compiled, document, channel: id, targetMetres }: IAutoMovieHumanPersonMeasuredChannelProps = props;
  const generation: typeof compiled.generation = compiled.generation;
  const rule: (typeof HUMAN_PERSON_MEASUREMENTS)[string] | undefined = Object.hasOwn(HUMAN_PERSON_MEASUREMENTS, id)
    ? HUMAN_PERSON_MEASUREMENTS[id]
    : undefined;
  const channel: (typeof generation.body.channels)[number] | undefined = humanPersonBodyReach(generation).basis.channels.find(
    (one: (typeof generation.body.channels)[number]): boolean => one.id === id,
  );
  // one instrument per channel: a channel the body rule table measures is the body's
  if (
    rule === undefined ||
    channel === undefined ||
    humanBodyMeasurementRule(id) !== undefined
  )
    throw new Error(
      "A person measurement needs a body channel with a person measurement rule: " +
        id,
    );
  for (const endpoint of [channel.positive, channel.negative])
    if (
      endpoint !== null &&
      !(generation.drivers ?? []).some((driver: NonNullable<typeof generation.drivers>[number]): boolean => driver.endpoint === endpoint)
    )
      throw new Error(
        `The generation ${generation.id} carries no head-partition rows of ${endpoint}, so ${id} would move only the body side of the measured site.`,
      );
  const worn: (weight: number) => IAutoMovieHumanPersonDocument = (weight: number): IAutoMovieHumanPersonDocument => {
    const next: IAutoMovieHumanPersonDocument = structuredClone(document);
    if (weight === 0) delete next.body.shape[id];
    else next.body.shape[id] = weight;
    return next;
  };
  const read: (weight: number) => IAutoMovieHumanPersonMeasurementReading = (weight: number): IAutoMovieHumanPersonMeasurementReading =>
    measureHumanPersonDocument({
      compiled,
      build: props.build,
      document: worn(weight),
      channel: id,
    });
  const solved: ReturnType<typeof invertHumanMeasurement> = invertHumanMeasurement({
    range: [channel.minimum, channel.maximum],
    current: document.body.shape[id] ?? 0,
    targetMetres,
    read: (weight: number): number => read(weight).metres,
    label: id,
  });
  return {
    document: worn(solved.weight),
    reading: read(solved.weight),
    population:
      targetMetres >= rule.sampleMinimumMetres &&
      targetMetres <= rule.sampleMaximumMetres
        ? "within-source-sample"
        : "outside-source-sample",
  };
}
