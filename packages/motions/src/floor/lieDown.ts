import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanBound } from "../law/HumanBound";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { StrikingBody } from "../striking/StrikingBody";
import { floorArmRoom } from "./floorArmRoom";
import { floorEntry } from "./floorEntry";
import { floorSeat } from "./floorSeat";
import { lieDownPoses } from "./lieDownPoses";
import { prepareLieDownFootPins } from "./prepareLieDownFootPins";

/** The raw feet and knee-pole frames used by the first descent. */
type Feet = ReturnType<ReturnType<typeof StrikingBody.prepareTrunk>>;

/** The pivot writer for the standing route. */
type Pins = ReturnType<typeof prepareLieDownFootPins> | undefined;

/** The first unplanted phase begins at its actual released joints. */
type Release = ReturnType<typeof floorEntry.between> | undefined;

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
  export const ROUTES: Readonly<
    Record<IAutoMovieMotionHumanLieDown.Position, readonly [string, string][]>
  > = {
    supine: [
      ["sit", "seatContact"],
      ["supine", "supine"],
    ],
    prone: [
      ["kneel", "kneeContact"],
      ["quadruped", "handsDown"],
      ["prone", "prone"],
    ],
    lateralLeft: [
      ["sit", "seatContact"],
      ["supine", "supine"],
      ["lateralLeft", "lateral"],
    ],
    lateralRight: [
      ["sit", "seatContact"],
      ["supine", "supine"],
      ["lateralRight", "lateral"],
    ],
    sitLong: [
      ["sit", "seatContact"],
      ["sitLong", "seated"],
    ],
    sitCrossed: [
      ["sit", "seatContact"],
      ["sitCrossed", "seated"],
    ],
    sitSide: [
      ["sit", "seatContact"],
      ["sitSide", "seated"],
    ],
  };

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
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);

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
    const keys: IAutoMovieMotionHumanLieDown.IPose[] = [
      entered === null
        ? {
            pitch: stoodPose.pitch,
            roll: stoodPose.roll,
            joints: stoodPose.joints,
          }
        : { pitch: entered.pitch, roll: entered.roll, joints: entered.joints },
      ...route.map(([key]) => POSES[key as keyof typeof POSES]),
    ];
    const blend: ((
      weight: number,
    ) => IAutoMovieMotionHumanPosture["joints"])[] = keys
      .slice(1)
      .map(
        (
          key: IAutoMovieMotionHumanLieDown.IPose,
          i: number,
        ): ((weight: number) => IAutoMovieMotionHumanPosture["joints"]) =>
          prepareHumanShapeBlend(keys[i]!.joints, key.joints),
      );
    const phases: IAutoMovieMotionClockPhase[] = [
      { name: "getDown", seconds: PHASE },
      ...route
        .slice(0, -1)
        .map(([, event]) => ({ name: event, seconds: PHASE })),
      { name: route.at(-1)![1], seconds: 0 },
      { name: "settled", seconds: hold },
    ];
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(phases),
      modifiers,
      { holds: ["settled"] },
    );
    const duration: number = clock.duration;
    const progress: ReturnType<typeof AutoMovieMotionClock.prepare>[] =
      route.map(
        (
          _: unknown,
          index: number,
        ): ReturnType<typeof AutoMovieMotionClock.prepare> =>
          AutoMovieMotionClock.prepare(
            clock,
            phases[index]!.name,
            phases[index + 1]!.name,
          ),
      );

    // The pelvis's place over the floor, kept as the body goes down.
    const from: IAutoMovieMotionHumanPosture = entered ?? standing;
    const hips: IAutoMovieVector3 = Vector3.add(
      from.root,
      Quaternion.rotateVector(
        humanPostureHeading(from),
        body.rest.get("hips")!,
      ),
    );
    const lower: ReturnType<typeof lowerHumanPosture.prepare> =
      lowerHumanPosture.prepare(body);
    let held: IAutoMovieMotionHumanPosture | undefined;
    let floor: ReturnType<typeof knockdown.prepareRest> | undefined;
    const folded: ReturnType<typeof floorSeat.prepare> | undefined =
      folds === undefined ? undefined : floorSeat.prepare(body, folds);

    // Entered standing, the feet stay where they stood while the body goes
    // down to the route's first posture, as knockdown keeps them until the
    // seat lands: the root moves so the bearing sockets keep their place, and
    // the pelvis then stays where that first phase set it down.
    const feetBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        "leftFoot",
        "rightFoot",
        "leftLowerLeg",
        "rightLowerLeg",
        ...(["heel", "ball", "toe"] as const).flatMap(
          (
            socket: IAutoMovieMotionHumanFoot.Socket,
          ): AutoMovieHumanoidBone[] => [
            body.surfaces.sockets[`${socket}Left`].bone,
            body.surfaces.sockets[`${socket}Right`].bone,
          ],
        ),
      ]);
    let readFeet: ReturnType<typeof StrikingBody.prepareTrunk> | undefined;
    let bearing:
      | Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.Socket>
      | undefined;
    let plants: Pins;
    let release: Release;
    const arms: ReturnType<typeof floorArmRoom.prepare> =
      floorArmRoom.prepare(body);
    const rollSide: AutoMovieHumanSide | undefined =
      position === "lateralLeft"
        ? "left"
        : position === "lateralRight"
          ? "right"
          : undefined;
    const posedAt: (
      index: number,
      u: number,
    ) => IAutoMovieMotionHumanPosture = (
      index: number,
      u: number,
    ): IAutoMovieMotionHumanPosture => ({
      root: { x: 0, y: 0, z: 0 },
      yaw: standing.yaw,
      pitch:
        keys[index]!.pitch + (keys[index + 1]!.pitch - keys[index]!.pitch) * u,
      roll: keys[index]!.roll + (keys[index + 1]!.roll - keys[index]!.roll) * u,
      // From supine, turn around the body's longitudinal axis. In the
      // Ry Rx Rz chart this is Rx(-90) Ry(turn), with the horizontal
      // projection of the chest normal pointing left or right throughout.
      ...(rollSide !== undefined && index === route.length - 1 && u > 0
        ? {
            yaw: standing.yaw + (rollSide === "left" ? 90 : -90),
            pitch: -90 + Math.abs(keys[index + 1]!.roll) * u,
            roll: rollSide === "left" ? -90 : 90,
          }
        : {}),
      joints: blend[index]!(u),
      limbs: {},
    });
    const pelvisOf: (
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: Feet,
    ) => IAutoMovieVector3 = (
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: Feet,
    ): IAutoMovieVector3 => {
      readFeet ??= StrikingBody.prepareTrunk(body, feetBones);
      // The sole socket each foot bears on at the first phase's end, the
      // lowest there (the heels sitting down, the toes kneeling), chosen once
      // so the held point never switches.
      if (bearing === undefined) {
        const end: ReturnType<ReturnType<typeof StrikingBody.prepareTrunk>> =
          readFeet(posedAt(0, 1), read, project);
        const lowest: (
          side: AutoMovieHumanSide,
        ) => IAutoMovieMotionHumanFoot.Socket = (
          side: AutoMovieHumanSide,
        ): IAutoMovieMotionHumanFoot.Socket =>
          HumanFoot.sockets(body, end, side).reduce(
            (
              a: IAutoMovieMotionHumanFoot.ISocket,
              b: IAutoMovieMotionHumanFoot.ISocket,
            ): IAutoMovieMotionHumanFoot.ISocket =>
              b.point.y < a.point.y ? b : a,
          ).socket;
        bearing = { left: lowest("left"), right: lowest("right") };
      }
      const bearer: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.Socket
      > = bearing;
      const bones: Feet = current ?? readFeet(posed, read, project);
      const contact: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(
          ...((["left", "right"] as const).map(
            (side: AutoMovieHumanSide): IAutoMovieVector3 =>
              HumanFoot.sockets(body, bones, side).find(
                (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
                  s.socket === bearer[side],
              )!.point,
          ) as [IAutoMovieVector3, IAutoMovieVector3]),
        ),
        0.5,
      );
      // The bearing sockets' mean less the pelvis's offset, both at root zero.
      return Vector3.subtract(
        contact,
        Quaternion.rotateVector(
          humanPostureHeading(posed),
          body.rest.get("hips")!,
        ),
      );
    };
    let stood: IAutoMovieVector3 | undefined, stoodOffset: number | undefined;
    let landed: IAutoMovieVector3 | undefined;
    let rollHeel: IAutoMovieVector3 | undefined;
    const shift: (
      index: number,
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: Feet,
    ) => IAutoMovieVector3 = (
      index: number,
      posed: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      current?: Feet,
    ): IAutoMovieVector3 => {
      if (entered !== null) return { x: 0, y: 0, z: 0 };
      stood ??= pelvisOf(posedAt(0, 0), read, project);
      const now: IAutoMovieVector3 =
        index === 0
          ? pelvisOf(posed, read, project, current)
          : (landed ??= pelvisOf(posedAt(0, 1), read, project));
      return { x: stood.x - now.x, y: 0, z: stood.z - now.z };
    };
    /**
     * Place one raw route key and pin each foot only on the first descending
     * phase.
     */
    function placed(
      index: number,
      u: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture {
      if (entered === null && index === 0 && u <= 0) return stoodPose;
      const posed: IAutoMovieMotionHumanPosture = posedAt(index, u);
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        humanPostureHeading(posed),
        body.rest.get("hips")!,
      );
      floor ??= knockdown.prepareRest(body);
      type Current = Feet | undefined;
      const current: Current =
        entered === null && index === 0
          ? (readFeet ??= StrikingBody.prepareTrunk(body, feetBones))(
              posed,
              read,
              project,
            )
          : undefined;
      const moved: IAutoMovieVector3 = shift(
        index,
        posed,
        read,
        project,
        current,
      );
      const decay: number =
        current === undefined
          ? 0
          : (1 - minimumJerk.share(u)) *
            (stoodOffset ??=
              stoodPose.root.y - floor(posedAt(0, 0), read, project)); // Entered standing, the entry's root height decays to the rest on the bounds over the first phase (an inertialized offset, Bollo 2018).
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
        const feet: ReturnType<typeof StrikingBody.prepareTrunk> = (readFeet ??=
          StrikingBody.prepareTrunk(body, feetBones));
        const heel = (
          posture: IAutoMovieMotionHumanPosture,
        ): IAutoMovieVector3 =>
          HumanFoot.sockets(body, feet(posture, read, project), rollSide)[0]!
            .point;
        rollHeel ??= heel(placed(index - 1, 1, read, project));
        const now: IAutoMovieVector3 = heel(rooted);
        return {
          ...rooted,
          root: {
            x: rooted.root.x + rollHeel.x - now.x,
            y: rooted.root.y,
            z: rooted.root.z + rollHeel.z - now.z,
          },
        };
      }
      if (current === undefined) return rooted;
      plants ??= prepareLieDownFootPins(
        body,
        readFeet!(stoodPose, read, project),
        readFeet!(posedAt(0, 1), read, project),
      );
      return lower(plants(rooted, current), read);
    }
    const at: (
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ) => IAutoMovieMotionHumanPosture = (
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      let index: number = 0;
      for (let i: number = 0; i < route.length; i++)
        if (seconds >= clock.at(phases[i]!.name)) index = i;
      const u: number = progress[index]!.progress(seconds);

      // Arrived, the posture no longer changes: it is rested on the floor once and held.
      const arrived: boolean = index === route.length - 1 && u >= 1;
      if (arrived && held !== undefined) return held;
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        projection ?? prepareHumanPostureProjection(body);
      const rested: IAutoMovieMotionHumanPosture = arms(
        index,
        u,
        (w: number): IAutoMovieMotionHumanPosture =>
          entered === null && index === 1 && w < 1
            ? (release ??= floorEntry.between(
                body,
                GymnasticsFlight.frozen(
                  body,
                  placed(0, 1, read, project),
                  read,
                  project,
                ),
                placed(1, 1, read, project),
              ))(w, read, project)
            : placed(index, w, read, project),
        read,
        project,
      );

      // A folded sitting folds its legs over the last phase of its route.
      const out: IAutoMovieMotionHumanPosture =
        folded === undefined || index < route.length - 1 || u <= 0
          ? rested
          : folded(rested, u, read, project);
      if (arrived) held = out;
      return out;
    };

    const lying: IAutoMovieMotionHumanPrimitive = {
      channels: [
        "root",
        "trunk",
        "head",
        "leftLeg",
        "rightLeg",
        "leftArm",
        "rightArm",
      ],
      reads: [],
      from: 0,
      to: duration,
      write: (
        _: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: ReturnType<typeof prepareHumanPostureProjection>,
      ): IAutoMovieMotionHumanPosture => at(seconds, resolution, projection),
    };
    const settled: number = clock.at("settled") / duration;
    const sitting: boolean = position.startsWith("sit");
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      sitting
        ? {
            // Seated on the floor, the seat bears, and the base the next action is entered on is a seated one.
            part: "seat",
            kind: "seat",
            from: settled,
            to: 1,
            support: { kind: "ground" },
          }
        : {
            // The contact parts have no chest or side; the trunk's window is
            // named by the back for every lying position.
            part: "back",
            kind: "lie",
            from: settled,
            to: 1,
            support: { kind: "ground" },
          },
    ];
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
    // Each key-to-key blend's arm room (`floorArmRoom`) is read once when
    // placement is final, at one interior second of the blend, so the first
    // displayed second of a blend reads a kept scan instead of making it.
    // The playback has no phase of its own: only its setup is used.
    HumanPreparedPlayback.attach(lain, body, {
      mode: "posture",
      phases: [],
      prepare: (): void => {
        for (let i: number = 0; i < route.length; i++) {
          const from: number = clock.at(phases[i]!.name);
          const to: number = clock.at(phases[i + 1]!.name);
          if (to > from) at((from + to) / 2);
        }
      },
    });
    return lain;
  }
}
