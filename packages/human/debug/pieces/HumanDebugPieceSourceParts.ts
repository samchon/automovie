import { HumanInspectionSourceParts } from "../../src/inspection/HumanInspectionSourceParts";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/** Viewer registration; the source/raw implementation is shared with Node inspection. */
export const HumanDebugPieceSourceParts: IHumanDebugPiece = {
  name: "source.parts", region: "body",
  description: "Named actual production source parts lofted together before joins; tree selects the current production tree, and the default is trunk.",
  arguments: ["tree", "trunk", "trunk,gluteal.*,leg.*", "arm.left,thumb.left", "arm.right,thumb.right"],
  build: HumanInspectionSourceParts.build,
};
