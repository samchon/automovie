import { TestValidator } from "@nestia/e2e";

import { captureHumanViewerReference } from "../../../scripts/human-viewer/captureHumanViewerReference";

/**
 * The capture joins layout, surface and encoding, and needs a 2D surface.
 *
 * Scenarios:
 * 1. A split composition sizes the scratch surface to two cells, draws render
 *    then photo, and returns the surface's PNG data URL.
 * 2. A surface without a 2D context refuses.
 */
export const test_human_viewer_reference_capture = (): void => {
  const drawn: string[] = [];
  const surface = {
    width: 0,
    height: 0,
    getContext: () => ({
      globalAlpha: 1,
      fillStyle: "",
      arc: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      rect: () => {},
      clip: () => {},
      drawImage: (image: unknown) => {
        drawn.push(String(image));
      },
    }),
    toDataURL: (type: string) => "data:" + type + ";base64,AA==",
  };
  const photo = { toString: () => "P", naturalWidth: 10, naturalHeight: 10 };
  const url = captureHumanViewerReference({
    composition: { mode: "split", opacity: 0.5, size: 20 },
    photo,
    landmarks: [],
    render: "R",
    create: () => surface,
  });
  TestValidator.equals("url", url, "data:image/png;base64,AA==");
  TestValidator.equals("surface", [surface.width, surface.height], [40, 20]);
  TestValidator.equals("order", drawn, ["R", "P"]);
  let refused = false;
  try {
    captureHumanViewerReference({
      composition: { mode: "split", opacity: 0.5, size: 20 },
      photo,
      landmarks: [],
      render: "R",
      create: () => ({ ...surface, getContext: () => null }),
    });
  } catch {
    refused = true;
  }
  TestValidator.predicate("no 2d context", refused);
};
