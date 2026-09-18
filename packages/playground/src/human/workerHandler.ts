import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { JSONDocument } from "@gltf-transform/core";

/**
 * Turn one serialized face request into a transferable artifact or a refusal.
 * Admission, construction and export share the same error boundary; the worker
 * host owns only message transport and supplies the installed public operations.
 *
 * Crossing measurement is requested per call rather than always run. It costs
 * seconds on a face of this size, which is right for a deliberate check and
 * wrong for every slider drag, and an unrequested check returns no reading
 * instead of an empty one so a caller cannot mistake "not asked" for "clear".
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Returns a failed request without publishing a partially built face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps parsing, construction and asynchronous export inside one worker reply boundary.
 */
export function createHumanFaceWorkerHandler<
  Document,
  Model extends { parts: readonly unknown[] },
>(props: {
  parse: (text: string) => Document;
  build: (document: Document) => Model;
  /** Optional crossing measurement, run only when a request asks for it. */
  measure?: (model: Model) => IAutoMovieModelCrossing[];
  export: (
    model: Model,
  ) => Promise<{ glb: Uint8Array<ArrayBuffer>; gltf: JSONDocument }>;
  send: (
    reply:
      | {
          success: true;
          document: Document;
          glb: Uint8Array<ArrayBuffer>;
          gltf: JSONDocument;
          parts: number;
          crossings: IAutoMovieModelCrossing[] | null;
        }
      | { success: false; error: string },
    transfer?: ArrayBuffer[],
  ) => void;
}) {
  return async (text: string, measure = false): Promise<void> => {
    try {
      const document = props.parse(text);
      const model = props.build(document);
      const { glb, gltf } = await props.export(model);
      props.send(
        {
          success: true,
          document,
          glb,
          gltf,
          parts: model.parts.length,
          crossings:
            measure && props.measure !== undefined
              ? props.measure(model)
              : null,
        },
        [glb.buffer],
      );
    } catch (error) {
      props.send({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
