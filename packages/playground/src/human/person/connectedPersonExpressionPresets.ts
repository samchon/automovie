import type { IConnectedFaceExpressionPreset } from "../face/IConnectedFaceExpressionPreset";

/**
 * The connected person editor's expression presets: neutral, and one each for
 * the mouth corners, the jaw and one eyelid, the expressions the person's one
 * skin is checked against.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Offers neutral and named mouth, jaw and eyelid expressions separately from identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Supplies each preset's expression weights applied over the unchanged identity.
 * @author Samchon
 */
export const connectedPersonExpressionPresets: IConnectedFaceExpressionPreset[] = [
  { name: "Neutral", expression: {} },
  { name: "Smile", expression: { mouthSmileLeft: 0.5, mouthSmileRight: 0.5 } },
  { name: "Open jaw", expression: { jawOpen: 0.5 } },
  { name: "Wink", expression: { eyeBlinkRight: 1 } },
];
