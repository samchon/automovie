/**
 * Checked Node numerical process, isolated from the browser renderer. The basis is fetched and admitted lazily once
 * per domain; it delegates every preview to the unchanged product runtime.
 * Original models cross advanced IPC and the lossless HTTP codec, never reference photographs.
 */
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime.ts";
import { createConnectedBodyGenerationRuntime } from "@automovie/playground/src/human/body/createConnectedBodyGenerationRuntime.ts";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/common/connectedRuntime.ts";
import { createConnectedPersonRuntime } from "@automovie/playground/src/human/person/createConnectedPersonRuntime.ts";
import { describeConnectedPersonFaceProgress } from "@automovie/playground/src/human/person/describeConnectedPersonFaceProgress.ts";

import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand";
import { admitHumanViewerDocument } from "./admitHumanViewerDocument";
import { createHumanViewerHeadlessWhole } from "./createHumanViewerHeadlessWhole";
import { createHumanViewerNumericalSources } from "./createHumanViewerNumericalSources";
import { createHumanViewerPersistence } from "./createHumanViewerPersistence";
import { humanViewerProtocol } from "./humanViewerProtocol";
import { humanViewerResidentRuntime } from "./humanViewerResidentRuntime";
import { readHumanViewerNodeAuthority } from "./readHumanViewerNodeAuthority";
import type { IHumanViewerNodeWorkerData } from "./IHumanViewerNodeWorkerData";
import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage";

if (process.send === undefined) throw new Error("The numerical entry requires its owned process IPC channel.");
const send = process.send.bind(process);
const port = {
  postMessage: (message: HumanViewerNumericalMessage): void => { send(message); },
};
const startup = await new Promise<IHumanViewerNodeWorkerData>((resolve, reject) => {
  process.once("message", (value: unknown) => {
    try {
      if (value === null || typeof value !== "object" ||
          !("type" in value) || value.type !== "initialize" ||
          !("input" in value) || value.input === null || typeof value.input !== "object")
        throw new Error("The checked numerical process requires its explicit host initialization.");
      const input = value.input;
      if (!("origin" in input) || typeof input.origin !== "string" ||
          !("revision" in input) || typeof input.revision !== "string" ||
          !("entry" in input) || typeof input.entry !== "string" ||
          !("inputs" in input) || input.inputs === null || typeof input.inputs !== "object")
        throw new Error("Node initialization has no original source, entry or input witness.");
      const inputs: Record<string, string> = {};
      for (const [file, digest] of Object.entries(input.inputs)) {
        if (typeof digest !== "string") throw new Error("A Node input witness must retain its byte digest.");
        inputs[file] = digest;
      }
      resolve({ origin: input.origin, revision: input.revision, entry: input.entry, inputs });
    } catch (cause) {
      reject(cause instanceof Error ? cause : new Error(String(cause)));
    }
  });
  // The checked entry has installed its startup receiver before the host sends
  // data. This handshake is not numerical readiness or source qualification.
  send("initialize");
});
const authority = readHumanViewerNodeAuthority(startup);
// Public checked Node loading has its own source authority, not a browser stamp.
port.postMessage({
  type: "ready",
  authority,
  protocol: humanViewerProtocol,
});
const face = new Map<
  string,
  Promise<ReturnType<typeof createConnectedFaceRuntime>>
>();
const body = new Map<
  string,
  Promise<ReturnType<typeof createConnectedBodyRuntime>>
>();
const person = new Map<
  string,
  Promise<ReturnType<typeof createConnectedPersonRuntime>>
>();
const sources = createHumanViewerNumericalSources(startup.origin);
const persistence = createHumanViewerPersistence((value) =>
  port.postMessage(value),
  startup.origin,
);
// identities whose resident runtime has produced at least one model; a runtime that has not is released on failure
const productive = new Set<string>();
const residents = { person, face, body } as const;
// Display builds are serialized by the page. Admission-only requests emit no
// construction events. Cached runtimes call the current build's relay.
let relayProgress: (stage: string) => void = () => undefined;
const observeProgress = (stage: string): void => relayProgress(stage);
const evaluate = async (
  data: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand,
): Promise<void> => {
  if ("persistence" in data) {
    if (data.persistence === "flush") persistence.flush();
    else if (data.id !== undefined) persistence.discard(data.id);
    return;
  }
  const { id, domain, basis, input } = data;
  const identity = domain + ":" + basis;
  try {
    if (input.operation === "admit") {
      const source =
        domain === "body"
          ? await sources.body(basis)
          : domain === "person"
            ? await sources.person(basis)
            : undefined;
      const bodyBasis =
        source === undefined
          ? undefined
          : Array.isArray(source)
            ? source[1].body
            : "body" in source
              ? source.body
              : source;
      port.postMessage({
        id,
        admission: true,
        reason: admitHumanViewerDocument(
          domain,
          input.document,
          bodyBasis?.anatomicalAssembly,
        ),
      });
      return;
    }
    if (input.operation === "exportConstruction" && domain !== "person")
      throw new Error("Construction asset inspection requires the paired person runtime.");
    const requestStarted = performance.now();
    let previousCompletion = requestStarted;
    relayProgress = (stage) => {
      const now = performance.now();
      const progress: IHumanViewerNumericalProgress = {
        type: "progress",
        id,
        stage,
        elapsedMs: now - requestStarted,
        stageMs: now - previousCompletion,
      };
      previousCompletion = now;
      port.postMessage(progress);
    };
    persistence.preempt();
    const runtime =
      domain === "person"
        ? await humanViewerResidentRuntime(person, identity, async () =>
            createConnectedPersonRuntime(await sources.person(basis), {
              progress: observeProgress,
            }),
          )
        : domain === "face"
          ? await humanViewerResidentRuntime(face, identity, () =>
              sources.face(basis).then((asset) =>
                createConnectedFaceRuntime({
                  basis: asset,
                  progress: (progress) =>
                    observeProgress(
                      describeConnectedPersonFaceProgress(progress),
                    ),
                }),
              ),
            )
          : await humanViewerResidentRuntime(body, identity, () =>
              sources
                .body(basis)
                .then((asset) =>
                  Array.isArray(asset)
                    ? createConnectedBodyGenerationRuntime(
                        asset[0],
                        asset[1],
                        observeProgress,
                      )
                    : createConnectedBodyRuntime(
                        asset,
                        createHumanViewerHeadlessWhole(asset.id),
                        { progress: observeProgress },
                      ),
                ),
            );
    const start = performance.now();
    const constructionOwner =
      input.operation !== "construct"
        ? undefined
        : domain === "person"
          ? person.get(identity)
          : domain === "face"
            ? face.get(identity)
            : undefined;
    if (input.operation === "construct" && constructionOwner === undefined)
      throw new Error(
        "Construction requires the loaded face or paired person runtime.",
      );
    const previewRequest = {
      ...input,
      operation: "preview" as const,
      measure: false,
    };
    const value =
      input.operation === "exportConstruction"
        ? await (await person.get(identity)!)(
            { operation: "exportConstruction", document: input.document },
            observeProgress,
          )
        : constructionOwner !== undefined
        ? domain === "person"
          ? await (
              await person.get(identity)!
            )(
              { operation: "construct", document: input.document },
              observeProgress,
            )
          : await (
              await face.get(identity)!
            )({
              operation: "construct",
              document: input.document,
              occlusion: input.occlusion,
            })
        : domain === "person"
          ? await (
              await person.get(identity)!
            )(previewRequest, observeProgress)
          : await runtime(previewRequest);
    productive.add(identity);
    if (data.cache !== undefined && value.operation === "preview")
      persistence.stage({ ...data.cache, id, value });
    port.postMessage({
      id,
      success: true,
      value,
      buildMs: performance.now() - start,
    });
  } catch (error) {
    // a runtime that has never built a model cannot be reused, so its memory is released
    if (!productive.has(identity)) residents[domain].delete(identity);
    port.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

let serial: Promise<void> = Promise.resolve();
process.on("message", (data: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand) => {
  serial = serial.then(() => evaluate(data));
});
