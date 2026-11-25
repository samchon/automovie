import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypePassage,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { AutoMovieComposition, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../internal/assertTakeClean";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride along a course. */
type Ride = ReturnType<typeof rideHorse>;

/** A performer as the performance takes it. */
type Performer = ConstructorParameters<
  typeof HumanPerformance
>[0]["performers"][number];

/** A seat a rider sits on. */
type Seat = ReturnType<typeof HumanObject.seat>;

/** Seconds the staged mount takes to reach the saddle. */
const MOUNT_CLIMB: number = 4;

/** Seconds the riders stay in the saddle before the horses set off. */
const SEATED_HOLD: number = 0.5;

/** Seconds both horses stand through the climb and the seated hold. */
const MOUNT_WAIT: number = MOUNT_CLIMB + SEATED_HOLD;

/** The rider attachment contract's 10 mm contact budget, metres. */
const CONTACT: number = 0.01;

/** Metres between the two pairs' lanes: an authored staging choice. */
const LANES: number = 3;

/** Metres the groom leads the first horse on foot. */
const LEAD: number = 5;

/** Samples of the groom's rehearsed walk the led course is matched to. */
const SAMPLES: number = 120;

/**
 * A mixed mounted and on-foot reset: two pairs ride in and halt on their own marks, the first rider dismounts on an addressed cue and a named groom takes its horse's lead, while the second pair stays mounted.
 *
 * Scenarios:
 *
 * 1. The second rider keeps the seat within the contact budget through the first rider's dismount and the groom's lead.
 * 2. The first rider stands on the ground after the cue, and the groom's hand holds the first horse's lead.
 * 3. Each performer keeps its own identity and segment order, and a repeated read of the same second agrees.
 * 4. A groom staged out of reach of the lead refuses with `leadReach`, and a groom route across the mounted pair's lane is refused by the passage with both named.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cast, the cue and the four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Composes `sit`, the registered `ride`, `rise`, `walk` and the `leadHorse` overlay through `HumanPerformance` on two real horse rides and reads displayed bones and tack frames.
 * @evidence contracts/development/testing.md#independent-expectations The contact budget is the rider attachment contract's 10 mm. A dismounted rider's hips stand below the saddle's seat. Pure sampling repeats. The groom's crossing route passes through the mounted pair's standing mark while it stands.
 * @evidence contracts/development/testing.md#distinguishing-cases An addressed dismount against an unaffected mounted pair, a lead in reach and out of reach, and a refused groom crossing.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec through the public performance path.
 */
export function test_motions_mounted_reset(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const take: ITake = stage(body, 0);
  assertTakeClean("mounted reset", take.film);

  // 1. The second rider stays seated.
  const offsets: number[] = take.window.map((at: number): number =>
    Vector3.distance(
      take.film.bones("riderB", at).get("hips")!.worldPosition,
      take.part("horseB", "seat", at).translation,
    ),
  );
  TestValidator.predicate(
    `the second rider keeps the seat through the reset: ${offsets.map((d: number): string => d.toFixed(4)).join(",")}`,
    Math.max(...offsets) - Math.min(...offsets) <= CONTACT,
  );

  // 2. The first rider stands and the groom holds the lead.
  const overlay: IAutoMovieMotionHumanSegment = take.film.overlays("groom")[0]!;
  const middle: number = (overlay.start + overlay.end) / 2;
  const hand: IAutoMovieVector3 = take.film
    .bones("groom", middle)
    .get("rightHand")!.worldPosition;
  const rope: IAutoMovieVector3 = take.part(
    "horseA",
    "lead",
    middle,
  ).translation;
  TestValidator.predicate(
    `the first rider stands on the ground below the saddle after the cue: hips ${take.film.bones("riderA", middle).get("hips")!.worldPosition.y} seat ${take.part("horseA", "seat", middle).translation.y} at ${middle} segments ${JSON.stringify(take.film.segments("riderA").map((s: IAutoMovieMotionHumanSegment): number[] => [s.start, s.end]))}`,
    take.film.bones("riderA", middle).get("hips")!.worldPosition.y <
      take.part("horseA", "seat", middle).translation.y - 0.3,
  );
  TestValidator.predicate(
    `the groom's hand holds the first horse's lead: ${Vector3.distance(hand, rope)}`,
    Vector3.distance(hand, rope) <= 0.1,
  );

  // 3. Identities and repeatable reads.
  TestValidator.equals(
    "each performer keeps its own segments",
    ["riderA", "riderB", "groom"].map(
      (subject: string): number => take.film.segments(subject).length,
    ),
    [4, 2, 2],
  );
  TestValidator.equals(
    "a repeated read agrees",
    [...take.film.bones("groom", middle).entries()],
    [...take.film.bones("groom", middle).entries()],
  );

  // 4. Refusals.
  let bad: unknown = null;
  try {
    const far: ITake = stage(body, 0.88);
    const lead: IAutoMovieMotionHumanSegment = far.film.overlays("groom")[0]!;
    far.film.bones("groom", (lead.start + lead.end) / 2);
  } catch (failure) {
    bad = failure;
  }
  TestValidator.predicate(
    "a groom out of reach of the lead refuses with leadReach",
    bad instanceof HumanRefusal && bad.axis === "leadReach",
  );
  const crossing: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("reset", {
      participants: [
        {
          id: "horseB",
          plan: take.rides.horseB.plan,
          footprint: AutoMovieArchetypePassage.footprint(take.horse),
          margin: 0.5,
        },
        {
          id: "groom",
          plan: AutoMovieArchetypeCourse.timed("groom", [
            { seconds: 0, x: -2, y: 0, z: 0 },
            { seconds: 2, x: LANES + 2, y: 0, z: 0 },
          ]),
          footprint: { outline: [{ x: 0, y: 0, z: 0 }], radius: 0.3 },
          margin: 0,
        },
      ],
      step: 0.1,
    });
  TestValidator.predicate(
    "a groom route across the mounted pair's lane is refused with both named",
    crossing.length > 0 &&
      crossing[0]!.subject === "horseB" &&
      crossing[0]!.other === "groom",
  );
}

/** One staged reset. */
interface ITake {
  /** The performance on the film clock. */
  film: HumanPerformance;

  /** The horse model both pairs ride. */
  horse: Horse;

  /** Each horse's ride. */
  rides: IRides;

  /** A horse's tack frame at a film second. */
  part: (horse: string, id: string, at: number) => IAutoMovieTransform;

  /** Film seconds from the halt through the groom's lead. */
  window: number[];
}

/** The two horses' rides. */
interface IRides {
  /** The first pair's ride, to its halt. */
  horseA: Ride;

  /** The second pair's ride, to its halt. */
  horseB: Ride;
}

/** The led ride, laid once the groom's walk is rehearsed, and the film second it starts. */
interface ILed {
  /** The led ride; absent until rehearsed. */
  ride?: Ride;

  /** Film second the led ride starts. */
  start: number;
}

/** Which ride carries a horse and the second on its clock. */
interface ITrack {
  /** The ride sampled. */
  ride: Ride;

  /** Seconds on the ride's clock. */
  local: number;
}

/** A straight trapezoidal course matched to a walker's progress. */
interface IMatched {
  /** Metres walked. */
  length: number;

  /** The steady speed, m/s. */
  cruise: number;

  /** The start's acceleration, m/s². */
  acceleration: number;

  /** The stop's deceleration, m/s². */
  deceleration: number;
}

/** Stage the reset with the groom standing `aside` metres outside its place beside the lead. */
function stage(body: IAutoMovieMotionHumanBody, aside: number): ITake {
  const horse: Horse = createHorse(
    { withersHeight: 1.72, stirrupDrop: 0.66, tempo: 0 },
    5,
  );
  const course: (x: number) => Ride = (x: number): Ride =>
    rideHorse(
      horse,
      {
        start: { x, z: 0, heading: 0 },
        cruise: 1.5,
        startSpeed: 0,
        endSpeed: 0,
        acceleration: 1.6,
        deceleration: 1.6,
        startFromStanding: true,
        legs: [{ kind: "straight", length: 6 }],
      },
      "walk",
    );
  const rides: IRides = { horseA: course(0), horseB: course(LANES) };
  const halted: number = MOUNT_WAIT + rides.horseA.duration;
  const resting: IAutoMovieTransform = rides.horseA.frame(
    "lead",
    rides.horseA.duration,
  );
  const groomAt: IAutoMovieVector3 = {
    x: resting.translation.x + 0.3 + aside,
    y: 0,
    z: resting.translation.z - 0.4,
  };
  const handoff: number = halted + 3;
  const cues: Record<string, IAutoMovieScheduleCue[]> = {
    stage: [{ name: "handoff", seconds: handoff }],
  };
  const led: ILed = { start: Infinity };
  const track: (name: string, at: number) => ITrack = (
    name: string,
    at: number,
  ): ITrack =>
    name === "horseA" && led.ride !== undefined && at >= led.start
      ? { ride: led.ride, local: Math.min(led.ride.duration, at - led.start) }
      : {
          ride: name === "horseA" ? rides.horseA : rides.horseB,
          local: Math.max(0, Math.min(rides.horseA.duration, at - MOUNT_WAIT)),
        };
  const place: (name: string) => (at: number) => IAutoMovieRigidTransform =
    (name: string) =>
    (at: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = track(name, at).ride.at(
        track(name, at).local,
      ).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
  const part: (name: string, id: string, at: number) => IAutoMovieTransform = (
    name: string,
    id: string,
    at: number,
  ): IAutoMovieTransform =>
    track(name, at).ride.frame(
      id as Parameters<Ride["frame"]>[0],
      track(name, at).local,
    );
  const saddles: Seat[] = ["horseA", "horseB"].map(
    (name: string): Seat =>
      HumanObject.seat(
        (name === "horseA" ? rides.horseA : rides.horseB).at(0).archetype,
        place(name)(0),
      ),
  );
  const performers: Performer[] = [
    ...saddles.map(
      (saddle: Seat, k: number): Performer => ({
        subject: k === 0 ? "riderA" : "riderB",
        body,
        at: HumanFrame.point(
          { origin: { ...saddle.at, y: 0 }, yaw: saddle.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: saddle.yaw,
        proficiency: { level: "trained" },
      }),
    ),
    {
      subject: "groom",
      body,
      at: { x: groomAt.x + 2, y: 0, z: groomAt.z - 3 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
  ];
  const feet = { left: "leftStirrup", right: "rightStirrup" };
  const riderA = HumanChain.subject("riderA")
    .sit({ seat: saddles[0]!, hold: SEATED_HOLD })
    .registered("ride", { on: "horseA", duration: halted, seat: "seat", feet })
    .rise({})
    .walk({ to: { x: -3, y: 0, z: groomAt.z - 2 } });
  const riderB = HumanChain.subject("riderB")
    .sit({ seat: saddles[1]!, hold: SEATED_HOLD })
    .registered("ride", {
      on: "horseB",
      duration: handoff + 40,
      seat: "seat",
      feet,
    });
  // The groom's chain, its lead overlaid before the walk is synced to the handoff.
  const groom = (leading: boolean) => {
    const walk = HumanChain.subject("groom")
      .walk({ to: groomAt, face: 0 })
      .walk({ to: { ...groomAt, z: groomAt.z + LEAD } });
    return (
      leading
        ? walk.over((handler) =>
            handler.registered("leadHorse", {
              on: "horseA",
              hand: "right",
              duration: 0.79 * LEAD,
              transition: 0.4,
            }),
          )
        : walk
    ).sync({ of: "stage", event: "handoff" });
  };
  const perform: (leading: boolean) => HumanPerformance = (
    leading: boolean,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "mounted-reset",
      performers,
      cues,
      laws: [
        AutoMovieMotionHumanMount.rideHorse.ride,
        AutoMovieMotionHumanMount.leadHorse,
      ],
      props: ["horseA", "horseB"].map((name: string) =>
        HumanObject.prop(
          name,
          horse,
          place(name)(0),
          place(name),
          (id: string, at: number) => part(name, id, at),
        ),
      ),
      composition: AutoMovieComposition.parallel(
        riderA.node,
        riderB.node,
        groom(leading).node,
      ),
    });

  // The led horse follows the groom's rehearsed walk: its course matches the hips' displayed progress.
  // The handoff follows the first rider's rehearsed dismount; the groom's walk is then rehearsed on that cue.
  cues.stage = [
    {
      name: "handoff",
      seconds: perform(false).segments("riderA")[2]!.end + 0.5,
    },
  ];
  const rehearsal: HumanPerformance = perform(false);
  const walking: IAutoMovieMotionHumanSegment = rehearsal
    .segments("groom")
    .at(-1)!;
  const span: number = (walking.end - walking.start) / SAMPLES;
  const hips: (at: number) => number = (at: number): number =>
    rehearsal.bones("groom", at).get("hips")!.worldPosition.z;
  const progress: number[] = Array.from(
    { length: SAMPLES + 1 },
    (_: unknown, i: number): number =>
      hips(walking.start + i * span) - hips(walking.start),
  );
  const matched: IMatched = match(progress, span);
  led.start = walking.start;
  led.ride = rideHorse(
    horse,
    {
      start: {
        x: 0,
        z: rides.horseA.at(rides.horseA.duration).placement.translation.z,
        heading: 0,
      },
      cruise: matched.cruise,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: matched.acceleration,
      deceleration: matched.deceleration,
      startFromStanding: true,
      legs: [{ kind: "straight", length: matched.length }],
    },
    "walk",
  );
  return {
    film: perform(true),
    horse,
    rides,
    part,
    window: Array.from(
      { length: 9 },
      (_: unknown, k: number): number =>
        halted + 0.5 + (k * (walking.end - halted - 0.5)) / 8,
    ),
  };
}

/** Fit a steady line to the walk's middle half and match a trapezoid's lags to its start and stop: one that reaches v at a lags its line by v²/2a. */
function match(progress: readonly number[], step: number): IMatched {
  const count: number = progress.length - 1;
  const from: number = Math.floor(count / 4);
  const to: number = Math.ceil((3 * count) / 4);
  let st: number = 0;
  let sp: number = 0;
  let stt: number = 0;
  let stp: number = 0;
  for (let i: number = from; i <= to; i++) {
    const t: number = i * step;
    st += t;
    sp += progress[i]!;
    stt += t * t;
    stp += t * progress[i]!;
  }
  const n: number = to - from + 1;
  const cruise: number = (n * stp - st * sp) / (n * stt - st * st);
  const startLag: number = (cruise * st - sp) / n;
  const length: number = progress[count]!;
  const stopLag: number = cruise * count * step - length - startLag;
  return {
    length,
    cruise,
    acceleration: (cruise * cruise) / (2 * startLag),
    deceleration: (cruise * cruise) / (2 * stopLag),
  };
}
