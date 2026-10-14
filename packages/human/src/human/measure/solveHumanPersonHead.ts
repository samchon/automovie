import { solveHumanBodySimpleOffsets } from "../../body/simple/solveHumanBodySimpleOffsets";
import { HUMAN_HEAD_MEASUREMENTS } from "../../common/measure/HUMAN_HEAD_MEASUREMENTS";
import { readHumanHeadMeasurement } from "../../common/measure/readHumanHeadMeasurement";
import { measureHumanFaceBasisChannels } from "../../face/channels/measureHumanFaceBasisChannels";
import { HUMAN_PERSON_HEAD_SOLVE } from "../constants/HUMAN_PERSON_HEAD_SOLVE";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonHeadSolution } from "../structures/IAutoMovieHumanPersonHeadSolution";
import type { IAutoMovieHumanPersonHeadSolveProps } from "../structures/IAutoMovieHumanPersonHeadSolveProps";
import type { IHumanPersonHeadCandidate } from "./IHumanPersonHeadCandidate";
import { humanPersonHeadDeparture } from "./humanPersonHeadDeparture";
import { measureHumanPersonHead } from "./measureHumanPersonHead";
import { readHumanPersonRestHead } from "./readHumanPersonRestHead";

/** Solver policy: half the source protocol's 1 mm readout; this is not anatomical accuracy. */
const RESOLUTION_METRES: number = 0.0005;

/**
 * Solve the configured head shape channels inside their source envelopes while keeping other document fields. Actual rest-head protocols supply relative residuals; primary lengths use a 0.0005 m stopping policy, and an optional circumference target supplies a secondary least-squares objective. Channel displacement scales supply local least-departure preference in the bounded secant/Broyden solver. All requested lengths must be finite and positive before residual division.
 *
 * Returned rules are read again on the resulting person. On failure the best sampled primary merit and held envelope limits are diagnostic observations, not proof of global infeasibility or global least departure. Protocol/source orientation, retained controls and shortcut qualification remain the readers' boundaries; numerical readout tolerance does not establish anatomical accuracy.
 *
 * @evidence contracts/common.md#principled-implementation Actual configured protocols, source shape envelopes and measured displacement scales drive the existing bounded inverse rather than direct dimension-based mesh rescaling.
 * @evidence contracts/common.md#clear-and-simple-design This adapter maps documents to residuals/departure and formats local failure evidence; the shared solver owns bounded iterations and secondary/nullspace steps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/extra or nonfinite/nonpositive targets refuse, held limits are not claimed a global reach proof, and no clinical or viewport result is inferred from convergence.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre targets, relative residual admission, readout policy, optional secondary objective and local diagnostic limitations.
 * @evidence contracts/performance.md#efficient-algorithms The bounded solver pays its actual configured trial evaluations, document clones and paired head reads; source-channel displacement scales are computed once per solve, not once per trial.
 * @evidence contracts/performance.md#reuse-equivalent-work One source scale/envelope set serves all candidate evaluations, and the best observed reading is retained for failure diagnostics without another failing solve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate documents/workspaces and one best candidate are call-local; only the solution or error text escapes and no viewer, asset task or worker is acquired.
 */
export function solveHumanPersonHead(
  props: IAutoMovieHumanPersonHeadSolveProps,
): IAutoMovieHumanPersonHeadSolution {
  const { compiled, document, targets }: IAutoMovieHumanPersonHeadSolveProps =
    props;
  const face: typeof compiled.generation.face = compiled.generation.face;
  const { measurements, channels }: typeof HUMAN_PERSON_HEAD_SOLVE =
    HUMAN_PERSON_HEAD_SOLVE;
  for (const name of measurements)
    if (!Object.hasOwn(targets, name))
      throw new Error(`The head solve needs a target for ${name}.`);
  for (const name of Object.keys(targets))
    if (
      !measurements.includes(name) &&
      !HUMAN_PERSON_HEAD_SOLVE.secondary.includes(name)
    )
      throw new Error(`The head solve does not pursue ${name}.`);
  for (const name of Object.keys(targets))
    if (!Number.isFinite(targets[name]) || targets[name] <= 0)
      throw new Error(
        `The head solve needs a finite positive metre target for ${name}.`,
      );
  const pursued: string[] = HUMAN_PERSON_HEAD_SOLVE.secondary.filter(
    (name: string): boolean => Object.hasOwn(targets, name),
  );
  const read: string[] = [...measurements, ...pursued];
  const envelopes: (readonly [number, number])[] = channels.map(
    (id: string): readonly [number, number] => {
      const channel: (typeof face.channels)[number] | undefined =
        face.channels.find(
          (one: (typeof face.channels)[number]): boolean =>
            one.id === id && one.kind === "shape",
        );
      if (channel === undefined)
        throw new Error(
          `The head view of ${face.id} has no shape channel ${id}.`,
        );
      return [channel.minimum, channel.maximum] as const;
    },
  );
  const scales: ReturnType<typeof measureHumanFaceBasisChannels> =
    measureHumanFaceBasisChannels(face);
  const worn: (weights: readonly number[]) => IAutoMovieHumanPersonDocument = (
    weights: readonly number[],
  ): IAutoMovieHumanPersonDocument => {
    const next: IAutoMovieHumanPersonDocument = structuredClone(document);
    channels.forEach((id: string, j: number): void => {
      if (weights[j] === 0) delete next.face.shape[id];
      else next.face.shape[id] = weights[j];
    });
    return next;
  };
  let closest: IHumanPersonHeadCandidate | undefined;
  const evaluate: (weights: readonly number[]) => number[] | null = (
    weights: readonly number[],
  ): number[] | null => {
    const head: ReturnType<typeof readHumanPersonRestHead> =
      readHumanPersonRestHead(compiled, worn(weights));
    const readings: number[] = read.map(
      (name: string): number =>
        readHumanHeadMeasurement(head, HUMAN_HEAD_MEASUREMENTS[name]).metres,
    );
    const residual: number[] = readings.map(
      (value: number, i: number): number =>
        (value - targets[read[i]]) / targets[read[i]],
    );
    const merit: number = residual
      .slice(0, measurements.length)
      .reduce((sum: number, value: number): number => sum + value * value, 0);
    if (closest === undefined || merit < closest.merit)
      closest = { merit, weights: [...weights], readings };
    return residual;
  };
  const met: (residual: readonly number[]) => boolean = (
    residual: readonly number[],
  ): boolean =>
    residual.every(
      (value: number, i: number): boolean =>
        Math.abs(value * targets[measurements[i]]) <= RESOLUTION_METRES,
    );
  const solved: ReturnType<typeof solveHumanBodySimpleOffsets> =
    solveHumanBodySimpleOffsets({
      ranges: envelopes,
      initial: evaluate(channels.map((): number => 0)),
      evaluate,
      met,
      secondary: pursued.length,
      departure: (weights: readonly number[]): number[] =>
        humanPersonHeadDeparture(scales, channels, weights),
    });
  if (solved === null) {
    const best: IHumanPersonHeadCandidate = closest!;
    const limits: string[] = channels.filter(
      (_: string, j: number): boolean =>
        best.weights[j] === envelopes[j][0] ||
        best.weights[j] === envelopes[j][1],
    );
    const mm: (metres: number) => string = (metres: number): string =>
      (metres * 1000).toFixed(2) + " mm";
    throw new Error(
      `The head solve of ${document.id} did not meet its targets: ` +
        measurements
          .map(
            (name: string, i: number): string =>
              `${name} ${mm(best.readings[i])} for ${mm(targets[name])}`,
          )
          .join(", ") +
        (limits.length > 0
          ? `; at their limits: ${limits.map((id: string): string => `${id}=${best.weights[channels.indexOf(id)]}`).join(", ")}.`
          : "; no channel at its limit, so the iteration did not converge."),
    );
  }
  const departure: number[] = humanPersonHeadDeparture(
    scales,
    channels,
    solved,
  );
  return {
    document: worn(solved),
    readings: measureHumanPersonHead(compiled, worn(solved)),
    departureMetres: Math.sqrt(
      solved.reduce(
        (sum: number, weight: number, j: number): number =>
          sum + (weight * departure[j]) ** 2,
        0,
      ),
    ),
  };
}
