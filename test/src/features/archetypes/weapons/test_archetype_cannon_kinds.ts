import { type AutoMovieArchetype, AutoMovieArchetypeRefusal, AutoMovieArchetypeCannon } from "@automovie/archetypes";
import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** An inch, metres. */
const IN: number = 0.0254;

/** A pound, kilograms. */
const LB: number = 0.45359237;

/**
 * The naval gun and the mortars are their sources' pieces.
 *
 * Scenarios:
 * 1. A naval gun is Griffiths' iron 32-pounder of 56 cwt: 9 ft 6 in long, bore 6.41 in, its fore and hind trucks 19 and 16 in (borrowed from the land service's, marked provisional), gun and carriage 69 cwt 3 qr; Douglas's 1600 ft/s and 9 ft recoil.
 * 2. Over 200 seeds a mortar is the 1861 manual's 10-inch siege mortar or the 24-pounder Coehorn whole (bore, length, bed and mass with the bed), never a blend, and both appear.
 * 3. A mortar's muzzle points up at 45 degrees; a naval gun's elevation turns its muzzle up at its travel and down at its reverse, each an admitted model.
 * 4. Each kind's `muzzle` and `vent` are sockets.
 * 5. A model given for a gun is refused at `model`.
 * 6. A swivel gun is Royal Museums Greenwich KTP0053's 2.25 in calibre on a 1000 mm tube (provisional); its `elevation` rides its `traverse`, so panning a quarter turn carries the tilted muzzle round with it, and its tilt's and pan's ends are admitted models; its `tiller` rides the elevation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind, reads its dimensions and contacts, sweeps the mortar's models and articulates the naval gun; a figure off its source, a blended mortar, a muzzle at the wrong angle or an unrefused model is caught.
 * @evidence contracts/development/testing.md#independent-expectations The figures are written here from Griffiths, Douglas and the 1861 manual's pages.
 * @evidence contracts/development/testing.md#distinguishing-cases The three new kinds, both mortars, the elevation's and the pan's ends and a refusal.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_cannon_kinds(): void {
  const findings: string[] = [];
  const close: (a: number, b: number, tolerance?: number) => boolean = (
    a: number,
    b: number,
    tolerance: number = 1e-9,
  ): boolean => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b));
  const naval: AutoMovieArchetype<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = AutoMovieArchetypeCannon.create({ kind: "navalGun" }, 1);
  const n: Readonly<Partial<Record<AutoMovieArchetypeCannon.Dimension, number>>> =
    naval.dimensions;
  for (const [name, expected] of [
    ["length", 114 * IN],
    ["bore", 6.41 * IN],
    ["frontWheelDiameter", 19 * IN],
    ["wheelDiameter", 16 * IN],
    ["mass", 69.75 * 112 * LB],
    ["muzzleVelocity", 1600 * 12 * IN],
    ["recoil", 9 * 12 * IN],
  ] as const)
    if (!close(n[name]!, expected))
      findings.push(`naval ${name} is ${n[name]}, not ${expected}`);
  for (const name of ["frontWheelDiameter", "wheelDiameter", "recoil"] as const)
    if (
      AutoMovieArchetypeCannon.create({ kind: "navalGun" }).provenance.bands[name]?.provisional !==
      true
    )
      findings.push(`naval ${name} is not marked provisional`);

  findings.push(
    ...archetypeModelSweep([
      {
        name: "mortar",
        measure: (seed: number): number[] => {
          const m: Readonly<Partial<Record<AutoMovieArchetypeCannon.Dimension, number>>> =
            AutoMovieArchetypeCannon.create({ kind: "mortar" }, seed).dimensions;
          return [m.bore!, m.length!, m.bedLength!, m.bedWidth!, m.mass!];
        },
        models: [
          [10 * IN, 28 * IN, 51.8 * IN, 40 * IN, (1852 + 1830) * LB],
          [5.82 * IN, 16.32 * IN, 31 * IN, 15 * IN, (164 + 132) * LB],
        ],
        source: "the 1861 Ordnance Manual, pp. 21 and 77",
      },
    ]),
  );

  for (const model of ["siege10", "coehorn24"] as const) {
    const mortar: AutoMovieArchetype<
      AutoMovieArchetypeCannon.Affordance,
      AutoMovieArchetypeCannon.Dimension
    > = AutoMovieArchetypeCannon.create({ kind: "mortar", model }, 1);
    const muzzle: IAutoMovieVector3 =
      mortar.affordance("muzzle").frame.translation;
    const vent: IAutoMovieVector3 = mortar.affordance("vent").frame.translation;
    const angle: number =
      (Math.atan2(muzzle.y - vent.y, muzzle.z - vent.z) * 180) / Math.PI;
    if (!(Math.abs(angle - 45) <= 5))
      findings.push(`${model}: the bore points ${angle} degrees up`);
    for (const id of ["muzzle", "vent"] as const)
      if (mortar.affordance(id).kind !== "socket")
        findings.push(`${model}: ${id} is not a socket`);
    if (!AutoMovieEngineValidation.validateModel({ model: mortar }).success)
      findings.push(`${model} is refused`);
  }

  const up: number = naval.affordance("elevation").travel!;
  const down: number = naval.affordance("elevation").reverse!;
  const level: number = naval.affordance("muzzle").frame.translation.y;
  const raised: AutoMovieArchetype<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = naval.articulate({ elevation: up });
  const lowered: AutoMovieArchetype<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = naval.articulate({ elevation: -down });
  if (!(raised.affordance("muzzle").frame.translation.y > level))
    findings.push("the naval muzzle does not rise");
  if (!(lowered.affordance("muzzle").frame.translation.y < level))
    findings.push("the naval muzzle does not fall");
  for (const posed of [naval, raised, lowered])
    if (!AutoMovieEngineValidation.validateModel({ model: posed }).success)
      findings.push("a naval pose is refused");
  for (const id of ["muzzle", "vent"] as const)
    if (naval.affordance(id).kind !== "socket")
      findings.push(`naval ${id} is not a socket`);

  for (const call of [
    (): unknown => AutoMovieArchetypeCannon.create({ kind: "fieldGun", model: "siege10" }, 1),
  ]) {
    let refused: unknown = null;
    try {
      call();
    } catch (error) {
      refused = error;
    }
    if (
      !(
        refused instanceof AutoMovieArchetypeRefusal && refused.axis === "model"
      )
    )
      findings.push("a model is not refused");
  }
  const swivel: AutoMovieArchetype<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = AutoMovieArchetypeCannon.create({ kind: "swivelGun" }, 1);
  if (
    !close(swivel.dimensions.bore!, 2.25 * IN) ||
    !close(swivel.dimensions.length!, 1)
  )
    findings.push("the swivel gun is not KTP0053's");
  if (swivel.provenance.bands.length?.provisional !== true)
    findings.push("the swivel's length is not marked provisional");
  if (
    swivel.affordance("elevation").rides !== "traverse" ||
    swivel.affordance("tiller").rides !== "elevation"
  )
    findings.push("the swivel's hinges do not ride each other");
  const tilt: number = swivel.affordance("elevation").travel!;
  const ahead: IAutoMovieVector3 = swivel
    .articulate({ elevation: tilt })
    .affordance("muzzle").frame.translation;
  const round: IAutoMovieVector3 = swivel
    .articulate({ elevation: tilt, traverse: 90 })
    .affordance("muzzle").frame.translation;
  if (
    !(
      Math.abs(round.y - ahead.y) < 1e-9 &&
      Math.abs(round.z) < 1e-6 &&
      Math.abs(round.x) > 0.1
    )
  )
    findings.push(
      `panning a quarter turn leaves the tilted muzzle at ${JSON.stringify(round)}`,
    );
  for (const state of [
    { elevation: tilt },
    { elevation: -swivel.affordance("elevation").reverse! },
    { traverse: 180 },
    { traverse: -180 },
  ])
    if (!AutoMovieEngineValidation.validateModel({ model: swivel.articulate(state) }).success)
      findings.push(`the swivel pose ${JSON.stringify(state)} is refused`);
  TestValidator.equals(
    "the naval gun, the mortars and the swivel gun are their sources'",
    findings,
    [],
  );
}
