import { checkArchetypeAliases } from "./checkArchetypeAliases";
import { checkSceneTracks } from "./checkSceneTracks";
import { checkSnapshotCamera } from "./checkSnapshotCamera";

checkArchetypeAliases();
console.log(
  "Checked archetype aliases, seeded gaits and props in saved compositions.",
);
checkSnapshotCamera();
console.log("Checked both camera contacts during both Snapshot photographs.");
checkSceneTracks();
console.log("Checked playback of compact and high-altitude takes.");
