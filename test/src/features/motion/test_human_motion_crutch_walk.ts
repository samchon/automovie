import { type Archetype, createAxillaryCrutch } from "@automovie/archetypes";
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
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanCrutchWalk,
  HumanFoot,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A crutch's length as a share of its user's stature (provisional: the clinical fitting, the pad two to three finger widths below the axilla). */
const FIT: number = 0.77;

/** How far beside and ahead of each foot a crutch tip stands at entry, metres: the tripod position (Physiopedia, Crutches). */
const TRIPOD: number = 0.15;

/** How still a planted crutch tip stays, metres. */
const STILL: number = 0.002;

/** How far a bearing hand may lie from its handgrip, metres: the touch contract's bound. */
const GRIP: number = 0.01;

/** How far below the axilla the underarm pad must stay, metres: two finger widths (provisional). */
const AXILLA: number = 0.03;

/** The gaits walked. */
const PATTERNS: readonly IAutoMovieMotionHumanCrutchWalk.Pattern[] = [
  "threePoint",
  "swingTo",
  "swingThrough",
];

/**
 * Walking on two crutches (#3994).
 *
 * Scenarios, on the average man and the small woman, for the three-point,
 * swing-to and swing-through gaits, each take clean:
 * 1. Both crutch tips plant before each swing and stay planted through it.
 * 2. The hands bear on the handgrips through each swing, within 10 mm, and
 *    the underarm pads stay below the axillae.
 * 3. A three-point gait never puts the injured foot on the floor; a
 *    swing-through gait lands the feet past the tips, a swing-to gait level
 *    with them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the crutches' displayed frames, the hands at the handgrips, the soles and the shoulders through each station; a crutch moving in a swing, a hand off its grip, a pad in the axilla, an injured foot down or a foot landing short fails.
 * @evidence contracts/development/testing.md#independent-expectations The gait orders and the tripod are Physiopedia's crutch gaits; the grip bound is the touch contract's.
 * @evidence contracts/development/testing.md#distinguishing-cases Three gaits on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_human_motion_crutch_walk(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    for (const pattern of PATTERNS) {
      const label: string = `${fit} ${pattern}`;
      const { film, params, models }: IWalk = walk(body, pattern);
      assertTakeClean(label, film);
      const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      const at: (name: string) => number = (name: string): number =>
        segment.start +
        segment.plan.duration *
          segment.plan.events.find(
            (event: IAutoMovieMotionEvent): boolean => event.name === name,
          )!.share;
      params.stations.forEach((_station: IAutoMovieMotionHumanAidWalk.IStation, i: number): void => {
        const plant: number = at(`crutchPlant${i + 1}`);
        const land: number = at(`footLand${i + 1}`);
        for (const side of ["left", "right"] as const) {
          const subject: string = side === "left" ? params.left : params.right;
          const first: IAutoMovieRigidTransform = film.prop(subject, plant);
          const last: IAutoMovieRigidTransform = film.prop(subject, land);
          TestValidator.predicate(
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
          TestValidator.predicate(
            `${label}: the ${side} hand bears on its grip in swing ${i + 1} (${(off * 1000).toFixed(1)} mm)`,
            off <= GRIP + body.measure.hand / 2,
          );
          const pad: number =
            crutch.position.y +
            Quaternion.rotateVector(
              crutch.rotation,
              models[side].site("pad").translation,
            ).y;
          TestValidator.predicate(
            `${label}: the ${side} pad stays below the axilla in swing ${i + 1}`,
            pad <= bones.get(`${side}UpperArm`)!.worldPosition.y - AXILLA,
          );
        }
      });
      if (pattern === "threePoint") {
        const injured: AutoMovieHumanSide = params.injured ?? "left";
        const steps: number = 24;
        TestValidator.predicate(
          `${label}: the injured foot never bears`,
          Array.from({ length: steps + 1 }, (_v: unknown, k: number): number =>
            segment.start + (segment.plan.duration * k) / steps,
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
        TestValidator.predicate(
          `${label}: the feet land ${pattern === "swingThrough" ? "past" : "level with"} the tips (${((feet - tips.z) * 1000).toFixed(0)} mm)`,
          pattern === "swingThrough"
            ? feet > tips.z
            : Math.abs(feet - tips.z) <= body.measure.footLength / 2,
        );
      }
    }
  }
}

/** One crutch walk and what its checks read. */
interface IWalk {
  /** The performance. */
  film: HumanPerformance;

  /** The walk's parameters. */
  params: IAutoMovieMotionHumanCrutchWalk;

  /** Each side's crutch model. */
  models: Record<AutoMovieHumanSide, CrutchModel>;
}

/** Where a prop is staged: its floor point and heading. */
interface IPlaced {
  /** The floor point, world metres. */
  at: IAutoMovieVector3;

  /** The heading, degrees. */
  yaw: number;
}

/** An axillary crutch's model. */
type CrutchModel = Archetype<
  createAxillaryCrutch.Affordance,
  createAxillaryCrutch.Dimension
>;

/** A performer `a` at the origin facing +Z, its crutches in the tripod, walking three stations. */
function walk(
  body: IAutoMovieMotionHumanBody,
  pattern: IAutoMovieMotionHumanCrutchWalk.Pattern,
): IWalk {
  const length: number = Math.min(
    createAxillaryCrutch.BANDS.length.maximum,
    Math.max(createAxillaryCrutch.BANDS.length.minimum, FIT * body.measure.stature),
  );
  const model: () => CrutchModel = (): CrutchModel => createAxillaryCrutch({ length });
  const models: Record<AutoMovieHumanSide, CrutchModel> = {
    left: model(),
    right: model(),
  };
  const params: IAutoMovieMotionHumanCrutchWalk = {
    left: "leftCrutch",
    right: "rightCrutch",
    pattern,
    stations: [
      { x: 0, z: 0.3, seconds: 1.2 },
      { x: 0, z: 0.6, seconds: 1.2 },
      { x: 0, z: 0.9, seconds: 1.2 },
    ],
  };
  const props: IAutoMovieMotionHumanProp[] = (["left", "right"] as const).map((side: AutoMovieHumanSide): IAutoMovieMotionHumanProp => {
    const x: number =
      body.rest.get(`${side}Foot`)!.x + (side === "left" ? TRIPOD : -TRIPOD);
    const placed: IPlaced = {
      at: { x, y: 0, z: TRIPOD },
      yaw: 0,
    };
    return HumanObject.prop(
      side === "left" ? params.left : params.right,
      models[side],
      placed,
      HumanCrutchWalk.track(HumanObject.frame(placed), params, side),
    );
  });
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
    laws: [HumanCrutchWalk],
    composition: HumanChain.subject("a").registered(HumanCrutchWalk.name, params)
      .node,
  });
  return { film, params, models };
}
