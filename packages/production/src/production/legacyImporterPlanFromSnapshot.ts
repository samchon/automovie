import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import type { legacyImporterLegacySnapshot } from "./legacyImporterLegacySnapshot";
import { legacyImporterCreatePlan } from "./legacyImporterCreatePlan";
import { legacyImporterWithLegacyProject } from "./legacyImporterWithLegacyProject";

/**
 * Open one captured temporary legacy store and compose the draft import plan from its validated slate plus stored prop and actor counts. Resident project bytes are never opened for initialization here.
 *
 * @evidence contracts/common.md#principled-implementation The snapshot clone is validated by the existing v1 project API, then its actual slate and context populations supply plan fields and reconstruction warnings.
 * @evidence contracts/common.md#clear-and-simple-design Connects snapshot validation to plan composition without owning publication or rollback effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No live resident store is initialized to make a plan pass, and unavailable authoring source remains a reconstruction todo rather than fabricated recovered code.
 * @evidence contracts/common.md#meaningful-documentation States the temporary store, validated inputs and draft nature of the produced plan.
 * @evidence contracts/performance.md#efficient-algorithms Costs include cloning B bytes, opening/reading the v1 store and constructing S shot drafts plus file inventory; those owning operations account for their full work.
 * @evidence contracts/performance.md#reuse-equivalent-work One temporary project supplies slate and prop/actor counts within this invocation; repeated calls create independent clones and reread authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The clone owner removes its temporary directory before returning and on failure; only plan data escapes, with no retained project handle or detached task.
 */
export const legacyImporterPlanFromSnapshot: (snapshot: legacyImporterLegacySnapshot) => IAutoMovieLegacyImportPlan = (
  snapshot: legacyImporterLegacySnapshot,
): IAutoMovieLegacyImportPlan =>
  legacyImporterWithLegacyProject(snapshot, (legacy: Parameters<Parameters<typeof legacyImporterWithLegacyProject>[1]>[0]): IAutoMovieLegacyImportPlan =>
    legacyImporterCreatePlan(snapshot, {
      slate: legacy.writableSlate(),
      props: legacy.storedProps().length,
      actors: legacy.storedActors().length,
    }),
  );
