import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { humanoidDocument } from "./humanoidDocument";
import { set } from "./set";
import { humanoidPayload } from "./humanoidPayload";

/**
 * Declare recognized, unnamed and duplicate-convention joints without replacing first slot ownership.
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
