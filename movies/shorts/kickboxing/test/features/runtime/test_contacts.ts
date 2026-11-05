import assert from "node:assert/strict";

import { BoutScript } from "../../../src/bout/BoutScript";
import { FilmEvents } from "../../../src/film/FilmEvents";
import { FilmRuntime } from "../../../src/film/FilmRuntime";

/**
 * Every planned contact of the screenplay is realized by displayed geometry, with no air gap: clean hits sink into the receiver's skin and guard or shin contacts press into what they meet. The fall reaches the canvas hip first.
 *
 * @evidence contracts/testing.md#observable-behavior Runs FilmRuntime.prepare, which measures each planned contact at its film second from the solved FK, and the mat arrivals of B's fall.
 * @evidence contracts/testing.md#independent-cases The planned set comes from the screenplay table (every answer except slips and weaves touches), so the expected receipt count is independent of the runtime; the screenplay orders the fall right hip, then shoulder, both inside the second after the 150 s kick.
 */
export async function test_contacts(): Promise<void> {
  const runtime: FilmRuntime = new FilmRuntime();
  await runtime.prepare();
  const planned: number =
    BoutScript.actions.filter(
      (action: BoutScript.Action): boolean =>
        FilmEvents.relation(action) !== null,
    ).length + 1;
  const report = runtime.inspect() as {
    refusedContacts: { actionId: string; gap: number }[];
  };
  assert.deepEqual(report.refusedContacts, []);
  assert.equal(runtime.contacts().length, planned);
  const mats = runtime.floorContacts();
  const hip = mats.find((m) => m.bodyPart === "hip");
  const shoulder = mats.find((m) => m.bodyPart === "shoulder");
  assert.ok(hip && shoulder, "both mat arrivals measured");
  assert.ok(
    hip.seconds > 150 &&
      hip.seconds <= shoulder.seconds &&
      shoulder.seconds < 152,
    `hip ${hip.seconds} shoulder ${shoulder.seconds}`,
  );
}
