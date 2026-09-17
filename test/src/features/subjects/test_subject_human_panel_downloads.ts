import { TestValidator } from "@nestia/e2e";

import { createHumanPanelFixture } from "../internal/createHumanPanelFixture";

/** Committed JSON and binary downloads preserve their independently chosen payloads.
 * The DOM and preview remain in memory; each scenario owns its own fixture.
 */
export const test_subject_human_panel_downloads = async (): Promise<void> => {
  const f = createHumanPanelFixture();
  await f.panel.ready;
  await f.click("face-save");
  await f.click("face-glb");
  await f.click("face-gltf");
  TestValidator.equals(
    "committed download filenames",
    f.downloads.map((file) => file.name),
    ["first.face.json", "first.glb", "mesh.bin", "first.gltf"],
  );
  TestValidator.equals(
    "saved document identity",
    JSON.parse(f.downloads[0].bytes as string).id,
    "first",
  );
  TestValidator.equals(
    "opaque GLB bytes",
    [...(f.downloads[1].bytes as Uint8Array)],
    [1, 2, 3],
  );
  TestValidator.equals(
    "external glTF buffer",
    [...(f.downloads[2].bytes as Uint8Array)],
    [4, 5],
  );
  f.dom.window.close();
};
