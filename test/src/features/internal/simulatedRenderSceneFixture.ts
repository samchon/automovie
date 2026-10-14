import { IAutoMovieScene } from "@automovie/interface";

/** Build the empty lit-space record used by simulated drawable scenarios. */
export const simulatedRenderSceneFixture = (): IAutoMovieScene => ({
  id: "planted-atrium",
  name: null,
  nodes: [],
  cameras: [],
  lights: [],
});
