import {
  ArchetypeUnits,
  createConsole,
  createControl,
  createHatch,
  createSafe,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Hand controls, a control console, a roof hatch and a gun safe stand at their makers' sizes, and the hatch's cover opens as the maker draws it.
 *
 * Scenarios:
 * 1. A lever's and a dial's axis lie in the ADA's 380 to 1220 mm (15 to 48 in) reach range, a lever's length in DIN 6337's 63 to 160 mm. A 100 mm lever is the sheet's: a 25 mm ball, 100 g, the ball 100 mm from the hub's centre, 18.5 / 2 mm out from the panel, along an arm rising 20 degrees. A 90 mm lever lies midway between the 80 and 100 mm ones: a 22.5 mm ball and 76.5 g.
 * 2. A dial's head is the ZB4BD3's 28.5 mm across and 27 mm proud of the panel, turns 45 degrees and weighs 0.04 kg.
 * 3. A console's work surface is the Winsted sheet's 48 to 72 in wide and 28-9/16 to 29 in high; the console is 34-5/8 in deep with its edge at its front, the surface 20 in deep.
 * 4. A hatch's opening is the Bilco Type S's 30 in along its hinge by 36 in across, the cover on the 12 in curb, the hatch 50 to 83 kg; opened its 70 degrees, the cover's top corner rises to its length times sin 70 plus its thickness times cos 70 over the hinge.
 * 5. A safe is the AMSEC BFX6030's 30 by 59 1/4 by 26 in and 1,081 lb, its door the 22 5/16 by 51 3/4 in clearance and 4 3/4 in thick; its hinge stands at the clearance's `+X` edge for a right hinge and `-X` for a left, stating no travel.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders, contacts, masses and an articulated cover over the seeds; a size off its sheet, a lever not interpolated between its neighbours, a cover opening the wrong way or a hinge on the wrong side is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the makers' and the ADA's restated here; a lever's ball at its length along a 20 degree arm, a linear interpolation's midpoint and a slab's corner turned about an edge are worked here by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Each producer and kind; a lever at a catalogue size and between two; a safe hinged either side.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the five scenarios and what each pins.
 */
export function test_archetype_controls(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = ArchetypeUnits.INCH;
  const mm: number = ArchetypeUnits.MILLIMETRE;
  findings.push(
    ...archetypeBandSweep([
      ...createControl.KINDS.map(
        (kind: createControl.Kind): archetypeBandSweep.IRow => ({
          name: `${kind} height`,
          measure: (seed: number): number =>
            createControl({ kind }, seed).affordance(
              kind === "lever" ? "shaft" : "dial",
            ).frame.translation.y,
          minimum: 0.38,
          maximum: 1.22,
          source: "ADA 308.2.1",
        }),
      ),
      {
        name: "lever ball",
        measure: (seed: number): number =>
          createControl({ kind: "lever" }, seed).affordance("knob").aperture!,
        minimum: 20 * mm,
        maximum: 40 * mm,
        source: "DIN 6337",
      },
      {
        name: "console width",
        measure: (seed: number): number =>
          createConsole({}, seed).affordance("surface").width!,
        minimum: 48 * inch,
        maximum: 72 * inch,
        source: "Winsted E-SOC",
      },
      {
        name: "console height",
        measure: (seed: number): number =>
          createConsole({}, seed).affordance("surface").frame.translation.y,
        minimum: (28 + 9 / 16) * inch,
        maximum: 29 * inch,
        source: "Winsted E-SOC",
      },
      {
        name: "hatch mass",
        measure: (seed: number): number =>
          createHatch({}, seed).properties.mass,
        minimum: 50,
        maximum: 83,
        source: "Bilco Type S",
      },
    ]),
  );

  // 1. The lever at a catalogue size and between two.
  const lever: ReturnType<typeof createControl> = createControl({
    kind: "lever",
    length: 0.1,
  });
  const shaft: IAutoMovieVector3 = lever.affordance("shaft").frame.translation;
  const ball: IAutoMovieVector3 = lever.affordance("knob").frame.translation;
  const rise: number = 20 * ArchetypeUnits.DEGREE;
  near("a 100 mm lever's ball", lever.affordance("knob").aperture!, 25 * mm);
  near("a 100 mm lever's mass", lever.properties.mass, 0.1);
  near("its ball up the panel", ball.y - shaft.y, 0.1 * Math.cos(rise));
  near(
    "its ball out of the panel",
    ball.z,
    (18.5 * mm) / 2 + 0.1 * Math.sin(rise),
  );
  const between: ReturnType<typeof createControl> = createControl({
    kind: "lever",
    length: 0.09,
  });
  near("a 90 mm lever's ball", between.affordance("knob").aperture!, 22.5 * mm);
  near("a 90 mm lever's mass", between.properties.mass, 0.0765);

  // 2. The dial.
  const dial: ReturnType<typeof createControl> = createControl({
    kind: "dial",
  });
  near("a dial's head across", archetypeExtent(dial, "x").size, 28.5 * mm);
  near("a dial's head proud", archetypeExtent(dial, "z").high, 27 * mm);
  near("a dial's mass", dial.properties.mass, 0.04);
  if (dial.affordance("dial").travel !== 45)
    findings.push(
      `a dial turns ${dial.affordance("dial").travel} degrees, 45 expected`,
    );

  // 3. The console.
  const desk: ReturnType<typeof createConsole> = createConsole({}, 3);
  near("a console's depth", archetypeExtent(desk, "z").size, 34.625 * inch);
  near(
    "its edge at its front",
    desk.affordance("edge").frame.translation.z,
    34.625 * inch,
  );
  near("its surface's depth", desk.affordance("surface").depth!, 20 * inch);

  // 4. The hatch, shut and open.
  const hatch: ReturnType<typeof createHatch> = createHatch({}, 5);
  near(
    "the opening along the hinge",
    hatch.affordance("opening").width!,
    30 * inch,
  );
  near("the opening across", hatch.affordance("opening").height!, 36 * inch);
  near(
    "the cover's underside",
    archetypeExtent(hatch, "y", ["cover"]).low,
    12 * inch,
  );
  if (hatch.affordance("hinge").travel !== 70)
    findings.push(
      `the cover opens ${hatch.affordance("hinge").travel} degrees, 70 expected`,
    );
  const cover: number = archetypeExtent(hatch, "z", ["cover"]).size;
  const thick: number = archetypeExtent(hatch, "y", ["cover"]).size;
  const swing: number = 70 * ArchetypeUnits.DEGREE;
  near(
    "the open cover's top",
    archetypeExtent(hatch.articulate({ hinge: 70 }), "y", ["cover"]).high,
    12 * inch + cover * Math.sin(swing) + thick * Math.cos(swing),
  );

  // 5. The safe, hinged either side.
  for (const [hinge, side] of [
    ["right", 1],
    ["left", -1],
  ] as const) {
    const safe: ReturnType<typeof createSafe> = createSafe({ hinge });
    near(`a ${hinge} safe's width`, archetypeExtent(safe, "x").size, 30 * inch);
    near(`its height`, archetypeExtent(safe, "y").size, 59.25 * inch);
    near(`its depth`, archetypeExtent(safe, "z").size, 26 * inch);
    near(`its mass`, safe.properties.mass, 1081 * ArchetypeUnits.POUND);
    near(
      `its door's width`,
      archetypeExtent(safe, "x", ["door"]).size,
      (22 + 5 / 16) * inch,
    );
    near(
      `its door's height`,
      archetypeExtent(safe, "y", ["door"]).size,
      51.75 * inch,
    );
    near(
      `its door's thickness`,
      archetypeExtent(safe, "z", ["door"]).size,
      4.75 * inch,
    );
    near(
      `its hinge's side`,
      safe.affordance("door").frame.translation.x,
      (side * (22 + 5 / 16) * inch) / 2,
    );
    if (safe.affordance("door").travel !== undefined)
      findings.push(`a ${hinge} safe's door states a travel no source gives`);
  }
  TestValidator.equals(
    "controls, console, hatch and safe are their makers'",
    findings,
    [],
  );
}
