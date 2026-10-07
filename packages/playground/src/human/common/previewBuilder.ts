import type { IAutoMovieHumanFaceDocument } from "@automovie/human";
import { humanWorkerErrorMessage } from "./humanWorkerErrorMessage";
import type { IHumanPreviewArtifact } from "./IHumanPreviewArtifact";
import type { IHumanPreviewBuilderProps } from "./IHumanPreviewBuilderProps";
import type { IHumanPreviewWorker } from "./IHumanPreviewWorker";

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
              humanWorkerErrorMessage(message, "The face worker failed before returning a result."),
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
