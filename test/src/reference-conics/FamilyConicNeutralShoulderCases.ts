import { buildHumanNeutralCapture } from "@automovie/human/capture";

import { FamilyConicNeutralCases } from "./FamilyConicNeutralCases";

/** Publish the native shoulder atlas and both boundary readings for one case. */
function main(): void {
  const id: string = process.argv[2] ?? "baseline";
  const row: FamilyConicNeutralCases.ICase | undefined =
    FamilyConicNeutralCases.CASES.find((entry): boolean => entry.id === id);
  if (row === undefined) throw new Error(`Unknown neutral shoulder case ${id}`);
  const began: number = performance.now();
  const assembly =
    row.field === "baseline"
      ? buildHumanNeutralCapture.shoulders()
      : buildHumanNeutralCapture.shoulders(
          FamilyConicNeutralCases.prepare()(row),
        );
  console.log(
    JSON.stringify({ id, milliseconds: performance.now() - began, assembly }),
  );
  if (assembly.diagnostics.length !== 0 || assembly.guides.length !== 2)
    process.exitCode = 1;
}

main();
