import { disposeHumanPreview } from "@automovie/playground/src/human/common/previewScene.ts";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport.ts";

import type { IBuildHumanViewerFaceResidentProps } from "./IBuildHumanViewerFaceResidentProps";
import type { IHumanViewerResident } from "./IHumanViewerResident";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes";

/**
 * Build and publish a face through the product face viewport. Only the group
 * is kept: holding the built model would keep a second copy of every
 * numerical array alive for as long as the resident. A refused build releases
 * its controls and numerical connection, including any optional cache job
 * staged before GPU preparation. Eviction withdraws that connection as well.
 *
 * @evidence contracts/common.md#principled-implementation The resident counts the arrays it actually keeps.
 * @evidence contracts/common.md#meaningful-documentation States what is kept and why.
 */
export async function buildHumanViewerFaceResident(
  props: IBuildHumanViewerFaceResidentProps,
): Promise<
  IHumanViewerResident<ReturnType<typeof createConnectedFaceViewport>>
> {
  let port:
    | ReturnType<IBuildHumanViewerFaceResidentProps["worker"]>
    | undefined;
  const stage = createConnectedFaceViewport({
    ...props.host.props,
    worker: () => {
      port = props.worker();
      return port;
    },
  });
  const releaseConnection = (): void => {
    stage.cancel();
    port?.terminate();
    props.host.release();
  };
  try {
    const construction =
      props.operation === "construct"
        ? await stage.construct(props.document, props.ao)
        : undefined;
    const model =
      construction === undefined
        ? await stage.build(props.document, false, props.ao)
        : construction.model;
    try {
      stage.publish(model);
    } catch (error) {
      stage.dispose(model);
      throw error;
    }
    const group = model.frame.resident.group;
    return {
      stage,
      admission: construction?.admission,
      periocularMappings: construction?.periocularMappings,
      resize: props.host.resize,
      group,
      release: () => {
        releaseConnection();
        disposeHumanPreview(group);
      },
      bytes: measureHumanViewerResidentBytes(
        group,
        model.frame.witnesses.flatMap((witness) => [
          witness.positions,
          witness.normals,
          witness.indices,
          witness.uvs,
        ]),
      ),
    };
  } catch (error) {
    releaseConnection();
    throw error;
  }
}
