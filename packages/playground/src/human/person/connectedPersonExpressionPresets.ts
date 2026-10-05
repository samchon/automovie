import type { IConnectedFaceExpressionPreset } from "../face/IConnectedFaceExpressionPreset";

/**
 * The connected person editor's expression presets: neutral, and one each for
 * the mouth corners, the jaw and one eyelid, the expressions the person's one
 * skin is checked against.
 *
 * @author Samchon
 */
export const connectedPersonExpressionPresets: IConnectedFaceExpressionPreset[] = [
  { name: "Neutral", expression: {} },
  { name: "Smile", expression: { mouthSmileLeft: 0.5, mouthSmileRight: 0.5 } },
  { name: "Open jaw", expression: { jawOpen: 0.5 } },
  { name: "Wink", expression: { eyeBlinkRight: 1 } },
];
