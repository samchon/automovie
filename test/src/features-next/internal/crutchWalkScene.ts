import {
  type AutoMovieArchetype,
  createAxillaryCrutch,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * The two-crutch walk of `test_motion_gait_crutch_walk`, staged as that spec
 * stages it, with its checks for one body and gait gathered rather than
 * stopping at the first, so each gait and the turning walk are units of their
 * own and no cell hides another.
 */
export namespace crutchWalkScene {
  /** An axillary crutch's model. */
  export type CrutchModel = AutoMovieArchetype<
    createAxillaryCrutch.Affordance,
    createAxillaryCrutch.Dimension
  >;

  /** One crutch walk and what its checks read. */
  export interface IWalk {
    /** The performance. */
    film: HumanPerformance;

    /** The walk's parameters. */
    params: IAutoMovieMotionHumanCrutchWalk;

    /** Each side's crutch model. */
    models: Record<AutoMovieHumanSide, CrutchModel>;
  }

  /**
   * A crutch's length as a share of its user's stature (provisional: the
   * clinical fitting, the pad two to three finger widths below the axilla).
   */
  const FIT: number = 0.77;

  /**
   * How far beside and ahead of each foot a crutch tip stands at entry, metres:
   * the tripod position (Physiopedia, Crutches).
   */
  const TRIPOD: number = 0.15;

  /** How still a planted crutch tip stays, metres. */
  const STILL: number = 0.002;

  /**
   * How far a bearing hand may lie from its handgrip, metres: the touch
   * contract's bound.
   */
  const GRIP: number = 0.01;

  /**
   * How far below the axilla the underarm pad must stay, metres: two finger
   * widths (provisional).
   */
  const AXILLA: number = 0.03;

  /**
   * How far a turning crutch's heading may stray from the walker's, radians: a
   * tenth of a degree.
   */
  const BEARING: number = (0.1 * Math.PI) / 180;

  /**
   * A walk turning left about its entry station: two stations, 10 then 20
   * degrees, each 0.3 m on.
   */
  export const TURNING: readonly IAutoMovieMotionHumanAidWalk.IStation[] = [
    { x: 0.05, z: 0.3, turn: 10, seconds: 1.2 },
    { x: 0.15, z: 0.58, turn: 20, seconds: 1.2 },
  ];

  /** Where a prop is staged: its floor point and heading. */
  interface IPlaced {
    /** The floor point, world metres. */
    at: IAutoMovieVector3;

    /** The heading, degrees. */
    yaw: number;
  }

  /**
   * A performer `a` at the origin facing +Z, its crutches in the tripod,
   * walking three straight stations, or the given ones turning about the
   * origin.
   */
  export function walk(
    body: IAutoMovieMotionHumanBody,
    pattern: IAutoMovieMotionHumanCrutchWalk.Pattern,
    turning?: readonly IAutoMovieMotionHumanAidWalk.IStation[],
  ): IWalk {
    const length: number = Math.min(
      createAxillaryCrutch.BANDS.length.maximum,
      Math.max(
        createAxillaryCrutch.BANDS.length.minimum,
        FIT * body.measure.stature,
      ),
    );
    const models: Record<AutoMovieHumanSide, CrutchModel> = {
      left: createAxillaryCrutch({ length }),
      right: createAxillaryCrutch({ length }),
    };
    const params: IAutoMovieMotionHumanCrutchWalk = {
      left: "leftCrutch",
      right: "rightCrutch",
      pattern,
      stations: turning ?? [
        { x: 0, z: 0.3, seconds: 1.2 },
        { x: 0, z: 0.6, seconds: 1.2 },
        { x: 0, z: 0.9, seconds: 1.2 },
      ],
      // The performer stands at the world origin: the entry station.
      origin: { x: 0, y: 0, z: 0 },
    };
    const props: IAutoMovieMotionHumanProp[] = (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanProp => {
        const x: number =
          body.rest.get(`${side}Foot`)!.x +
          (side === "left" ? TRIPOD : -TRIPOD);
        const placed: IPlaced = { at: { x, y: 0, z: TRIPOD }, yaw: 0 };
        return HumanObject.prop(
          side === "left" ? params.left : params.right,
          models[side],
          placed,
          AutoMovieMotionHumanGait.crutchWalk.track(
            HumanObject.frame(placed),
            params,
            side,
          ),
        );
      },
    );
    const film: HumanPerformance = new HumanPerformance({
      seed: "crutch walk",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props,
      laws: [AutoMovieMotionHumanGait.crutchWalk],
      composition: HumanChain.subject("a").registered(
        AutoMovieMotionHumanGait.crutchWalk.name,
        params,
      ).node,
    });
    return { film, params, models };
  }

  /** The film second of the walk's named event. */
  function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
    return (
      segment.start +
      segment.plan.duration *
        segment.plan.events.find(
          (event: IAutoMovieMotionEvent): boolean => event.name === name,
        )!.share
    );
  }

  /**
   * One body's walk in one gait with the original's checks 1 to 3, gathered,
   * and the walk's own bounds.
   */
  export function verify(
    checks: motionComplaints.IGatherer,
    body: IAutoMovieMotionHumanBody,
    label: string,
    pattern: IAutoMovieMotionHumanCrutchWalk.Pattern,
  ): void {
    const { film, params, models }: IWalk = walk(body, pattern);
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    params.stations.forEach(
      (_station: IAutoMovieMotionHumanAidWalk.IStation, i: number): void => {
        const plant: number = at(segment, `crutchPlant${i + 1}`);
        const land: number = at(segment, `footLand${i + 1}`);
        for (const side of ["left", "right"] as const) {
          const subject: string = side === "left" ? params.left : params.right;
          const first: IAutoMovieRigidTransform = film.prop(subject, plant);
          const last: IAutoMovieRigidTransform = film.prop(subject, land);
          checks.check(
            `${label}: the ${side} crutch is planted through swing ${i + 1}`,
            Vector3.distance(first.position, last.position) <= STILL,
          );
          const mid: number = (plant + land) / 2;
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("a", mid);
          const crutch: IAutoMovieRigidTransform = film.prop(subject, mid);
          const grip: IAutoMovieVector3 = Vector3.add(
            crutch.position,
            Quaternion.rotateVector(
              crutch.rotation,
              models[side].site("grip").translation,
            ),
          );
          const off: number = Vector3.distance(
            bones.get(`${side}Hand`)!.worldPosition,
            grip,
          );
          checks.check(
            `${label}: the ${side} hand bears on its grip in swing ${i + 1} (${(off * 1000).toFixed(1)} mm)`,
            off <= GRIP + body.measure.hand / 2,
          );
          const pad: number =
            crutch.position.y +
            Quaternion.rotateVector(
              crutch.rotation,
              models[side].site("pad").translation,
            ).y;
          checks.check(
            `${label}: the ${side} pad stays below the axilla in swing ${i + 1}`,
            pad <= bones.get(`${side}UpperArm`)!.worldPosition.y - AXILLA,
          );
        }
      },
    );
    if (pattern === "threePoint") {
      const injured: AutoMovieHumanSide = params.injured ?? "left";
      const steps: number = 24;

      // The walker enters standing on both feet; the injured foot is held
      // off from the first crutch plant, once the hands bear.
      const held: number = at(segment, "crutchPlant1");
      checks.check(
        `${label}: the injured foot never bears once the hands bear`,
        Array.from(
          { length: steps + 1 },
          (_v: unknown, k: number): number =>
            held + ((segment.end - held) * k) / steps,
        ).every((t: number): boolean =>
          HumanFoot.sockets(body, film.bones("a", t), injured).every(
            (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
              socket.point.y > HumanFoot.BEARING,
          ),
        ),
      );
    } else {
      const end: number = segment.end;
      const tips: IAutoMovieVector3 = Vector3.lerp(
        film.prop(params.left, end).position,
        film.prop(params.right, end).position,
        0.5,
      );
      const feet: number =
        (film.bones("a", end).get("leftFoot")!.worldPosition.z +
          film.bones("a", end).get("rightFoot")!.worldPosition.z) /
        2;
      checks.check(
        `${label}: the feet land ${pattern === "swingThrough" ? "past" : "level with"} the tips (${((feet - tips.z) * 1000).toFixed(0)} mm)`,
        pattern === "swingThrough"
          ? feet > tips.z
          : Math.abs(feet - tips.z) <= body.measure.footLength / 2,
      );
    }
    motionActionUnit.bounds(checks, label, film, "a", segment);
  }

  /**
   * The turning swing-to walk's check 4, gathered: each crutch keeps its entry
   * offset and bearing from the walker's station at every landing, and the
   * walk's own bounds.
   */
  export function turning(
    checks: motionComplaints.IGatherer,
    body: IAutoMovieMotionHumanBody,
  ): void {
    const { film, params }: IWalk = walk(body, "swingTo", TURNING);
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const origin: IAutoMovieVector3 = params.origin!;
    params.stations.forEach(
      (station: IAutoMovieMotionHumanAidWalk.IStation, i: number): void => {
        const land: number = at(segment, `footLand${i + 1}`);
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          station.turn ?? 0,
        );
        const walker: IAutoMovieVector3 = Vector3.add(origin, {
          x: station.x,
          y: 0,
          z: station.z,
        });
        for (const side of ["left", "right"] as const) {
          const subject: string = side === "left" ? params.left : params.right;
          const entry: IAutoMovieRigidTransform = film.prop(
            subject,
            segment.start,
          );
          const shown: IAutoMovieRigidTransform = film.prop(subject, land);
          const expected: IAutoMovieVector3 = Vector3.add(
            walker,
            Quaternion.rotateVector(
              turn,
              Vector3.subtract(entry.position, origin),
            ),
          );
          const bearing: number = Quaternion.angle(
            shown.rotation,
            Quaternion.multiply(turn, entry.rotation),
          );
          checks.check(
            `turning: the ${side} crutch keeps its place beside the walker at landing ${i + 1} (${(Vector3.distance(shown.position, expected) * 1000).toFixed(1)} mm, ${((bearing * 180) / Math.PI).toFixed(2)} deg)`,
            Vector3.distance(shown.position, expected) <= STILL &&
              bearing <= BEARING,
          );
        }
      },
    );
    motionActionUnit.bounds(checks, "turning", film, "a", segment);
  }
}
