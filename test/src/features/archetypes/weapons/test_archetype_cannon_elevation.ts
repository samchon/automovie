import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  createCannon,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** An inch, metres. */
const IN: number = 0.0254;

/** The 6-pdr's base ring behind its trunnions: 60 in from the base ring's rear to the muzzle's face, less the 34.91 in from the trunnions to the face (1862 Ordnance Manual, p. 19). */
const BEHIND: number = (60 - 34.91) * IN;

/** The base ring's radius: half its 10.3 in diameter (same table). */
const RING: number = 10.3 * 0.5 * IN;

/** The screw's pitch: ten threads to the inch, Mordecai's mountain howitzer screw, "finished in the same manner as the screw for a field carriage" (1849, borrowed, provisional). */
const PITCH: number = IN / 10;

/**
 * Turning a field gun's screw drives its elevation and translates the handle with the screw's head; naming the desired elevation drives the same reversible coupling.
 *
 * Scenarios:
 * 1. At every whole degree from 8 down to 12 up, the screw has sunk by the base ring's own fall at that degree, worked here from the manual's tube (the ring 25.09 in behind the trunnions and 5.15 in in radius): its distance behind times the sine, less its radius times one less the cosine.
 * 2. At every such degree, the handle has turned 360 degrees for every tenth of an inch the screw has sunk.
 * 3. The screw's head takes the rotating ring reference point's vertical height, within 1e-6 m, at every whole degree; the handle translates with it. This checks vertical coupling, not contact along the fixed screw axis with the ring's unread breadth.
 * 4. As the screw turns from its reverse to its travel, the muzzle's direction rises monotonically, and the handle's travel and reverse are its turns at the elevation's ends, 12 up and 8 down.
 * 5. Every pose from 8 down to 12 up is an admitted model, either input gives the same muzzle and travels, and setting both inputs is refused. The launch consumer accepts the screw directly.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the screw at every degree of the gun's field of fire and reads the elevation, translation, handle frame and muzzle; compares the existing elevation input and launches from the screw. A reversed coupling, a stationary handle, a changed launch or duplicate inputs admitted is caught.
 * @evidence contracts/development/testing.md#independent-expectations The ring's fall is worked here from the 1862 manual's tube dimensions and the rotation about the trunnions; the pitch is Mordecai's, restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Depression and elevation, every whole degree between, both ends, both input directions, the launch consumer and refused duplicate inputs; non-invertible generic rules belong to contract_reversible.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_cannon_elevation(): void {
  const findings: string[] = [];
  const gun: AutoMovieArchetype<
    createCannon.Affordance,
    createCannon.Dimension
  > = createCannon({ kind: "fieldGun" });
  const sinking: (degrees: number) => number = (degrees: number): number => {
    const turn: number = (degrees * Math.PI) / 180;
    return BEHIND * Math.sin(turn) - RING * (1 - Math.cos(turn));
  };
  const top0: number = archetypeExtent(gun, "y", ["screw"]).high;
  let last: number = -Infinity;
  for (let degrees: number = -8; degrees <= 12; degrees++) {
    // Exercise the advertised endpoints exactly; their physical values are
    // checked independently below, without assuming identical roundoff order.
    const screw: number =
      degrees === -8
        ? -gun.affordance("screw").reverse!
        : degrees === 12
          ? gun.affordance("screw").travel!
          : (sinking(degrees) / PITCH) * 360;
    const posed: AutoMovieArchetype<
      createCannon.Affordance,
      createCannon.Dimension
    > = gun.articulate({ screw });
    const byElevation: AutoMovieArchetype<
      createCannon.Affordance,
      createCannon.Dimension
    > = gun.articulate({ elevation: degrees });
    if (
      !(
        Math.abs(posed.travel("elevation") - degrees) <= 1e-9 &&
        Math.abs(byElevation.travel("screw") - screw) <= 1e-6
      )
    )
      findings.push(
        `at ${degrees} the two inputs do not describe one coupling`,
      );
    const launch: createCannon.ILaunch = createCannon.launch(gun, { screw });
    if (
      !(
        Math.abs(launch.direction.y - Math.sin((degrees * Math.PI) / 180)) <=
        1e-9
      )
    )
      findings.push(
        `at ${degrees} the screw-driven launch has the wrong direction`,
      );
    const sunk: number = posed.travel("screwRise");
    const turned: number = posed.travel("screw");
    if (!(Math.abs(sunk - sinking(degrees)) <= 1e-9))
      findings.push(
        `at ${degrees} the screw sinks ${sunk}, not ${sinking(degrees)}`,
      );
    if (!(Math.abs(turned - (sinking(degrees) / PITCH) * 360) <= 1e-6))
      findings.push(`at ${degrees} the handle turns ${turned} degrees`);
    const top: number = archetypeExtent(posed, "y", ["screw"]).high;
    if (!(Math.abs(top0 - top - sinking(degrees)) <= 1e-6))
      findings.push(
        `at ${degrees} the screw's head misses the ring reference height`,
      );
    if (
      !(
        Math.abs(
          posed.affordance("screw").frame.translation.y -
            (gun.affordance("screw").frame.translation.y - sinking(degrees)),
        ) <= 1e-9
      )
    )
      findings.push(`at ${degrees} the handle does not ride the screw's head`);
    const rise: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      posed.affordance("muzzle").frame,
      "y",
    );
    if (!(rise.y > last))
      findings.push(`at ${degrees} the muzzle does not rise with the screw`);
    last = rise.y;
    if (!validateModel({ model: posed }).success)
      findings.push(`the pose at ${degrees} degrees is refused`);
  }
  const handle: ReturnType<typeof gun.affordance> = gun.affordance("screw");
  if (
    !(
      Math.abs(handle.travel! - (sinking(12) / PITCH) * 360) <= 1e-6 &&
      Math.abs(handle.reverse! + (sinking(-8) / PITCH) * 360) <= 1e-6
    ) ||
    handle.follows !== undefined ||
    gun.affordance("elevation").follows?.id !== "screw"
  )
    findings.push("the handle's ends are not its turns at 12 up and 8 down");
  let refused: unknown = null;
  try {
    gun.articulate({ screw: 0, elevation: 1 });
  } catch (error) {
    refused = error;
  }
  if (!(refused instanceof AutoMovieArchetypeRefusal))
    findings.push("two inputs drive the same screw");
  TestValidator.equals(
    "the screw drives the elevation and preserves desired-elevation inputs",
    findings,
    [],
  );
}
