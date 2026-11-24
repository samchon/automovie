import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
  createCart,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A drawn cart stands where its horse, its runner and its sources put it, and is drawn by its coupling.
 *
 * Scenarios, for each drawn kind at four seeds:
 * 1. A cart's shafts are held at its horse's tugs: the `coupling` stands at the horse's back, 0.95 of its withers height, less its barrel's radius, the girth over two pi; and the shafts' tips stand the shaft length ahead of the single tree, 0.45 m (the horse's saddle) ahead of the coupling.
 * 2. A rickshaw's shafts are held at a standing runner's hanging wrists, 793 to 846 mm above the ground (ANSUR II); the grips' middle is the `coupling`, and the tips stand the rickshaw's overall length ahead of its wheels' rear.
 * 3. A chariot's pole runs its length from the axle to the yoke, which stands at the horse's withers height, and its `rim` stands the siding's height above its `floor`; each wheel has six spokes.
 * 4. A limber's pole end stands 144.58 in ahead of its axle (the Ordnance Manual of 1861: 28.5 in less the 11.88 in its wheels add behind the frame, plus its 52.85 in frame and 108.35 in pole), and its `pintle` stands behind the axle.
 * 5. Each drawn kind's road wheels spin on knobs about the axle, along `X` at the wheel's radius above the ground under the origin, a track apart.
 * 6. Towed by its `coupling` behind a leader's hitch through a quarter turn, each drawn kind keeps its coupling on the hitch within 1e-6 m.
 */
export function test_unit_archetypes_vehicles_cart_drawn(): void {
  const findings: string[] = [];
  const close = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  const at = (
    cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension>,
    id: createCart.Affordance,
  ): IAutoMovieVector3 => cart.affordance(id).frame.translation;
  const DRAWN: readonly createCart.Kind[] = [
    "cart",
    "rickshaw",
    "chariot",
    "limber",
  ];
  for (const kind of DRAWN)
    for (const seed of [0, 3, 7, 12]) {
      const cart: AutoMovieArchetype<
        createCart.Affordance,
        createCart.Dimension
      > = createCart({ kind }, seed);
      const d: Readonly<Partial<Record<createCart.Dimension, number>>> =
        cart.dimensions;
      const label: string = `${kind}@${seed}`;
      const radius: number = d.wheelDiameter! / 2;
      const coupling: IAutoMovieVector3 = at(cart, "coupling");

      // The road wheels.
      for (const [id, sign] of [
        ["leftSpin", 1],
        ["rightSpin", -1],
      ] as const) {
        const spin: IAutoMovieVector3 = at(cart, id);
        const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          cart.affordance(id).frame,
          "y",
        );
        const track: number =
          kind === "rickshaw"
            ? d.width! - AutoMovieArchetypeUnits.INCH
            : d.track!;
        if (
          !close(spin.x, (sign * track) / 2) ||
          !close(spin.y, radius) ||
          !close(spin.z, 0) ||
          !close(Math.abs(axis.x), 1)
        )
          findings.push(`${label}: the ${id} knob is off the axle`);
      }

      if (kind === "cart") {
        const tug: number = 0.95 * d.withersHeight! - d.girth! / (2 * Math.PI);
        if (!close(coupling.y, tug))
          findings.push(
            `${label}: the coupling is ${coupling.y} m high, the tugs ${tug} m`,
          );
        if (!close(coupling.z, createCart.SINGLE_TREE + d.shaftLength! - 0.45))
          findings.push(
            `${label}: the coupling is not the saddle behind the shafts' tips`,
          );
      } else if (kind === "rickshaw") {
        for (const id of ["leftShaft", "rightShaft"] as const)
          if (
            !close(at(cart, id).y, d.gripHeight!) ||
            !(d.gripHeight! >= 0.793 && d.gripHeight! <= 0.846)
          )
            findings.push(
              `${label}: the ${id} is not at a hanging wrist's height`,
            );
        const middle: IAutoMovieVector3 = Vector3.scale(
          Vector3.add(at(cart, "leftShaft"), at(cart, "rightShaft")),
          0.5,
        );
        if (!close(gap(middle, coupling), 0))
          findings.push(`${label}: the coupling is not between the grips`);
        if (!(coupling.z + 0.12 / 2 + radius <= d.length! + 1e-9))
          findings.push(
            `${label}: the shafts reach past the rickshaw's length`,
          );
      } else if (kind === "chariot") {
        if (!close(coupling.y, d.withersHeight!))
          findings.push(`${label}: the yoke is not at the withers`);
        if (!close(gap(coupling, Vector3.create(0, radius, 0)), d.poleLength!))
          findings.push(
            `${label}: the pole is not its length from the axle to the yoke`,
          );
        if (!close(at(cart, "rim").y - at(cart, "floor").y, d.railHeight!))
          findings.push(
            `${label}: the rim is not the siding's height above the floor`,
          );
        const spokes: number = (cart.affordance("leftSpin").parts ?? []).filter(
          (p: string): boolean => p.startsWith("spoke"),
        ).length;
        if (spokes * 2 !== 6)
          findings.push(`${label}: a wheel shows ${spokes * 2} spokes`);
      } else {
        if (!close(coupling.z, 144.58 * AutoMovieArchetypeUnits.INCH, 1e-6))
          findings.push(
            `${label}: the pole's end is ${coupling.z / AutoMovieArchetypeUnits.INCH} in ahead of the axle`,
          );
        if (!(at(cart, "pintle").z < 0))
          findings.push(`${label}: the pintle is not behind the axle`);
        if (
          !close(d.wheelDiameter!, 57 * AutoMovieArchetypeUnits.INCH) ||
          !close(d.track!, 60 * AutoMovieArchetypeUnits.INCH)
        )
          findings.push(`${label}: the wheels are not the Manual's`);
      }

      // Towed through a quarter turn.
      const leader: AutoMovieArchetypeRide.IRide<"hitch", never> =
        AutoMovieArchetypeRide.along(hitched(), COURSE);
      const towed: AutoMovieArchetypeRide.IRide<
        createCart.Affordance,
        createCart.Dimension
      > = AutoMovieArchetypeRide.towed(leader, "hitch", cart, "coupling", {
        support: createCart.towing(cart),
      });
      for (const seconds of [0, 5, 10, 15, 20])
        if (
          gap(
            towed.frame("coupling", seconds).translation,
            leader.frame("hitch", seconds).translation,
          ) > 1e-6
        )
          findings.push(
            `${label}: the coupling leaves the hitch at ${seconds} s`,
          );
    }
  TestValidator.equals(
    "the drawn carts stand where their sources put them",
    findings,
    [],
  );
}

/** A straight, a quarter turn of 10 m radius and a straight. */
const COURSE: AutoMovieArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [
    { kind: "straight", length: 10 },
    { kind: "turn", radius: 10, angle: 90 },
    { kind: "straight", length: 10 },
  ],
  cruise: 2,
  acceleration: 1,
  deceleration: 1,
};

/**
 * A leader: a box on the floor with a hitch ahead of it.
 *
 * @returns The leader.
 */
function hitched(): AutoMovieArchetype<"hitch", never> {
  return new AutoMovieArchetypeBuilder<"hitch", never>({
    material: "steel",
    name: "leader",
    draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
  })
    .box("body", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
    .affordance({
      id: "hitch",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 1, -1)),
      extent: null,
    })
    .build(500);
}
