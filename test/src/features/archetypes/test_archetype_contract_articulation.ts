import {
  type Archetype,
  ArchetypeFrame,
  ArchetypeRefusal,
  createBicycle,
  createCar,
  createDoor,
  createHandgun,
  createMotorcycle,
  createStorage,
  createSwitch,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose, vclose } from "../internal/predicates";

/** A millimetre, the tolerance of #3368 for a part following its articulation. */
const MM: number = 1e-3;

/** Where a part's centre is in its model. */
function centre(archetype: Archetype, part: string): IAutoMovieVector3 {
  return archetype.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === part,
  )!.transform!.translation;
}

/** A point turned a number of degrees about a line through a point along a direction. */
function turned(
  point: IAutoMovieVector3,
  through: IAutoMovieVector3,
  direction: IAutoMovieVector3,
  degrees: number,
): IAutoMovieVector3 {
  return Vector3.add(
    through,
    Quaternion.rotateVector(
      Quaternion.fromAxisAngle(direction, degrees),
      Vector3.subtract(point, through),
    ),
  );
}

/**
 * A model's articulations move the parts and the contacts bound to them, and nothing else.
 *
 * Scenarios:
 * 1. Hinge: at 0, 30, 60 and 90 degrees a right-hinged lever door's leaf and its `pull` contact sit where a rotation about the vertical line through the hinge edge puts them, within a millimetre, and the swing carries the latch edge toward `+Z`, the side the door is pulled from; the frame's jambs do not move.
 * 2. A carried articulation: with the door open 60 degrees and the latch turned 40, the `pull` contact is where pressing the lever about its spindle and then swinging the leaf puts it; pressing alone lowers it, the lever's own part is pressed and then swung with the leaf, and the one latch lowers the lever and the contact of the other face too.
 * 3. Slider: a drawer drawn 0.2 m moves its front and its pull 0.2 m along `+Z` and leaves the other drawers.
 * 4. Pedal on a crank: at every eighth of a turn each bicycle pedal lies one crank length from the axle, the two opposite each other, with its plate still facing up; at a quarter turn forward the left pedal, up at rest, is in front.
 * 5. Articulating is absolute and leaves its receiver untouched: the rest archetype serialises the same after its copies were posed, and posing a posed copy to rest gives the rest model.
 * 6. Mirror: a left-hinged door is the right-hinged door reflected in the `YZ` plane, at rest and open.
 * 7. Placement: a contact's world frame under a placement is the placement applied to its model frame.
 * 8. A sliding door, hinged either side: at its full travel the leaf has run that far toward the side `hinge` names, the frame's one jamb stands on the other side, and the `aperture` is centred between that jamb's inner face and the leaf's trailing edge and as wide as the gap between them.
 * 9. Wheel: a car's steering wheel at 90 and minus 90 degrees and at both ends of its lock carries a rim site and its spoke round the column by that angle, the two quarter turns leaving the spoke pointing opposite ways; a degree past either lock is refused.
 * 10. A wall button, a pistol's trigger and a car's accelerator at full travel move their bound part by the travel along the frame's `-Y`: into the wall, back toward the grip, forward into the footwell.
 * 11. An articulation that states no travel (a bicycle's pedal, a motorcycle's footrest) refuses any travel but 0 with the range 0 to 0, and at 0 is the rest model.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Poses produced archetypes and reads the moved parts and frames; a part that stays behind, turns about the wrong line or the wrong way, a carrier applied in the wrong order, a pedal that turns with its crank, a wheel that turns one way only, a pressed part that comes out instead of going in, a sliding leaf that stops inside its opening, or a travel admitted where none is stated is caught.
 * @evidence contracts/development/testing.md#independent-expectations Expected places are computed here by rotating and shifting the rest places about the door's own hinge edge, the lever's spindle and the steering column, from the kinds' frame convention (`AutoMovieAffordanceKind`: a turn about `+Y`, a run along `+X`, a press along `-Y`), not by calling the articulation code; the pressed directions are the things' own, a wall behind a button and a grip behind a trigger; a sliding door's clear opening is measured between the colliders that bound it. The millimetre is #3368's tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Moving and fixed parts, a single and a chained articulation, both turning senses through the mirror and through a wheel's two signs, each pressing kind once, an articulation with travel against one without; refusals of a hinge's and a fixed contact's travels belong to `test_archetype_contract_refusal`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eleven scenarios and what each pins.
 */
export function test_archetype_contract_articulation(): void {
  const door: ReturnType<typeof createDoor> = createDoor(
    { hinge: "right", hardware: "lever" },
    11,
  );
  const width: number = door.dimensions.width!;
  const edge: IAutoMovieVector3 = door.affordance("hinge").frame.translation;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const findings: string[] = [];

  // 1. The leaf and the handle on the hinge's arc: a right hinge at +X opens toward +Z by a turn about +Y.
  TestValidator.predicate(
    "the hinge stands on the leaf's edge",
    nclose(edge.x, width / 2, MM),
  );
  for (const degrees of [0, 30, 60, 90]) {
    const open: ReturnType<typeof createDoor> = door.articulate({
      hinge: degrees,
    });
    if (
      !vclose(
        centre(open, "leaf"),
        turned(centre(door, "leaf"), edge, up, degrees),
        MM,
      )
    )
      findings.push(`leaf at ${degrees} degrees`);
    if (
      !vclose(
        open.affordance("pull").frame.translation,
        turned(door.affordance("pull").frame.translation, edge, up, degrees),
        MM,
      )
    )
      findings.push(`pull at ${degrees} degrees`);
    if (!vclose(centre(open, "jamb-left"), centre(door, "jamb-left"), 1e-12))
      findings.push(`jamb moved at ${degrees} degrees`);
  }
  const swung: ReturnType<typeof createDoor> = door.articulate({ hinge: 90 });
  TestValidator.predicate(
    "an open door stands on its pull side",
    centre(swung, "leaf").z > width / 4,
  );

  // 2. The lever pressed, then the leaf swung.
  const spindle: IAutoMovieTransform = door.affordance("latch").frame;
  const pressed: IAutoMovieVector3 = door
    .articulate({ latch: 40 })
    .affordance("pull").frame.translation;
  TestValidator.predicate(
    "pressing the lever moves the lever's own part",
    centre(door.articulate({ latch: 40 }), "pull-grip").y <
      centre(door, "pull-grip").y - 0.01 &&
      vclose(
        centre(door.articulate({ hinge: 60, latch: 40 }), "pull-grip"),
        turned(
          centre(door.articulate({ latch: 40 }), "pull-grip"),
          edge,
          up,
          60,
        ),
        MM,
      ),
  );
  TestValidator.predicate(
    "one latch presses the levers of both faces down",
    door.articulate({ latch: 40 }).affordance("push").frame.translation.y <
      door.affordance("push").frame.translation.y - 0.01 &&
      centre(door.articulate({ latch: 40 }), "push-grip").y <
        centre(door, "push-grip").y - 0.01,
  );
  TestValidator.predicate(
    "pressing the lever lowers its arm",
    pressed.y < door.affordance("pull").frame.translation.y - 0.01,
  );
  const expected: IAutoMovieVector3 = turned(
    turned(
      door.affordance("pull").frame.translation,
      spindle.translation,
      Quaternion.rotateVector(spindle.rotation, up),
      40,
    ),
    edge,
    up,
    60,
  );
  if (
    !vclose(
      door.articulate({ hinge: 60, latch: 40 }).affordance("pull").frame
        .translation,
      expected,
      MM,
    )
  )
    findings.push("pull with the lever pressed and the leaf open");

  // 3. A drawer.
  const chest: ReturnType<typeof createStorage> = createStorage(
    { kind: "chest" },
    5,
  );
  const drawn: ReturnType<typeof createStorage> = chest.articulate({
    drawer2: 0.2,
  });
  for (const [moved, by] of [
    ["front-2", 0.2],
    ["pull-2", 0.2],
    ["front-1", 0],
    ["carcass", 0],
  ] as const)
    if (
      !vclose(
        centre(drawn, moved),
        Vector3.add(centre(chest, moved), { x: 0, y: 0, z: by }),
        MM,
      )
    )
      findings.push(`drawer part ${moved}`);
  if (
    !vclose(
      drawn.affordance("pull2").frame.translation,
      Vector3.add(chest.affordance("pull2").frame.translation, {
        x: 0,
        y: 0,
        z: 0.2,
      }),
      MM,
    )
  )
    findings.push("drawer pull contact");

  // 4. Pedals on a crank.
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({}, 3);
  const arm: number = bicycle.dimensions.crank!;
  const axle: IAutoMovieVector3 = bicycle.affordance("crank").frame.translation;
  for (let k: number = 0; k < 8; k++) {
    const posed: ReturnType<typeof createBicycle> = bicycle.articulate({
      crank: 45 * k,
    });
    const left: IAutoMovieTransform = posed.affordance("leftPedal").frame;
    const right: IAutoMovieTransform = posed.affordance("rightPedal").frame;
    const radius = (p: IAutoMovieVector3): number =>
      Math.hypot(p.y - axle.y, p.z - axle.z);
    if (
      !nclose(radius(left.translation), arm, MM) ||
      !nclose(radius(right.translation), arm, MM) ||
      !nclose(left.translation.y + right.translation.y, 2 * axle.y, MM) ||
      !nclose(left.translation.z + right.translation.z, 2 * axle.z, MM)
    )
      findings.push(`pedals off the crank's circle at ${45 * k} degrees`);
    if (
      !vclose(Quaternion.rotateVector(left.rotation, up), up, 1e-9) ||
      !vclose(Quaternion.rotateVector(right.rotation, up), up, 1e-9)
    )
      findings.push(`a pedal tipped at ${45 * k} degrees`);
  }
  TestValidator.predicate(
    "a quarter turn forward carries the upper pedal to the front",
    bicycle.articulate({ crank: 90 }).affordance("leftPedal").frame.translation
      .z >
      axle.z + arm - MM,
  );

  // 5. Absolute, and the receiver untouched.
  const rest: string = JSON.stringify(createDoor({ hinge: "right" }, 11));
  if (JSON.stringify(door) !== rest)
    findings.push("posing changed the receiver");
  if (JSON.stringify(swung.articulate({})) !== rest)
    findings.push("posing a posed copy to rest did not give the rest model");

  // 6. Mirror in the YZ plane.
  const leftDoor: ReturnType<typeof createDoor> = createDoor(
    { hinge: "left", hardware: "lever" },
    11,
  );
  const flip = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: -p.x,
    y: p.y,
    z: p.z,
  });
  for (const degrees of [0, 70]) {
    const a: ReturnType<typeof createDoor> = door.articulate({
      hinge: degrees,
    });
    const b: ReturnType<typeof createDoor> = leftDoor.articulate({
      hinge: degrees,
    });
    for (const id of ["pull", "push", "hinge"] as const)
      if (
        !vclose(
          b.affordance(id).frame.translation,
          flip(a.affordance(id).frame.translation),
          MM,
        )
      )
        findings.push(`mirror of ${id} at ${degrees} degrees`);
    if (!vclose(centre(b, "leaf"), flip(centre(a, "leaf")), MM))
      findings.push(`mirror of the leaf at ${degrees} degrees`);
  }

  // 7. Placement.
  const placement: IAutoMovieTransform = {
    translation: { x: 3, y: 0, z: -2 },
    rotation: Quaternion.fromAxisAngle(up, 90),
    scale: { x: 1, y: 1, z: 1 },
  };
  const local: IAutoMovieVector3 = door.affordance("pull").frame.translation;
  if (
    !vclose(
      door.placed("pull", placement).translation,
      Vector3.add(
        placement.translation,
        Quaternion.rotateVector(placement.rotation, local),
      ),
      1e-9,
    )
  )
    findings.push("placed contact");

  // 8. A sliding leaf runs out past the side its frame leaves open, and the opening it clears lies between the remaining jamb and the leaf's trailing edge.
  for (const hinge of ["right", "left"] as const) {
    const shut: ReturnType<typeof createDoor> = createDoor(
      { kind: "sliding", hinge },
      11,
    );
    const open: ReturnType<typeof createDoor> = shut.articulate({
      slide: shut.affordance("slide").travel!,
    });
    const run: number = centre(open, "leaf").x - centre(shut, "leaf").x;
    const jambs: IAutoMovieModelPart[] = shut.parts.filter(
      (p: IAutoMovieModelPart): boolean => p.id.startsWith("jamb"),
    );
    const gap: IAutoMovieAffordance = shut.affordance("aperture");
    if (
      !nclose(Math.abs(run), shut.affordance("slide").travel!, MM) ||
      Math.sign(run) !== (hinge === "right" ? 1 : -1) ||
      jambs.length !== 1 ||
      Math.sign(jambs[0]!.transform!.translation.x) !== -Math.sign(run)
    )
      findings.push(
        `a ${hinge} sliding leaf ran ${run} m with ${jambs.length} jambs`,
      );
    else {
      // The jamb's inner face and the slid leaf's trailing edge bound the clear opening.
      const jamb: ReturnType<typeof archetypeExtent> = archetypeExtent(
        shut,
        "x",
        [jambs[0]!.id],
      );
      const leaf: ReturnType<typeof archetypeExtent> = archetypeExtent(
        open,
        "x",
        ["leaf"],
      );
      const from: number = run > 0 ? jamb.high : leaf.high;
      const to: number = run > 0 ? leaf.low : jamb.low;
      if (
        !nclose(gap.frame.translation.x, (from + to) / 2, MM) ||
        !nclose(gap.width!, to - from, MM)
      )
        findings.push(
          `a ${hinge} sliding door's opening of ${gap.width} m at ${gap.frame.translation.x} m is not the ${to - from} m cleared at ${(from + to) / 2} m`,
        );
    }
  }

  // 9. A wheel turns either way: a rim site and the spoke go round the column by the travel, opposite ways for opposite signs.
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" }, 6);
  const steering: IAutoMovieAffordance = car.affordance("wheel");
  const column: IAutoMovieVector3 = ArchetypeFrame.axis(steering.frame, "y");
  const spoke = (posed: ReturnType<typeof createCar>): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      posed.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === "steering-spoke",
      )!.transform!.rotation,
      up,
    );
  for (const degrees of [90, -90, steering.travel!, -steering.travel!]) {
    const steered: ReturnType<typeof createCar> = car.articulate({
      wheel: degrees,
    });
    if (
      !vclose(
        steered.site("wheel", 0).translation,
        turned(
          car.site("wheel", 0).translation,
          steering.frame.translation,
          column,
          degrees,
        ),
        MM,
      ) ||
      !vclose(
        spoke(steered),
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(column, degrees),
          spoke(car),
        ),
        1e-9,
      )
    )
      findings.push(`the steering wheel at ${degrees} degrees`);
  }
  if (
    !nclose(
      Vector3.dot(
        spoke(car.articulate({ wheel: 90 })),
        spoke(car.articulate({ wheel: -90 })),
      ),
      -1,
      1e-9,
    )
  )
    findings.push("a wheel turned left and right by 90 degrees is not opposed");
  for (const beyond of [steering.travel! + 1, -steering.travel! - 1])
    if (refused(() => car.articulate({ wheel: beyond }))?.axis !== "wheel")
      findings.push(`the steering wheel is admitted at ${beyond} degrees`);

  // 10. A button, a trigger and a pedal go in along their frame's -Y by their travel: into the wall, back toward the grip, and forward into the footwell.
  const back: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  for (const [name, shift, travel, out, toward] of [
    [
      "button",
      ...pressedBy(createSwitch({ kind: "button" }, 3), "press", "face"),
      back,
    ],
    [
      "trigger",
      ...pressedBy(
        createHandgun({ frame: "fullSize" }, 3),
        "trigger",
        "trigger",
      ),
      back,
    ],
    ["pedal", ...pressedBy(car, "accelerator", "pedal-accelerator"), forward],
  ] as const)
    if (
      !(travel > 0) ||
      !vclose(shift, Vector3.scale(out, -travel), 1e-9) ||
      !(Vector3.dot(shift, toward) > travel / 2)
    )
      findings.push(
        `a ${name} at its travel of ${travel} m moved its part by ${JSON.stringify(shift)}`,
      );

  // 11. An articulation that states no travel stays at rest.
  const machine: ReturnType<typeof createMotorcycle> = createMotorcycle(
    { kind: "motorcycle" },
    3,
  );
  const stuck: (ArchetypeRefusal | null)[] = [
    refused(() => bicycle.articulate({ leftPedal: 0.01 })),
    refused(() => bicycle.articulate({ rightPedal: -0.01 })),
    refused(() => machine.articulate({ leftFootrest: 0.01 })),
  ];
  if (
    stuck.some(
      (r: ArchetypeRefusal | null): boolean =>
        r === null ||
        r.kind !== "articulation" ||
        r.feasible?.kind !== "range" ||
        r.feasible.minimum !== 0 ||
        r.feasible.maximum !== 0,
    )
  )
    findings.push("a pedal without travel admits a travel");
  if (
    JSON.stringify(bicycle.articulate({ leftPedal: 0 })) !==
      JSON.stringify(bicycle) ||
    JSON.stringify(machine.articulate({ leftFootrest: 0 })) !==
      JSON.stringify(machine)
  )
    findings.push("a pedal without travel does not rest at 0");
  TestValidator.equals("articulation moves what is bound to it", findings, []);
}

/** How far a part moves when the articulation that binds it goes to its full travel, with that travel and the direction out of the articulation's rest frame. */
function pressedBy<Id extends string, Dimension extends string>(
  archetype: Archetype<Id, Dimension>,
  id: Id,
  part: string,
): [IAutoMovieVector3, number, IAutoMovieVector3] {
  const affordance: IAutoMovieAffordance = archetype.affordance(id);
  const travel: number = affordance.travel ?? 0;
  const state: Partial<Record<Id, number>> = {};
  state[id] = travel;
  return [
    Vector3.subtract(
      centre(archetype.articulate(state), part),
      centre(archetype, part),
    ),
    travel,
    ArchetypeFrame.axis(affordance.frame, "y"),
  ];
}

/** Run an operation and return the refusal it raises, or null when it raises none or something else. */
function refused(operation: () => unknown): ArchetypeRefusal | null {
  try {
    operation();
  } catch (error) {
    return error instanceof ArchetypeRefusal ? error : null;
  }
  return null;
}
