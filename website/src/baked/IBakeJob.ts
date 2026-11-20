import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { IScene } from "../scenes/structures/IScene";

/** One take the build computes ahead of the visitor, and how its still is drawn. */
export interface IBakeJob {
  /** Whether it is a scene's first take or a motion tried alone. */
  kind: "scene" | "motion";

  /** The scene's id or the motion's name, which names its files. */
  id: string;

  /** What is performed. */
  composition: IPlaygroundComposition;

  /** The view the still is drawn from. */
  view: IScene.ICamera["view"];

  /** Seconds before which the still draws nothing, such as a trial's opening stand. */
  from: number;
}
