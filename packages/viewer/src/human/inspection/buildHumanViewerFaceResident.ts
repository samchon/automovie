import { createConnectedFaceViewport } from "@automovie/viewer/human/face/createConnectedFaceViewport";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

import type { IBuildHumanViewerFaceResidentProps } from "./IBuildHumanViewerFaceResidentProps.js";
import type { IHumanViewerResident } from "./IHumanViewerResident.js";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes.js";

/**
 * Build and publish a face through the product face viewport. Only the group
 * is kept: holding the built model would keep a second copy of every
 * numerical array alive for as long as the resident. A refused build releases
 * its controls and numerical connection, including any optional cache job
 * staged before GPU preparation. Publication keeps its synchronous scene commit,
 * then awaits the stage's actual retirement completion. Final release attempts
 * stage, connection and controls independently and preserves every cause; cached
 * texture wrappers remain with the stage rather than a second group disposer.
 */
export async function buildHumanViewerFaceResident(
  props: IBuildHumanViewerFaceResidentProps,
): Promise<
  IHumanViewerResident<ReturnType<typeof createConnectedFaceViewport>>
> {
  let port:
    | ReturnType<IBuildHumanViewerFaceResidentProps["worker"]>
    | undefined;
  let stage: ReturnType<typeof createConnectedFaceViewport> | undefined;
  const release = createAutoMovieResourceRetirement([
    () => stage?.close(),
    () => port?.terminate(),
    () => props.host.release(),
  ]);
  try {
    stage = createConnectedFaceViewport({
      ...props.host.props,
      worker: () => {
        port = props.worker();
        return port;
      },
    });
    const construction =
      props.operation === "construct"
        ? await stage.construct(props.document, props.ao)
        : undefined;
    const model =
      construction === undefined
        ? await stage.build(props.document, false, props.ao)
        : construction.model;
    stage.publish(model);
    await stage.settleRetirements();
    const group = model.frame.resident.group;
    return {
      stage,
      admission: construction?.admission,
      periocularMappings: construction?.periocularMappings,
      resize: props.host.resize,
      group,
      release,
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
    return createAutoMovieResourceRetirement([release], { error })();
  }
}
