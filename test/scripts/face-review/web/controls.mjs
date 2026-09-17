/** Bind the inspection controls to the controller's current scene state.
 * Mesh selection uses a getter because successful reloads replace the map.
 * Capture/download delegates admission to the controller and hashes the exact
 * PNG bytes before writing the paired receipt. Event handlers keep no model copy.
 */
import { portraitWebFocusIds, portraitWebModes } from "/logic.mjs";

export function bindPortraitWebControls({
  $,
  button,
  setMode,
  setVisible,
  filterParts,
  calibration,
  render,
  reload,
  capture,
  showError,
  getMeshes,
}) {
  for (const name of portraitWebModes)
    button($("modes"), name, () => setMode(name));
  for (const [name, select] of [
    ["All", () => [...getMeshes().keys()]],
    [
      "Hair",
      () =>
        [...getMeshes()]
          .filter(([, mesh]) => mesh.userData.materialId === "hair")
          .map(([id]) => id),
    ],
    [
      "Head / lids",
      () =>
        [...getMeshes().keys()].filter(
          (id) => id === "head" || id.endsWith("eyelids"),
        ),
    ],
    ["Nasal parts", () => portraitWebFocusIds([...getMeshes().keys()], "nose")],
    [
      "Teeth",
      () =>
        [...getMeshes()]
          .filter(([, mesh]) => mesh.userData.materialId === "teeth")
          .map(([id]) => id),
    ],
  ])
    button($("groups"), name, () => {
      const ids = select();
      setVisible(ids, !ids.every((id) => getMeshes().get(id).visible));
    });
  $("filter").addEventListener("input", filterParts);
  $("calibration").addEventListener("change", () => {
    calibration.visible = $("calibration").checked;
    render();
  });
  $("reload").addEventListener("click", () => {
    void reload().catch(() => {});
  });
  $("save").addEventListener("click", async () => {
    try {
      const result = capture();
      const bytes = await (await fetch(result.png)).arrayBuffer();
      result.receipt.pngSha256 = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      ]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
      const stem = `${result.receipt.artifact.model.slice(0, 12)}-${result.receipt.camera.view}-${result.receipt.mode}-${Date.now()}`;
      result.receipt.file = `${stem}.png`;
      for (const [suffix, href] of [
        ["png", result.png],
        [
          "json",
          `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result.receipt, null, 2))}`,
        ],
      ]) {
        const link = document.createElement("a");
        link.download = `${stem}.${suffix}`;
        link.href = href;
        link.click();
      }
    } catch (error) {
      showError(error);
    }
  });
}
