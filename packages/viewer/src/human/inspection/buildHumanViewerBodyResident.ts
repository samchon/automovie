import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

import type { IBuildHumanViewerBodyResidentProps } from "./IBuildHumanViewerBodyResidentProps.js";
import type { IHumanViewerResident } from "./IHumanViewerResident.js";
import { collectHumanViewerBodyArrays } from "./collectHumanViewerBodyArrays.js";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes.js";

/**
 * Build and publish a body, or a whole person, through the product body
 * viewport: the worker answers the body protocol with the composed model, and
 * only the document text differs. The group, its parts' arrays and the
 * construction's placement reading stay with the resident. A refused build releases the numerical connection
 * and controls before propagating its cause, so an undisplayed projection
 * cannot remain staged for a later capture's optional cache flush. Synchronous
 * publication is followed by awaited owned retirement. Final stage, numerical
 * connection and host cleanup are independent attempts with one shared result;
 * stage-owned cached textures are not disposed again by a group traversal.
 *
 * @evidence contracts/common.md#principled-implementation A person is drawn by the same body stage, not a viewer-only path.
 * @evidence contracts/common.md#meaningful-documentation States the shared path and what is kept.
 * @evidence contracts/common.md#clear-and-simple-design The body viewport serves both body and person documents; one resident owns publication, measured arrays, export access and release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Build/construct/publication and worker release use the maintained viewport APIs; the adapter neither constructs alternate Human geometry nor accepts a refused model.
 */
export async function buildHumanViewerBodyResident<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument,
>(
  props: IBuildHumanViewerBodyResidentProps<Document>,
): Promise<
  IHumanViewerResident<ReturnType<typeof createConnectedBodyViewport<Document>>>
> {
  let stage: ReturnType<typeof createConnectedBodyViewport<Document>> | undefined;
  const release = createAutoMovieResourceRetirement([
    () => stage?.close(),
    () => stage?.disposeWorker(),
    () => props.host.release(),
  ]);
  try {
    stage = createConnectedBodyViewport<Document>({
      ...props.host.props,
      serialize: props.serialize,
      worker: props.worker,
    });
    const construction =
      props.operation === "construct"
        ? await stage.construct(props.document)
        : undefined;
    const model =
      construction === undefined
        ? await stage.build(props.document)
        : construction.model;
    stage.publish(model);
    await stage.settleRetirements();
    const group = model.frame.resident.group;
    const publishedStage = stage;
    return {
      stage,
      admission: construction?.admission,
      rigReading: construction?.model.rigReading,
      exportConstruction: async () => ({
        operation: "exportConstruction",
        ...(await publishedStage.exportConstruction(props.document)),
      }),
      resize: props.host.resize,
      group,
      release,
      bytes: measureHumanViewerResidentBytes(
        group,
        collectHumanViewerBodyArrays(model.frame.resident.parts),
      ),
    };
  } catch (error) {
    return createAutoMovieResourceRetirement([release], { error })();
  }
}
