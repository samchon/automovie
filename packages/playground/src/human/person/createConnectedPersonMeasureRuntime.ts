import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { resolveHumanBodyAnatomy } from "@automovie/human/body/anatomy/resolveHumanBodyAnatomy";
import { solveHumanBodyMeasuredChannel } from "@automovie/human/body/measure/solveHumanBodyMeasuredChannel";
import { expandHumanBodySimpleShape } from "@automovie/human/body/simple/expandHumanBodySimpleShape";
import { projectHumanBodySimpleShape } from "@automovie/human/body/simple/projectHumanBodySimpleShape";
import type { IAutoMovieHumanBodySimpleWhole } from "@automovie/human/body/structures/IAutoMovieHumanBodySimpleWhole";
import { HUMAN_FACE_MEASUREMENTS } from "@automovie/human/face/anatomy/resolution/HUMAN_FACE_MEASUREMENTS";
import { solveHumanFaceMeasurementTarget } from "@automovie/human/face/anatomy/resolution/solveHumanFaceMeasurementTarget";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { createHumanPersonSimpleWhole } from "@automovie/human/human/measure/createHumanPersonSimpleWhole";
import { humanPersonBodyReach } from "@automovie/human/human/measure/humanPersonBodyReach";
import { measureHumanPersonDocument } from "@automovie/human/human/measure/measureHumanPersonDocument";
import { measureHumanPersonHead } from "@automovie/human/human/measure/measureHumanPersonHead";
import { solveHumanPersonHead } from "@automovie/human/human/measure/solveHumanPersonHead";
import { solveHumanPersonMeasuredChannel } from "@automovie/human/human/measure/solveHumanPersonMeasuredChannel";

import type { IBodySimpleReply } from "../body/IBodySimpleReply";
import type { IConnectedPersonEvaluator } from "./IConnectedPersonEvaluator";
import type { IConnectedPersonHeadSolution } from "./IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasureMessage } from "./IConnectedPersonMeasureMessage";
import type { IConnectedPersonMeasureRuntimeProps } from "./IConnectedPersonMeasureRuntimeProps";
import type { IConnectedPersonMeasuredSolution } from "./IConnectedPersonMeasuredSolution";
import { prepareConnectedPersonEvaluator } from "./prepareConnectedPersonEvaluator";

/**
 * Answer the person editor's measurement requests against the head and body views the resident person worker already read. It answers nine kinds:
 *
 * - `solveMeasurement` solves a measured body channel for a target length within the reach the body view can evaluate.
 * - `readPersonMeasurement` reads a person measurement (a site that crosses the head/body cut) on the person's final skin at rest, and `solvePersonMeasurement` solves it along its body channel.
 * - `readPersonHead` reads every head measurement and `solvePersonHead` solves the head channels for head measurement targets.
 * - `readFaceMeasurements` reads every registered face measurement on the final whole-person model and `solveFaceMeasurement` solves one target onto the channels it lists and records it.
 * - `projectPersonSimple` and `expandPersonSimple` use the exact person's own rest skin and canonical body anatomy, with paired support for expansion.
 *
 * The person kinds evaluate whole people, so the one-skin evaluator is compiled the first time a person kind arrives. The runtime borrows the resident worker's shared views rather than loading a second copy. Whole-person evaluations report diagnostic stages without request correlation; these signals establish no deadline, completion or protection against a lost worker. A refusal is returned as the reply of its own request; any other kind is refused by name.
 *
 * The body shape-only inverse returns a solver reading before complete-person admission. Numerical candidates and progress stages do not establish accepted editor history or clinical validity; the enclosing resident worker owns runtime/evaluator teardown.
 *
 * @evidence contracts/common.md#principled-implementation Operation-specific dispatch preserves paired shape reach versus complete-person rest construction, registered measurement units/targets, one-use correlated refusals and exact-person simple projection/expansion.
 * @evidence contracts/common.md#clear-and-simple-design The worker runtime owns numerical dispatch and lazily shared generation evaluation while UI intent/history and physical worker lifecycle stay with their existing panel/share owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Body solver readings do not become final-person anatomy, missing registered measurements/support refuse, progress is not a success verdict and candidate completion is separate from accepted history or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies all nine operations, shared views/evaluator, numerical provenance, correlated refusal, telemetry limits and enclosing lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch itself visits a fixed nine-kind chain, but actual calls parse complete documents, compile once and perform numerical construction/read/inverse costs. Face inverses clone the document per trial, scan channel metadata for bucket selection and scan returned readings for the selected rule; final target replacement visits existing targets, with no invented constant-cost measurement claim.
 * @evidence contracts/performance.md#reuse-equivalent-work One in-flight/resolved paired-reach promise and compiled evaluator promise are reused for this source-bound runtime, including sticky initialization failure; the face reader shares that evaluator and captures the latest synchronous build readings rather than caching results across documents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The runtime retains one reach/evaluator/reader promise and latest face-reading array with the borrowed views until its physical worker ends; no per-document history or request queue is added here, and actual pending dispatch/worker shutdown belong to enclosing owners.
 *
 * @author Samchon
 */
export function createConnectedPersonMeasureRuntime(
  props: IConnectedPersonMeasureRuntimeProps,
): (request: IConnectedPersonMeasureMessage) => Promise<IBodySimpleReply> {
  // The solver and the person panel share the paired endpoint owner's reach.
  let reach: Promise<IAutoMovieHumanBodyBasis> | undefined;
  const bodyReach: () => Promise<IAutoMovieHumanBodyBasis> =
    (): Promise<IAutoMovieHumanBodyBasis> =>
      (reach ??= Promise.all([props.head, props.body]).then(
        ([head, body]: [
          Awaited<IConnectedPersonMeasureRuntimeProps["head"]>,
          Awaited<IConnectedPersonMeasureRuntimeProps["body"]>,
        ]): IAutoMovieHumanBodyBasis =>
          humanPersonBodyReach(joinHumanPersonGeneration(head, body)).basis,
      ));
  let person: Promise<IConnectedPersonEvaluator> | undefined;
  let faceReadings: AutoMovieHumanFaceMeasurementReading[] = [];
  // Face readings come from the same whole-person generation and final skin.
  let face:
    | Promise<
        (
          document: IAutoMovieHumanPersonDocument,
        ) => AutoMovieHumanFaceMeasurementReading[]
      >
    | undefined;
  const faceReader: () => Promise<
    (
      document: IAutoMovieHumanPersonDocument,
    ) => AutoMovieHumanFaceMeasurementReading[]
  > = (): Promise<
    (
      document: IAutoMovieHumanPersonDocument,
    ) => AutoMovieHumanFaceMeasurementReading[]
  > =>
    (face ??= evaluator().then(
      ({
        build,
      }: IConnectedPersonEvaluator): ((
        document: IAutoMovieHumanPersonDocument,
      ) => AutoMovieHumanFaceMeasurementReading[]) => {
        return (
          document: IAutoMovieHumanPersonDocument,
        ): AutoMovieHumanFaceMeasurementReading[] => {
          build(document);
          return faceReadings;
        };
      },
    ));
  // compiled the first time a person kind arrives
  const evaluator: () => Promise<IConnectedPersonEvaluator> =
    (): Promise<IConnectedPersonEvaluator> =>
      (person ??= prepareConnectedPersonEvaluator(
        props.head,
        props.body,
        (values: readonly AutoMovieHumanFaceMeasurementReading[]): void => {
          faceReadings = values.slice();
        },
        props.signal,
      ).then(
        ({
          compiled,
          build,
        }: IConnectedPersonEvaluator): IConnectedPersonEvaluator => {
          props.signal("generation-compiled");
          return {
            compiled,
            build: (
              document: IAutoMovieHumanPersonDocument,
            ): ReturnType<IConnectedPersonEvaluator["build"]> => {
              const built: ReturnType<IConnectedPersonEvaluator["build"]> =
                build(document);
              props.signal("person-evaluated");
              return built;
            },
          };
        },
      ));
  return async (
    request: IConnectedPersonMeasureMessage,
  ): Promise<IBodySimpleReply> => {
    // kept before narrowing, for the refusal of a kind outside the union
    const kind: string = request.kind;
    try {
      if (
        request.kind === "expandPersonSimple" ||
        request.kind === "projectPersonSimple"
      ) {
        const basis: IAutoMovieHumanBodyBasis =
          request.kind === "expandPersonSimple"
            ? await bodyReach()
            : (await props.body).body;
        const { compiled }: IConnectedPersonEvaluator = await evaluator();
        const document: IAutoMovieHumanPersonDocument =
          parseHumanPersonDocument(
            request.document,
            (await props.body).body.anatomicalAssembly,
          );
        const reader: ReturnType<typeof createHumanPersonSimpleWhole> =
          createHumanPersonSimpleWhole(compiled, document);
        const whole: IAutoMovieHumanBodySimpleWhole = {
          get bodyReach(): IAutoMovieHumanBodySimpleWhole["bodyReach"] {
            return reader.bodyReach;
          },
          stature: (
            shape: Parameters<IAutoMovieHumanBodySimpleWhole["stature"]>[0],
          ): ReturnType<IAutoMovieHumanBodySimpleWhole["stature"]> => {
            const value: ReturnType<IAutoMovieHumanBodySimpleWhole["stature"]> =
              reader.stature(shape);
            props.signal("person-rest-stature-read");
            return value;
          },
          volume: (
            shape: Parameters<IAutoMovieHumanBodySimpleWhole["volume"]>[0],
          ): ReturnType<IAutoMovieHumanBodySimpleWhole["volume"]> => {
            const value: ReturnType<IAutoMovieHumanBodySimpleWhole["volume"]> =
              reader.volume(shape);
            props.signal("person-rest-volume-read");
            return value;
          },
        };
        const shape: Record<string, number> = resolveHumanBodyAnatomy(
          basis,
          document.body.shape,
          document.body.anatomy,
        );
        const result:
          | ReturnType<typeof expandHumanBodySimpleShape>
          | ReturnType<typeof projectHumanBodySimpleShape> =
          request.kind === "expandPersonSimple"
            ? expandHumanBodySimpleShape(
                basis,
                whole,
                request.simple,
                document.body.shape,
                document.body.anatomy,
              )
            : projectHumanBodySimpleShape(basis, whole, shape);
        return { id: request.id, result };
      }
      if (request.kind === "solveMeasurement") {
        const result: ReturnType<typeof solveHumanBodyMeasuredChannel> =
          solveHumanBodyMeasuredChannel({
            basis: await bodyReach(),
            shape: request.shape,
            channel: request.channel,
            targetMetres: request.targetMetres,
          });
        return { id: request.id, result };
      }
      if (request.kind === "readPersonMeasurement") {
        const { compiled, build }: IConnectedPersonEvaluator =
          await evaluator();
        const reading: ReturnType<typeof measureHumanPersonDocument> =
          measureHumanPersonDocument({
            compiled,
            build,
            document: parseHumanPersonDocument(
              request.document,
              (await props.body).body.anatomicalAssembly,
            ),
            channel: request.channel,
          });
        return { id: request.id, result: reading.metres };
      }
      if (request.kind === "solvePersonMeasurement") {
        const { compiled, build }: IConnectedPersonEvaluator =
          await evaluator();
        const solved: ReturnType<typeof solveHumanPersonMeasuredChannel> =
          solveHumanPersonMeasuredChannel({
            compiled,
            build,
            document: parseHumanPersonDocument(
              request.document,
              (await props.body).body.anatomicalAssembly,
            ),
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
        const { compiled }: IConnectedPersonEvaluator = await evaluator();
        const readings: ReturnType<typeof measureHumanPersonHead> =
          measureHumanPersonHead(
            compiled,
            parseHumanPersonDocument(
              request.document,
              (await props.body).body.anatomicalAssembly,
            ),
          );
        const result: Record<string, number> = {};
        for (const [name, reading] of Object.entries(readings))
          result[name] = reading.metres;
        return { id: request.id, result };
      }
      if (request.kind === "solvePersonHead") {
        const { compiled }: IConnectedPersonEvaluator = await evaluator();
        const solved: ReturnType<typeof solveHumanPersonHead> =
          solveHumanPersonHead({
            compiled,
            document: parseHumanPersonDocument(
              request.document,
              (await props.body).body.anatomicalAssembly,
            ),
            targets: request.targets,
          });
        const readings: Record<string, number> = {};
        for (const [name, reading] of Object.entries(solved.readings))
          readings[name] = reading.metres;
        const result: IConnectedPersonHeadSolution = {
          document: solved.document,
          readings,
          departureMetres: solved.departureMetres,
        };
        return { id: request.id, result };
      }
      if (request.kind === "readFaceMeasurements") {
        const read: Awaited<ReturnType<typeof faceReader>> = await faceReader();
        return {
          id: request.id,
          result: read(
            parseHumanPersonDocument(
              request.document,
              (await props.body).body.anatomicalAssembly,
            ),
          ),
        };
      }
      if (request.kind === "solveFaceMeasurement") {
        const read: Awaited<ReturnType<typeof faceReader>> = await faceReader();
        const person: IAutoMovieHumanPersonDocument = parseHumanPersonDocument(
          request.document,
          (await props.body).body.anatomicalAssembly,
        );
        const measurement:
          | (typeof HUMAN_FACE_MEASUREMENTS)[number]
          | undefined = HUMAN_FACE_MEASUREMENTS.find(
          (entry: (typeof HUMAN_FACE_MEASUREMENTS)[number]): boolean =>
            entry.id === request.measurement,
        );
        if (measurement === undefined)
          throw new Error(
            "No face measurement is registered as " + request.measurement + ".",
          );
        const view: Awaited<IConnectedPersonMeasureRuntimeProps["head"]> =
          await props.head;
        const bucket: (
          document: IAutoMovieHumanFaceBasisDocument,
          channel: string,
        ) => Record<string, number> = (
          document: IAutoMovieHumanFaceBasisDocument,
          channel: string,
        ): Record<string, number> =>
          view.face.channels.find(
            (entry: (typeof view.face.channels)[number]): boolean =>
              entry.id === channel,
          )?.kind === "expression"
            ? document.expression
            : document.shape;
        const solved: ReturnType<typeof solveHumanFaceMeasurementTarget> =
          solveHumanFaceMeasurementTarget({
            measurement,
            target: request.target,
            channels: view.face.channels,
            weights: Object.fromEntries(
              measurement.channels.map((channel: string): [string, number] => [
                channel,
                bucket(person.face, channel)[channel] ?? 0,
              ]),
            ),
            read: (
              channel: string,
              weight: number,
            ): ReturnType<
              Parameters<typeof solveHumanFaceMeasurementTarget>[0]["read"]
            > => {
              const shaped: IAutoMovieHumanPersonDocument =
                structuredClone(person);
              bucket(shaped.face, channel)[channel] = weight;
              const reading: AutoMovieHumanFaceMeasurementReading | undefined =
                read(shaped).find(
                  (entry: AutoMovieHumanFaceMeasurementReading): boolean =>
                    entry.measurement === measurement.id,
                );
              return reading === undefined
                ? { reason: "no reading" }
                : reading.status === "measured"
                  ? reading.measured
                  : { reason: reading.reason };
            },
          });
        const next: IAutoMovieHumanPersonDocument = structuredClone(person);
        bucket(next.face, solved.channel)[solved.channel] = solved.weight;
        next.face.anatomical = {
          ...next.face.anatomical,
          targets: [
            ...(next.face.anatomical?.targets ?? []).filter(
              (
                target: NonNullable<
                  NonNullable<
                    IAutoMovieHumanFaceBasisDocument["anatomical"]
                  >["targets"]
                >[number],
              ): boolean => target.measurement !== measurement.id,
            ),
            { measurement: measurement.id, value: request.target },
          ],
        };
        return {
          id: request.id,
          result: { document: next, readings: read(next) },
        };
      }
      throw new Error(
        "The person editor's measurement worker does not answer " + kind + ".",
      );
    } catch (error) {
      return {
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
