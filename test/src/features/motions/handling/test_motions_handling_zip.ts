import type { IAutoMovieAffordance } from "@automovie/interface";
import { HumanRefusal, zipSites } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/** A zipper tab has two opposing sites, a brace and an independent slider. */
export function test_motions_handling_zip(): void {
  const origin = { x: 0, y: 0, z: 0 };
  const tab: IAutoMovieAffordance = {
    ...testAffordance("tab", "slider", origin),
    travel: 0.18,
    reverse: 0.02,
    parts: ["pull"],
  };
  const thumb: IAutoMovieAffordance = {
    ...testAffordance("top", "surface", origin),
    rides: tab.id,
  };
  const index: IAutoMovieAffordance = {
    ...testAffordance("bottom", "surface", { ...origin, y: -0.01 }),
    rides: tab.id,
  };
  const brace: IAutoMovieAffordance = testAffordance("brace", "surface", origin);
  const lip: IAutoMovieAffordance = {
    ...testAffordance("lip", "hinge", origin),
    follows: { id: tab.id, ratio: 1 },
    parts: ["teeth"],
  };
  const model = {
    fixed: true,
    articulate: (): { affordances: [] } => ({ affordances: [] }),
    affordances: [thumb, index, brace, tab, lip],
  };
  const sites = { pouch: "pouch", thumb: thumb.id, index: index.id, brace: brace.id };
  assert.deepEqual(zipSites(sites, model), { thumb, index, brace, slider: tab });
  for (const bad of [
    { ...sites, brace: "unknown" },
    { ...sites, brace: thumb.id },
    { ...sites, index: thumb.id },
  ])
    assert.throws(() => zipSites(bad, model), refused("independent tab slider"));

  zipSites.admitStop(sites.pouch, tab, -0.02);
  zipSites.admitStop(sites.pouch, tab, 0.18);
  for (const finish of [-0.021, 0.181])
    assert.throws(
      () => zipSites.admitStop(sites.pouch, tab, finish),
      refused("zipper stop"),
    );
}

/** Match the missing admission requirement on the affected pouch. */
function refused(reason: string): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof HumanRefusal &&
    error.axis === "pouch" &&
    error.value === "pouch" &&
    error.reason.includes(reason);
}
