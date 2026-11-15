import {
  type Archetype,
  ArchetypeRefusal,
  type ArchetypeTrack,
  createCannon,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A pound, kilograms. */
const LB: number = 0.45359237;

/** A foot, metres. */
const FT: number = 0.3048;

/**
 * A field gun runs back on firing by its recoil track and comes to rest at its run.
 *
 * Scenarios, at four seeds:
 * 1. The track holds 0 before the shot and the gun's `recoil` after its end, rises monotonically between, and stops: its rate at the end is zero.
 * 2. It starts at the speed the 6.1 lb shot's momentum at 1439 ft/s gives the gun's mass, and lasts twice the run over that speed.
 * 3. The same shot second gives the same track; a later shot second shifts it whole.
 * 4. At the run's end the whole carriage and tube stand the run behind where they stood, and the pose is an admitted model.
 * 5. A naval gun, which has no recoil slider, is refused at `kind`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the track over its span and poses the gun at its end; a track that does not stop at the run, moves backward, depends on anything but the shot's second, or a gun that does not move with it is caught.
 * @evidence contracts/development/testing.md#independent-expectations The shot's mass and speed are the 1861 manual's, written here; the start speed and duration are worked from them by momentum and even slowing.
 * @evidence contracts/development/testing.md#distinguishing-cases Four seeds across the recoil band, two shot seconds and a refused kind.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_cannon_recoil(): void {
  const findings: string[] = [];
  for (const seed of [0, 3, 7, 12]) {
    const gun: Archetype<createCannon.Affordance, createCannon.Dimension> =
      createCannon({ kind: "fieldGun" }, seed);
    const run: number = gun.dimensions.recoil!;
    const track: ArchetypeTrack.ITrack<createCannon.Affordance> =
      createCannon.recoil(gun, 2);
    const speed: number = (6.1 * LB * 1439 * FT) / gun.dimensions.mass!;
    if (Math.abs(track.end - track.start - (2 * run) / speed) > 1e-9)
      findings.push(`@${seed}: the recoil lasts ${track.end - track.start} s`);
    if (
      track.travel(1) !== 0 ||
      Math.abs(track.travel(track.end + 1) - run) > 1e-9
    )
      findings.push(`@${seed}: the track does not hold its ends`);
    const step: number = 1e-6;
    if (
      Math.abs(
        (track.travel(track.start + step) - track.travel(track.start)) / step -
          speed,
      ) > 1e-3
    )
      findings.push(`@${seed}: it does not start at the momentum's speed`);
    if (
      Math.abs(
        (track.travel(track.end) - track.travel(track.end - step)) / step,
      ) > 1e-3
    )
      findings.push(`@${seed}: it does not stop`);
    let last: number = -1;
    for (let k: number = 0; k <= 100; k++) {
      const x: number = track.travel(
        track.start + ((track.end - track.start) * k) / 100,
      );
      if (x < last - 1e-12)
        findings.push(`@${seed}: the run goes forward at step ${k}`);
      last = x;
    }
    const again: ArchetypeTrack.ITrack<createCannon.Affordance> =
      createCannon.recoil(gun, 2);
    const later: ArchetypeTrack.ITrack<createCannon.Affordance> =
      createCannon.recoil(gun, 5);
    for (const t of [2, 2.5, 3, track.end])
      if (
        again.travel(t) !== track.travel(t) ||
        Math.abs(later.travel(t + 3) - track.travel(t)) > 1e-12
      )
        findings.push(`@${seed}: the track is not the shot second's alone`);
    const back: Archetype<createCannon.Affordance, createCannon.Dimension> =
      gun.articulate({ recoil: run });
    for (const part of ["trail", "chase"]) {
      const moved: number =
        archetypeExtent(gun, "z", [part]).low -
        archetypeExtent(back, "z", [part]).low;
      if (Math.abs(moved - run) > 1e-6)
        findings.push(`@${seed}: the ${part} runs back ${moved} m, not ${run}`);
    }
    if (!validateModel({ model: back }).success)
      findings.push(`@${seed}: the recoiled pose is refused`);
  }
  let refused: unknown = null;
  try {
    createCannon.recoil(createCannon({ kind: "navalGun" }, 1), 0);
  } catch (error) {
    refused = error;
  }
  if (!(refused instanceof ArchetypeRefusal && refused.axis === "kind"))
    findings.push("a naval gun's recoil is not refused");
  TestValidator.equals(
    "a field gun recoils by its track and comes to rest",
    findings,
    [],
  );
}
