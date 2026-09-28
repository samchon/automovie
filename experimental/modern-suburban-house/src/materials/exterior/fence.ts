/** Stained fence boards and the separately modeled side-yard gate wood. */
import { houseMaterial, type HouseFinish } from "../finish";

export const fence = {
  material: houseMaterial("fence-wood", "#8C6A48", 0.75),
  faces: ["fence-board", "fence-post", "leaf-panel", "gate-batten"],
  modelBindings: [
    { model: "gate:side-yard-gate", faces: ["leaf-panel", "gate-batten"] },
  ],
  texture: { file: "timber.png", metres: [0.14, 0.8], projection: "wall" },
} satisfies HouseFinish;
