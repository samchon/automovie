import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { courseArmGoal } from "../compose/internal/courseArmGoal";
import { seated } from "../everyday/internal/seated";
import { sitPlace } from "../everyday/internal/sitPlace";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { precisionStrokePeak } from "../lexicon/internal/precisionStrokePeak";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticProp } from "./AquaticProp";

const PERIOD: number = 60 / 26;
const EXTRACTION: number = 0.44;
const SIDES = [
  ["left", "Left"],
  ["right", "Right"],
] as const;
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

type Station = IAutoMovieMotionHumanAquatic.Station;

/**
 * A rower at a named racing-shell station. The rower's cycle drives its actual
 * oar swivels, dips and seat carriage. Crew phase is an authored film offset.
 * The hull's rigid course stays with the placed scene prop.
 */
export namespace AquaticScull {
  /**
   * Lay three repeated cycles for one person on their own traveling seat, with
   * anatomically bound handles and footplates. The sequence landmarks use
   * Cuijpers et al. at 26 strokes a minute (doi:10.1111/sms.12800, corrected by
   * doi:10.1111/sms.13507). Oar angles are authored for the shot.
   */
  export function plan(
    context: AquaticPosture.Context,
    station: Station,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params, start } = context;
    if (params.support === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "support",
        value: null,
        feasible: null,
        reason: "a racing crew station needs its moving shell",
        fix: "name the shell subject in support",
      });
    const prop: IAutoMovieMotionHumanPropReader = context.prop(params.support);
    if (prop.prop.articulate === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "support",
        value: prop.prop.subject,
        reason: "a racing crew station needs a posed seat and sculls",
        fix: "register an articulated shell with the station contacts",
      });
    const subject: string = prop.prop.subject;
    const seatName: string = `${station}Seat`;
    const slideName: string = `${station}Slide`;
    const carrier: AquaticProp.IContacts = AquaticProp.at(prop, start, {
      [slideName]: 0,
    });
    const seat: AquaticProp.IContact = carrier.require(seatName, "seat");
    const slide: AquaticProp.IContact = carrier.require(slideName, "slider");
    const travel: number = admitRail(context, station, carrier, seat, slide);
    const oars = SIDES.flatMap(([, title]) => {
      const sweep: string = `${station}${title}Sweep`;
      const dip: string = `${station}${title}Dip`;
      const lock: IAutoMovieAffordance = carrier.require(
        sweep,
        "wheel",
      ).affordance;
      const tip: IAutoMovieAffordance = carrier.require(
        `${station}${title}BladeTip`,
        "surface",
      ).affordance;
      carrier.require(dip, "hinge");
      carrier.require(`${station}${title}Handle`, "handle");
      // Start at the hull's reference waterline. Derive each angle from its
      // own lock elevation so the two visible blades can work at equal depth.
      const arm: number = Vector3.distance(
        lock.frame.translation,
        tip.frame.translation,
      );
      const immersion: number = (lock.frame.translation.y + 0.01) / arm;
      if (!(immersion > 0 && immersion < 1))
        throw new HumanRefusal({
          kind: "affordance",
          axis: "station",
          value: station,
          reason: "the scull cannot reach the hull's reference waterline",
          fix: "supply an oarlock and blade tip with reachable immersed travel",
        });
      const atWater: number = (-Math.asin(immersion) * 180) / Math.PI;
      return [
        [sweep, (drive: number): number => 35 - 62 * drive] as const,
        [
          dip,
          (drive: number, lift: number): number =>
            atWater - 2 * Math.sin(Math.PI * drive) + 6.3 * lift,
        ] as const,
      ];
    });
    const offset: number = (params.phase ?? 0) % 1;
    const duration: number = 3 * PERIOD;
    const parts = [
      [slideName, (drive: number): number => drive * travel],
      ...oars,
    ] as const;
    const drives: IAutoMovieMotionPropDrive[] = parts.map(
      ([articulation, value]): IAutoMovieMotionPropDrive => ({
        prop: subject,
        articulation,
        from: 0,
        to: 1,
        travel: (seconds: number): number => {
          const phase = stroke(seconds / PERIOD + offset);
          return value(phase.drive, phase.lift);
        },
      }),
    );
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      AquaticCrew.bear(subject, "seat", "seat", 0, 1),
      ...SIDES.flatMap(([side]): IAutoMovieMotionHumanContactWindow[] => [
        AquaticCrew.bear(subject, `${side}Foot`, "plant", 0, 1),
        {
          part: `${side}Hand`,
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject, carries: false },
        },
      ]),
    ];
    const events: IAutoMovieMotionEvent[] = [];
    for (let cycle: number = 0; cycle <= 3; ++cycle)
      for (const [name, mark] of [
        ["catch", 0],
        ["extract", EXTRACTION],
        ["clear", EXTRACTION + 0.11],
      ] as const) {
        const share: number = (cycle + mark - offset) / 3;
        if (share >= 0 && share < 1)
          events.push({ name: `${name}${cycle + 1}`, share });
      }
    events.push({ name: "relax", share: 1 });
    const goals: IAutoMovieMotionHumanActionPlan = {
      duration,
      contacts,
      drives,
      events,
      posture(seconds: number): IAutoMovieMotionHumanPosture {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const { drive, lift } = stroke(t / PERIOD + offset);
        const live: AquaticProp.IContacts = AquaticProp.at(
          prop,
          start + t,
          Object.fromEntries(
            parts.map(([id, value]) => [id, value(drive, lift)]),
          ),
        );
        const seat: AquaticProp.IContact = live.require(seatName, "seat");
        const lean: number = 29 - 42 * drive + 4 * lift;
        const shape: IAutoMovieMotionHumanPosture = AquaticPosture.key(
          entry.posture,
          ExerciseKey.from(
            body,
            {
              spine: [lean * 0.6, 0, 0],
              chest: [lean * 0.4, 0, 0],
              neck: -lean * 0.4,
            },
            {
              hip: 79 - 22 * drive,
              knee: 113 - 94 * drive,
              shoulder: 72 - 63 * drive,
              raise: 29,
              elbow: 14 + 84 * drive,
            },
          ),
        );
        const posture: IAutoMovieMotionHumanPosture = {
          ...shape,
          ...humanPostureHeading.angles(seat.world.rotation),
        };
        posture.root = seated.root(body, seatPoint(seat), posture);
        for (const [side, title] of SIDES) {
          const foot = stretcher(
            context,
            side,
            live.require(`${station}${title}Foot`, "surface").world,
          );
          posture.limbs[`${side}Leg`] = {
            ...AutoMovieMotionHumanLeg.goal(body, posture, side, foot, false),
            contact: foot.contact,
          };
          posture.limbs[`${side}Arm`] = AquaticProp.hold(
            body,
            posture,
            side,
            live.require(`${station}${title}Handle`, "handle").world,
          );
        }
        return posture;
      },
    };

    // Both hands follow their handles from the first instant to the end as
    // one admitted course of the two arms (courseArmGoal), not a fit of
    // each arm afresh at every second, where the forearm went into the
    // trunk at the finish and the fit turned the forearm half a turn as the
    // handles swept: the hold fitted instant by instant on the branch and
    // swivel the instant before chose, clear of the body, at the strokes'
    // own pace (the handles' fastest speed, precisionStrokePeak).
    const fastest: number = Math.max(
      precisionStrokePeak(goals.posture, "leftArm", duration),
      precisionStrokePeak(goals.posture, "rightArm", duration),
    );
    const pace = (): number => fastest;
    return courseArmGoal({
      context,
      plan: goals,
      side: "left",
      rest: AutoMovieMotionHumanArm.angles(entry.pose, "left"),
      span: { start: 0, ready: 0, relax: duration, end: duration },
      pace,
      with: [
        {
          side: "right",
          rest: AutoMovieMotionHumanArm.angles(entry.pose, "right"),
        },
      ],
    });
  }
}

/** The stroke cycle at one instant. */
interface IStroke {
  /** Drive progress: 0 at the catch, 1 at extraction, back to 0 over recovery. */
  drive: number;

  /** Blade lift out of the water over recovery, in [0, 1]. */
  lift: number;
}

/** A foot goal set on a stretcher plate. */
interface IStretcherGoal {
  /** World ankle target, metres. */
  ankle: IAutoMovieVector3;

  /** World foot rotation. */
  rotation: IAutoMovieQuaternion;

  /** The sole ball offset in the foot frame, metres. */
  contact: IAutoMovieVector3;
}

/** One complete periodic drive with lift and an unloaded return. */
function stroke(total: number): IStroke {
  const at: number = total - Math.floor(total);
  const recovery: number = Math.max(0, (at - EXTRACTION) / (1 - EXTRACTION));
  return {
    drive:
      at <= EXTRACTION
        ? minimumJerk.share(at / EXTRACTION)
        : 1 - minimumJerk.share(recovery),
    lift: Math.sin(Math.PI * recovery),
  };
}

/** The anatomical seat socket bears in the middle of the moving seat surface. */
function seatPoint(seat: AquaticProp.IContact): IAutoMovieVector3 {
  return Vector3.add(
    seat.world.translation,
    Quaternion.rotateVector(seat.world.rotation, {
      x: 0,
      y: 0,
      z: -(seat.affordance.depth ?? 0) / 2,
    }),
  );
}

/**
 * Turn the foot along the stretcher's toe-facing X axis and put its sole ball
 * on the plate.
 */
function stretcher(
  { body }: AquaticPosture.Context,
  side: AutoMovieHumanSide,
  plate: AquaticProp.IContact["world"],
): IStretcherGoal {
  const rotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
    plate.rotation,
    Quaternion.fromAxisAngle(UP, 90),
  );
  const contact: IAutoMovieVector3 = HumanFoot.offset(body, side, "ball");
  return {
    rotation,
    contact,
    ankle: Vector3.subtract(
      plate.translation,
      Quaternion.rotateVector(rotation, contact),
    ),
  };
}

/**
 * Intersect both legs' reach along the actual modeled rail; stop short of knee
 * lock.
 */
function admitRail(
  context: AquaticPosture.Context,
  station: Station,
  carrier: AquaticProp.IContacts,
  seat: AquaticProp.IContact,
  slide: AquaticProp.IContact,
): number {
  const { body } = context;
  const heading = humanPostureHeading.angles(seat.world.rotation);
  const root: IAutoMovieVector3 = seated.root(body, seatPoint(seat), heading);
  const along: IAutoMovieVector3 = Quaternion.rotateVector(
    slide.world.rotation,
    {
      x: 1,
      y: 0,
      z: 0,
    },
  );
  let travel: number = slide.affordance.travel ?? 0;
  for (const [side, title] of SIDES) {
    const plate: AquaticProp.IContact["world"] = carrier.require(
      `${station}${title}Foot`,
      "surface",
    ).world;
    const foot = stretcher(context, side, plate);
    const hip: IAutoMovieVector3 = Vector3.add(
      root,
      Quaternion.rotateVector(
        seat.world.rotation,
        body.rest.get(`${side}UpperLeg`)!,
      ),
    );
    const from: IAutoMovieVector3 = Vector3.subtract(hip, foot.ankle);
    const squared: number = Vector3.dot(from, from);
    const [near, far] = sitPlace.band(body, side);
    if (squared < near ** 2 || squared >= far ** 2)
      throw new HumanRefusal({
        kind: "reach",
        axis: "station",
        value: station,
        reason: `the ${side} leg cannot fit its foot stretcher at the catch`,
        fix: "choose a shell station with foot stretchers in the performer's seated reach",
      });
    const projected: number = Vector3.dot(from, along);
    travel = Math.min(
      travel,
      Math.sqrt(far ** 2 - squared + projected ** 2) - projected,
    );
  }
  return travel;
}
