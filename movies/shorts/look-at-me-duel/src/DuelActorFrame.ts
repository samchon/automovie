import type { AutoMovieHumanGrounding, AutoMovieHumanSkeleton, IAutoMovieHumanPose } from "@automovie/human";

import type { createDuelFootFitter } from "./createDuelFootFitter";
import type { fitDuelLeftContact } from "./fitDuelLeftContact";
import type { solveDuelWandAim } from "./solveDuelWandAim";
import type { DuelContactPoint } from "./DuelContactPoint";

/**
 * The actual fixed actor sample consumed by playback and contact diagnostics.
 * @evidence contracts/common.md#implementation-and-ownership Each pose/root/FK and solver request is retained from actual preparation. Contacts extend earlier samples without rewriting their bytes or approval. Body bounds include current carried meshes and support the actual cap-clearance check.
 * @evidence contracts/common.md#authoring-interface Positions are world metres, yaw radians and angles clinical degrees. Output contains posed FK/clamps, not duplicated immutable exterior geometry. A contact's mixed approach target error differs from its actual surface separation until weight1. No field alone grants visible or continuous-motion acceptance.
 */
export interface DuelActorFrame {
  index: number;
  lowerSeedFrame: number | null;
  heelPlantEntryFrame: number | null;
  nominalRoot: [number, number, number];
  root: [number, number, number];
  yaw: number;
  pose: IAutoMovieHumanPose;
  output: Pick<AutoMovieHumanSkeleton.IOutput, "posed" | "clamped">;
  supportStatus: AutoMovieHumanGrounding.IResult["status"];
  supportError: number;
  floorMinimum: number;
  heelMinimum: { left: number; right: number };
  aimError: number;
  gripError: number;
  wandTip: [number, number, number];
  wrist: [number, number, number];
  requestedWrist: [number, number, number];
  requestedAim: [number, number, number];
  palm: [number, number, number] | null;
  gripTarget: [number, number, number] | null;
  supportSolve: Omit<ReturnType<ReturnType<typeof createDuelFootFitter>["fit"]>, "output">;
  wandSolve: { seed: IAutoMovieHumanPose; result: Omit<ReturnType<typeof solveDuelWandAim>, "output"> };
  bodyBounds?: { min: [number, number, number]; max: [number, number, number] };
  contacts?: { kind: string; stage: "initial-touch" | "final"; weight: number; error: number; separation: number; actual: [number, number, number]; target: [number, number, number]; peer?: { role: "Carina" | "Harry"; point: DuelContactPoint; world: [number, number, number] }; fit: { input: ReturnType<typeof fitDuelLeftContact>["input"]; result: Omit<ReturnType<typeof fitDuelLeftContact>["result"], "output"> } }[];
}
