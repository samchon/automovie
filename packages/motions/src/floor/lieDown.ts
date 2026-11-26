import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureCourse } from "../posture/prepareHumanPostureCourse";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { StrikingBody } from "../striking/StrikingBody";
import { floorArmRoom } from "./floorArmRoom";
import { floorEntry } from "./floorEntry";
import { floorSeat } from "./floorSeat";
import { lieDownBearing } from "./lieDownBearing";
import { lieDownBlend } from "./lieDownBlend";
import { lieDownContacts } from "./lieDownContacts";
import { lieDownFeetBones } from "./lieDownFeetBones";
import { lieDownHips } from "./lieDownHips";
import { lieDownKeys } from "./lieDownKeys";
import { lieDownLying } from "./lieDownLying";
import { lieDownPelvis } from "./lieDownPelvis";
import { lieDownPhases } from "./lieDownPhases";
import { lieDownPins } from "./lieDownPins";
import { lieDownPosedAt } from "./lieDownPosedAt";
import { lieDownPoses } from "./lieDownPoses";
import { lieDownProgress } from "./lieDownProgress";
import { lieDownRelease } from "./lieDownRelease";
import { lieDownRollSide } from "./lieDownRollSide";
import { lieDownRoutes } from "./lieDownRoutes";
import { lieDownShift } from "./lieDownShift";

/**
 * Lying down on the floor from standing into a position: supine, prone, or on
 * the left or right side. Entered on the knees or crouched over the hands, as a
 * crawl ends, the body goes from the posture it displays through the route's
 * postures after the kneel; any other base is refused (`floorEntry`).
 *
 * The movement passes through the floor postures people use to get down
 * (VanSant 1988, Phys Ther 68:185, codes the components of the reverse rise):
 * to lie on the back the body sits down onto the floor and rolls back; to lie
 * face down it kneels, goes onto hands and knees and lowers itself forward; to
 * lie on a side it lies on its back and rolls onto that side. Each posture is a
 * set of joint angles and a whole-body tilt (`POSES`, provisional), passed
 * through in joint space on minimum-jerk progress. At every second the body
 * rests on the floor: the root's height puts the lowest point of the body's
 * collision shapes on it (`knockdown.rest`). Entered standing, the feet keep
 * their place while the body goes down to the route's first posture. The mean
 * of their bearing soles gives the root path and each foot is fitted to its own
 * stationary socket. The pelvis then stays over the first landing, or its entry
 * place when already on the floor. Rolling from supine turns about the
 * longitudinal axis with the dependent heel fixed horizontally. Each phase
 * takes `PHASE` seconds (provisional), scaled by the manner's tempo; the
 * position is then held `hold` seconds. Events: `getDown` at the start, the
 * arrival at each posture on the route (`seatContact`, `kneeContact`,
 * `handsDown`, `supine`, `prone`, `lateral`) and `settled`.
 *
 * Not yet: lying on a bed or a sofa (A2 support frames, A8 `surface`), the
 * recovery position, sleep with seeded position changes (Skarpsno et al. 2017;
 * De Koninck et al. 1992), rolling over and rising from a bed.
 */
export namespace lieDown {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "lieDown";

  /** Cancel table: the lying body is cut only once settled. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    crawl: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.4 },
    ],
  };

  /** Seconds of each phase (provisional). */
  export const PHASE: number = 1.2;

  /** Relative hip adduction of parallel legs in side lying, degrees. */
  export const STACKED: number = lieDownPoses.STACKED;

  /** The floor posture keys for the route, in clinical degrees. */
  export const POSES: typeof lieDownPoses.POSES = lieDownPoses.POSES;

  /** The sittings whose legs `floorSeat` folds. */
  const FOLDED: Readonly<
    Partial<Record<IAutoMovieMotionHumanLieDown.Position, floorSeat.Kind>>
  > = {
    sitCrossed: "crossed",
    sitSide: "side",
  };

  /**
   * The route of postures to each position, after standing, with each arrival's
   * event.
   */
  export const ROUTES: typeof lieDownRoutes = lieDownRoutes;

  /**
   * Plan a lie down.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLieDown.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const position: IAutoMovieMotionHumanLieDown.Position =
      context.params.kind ?? "supine";
    const hold: number = context.params.hold ?? 2;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );

    // Entered standing, the body goes down the position's route. Entered on
    // the knees or crouched over the hands, it is already past the route's
    // kneel, so it goes from the posture the entry displays through the
    // rest of the route, about the entry's own hips (`floorEntry`).
    const { standing, entered }: floorEntry.IStart = floorEntry.start(
      context,
      name,
      "hips",
      (): IAutoMovieMotionHumanPosture =>
        stand.plan({ ...context, params: { hold: 1 } }).posture(0),
    );
    const route: readonly [string, string][] =
      entered === null
        ? ROUTES[position]
        : ROUTES[position].filter(([key]): boolean => key !== "kneel");
    const folds: floorSeat.Kind | undefined = FOLDED[position];
    const stoodPose: IAutoMovieMotionHumanPosture =
      entered ?? GymnasticsFlight.frozen(body, standing);
    const keys: IAutoMovieMotionHumanLieDown.IPose[] = lieDownKeys({
      entered,
      stoodPose,
      route,
    });
    const blend: ((
      weight: number,
    ) => IAutoMovieMotionHumanPosture["joints"])[] = lieDownBlend({ keys });
    const phases: IAutoMovieMotionClockPhase[] = lieDownPhases({
      route,
      hold,
    });
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(phases),
      modifiers,
      { holds: ["settled"] },
    );
    const duration: number = clock.duration;
    const progress: ReturnType<typeof AutoMovieMotionClock.prepare>[] =
      lieDownProgress({ route, clock, phases });

    // The pelvis's place over the floor, kept as the body goes down.
    const from: IAutoMovieMotionHumanPosture = entered ?? standing;
    const hips: IAutoMovieVector3 = lieDownHips({ from, body });
    const lower: ReturnType<typeof lowerHumanPosture.prepare> =
      lowerHumanPosture.prepare(body);
    const floor: ReturnType<typeof knockdown.prepareRest> =
      knockdown.prepareRest(body);
    const folded: ReturnType<typeof floorSeat.prepare> | undefined =
      folds === undefined ? undefined : floorSeat.prepare(body, folds);

    // Entered standing, the feet stay where they stood while the body goes
    // down to the route's first posture, as knockdown keeps them until the
    // seat lands: the root moves so the bearing sockets keep their place, and
    // the pelvis then stays where that first phase set it down.
    const feetBones: ReadonlySet<AutoMovieHumanoidBone> = lieDownFeetBones({
      body,
    });
    const readFeet: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, feetBones);
    const rollSide: AutoMovieHumanSide | undefined = lieDownRollSide({
      position,
    });
    const posedAt: (index: number, u: number) => IAutoMovieMotionHumanPosture =
      lieDownPosedAt({ standing, keys, rollSide, route, blend });

    // The route's time-independent places are prepared once, here, each only
    // where a query reads it: read through a fresh exact FK reader and the
    // body's own projection, which give the values a query's loaned reader
    // gives (`prepareHumanPoseResolution`, `prepareHumanPostureProjection`).
    // The reader serves this synchronous preparation only.
    const readAtPlan: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(undefined);
    const projectAtPlan: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);

    // The sole socket each foot bears on at the first phase's end, the lowest
    // there (the heels sitting down, the toes kneeling), chosen once so the
    // held point never switches; read only for a standing entry.
    const bearingOf: () => Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.Socket
    > = lieDownBearing({
      readFeet,
      posedAt,
      readAtPlan,
      projectAtPlan,
      body,
    });
    const bearing:
      | Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.Socket>
      | undefined = entered === null ? bearingOf() : undefined;
    const pelvisOf: (
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: lieDownPelvis.Feet,
    ) => IAutoMovieVector3 = lieDownPelvis({ bearing, readFeet, body });
    // A standing entry's pelvis where the first phase begins and where it
    // ends, prepared once (`pelvisOf`).
    const stood: IAutoMovieVector3 | undefined =
      entered === null
        ? pelvisOf(posedAt(0, 0), readAtPlan, projectAtPlan)
        : undefined;
    const landed: IAutoMovieVector3 | undefined =
      entered === null
        ? pelvisOf(posedAt(0, 1), readAtPlan, projectAtPlan)
        : undefined;
    const shift: (
      index: number,
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: lieDownPelvis.Feet,
    ) => IAutoMovieVector3 = lieDownShift({
      entered,
      pelvisOf,
      landed,
      stood,
    });
    /**
     * Place one raw route key and pin each foot only on the first descending
     * phase.
     */
    const placed: (
      index: number,
      u: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ) => IAutoMovieMotionHumanPosture = (
      index: number,
      u: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      if (entered === null && index === 0 && u <= 0) return stoodPose;
      const posed: IAutoMovieMotionHumanPosture = posedAt(index, u);
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        humanPostureHeading(posed),
        body.rest.get("hips")!,
      );
      type Current = lieDownPelvis.Feet | undefined;
      const current: Current =
        entered === null && index === 0
          ? readFeet(posed, read, project)
          : undefined;
      const moved: IAutoMovieVector3 = shift(
        index,
        posed,
        read,
        project,
        current,
      );
      const decay: number =
        current === undefined ? 0 : (1 - minimumJerk.share(u)) * stoodOffset!; // Entered standing, the entry's root height decays to the rest on the bounds over the first phase (an inertialized offset, Bollo 2018).
      const rooted: IAutoMovieMotionHumanPosture = {
        ...posed,
        root: {
          x: hips.x - offset.x + moved.x,
          y: floor(posed, read, project) + decay,
          z: hips.z - offset.z + moved.z,
        },
      };
      if (index === route.length - 1 && rollSide !== undefined) {
        // During the roll the lower heel bears along with the trunk. Turning
        // about the pelvis alone would drag that heel across the ground.
        const now: IAutoMovieVector3 = rollHeelOf(rooted, read, project);
        return {
          ...rooted,
          root: {
            x: rooted.root.x + rollHeel!.x - now.x,
            y: rooted.root.y,
            z: rooted.root.z + rollHeel!.z - now.z,
          },
        };
      }
      if (current === undefined) return rooted;
      return lower(plants!(rooted, current), read);
    };

    /** The rolling side's heel of a posture (`rollSide`'s first sole socket). */
    function rollHeelOf(
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieVector3 {
      return HumanFoot.sockets(
        body,
        readFeet(posture, read, project),
        rollSide!,
      )[0]!.point;
    }

    // A standing entry's root height over its rest at the first phase's start,
    // and its feet's pins between the stand and the first phase's end; the
    // rolling heel where the roll begins; the release from the first phase
    // into the second. Each is prepared once, where a query reads it.
    const stoodOffset: number | undefined =
      entered === null
        ? stoodPose.root.y - floor(posedAt(0, 0), readAtPlan, projectAtPlan)
        : undefined;
    const plants: lieDownPins.Pins | undefined = lieDownPins({
      entered,
      body,
      readFeet,
      stoodPose,
      readAtPlan,
      projectAtPlan,
      posedAt,
    });
    const rollHeel: IAutoMovieVector3 | undefined =
      rollSide === undefined
        ? undefined
        : rollHeelOf(
            placed(route.length - 2, 1, readAtPlan, projectAtPlan),
            readAtPlan,
            projectAtPlan,
          );
    const release: lieDownRelease.Release | undefined = lieDownRelease({
      entered,
      body,
      placed,
      readAtPlan,
      projectAtPlan,
    });
    // Each key-to-key blend at a weight, as the posture reads it.
    const keyed = (
      index: number,
      w: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture =>
      entered === null && index === 1 && w < 1
        ? release!(w)
        : placed(index, w, read, project);
    const arms: ReturnType<typeof floorArmRoom.prepare> = floorArmRoom.prepare(
      body,
      route.map(
        (_: readonly [string, string], index: number) =>
          (w: number): IAutoMovieMotionHumanPosture =>
            keyed(index, w, readAtPlan, projectAtPlan),
      ),
      readAtPlan,
      projectAtPlan,
    );
    // A phase's exact posture at a second, every constraint solved: the
    // floor rest, the feet's pins, the rolling heel, each arm's room and a
    // folded sitting's legs. It is read only here, at the phase's knots.
    const exact = (
      index: number,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const u: number = progress[index]!.progress(seconds);
      const rested: IAutoMovieMotionHumanPosture = arms(
        index,
        u,
        (w: number): IAutoMovieMotionHumanPosture =>
          keyed(index, w, readAtPlan, projectAtPlan),
        readAtPlan,
        projectAtPlan,
      );

      // A folded sitting folds its legs over the last phase of its route.
      return folded === undefined || index < route.length - 1 || u <= 0
        ? rested
        : folded(rested, u, readAtPlan, projectAtPlan);
    };

    // Each phase is a posture course through its exact postures at evenly
    // spaced seconds, as many as keep every arm within the audit's
    // allowance between two of them (`floorArmRoom.count`), at rest at both
    // ends as the phase's minimum-jerk progress is.
    const starts: number[] = route.map(
      (_: readonly [string, string], i: number): number =>
        clock.at(phases[i]!.name),
    );
    const courses: ((seconds: number) => IAutoMovieMotionHumanPosture)[] =
      route.map(
        (
          _: readonly [string, string],
          i: number,
        ): ((seconds: number) => IAutoMovieMotionHumanPosture) => {
          const from: number = starts[i]!;
          const to: number = clock.at(phases[i + 1]!.name);
          const n: number =
            to > from
              ? floorArmRoom.count(
                  body,
                  keyed(i, 0, readAtPlan, projectAtPlan),
                  keyed(i, 1, readAtPlan, projectAtPlan),
                )
              : 0;
          const knots: prepareHumanPostureCourse.IKnot[] = [];
          for (let j: number = 0; j <= n; j++) {
            const seconds: number =
              n === 0 ? from : from + ((to - from) * j) / n;
            knots.push({ seconds, posture: exact(i, seconds) });
          }
          return prepareHumanPostureCourse(knots);
        },
      );
    const at = (seconds: number): IAutoMovieMotionHumanPosture => {
      let index: number = 0;
      for (let i: number = 0; i < route.length; i++)
        if (seconds >= starts[i]!) index = i;
      return courses[index]!(seconds);
    };
    const lying: IAutoMovieMotionHumanPrimitive = lieDownLying({
      duration,
      at,
    });
    const settled: number = clock.at("settled") / duration;
    const sitting: boolean = position.startsWith("sit");
    const contacts: IAutoMovieMotionHumanContactWindow[] = lieDownContacts({
      body,
      posture: at(clock.at("settled")),
      position,
      sitting,
      settled,
    });
    if (entered === null) {
      const releaseShare: number = clock.at(phases[1]!.name) / duration;
      for (const part of ["leftFoot", "rightFoot"] as const)
        contacts.push({
          part,
          kind: "pivot",
          from: 0,
          to: releaseShare,
          support: { kind: "ground" },
        });
    }
    // Side sitting leans on the left hand.
    if (folds === "side")
      contacts.push({
        part: "leftHand",
        kind: "plant",
        from: settled,
        to: 1,
        support: { kind: "ground" },
      });
    const planned: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "settled",
        primitives: [lying],
      });
    // Down on the floor the body lies; a lie that stops sitting up is seated
    // (a base transition declares the base it ends in).
    const lain: IAutoMovieMotionHumanActionPlan = {
      ...planned,
      base: sitting ? { kind: "seated" } : { kind: "lying" },
    };
    return lain;
  }
}
