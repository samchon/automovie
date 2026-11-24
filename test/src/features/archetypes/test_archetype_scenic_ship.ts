import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeSea,
  createScenicShip,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Scenic vessels supply usable crew positions and carry those positions through an authored turn and swell.
 *
 * Scenarios:
 * 1. For each profile, the hull extends to its authored length, beam, draft and freeboard. Boarding follows an actual port rail opening and faces inboard.
 * 2. The oared ship's eight seat contacts sit on physical benches and face aft. The sail profile places the helm behind three masts. The wheelhouse profile encloses the helm forward of the aft work area.
 * 3. Carry the wheelhouse profile through a calm quarter turn and seeded swell.
 * The boarding surface follows the wave tangent and keeps its distance from the aft deck.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, station and ride cases exercised.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the exported producer's meshes, deck and seat frames, and observes world frames on the public ride.
 * @evidence contracts/development/testing.md#independent-expectations Hull vertex extrema use explicit input dimensions. Projected cylinder intervals bound the clearance and the turn end uses the analytic quarter-circle position and 90-degree axes. The swell preserves rigid distances, adds the independently sampled water elevation and aligns the deck with the gradient normal.
 * @evidence contracts/development/testing.md#distinguishing-cases Three silhouettes, paired rowing banks, and a physical rail opening against a closed opposite rail. The wheelhouse provides noncoincident contacts for the calm and swell integration case. The sea surface test owns the wave spectrum and general frame behavior.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory test discovered by its exported name.
 */
export function test_archetype_scenic_ship(): void {
  const findings: string[] = [];
  for (const [kind, length, beam, draft, freeboard] of [
    ["oared", 20, 4.4, 0.8, 0.65],
    ["squareSail", 44, 9, 2.4, 2.5],
    ["wheelhouse", 19, 5.4, 1.1, 1],
  ] as const) {
    const ship: ReturnType<typeof createScenicShip> = createScenicShip({
      kind,
      length,
      beam,
      draft,
      freeboard,
    });
    const hull: IAutoMovieVector3[] = [];
    for (const part of ship.parts)
      if (part.id.startsWith("hull-") && part.geometry.type === "mesh") {
        const p: readonly number[] = part.geometry.mesh.positions;
        const at: IAutoMovieVector3 | undefined = part.transform?.translation;
        for (let i: number = 0; i < p.length; i += 3)
          hull.push({
            x: p[i]! + (at?.x ?? 0),
            y: p[i + 1]! + (at?.y ?? 0),
            z: p[i + 2]! + (at?.z ?? 0),
          });
      }
    if (
      !nclose(
        Math.max(...hull.map((p: IAutoMovieVector3): number => Math.abs(p.x))),
        beam / 2,
      ) ||
      !nclose(
        Math.min(...hull.map((p: IAutoMovieVector3): number => p.z)),
        -length / 2,
      ) ||
      !nclose(
        Math.max(...hull.map((p: IAutoMovieVector3): number => p.z)),
        length / 2,
      ) ||
      !nclose(
        Math.min(...hull.map((p: IAutoMovieVector3): number => p.y)),
        -draft,
      ) ||
      !nclose(
        Math.max(...hull.map((p: IAutoMovieVector3): number => p.y)),
        freeboard,
      )
    )
      findings.push(`${kind}: hull envelope differs from authored dimensions`);

    const boarding: IAutoMovieAffordance = ship.affordance("boarding");
    const deck: IAutoMovieAffordance = ship.affordance("deck");
    const aft: IAutoMovieAffordance = ship.affordance("aftDeck");
    const helm: IAutoMovieAffordance = ship.affordance("helm");
    if (
      boarding.kind !== "surface" ||
      deck.kind !== "surface" ||
      aft.kind !== "surface" ||
      helm.kind !== "surface" ||
      boarding.width === undefined ||
      boarding.depth === undefined ||
      aft.depth === undefined ||
      helm.depth === undefined
    ) {
      findings.push(`${kind}: a standing contact lacks its surface dimensions`);
      continue;
    }
    if (
      boarding.width < 1 ||
      !nclose(boarding.frame.translation.x + boarding.depth / 2, beam / 2) ||
      !vclose(AutoMovieArchetypeFrame.axis(boarding.frame, "z"), {
        x: -1,
        y: 0,
        z: 0,
      }) ||
      ![boarding, deck, aft, helm].every((contact: typeof boarding): boolean =>
        nclose(contact.frame.translation.y, freeboard),
      )
    )
      findings.push(
        `${kind}: standing contacts do not meet the deck and entry`,
      );

    let oppositeClosed: boolean = false;
    for (const part of ship.parts)
      if (
        /^(rail|post)-/.test(part.id) &&
        part.transform !== null &&
        part.geometry.type === "primitive" &&
        part.geometry.shape.type === "cylinder"
      ) {
        const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          part.transform,
          "y",
        );
        const along: number =
          (Math.abs(axis.z) * part.geometry.shape.height) / 2 +
          Math.sqrt(Math.max(0, 1 - axis.z ** 2)) * part.geometry.shape.radius;
        const at: IAutoMovieVector3 = part.transform.translation;
        if (at.x < 0 && part.id.startsWith("rail-") && Math.abs(at.z) < along)
          oppositeClosed = true;
        if (at.x > 0 && Math.abs(at.z) - along + 1e-6 < boarding.width / 2)
          findings.push(`${kind}: ${part.id} obstructs the boarding gap`);
      }
    if (!oppositeClosed)
      findings.push(`${kind}: opposite rail missing at entry`);

    const seats: IAutoMovieModelPart[] = ship.parts.filter(
      (part: IAutoMovieModelPart): boolean =>
        part.id.startsWith("bench-rower-"),
    );
    if (kind === "oared") {
      if (seats.length !== 8)
        findings.push("oared: missing complete rowing banks");
      for (const row of [0, 1, 2, 3] as const)
        for (const bank of ["port", "starboard"] as const) {
          const id: createScenicShip.Affordance = `rower-${bank}-${row}`;
          const seat: IAutoMovieAffordance = ship.affordance(id);
          const bench: IAutoMovieModelPart | undefined = seats.find(
            (part: IAutoMovieModelPart): boolean => part.id === `bench-${id}`,
          );
          if (
            seat.kind !== "seat" ||
            bench?.geometry.type !== "primitive" ||
            bench.geometry.shape.type !== "box" ||
            bench.transform === null ||
            !nclose(
              seat.frame.translation.y,
              bench.transform.translation.y + bench.geometry.shape.height / 2,
            ) ||
            !nclose(
              seat.frame.translation.z,
              bench.transform.translation.z - bench.geometry.shape.depth / 2,
            ) ||
            !nclose(seat.frame.translation.x, bench.transform.translation.x) ||
            !vclose(AutoMovieArchetypeFrame.axis(seat.frame, "x"), {
              x: 0,
              y: 0,
              z: -1,
            })
          )
            findings.push(`oared: ${id} does not meet its aft bench edge`);
        }
    } else if (
      seats.length !== 0 ||
      ship.affordances.some(
        (contact: (typeof ship.affordances)[number]): boolean =>
          contact.kind === "seat",
      )
    )
      findings.push(`${kind}: exposes oared seats`);

    if (kind === "squareSail") {
      const masts: IAutoMovieModelPart[] = ship.parts.filter(
        (part: IAutoMovieModelPart): boolean => part.id.startsWith("mast-"),
      );
      if (
        masts.length !== 3 ||
        !masts.every(
          (part: IAutoMovieModelPart): boolean =>
            (part.transform?.translation.z ?? -Infinity) >
            helm.frame.translation.z,
        )
      )
        findings.push("square sail: helm is not astern of three masts");
    }
    if (kind === "wheelhouse") {
      const roof: IAutoMovieModelPart | undefined = ship.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === "wheelhouse-roof",
      );
      if (
        roof?.geometry.type !== "primitive" ||
        roof.geometry.shape.type !== "box" ||
        roof.transform === null ||
        Math.abs(helm.frame.translation.z - roof.transform.translation.z) +
          helm.depth / 2 >
          roof.geometry.shape.depth / 2 ||
        aft.frame.translation.z + aft.depth / 2 >=
          roof.transform.translation.z - roof.geometry.shape.depth / 2 ||
        roof.transform.translation.y - roof.geometry.shape.height / 2 <
          freeboard + 2
      )
        findings.push(
          "wheelhouse: helm lacks standing room or overlaps aft deck",
        );
    }

    // The passive ride carries a rigid hull regardless of its profile.
    if (kind !== "wheelhouse") continue;
    const course: AutoMovieArchetypeCourse.ICourse = {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "turn", radius: 25, angle: 90 }],
      cruise: 2,
      startSpeed: 2,
      endSpeed: 2,
    };
    const ride: AutoMovieArchetypeRide.IRide<
      createScenicShip.Affordance,
      createScenicShip.Dimension
    > = AutoMovieArchetypeRide.along(ship, course);
    const calm: typeof ride = AutoMovieArchetypeSea.float(
      ride,
      AutoMovieArchetypeSea.of({ height: 0, seed: 31 }),
    );
    const sea: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of({
      height: 0.7,
      seed: 31,
    });
    const floating: typeof ride = AutoMovieArchetypeSea.float(ride, sea);
    const end: IAutoMovieTransform = calm.frame("boarding", calm.duration);
    if (
      !vclose(end.translation, {
        x: 25,
        y: freeboard,
        z: 25 - boarding.frame.translation.x,
      }) ||
      !vclose(AutoMovieArchetypeFrame.axis(end, "z"), { x: 0, y: 0, z: 1 })
    )
      findings.push(
        `${kind}: calm turn leaves boarding at the wrong heading or position`,
      );

    const seconds: number = ride.duration * 0.4;
    const stillRoot: IAutoMovieVector3 = ride.at(seconds).placement.translation;
    const wetRoot: IAutoMovieVector3 =
      floating.at(seconds).placement.translation;
    const wetBoardingFrame: IAutoMovieTransform = floating.frame(
      "boarding",
      seconds,
    );
    const wetBoarding: IAutoMovieVector3 = wetBoardingFrame.translation;
    const slope: { x: number; z: number } = sea.slope(
      stillRoot.x,
      stillRoot.z,
      seconds,
    );
    const normalLength: number = Math.hypot(slope.x, 1, slope.z);
    const wetAft: IAutoMovieVector3 = floating.frame(
      "aftDeck",
      seconds,
    ).translation;
    if (
      !nclose(
        wetRoot.y - stillRoot.y,
        sea.elevation(stillRoot.x, stillRoot.z, seconds),
      ) ||
      !vclose(AutoMovieArchetypeFrame.axis(wetBoardingFrame, "y"), {
        x: -slope.x / normalLength,
        y: 1 / normalLength,
        z: -slope.z / normalLength,
      }) ||
      !nclose(
        Math.hypot(
          wetBoarding.x - wetAft.x,
          wetBoarding.y - wetAft.y,
          wetBoarding.z - wetAft.z,
        ),
        Math.hypot(
          boarding.frame.translation.x - aft.frame.translation.x,
          boarding.frame.translation.y - aft.frame.translation.y,
          boarding.frame.translation.z - aft.frame.translation.z,
        ),
      )
    )
      findings.push(`${kind}: swell fails to carry the contacts rigidly`);
  }
  TestValidator.equals("ship envelopes and staged contacts", findings, []);
}
