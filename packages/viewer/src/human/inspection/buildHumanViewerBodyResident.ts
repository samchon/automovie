import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";
import type * as THREE from "three";

import type { IBuildHumanViewerBodyResidentProps } from "./IBuildHumanViewerBodyResidentProps.js";
import type { IHumanViewerResident } from "./IHumanViewerResident.js";
import { collectHumanViewerBodyArrays } from "./collectHumanViewerBodyArrays.js";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes.js";

/**
 * Build and publish a body, or a whole person, through the product body viewport: the worker answers the body protocol with the composed model, and only the document text differs. The group, its parts' arrays and the construction's placement reading stay with the resident. A refused build releases the numerical connection and controls before propagating its cause, so an undisplayed projection cannot remain staged for a later capture's optional cache flush. Synchronous publication is followed by awaited owned retirement. The stage closes its numerical connection; stage and host cleanup are independent attempts with one shared result; stage-owned cached textures are not disposed again by a group traversal.
 *
 * @evidence contracts/common.md#principled-implementation The body/person product viewport builds or constructs the supplied numerical document, publishes its prepared frame and exposes actual admission/rig readings without inferring them from drawing.
 * @evidence contracts/common.md#clear-and-simple-design Numerical construction remains with the product viewport; this resident adapter packages group, original-document export, byte accounting and one joined stage/host release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preview and construct use their actual owner paths, rejected cleanup preserves the primary cause and stage-owned worker/texture retirement is not duplicated by this adapter.
 * @evidence contracts/common.md#meaningful-documentation The comment defines publication/settlement ordering, retained construction readings, numerical-connection ownership and independent host cleanup.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the numerical build plus GPU preparation over the produced geometry and one group/retained-array accounting pass; export later uses the original document through the same stage.
 * @evidence contracts/performance.md#reuse-equivalent-work Release shares one original completion and failure outcome; model reuse and document/basis/source equivalence remain with viewport and resident-cache owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned resident owns its stage/group and host controls until release; build refusal awaits their independent cleanup with its primary cause, while stage.close owns numerical worker termination and texture retirement.
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
  type Stage = ReturnType<typeof createConnectedBodyViewport<Document>>;
  type Model = Awaited<ReturnType<Stage["build"]>>;
  type Construction = Awaited<ReturnType<Stage["construct"]>>;
  let stage: Stage | undefined;
  const release: () => Promise<void> = createAutoMovieResourceRetirement([
    (): Promise<void> | undefined => stage?.close(),
    (): Promise<void> => props.host.release(),
  ]);
  try {
    stage = createConnectedBodyViewport<Document>({
      ...props.host.props,
      serialize: props.serialize,
      worker: props.worker,
    });
    const construction: Construction | undefined =
      props.operation === "construct"
        ? await stage.construct(props.document)
        : undefined;
    const model: Model =
      construction === undefined
        ? await stage.build(props.document)
        : construction.model;
    stage.publish(model);
    await stage.settleRetirements();
    const group: THREE.Group = model.frame.resident.group;
    const publishedStage: Stage = stage;
    return {
      stage,
      admission: construction?.admission,
      rigReading: construction?.model.rigReading,
      exportConstruction: async (): Promise<IConnectedBodyConstructionExportResult> => ({
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
