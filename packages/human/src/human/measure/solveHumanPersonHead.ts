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

/** Half the 1 mm resolution ANSUR II records its head measurements at. */
const RESOLUTION_METRES = 0.0005;

/**
 * Solve a person's head channels so its head measurements meet their targets,
 * pursue the secondary ones as nearly as that allows, and depart least from the
 * standard head.
 *
 * The channels of `HUMAN_PERSON_HEAD_SOLVE` are set (every other value of the
 * document is kept) to meet its measurements, each read by its rule on the
 * person's skin at rest. More channels than measurements leave a choice. A
 * secondary measurement given a target (head circumference) is pursued by
 * least squares within it, and is reported, never refused; the rest of the
 * choice is the weights of least departure: the least sum of squares of each
 * weight times its departure scale (`humanPersonHeadDeparture`, the skin each
 * channel moves). The bounded secant solver
 * (`solveHumanBodySimpleOffsets`) owns the iteration and its least-departure
 * step; the channels' own envelopes are its intervals. Residuals are relative
 * to the target, and a target is met within half the 1 mm resolution ANSUR II
 * records head measurements at.
 *
 * Every head rule, the circumference check included, is remeasured on the
 * returned person. A missing or extra target refuses by name. A solve that
 * ends unmet refuses with the closest reading it reached for every target and
 * the channels it left at an envelope limit (secondary measurements excluded): limits held means the targets are
 * beyond the channels' reach together; none held means the iteration did not
 * converge.
 *
 * @evidence contracts/common.md#principled-implementation The person is read by the same rules it is solved for, on the same rest skin, and the free choice is fixed by a stated departure measure rather than by which channel is tried first.
 * @evidence contracts/common.md#clear-and-simple-design One problem statement handed to the one bounded solver, one remeasure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel outside the table moves to hide a miss; an unmet solve refuses with its closest readings instead of returning them as a solution.
 * @evidence contracts/common.md#meaningful-documentation States the channels, the choice rule, the acceptance, the remeasure and both refusals.
 * @evidence contracts/modeling.md#spatial-conventions Targets and readings are metres of the person frame at rest.
 * @evidence contracts/modeling.md#parameter-channels Sets only the table's channels, each a distinct effect, within their envelopes.
 * @evidence contracts/anatomy.md#anatomical-source The acceptance is half the resolution of the cited source's recorded measurements.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function is not displayed; the solved person is observed on the viewer.
 * @evidenceExclude contracts/anatomy.md#permitted-range The channels' envelopes bound the solve; a target is not refused for lying outside the source population.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The solve converts measurements into existing channels; it defines no new input.
 */
export function solveHumanPersonHead(
  props: IAutoMovieHumanPersonHeadSolveProps,
): IAutoMovieHumanPersonHeadSolution {
  const { compiled, document, targets } = props;
  const face = compiled.generation.face;
  const { measurements, channels } = HUMAN_PERSON_HEAD_SOLVE;
  for (const name of measurements)
    if (!Object.hasOwn(targets, name))
      throw new Error(`The head solve needs a target for ${name}.`);
  for (const name of Object.keys(targets))
    if (
      !measurements.includes(name) &&
      !HUMAN_PERSON_HEAD_SOLVE.secondary.includes(name)
    )
      throw new Error(`The head solve does not pursue ${name}.`);
  const pursued = HUMAN_PERSON_HEAD_SOLVE.secondary.filter((name) =>
    Object.hasOwn(targets, name),
  );
  const read = [...measurements, ...pursued];
  const envelopes = channels.map((id) => {
    const channel = face.channels.find(
      (one) => one.id === id && one.kind === "shape",
    );
    if (channel === undefined)
      throw new Error(
        `The head view of ${face.id} has no shape channel ${id}.`,
      );
    return [channel.minimum, channel.maximum] as const;
  });
  const scales = measureHumanFaceBasisChannels(face);
  const worn = (weights: readonly number[]): IAutoMovieHumanPersonDocument => {
    const next = structuredClone(document);
    channels.forEach((id, j) => {
      if (weights[j] === 0) delete next.face.shape[id];
      else next.face.shape[id] = weights[j];
    });
    return next;
  };
  let closest: IHumanPersonHeadCandidate | undefined;
  const evaluate = (weights: readonly number[]): number[] | null => {
    const head = readHumanPersonRestHead(compiled, worn(weights));
    const readings = read.map(
      (name) =>
        readHumanHeadMeasurement(head, HUMAN_HEAD_MEASUREMENTS[name]).metres,
    );
    const residual = readings.map(
      (value, i) => (value - targets[read[i]]) / targets[read[i]],
    );
    const merit = residual
      .slice(0, measurements.length)
      .reduce((sum, value) => sum + value * value, 0);
    if (closest === undefined || merit < closest.merit)
      closest = { merit, weights: [...weights], readings };
    return residual;
  };
  const met = (residual: readonly number[]): boolean =>
    residual.every(
      (value, i) =>
        Math.abs(value * targets[measurements[i]]) <= RESOLUTION_METRES,
    );
  const solved = solveHumanBodySimpleOffsets({
    ranges: envelopes,
    initial: evaluate(channels.map(() => 0)),
    evaluate,
    met,
    secondary: pursued.length,
    departure: (weights) => humanPersonHeadDeparture(scales, channels, weights),
  });
  if (solved === null) {
    const best = closest!;
    const limits = channels.filter(
      (_, j) =>
        best.weights[j] === envelopes[j][0] ||
        best.weights[j] === envelopes[j][1],
    );
    const mm = (metres: number): string => (metres * 1000).toFixed(2) + " mm";
    throw new Error(
      `The head solve of ${document.id} did not meet its targets: ` +
        measurements
          .map(
            (name, i) =>
              `${name} ${mm(best.readings[i])} for ${mm(targets[name])}`,
          )
          .join(", ") +
        (limits.length > 0
          ? `; at their limits: ${limits.map((id) => `${id}=${best.weights[channels.indexOf(id)]}`).join(", ")}.`
          : "; no channel at its limit, so the iteration did not converge."),
    );
  }
  const departure = humanPersonHeadDeparture(scales, channels, solved);
  return {
    document: worn(solved),
    readings: measureHumanPersonHead(compiled, worn(solved)),
    departureMetres: Math.sqrt(
      solved.reduce((sum, weight, j) => sum + (weight * departure[j]) ** 2, 0),
    ),
  };
}
