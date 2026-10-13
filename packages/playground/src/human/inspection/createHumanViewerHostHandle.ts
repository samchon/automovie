import type { HumanViewerHandle } from "@automovie/viewer/human/inspection/HumanViewerHandle";
import { serializeHumanViewerAddress } from "@automovie/viewer/human/inspection/serializeHumanViewerAddress";

/**
 * The handle the host page publishes for the committed generation. It
 * forwards every call to that generation's handle; `show` also writes the
 * shown address into the host's own location hash, so a reload keeps it.
 */
export function createHumanViewerHostHandle(
  viewer: HumanViewerHandle,
): HumanViewerHandle {
  return {
    show: async (address) => {
      await viewer.show(address);
      history.replaceState(
        null,
        "",
        "#" + serializeHumanViewerAddress(viewer.address()),
      );
    },
    parts: () => viewer.parts(),
    renderer: () => viewer.renderer(),
    revision: () => viewer.revision(),
    builds: () => viewer.builds(),
    buildMs: () => viewer.buildMs(),
    spans: () => viewer.spans(),
    address: () => viewer.address(),
    admission: () => viewer.admission(),
    rigReading: () => viewer.rigReading?.(),
    exportConstruction: () => viewer.exportConstruction(),
    periocularMappings: () => viewer.periocularMappings?.(),
    png: () => viewer.png(),
    evict: () => viewer.evict(),
  };
}
