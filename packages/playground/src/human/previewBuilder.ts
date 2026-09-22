import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanFaceDocument } from "@automovie/human";
import type { JSONDocument } from "@gltf-transform/core";

type Artifact = {
  glb: Uint8Array<ArrayBuffer>;
  gltf: JSONDocument;
  parts: number;
  /** Absent when the port does not measure, null when this request did not ask. */
  crossings?: IAutoMovieModelCrossing[] | null;
  /** Facts the worker describes beside the bytes; absent when it describes none. */
  extras?: Record<string, unknown>;
};
type Reply = ({ success: true } & Artifact) | { success: false; error: string };
type WorkerPort = {
  onError: (message: string) => void;
  onReply: (reply: Reply) => void;
  send: (text: string, measure?: boolean) => void;
  terminate: () => void;
};

/**
 * Build the latest numerical preview through a disposable worker and decoder.
 * Document admission precedes allocation. Every worker is terminated on
 * completion or interruption, and a decoded obsolete result is disposed before
 * rejection. The caller alone publishes successfully returned previews.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Prevents superseded worker or decoder results from becoming the displayed face after a newer request or file load.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Shares a request generation across worker completion and asynchronous decoding, releasing obsolete renderer resources.
 */
export function createHumanPreviewBuilder<
  Model,
  Document = IAutoMovieHumanFaceDocument,
>(props: {
  /** Admission and serialization belong to the selected numerical document format. */
  serialize: (document: Document) => string;
  worker: () => WorkerPort;
  decode: (artifact: Artifact) => Promise<Model>;
  dispose: (model: Model) => void;
}) {
  let generation = 0;
  let active: WorkerPort | undefined;
  let rejectActive: (() => void) | undefined;
  const cancel = (): void => {
    ++generation;
    rejectActive?.();
    active?.terminate();
    active = undefined;
    rejectActive = undefined;
  };
  const build = async (document: Document, measure = false): Promise<Model> => {
    cancel();
    const ticket = generation;
    const text = props.serialize(document);
    const worker = props.worker();
    active = worker;
    let artifact: Artifact;
    try {
      artifact = await new Promise<Artifact>((resolve, reject) => {
        rejectActive = () =>
          reject(new Error("Superseded by a newer face request."));
        worker.onError = (message) =>
          reject(
            new Error(
              message.trim() ||
                "The face worker failed before returning a result.",
            ),
          );
        worker.onReply = (reply) =>
          reply.success ? resolve(reply) : reject(new Error(reply.error));
        worker.send(text, measure);
      });
    } finally {
      worker.terminate();
      if (active === worker) {
        active = undefined;
        rejectActive = undefined;
      }
    }
    const model = await props.decode(artifact);
    if (ticket !== generation) {
      props.dispose(model);
      throw new Error("Superseded while decoding face geometry.");
    }
    return model;
  };
  return { build, cancel };
}
