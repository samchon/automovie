import type { HumanViewerHandle } from "@automovie/viewer/human/inspection/HumanViewerHandle";
import { serializeHumanViewerAddress } from "@automovie/viewer/human/inspection/serializeHumanViewerAddress";

/**
 * The handle the host page publishes for the committed generation. It forwards every call to that generation's handle; `show` also writes the shown address into the host's own location hash, so a reload keeps it. The hash comes from the generation's actual committed address after show completes, and failures propagate before changing history. It reads no global replacement handle during an in-flight operation.
 *
 * @evidence contracts/common.md#principled-implementation Successful show reads the same generation's committed address before replacing the host hash, while every observation method directly forwards to that retained handle.
 * @evidence contracts/common.md#clear-and-simple-design The host wrapper owns only persistent display-address publication; numerical state, render observation and generation retirement remain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed show does not publish requested address as if displayed, and an operation is not rebound through a newer global handle.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies committed-generation forwarding, post-success actual-address hashing and failure propagation.
 * @evidence contracts/performance.md#efficient-algorithms Direct getters add constant wrapper work, and show serializes l address characters after the underlying display cost; the wrapper copies no mesh, PNG or numerical document data.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Calls preserve the underlying generation's effects and observation identity without a wrapper-owned numerical cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The wrapper retains one borrowed generation handle without acquiring resources; the host removes/replaces it and its iframe through the separate generation lifetime owner.
 */
export function createHumanViewerHostHandle(
  viewer: HumanViewerHandle,
): HumanViewerHandle {
  return {
    show: async (address: Parameters<HumanViewerHandle["show"]>[0]): Promise<void> => {
      await viewer.show(address);
      history.replaceState(
        null,
        "",
        "#" + serializeHumanViewerAddress(viewer.address()),
      );
    },
    parts: (): ReturnType<HumanViewerHandle["parts"]> => viewer.parts(),
    renderer: (): ReturnType<HumanViewerHandle["renderer"]> => viewer.renderer(),
    revision: (): ReturnType<HumanViewerHandle["revision"]> => viewer.revision(),
    builds: (): ReturnType<HumanViewerHandle["builds"]> => viewer.builds(),
    buildMs: (): ReturnType<HumanViewerHandle["buildMs"]> => viewer.buildMs(),
    spans: (): ReturnType<HumanViewerHandle["spans"]> => viewer.spans(),
    address: (): ReturnType<HumanViewerHandle["address"]> => viewer.address(),
    admission: (): ReturnType<HumanViewerHandle["admission"]> => viewer.admission(),
    rigReading: (): ReturnType<NonNullable<HumanViewerHandle["rigReading"]>> => viewer.rigReading?.(),
    exportConstruction: (): ReturnType<HumanViewerHandle["exportConstruction"]> => viewer.exportConstruction(),
    periocularMappings: (): ReturnType<NonNullable<HumanViewerHandle["periocularMappings"]>> => viewer.periocularMappings?.(),
    png: (): ReturnType<HumanViewerHandle["png"]> => viewer.png(),
    evict: (): ReturnType<HumanViewerHandle["evict"]> => viewer.evict(),
  };
}
