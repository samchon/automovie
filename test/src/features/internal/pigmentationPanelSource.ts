import { humanFaceBasisFixture } from "./humanFaceBasisFixture";

/** Two independent regions on the analytic square for UI admission and history. */
export function pigmentationPanelSource() {
  const source = humanFaceBasisFixture();
  source.document.skin = {
    square: ["Region 1", "cheek"].map((name) => ({
      name,
      center: [0, 0, 0] as [number, number, number],
      radius: [1, 1, 1] as [number, number, number],
      gain: [1, 1, 1] as [number, number, number],
      strength: 0,
    })),
  };
  return source;
}
