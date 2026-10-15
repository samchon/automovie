import type { IAutoMovieVector3 } from "@automovie/interface";
import { TempleView } from "./TempleView";

export interface TempleObservation {
  id: string;
  group: "exterior" | "space" | "site" | "junction" | "section" | "reference";
  space: string | null;
  role: string;
  label: string;
  position: IAutoMovieVector3 | null;
  target: IAutoMovieVector3 | null;
  note: string | null;
  view?: TempleView;
}
