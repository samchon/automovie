import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
  createCart,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** The model's own frame, in which its colliders are measured. */
const ORIGIN: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/** The back where a saddle sits, as a share of the height at the withers, and the saddle's middle behind the shoulder joints, metres: the horse's two construction estimates, no source giving either, restated here as numbers. */
const BACK: number = 0.95;
const SADDLE: number = 0.45;

/**
 * A horse in harness wears its harness on its own body, and a cart it draws is joined to it by traces and driving lines the towing ride lays at every second.
 *
 * Scenarios:
 * 1. For three seeds, under all four tacks and without equipment, the hindquarters reach back to the point of buttock, 185/172 of the withers height behind the initial shoulder site (Jensen et al. 2019's horizontal L1 over the height at the withers). The buttock landmark is at the actual hindquarters capsule's rear cap-centre height and one radius behind it; this provisional body height is independent of the later connected hip attachment and is not a measured buttock height. The trunk retains its shoulder/hip sites along Z; the body's mass is the drawn mass and the tack's read weight: Wintec's 5.4 kg riding saddle, nothing for the harness, whose weight no maker states, and FM 25-7's 95 lb rigged cargo saddle scaled by the cube of the height over the manual's 59 to 62 in mule's middle.
 * 2. A postilion's horse (`both`) offers the riding saddle's `seat` and the harness's `hitch` together, and carries the harness's places as the driving horse does. Under a pack saddle the horse's contacts are the `lead`, the two loads and the `tie` a following animal's lead is made fast to, the pads run FM 25-7's 23 in along the back scaled by the height, the croup piece's clearance is an ANSUR II hand's breadth (78.2 to 88.3 mm), and the breeching's straps clear the hindquarters' rounded end by FM 25-7's inch at their nearest. In harness the horse has a `hitch` on the trunk's axis under the saddle's middle and none of the riding saddle's contacts; the points of draft stand at the shoulder joints' height, level with the elbows; the breeching's seat lies 2 to 4 in below the point of buttock (Hammill's "a couple to a few inches", as read) on the hindquarters' surface; the model is admitted.
 * 3. A cart built for the same horse holds its coupling where the hitch is when the two are joined, its single tree's ends stand level with the points of draft, as far apart, and each held run of the driving lines starts at its terret and is the rest of IVC's 14 ft line after the run from the bit through the ring to the terret.
 * 4. Drawn behind the horse's ride through a quarter turn, at every second sampled: each trace runs from its point of draft on the posed horse to its end of the single tree on the posed cart, and each driving line from its bit ring through the neck strap's ring and the terret to the cart's held run; the bit rings move with the nodding head relative to the saddle.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the horse under all four tacks, the untacked body, and the cart, draws them, and reads the parts, the contacts and the laid lines; hindquarters short of the measured horizontal point of buttock, a body landmark detached from its actual capsule, a breeching off Hammill's drop, traces or lines that leave the collar, the bit, the terrets or the cart, or a bridle that does not nod is caught.
 * @evidence contracts/development/testing.md#independent-expectations The buttock's horizontal location retains Jensen's 185 cm over 172 cm. Its body-height oracle is the actual emitted capsule's rear cap centre, obtained independently from its primitive height and actual rigid transform; subtracting that primitive's radius gives its posterior body surface, without assuming the connected hip shares the same height or calling the neutral attachment constructor. The drop's band is the 2 to 4 in read off Hammill's wording; each line's expected point is worked from the posed part's own transform and the ride's placement, not from the ride's laying.
 * @evidence contracts/development/testing.md#distinguishing-cases Four tacks and the untacked horse, three seeds, a cart, a straight and a quarter turn; provisional body landmarks are distinguished from later connected skeletal attachment points.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_harness(): void {
  const findings: string[] = [];
  const close = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));

  // 1 and 2. The body and the harness.
  for (const seed of [1, 2, 3])
    // The four tacks and the untacked horse this spec states; the alternative mounted supports are `test_archetype_equine_tack`'s.
    for (const tack of [
      "saddle",
      "harness",
      "both",
      "pack",
      "bare",
    ] as const satisfies readonly AutoMovieArchetypeEquine.Tack[]) {
      const horse: AutoMovieArchetype<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > = createHorse({ tack }, seed);
      const label: string = `${tack} ${seed}`;
      const d = horse.dimensions as Record<
        AutoMovieArchetypeEquine.Dimension,
        number
      >;
      const rig: AutoMovieArchetypeEquine.IRig =
        AutoMovieArchetypeEquine.rig(d);
      const h: number = d.withersHeight;
      const shoulder: IAutoMovieVector3 = rig.limbs.leftFore[0]!;
      const hip: IAutoMovieVector3 = rig.limbs.leftHind[0]!;
      const buttock: number = shoulder.z - (185 / 172) * h;
      if (
        !close(archetypeExtent(horse, "z", ["hindquarters"]).low, buttock, 1e-6)
      )
        findings.push(
          `${label}: the hindquarters end at ${archetypeExtent(horse, "z", ["hindquarters"]).low}, not the point of buttock ${buttock}`,
        );
      if (!close(rig.buttock.z, buttock))
        findings.push(
          `${label}: the rig's point of buttock is ${JSON.stringify(rig.buttock)}`,
        );
      const rump: IAutoMovieModelPart | undefined = horse.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === "hindquarters",
      );
      if (
        rump === undefined ||
        rump.geometry.type !== "primitive" ||
        rump.geometry.shape.type !== "capsule" ||
        rump.transform === null ||
        rump.transform.scale.x !== 1 ||
        rump.transform.scale.y !== 1 ||
        rump.transform.scale.z !== 1
      )
        findings.push(
          `${label}: the actual unit-scale hindquarters capsule is missing`,
        );
      else {
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          rump.transform.rotation,
          { x: 0, y: rump.geometry.shape.height / 2, z: 0 },
        );
        const rearCap: IAutoMovieVector3 = Vector3.add(
          rump.transform.translation,
          Vector3.scale(axis, axis.z < 0 ? 1 : -1),
        );
        if (
          !close(rig.buttock.x, rearCap.x) ||
          !close(rig.buttock.y, rearCap.y) ||
          !close(rig.buttock.z, rearCap.z - rump.geometry.shape.radius)
        )
          findings.push(
            `${label}: the buttock ${JSON.stringify(rig.buttock)} leaves its actual rear cap centre ${JSON.stringify(rearCap)} and radius ${rump.geometry.shape.radius}`,
          );
      }
      const barrel: number = d.girth / (2 * Math.PI);
      if (
        !close(
          archetypeExtent(horse, "z", ["trunk"]).high,
          shoulder.z + barrel,
          1e-6,
        ) ||
        !close(archetypeExtent(horse, "z", ["trunk"]).low, hip.z - barrel, 1e-6)
      )
        findings.push(
          `${label}: the trunk no longer runs from the shoulder joints to the hip joints`,
        );
      // The tack's read weight on top of the horse's: Wintec's 5.4 kg saddle, nothing for the unread harness, and the rigged pack saddle.
      const tackMass: number =
        tack === "saddle" || tack === "both"
          ? 5.4
          : tack === "pack"
            ? 95 *
              AutoMovieArchetypeUnits.POUND *
              (h / (((59 + 62) / 2) * AutoMovieArchetypeUnits.INCH)) ** 3
            : 0;
      if (!close(horse.properties.mass, d.mass + tackMass, 1e-6))
        findings.push(
          `${label}: the body's mass is ${horse.properties.mass}, not ${d.mass + tackMass}`,
        );
      if (!validateModel({ model: horse }).success)
        findings.push(`${label}: the model is refused`);
      const ids: readonly string[] = horse.affordances.map(
        (a: { id: string }): string => a.id,
      );
      if (tack === "bare") {
        if (ids.length > 0)
          findings.push(
            `${label}: the untacked horse exposes ${ids.join(", ")}`,
          );
        continue;
      }
      if (tack === "saddle") {
        if (ids.includes("hitch") || !ids.includes("seat"))
          findings.push(
            `${label}: the saddle horse's contacts are ${ids.join(", ")}`,
          );
        continue;
      }
      if (tack === "pack") {
        if (
          [...ids]
            .sort((a: string, b: string): number => a.localeCompare(b))
            .join(",") !== "lead,leftLoad,rightLoad,tie"
        )
          findings.push(
            `${label}: the pack horse's contacts are ${ids.join(", ")}`,
          );
        const along: number = archetypeExtent(horse, "z", ["pad-left-1"]).size;
        if (
          !close(
            along,
            (23 * AutoMovieArchetypeUnits.INCH * h) /
              (((59 + 62) / 2) * AutoMovieArchetypeUnits.INCH),
            1e-6,
          )
        )
          findings.push(`${label}: the pads run ${along} m along the back`);
        if (!(d.croupClearance >= 0.0782 && d.croupClearance <= 0.0883))
          findings.push(
            `${label}: the croup piece's clearance is ${d.croupClearance} m`,
          );
        // FM 25-7's "about 1 inch clearance between the body piece and the animal's buttocks": the breeching's straps at their nearest to the hindquarters' rounded end.
        const quarters: IAutoMovieVector3 = rig.quarters;
        const clearance: number =
          Math.min(
            ...horse
              .shapes()
              .filter((shape: IAutoMoviePhysicalShape): boolean =>
                shape.id.startsWith("breeching-"),
              )
              .map((shape: IAutoMoviePhysicalShape): number =>
                physicalShapeSegmentDistance(ORIGIN, shape, quarters, quarters),
              ),
          ) - rig.barrel;
        if (!close(clearance, AutoMovieArchetypeUnits.INCH, 1e-9))
          findings.push(
            `${label}: the breeching clears the buttocks by ${clearance} m, not an inch`,
          );
        continue;
      }
      if (
        tack === "both"
          ? !(ids.includes("hitch") && ids.includes("seat"))
          : ids.join(",") !== "hitch"
      )
        findings.push(
          `${label}: the driving horse's contacts are ${ids.join(", ")}`,
        );
      const hitch: IAutoMovieVector3 =
        horse.affordance("hitch").frame.translation;
      if (
        !close(hitch.y, BACK * h - barrel) ||
        !close(hitch.z, shoulder.z - SADDLE)
      )
        findings.push(`${label}: the hitch is at ${JSON.stringify(hitch)}`);
      const part = (id: string): IAutoMovieModelPart =>
        horse.parts.find((p: IAutoMovieModelPart): boolean => p.id === id)!;
      for (const [side, sign] of [
        ["left", 1],
        ["right", -1],
      ] as const) {
        const draft: IAutoMovieVector3 = part(`draft-${side}`).transform!
          .translation;
        if (
          !close(draft.y, shoulder.y) ||
          !close(draft.z, rig.limbs.leftFore[1]!.z) ||
          !(sign * draft.x > 0)
        )
          findings.push(
            `${label}: the ${side} point of draft is at ${JSON.stringify(draft)}`,
          );
      }
      const seat: number = part("breeching-3").transform!.translation.y;
      const drop: number = rig.buttock.y - seat;
      if (
        !(
          drop >= 2 * AutoMovieArchetypeUnits.INCH - 1e-9 &&
          drop <= 4 * AutoMovieArchetypeUnits.INCH + 1e-9
        )
      )
        findings.push(
          `${label}: the breeching lies ${drop / AutoMovieArchetypeUnits.INCH} in below the point of buttock`,
        );
      const quarters: IAutoMovieVector3 = Vector3.create(
        0,
        rig.buttock.y,
        rig.buttock.z + barrel,
      );
      const rearmost: number = archetypeExtent(horse, "z", [
        "breeching-3",
        "breeching-4",
      ]).low;
      const surface: number =
        quarters.z - Math.sqrt(barrel * barrel - drop * drop);
      if (!(rearmost < surface && rearmost > surface - 3 * 0.012 - 1e-3))
        findings.push(
          `${label}: the breeching's back stands at ${rearmost}, off the hindquarters' surface at ${surface}`,
        );
    }

  // 3. The cart built for the horse, joined at the hitch.
  const horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = createHorse({ tack: "harness" }, 4);
  const cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension> =
    createCart(
      {
        kind: "cart",
        withersHeight: horse.dimensions.withersHeight!,
      },
      4,
    );
  const rig: AutoMovieArchetypeEquine.IRig = AutoMovieArchetypeEquine.rig(
    horse.dimensions,
  );
  const coupling: IAutoMovieVector3 =
    cart.affordance("coupling").frame.translation;
  const hitch: IAutoMovieVector3 = horse.affordance("hitch").frame.translation;
  if (!close(coupling.y, hitch.y))
    findings.push(
      `the cart's coupling stands ${coupling.y} m high, the hitch ${hitch.y} m`,
    );
  const tree: IAutoMovieModelPart = cart.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === "single-tree",
  )!;
  const along: IAutoMovieVector3 = Quaternion.rotateVector(
    tree.transform!.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const ends: IAutoMovieVector3[] = [1, -1].map(
    (sign: number): IAutoMovieVector3 =>
      Vector3.add(
        tree.transform!.translation,
        Vector3.scale(along, sign * rig.draft.x),
      ),
  );
  for (const end of ends)
    if (!close(end.y, rig.draft.y) || !close(Math.abs(end.x), rig.draft.x))
      findings.push(`the single tree's end stands at ${JSON.stringify(end)}`);
  const ball = (id: string): IAutoMovieVector3 =>
    horse.parts.find((p: IAutoMovieModelPart): boolean => p.id === id)!
      .transform!.translation;
  for (const side of ["left", "right"] as const) {
    const used: number =
      gap(ball(`bit-${side}`), ball(`ring-${side}`)) +
      gap(ball(`ring-${side}`), ball(`terret-${side}`));
    const held = cart.affordance(`${side}Line`);
    const forward: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      held.frame,
      "x",
    );
    const near: IAutoMovieVector3 = Vector3.add(
      held.frame.translation,
      Vector3.scale(forward, held.length! / 2),
    );
    const terret: IAutoMovieVector3 = Vector3.add(
      ball(`terret-${side}`),
      Vector3.create(0, coupling.y - hitch.y, coupling.z - hitch.z),
    );
    if (
      !close(
        held.length!,
        14 * 12 * AutoMovieArchetypeUnits.INCH - used,
        1e-9,
      ) ||
      gap(near, terret) > 1e-9
    )
      findings.push(
        `the ${side} held run is ${held.length} m from ${JSON.stringify(near)}, not the 14 ft line's ${14 * 12 * AutoMovieArchetypeUnits.INCH - used} m behind the terret at ${JSON.stringify(terret)}`,
      );
  }

  // 4. Drawn through a quarter turn.
  const ride: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(horse, COURSE);
  const lines: AutoMovieArchetypeRide.ILine[] = createCart.lines(cart);
  const towedRide: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(ride, "hitch", cart, "coupling", {
    lines,
    support: createCart.towing(cart),
  });
  const world = <I extends string, D extends string>(
    sample: AutoMovieArchetypeRide.ISample<I, D>,
    id: string,
    local: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  ): IAutoMovieVector3 => {
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === id,
    )!;
    return AutoMovieArchetypeFrame.point(
      sample.placement,
      AutoMovieArchetypeFrame.point(part.transform!, local),
    );
  };
  const relative: number[] = [];
  for (const seconds of [0, 3, 6, 9, 12, 15]) {
    const lead: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    > = ride.at(seconds);
    const sample: AutoMovieArchetypeRide.ISample<
      createCart.Affordance,
      createCart.Dimension
    > = towedRide.at(seconds);
    const laid: readonly AutoMovieArchetypeRide.ILineState[] =
      sample.lines ?? [];
    if (
      laid
        .map((l: AutoMovieArchetypeRide.ILineState): string => l.id)
        .join(",") !== "trace-left,trace-right,line-left,line-right"
    )
      findings.push(
        `${seconds} s: the lines laid are ${laid.map((l: AutoMovieArchetypeRide.ILineState): string => l.id).join(", ")}`,
      );
    for (const [k, side] of (["left", "right"] as const).entries()) {
      const trace: AutoMovieArchetypeRide.ILineState = laid[k]!;
      const length: number = (k === 0 ? 1 : -1) * rig.draft.x;
      if (
        gap(trace.points[0]!, world(lead, `draft-${side}`)) > 1e-9 ||
        gap(
          trace.points[1]!,
          world(sample, "single-tree", { x: 0, y: length, z: 0 }),
        ) > 1e-9
      )
        findings.push(
          `${seconds} s: the ${side} trace leaves the collar or the single tree`,
        );
      const line: AutoMovieArchetypeRide.ILineState = laid[2 + k]!;
      const expected: IAutoMovieVector3[] = [
        world(lead, `bit-${side}`),
        world(lead, `ring-${side}`),
        world(lead, `terret-${side}`),
        towedRide.frame(`${side}LineEnd`, seconds).translation,
      ];
      if (
        line.points.length !== 4 ||
        expected.some(
          (p: IAutoMovieVector3, i: number): boolean =>
            gap(p, line.points[i]!) > 1e-9,
        )
      )
        findings.push(
          `${seconds} s: the ${side} driving line leaves the bit, ring, terret or material end`,
        );
      if (seconds === 0 && line.points.length === 4) {
        const stock: number = cart.affordance(`${side}Line`).length!;
        const laidRun: number = gap(line.points[2]!, line.points[3]!);
        if (!close(laidRun, stock, 1e-9))
          findings.push(
            `the ${side} laid run behind the terret is ${laidRun} m, expected ${stock} m`,
          );
      }
    }
    relative.push(world(lead, "bit-left").y - world(lead, "pad").y);
  }
  if (!(Math.max(...relative) - Math.min(...relative) > 1e-3))
    findings.push(
      `the bit rings do not move with the head: ${relative.join(", ")}`,
    );
  TestValidator.equals(
    "the harness lies on the horse and joins it to the cart",
    findings,
    [],
  );
}

/** A straight, a quarter turn of 10 m radius and a straight, at a walk. */
const COURSE: rideQuadruped.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [
    { kind: "straight", length: 8 },
    { kind: "turn", radius: 10, angle: 90 },
    { kind: "straight", length: 8 },
  ],
  cruise: 1.5,
  acceleration: 0.5,
  deceleration: 0.5,
};
