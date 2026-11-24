import { createBall, createClub } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanStand,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSwing,
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanHeld,
  HumanFoot,
  HumanHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { motionGraspedHandle } from "../../../features/internal/motionGraspedHandle";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** The delivery a take stages: an overarm baseball pitch or an underarm softball pitch. */
type Delivery = "pitch" | "underarmPitch";

/** One staged performer: who, where and facing which way, and the chain they play. */
interface IRole {
  /** Scene subject id. */
  subject: string;

  /** Floor position, world metres. */
  at: IAutoMovieVector3;

  /** Facing, degrees about +Y from +Z. */
  yaw: number;

  /** The role's actions. */
  chain: IAutoMovieComposition;
}

/** Inputs of one take. */
interface ITake {
  /** Delivery law. */
  delivery: Delivery;

  /** Pitcher's distance from home, metres. */
  distance: number;

  /** Seed. */
  seed: string;

  /** The roles after the pitcher. */
  roles: IRole[];

  /** Seconds the pitcher stands after the pitch, which ends the film; 1 when absent. */
  follow?: number;
}

/**
 * One live ball carries a baseball pitch to the bat, a batted ball to a
 * fielder's catch, a pitch the batter takes into the catcher's glove, and a
 * contrasting softball delivery that the bat also meets.
 *
 * Scenarios:
 * 1. The pitch crosses the plate plane inside the gate around the contact
 *    point; read its time from the pitch-only take.
 * 2. The batter's swing is timed so its impact lands on that crossing: the
 *    bat's strike point meets the ball surface with both feet planted and
 *    the same ball leaves from the bat. A fielder placed on the batted
 *    flight catches it.
 * 3. A taken pitch carries past the plate into the catcher's catch.
 * 4. The batter-runner runs from home onto first base.
 * 5. An underarm softball pitch from 13.11 m reaches the same contact point
 *    from below the hand's release height and the bat meets it too.
 *
 * MLB Official Baseball Rules 2.01 put the pitcher's plate 60 ft 6 in
 * (18.44 m) from home and first base 90 ft (27.43 m) away; World Baseball
 * Softball Confederation rules use 43 ft (13.11 m) for the women's
 * fastpitch circle. The bag is 15 in (0.381 m) square (MLB 2.03). The
 * stroke's own 12 mm contact allowance bounds the bat-to-ball distance. A
 * caught ball's play shows the fielder's caught possession.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the five plays, the rule distances and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pitch, underarmPitch, baseballHit, stageCatch and dash through HumanPerformance and reads the play log, gate crossings and displayed bat, ball and foot frames.
 * @evidence contracts/development/testing.md#independent-expectations Distances are the rule book's; contact is the bat affordance against the ball radius; each catch is credited only by the play's caught possession.
 * @evidence contracts/development/testing.md#distinguishing-cases A swung pitch is relaunched by the batter, a taken one is caught by the catcher; the overarm and underarm deliveries arrive from opposite sides of the contact height.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of up to four polygon men, one ball and one bat.
 */
export function test_motion_swing_baseball_play(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const ball: ReturnType<typeof createBall> = createBall({ kind: "baseball" });
  const bat: ReturnType<typeof createClub> = createClub({ kind: "bat" });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;

  // The contact point comes from the established batter fixture: a bat in
  // the right grip of the ready pose, the barrel 4 degrees down.
  const ready: HumanPerformance = new HumanPerformance({
    seed: "baseball-ready",
    performers: [
      {
        subject: "batter",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("batter").stand({ hold: 0.2, sway: 0 })
      .node,
  });
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    ready.bones("batter", 0),
    "right",
    "grip",
  ).point;
  const grip: IAutoMovieVector3 = bat.affordance("grip").frame.translation;
  const barrel: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    -94,
  );
  // The bat is held by its grip as a hand grasps a handle, the barrel out
  // past the index finger (`motionGraspedHandle`), in the ready pose's right
  // hand.
  const inHand: IAutoMovieRigidTransform = motionGraspedHandle(
    body,
    "right",
    bat.affordance("grip").frame,
    bat.affordance("strike").frame.translation,
  );
  const wrist: IAutoMovieResolvedBone = ready
    .bones("batter", 0)
    .get("rightHand")!;
  const batAt: IAutoMovieRigidTransform = {
    position: Vector3.add(
      wrist.worldPosition,
      Quaternion.rotateVector(wrist.worldRotation, inHand.position),
    ),
    rotation: Quaternion.multiply(wrist.worldRotation, inHand.rotation),
  };
  const working: IAutoMovieVector3 = Quaternion.rotateVector(
    barrel,
    Vector3.subtract(bat.affordance("strike").frame.translation, grip),
  );
  const contact: IAutoMovieVector3 = {
    x: 0.6 * hand.x + working.x,
    y: 1.03,
    z: 0.28,
  };
  const impact: number = 0.56;
  const firstBase: IAutoMovieVector3 = {
    x: -27.43 * Math.SQRT1_2,
    y: 0,
    z: 27.43 * Math.SQRT1_2,
  };

  const holding = (
    name: string,
    prop: string,
  ): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> => ({
    ...AutoMovieMotionHumanStance.stand,
    name,
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...AutoMovieMotionHumanStance.stand.plan(context),
      holds: [{ side: "right", prop, from: 0 }],
    }),
  });
  const holdBall: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    holding("baseballFixtureBall", "ball");
  const holdBat: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    holding("baseballFixtureBat", "bat");

  const film = (input: ITake): HumanPerformance => {
    const pitcherAt: IAutoMovieVector3 = { x: 0, y: 0, z: input.distance };
    const pitcherReady: HumanPerformance = new HumanPerformance({
      seed: `${input.seed}-pitcher`,
      performers: [
        {
          subject: "pitcher",
          body,
          at: pitcherAt,
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("pitcher").stand({
        hold: 0.2,
        sway: 0,
      }).node,
    });
    const palm: IAutoMovieVector3 = HumanHand.frame(
      body,
      pitcherReady.bones("pitcher", 0),
      "right",
      "grip",
    ).point;
    return new HumanPerformance({
      seed: input.seed,
      laws: [
        holdBall,
        holdBat,
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.pitch,
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.underarmPitch,
        AutoMovieMotionHumanSwing.HumanPrecisionSport.baseballHit,
      ],
      performers: [
        {
          subject: "pitcher",
          body,
          at: pitcherAt,
          yaw: 180,
          proficiency: { level: "trained" },
        },
        ...input.roles.map(
          (
            role: IRole,
          ): IAutoMovieMotionHumanPerformance.IInput["performers"][number] => ({
            subject: role.subject,
            body,
            at: role.at,
            yaw: role.yaw,
            proficiency: { level: "trained" },
          }),
        ),
      ],
      props: [
        HumanObject.prop("ball", ball, {
          position: Vector3.subtract(palm, centre),
          rotation: identity,
        }),
        HumanObject.prop("bat", bat, batHeld),
      ],
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("pitcher")
          .registered(holdBall.name, { hold: 0.4, sway: 0 })
          .registered(
            input.delivery,
            {
              prop: "ball",
              target: { kind: "point", frame: "world", at: contact },
            },
            "pitch",
          )
          // The film ends once the play needs no later instant: every ball
          // read sweeps the flight to the film's end.
          .stand({ hold: input.follow ?? 1, sway: 0 }).node,
        ...input.roles.map((role: IRole): IAutoMovieComposition => role.chain),
      ),
    });
  };
  // Straight up the middle: the stroke meets the ball square to its shot,
  // and at 40 m/s the 8 degree loft carries it over the pitcher's head.
  const field: IAutoMovieVector3 = { x: contact.x, y: 0, z: 40 };
  // The batter stands at the swing's own address for the contact, the bat
  // read in the hand as the hold keeps it (`PrecisionStrokeForms.address`),
  // and the bat is carried there with the batter.
  const quiet: ReturnType<HumanPerformance["bones"]> = ready.bones("batter", 0);
  const batterAt: IRole["at"] =
    AutoMovieMotionHumanSwing.PrecisionStrokeForms.address({
      body,
      row: "baseballHit",
      side: "right",
      yaw: 0,
      ball: contact,
      radius,
      toward: field,
      held: AutoMovieMotionHumanHeld.grasped(
        body,
        "right",
        "bat",
        batAt,
        bat.affordances ?? [],
        {
          point: quiet.get("rightHand")!.worldPosition,
          rotation: quiet.get("rightHand")!.worldRotation,
        },
      ),
    });
  const batHeld: IAutoMovieRigidTransform = {
    position: Vector3.add(batAt.position, batterAt),
    rotation: batAt.rotation,
  };
  const batterStands: IRole = {
    subject: "batter",
    at: batterAt,
    yaw: 0,
    chain: HumanChain.subject("batter").registered(holdBat.name, {
      hold: 0.4,
      sway: 0,
    }).node,
  };

  // The plate plane through the contact point, credited toward the catcher.
  const plate: IAutoMovieMotionHumanBallPlay.IRectangle = {
    kind: "rectangle",
    centre: contact,
    normal: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
    halfWidth: 0.5,
    halfHeight: 1,
  };
  const arrival = (delivery: Delivery, distance: number): number => {
    const taken: HumanPerformance = film({
      delivery,
      distance,
      seed: `baseball-${delivery}-arrival`,
      roles: [batterStands],
    });
    const crossed: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
      AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
        taken,
        "ball",
        plate,
        0,
        taken.duration,
        centre,
      );
    if (crossed === undefined)
      throw new Error(`The ${delivery} never reaches the plate plane`);

    return crossed.seconds;
  };
  const release = (taken: HumanPerformance): number =>
    taken.instant({ of: "pitch", event: "release" });

  // 1-2. Swing at the arrival and catch the batted ball.
  const pitchArrives: number = arrival("pitch", 18.44);
  const pitchOnly: HumanPerformance = film({
    delivery: "pitch",
    distance: 18.44,
    seed: "baseball-pitch-arrival",
    roles: [batterStands],
  });
  const lead: number = pitchArrives - release(pitchOnly);
  const swinging = (target: IAutoMovieVector3): IRole => ({
    subject: "batter",
    at: batterAt,
    yaw: 0,
    chain: HumanChain.subject("batter")
      .registered(holdBat.name, { hold: 0.4, sway: 0 })
      .registered(
        "baseballHit",
        {
          tool: "bat",
          ball: "ball",
          speed: 40,
          impact,
          target: { kind: "point", frame: "world", at: target },
        },
        "hit",
      )
      .sync({ of: "pitch", event: "release", offset: lead - impact }).node,
  });
  // The fielder takes the batted ball 1.05 s after the hit.
  const hang: number = 1.05;
  const hitOnly: HumanPerformance = film({
    delivery: "pitch",
    distance: 18.44,
    seed: "baseball-hit",
    roles: [swinging(field)],
    follow: lead + hang + 0.3,
  });
  const hitPlay: IAutoMovieMotionHumanBallPlay = hitOnly.play("ball");
  const batted: IAutoMovieMotionHumanBallPlay.ILaunch | undefined =
    hitPlay.events.find(
      (
        event: IAutoMovieMotionHumanBallPlay.Event,
      ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
        event.kind === "launch" && event.subject === "batter",
    );
  if (batted === undefined) throw new Error("The batter never hits the pitch");
  const strike: IAutoMovieRigidTransform = hitOnly.prop("bat", batted.seconds);
  const strikePoint: IAutoMovieVector3 = Vector3.add(
    strike.position,
    Quaternion.rotateVector(
      strike.rotation,
      bat.affordance("strike").frame.translation,
    ),
  );
  TestValidator.predicate(
    "the batter's feet stay planted through the impact",
    (["leftFoot", "rightFoot"] as const).every(
      (foot: AutoMovieHumanoidBone): boolean =>
        Vector3.distance(
          hitOnly.bones("batter", batted.seconds - 0.05).get(foot)!
            .worldPosition,
          hitOnly.bones("batter", batted.seconds + 0.05).get(foot)!
            .worldPosition,
        ) <= 0.005,
    ),
  );
  TestValidator.predicate(
    "the bat's strike point meets the pitched ball's surface at the swing's impact",
    nclose(batted.seconds, pitchArrives, 2e-3) &&
      Math.abs(Vector3.distance(strikePoint, batted.point) - radius) <=
        Math.min(0.012, 0.2 * radius),
  );

  // The fielder stands 0.46 m beyond the batted ball's point 1.05 s out,
  // facing back along its horizontal path, as the staged-catch fixture does.
  const caughtAt: IAutoMovieVector3 = Vector3.add(
    hitOnly.prop("ball", batted.seconds + hang).position,
    centre,
  );
  const away: IAutoMovieVector3 = Vector3.normalize({
    ...batted.velocity,
    y: 0,
  });
  const fielder: IRole = {
    subject: "fielder",
    at: { ...Vector3.add(caughtAt, Vector3.scale(away, 0.46)), y: 0 },
    yaw: (Math.atan2(-away.x, -away.z) * 180) / Math.PI,
    chain: HumanChain.subject("fielder")
      .registered("stageCatch", {
        partner: "hit",
        ball: "ball",
        hands: "two",
        intercept: hang,
      })
      .sync({ of: "hit" }).node,
  };
  const caught: HumanPerformance = film({
    delivery: "pitch",
    distance: 18.44,
    seed: "baseball-fly-out",
    roles: [swinging(field), fielder],
    follow: lead + hang + 0.3,
  });
  const possessions: string[] = ballPossessions(caught.play("ball"));

  TestValidator.equals(
    "one ball goes from the pitcher's hand off the bat into the fielder's catch",
    possessions,
    [
      "hold:pitcher:false",
      "launch:pitcher",
      "launch:batter",
      "hold:fielder:true",
    ],
  );

  // 4. The batter-runner carries the bat from home onto first base. The run
  // is its own take, so no ball flight is swept against the sprinting body.
  const runner: HumanPerformance = new HumanPerformance({
    seed: "baseball-run-to-first",
    laws: [holdBat, AutoMovieMotionHumanThrowCatch.HumanSportThrow.dash],
    performers: [
      {
        subject: "batter",
        body,
        at: batterAt,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [HumanObject.prop("bat", bat, batHeld)],
    composition: HumanChain.subject("batter")
      .registered(holdBat.name, { hold: 0.4, sway: 0 })
      .registered("dash", { to: firstBase }).node,
  });
  const onBag: boolean = (["left", "right"] as const).some(
    (side: AutoMovieHumanSide): boolean =>
      HumanFoot.sockets(
        body,
        runner.bones("batter", runner.duration),
        side,
      ).some(
        (site: ReturnType<typeof HumanFoot.sockets>[number]): boolean =>
          Math.abs(site.point.x - firstBase.x) <= 0.381 / 2 &&
          Math.abs(site.point.z - firstBase.z) <= 0.381 / 2,
      ),
  );
  TestValidator.predicate(
    "the batter-runner ends the run with a sole on the first-base bag",
    onBag,
  );
  // 3. A taken pitch carries past the plate into the catcher's glove.
  const takeHang: number = lead + 0.03;
  const behind: IAutoMovieVector3 = Vector3.add(
    pitchOnly.prop("ball", release(pitchOnly) + takeHang).position,
    centre,
  );
  const catcher: IRole = {
    subject: "catcher",
    at: { x: behind.x, y: 0, z: behind.z - 0.46 },
    yaw: 0,
    chain: HumanChain.subject("catcher")
      .registered("stageCatch", {
        partner: "pitch",
        ball: "ball",
        hands: "two",
        intercept: takeHang,
      })
      .sync({ of: "pitch" }).node,
  };
  const strikeOut: HumanPerformance = film({
    delivery: "pitch",
    distance: 18.44,
    seed: "baseball-taken",
    roles: [batterStands, catcher],
  });
  TestValidator.predicate(
    "the taken pitch is the catcher's caught possession and never leaves the batter",
    strikeOut
      .play("ball")
      .events.some(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "hold" && event.subject === "catcher" && event.caught,
      ) &&
      !strikeOut
        .play("ball")
        .events.some(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "launch" && event.subject === "batter",
        ),
  );

  // 5. The softball arrives from below the hand and the bat meets it too.
  const softArrives: number = arrival("underarmPitch", 13.11);
  const softOnly: HumanPerformance = film({
    delivery: "underarmPitch",
    distance: 13.11,
    seed: "baseball-underarmPitch-arrival",
    roles: [batterStands],
  });
  const softLead: number = softArrives - release(softOnly);
  const softHit: HumanPerformance = film({
    delivery: "underarmPitch",
    distance: 13.11,
    seed: "softball-hit",
    follow: softLead + 0.6,
    roles: [
      {
        ...swinging(field),
        chain: HumanChain.subject("batter")
          .registered(holdBat.name, { hold: 0.4, sway: 0 })
          .registered(
            "baseballHit",
            {
              tool: "bat",
              ball: "ball",
              speed: 40,
              impact,
              target: { kind: "point", frame: "world", at: field },
            },
            "hit",
          )
          .sync({ of: "pitch", event: "release", offset: softLead - impact })
          .node,
      },
    ],
  });
  const softRelease: IAutoMovieMotionHumanBallPlay.ILaunch | undefined = softHit
    .play("ball")
    .events.find(
      (
        event: IAutoMovieMotionHumanBallPlay.Event,
      ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
        event.kind === "launch" && event.subject === "pitcher",
    );
  const overRelease: IAutoMovieMotionHumanBallPlay.ILaunch | undefined =
    hitPlay.events.find(
      (
        event: IAutoMovieMotionHumanBallPlay.Event,
      ): event is IAutoMovieMotionHumanBallPlay.ILaunch =>
        event.kind === "launch" && event.subject === "pitcher",
    );
  TestValidator.predicate(
    "the underarm pitch leaves below the overarm release and the batter still relaunches it",
    softRelease !== undefined &&
      overRelease !== undefined &&
      softRelease.point.y < overRelease.point.y - 0.3 &&
      softHit
        .play("ball")
        .events.some(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "launch" && event.subject === "batter",
        ),
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("fly-out", caught);
  assertTakeClean("taken pitch", strikeOut);
  assertTakeClean("softball hit", softHit);
  assertTakeClean("run to first", runner);
}
