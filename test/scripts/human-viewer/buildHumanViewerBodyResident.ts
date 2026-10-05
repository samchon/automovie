import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { createConnectedBodyViewport } from "@automovie/playground/src/human/body/connectedBodyViewport";
import { disposeHumanPreview } from "@automovie/playground/src/human/common/previewScene";

import type { IBuildHumanViewerBodyResidentProps } from "./IBuildHumanViewerBodyResidentProps";
import type { IHumanViewerResident } from "./IHumanViewerResident";
import { collectHumanViewerBodyArrays } from "./collectHumanViewerBodyArrays";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes";

/**
 * Build and publish a body, or a whole person, through the product body
 * viewport: the worker answers the body protocol with the composed model, and
 * only the document text differs. Only the group and its parts' arrays stay
 * alive with the resident.
 *
 * @evidence contracts/common.md#principled-implementation A person is drawn by the same body stage, not a viewer-only path.
 * @evidence contracts/common.md#meaningful-documentation States the shared path and what is kept.
 */
export async function buildHumanViewerBodyResident<
  Document extends IAutoMovieHumanBodyBasisDocument | IAutoMovieHumanPersonDocument,
>(
  props: IBuildHumanViewerBodyResidentProps<Document>,
): Promise<IHumanViewerResident<ReturnType<typeof createConnectedBodyViewport<Document>>>> {
  const stage = createConnectedBodyViewport<Document>({
    ...props.host.props,
    serialize: props.serialize,
    worker: props.worker,
  });
  const model = await stage.build(props.document);
  stage.publish(model);
  const group = model.frame.resident.group;
  return {
    stage,
    resize: props.host.resize,
    group,
    release: () => {
      stage.disposeWorker();
      props.host.release();
      disposeHumanPreview(group);
    },
    bytes: measureHumanViewerResidentBytes(group, collectHumanViewerBodyArrays(model.frame.resident.parts)),
  };
}
