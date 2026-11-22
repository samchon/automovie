import { type Archetype, createAxillaryCrutch } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanCrutchSit,
  HumanFoot,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A crutch's length as a share of its user's stature: the clinical fitting the crutch walk's spec stages (axilla to 15 cm beside the heel, Physiopedia, Crutches). */
const FIT: number = 0.77;

/** How far beside and ahead of each foot a crutch tip stands at entry, metres: the tripod position (Physiopedia, Crutches). */
const TRIPOD: number = 0.15;

/** How still a planted crutch tip stays, metres: the campaign's ground-contact bound. */
const STILL: number = 0.002;

/** How far a gripping hand's socket may lie from its handgrip, metres: the touch contract's skin disc. */
const GRIP: number = 0.01;

/** How far a palm resting on an armrest may lie from it, metres: the touch contract's skin disc and the palm's pad. */
const REST: number = 0.03;

/** Armrests 0.2 m above the seat and 0.25 m back from its front, as the frail walk's armchair (provisional armchair). */
const ARMREST: IAutoMovieVector3 = { x: 0, y: 0.2, z: 0.25 };

/** The injured side staged. */
const INJURED: AutoMovieHumanSide = "left";

/**
 * Sitting down onto an armchair and rising from it with both crutches held
 * in the injured side's hand (#3994).
 *
 * Scenarios, on the average man and the small woman, one take each that
 * sits and then rises, the take clean:
 * 1. The sit's steps come in the prescribed order: the crutches taken, both
 *    gathered into the injured side's hand, the sound hand reaching back to
 *    the armrest, then the seat taking the body; the rise's: the seat left,
 *    standing, the sound hand taking its crutch back, both planted.
 * 2. Once taken, each crutch rides its hand's grip socket within 10 mm until
 *    gathered, and the injured hand keeps its own to the end.
 * 3. From the gather until the sound hand takes its crutch back, both
 *    crutch tips stay planted on the floor while the crutches tilt on them.
 * 4. At `reached` the sound palm rests on its armrest.
 * 5. The injured foot never bears from the take to the end.
 * 6. The rise ends with both tips on the floor in the tripod, ahead of the
 *    feet and beside them.
 * 7. A crutch sit naming no seat is refused on `seat`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's events, the crutches' displayed frames, the displayed hands, palm and soles; a step out of order, a dropped or floating crutch, a sliding tip, a hand off the armrest, a bearing injured foot, a tip left in the air or an admitted sit without a seat fails.
 * @evidence contracts/development/testing.md#independent-expectations The orders are Cornell Health's and HealthLinkBC's crutch sit and rise; the tripod is Physiopedia's; the grip and ground bounds are the touch contract's and the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, the sit and the rise, an armrest seat, and the refused seatless sit; the crutch gaits and stairs are their own specs'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_human_motion_crutch_sit(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const { film, models, params, seat }: ITake = take(body, true);
    assertTakeClean(`${fit} crutch sit and rise`, film);
    const [down, up]: IAutoMovieMotionHumanSegment[] = film
      .segments("a")
      .filter(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "crutchSit",
      );
    const at = (segment: IAutoMovieMotionHumanSegment, name: string): number =>
      segment.start +
      segment.plan.duration *
        segment.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === name,
        )!.share;
    const sound: AutoMovieHumanSide = INJURED === "left" ? "right" : "left";
    const subject = (side: AutoMovieHumanSide): string =>
      side === "left" ? params.left : params.right;
    const site = (
      side: AutoMovieHumanSide,
      id: string,
      seconds: number,
    ): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = film.prop(subject(side), seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          models[side].site(id).translation,
        ),
      );
    };

    // 1. The orders.
    const sitOrder: number[] = [
      "taken",
      "gathered",
      "reached",
      "seatContact",
    ].map((name: string): number => at(down!, name));
    const riseOrder: number[] = ["seatOff", "standing", "taken", "planted"].map(
      (name: string): number => at(up!, name),
    );
    TestValidator.predicate(
      `${fit}: the sit takes, gathers, reaches back and sits in order`,
      ascending(sitOrder),
    );
    TestValidator.predicate(
      `${fit}: the rise leaves the seat, stands, takes the crutch back and plants in order`,
      riseOrder[0]! < riseOrder[1]! &&
        riseOrder[1]! <= riseOrder[2]! &&
        riseOrder[2]! < riseOrder[3]!,
    );

    // 2. Each crutch on its hand's grip socket.
    const gripped = (
      hand: AutoMovieHumanSide,
      crutch: AutoMovieHumanSide,
      seconds: number,
    ): number =>
      Vector3.distance(
        HumanHand.frame(body, film.bones("a", seconds), hand, "grip").point,
        site(crutch, "grip", seconds),
      );
    const taken: number = at(down!, "taken");
    const gathered: number = at(down!, "gathered");
    for (const t of [taken + 0.05, (taken + gathered) / 2, gathered])
      for (const side of ["left", "right"] as const)
        TestValidator.predicate(
          `${fit}: the ${side} crutch rides its hand at ${t.toFixed(2)} s (${(gripped(side, side, t) * 1000).toFixed(1)} mm)`,
          gripped(side, side, t) <= GRIP,
        );
    for (const t of [at(down!, "seated"), at(up!, "standing"), up!.end])
      TestValidator.predicate(
        `${fit}: the injured hand keeps its crutch at ${t.toFixed(2)} s (${(gripped(INJURED, INJURED, t) * 1000).toFixed(1)} mm)`,
        gripped(INJURED, INJURED, t) <= GRIP,
      );

    // 3. The tips planted through the sit and the rise to the take back.
    const from: number = gathered;
    const to: number = at(up!, "taken");
    for (const side of ["left", "right"] as const) {
      const first: IAutoMovieVector3 = site(side, "tip", from);
      const slide: number = Math.max(
        ...Array.from({ length: 13 }, (_v: unknown, k: number): number =>
          Vector3.distance(
            site(side, "tip", from + ((to - from) * k) / 12),
            first,
          ),
        ),
      );
      TestValidator.predicate(
        `${fit}: the ${side} crutch tip stays planted from the gather to the take back (${(slide * 1000).toFixed(1)} mm, ${(first.y * 1000).toFixed(1)} mm up)`,
        slide <= STILL && Math.abs(first.y) <= STILL,
      );
    }

    // 4. The sound palm on its armrest.
    const armrest: IAutoMovieVector3 = seat.armrests![sound]!;
    const palm: number = Vector3.distance(
      HumanHand.frame(
        body,
        film.bones("a", at(down!, "reached")),
        sound,
        "palm",
      ).point,
      armrest,
    );
    TestValidator.predicate(
      `${fit}: the sound palm rests on its armrest (${(palm * 1000).toFixed(1)} mm)`,
      palm <= REST,
    );

    // 5. The injured foot off the floor.
    const steps: number = 36;
    TestValidator.predicate(
      `${fit}: the injured foot never bears from the take on`,
      Array.from(
        { length: steps + 1 },
        (_v: unknown, k: number): number =>
          taken + ((up!.end - taken) * k) / steps,
      ).every((t: number): boolean =>
        HumanFoot.sockets(body, film.bones("a", t), INJURED).every(
          (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            socket.point.y > HumanFoot.BEARING,
        ),
      ),
    );

    // 6. The tripod after the rise: facing -Z, ahead is -Z and the left -X.
    const feet: IAutoMovieVector3 = Vector3.lerp(
      film.bones("a", up!.end).get("leftFoot")!.worldPosition,
      film.bones("a", up!.end).get("rightFoot")!.worldPosition,
      0.5,
    );
    for (const side of ["left", "right"] as const) {
      const tip: IAutoMovieVector3 = site(side, "tip", up!.end);
      const outward: number = (side === "left" ? -1 : 1) * (tip.x - feet.x);
      TestValidator.predicate(
        `${fit}: the ${side} tip ends on the floor in the tripod (${(tip.y * 1000).toFixed(1)} mm up, ${(outward * 1000).toFixed(0)} mm out, ${((feet.z - tip.z) * 1000).toFixed(0)} mm ahead)`,
        Math.abs(tip.y) <= STILL &&
          outward > body.measure.hipHalfWidth &&
          feet.z - tip.z > 0,
      );
    }
  }

  // 7. No seat.
  TestValidator.predicate(
    "a crutch sit naming no seat is refused on the seat",
    ((): boolean => {
      try {
        take(motionHumanBody("m-average"), false).film.bones("a", 1);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === "seat";
      }
    })(),
  );
}

/** One staged take and what its checks read. */
interface ITake {
  /** The performance. */
  film: HumanPerformance;

  /** Each side's crutch model. */
  models: Record<AutoMovieHumanSide, CrutchModel>;

  /** The sit's parameters. */
  params: IAutoMovieMotionHumanCrutchSit;

  /** The armchair. */
  seat: IAutoMovieMotionHumanSeated.ISeat;
}

/** An axillary crutch's model. */
type CrutchModel = Archetype<
  createAxillaryCrutch.Affordance,
  createAxillaryCrutch.Dimension
>;

/** Performer `a` at the origin facing -Z, an armchair behind, the crutches standing in the tripod; it sits with them and, when `named`, names the seat and rises after. */
function take(body: IAutoMovieMotionHumanBody, named: boolean): ITake {
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
  const height: number = seated.popliteal(body);
  const half: number =
    body.measure.hipHalfWidth + body.measure.thighRadius + 0.05;
  const back: number = 0.15;

  // Facing -Z, the sitter's left is -X and the seat lies behind at +Z.
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: height, z: back },
    yaw: 180,
    depth: 0.45,
    back: 0.5,
    armrests: {
      left: { x: -half, y: height + ARMREST.y, z: back + ARMREST.z },
      right: { x: half, y: height + ARMREST.y, z: back + ARMREST.z },
    },
  };
  const params: IAutoMovieMotionHumanCrutchSit = {
    left: "leftCrutch",
    right: "rightCrutch",
    injured: INJURED,
    ...(named ? { seat } : {}),
  };
  const props: IAutoMovieMotionHumanProp[] = (["left", "right"] as const).map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanProp => {
      const foot: number = body.rest.get(`${side}Foot`)!.x;
      const local: number = foot + (side === "left" ? TRIPOD : -TRIPOD);
      return HumanObject.prop(
        side === "left" ? params.left : params.right,
        models[side],
        { at: { x: -local, y: 0, z: -TRIPOD }, yaw: 180 },
      );
    },
  );
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("a").registered(
    HumanCrutchSit.name,
    params,
  );
  return {
    film: new HumanPerformance({
      seed: "crutch sit",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props,
      laws: [HumanCrutchSit],
      composition: (named
        ? chain.registered(HumanCrutchSit.name, { ...params, rise: true })
        : chain
      ).node,
    }),
    models,
    params,
    seat,
  };
}

/** Whether a list rises strictly. */
function ascending(values: readonly number[]): boolean {
  return values.every(
    (v: number, i: number): boolean => i === 0 || values[i - 1]! < v,
  );
}
