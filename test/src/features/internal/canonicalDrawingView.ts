import { IAutoMovieDrawingView } from "@automovie/interface";

import { canonicalDrawingStyle as drawingStyle } from "./canonicalDrawingStyle";

/** A complete downward plan view at 1.2 metres, followed by caller overrides. */
export const canonicalDrawingView: (
  overrides?: Partial<IAutoMovieDrawingView>,
) => IAutoMovieDrawingView = (
  overrides: Partial<IAutoMovieDrawingView> = {},
): IAutoMovieDrawingView => ({
  id: "plan-ground",
  projection: "plan",
  discipline: "architectural",
  origin: { x: 0, y: 1.2, z: 0 },
  direction: { x: 0, y: -1, z: 0 },
  up: { x: 0, y: 0, z: -1 },
  scale: 50,
  depth: null,
  overhead: null,
  spaces: [],
  elementKinds: [],
  dimensions: [],
  annotations: [],
  style: drawingStyle(),
  ...overrides,
});
