import { type AutoMovieArchetype, createCannon } from "@automovie/archetypes";
import { Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** An inch and a foot, metres, as the manuals state their figures. */
const IN: number = 0.0254;

/** A foot, metres. */
const FT: number = 12 * IN;

/**
 * The field gun is served as the 1861 Ordnance Manual and Gibbon describe it.
 *
 * Scenarios:
 * 1. Its muzzle velocity is the manual's pendulum figure for the 6-pdr. at the 1.25 lb charge, 1439 ft/s; its shot is 3.58 in; its recoil lies in Gibbon's 1.5 to 2 yards, both ends reached over seeds, and the band is marked provisional.
 * 2. The `muzzle`, the `vent`, the `primer`, the `limber` and the `axle` are sockets; the primer's eye stands the friction primer's 1.75 in long tube out along the vent from its orifice.
 * 3. The `lanyard`'s toggle stands its 12 ft straight back from the primer's eye at the eye's height, a slider drawn back by the friction wire's 3.4 in, toggle 0.75 in across and 4 in long.
 * 4. The `handspike` is a handle whose length is the read 53 in's share behind the trail; the `limber` socket faces down at the trail's end; each wheel's handle stands at its wheel's top and rides its spin.
 * 5. At the elevation's ends, 12 degrees up and 8 down, and with the lanyard drawn, the gun is an admitted model, and the primer rides the tube.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the gun, reads its dimensions, bands and contacts, and articulates its elevation and lanyard; a figure off the manual's, a contact of the wrong kind or place, or a refused pose is caught.
 * @evidence contracts/development/testing.md#independent-expectations The figures are written here from the manual's and Gibbon's pages; the places are worked from the vent's own frame and the read lengths.
 * @evidence contracts/development/testing.md#distinguishing-cases The recoil band's two ends over 200 seeds, the elevation's two ends and the lanyard drawn.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_cannon_service(): void {
  const findings: string[] = [];
  const close: (a: number, b: number, tolerance?: number) => boolean = (
    a: number,
    b: number,
    tolerance: number = 1e-9,
  ): boolean => Math.abs(a - b) <= tolerance;
  const gun: AutoMovieArchetype<
    createCannon.Affordance,
    createCannon.Dimension
  > = createCannon({ kind: "fieldGun" }, 1);
  const d: Readonly<Partial<Record<createCannon.Dimension, number>>> =
    gun.dimensions;
  if (!close(d.muzzleVelocity!, 1439 * FT))
    findings.push(`muzzle velocity ${d.muzzleVelocity}, not 1439 ft/s`);
  if (!close(d.ball!, 3.58 * IN)) findings.push(`shot ${d.ball}, not 3.58 in`);
  let least: number = Infinity;
  let most: number = -Infinity;
  for (let seed: number = 0; seed < 200; seed++) {
    const recoil: number = createCannon({ kind: "fieldGun" }, seed).dimensions
      .recoil!;
    least = Math.min(least, recoil);
    most = Math.max(most, recoil);
    if (!(recoil >= 4.5 * FT - 1e-9 && recoil <= 6 * FT + 1e-9))
      findings.push(`seed ${seed}: recoil ${recoil} outside 1.5 to 2 yards`);
  }
  if (!(least < 4.75 * FT && most > 5.75 * FT))
    findings.push(`the recoil spans only ${least} to ${most}`);
  if (
    createCannon({ kind: "fieldGun" }).provenance.bands.recoil?.provisional !==
    true
  )
    findings.push("the recoil band is not marked provisional");

  for (const id of ["muzzle", "vent", "primer", "limber", "axle"] as const)
    if (gun.affordance(id).kind !== "socket")
      findings.push(`${id} is a ${gun.affordance(id).kind}, not a socket`);
  const vent: IAutoMovieVector3 = gun.affordance("vent").frame.translation;
  const primer: IAutoMovieVector3 = gun.affordance("primer").frame.translation;
  const out: IAutoMovieVector3 = Vector3.subtract(primer, vent);
  if (!close(Vector3.length(out), 1.75 * IN, 1e-9))
    findings.push(
      `the primer's eye stands ${Vector3.length(out)} m out of the vent, not 1.75 in`,
    );

  const lanyard: IAutoMovieAffordance = gun.affordance("lanyard");
  const toggle: IAutoMovieVector3 = lanyard.frame.translation;
  if (
    lanyard.kind !== "slider" ||
    !close(lanyard.travel!, 3.4 * IN) ||
    !close(lanyard.aperture!, 0.75 * IN) ||
    !close(lanyard.length!, 4 * IN)
  )
    findings.push(
      `the lanyard is a ${lanyard.kind} of travel ${lanyard.travel}, aperture ${lanyard.aperture}, length ${lanyard.length}`,
    );
  if (
    !close(toggle.y, primer.y) ||
    !close(primer.z - toggle.z, 12 * FT) ||
    !close(toggle.x, primer.x)
  )
    findings.push(
      `the toggle stands at ${JSON.stringify(toggle)}, not 12 ft behind the primer at ${JSON.stringify(primer)}`,
    );

  const handspike: IAutoMovieAffordance = gun.affordance("handspike");
  if (
    handspike.kind !== "handle" ||
    !(handspike.length! > 0 && handspike.length! <= 53 * IN + 1e-9)
  )
    findings.push(
      `the handspike is a ${handspike.kind} of length ${handspike.length}`,
    );
  const limber: IAutoMovieVector3 = gun.affordance("limber").frame.translation;
  if (!close(limber.y, 0) || !(limber.z < 0))
    findings.push(`the limber's seat stands at ${JSON.stringify(limber)}`);
  for (const [id, spin] of [
    ["leftWheel", "leftSpin"],
    ["rightWheel", "rightSpin"],
  ] as const) {
    const wheel: IAutoMovieAffordance = gun.affordance(id);
    if (wheel.kind !== "handle" || wheel.rides !== spin)
      findings.push(`${id} does not ride ${spin}`);
    if (!close(wheel.frame.translation.y, d.wheelDiameter!))
      findings.push(`${id} is not at its wheel's top`);
  }

  for (const [label, state] of [
    ["raised", { elevation: 12 }],
    ["lowered", { elevation: -8 }],
    ["fired", { lanyard: lanyard.travel! }],
  ] as const) {
    const posed: AutoMovieArchetype<
      createCannon.Affordance,
      createCannon.Dimension
    > = gun.articulate(state);
    if (!validateModel({ model: posed }).success)
      findings.push(`the ${label} pose is refused`);
  }
  const raised: IAutoMovieVector3 = gun
    .articulate({ elevation: 12 })
    .affordance("primer").frame.translation;
  if (close(raised.y, primer.y) && close(raised.z, primer.z))
    findings.push("the primer does not ride the tube");
  TestValidator.equals(
    "the field gun is served as the manuals describe",
    findings,
    [],
  );
}
