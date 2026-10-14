import { createConnectedFaceViewport } from "@automovie/viewer/human/face/createConnectedFaceViewport";
import type * as THREE from "three";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IBuildHumanViewerFaceResidentProps } from "./IBuildHumanViewerFaceResidentProps.js";
import type { IHumanViewerResident } from "./IHumanViewerResident.js";
import { measureHumanViewerResidentBytes } from "./measureHumanViewerResidentBytes.js";

/**
 * Build and publish a face through the product face viewport. The resident retains the stage/group and actual construction readings without adding a separate whole-projection cache. A refused build releases its controls and numerical connection, including any optional cache job staged before GPU preparation. Publication keeps its synchronous scene commit, then awaits the stage's actual retirement completion. Final release attempts stage and controls independently and preserves every cause; stage closure owns its numerical connection and cached texture wrappers remain with the stage rather than a second group disposer.
 *
 * @evidence contracts/common.md#principled-implementation Face preview or construction runs through the owner viewport, publishes its prepared frame and forwards actual admission and periocular mapping readings unchanged.
 * @evidence contracts/common.md#clear-and-simple-design The adapter packages the resident group/stage, counted witness arrays and joined stage/host teardown, leaving lazy numerical connection acquisition with the stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Drawing success does not fabricate admission, and cached texture wrappers stay with their stage owner rather than being disposed again through the group.
 * @evidence contracts/common.md#meaningful-documentation The comment defines retained state, synchronous publication followed by settlement, stage-owned connection and independently retired controls.
 * @evidence contracts/performance.md#efficient-algorithms Work includes numerical face construction and GPU preparation plus one group/witness-array accounting pass; the adapter adds references and counts without copying typed geometry arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Resident release shares its original completion/failures, while numerical cache and source/basis equivalence remain with the worker and resident-cache owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stage close owns the lazily acquired connection and the host closes controls; original build and independent cleanup causes are preserved without a second port terminator.
 */
export async function buildHumanViewerFaceResident(
  props: IBuildHumanViewerFaceResidentProps,
): Promise<
  IHumanViewerResident<ReturnType<typeof createConnectedFaceViewport>>
> {
  type Stage = ReturnType<typeof createConnectedFaceViewport>;
  type Model = Awaited<ReturnType<Stage["build"]>>;
  type Construction = Awaited<ReturnType<Stage["construct"]>>;
  let stage: Stage | undefined;
  const release: () => Promise<void> = createAutoMovieResourceRetirement([
    (): Promise<void> | undefined => stage?.close(),
    (): Promise<void> => props.host.release(),
  ]);
  try {
    stage = createConnectedFaceViewport({
      ...props.host.props,
      worker: props.worker,
    });
    const construction: Construction | undefined =
      props.operation === "construct"
        ? await stage.construct(props.document, props.ao)
        : undefined;
    const model: Model =
      construction === undefined
        ? await stage.build(props.document, false, props.ao)
        : construction.model;
    stage.publish(model);
    await stage.settleRetirements();
    const group: THREE.Group = model.frame.resident.group;
    return {
      stage,
      admission: construction?.admission,
      periocularMappings: construction?.periocularMappings,
      resize: props.host.resize,
      group,
      release,
      bytes: measureHumanViewerResidentBytes(
        group,
        model.frame.witnesses.flatMap(
          (
            witness: Model["frame"]["witnesses"][number],
          ): (ArrayLike<number | null> | null | undefined)[] => [
            witness.positions,
            witness.normals,
            witness.indices,
            witness.uvs,
          ],
        ),
      ),
    };
  } catch (error) {
    return createAutoMovieResourceRetirement([release], { error })();
  }
}
