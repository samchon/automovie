import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { humanoidDocument } from "./humanoidDocument";
import { set } from "./set";
import { humanoidPayload } from "./humanoidPayload";

/**
 * Declare recognized, unnamed and duplicate-convention joints without replacing first slot ownership.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const aliasHumanoid: () => { document: ExternalModelMatrixObject; payload: Buffer } = (): { document: ExternalModelMatrixObject; payload: Buffer } => {
  const document: ExternalModelMatrixObject = humanoidDocument();
  document.nodes = [
    { mesh: 0, skin: 0 },
    { name: "Hips" },
    {},
    { name: "Pelvis" },
  ];
  set(document, ["skins", 0, "joints"], [1, 2, 3]);
  return { document, payload: humanoidPayload() };
};
