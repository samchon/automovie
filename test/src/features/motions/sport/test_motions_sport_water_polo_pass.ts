import {
  AutoMovieArchetypeWaterPoloBall,
  AutoMovieArchetypeWaterPoloGoal,
} from "@automovie/archetypes";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
  AutoMovieMotionHumanSwim,
  AutoMovieMotionHumanWaterPolo,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";
import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { observeThrownValue } from "../../internal/observeThrownValue";
import { vclose } from "../../internal/vclose";

const WATER: number = 0;
const CIRCUMFERENCE: number = 0.7;
const RADIUS: number = CIRCUMFERENCE / (2 * Math.PI);
const CONTACT: number = 0.01;
const RECEIVE: IAutoMovieVector3 = { x: -0.4, y: 0.3, z: 4.15 };
const CORNER: IAutoMovieVector3 = { x: 1, y: 0.55, z: 9.25 };
const RECEIVER_AT: IAutoMovieVector3 = {
  x: -0.3800817005372732,
  y: WATER,
  z: 4.761246723671137,
};
const RECEIVER_YAW: number = -122.86832160867841;

/**
 * A water-supported passer releases a held ball to a receiver who catches it
 * with one hand at the published interception on the same film clock.
 *
 * Scenarios:
 *
 * 1. The ball launches from the displayed hold and reaches the authored pass
 *    point. A receiver facing the pass takes it with the right hand while the
 *    stock defender action keeps the body water-supported.
 * 2. The original side-on receiver exceeds the hand pace limit. Moving its catch
 *    20 ms later makes the arm sweep into the head.
 * 3. The ball stays continuous through capture, the pass earns no goal, and the
 *    three performers pass the shipped take audit.
 * 4. In a forward goal layout, the receiver keeps the same ball through the next
 *    attack and scores against the actual aperture. A keeper who tries to
 *    intercept that shot high in front of the goal exceeds left-arm reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the held pass, the supported catch, the following goal, the three refusal cases and the whole take audits.
 * @evidence contracts/development/testing.md#behavioral-verification Composes held, passed, caught and shot states, and reads native flights, possession, displayed palms and body bones, the actual goal cue and both whole-take verdicts. Attempts the same shot with the keeper's staged two-hand interception and records its reach refusal.
 * @evidence contracts/development/testing.md#independent-expectations The aim fixes the pass point and the circumference gives the sphere radius independently of the displayed palms. The fixed aperture and actual second launch determine the scoring plane and keeper interception. Side-on, delayed and high-keeper layouts exercise pace, swept clearance and static reach separately.
 */
export function test_motions_sport_water_polo_pass(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const empty: AutoMovieMotionHumanPerformance = stage(body, [], "sideOn");
  const held: IAutoMovieVector3 = HumanHand.frame(
    body,
    empty.bones("passer", 0),
    "right",
    "grip",
  ).point;
  const ball: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "ball",
    AutoMovieArchetypeWaterPoloBall.create(
      { circumference: CIRCUMFERENCE, mass: 0.42 },
      3,
    ),
    { at: held, yaw: 0 },
  );
  const goal: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "goal",
    AutoMovieArchetypeWaterPoloGoal.create(),
    { at: { x: 0, y: WATER, z: 9 }, yaw: 180, fixed: true },
  );
  const props: readonly IAutoMovieMotionHumanProp[] = [ball, goal];
  const passOnly: AutoMovieMotionHumanPerformance = stage(
    body,
    props,
    "sideOn",
  );
  const pass = passOnly.flights("ball")[0];
  const intercept: number | undefined = pass?.published.aim?.seconds;
  if (pass === undefined || intercept === undefined || !(intercept > 0))
    throw new Error("The held pass publishes no positive interception time.");
  const arrival: number = pass.launch + intercept;
  const beforeRelease = passOnly.prop("ball", pass.launch - 1e-4).position;
  const release = passOnly.prop("ball", pass.launch).position;
  TestValidator.predicate(
    "the held ball leaves from the displayed release and reaches the target",
    pass.source.subject === "passer" &&
      nclose(pass.launch, 1.28) &&
      nclose(pass.published.sphere!.radius, RADIUS) &&
      vclose(beforeRelease, release, CONTACT) &&
      vclose(release, pass.projectile.origin) &&
      vclose(passOnly.prop("ball", arrival).position, RECEIVE),
  );

  const film: AutoMovieMotionHumanPerformance = stage(
    body,
    props,
    "facing",
    intercept,
  );
  const flight = film.flights("ball")[0];
  const captured: number | undefined = flight?.capturedAt;
  if (flight === undefined || captured === undefined)
    throw new Error("The receiver did not capture the staged pass.");
  const possession = film
    .play("ball")
    .events.find(
      (event) =>
        event.kind === "hold" &&
        event.subject === "shooter" &&
        event.caught &&
        event.hands.length === 1 &&
        event.hands[0] === "right" &&
        nclose(event.from, captured),
    );
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    film.bones("shooter", captured),
    "right",
    "palm",
  ).point;
  const centre: IAutoMovieVector3 = film.prop("ball", captured).position;
  TestValidator.predicate(
    "one ball is launched by the passer and caught by the anchored right-hand overlay",
    film.flights("ball").length === 1 &&
      flight.source.subject === "passer" &&
      possession !== undefined &&
      nclose(captured, arrival) &&
      nclose(captured, film.instant({ of: "receive", event: "contact" })) &&
      vclose(flight.projectile.origin, release) &&
      vclose(centre, RECEIVE) &&
      nclose(AutoMovieEngineVector3.distance(palm, centre), RADIUS, CONTACT),
  );
  TestValidator.predicate(
    "capture keeps the ball continuous and earns no goal",
    vclose(
      film.prop("ball", captured - 1e-4).position,
      film.prop("ball", captured + 1e-4).position,
      CONTACT,
    ) &&
      AutoMovieMotionHumanWaterPolo.scoreGoal({ film, ball: "ball", goal })
        .length === 0,
  );
  for (const { subject } of film.performers)
    TestValidator.predicate(
      subject + " keeps the head above water and the hips submerged",
      [0, pass.launch, captured, captured + 0.35].every((seconds) => {
        const bones = film.bones(subject, seconds);
        return (
          bones.get("hips")!.worldPosition.y < WATER &&
          bones.get("head")!.worldPosition.y > WATER
        );
      }),
    );
  assertTakeClean("the held water polo pass", film);

  const early = observeThrownValue(() =>
    stage(body, props, "sideOn", intercept),
  ).error;
  TestValidator.predicate(
    "the original side-on catch exceeds the native reach pace bound",
    early instanceof AutoMovieMotionHumanRefusal &&
      early.kind === "reach" &&
      early.axis === "duration" &&
      typeof early.value === "number" &&
      early.value > 1,
  );
  const late = observeThrownValue(() =>
    stage(body, props, "sideOn", intercept + 0.02),
  ).error;
  TestValidator.predicate(
    "the later side-on catch refuses the arm path past the head",
    late instanceof AutoMovieMotionHumanRefusal &&
      late.kind === "reach" &&
      late.axis === "region" &&
      late.reason.includes("head"),
  );
  assertPassShot(body, ball, pass, intercept);
}

function assertPassShot(
  body: IAutoMovieMotionHumanBody,
  ball: IAutoMovieMotionHumanProp,
  pass: IAutoMovieMotionHumanPropFlight.IFlight,
  intercept: number,
): void {
  const radians: number = (RECEIVER_YAW * Math.PI) / 180;
  const forward: IAutoMovieVector3 = {
    x: Math.sin(radians),
    y: 0,
    z: Math.cos(radians),
  };
  const right: IAutoMovieVector3 = { x: -forward.z, y: 0, z: forward.x };
  const move = (
    from: IAutoMovieVector3,
    along: number,
    lateral: number,
    y: number = from.y,
  ): IAutoMovieVector3 => ({
    ...AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.add(
        from,
        AutoMovieEngineVector3.scale(forward, along),
      ),
      AutoMovieEngineVector3.scale(right, lateral),
    ),
    y,
  });
  const goalAt: IAutoMovieVector3 = move(RECEIVER_AT, 4, 0.65);
  const goalYaw: number = RECEIVER_YAW + 180;
  const goal: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "goal",
    AutoMovieArchetypeWaterPoloGoal.create(),
    { at: goalAt, yaw: goalYaw, fixed: true },
  );
  const props: readonly IAutoMovieMotionHumanProp[] = [ball, goal];
  const attack: IWaterPoloShot = {
    target: move(goalAt, 0.25, 0.9, 0.55),
    keeper: { at: move(goalAt, -0.45, -0.7), yaw: goalYaw },
  };
  const film: AutoMovieMotionHumanPerformance = stage(
    body,
    props,
    "facing",
    intercept,
    attack,
  );
  const flights = film.flights("ball");
  const caught = flights[0];
  const shot = flights[1];
  if (caught?.capturedAt === undefined || shot === undefined)
    throw new Error("The receiver did not catch and shoot the staged ball.");
  const caughtAt: number = caught.capturedAt;
  const handoff: number | undefined = film
    .segments("shooter")
    .find((segment) => segment.id === "shot")?.start;
  if (handoff === undefined)
    throw new Error("The receiver has no displayed handoff into the shot.");
  const scorer = AutoMovieMotionHumanWaterPolo.scoreGoal({
    film,
    ball: "ball",
    goal,
  });
  const cue = scorer[0];
  if (cue === undefined)
    throw new Error("The staged shot did not cross the goal aperture.");
  const goalCentre: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    cue.center,
    goalAt,
  );
  const postOffset: number = AutoMovieEngineVector3.dot(goalCentre, right);
  const mouth = goal.affordances?.find((site) => site.id === "mouth");
  if (mouth?.width === undefined || mouth.height === undefined)
    throw new Error("The physical goal has no aperture dimensions.");
  const holds = film.play("ball").events;
  TestValidator.predicate(
    "the same pass feeds a continuous right-hand hold into the receiver's second launch",
    flights.length === 2 &&
      caught.source.subject === "passer" &&
      nclose(caught.launch, pass.launch) &&
      vclose(caught.projectile.origin, pass.projectile.origin) &&
      nclose(caughtAt, pass.launch + intercept) &&
      nclose(caughtAt, film.instant({ of: "receive", event: "contact" })) &&
      shot.source.subject === "shooter" &&
      nclose(handoff, 2.3) &&
      nclose(shot.launch, 3.58) &&
      vclose(film.prop("ball", shot.launch).position, shot.projectile.origin) &&
      holds.some(
        (event) =>
          event.kind === "hold" &&
          event.subject === "shooter" &&
          event.caught &&
          event.hands.length === 1 &&
          event.hands[0] === "right" &&
          nclose(event.from, caughtAt) &&
          nclose(event.to, shot.launch),
      ) &&
      [caughtAt, handoff, shot.launch].every((seconds) =>
        vclose(
          film.prop("ball", seconds - 1e-4).position,
          film.prop("ball", seconds + 1e-4).position,
          CONTACT,
        ),
      ),
  );
  TestValidator.predicate(
    "the open second flight passes the actual fixed aperture as a whole sphere",
    scorer.length === 1 &&
      cue.scorer === "shooter" &&
      cue.goal === goal.subject &&
      nclose(cue.seconds, 4.158812063072606) &&
      cue.seconds < shot.end &&
      vclose(film.prop("ball", cue.seconds).position, cue.center) &&
      Math.abs(postOffset) + RADIUS <= mouth.width / 2 &&
      cue.center.y >= RADIUS &&
      cue.center.y + RADIUS <= mouth.height &&
      nclose(AutoMovieEngineVector3.dot(goalCentre, forward), RADIUS),
  );
  for (const { subject } of film.performers)
    TestValidator.predicate(
      subject + " stays water-supported in the pass and goal take",
      [0, pass.launch, caughtAt, handoff, shot.launch, cue.seconds].every(
        (seconds) => {
          const bones = film.bones(subject, seconds);
          return (
            bones.get("hips")!.worldPosition.y < WATER &&
            bones.get("head")!.worldPosition.y > WATER
          );
        },
      ),
    );
  assertTakeClean("the held water polo pass followed by a goal", film);

  // The ball is high where its actual centre meets the plane 0.75 m on
  // the field side of the aperture. Stage a keeper under that interception.
  const normal: IAutoMovieVector3 = AutoMovieEngineVector3.scale(forward, -1);
  const originZ: number = AutoMovieEngineVector3.dot(
    AutoMovieEngineVector3.subtract(shot.projectile.origin, goalAt),
    normal,
  );
  const speedZ: number = AutoMovieEngineVector3.dot(
    shot.projectile.velocity,
    normal,
  );
  const keeperIntercept: number = (0.75 - originZ) / speedZ;
  TestValidator.predicate(
    "the high attempt names the same live flight before it scores",
    keeperIntercept > 0 &&
      shot.launch + keeperIntercept < cue.seconds &&
      film.prop("ball", shot.launch + keeperIntercept).position.y > 0.82,
  );
  const high = observeThrownValue(() =>
    stage(body, props, "facing", intercept, {
      ...attack,
      keeper: {
        at: { x: -2.6601692809358104, y: WATER, z: 1.8028043067361512 },
        yaw: 34.600012401028984,
      },
      keeperIntercept,
    }),
  ).error;
  TestValidator.predicate(
    "the high keeper interception refuses the left hand's reach",
    high instanceof AutoMovieMotionHumanRefusal &&
      high.kind === "reach" &&
      high.axis === "region" &&
      high.reason.includes("left hand") &&
      typeof high.value === "number" &&
      high.value > 100,
  );
}

interface IWaterPoloShot {
  target: IAutoMovieVector3;
  keeper: Pick<IAutoMovieMotionHumanPerformer, "at" | "yaw">;
  keeperIntercept?: number;
}

function stage(
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  layout: "sideOn" | "facing",
  intercept?: number,
  attack?: IWaterPoloShot,
): AutoMovieMotionHumanPerformance {
  const facing: boolean = layout === "facing";
  const performers: IAutoMovieMotionHumanPerformer[] = [
    {
      subject: "passer",
      body,
      at: { x: -2.6, y: WATER, z: 3.95 },
      yaw: 90,
      proficiency: { level: "trained" },
    },
    {
      subject: "shooter",
      body,
      // From the stock defender's reach posture, align its right palm
      // horizontally with the pass surface and keep the ball in front.
      at: facing ? RECEIVER_AT : { x: 0, y: WATER, z: 4 },
      yaw: facing ? RECEIVER_YAW : 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "keeper",
      body,
      ...(attack?.keeper ?? { at: { x: 0, y: WATER, z: 8.4 }, yaw: 180 }),
      proficiency: { level: "trained" },
    },
  ];
  const passer = AutoMovieMotionHumanChain.subject("passer").registered(
    "aquatic",
    {
      kind: "waterPolo",
      role: "attack",
      side: "right",
      water: WATER,
      ...(props.length === 0 ? {} : { prop: "ball", at: RECEIVE }),
    },
    "pass",
  );
  let receiver = AutoMovieMotionHumanChain.subject("shooter").registered(
    "aquatic",
    {
      kind: "waterPolo",
      role: "defend",
      side: facing ? "left" : "right",
      water: WATER,
    },
    attack === undefined ? undefined : "receiveSupport",
  );
  if (intercept !== undefined) {
    receiver = receiver.over((overlay) => {
      const catchChain = overlay.stageCatch(
        {
          partner: "pass",
          ball: "ball",
          hands: "one",
          hand: "right",
          intercept,
        },
        "receive",
      );
      if (!facing) return catchChain;
      return catchChain.until(
        attack === undefined
          ? { type: "event", event: "held" }
          : { type: "anchor-event", of: "receiveSupport", event: "relax" },
      );
    });
    if (!facing || attack !== undefined)
      receiver = receiver.registered(
        "aquatic",
        {
          kind: "waterPolo",
          role: "attack",
          side: "right",
          water: WATER,
          prop: "ball",
          at: attack?.target ?? CORNER,
        },
        "shot",
      );
  }
  const keep = {
    kind: "waterPolo",
    role: "keeper",
    side: "right",
    water: WATER,
  };
  let keeper = AutoMovieMotionHumanChain.subject("keeper")
    .registered("aquatic", keep)
    .registered("aquatic", keep);
  const keeperIntercept: number | undefined = attack?.keeperIntercept;
  if (keeperIntercept !== undefined)
    keeper = keeper
      .over((overlay) =>
        overlay
          .stageCatch(
            {
              partner: "shot",
              ball: "ball",
              hands: "two",
              intercept: keeperIntercept,
            },
            "save",
          )
          .until({ type: "event", event: "held" }),
      )
      .sync({ of: "shot", event: "release", offset: keeperIntercept - 1.28 });
  return new AutoMovieMotionHumanPerformance({
    seed: "water-polo-goal",
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers,
    props: [...props],
    composition: {
      type: "parallel",
      parts: [passer.node, receiver.node, keeper.node],
    },
  });
}
