import type { IAutoMovieVector3 } from "@automovie/interface";


export type Observation = {
  id: string;
  space: string;
  role: string;
  cameraSpace?: string;
  pose: { position: IAutoMovieVector3; target: IAutoMovieVector3; } | null;
  reason: string;
  section?: { height: number; remove: "above" | "below"; };
  fov: number;
};
