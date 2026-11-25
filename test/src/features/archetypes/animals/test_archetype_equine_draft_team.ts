import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineTeam,
  type AutoMovieArchetypeEquineTeamPlan,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createCart,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../internal/archetypeHorseRide";

/** A team's sample. */
type Sample = AutoMovieArchetypeEquineTeamPlan.ISample<
  createCart.Affordance,
  createCart.Dimension
>;

/** A trunk capsule's two axis ends and its radius. */
type Bar = readonly [IAutoMovieVector3, IAutoMovieVector3, number];

/** A team. */
type Team = AutoMovieArchetypeEquineTeamPlan.ITeam<
  createCart.Affordance,
  createCart.Dimension
>;

/**
 * Teams of harnessed horses draw one pole vehicle, each horse on its own path in its place, joined to the vehicle by spans that stay on its parts.
 *
 * Scenarios:
 * 1. A pair on a chariot through a 90 degree left turn of 12 m: over the turn the outside horse's displayed trunk travels farther than the inside one's in the ratio of their radii, 12.4 to 11.6 m, within 1 %.
 * 2. Every span starts on its horse's posed point of draft, a rein on its bit ring, and ends on a point fixed in the vehicle's own frame, at every sampled second, for the pair and for a four-in-hand on a brougham.
 * 3. Every hoof of every horse stays planted through its stances, sliding no more than a micrometre, and no two horses' trunks come within their two barrels' radii of each other.
 * 4. Braking to the end, the wheelers' breeching holds and every trace slackens; before it every trace is straight.
 * 5. Sampling the same second twice gives the same team, and a turn the inside horse's walk cannot follow is refused with its least radius.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public team and reads every horse's posed parts, the vehicle's placement and the laid spans; a horse dragged rigidly, a span off its ends, a sliding hoof, touching horses or a wrong brake state is caught.
 * @evidence contracts/development/testing.md#independent-expectations The radius ratio comes from the authored turn and spacing; span ends are tested for rigidity in the vehicle's own frame and against the posed draft balls, not against the planner's points; hoof slip uses the shared ride reader.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair and a four-in-hand, a straight and a turn, drawing and braking, an admitted turn against a refused one; a single horse's draft belongs to test_archetype_equine_draft.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_draft_team(): void {
  const horse = (
    seed: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > => createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, seed);
  const base: AutoMovieArchetypeEquineTeamPlan.IParams = {
    hitch: "pair",
    spacing: 0.8,
    length: 3,
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 6 },
      { kind: "turn", radius: 12, angle: 90 },
      { kind: "straight", length: 6 },
    ],
    cruise: 1.4,
    rate: 2,
    gait: "walk",
    trace: 2.6,
    stop: true,
    sag: 0.06,
  };
  const issues: string[] = [];
  const pair: Team = AutoMovieArchetypeEquineTeam(
    [horse(1), horse(2)],
    createCart({ kind: "chariot", withersHeight: 1.6 }, 1),
    base,
  );
  inspect("pair", pair);

  // 1. The outside horse travels farther in proportion to its radius.
  const turn = (k: number): number => {
    let travelled: number = 0;
    let last: IAutoMovieVector3 | null = null;
    for (
      let seconds: number = 6 / 1.4;
      seconds <= 6 / 1.4 + (12 * Math.PI) / 2 / 1.4;
      seconds += 0.05
    ) {
      const at: IAutoMovieVector3 = trunk(pair.at(seconds).horses[k]!);
      if (last !== null) travelled += Math.hypot(at.x - last.x, at.z - last.z);
      last = at;
    }
    return travelled;
  };
  const ratio: number = turn(1) / turn(0);
  if (Math.abs(ratio / (12.4 / 11.6) - 1) > 0.01)
    issues.push(`outside over inside ${ratio}, expected ${12.4 / 11.6}`);

  // 2-4 for a four-in-hand on a brougham.
  const four: Team = AutoMovieArchetypeEquineTeam(
    [horse(1), horse(2), horse(3), horse(4)],
    createCart({ kind: "carriage" }, 1),
    {
      ...base,
      hitch: "fourInHand",
      legs: [
        { kind: "straight", length: 8 },
        { kind: "turn", radius: 15, angle: -45 },
        { kind: "straight", length: 8 },
      ],
    },
  );
  inspect("four-in-hand", four);

  // 5. Replay and an over-tight turn.
  if (
    JSON.stringify(pair.at(5.37).lines) !== JSON.stringify(pair.at(5.37).lines)
  )
    issues.push("the same second replays differently");
  let refused: unknown = null;
  try {
    AutoMovieArchetypeEquineTeam(
      [horse(1), horse(2)],
      createCart({ kind: "chariot", withersHeight: 1.6 }, 1),
      {
        ...base,
        legs: [
          base.legs[0]!,
          { kind: "turn", radius: 1.5, angle: 90 },
          base.legs[2]!,
        ],
      },
    );
  } catch (error) {
    refused = error;
  }
  if (
    !(
      refused instanceof AutoMovieArchetypeRefusal &&
      refused.axis === "legs[1].radius" &&
      refused.feasible?.kind === "range" &&
      (refused.feasible.minimum ?? 0) > 1.5
    )
  )
    issues.push(
      `the over-tight turn was not refused with its radius: ${String(refused)}`,
    );
  TestValidator.equals(
    "a team keeps its places, spans, footing and brakes",
    issues,
    [],
  );

  /** Spans, hooves, spacing and states of one team. */
  function inspect(label: string, team: Team): void {
    const fixed: Map<string, IAutoMovieVector3> = new Map();
    for (let seconds: number = 0.2; seconds < team.duration; seconds += 0.4) {
      const sample: Sample = team.at(seconds);
      const braking: boolean = seconds >= team.brake;
      if (sample.stage !== (braking ? "brake" : "pull"))
        issues.push(`${label} ${seconds}: stage ${sample.stage}`);
      team.places.forEach(
        (place: AutoMovieArchetypeEquineTeamPlan.IPlace, k: number): void => {
          if (sample.breeching[k] !== (braking && place.role === "wheeler"))
            issues.push(
              `${label} ${seconds}: horse ${k} breeching ${sample.breeching[k]}`,
            );
        },
      );
      for (const line of sample.lines) {
        const k: number = Number(
          line.id.split("-").at(-2) === "strap"
            ? line.id.split("-").at(-1)
            : line.id.split("-")[1],
        );
        const start: IAutoMovieVector3 = line.points[0]!;
        const balls: IAutoMovieVector3[] = (
          line.id.startsWith("rein")
            ? ["bit-left", "bit-right"]
            : ["draft-left", "draft-right"]
        ).map((id: string): IAutoMovieVector3 => world(sample.horses[k]!, id));
        if (
          Math.min(
            ...balls.map((ball: IAutoMovieVector3): number =>
              Vector3.distance(ball, start),
            ),
          ) > 1e-9
        )
          issues.push(
            `${label} ${seconds}: ${line.id} leaves its horse's point of draft`,
          );
        const local: IAutoMovieVector3 = inverse(
          sample.placement,
          line.points.at(-1)!,
        );
        const known: IAutoMovieVector3 | undefined = fixed.get(line.id);
        if (known === undefined) fixed.set(line.id, local);
        else if (Vector3.distance(known, local) > 1e-9)
          issues.push(`${label} ${seconds}: ${line.id} slides on the vehicle`);
        const straight: boolean = line.points.length === 2;
        if (line.id.startsWith("trace") && straight === braking)
          issues.push(
            `${label} ${seconds}: ${line.id} is ${straight ? "taut" : "slack"} while ${sample.stage}`,
          );
      }
      for (let i: number = 0; i < sample.horses.length; i++)
        for (let j: number = i + 1; j < sample.horses.length; j++) {
          const gap: number = capsules(sample.horses[i]!, sample.horses[j]!);
          if (gap < 0)
            issues.push(
              `${label} ${seconds}: horses ${i} and ${j} overlap by ${-gap} m`,
            );
        }
    }
    team.rides.forEach(
      (
        ride: AutoMovieArchetypeRide.IRide<
          AutoMovieArchetypeEquine.Affordance,
          AutoMovieArchetypeEquine.Dimension
        >,
        k: number,
      ): void => {
        const slid: ReturnType<typeof archetypeHorseRide.slide> =
          archetypeHorseRide.slide(ride);
        if (slid.worst > 1e-6)
          issues.push(
            `${label}: horse ${k} slides ${slid.worst} m (${slid.at})`,
          );
      },
    );
    if (fixed.size === 0) issues.push(`${label}: no spans laid`);
  }
}

/** A posed part's world origin. */
function world(
  sample: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  id: string,
): IAutoMovieVector3 {
  return AutoMovieArchetypeFrame.compose(
    sample.placement,
    sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === id,
    )!.transform!,
  ).translation;
}

/** The trunk's world centre. */
function trunk(
  sample: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
): IAutoMovieVector3 {
  return world(sample, "trunk");
}

/** A world point in a placement's own frame. */
function inverse(
  placement: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(placement.rotation),
    Vector3.subtract(point, placement.translation),
  );
}

/** The clearance between two horses' trunk capsules, metres. */
function capsules(
  a: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  b: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
): number {
  const axis = (
    sample: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
  ): Bar => {
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === "trunk",
    )!;
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "capsule"
    )
      throw new Error("no trunk capsule");
    const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      sample.placement,
      part.transform!,
    );
    const half: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: part.geometry.shape.height / 2,
      z: 0,
    });
    return [
      Vector3.subtract(frame.translation, half),
      Vector3.add(frame.translation, half),
      part.geometry.shape.radius,
    ];
  };
  const [p0, p1, r] = axis(a);
  const [q0, q1, s] = axis(b);
  let least: number = Infinity;
  for (let i: number = 0; i <= 20; i++) {
    const p: IAutoMovieVector3 = Vector3.lerp(p0, p1, i / 20);
    const d: IAutoMovieVector3 = Vector3.subtract(q1, q0);
    const t: number = Math.max(
      0,
      Math.min(1, Vector3.dot(Vector3.subtract(p, q0), d) / Vector3.dot(d, d)),
    );
    least = Math.min(
      least,
      Vector3.distance(p, Vector3.add(q0, Vector3.scale(d, t))),
    );
  }
  return least - r - s;
}
