import { checkArchetypeAliases } from "./checkArchetypeAliases";
import { checkSnapshotCamera } from "./checkSnapshotCamera";

checkArchetypeAliases();
console.log(
  "Checked archetype aliases, seeded gaits and saved Playground props.",
);
checkSnapshotCamera();
console.log("Checked both camera contacts at Snapshot's exposure.");
