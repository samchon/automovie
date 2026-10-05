/// <reference lib="webworker" />
/**
 * Measurement worker of the connected person editor. It answers seven kinds:
 *
 * - `solveMeasurement` solves a measured body channel for a target length
 *   against the published body partition view, within the reach that view can
 *   evaluate, the same solve the body editor runs against its basis.
 * - `readPersonMeasurement` reads a person measurement (a site that crosses
 *   the head/body cut, `HUMAN_PERSON_MEASUREMENTS`) on the person's final skin
 *   at rest.
 * - `solvePersonMeasurement` solves that measurement along its body channel
 *   (`solveHumanPersonMeasuredChannel`).
 * - `readPersonHead` reads every head measurement on the person's skin at
 *   rest (`measureHumanPersonHead`).
 * - `solvePersonHead` solves the head channels for head measurement targets
 *   (`solveHumanPersonHead`).
 * - `readFaceMeasurements` reads every registered face measurement on the
 *   person's face, built on the head view's face basis without hair.
 * - `solveFaceMeasurement` solves one face measurement target onto the
 *   channels it lists (`solveHumanFaceMeasurementTarget`) and records it.
 *
 * The person kinds evaluate whole people, so the worker joins the head and
 * body views and compiles one one-skin evaluator the first time a person kind
 * arrives. Any other kind is refused by name.
 */
import {
  type AutoMovieHumanFaceMeasurementReading,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonHeadView,
  measureHumanPersonDocument,
  measureHumanPersonHead,
  parseHumanPersonDocument,
  solveHumanBodyMeasuredChannel,
  solveHumanPersonHead,
  solveHumanPersonMeasuredChannel,
  createHumanFaceBasisBuilder,
  HUMAN_FACE_MEASUREMENTS,
  solveHumanFaceMeasurementTarget,
} from "@automovie/human";

import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import { connectedBodyReach } from "./human/common/connectedBodyReach";
import type { IConnectedPersonEvaluator } from "./human/person/IConnectedPersonEvaluator";
import type { IConnectedPersonHeadSolution } from "./human/person/IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasuredSolution } from "./human/person/IConnectedPersonMeasuredSolution";
import type { IConnectedPersonMeasureMessage } from "./human/person/IConnectedPersonMeasureMessage";
import { prepareConnectedPersonEvaluator } from "./human/person/prepareConnectedPersonEvaluator";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const body = readConnectedBodyView();
// The solve brackets within the reach the body view can evaluate, the same
// reach the panel shows (`connectedBodyReach`).
const reach = body.then((view) => connectedBodyReach(view.body).basis);
let person: Promise<IConnectedPersonEvaluator> | undefined;
// The face reader, compiled the first time a face kind arrives: the head
// view's face basis built without hair, reporting every face measurement.
let face:
  | Promise<(document: IAutoMovieHumanFaceBasisDocument) => AutoMovieHumanFaceMeasurementReading[]>
  | undefined;
const faceReader = () =>
  (face ??= readConnectedHeadView().then((view) => {
    let readings: AutoMovieHumanFaceMeasurementReading[] = [];
    const build = createHumanFaceBasisBuilder(view.face, {
      observeMeasurements: (values) => {
        readings = values;
      },
    });
    return (document: IAutoMovieHumanFaceBasisDocument) => {
      build({ ...document, hair: null });
      return readings;
    };
  }));
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
    if (request.kind === "readPersonHead") {
      const { compiled } = await evaluator();
      const readings = measureHumanPersonHead(compiled, parseHumanPersonDocument(request.document));
      const result: Record<string, number> = {};
      for (const [name, reading] of Object.entries(readings)) result[name] = reading.metres;
      scope.postMessage({ id: request.id, result });
      return;
    }
    if (request.kind === "solvePersonHead") {
      const { compiled } = await evaluator();
      const solved = solveHumanPersonHead({
        compiled,
        document: parseHumanPersonDocument(request.document),
        targets: request.targets,
      });
      const readings: Record<string, number> = {};
      for (const [name, reading] of Object.entries(solved.readings)) readings[name] = reading.metres;
      const result: IConnectedPersonHeadSolution = {
        document: solved.document,
        readings,
        departureMetres: solved.departureMetres,
      };
      scope.postMessage({ id: request.id, result });
      return;
    }
    if (request.kind === "readFaceMeasurements") {
      const read = await faceReader();
      scope.postMessage({ id: request.id, result: read(parseHumanPersonDocument(request.document).face) });
      return;
    }
    if (request.kind === "solveFaceMeasurement") {
      const read = await faceReader();
      const person = parseHumanPersonDocument(request.document);
      const measurement = HUMAN_FACE_MEASUREMENTS.find((entry) => entry.id === request.measurement);
      if (measurement === undefined)
        throw new Error("No face measurement is registered as " + request.measurement + ".");
      const view = await readConnectedHeadView();
      const bucket = (document: IAutoMovieHumanFaceBasisDocument, channel: string) =>
        view.face.channels.find((entry) => entry.id === channel)?.kind === "expression"
          ? document.expression
          : document.shape;
      const solved = solveHumanFaceMeasurementTarget({
        measurement,
        target: request.target,
        channels: view.face.channels,
        weights: Object.fromEntries(
          measurement.channels.map((channel) => [channel, bucket(person.face, channel)[channel] ?? 0]),
        ),
        read: (channel, weight) => {
          const shaped = structuredClone(person.face);
          bucket(shaped, channel)[channel] = weight;
          const reading = read(shaped).find((entry) => entry.measurement === measurement.id);
          return reading === undefined
            ? { reason: "no reading" }
            : reading.status === "measured"
              ? reading.measured
              : { reason: reading.reason };
        },
      });
      const next = structuredClone(person);
      bucket(next.face, solved.channel)[solved.channel] = solved.weight;
      next.face.anatomical = {
        ...next.face.anatomical,
        targets: [
          ...(next.face.anatomical?.targets ?? []).filter((target) => target.measurement !== measurement.id),
          { measurement: measurement.id, value: request.target },
        ],
      };
      scope.postMessage({ id: request.id, result: { document: next, readings: read(next.face) } });
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

