import {
  ArchetypeFrame,
  createBar,
  createBicycle,
  createCar,
  createDoor,
  createHorse,
  createSeat,
  createTable,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * An affordance with an extent offers sites along and across it, each a frame on the extent in the kind's convention.
 *
 * Scenarios:
 * 1. Bar: the sites at 0 and 1 of a rail are its two ends, one bar length apart along the bar's `+X`, and the middle site is the frame itself.
 * 2. Seat with places: on a three-place bench the sites at one sixth, one half and five sixths across are one place width (610 mm, the bench's cited place) apart, each on the front edge at the seat height; `v = 1` lies the seat's depth behind the front edge.
 * 3. Aperture: the four corner sites of a door's opening span its clear width and its height, the lower two on the threshold.
 * 4. Wheel: sites round a steering wheel's rim all lie one radius from its centre in the rim's plane, a quarter turn apart for a quarter of the coordinate, and each site's `+Y` points out from the centre with its `+X` along the rim. The rim starts on the frame's `+X` and closes there, a tenth more of the coordinate is 36 degrees further round the frame's `+Y` by the right-hand rule, and each site's `+X` is the tangent in that sense.
 * 5. A point contact (a door's hinge) has the one site of its own frame for any coordinate.
 * 6. Surface and pedal: on a desk's level top and on a car's tilted accelerator the sites at (0, 0), (1, 0) and (0, 1) are the corners of a rectangle `width` across the frame's `+X` and `depth` along its `+Z`, centred on the frame, and an inner site lies in proportion.
 * 7. Crank: a bicycle crank's one site, whatever the coordinates, is one crank length from the axle and at the left pedal's spindle, at rest and with the crank turned 120 degrees.
 * 8. Stirrup: a horse's stirrup sites at 0 and 1 are its tread's width apart along the frame's `+X` about the frame, and the second coordinate changes nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Asks produced archetypes for sites and measures the returned frames against the affordance's own extent fields; a site off the extent, scaled wrongly, measured from an edge instead of the centre, a rim that runs the other way round, or a rim frame that does not follow the bar convention is caught.
 * @evidence contracts/development/testing.md#independent-expectations Expectations come from the kinds' definitions in `AutoMovieAffordanceKind` and `ArchetypeSite`'s table (a bar's line along `+X` centred on the frame, a seat running `depth` back along `-Z`, a surface's and a pedal's centred rectangle, a stirrup's line across, an aperture's `width` and `height`, a rim at `radius` turning about `+Y`, a crank's arm end at `radius`), from the bench's cited 610 mm place (NKBA Kitchen Planning Guideline 9), and from a crank arm ending at its pedal.
 * @evidence contracts/development/testing.md#distinguishing-cases One kind of each extent shape: a line, a rectangle from an edge, a centred rectangle level and tilted, an upright rectangle, a circle, a single offset site, a point; coordinates outside 0 to 1 belong to `test_archetype_contract_refusal`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eight scenarios and what each pins.
 */
export function test_archetype_contract_site(): void {
  const findings: string[] = [];
  const at = (frame: IAutoMovieTransform): IAutoMovieVector3 =>
    frame.translation;
  const apart = (a: IAutoMovieTransform, b: IAutoMovieTransform): number =>
    Vector3.length(Vector3.subtract(at(a), at(b)));

  // 1. A bar's ends.
  const rail: ReturnType<typeof createBar> = createBar({ kind: "rail" }, 4);
  const bar: IAutoMovieAffordance = rail.affordance("bar");
  if (
    !nclose(apart(rail.site("bar", 0), rail.site("bar", 1)), bar.length!, 1e-9)
  )
    findings.push("bar ends are not a bar length apart");
  if (
    !vclose(
      Vector3.subtract(at(rail.site("bar", 1)), at(rail.site("bar", 0))),
      Vector3.scale(ArchetypeFrame.axis(bar.frame, "x"), bar.length!),
      1e-9,
    )
  )
    findings.push("bar sites do not run along its +X");
  if (!vclose(at(rail.site("bar")), at(bar.frame), 1e-12))
    findings.push("the middle site is not the frame");

  // 2. Places on a bench.
  const bench: ReturnType<typeof createSeat> = createSeat(
    { kind: "bench", places: 3 },
    9,
  );
  const seat: IAutoMovieAffordance = bench.affordance("seat");
  const places: IAutoMovieTransform[] = [1 / 6, 1 / 2, 5 / 6].map(
    (u: number): IAutoMovieTransform => bench.site("seat", u, 0),
  );
  if (
    !nclose(apart(places[0]!, places[1]!), 0.61, 1e-9) ||
    !nclose(apart(places[1]!, places[2]!), 0.61, 1e-9)
  )
    findings.push("bench places are not 610 mm apart");
  if (
    places.some(
      (p: IAutoMovieTransform): boolean =>
        !nclose(at(p).y, at(seat.frame).y, 1e-12) ||
        !nclose(at(p).z, at(seat.frame).z, 1e-12),
    )
  )
    findings.push("bench places are not on the front edge");
  if (
    !nclose(
      at(seat.frame).z - at(bench.site("seat", 0.5, 1)).z,
      seat.depth!,
      1e-9,
    )
  )
    findings.push("the seat's back site is not its depth behind the front");

  // 3. A door opening's corners.
  const door: ReturnType<typeof createDoor> = createDoor({}, 2);
  const opening: IAutoMovieAffordance = door.affordance("aperture");
  if (
    !nclose(
      apart(door.site("aperture", 0, 0), door.site("aperture", 1, 0)),
      opening.width!,
      1e-9,
    ) ||
    !nclose(
      apart(door.site("aperture", 0, 0), door.site("aperture", 0, 1)),
      opening.height!,
      1e-9,
    ) ||
    !nclose(at(door.site("aperture", 0, 0)).y, 0, 1e-12)
  )
    findings.push(
      "aperture corners do not span the opening from the threshold",
    );

  // 4. A steering wheel's rim.
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" }, 6);
  const wheel: IAutoMovieAffordance = car.affordance("wheel");
  const axis: IAutoMovieVector3 = ArchetypeFrame.axis(wheel.frame, "y");
  for (const u of [0, 0.25, 0.5, 0.75]) {
    const site: IAutoMovieTransform = car.site("wheel", u);
    const spoke: IAutoMovieVector3 = Vector3.subtract(
      at(site),
      at(wheel.frame),
    );
    if (
      !nclose(Vector3.length(spoke), wheel.radius!, 1e-9) ||
      !nclose(Vector3.dot(spoke, axis), 0, 1e-9)
    )
      findings.push(`rim site ${u} is off the rim`);
    if (
      !vclose(ArchetypeFrame.axis(site, "y"), Vector3.normalize(spoke), 1e-9) ||
      !nclose(Vector3.dot(ArchetypeFrame.axis(site, "x"), spoke), 0, 1e-9) ||
      !nclose(Vector3.dot(ArchetypeFrame.axis(site, "x"), axis), 0, 1e-9)
    )
      findings.push(`rim site ${u} is not a grip on the rim`);
  }
  if (
    !nclose(
      apart(car.site("wheel", 0), car.site("wheel", 0.25)),
      Math.SQRT2 * wheel.radius!,
      1e-9,
    )
  )
    findings.push("a quarter of the rim is not a quarter turn");

  // 4. The rim's turning sense: a growing coordinate goes round the frame's +Y by the right-hand rule, and a site's +X is the rim's tangent that way.
  for (const u of [0, 0.1, 0.25, 0.6, 0.85]) {
    const from: IAutoMovieVector3 = Vector3.subtract(
      at(car.site("wheel", u)),
      at(wheel.frame),
    );
    const to: IAutoMovieVector3 = Vector3.subtract(
      at(car.site("wheel", u + 0.1)),
      at(wheel.frame),
    );
    if (
      !nclose(
        Vector3.dot(Vector3.cross(from, to), axis),
        wheel.radius! * wheel.radius! * Math.sin(0.2 * Math.PI),
        1e-9,
      ) ||
      !vclose(
        ArchetypeFrame.axis(car.site("wheel", u), "x"),
        Vector3.normalize(Vector3.cross(axis, from)),
        1e-9,
      )
    )
      findings.push(`rim site ${u} does not turn about +Y`);
  }
  if (
    !vclose(
      Vector3.subtract(at(car.site("wheel", 0)), at(wheel.frame)),
      Vector3.scale(ArchetypeFrame.axis(wheel.frame, "x"), wheel.radius!),
      1e-9,
    ) ||
    !vclose(at(car.site("wheel", 0)), at(car.site("wheel", 1)), 1e-9)
  )
    findings.push("the rim does not start and close on the frame's +X");

  // 5. A point contact.
  if (
    !vclose(
      at(door.site("hinge", 0.9, 0.1)),
      at(door.affordance("hinge").frame),
      1e-12,
    )
  )
    findings.push("a point contact has more than one site");

  // 6. A surface and a pedal: a rectangle centred on the frame, width across +X and depth along +Z, on a level top and on a tilted plate.
  const desk: ReturnType<typeof createTable> = createTable({ kind: "desk" }, 4);
  const centred: readonly (readonly [
    string,
    IAutoMovieAffordance,
    (u: number, v: number) => IAutoMovieTransform,
  ])[] = [
    [
      "a desk's top",
      desk.affordance("top"),
      (u: number, v: number): IAutoMovieTransform => desk.site("top", u, v),
    ],
    [
      "a car's accelerator",
      car.affordance("accelerator"),
      (u: number, v: number): IAutoMovieTransform =>
        car.site("accelerator", u, v),
    ],
  ];
  for (const [name, affordance, site] of centred) {
    const corner = (x: number, z: number): IAutoMovieVector3 =>
      ArchetypeFrame.point(affordance.frame, {
        x: x * affordance.width!,
        y: 0,
        z: z * affordance.depth!,
      });
    if (
      !(affordance.width! > 0 && affordance.depth! > 0) ||
      !vclose(at(site(0, 0)), corner(-0.5, -0.5), 1e-9) ||
      !vclose(at(site(1, 0)), corner(0.5, -0.5), 1e-9) ||
      !vclose(at(site(0, 1)), corner(-0.5, 0.5), 1e-9) ||
      !vclose(at(site(0.75, 0.25)), corner(0.25, -0.25), 1e-9) ||
      !vclose(at(site(0.5, 0.5)), at(affordance.frame), 1e-12)
    )
      findings.push(`${name}: sites are not its centred rectangle`);
  }

  // 7. A crank's one site is the end of its arm, a crank length from the axle, where the pedal's spindle is, at rest and turned.
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({}, 3);
  for (const degrees of [0, 120]) {
    const posed: ReturnType<typeof createBicycle> = bicycle.articulate({
      crank: degrees,
    });
    const end: IAutoMovieVector3 = at(posed.site("crank", 0.2, 0.9));
    const axle: IAutoMovieVector3 = at(posed.affordance("crank").frame);
    const pedal: IAutoMovieVector3 = at(posed.affordance("leftPedal").frame);
    if (
      !nclose(
        Vector3.length(Vector3.subtract(end, axle)),
        posed.affordance("crank").radius!,
        1e-9,
      ) ||
      !vclose(at(posed.site("crank")), end, 1e-12) ||
      !nclose(end.y, pedal.y, 1e-9) ||
      !nclose(end.z, pedal.z, 1e-9)
    )
      findings.push(
        `the crank's site at ${degrees} degrees is not its arm's end`,
      );
  }

  // 8. A stirrup: its tread's width across +X, centred, whatever the second coordinate.
  const horse: ReturnType<typeof createHorse> = createHorse({}, 2);
  const tread: IAutoMovieAffordance = horse.affordance("leftStirrup");
  if (
    !vclose(
      Vector3.subtract(
        at(horse.site("leftStirrup", 1)),
        at(horse.site("leftStirrup", 0)),
      ),
      Vector3.scale(ArchetypeFrame.axis(tread.frame, "x"), tread.width!),
      1e-9,
    ) ||
    !vclose(at(horse.site("leftStirrup", 0.5, 0)), at(tread.frame), 1e-12) ||
    !vclose(
      at(horse.site("leftStirrup", 0.3, 0)),
      at(horse.site("leftStirrup", 0.3, 1)),
      1e-12,
    )
  )
    findings.push("a stirrup's sites do not run across its tread");
  TestValidator.equals("sites lie on their affordance's extent", findings, []);
}
