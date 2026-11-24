import {
  AutoMovieArchetypeRefusal,
  createEscalator,
  createMovingWalkway,
  rideEscalator,
  rideMovingWalkway,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The two feet, each read against the support it bears on. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** The established planted-contact tolerance of the support tests, metres. */
const SLIP: number = 0.01;

/** How far a stepping plant's ball may sit off the support it names, metres: the sole's thickness under the ball with the foot rolling over it (provisional). */
const BEAR: number = 0.05;

/** The world placement of each installation: at the origin, facing `+Z`. */
const ORIGIN: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * A rider steps from a fixed landing onto a moving escalator tread, rides
 * it with a hand on the moving handrail through both transition curves,
 * climbs the moving inclined steps, and walks on a moving walkway.
 *
 * Scenarios, on the average man and the small woman:
 * 1. The rider starts on the lower landing, steps onto one horizontal
 *    tread, rides it to the upper horizontal run and steps off onto the
 *    upper landing. Through the lower curve, the incline and the upper
 *    curve, each ankle keeps its place in the tread's frame and the right
 *    wrist its place at the handrail grip above the tread. Stepping on and
 *    off, each planted foot stays still on the support it bears on, and
 *    one foot bears on the landing while the other is on the tread.
 * 2. Standing on an inclined tread, the rider climbs four moving steps up,
 *    with an up escalator and, as authored, against a down one.
 *    Each foot's ankle is still in the moving flight's frame while planted,
 *    and the climb's world displacement is the static climb's plus the
 *    flight's travel, so a climb against the steps at their speed stays
 *    in place in the world. The ride take is also read by the generic
 *    audit, and every heel and toe on a tread lies inside its edges.
 * 3. Climbing up a down escalator is refused unless the author states it,
 *    and the ride of scenario 1 runs down as well as up.
 * 4. On a moving walkway the rider boards from the entry landing, rides
 *    still in the band's frame, and walks against the band. That walk's
 *    world path is the same walk's path on a still band plus the band's
 *    travel, so a walk at the band's speed stays in place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the installations, bodies, supports and checked frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed ankles and wrists against the actual tread, flight and band frames of the rides.
 * @evidence contracts/development/testing.md#independent-expectations The tread, flight and band frames come from the escalator and walkway rides, whose geometry is KONE's published EN 115-1 values. A planted contact moves with its support within the 10 mm support tolerance. A carried plan differs from the same plan on a still support by exactly the support's travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Level runs and both curved transitions, a ride and a climb, with and against the running direction, a refused climb and two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes, rides and Human performances; no host.
 */
export function test_motion_ride_escalator_ride(): void {
  const failures: string[] = [];
  for (const key of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
    escalatorRide(body, key, "up", failures);
    escalatorRide(body, key, "down", failures);
    escalatorClimb(body, `${key} with`, "up", failures);
    escalatorClimb(body, `${key} against`, "down", failures);
    walkwayRide(body, key, failures);
  }
  const down: rideEscalator.IRide = rideEscalator(
    createEscalator({ rise: 3, width: 0.8 }),
    ORIGIN,
    "down",
  );
  let refusal: unknown;
  try {
    rideEscalator.climb(down, "up");
  } catch (error) {
    refusal = error;
  }
  if (
    !(
      refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.axis === "climb.heading"
    )
  )
    failures.push("climbing up a down escalator is not refused");
  if (rideEscalator.climb(down, "up", true) !== down.flight)
    failures.push("an authored climb against the steps is refused");
  TestValidator.equals("escalator and walkway support", failures, []);
}

/** Board one horizontal tread, ride it with a hand on the handrail and step off. */
function escalatorRide(
  body: IAutoMovieMotionHumanBody,
  name: string,
  direction: rideEscalator.Direction,
  failures: string[],
): void {
  const key: string = `${name} ${direction}`;
  const up: boolean = direction === "up";
  const escalator: ReturnType<typeof createEscalator> = createEscalator({
    rise: 3,
    width: 0.8,
  });
  const ride: rideEscalator.IRide = rideEscalator(escalator, ORIGIN, direction);
  const station: number = up ? 0.2 : ride.profile.length - 0.2;
  const tread = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.tread(station, seconds));
  const top: IAutoMovieVector3 = createEscalator.station(
    ride.profile,
    ride.profile.length,
  );
  const lower: IAutoMovieVector3 = { x: 0, y: 0, z: -0.45 };
  const upper: IAutoMovieVector3 = {
    x: 0,
    y: ride.profile.rise,
    z: top.z + 0.45,
  };
  const boarding: IAutoMovieVector3 = up ? lower : upper;
  const alighting: IAutoMovieVector3 = up ? upper : lower;
  const performer: Performer = {
    subject: "a",
    body,
    at: boarding,
    yaw: up ? 0 : 180,
    proficiency: { level: "trained" },
  };
  const props: Props = [
    HumanObject.prop("escalator", escalator, rigid(ORIGIN)),
    HumanObject.prop("step", createEscalator.tread(escalator), tread(0), tread),
  ];
  // The rider boards with the feet centred on the tread.
  const onto: IAutoMovieVector3 = Vector3.add(
    createEscalator.station(ride.profile, station),
    { x: 0, y: 0, z: up ? -centre(body) : centre(body) },
  );
  const board: number = new HumanPerformance({
    seed: "escalator ride",
    performers: [performer],
    props,
    laws: [AutoMovieMotionHumanRide.HumanSurface.supportStep],
    composition: HumanChain.subject("a").registered("supportStep", {
      to: onto,
      onto: "step",
    }).node,
  }).duration;
  // The ride ends as the tread reaches the far level run, that run's whole
  // length short of the comb, so the rider steps off before it dives.
  const seconds: number =
    (ride.profile.length - ride.profile.flat - 0.2) / ride.profile.speed -
    board;
  const film: HumanPerformance = new HumanPerformance({
    seed: "escalator ride",
    performers: [performer],
    props,
    laws: [
      AutoMovieMotionHumanRide.HumanSurface.supportStep,
      AutoMovieMotionHumanRide.HumanSurface.boardRide,
    ],
    composition: HumanChain.subject("a")
      .registered("supportStep", {
        to: onto,
        onto: "step",
      })
      .registered("boardRide", {
        on: "step",
        duration: seconds,
        // The right hand takes the rail on the rider's right: the ascending
        // rider's right rail, the descending rider's left one.
        hands: { right: up ? "rightRail" : "leftRail" },
      })
      .registered("supportStep", {
        to: alighting,
        from: "step",
      }).node,
  });
  const [walk, riding]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  const end: number =
    riding === undefined ? 0 : riding.start + riding.plan.duration;
  if (walk === undefined || riding === undefined) {
    failures.push(`${key}: the boarding walk and ride did not both play`);
    return;
  }
  for (const side of SIDES)
    if (
      Math.abs(
        film.bones("a", 0).get(`${side}Foot`)!.worldPosition.z - boarding.z,
      ) > 0.45
    )
      failures.push(`${key}: the ${side} foot does not start on the landing`);
  const start: number = riding.start;
  const reference: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: local(tread(start), ankle(film, "left", start)),
    right: local(tread(start), ankle(film, "right", start)),
  };
  // The hand takes the rail over the ride's first moments (its reach), then
  // holds it: read from half a second in.
  const held: number = start + 0.5;
  const rail: IAutoMovieVector3 = local(tread(held), wrist(film, held));
  const within = (at: number): string[] =>
    SIDES.flatMap((side: AutoMovieHumanSide): string[] =>
      edge(body, film, side, tread(at), at, ride.profile.pitch, escalator),
    );
  for (const side of within(start)) failures.push(`${key}: riding, ${side}`);
  clean(key, film, failures);
  for (let i: number = 0; i <= 12; ++i) {
    const at: number = start + (end - 0.05 - start) * (i / 12);
    const frame: IAutoMovieRigidTransform = tread(at);
    for (const side of SIDES) {
      const drift: number = Vector3.distance(
        local(frame, ankle(film, side, at)),
        reference[side],
      );
      if (drift > SLIP)
        failures.push(
          `${key}: the ${side} ankle slips ${drift.toFixed(3)} m on the tread at ${at.toFixed(2)} s`,
        );
    }
    const hand: number = Vector3.distance(local(frame, wrist(film, at)), rail);
    if (at >= held && hand > SLIP)
      failures.push(
        `${key}: the right wrist leaves the handrail grip by ${hand.toFixed(3)} m at ${at.toFixed(2)} s`,
      );
  }
  if (Math.abs(tread(end).position.y - alighting.y) > 1e-9)
    failures.push(`${key}: the ride does not reach the far run`);

  // Stepping on and off: a plant on the tread moves on it no more than the
  // walk's own plants on the fixed landing move on that, and one foot bears
  // on the landing while the other is on the tread.
  let mixed: boolean = false;
  let landing: number = 0;
  let treadDrift: number = 0;
  let lift: number = 0;
  for (const step of film
    .segments("a")
    .filter(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "supportStep",
    )) {
    const plants: readonly IAutoMovieMotionHumanContactWindow[] =
      step.plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.kind === "plant",
      );
    for (const window of plants) {
      const side: AutoMovieHumanSide =
        window.part === "leftFoot" ? "left" : "right";
      // The ball is the sole point a plant holds from foot-flat to toe-off.
      const span: number = (window.to - window.from) * step.plan.duration;
      const from: number =
        step.start + window.from * step.plan.duration + 0.3 * span;
      const to: number =
        step.start + window.from * step.plan.duration + 0.9 * span;
      const onTread: boolean = window.support.kind === "prop";
      const frameAt = (at: number): IAutoMovieRigidTransform =>
        onTread ? tread(at) : rigid(ORIGIN);
      const drift: number = Vector3.distance(
        local(frameAt(from), ball(body, film, side, from)),
        local(frameAt(to), ball(body, film, side, to)),
      );
      // The landing a ground plant bears on is the one the step starts or
      // ends at: the one nearer the ball.
      const sole: IAutoMovieVector3 = ball(body, film, side, from);
      const height: number = onTread
        ? local(tread(from), sole).y
        : Math.min(
            Math.abs(sole.y - boarding.y),
            Math.abs(sole.y - alighting.y),
          );
      lift = Math.max(lift, Math.abs(height));
      if (onTread) {
        treadDrift = Math.max(treadDrift, drift);
        for (const crossing of edge(
          body,
          film,
          side,
          tread(from),
          from,
          ride.profile.pitch,
          escalator,
        ))
          failures.push(`${key}: stepping, ${crossing}`);
      } else {
        landing = Math.max(landing, drift);
        for (const crossing of edge(
          body,
          film,
          side,
          tread(from),
          from,
          ride.profile.pitch,
          escalator,
          false,
        ))
          failures.push(`${key}: stepping, ${crossing}`);
      }
      mixed ||= plants.some(
        (other: IAutoMovieMotionHumanContactWindow): boolean =>
          other.part !== window.part &&
          other.support.kind !== window.support.kind &&
          other.from < window.to &&
          window.from < other.to,
      );
    }
  }
  if (treadDrift > landing + SLIP)
    failures.push(
      `${key}: a plant slips ${treadDrift.toFixed(3)} m on the tread against ${landing.toFixed(3)} m on the landing`,
    );
  if (lift > BEAR)
    failures.push(
      `${key}: a stepping plant's ball is ${lift.toFixed(3)} m off the support it names`,
    );
  if (!mixed)
    failures.push(
      `${key}: no instant bears one foot on the landing and one on the tread`,
    );
}

/**
 * Climb four moving steps up the incline from an inclined tread, with the
 * steps or, as the author asks, against them.
 */
function escalatorClimb(
  body: IAutoMovieMotionHumanBody,
  key: string,
  direction: rideEscalator.Direction,
  failures: string[],
): void {
  const escalator: ReturnType<typeof createEscalator> = createEscalator({
    rise: 4,
    width: 0.8,
  });
  const ride: rideEscalator.IRide = rideEscalator(escalator, ORIGIN, direction);
  const { pitch, angle, flat, lower }: createEscalator.IProfile = ride.profile;
  const station: number = flat + lower * angle + 2 * pitch;
  const floor: IAutoMovieVector3 = createEscalator.station(
    ride.profile,
    station,
  );
  const flight: ReturnType<typeof rideEscalator.climb> = rideEscalator.climb(
    ride,
    "up",
    direction === "down",
  );
  const nosing: number = floor.z + (pitch * Math.cos(angle)) / 2;
  // The toes' reach along +Z on the entered stance sets the first nosing's distance.
  const standing: HumanPerformance = new HumanPerformance({
    seed: "escalator climb",
    performers: [
      {
        subject: "a",
        body,
        at: { ...floor, z: floor.z - 0.02 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 0.1 }).node,
  });
  const toes: number = Math.max(
    ...SIDES.map((side: AutoMovieHumanSide): number => {
      const foot: IAutoMovieResolvedBone = standing
        .bones("a", 0)
        .get(`${side}Foot`)!;
      return HumanFoot.point(body, side, "toe", {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      }).z;
    }),
  );
  const perform = (moving: boolean): HumanPerformance =>
    new HumanPerformance({
      seed: "escalator climb",
      performers: [
        {
          subject: "a",
          body,
          at: { ...floor, z: floor.z - 0.02 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        moving
          ? HumanObject.prop(
              "flight",
              escalator,
              rigid(flight(0)),
              (seconds: number): IAutoMovieRigidTransform =>
                rigid(flight(seconds)),
            )
          : HumanObject.prop("flight", escalator, rigid(flight(0))),
      ],
      composition: HumanChain.subject("a").climbStairs({
        count: 4,
        riser: pitch * Math.sin(angle),
        tread: pitch * Math.cos(angle),
        start: Math.max(0.01, nosing - toes),
        on: "flight",
      }).node,
    });
  const moving: HumanPerformance = perform(true);
  const still: HumanPerformance = perform(false);
  const climb: IAutoMovieMotionHumanSegment = moving.segments("a")[0]!;
  for (let i: number = 1; i < 12; ++i) {
    const at: number = climb.start + (climb.plan.duration * i) / 12;
    const travel: IAutoMovieVector3 = Vector3.subtract(
      rigid(flight(at)).position,
      rigid(flight(0)).position,
    );
    for (const side of SIDES) {
      const offset: number = Vector3.distance(
        Vector3.subtract(ankle(moving, side, at), travel),
        ankle(still, side, at),
      );
      if (offset > SLIP)
        failures.push(
          `${key}: the ${side} ankle on the moving flight is ${offset.toFixed(3)} m off the carried climb at ${at.toFixed(2)} s`,
        );
    }
  }
  for (const window of climb.plan.contacts)
    if (window.kind === "plant") {
      const span: number = (window.to - window.from) * climb.plan.duration;
      const from: number =
        climb.start + window.from * climb.plan.duration + 0.3 * span;
      const to: number =
        climb.start + window.from * climb.plan.duration + 0.9 * span;
      const side: AutoMovieHumanSide = window.part.startsWith("left")
        ? "left"
        : "right";
      const drift: number = Vector3.distance(
        local(rigid(flight(from)), ball(body, moving, side, from)),
        local(rigid(flight(to)), ball(body, moving, side, to)),
      );
      if (drift > SLIP)
        failures.push(
          `${key}: the planted ${side} ankle slips ${drift.toFixed(3)} m on the moving steps`,
        );
    }
}

/** Board a moving walkway, ride it and walk against its band. */
function walkwayRide(
  body: IAutoMovieMotionHumanBody,
  key: string,
  failures: string[],
): void {
  const walkway: ReturnType<typeof createMovingWalkway> = createMovingWalkway({
    length: 12,
    width: 1,
  });
  const ride: rideMovingWalkway.IRide = rideMovingWalkway(walkway, ORIGIN, {
    speed: 0.65,
  });
  const band = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.belt(seconds));
  // The walk against the band is aimed at the same band-local point in
  // both takes: on the moving band its world target at the walk's start
  // has travelled with the band.
  const perform = (moving: boolean, shift: number): HumanPerformance =>
    new HumanPerformance({
      seed: "walkway",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: -0.45 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        moving
          ? HumanObject.prop(
              "band",
              createMovingWalkway.belt(walkway),
              band(0),
              band,
            )
          : HumanObject.prop(
              "band",
              createMovingWalkway.belt(walkway),
              band(0),
            ),
      ],
      composition: HumanChain.subject("a")
        .walk({ to: { x: 0, y: 0, z: 0.6 }, on: { prop: "band" } })
        .stand({ hold: 1.5, on: { prop: "band" } })
        .walk({
          to: { x: 0, y: 0, z: 0.1 + shift },
          face: 180,
          on: { prop: "band" },
        }).node,
    });
  const still: HumanPerformance = perform(false, 0);
  const against: number = still.segments("a")[2]!.start;
  const moving: HumanPerformance = perform(
    true,
    band(against).position.z - band(0).position.z,
  );
  const standing: IAutoMovieMotionHumanSegment | undefined =
    moving.segments("a")[1];
  const settled: number = standing!.start + standing!.plan.duration;
  for (const side of SIDES) {
    const first: IAutoMovieVector3 = local(
      band(standing!.start),
      ankle(moving, side, standing!.start),
    );
    const last: IAutoMovieVector3 = local(
      band(settled),
      ankle(moving, side, settled),
    );
    if (Vector3.distance(first, last) > SLIP)
      failures.push(`${key}: the ${side} ankle slips on the riding band`);
  }
  const span: number = Math.min(moving.duration, still.duration);
  for (let i: number = 1; i <= 10; ++i) {
    const at: number = (span * i) / 10;
    const travel: number = band(at).position.z - band(0).position.z;
    const hips: number =
      moving.bones("a", at).get("hips")!.worldPosition.z -
      travel -
      still.bones("a", at).get("hips")!.worldPosition.z;
    if (Math.abs(hips) > SLIP)
      failures.push(
        `${key}: the walkway rider is ${hips.toFixed(3)} m off the carried path at ${at.toFixed(2)} s`,
      );
  }
}

/** One performer as a performance takes it. */
type Performer = ConstructorParameters<
  typeof HumanPerformance
>[0]["performers"][number];

/** A performance's props. */
type Props = ConstructorParameters<typeof HumanPerformance>[0]["props"];

/** A world transform in the rigid form a prop takes. */
function rigid(transform: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: transform.translation, rotation: transform.rotation };
}

/** A world point in a support's frame. */
function local(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}

/** The displayed ankle of one foot. */
function ankle(
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  at: number,
): IAutoMovieVector3 {
  return film.bones("a", at).get(`${side}Foot`)!.worldPosition;
}

/** The displayed ball of one foot's sole. */
function ball(
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  at: number,
): IAutoMovieVector3 {
  return HumanFoot.sockets(body, film.bones("a", at), side).find(
    (socket: ReturnType<typeof HumanFoot.sockets>[number]): boolean =>
      socket.socket === "ball",
  )!.point;
}

/**
 * Where a foot's heel or toe lies across one tread's edge: off the tread for
 * a foot on it, on the tread for a foot beside it on a landing.
 */
function edge(
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  frame: IAutoMovieRigidTransform,
  at: number,
  pitch: number,
  escalator: ReturnType<typeof createEscalator>,
  on: boolean = true,
): string[] {
  const foot: IAutoMovieResolvedBone = film.bones("a", at).get(`${side}Foot`)!;
  const out: string[] = [];
  for (const point of ["heel", "toe"] as const) {
    const where: IAutoMovieVector3 = local(
      frame,
      HumanFoot.point(body, side, point, {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      }),
    );
    const off: boolean =
      Math.abs(where.z) > pitch / 2 ||
      Math.abs(where.x) > escalator.dimensions.width! / 2;
    if (off === on)
      out.push(
        `the ${side} ${point} lies ${on ? "off" : "on"} the tread at (${where.x.toFixed(3)}, ${where.z.toFixed(3)}) m at ${at.toFixed(2)} s`,
      );
  }
  return out;
}

/**
 * How far ahead of where a body stands its feet's midpoint between heel and
 * toe lies, metres: where a stand aims so the feet are centred on a tread.
 */
function centre(body: IAutoMovieMotionHumanBody): number {
  const film: HumanPerformance = new HumanPerformance({
    seed: "escalator stance",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 0.1 }).node,
  });
  let sum: number = 0;
  for (const side of SIDES) {
    const foot: IAutoMovieResolvedBone = film.bones("a", 0).get(`${side}Foot`)!;
    for (const point of ["heel", "toe"] as const)
      sum += HumanFoot.point(body, side, point, {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      }).z;
  }
  return sum / 4;
}

/** The displayed right wrist. */
function wrist(film: HumanPerformance, at: number): IAutoMovieVector3 {
  return film.bones("a", at).get("rightHand")!.worldPosition;
}

/**
 * The shipped take verdicts over a take, as a complaint.
 *
 * @param label What the take is.
 * @param take The take.
 * @param failures Where a fault is recorded.
 */
function clean(
  label: string,
  take: HumanPerformance,
  failures: string[],
): void {
  try {
    assertTakeClean(label, take);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
