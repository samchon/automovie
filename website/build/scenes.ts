// Check the planned scenes the everyday, work and passenger takes publish.
//
// Plays every take of those scenes in Node the way the take worker does, then
// reads their displayed contacts, props and refusals: the office switch and
// lamp, Fall and Rise's recovery and hip hold, Farewell's kisses and hand
// meetings, the Tourists camera, the screwdriver's tip, the low five, the
// vehicles' seats, controls and treads, and the playground's cue tracks. No
// browser is involved, so this runs anywhere the packages build; CI runs it
// after the smoke test.
import { SCENES_ASSISTANCE } from "../src/scenes/data/SCENES_ASSISTANCE";
import { SCENES_HOUSEHOLD } from "../src/scenes/data/SCENES_HOUSEHOLD";
import { SCENES_VEHICLES } from "../src/scenes/data/SCENES_VEHICLES";
import { SCENES_WARDROBE } from "../src/scenes/data/SCENES_WARDROBE";
import type { IScene } from "../src/scenes/structures/IScene";
import { checkDrivingScrew } from "./checkDrivingScrew";
import { checkEverydayScenes } from "./checkEverydayScenes";
import { checkFarewellScene } from "./checkFarewellScene";
import { checkPlaygroundCues } from "./checkPlaygroundCues";
import { checkPlaygroundScheduleCuts } from "./checkPlaygroundScheduleCuts";
import { checkSceneTakes } from "./checkSceneTakes";
import { checkTourists } from "./checkTourists";
import { checkVehicleScenes } from "./checkVehicleScenes";
import { checkVictoryLap } from "./checkVictoryLap";

/** The scenes whose every take must play: the families these takes added and the scenes they repaired or restored. */
const PLAYED: readonly string[] = [
  ...[
    ...SCENES_ASSISTANCE,
    ...SCENES_WARDROBE,
    ...SCENES_HOUSEHOLD,
    ...SCENES_VEHICLES,
  ].map((scene: IScene): string => scene.id),
  "office",
  "fall-and-rise",
  "farewell",
  "tourists",
  "charades",
  "driving-a-screw",
  "walk-and-talk",
  "snap-and-flinch",
  "schoolyard-games",
  "toasts",
  "victory-lap",
  "victory-lap-low-five",
];

/** One named check that throws on failure. */
interface ISceneCheck {
  /** What it checks, for the report. */
  name: string;

  /** Runs the check. */
  run: () => void;
}

/** Each check; all run, so one failure does not hide another. */
const CHECKS: readonly ISceneCheck[] = [
  { name: "every take", run: (): void => checkSceneTakes(PLAYED) },
  { name: "office and Fall and Rise", run: checkEverydayScenes },
  { name: "Farewell", run: checkFarewellScene },
  { name: "Tourists", run: checkTourists },
  { name: "Driving a Screw", run: checkDrivingScrew },
  { name: "Victory lap with a low five", run: checkVictoryLap },
  { name: "vehicles", run: checkVehicleScenes },
  { name: "playground cue tracks", run: checkPlaygroundCues },
  { name: "playground schedule cuts", run: checkPlaygroundScheduleCuts },
];

let failed: number = 0;
for (const { name, run } of CHECKS) {
  try {
    run();
    console.log(`pass ${name}`);
  } catch (error: unknown) {
    ++failed;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}
if (failed !== 0) process.exit(1);
console.log(`${PLAYED.length} scenes play every take; their contacts hold.`);
