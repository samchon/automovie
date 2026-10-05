import { disposeHumanPreview } from "@automovie/playground/src/human/common/previewScene";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport";

import type { IBuildHumanViewerFaceResidentProps } from "./IBuildHumanViewerFaceResidentProps";
import type { IHumanViewerResident } from "./IHumanViewerResident";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes";

/**
 * Build and publish a face through the product face viewport. Only the group
 * is kept: holding the built model would keep a second copy of every
 * numerical array alive for as long as the resident.
 *
 * @evidence contracts/common.md#principled-implementation The resident counts the arrays it actually keeps.
 * @evidence contracts/common.md#meaningful-documentation States what is kept and why.
 */
export async function buildHumanViewerFaceResident(
  props: IBuildHumanViewerFaceResidentProps,
): Promise<IHumanViewerResident<ReturnType<typeof createConnectedFaceViewport>>> {
  const stage = createConnectedFaceViewport({ ...props.host.props, worker: props.worker });
  const model = await stage.build(props.document, false, props.ao);
  stage.publish(model);
  const group = model.frame.resident.group;
  return {
    stage,
    resize: props.host.resize,
    group,
    release: () => {
      stage.cancel();
      props.host.release();
      disposeHumanPreview(group);
    },
    bytes: measureHumanViewerResidentBytes(group, model.frame.witnesses.flatMap(
      (witness) => [witness.positions, witness.normals, witness.indices, witness.uvs])),
  };
}
