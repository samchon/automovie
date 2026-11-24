import { createSnorkel, createSwimFin } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGesture,
  AutoMovieMotionHumanHandToBody,
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { HumanEmblem } = AutoMovieMotionHumanGesture;

/** The water surface, world metres. */
const WATER: number = 0;

/** The diver's trim band about the horizontal, degrees (PADI horizontal trim). */
const TRIM: number = 15;

/**
 * Fin swimming under water, a duck dive and snorkelling, for two bodies.
 *
 * Scenarios:
 *
 * 1. Under water the diver holds horizontal trim at the authored depth, and a
 *    larger blade swims faster, by less than the square root of the area ratio
 *    its thrust alone would give, since the blade drags too.
 * 2. A duck dive raises the legs vertical above the surface before sinking and
 *    ascends with the raised hand above the head; a depth beyond the breath
 *    hold is refused with the reachable depth.
 * 3. Snorkelling keeps the worn snorkel's top above the surface.
 * 4. The equalizing nose pinch and the OK and up hand signals ride the fin swim,
 *    and the worn fin stays on its foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three acts, the gear and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered aquatic fin kinds with worn fin and snorkel archetypes and reads displayed bones and worn prop frames.
 * @evidence contracts/development/testing.md#independent-expectations The thrust-drag balance gives a speed that grows with blade area but by less than its square root, since the blade's own plate drag grows with it; the surface bounds the legs, the hand and the snorkel; PADI's trim bounds the attitude.
 * @evidence contracts/development/testing.md#distinguishing-cases Two blade sizes, a reachable and an unreachable depth, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of generated bodies and archetypes.
 */
export function test_motion_swim_fin_swim(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const profile of ["m-average", "f-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);

      // Under water at depth, with two blade sizes.
      const swim = (length: number): HumanPerformance =>
        stage(
          body,
          { kind: "finSwim", water: WATER, depth: 2, duration: 5, prop: "fin" },
          [fin("fin", "leftFoot", length)],
        );
      const small: HumanPerformance = swim(0.3);
      const large: HumanPerformance = swim(0.45);
      verdict(
        checks,
        `${profile}: the fin swim passes the generic audit`,
        small,
      );
      const trim = (film: HumanPerformance, seconds: number): number => {
        const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
          "diver",
          seconds,
        );
        const axis: IAutoMovieVector3 = Vector3.subtract(
          bones.get("head")!.worldPosition,
          bones.get("hips")!.worldPosition,
        );
        return (Math.asin(axis.y / Vector3.length(axis)) * 180) / Math.PI;
      };
      checks.check(
        `${profile}: the diver holds horizontal trim at depth (${trim(small, 3).toFixed(1)} deg)`,
        Math.abs(trim(small, 3)) <= TRIM &&
          Math.abs(
            small.bones("diver", 3).get("hips")!.worldPosition.y - (WATER - 2),
          ) < 0.05,
      );
      const speed = (film: HumanPerformance): number =>
        Vector3.distance(
          film.bones("diver", 4.5).get("hips")!.worldPosition,
          film.bones("diver", 2.5).get("hips")!.worldPosition,
        ) / 2;
      checks.check(
        `${profile}: speed grows with blade area, short of its square root`,
        speed(large) / speed(small) > 1.01 &&
          speed(large) / speed(small) < Math.sqrt(0.45 / 0.3),
      );

      // Hand signals over the swim, and the worn fin on its foot.
      const signals: HumanPerformance = new HumanPerformance({
        seed: "fin-signals",
        laws: [
          AutoMovieMotionHumanSwim.aquatic,
          AutoMovieMotionHumanHandToBody.HumanHandToFaceRows.facePinchNose,
          HumanEmblem.okSign,
          HumanEmblem.thumbsUp,
        ],
        performers: [diverAt(body)],
        props: [fin("fin", "leftFoot", 0.35)],
        composition: HumanChain.subject("diver")
          .registered("aquatic", {
            kind: "finSwim",
            water: WATER,
            depth: 2,
            duration: 6,
            prop: "fin",
          })
          .over((u: ReturnType<typeof HumanChain.subject>) =>
            u
              .registered("facePinchNose", {})
              .registered("okSign", {})
              .registered("thumbsUp", {}),
          ).node,
      });
      checks.check(
        `${profile}: the equalizing pinch and the OK and up signals ride the fin swim`,
        signals
          .overlays("diver")
          .map((o): string => o.name)
          .join(",") === "facePinchNose,okSign,thumbsUp",
      );
      const mount: number[] = [1, 3, 5].map((seconds: number): number =>
        Vector3.distance(
          signals.prop("fin", seconds).position,
          signals.bones("diver", seconds).get("leftFoot")!.worldPosition,
        ),
      );
      checks.check(
        `${profile}: the worn fin stays on its foot`,
        Math.max(...mount) - Math.min(...mount) < 0.01,
      );
      // The duck dive.
      const dive: HumanPerformance = stage(
        body,
        { kind: "duckDive", water: WATER, depth: 3, prop: "fin" },
        [fin("fin", "leftFoot", 0.35)],
      );
      const segment: IAutoMovieMotionHumanSegment = dive.segments("diver")[0]!;
      verdict(
        checks,
        `${profile}: the duck dive passes the generic audit`,
        dive,
      );
      const up: ReturnType<HumanPerformance["bones"]> = dive.bones(
        "diver",
        at(segment, "legsUp"),
      );
      const legs: IAutoMovieVector3 = Vector3.subtract(
        up.get("leftFoot")!.worldPosition,
        up.get("hips")!.worldPosition,
      );
      checks.check(
        `${profile}: the legs stand vertical above the surface before sinking`,
        up.get("leftFoot")!.worldPosition.y > WATER &&
          legs.y / Vector3.length(legs) > Math.cos((20 * Math.PI) / 180),
      );
      const rising: number =
        (at(segment, "ascend") + segment.start + segment.plan.duration) / 2;
      const ascent: ReturnType<HumanPerformance["bones"]> = dive.bones(
        "diver",
        rising,
      );
      checks.check(
        `${profile}: the raised hand leads the ascent above the head`,
        ascent.get("rightHand")!.worldPosition.y >
          ascent.get("head")!.worldPosition.y,
      );
      let refusal: unknown;
      try {
        stage(
          body,
          { kind: "duckDive", water: WATER, depth: 30, prop: "fin" },
          [fin("fin", "leftFoot", 0.35)],
        );
      } catch (error: unknown) {
        refusal = error;
      }
      checks.check(
        `${profile}: a depth beyond the breath hold is refused with the reachable depth`,
        refusal instanceof HumanRefusal &&
          refusal.axis === "depth" &&
          refusal.feasible !== null,
      );

      // Snorkelling at the surface with a worn snorkel.
      const snorkel: IAutoMovieMotionHumanProp = worn(
        HumanObject.prop("snorkel", createSnorkel({}, 1), {
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
        }),
        "head",
        {
          position: { x: 0, y: 0.05, z: 0.1 },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
        },
      );
      const surface: HumanPerformance = stage(
        body,
        { kind: "snorkel", water: WATER, duration: 4, prop: "fin" },
        [fin("fin", "leftFoot", 0.35), snorkel],
      );
      const top = (seconds: number): number => {
        const frame: IAutoMovieRigidTransform = surface.prop(
          "snorkel",
          seconds,
        );
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            createSnorkel({}, 1).affordance("top").frame.translation,
          ),
        ).y;
      };
      checks.check(
        `${profile}: the snorkel's top stays above the surface`,
        [1, 2, 3, 4].every((seconds: number): boolean => top(seconds) > WATER),
      );
    } catch (error: unknown) {
      checks.check(
        `${String(profile)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("swim fin swim");
}

/** A diver at the surface over the pool, with worn gear. */
function stage(
  body: IAutoMovieMotionHumanBody,
  params: IAutoMovieMotionHumanAquatic.IParams,
  props: readonly IAutoMovieMotionHumanProp[],
): HumanPerformance {
  const diver: IAutoMovieMotionHumanPerformer = diverAt(body);
  return new HumanPerformance({
    seed: `fin-${params.kind}`,
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers: [diver],
    props: [...props],
    composition: HumanChain.subject("diver").registered("aquatic", params).node,
  });
}

/** The diver at the surface over the pool. */
function diverAt(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPerformer {
  return {
    subject: "diver",
    body,
    at: { x: 0, y: WATER - 1.4, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
}

/** A fin of a blade length worn on a foot. */
function fin(
  subject: string,
  bone: IAutoMovieMotionHumanProp.IWorn["bone"],
  length: number,
): IAutoMovieMotionHumanProp {
  return worn(
    HumanObject.prop(subject, createSwimFin({ length }, 1), {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    }),
    bone,
    { position: { x: 0, y: -0.07, z: 0 }, rotation: Quaternion.identity() },
  );
}

/** A prop worn from the film's start on a bone of the diver. */
function worn(
  prop: IAutoMovieMotionHumanProp,
  bone: IAutoMovieMotionHumanProp.IWorn["bone"],
  offset: IAutoMovieRigidTransform,
): IAutoMovieMotionHumanProp {
  return { ...prop, worn: { subject: "diver", bone, offset } };
}

/** The film second of a segment's event. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((event): boolean => event.name === name)!.share
  );
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
