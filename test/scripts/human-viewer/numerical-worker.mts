/// <reference lib="webworker" />
/**
 * Numerical-only resident worker. The basis is fetched and admitted lazily once
 * per domain; it delegates every preview to the unchanged product runtime.
 * Models cross the structured-clone boundary, never reference photographs.
 */
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/body/connectedBodyRuntime";
import { createConnectedBodyGenerationRuntime } from "@automovie/playground/src/human/body/createConnectedBodyGenerationRuntime";
import { createConnectedFaceRuntime } from "@automovie/playground/src/human/common/connectedRuntime";
import { createConnectedPersonRuntime } from "@automovie/playground/src/human/person/createConnectedPersonRuntime";
import { describeConnectedPersonFaceProgress } from "@automovie/playground/src/human/person/describeConnectedPersonFaceProgress";

import { createHumanViewerHeadlessWhole } from "./createHumanViewerHeadlessWhole";
import { humanViewerResidentRuntime } from "./humanViewerResidentRuntime";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";
import { readHumanViewerCompiles } from "./readHumanViewerCompiles";
import { createHumanViewerNumericalSources } from "./createHumanViewerNumericalSources";
import { admitHumanViewerDocument } from "./admitHumanViewerDocument";
import { createHumanViewerPersistence } from "./createHumanViewerPersistence";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand";
import { humanViewerProtocol } from "./humanViewerProtocol";
import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress";

const scope = self as unknown as DedicatedWorkerGlobalScope;
// announce the compile generations this worker's human modules ran, so the page can refuse a mixed-compile candidate
scope.postMessage({ type: "compiles", compiles: readHumanViewerCompiles(), protocol: humanViewerProtocol });
const face = new Map<string, Promise<ReturnType<typeof createConnectedFaceRuntime>>>();
const body = new Map<string, Promise<ReturnType<typeof createConnectedBodyRuntime>>>();
const person = new Map<string, Promise<ReturnType<typeof createConnectedPersonRuntime>>>();
const sources = createHumanViewerNumericalSources();
const persistence = createHumanViewerPersistence((value) => scope.postMessage(value));
// identities whose resident runtime has produced at least one model; a runtime that has not is released on failure
const productive = new Set<string>();
const residents = { person, face, body } as const;
// Display builds are serialized by the page. Admission-only requests emit no
// construction events. Cached runtimes call the current build's relay.
let relayProgress: (stage: string) => void = () => undefined;
const observeProgress = (stage: string): void => relayProgress(stage);
scope.onmessage = async (event: MessageEvent<IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand>) => {
  if ("persistence" in event.data) {
    if (event.data.persistence === "flush") persistence.flush();
    else if (event.data.id !== undefined) persistence.discard(event.data.id);
    return;
  }
  const { id, domain, basis, input } = event.data;
  const identity = domain + ":" + basis;
  try {
    if (input.operation === "admit") {
      const source = domain === "body" ? await sources.body(basis)
        : domain === "person" ? await sources.person(basis) : undefined;
      const bodyBasis = source === undefined ? undefined
        : Array.isArray(source) ? source[1].body
          : "body" in source ? source.body : source;
      scope.postMessage({ id, admission: true, reason: admitHumanViewerDocument(domain, input.document, bodyBasis?.anatomicalAssembly) });
      return;
    }
    const requestStarted = performance.now();
    let previousCompletion = requestStarted;
    relayProgress = (stage) => {
      const now = performance.now();
      const progress: IHumanViewerNumericalProgress = { type: "progress", id, stage,
        elapsedMs: now - requestStarted, stageMs: now - previousCompletion };
      previousCompletion = now;
      scope.postMessage(progress);
    };
    persistence.preempt();
    const runtime =
      domain === "person"
        ? await humanViewerResidentRuntime(person, identity, async () =>
            createConnectedPersonRuntime(await sources.person(basis), { progress: observeProgress }),
          )
        : domain === "face"
        ? await humanViewerResidentRuntime(face, identity, () =>
            sources.face(basis).then((asset) => createConnectedFaceRuntime({ basis: asset,
              progress: (progress) => observeProgress(describeConnectedPersonFaceProgress(progress)) })),
          )
        : await humanViewerResidentRuntime(body, identity, () =>
            sources.body(basis).then((asset) => Array.isArray(asset)
              ? createConnectedBodyGenerationRuntime(asset[0], asset[1], observeProgress)
              : createConnectedBodyRuntime(asset, createHumanViewerHeadlessWhole(asset.id), { progress: observeProgress })),
          );
    const start = performance.now();
    const constructionOwner = input.operation !== "construct" ? undefined
      : domain === "person" ? person.get(identity) : domain === "face" ? face.get(identity) : undefined;
    if (input.operation === "construct" && constructionOwner === undefined)
      throw new Error("Construction requires the loaded face or paired person runtime.");
    const previewRequest = { ...input, operation: "preview" as const, measure: false };
    const value = constructionOwner !== undefined
      ? domain === "person"
        ? await (await person.get(identity)!)({ operation: "construct", document: input.document }, observeProgress)
        : await (await face.get(identity)!)({ operation: "construct", document: input.document, occlusion: input.occlusion })
      : domain === "person"
        ? await (await person.get(identity)!)(previewRequest, observeProgress)
        : await runtime(previewRequest);
    productive.add(identity);
    if (event.data.cache !== undefined && value.operation === "preview")
      persistence.stage({ ...event.data.cache, id, value });
    scope.postMessage({
      id,
      success: true,
      value,
      buildMs: performance.now() - start,
    });
  } catch (error) {
    // a runtime that has never built a model cannot be reused, so its memory is released
    if (!productive.has(identity)) residents[domain].delete(identity);
    scope.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
