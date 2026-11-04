import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanReference } from "../../../internal/reference/bodies/HumanReference";

/**
 * Every anatomy observer passes on the real reference bodies, so a row that
 * fails a generated person blames the person and not the observer.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads each private reference body present in the checkout (f1, f2, m1, m2 under the ignored `test/.shots`) as a subject and runs every region's anatomy audit on it except the pose audit, which needs a rig the reference lacks: the same site locators, cuts and profiles that judge the generated people. It fails with every row a real body misses, by reference, region and site. It catches an observer that locates a site wrongly or breaks on a real skin, a limit that rejects a real human, and an input measured by another definition than its site, since each reference's inputs describe that very body. A row a reference passes is a row a correct body can pass.
 * @evidence contracts/testing.md#independent-expectations The expectation is the observer's own row against a body that is human by construction of the data: captured skins of four real-proportioned people at their own public inputs. No generated value and no construction constant enters the expectation. Oracle limits: the reference borrows the generated person's chain labels (nearest generated vertex) to tell parts apart and its rig's joint centres to locate sites, so a joint the construction misplaces moves a site with it; the references stand in their captured pose, so a row defined at the anatomical neutral reads the relaxed pose; rows a subject declares as construction contracts (such as mirror symmetry of one construction) do not bind a real body.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, at different statures and builds, cover both sexes of every row. The generated people are judged by the `test_human_anatomy_*` tests with the same observers; this test owns only whether the observers and limits hold on real bodies. Without private references the test prints that it did not run and returns, since the data cannot ship.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_anatomy`, reading local files and generating the four people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_reference_anatomy(): void {
  const ids: string[] = HumanReference.available();
  if (ids.length === 0) {
    console.log("test_human_reference_anatomy: no private reference body in test/.shots; the observers were not checked on real bodies");
    return;
  }
  const failed: string[] = [];
  for (const id of ids)
    for (const [region, audit] of Object.entries(HumanAnatomyAudit.REGIONS)) {
      if (region === "pose") continue;
      try {
        for (const row of audit(HumanReference.subject(id)))
          if (!HumanAnatomyAudit.passes(row))
            failed.push(
              `${id.padEnd(3)} ${region.padEnd(6)} ${row.site}: ${row.value.toFixed(2)} ${row.unit} outside ${row.low.toFixed(2)} to ${row.high.toFixed(2)}`,
            );
      } catch (error) {
        failed.push(`${id.padEnd(3)} ${region.padEnd(6)} could not be measured: ${(error as Error).message}`);
      }
    }
  if (failed.length !== 0)
    throw new Error(`${failed.length} rows miss their expectation on a real reference body:\n${failed.sort((a: string, b: string): number => a.localeCompare(b)).join("\n")}`);
}
