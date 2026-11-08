import assert from "node:assert/strict";

import { resolveSharedContact } from "../../../src/actors/resolveSharedContact";

/**
 * Make measured contact extent own the shared stop, not an assumed timestamp.
 *
 * @evidence contracts/testing.md#observable-behavior Supplies an independent linear exterior-gap observer to the real bounded event resolver. It must first collect the entire coarse course, resolve the first2mm bracket, return an exterior admitted contact and derive the event time from its measured extent. No bracket and a non-forehead hit refuse.
 * @evidence contracts/testing.md#independent-cases Uses gap=1-2progress, so the literal threshold progress0.499 is known without copying bisection output. The pure observer is explicitly not Human geometry; actual scene calibration is separately measured through original head triangles and public poses.
 */
export async function test_shared_contact_event(): Promise<void> {
  const seen: number[] = [];

  /** Independent hypothetical gap law for the event algorithm alone. */
  async function sample(progress: number): Promise<{ gap: number; distance: number; admitted: boolean; forehead: boolean; alignment: number; first: number[]; second: number[]; triangle: number }> {
    seen.push(progress); const gap: number = 1 - 2 * progress;
    return { gap, distance: Math.abs(gap), admitted: gap >= 0 && gap <= 0.002, forehead: true, alignment: -1, first: [0, 0, 0], second: [gap, 0, 0], triangle: 1 };
  }
  const event: Awaited<ReturnType<typeof resolveSharedContact>> = await resolveSharedContact(sample);
  assert.deepEqual(seen.slice(0, 9), [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]);
  assert.ok(Math.abs(event.progress - 0.499) < 2e-6);
  const phase: number = (event.time - 39) / 3;
  assert.ok(Math.abs(phase * phase * (3 - 2 * phase) - event.progress) < 1e-9);
  await assert.rejects(resolveSharedContact(async (progress: number): ReturnType<typeof sample> => ({ ...(await sample(progress)), gap: 1, distance: 1, admitted: false })));
  await assert.rejects(resolveSharedContact(async (progress: number): ReturnType<typeof sample> => ({ ...(await sample(progress)), forehead: false, admitted: false })));
}
