import type { IAutoMovieHumanFaceDocument } from "@automovie/human";

import type { IHumanPreviewArtifact } from "./IHumanPreviewArtifact.js";
import type { IHumanPreviewBuilderProps } from "./IHumanPreviewBuilderProps.js";
import type { IHumanPreviewWorker } from "./IHumanPreviewWorker.js";
import { humanWorkerErrorMessage } from "./humanWorkerErrorMessage.js";

/**
 * Build the latest numerical preview through a disposable worker and decoder.
 * Document admission precedes allocation. Every worker is terminated on
 * completion or interruption, and a decoded obsolete result is disposed before
 * rejection. The caller alone publishes successfully returned previews.
 */
export function createHumanPreviewBuilder<
  Model,
  Document = IAutoMovieHumanFaceDocument,
>(props: IHumanPreviewBuilderProps<Model, Document>) {
  let generation = 0;
  let active: IHumanPreviewWorker | undefined;
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
    let artifact: IHumanPreviewArtifact;
    try {
      artifact = await new Promise<IHumanPreviewArtifact>((resolve, reject) => {
        rejectActive = () =>
          reject(new Error("Superseded by a newer face request."));
        worker.onError = (message) =>
          reject(
            new Error(
              humanWorkerErrorMessage(
                message,
                "The face worker failed before returning a result.",
              ),
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
