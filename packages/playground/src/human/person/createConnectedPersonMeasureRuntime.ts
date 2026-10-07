import type { AutoMovieHumanFaceMeasurementReading, IAutoMovieHumanFaceBasisDocument, IAutoMovieHumanPersonDocument } from "@automovie/human";
import { measureHumanPersonDocument } from "@automovie/human/human/measure/measureHumanPersonDocument";
import { measureHumanPersonHead } from "@automovie/human/human/measure/measureHumanPersonHead";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { solveHumanBodyMeasuredChannel } from "@automovie/human/body/measure/solveHumanBodyMeasuredChannel";
import { solveHumanPersonHead } from "@automovie/human/human/measure/solveHumanPersonHead";
import { solveHumanPersonMeasuredChannel } from "@automovie/human/human/measure/solveHumanPersonMeasuredChannel";
import { HUMAN_FACE_MEASUREMENTS } from "@automovie/human/face/anatomy/resolution/HUMAN_FACE_MEASUREMENTS";
import { solveHumanFaceMeasurementTarget } from "@automovie/human/face/anatomy/resolution/solveHumanFaceMeasurementTarget";
import { connectedBodyReach } from "../common/connectedBodyReach";
import type { IConnectedPersonEvaluator } from "./IConnectedPersonEvaluator";
import type { IConnectedPersonHeadSolution } from "./IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasuredSolution } from "./IConnectedPersonMeasuredSolution";
import type { IConnectedPersonMeasureMessage } from "./IConnectedPersonMeasureMessage";
import { prepareConnectedPersonEvaluator } from "./prepareConnectedPersonEvaluator";
import type { IBodySimpleReply } from "../body/IBodySimpleReply";
import type { IConnectedPersonMeasureRuntimeProps } from "./IConnectedPersonMeasureRuntimeProps";
import { expandHumanBodySimpleShape } from "@automovie/human/body/simple/expandHumanBodySimpleShape";
import { projectHumanBodySimpleShape } from "@automovie/human/body/simple/projectHumanBodySimpleShape";
import { resolveHumanBodyAnatomy } from "@automovie/human/body/anatomy/resolveHumanBodyAnatomy";
import { createHumanPersonSimpleWhole } from "@automovie/human/human/measure/createHumanPersonSimpleWhole";
import type { IAutoMovieHumanBodySimpleWhole } from "@automovie/human/body/structures/IAutoMovieHumanBodySimpleWhole";

/**
 * Answer the person editor's measurement requests against the head and body
 * views the resident person worker already read. It answers seven kinds:
 *
 * - `solveMeasurement` solves a measured body channel for a target length
 *   within the reach the body view can evaluate.
 * - `readPersonMeasurement` reads a person measurement (a site that crosses
 *   the head/body cut) on the person's final skin at rest, and
 *   `solvePersonMeasurement` solves it along its body channel.
 * - `readPersonHead` reads every head measurement and `solvePersonHead` solves
 *   the head channels for head measurement targets.
 * - `readFaceMeasurements` reads every registered face measurement on the
 *   final whole-person model and `solveFaceMeasurement` solves one target onto
 *   the channels it lists and records it.
 *
 * The person kinds evaluate whole people, so the one-skin evaluator is
 * compiled the first time a person kind arrives. The views are the worker's
 * one copy: a second worker reading them again exceeded what one page can
 * hold on a large generation. Every whole-person evaluation reports a stage,
 * so a solve that evaluates many people is never mistaken for a lost worker.
 * A refusal is returned as the reply of its own request; any other kind is
 * refused by name.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reads and solves the person editor's measurements on the same views its preview evaluates.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Returns each numerical refusal as the reply of its own request and leaves the worker available.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Reads and solves registered face measurements on the final whole-person model.
 * @author Samchon
 */
export function createConnectedPersonMeasureRuntime(props: IConnectedPersonMeasureRuntimeProps) {
  // The solve brackets within the reach the body view can evaluate, the same
  // reach the panel shows (`connectedBodyReach`).
  const reach = props.body.then((view) => connectedBodyReach(view.body).basis);
  let person: Promise<IConnectedPersonEvaluator> | undefined;
  let faceReadings: AutoMovieHumanFaceMeasurementReading[] = [];
  // Face readings come from the same whole-person generation and final skin.
  let face:
    | Promise<(document: IAutoMovieHumanPersonDocument) => AutoMovieHumanFaceMeasurementReading[]>
    | undefined;
  const faceReader = () =>
    (face ??= evaluator().then(({ build }) => {
      return (document: IAutoMovieHumanPersonDocument) => {
        build(document);
        return faceReadings;
      };
    }));
  // compiled the first time a person kind arrives
  const evaluator = (): Promise<IConnectedPersonEvaluator> =>
    (person ??= prepareConnectedPersonEvaluator(
      props.head,
      props.body,
      (values) => { faceReadings = values.slice(); },
      props.signal,
    ).then(({ compiled, build }) => {
      props.signal("generation-compiled");
      return {
        compiled,
        build: (document) => {
          const built = build(document);
          props.signal("person-evaluated");
          return built;
        },
      };
    }));
  return async (request: IConnectedPersonMeasureMessage): Promise<IBodySimpleReply> => {
    // kept before narrowing, for the refusal of a kind outside the union
    const kind: string = request.kind;
    try {
      if (request.kind === "expandPersonSimple" || request.kind === "projectPersonSimple") {
        const basis = await reach;
        const { compiled } = await evaluator();
        const document = parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly);
        const reader = createHumanPersonSimpleWhole(compiled, document);
        const whole: IAutoMovieHumanBodySimpleWhole = {
          stature: (shape) => {
            const value = reader.stature(shape);
            props.signal("person-rest-stature-read");
            return value;
          },
          volume: (shape) => {
            const value = reader.volume(shape);
            props.signal("person-rest-volume-read");
            return value;
          },
        };
        const shape = resolveHumanBodyAnatomy(basis, document.body.shape, document.body.anatomy);
        const result = request.kind === "expandPersonSimple"
          ? expandHumanBodySimpleShape(basis, whole, request.simple, document.body.shape, document.body.anatomy)
          : projectHumanBodySimpleShape(basis, whole, shape);
        return { id: request.id, result };
      }
      if (request.kind === "solveMeasurement") {
        const result = solveHumanBodyMeasuredChannel({
          basis: await reach,
          shape: request.shape,
          channel: request.channel,
          targetMetres: request.targetMetres,
        });
        return { id: request.id, result };
      }
      if (request.kind === "readPersonMeasurement") {
        const { compiled, build } = await evaluator();
        const reading = measureHumanPersonDocument({
          compiled,
          build,
          document: parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly),
          channel: request.channel,
        });
        return { id: request.id, result: reading.metres };
      }
      if (request.kind === "solvePersonMeasurement") {
        const { compiled, build } = await evaluator();
        const solved = solveHumanPersonMeasuredChannel({
          compiled,
          build,
          document: parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly),
          channel: request.channel,
          targetMetres: request.targetMetres,
        });
        const result: IConnectedPersonMeasuredSolution = {
          document: solved.document,
          actualMetres: solved.reading.metres,
          population: solved.population,
        };
        return { id: request.id, result };
      }
      if (request.kind === "readPersonHead") {
        const { compiled } = await evaluator();
        const readings = measureHumanPersonHead(compiled, parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly));
        const result: Record<string, number> = {};
        for (const [name, reading] of Object.entries(readings)) result[name] = reading.metres;
        return { id: request.id, result };
      }
      if (request.kind === "solvePersonHead") {
        const { compiled } = await evaluator();
        const solved = solveHumanPersonHead({
          compiled,
          document: parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly),
          targets: request.targets,
        });
        const readings: Record<string, number> = {};
        for (const [name, reading] of Object.entries(solved.readings)) readings[name] = reading.metres;
        const result: IConnectedPersonHeadSolution = {
          document: solved.document,
          readings,
          departureMetres: solved.departureMetres,
        };
        return { id: request.id, result };
      }
      if (request.kind === "readFaceMeasurements") {
        const read = await faceReader();
        return { id: request.id, result: read(parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly)) };
      }
      if (request.kind === "solveFaceMeasurement") {
        const read = await faceReader();
        const person = parseHumanPersonDocument(request.document, (await props.body).body.anatomicalAssembly);
        const measurement = HUMAN_FACE_MEASUREMENTS.find((entry) => entry.id === request.measurement);
        if (measurement === undefined)
          throw new Error("No face measurement is registered as " + request.measurement + ".");
        const view = await props.head;
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
            const shaped = structuredClone(person);
            bucket(shaped.face, channel)[channel] = weight;
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
        return { id: request.id, result: { document: next, readings: read(next) } };
      }
      throw new Error("The person editor's measurement worker does not answer " + kind + ".");
    } catch (error) {
      return {
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
