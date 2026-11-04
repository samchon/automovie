import type { AutoMovieLoftContract, IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The figure's head stands on its trunk: the head lane's subtree, merged onto
 * the trunk inside the body lane's one realization, publishes the head mass's
 * chain and a face of it in the realized body, and the realization records
 * no premise broken by the head's join onto the trunk.
 *
 * Scenarios:
 * 1. f1: the published chains hold `head.mass`, a realized body names it as a face, and no diagnostic of the tree names the head's join onto the trunk (`blend.head.mass.trunk`).
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the calibration the figure publishes (`HumanPeople.person(...).body`): its chains, its realized bodies' faces and its diagnostics. It catches a head left out of the figure, which a viewer shows as eyes over an open trunk ring.
 * @evidence contracts/testing.md#independent-expectations A figure has a head: the head mass's chain is published and drawn.
 * @evidence contracts/testing.md#distinguishing-cases The trunk's own faces are read by the body lane's tests; this reads the head's place in that body.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_head_on_trunk`; it builds one person in process and starts no host, browser or GPU.
 */
export function test_human_head_on_trunk(): void {
  const failures: string[] = [];
  const body: IAutoMovieHumanBodyCalibration = HumanPeople.person("f1").body;
  if (!body.chains.some((c: IAutoMovieLoftChain): boolean => c.name === "head.mass")) failures.push("no published chain `head.mass`");
  if (!(body.bodies ?? []).some((b: { faces: { chain: string }[] }): boolean => b.faces.some((f: { chain: string }): boolean => f.chain === "head.mass"))) failures.push("no realized body face `head.mass`");
  const head: AutoMovieLoftContract.IDiagnostic[] = (body.diagnostics ?? []).filter((d: AutoMovieLoftContract.IDiagnostic): boolean => /head|nose|lip|orbit|ear|auricle|sulcus|philtrum/.test(d.producer));
  for (const d of head.slice(0, 20)) failures.push(`${d.producer}: ${d.contract}: ${d.detail.slice(0, 240)}`);
  if (failures.length !== 0) throw new Error(`human_head_on_trunk:\n${failures.join("\n")}`);
}
