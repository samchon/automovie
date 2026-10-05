/// <reference lib="webworker" />
/**
 * Measurement worker of the connected person editor. It answers three kinds:
 *
 * - `solveMeasurement` solves a measured body channel for a target length
 *   against the published body partition view, within the reach that view can
 *   evaluate, the same solve the body editor runs against its basis.
 * - `readPersonMeasurement` reads a person measurement (a site that crosses
 *   the head/body cut, `HUMAN_PERSON_MEASUREMENTS`) on the person's final skin
 *   at rest.
 * - `solvePersonMeasurement` solves that measurement along its body channel
 *   (`solveHumanPersonMeasuredChannel`).
 *
 * The person kinds evaluate whole people, so the worker joins the head and
 * body views and compiles one one-skin evaluator the first time a person kind
 * arrives. Any other kind is refused by name.
 */
import {
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonHeadView,
  measureHumanPersonDocument,
  parseHumanPersonDocument,
  solveHumanBodyMeasuredChannel,
  solveHumanPersonMeasuredChannel,
} from "@automovie/human";

import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { connectedBodyReach } from "./human/common/connectedBodyReach";
import type { IConnectedPersonEvaluator } from "./human/person/IConnectedPersonEvaluator";
import type { IConnectedPersonMeasuredSolution } from "./human/person/IConnectedPersonMeasuredSolution";
import type { IConnectedPersonMeasureMessage } from "./human/person/IConnectedPersonMeasureMessage";
import { prepareConnectedPersonEvaluator } from "./human/person/prepareConnectedPersonEvaluator";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const body = readConnectedBodyView();
// The solve brackets within the reach the body view can evaluate, the same
// reach the panel shows (`connectedBodyReach`).
const reach = body.then((view) => connectedBodyReach(view.body).basis);
let person: Promise<IConnectedPersonEvaluator> | undefined;
// compiled the first time a person kind arrives
const evaluator = (): Promise<IConnectedPersonEvaluator> =>
  (person ??= prepareConnectedPersonEvaluator(
    readConnectedHeadView(),
    body,
  ));

scope.onmessage = async (event: MessageEvent<IConnectedPersonMeasureMessage>) => {
  const request = event.data;
  // kept before narrowing, for the refusal of a kind outside the union
  const kind: string = request.kind;
  try {
    if (request.kind === "solveMeasurement") {
      const result = solveHumanBodyMeasuredChannel({
        basis: await reach,
        shape: request.shape,
        channel: request.channel,
        targetMetres: request.targetMetres,
      });
      scope.postMessage({ id: request.id, result });
      return;
    }
    if (request.kind === "readPersonMeasurement") {
      const { compiled, build } = await evaluator();
      const reading = measureHumanPersonDocument({
        compiled,
        build,
        document: parseHumanPersonDocument(request.document),
        channel: request.channel,
      });
      scope.postMessage({ id: request.id, result: reading.metres });
      return;
    }
    if (request.kind === "solvePersonMeasurement") {
      const { compiled, build } = await evaluator();
      const solved = solveHumanPersonMeasuredChannel({
        compiled,
        build,
        document: parseHumanPersonDocument(request.document),
        channel: request.channel,
        targetMetres: request.targetMetres,
      });
      const result: IConnectedPersonMeasuredSolution = {
        document: solved.document,
        actualMetres: solved.reading.metres,
        population: solved.population,
      };
      scope.postMessage({ id: request.id, result });
      return;
    }
    throw new Error("The person editor's measurement worker does not answer " + kind + ".");
  } catch (error) {
    scope.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

