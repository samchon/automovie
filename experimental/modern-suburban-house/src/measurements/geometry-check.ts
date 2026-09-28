import { auditHouseGeometry } from "./space-audit";

const result = auditHouseGeometry();
const badParts = result.parts.filter((part) =>
  part.degenerate !== 0 || part.nonManifoldEdges !== 0 || part.nonFinite !== 0,
);
const failures =
  badParts.length + result.observationFailures.length + result.roofOverlap.overlaps.length;
console.log(JSON.stringify({
  parts: result.parts.length,
  observations: result.observationCount,
  observationFailures: result.observationFailures.length,
  roofPairs: result.roofOverlap.pairsChecked,
  roofSamples: result.roofOverlap.samplesChecked,
  roofOverlaps: result.roofOverlap.overlaps.length,
  invalidParts: badParts.map((part) => part.id),
}));
if (failures !== 0) process.exitCode = 1;
