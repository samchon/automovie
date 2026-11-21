import {
  type Archetype,
  createBathtub,
  createExerciseMat,
  createTap,
} from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  composeHumanBathing,
  touchEffectors,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The touch contract's contact bound, metres. */
const TOUCH: number = 0.01;

/** How far ahead of the bather's ankles the tub's apron stands, metres: within a step. */
const NEAR: number = 0.25;

/** How far outside the apron the bath mat's middle lies, metres: a step out lands on it. */
const MAT: number = 0.25;

/**
 * Getting into a bathtub and washing under a shower.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Stepping over the rim lands both feet on the tub's floor inside its
 *    rim, and the bather then sits on that floor.
 * 2. Landing on the apron's narrow top instead is refused.
 * 3. Standing in the tub facing the apron, stepping out lands both feet on
 *    a bath mat outside it, the apron read from inside.
 * 4. The shower scrubs the scalp with both palms, the face and each forearm
 *    with the other hand, each within 10 mm of its region when it arrives,
 *    between opening and closing the tap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed soles, seat and palms against the tub and the body's regions; a foot outside the tub, a bather not seated on its floor or a scrub off its region fails.
 * @evidence contracts/development/testing.md#independent-expectations The tub's floor and rim are its own modeled affordances; the contact bound is the touch contract's.
 * @evidence contracts/development/testing.md#distinguishing-cases The tub entry and the shower wash on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance through the public chain.
 */
export function test_human_motion_bathing(): void {
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const tub: Archetype<createBathtub.Affordance, createBathtub.Dimension> =
      createBathtub();
    // The tub turned to face the bather, its apron's outer edge `NEAR` ahead.
    const at: IAutoMovieVector3 = {
      x: 0,
      y: 0,
      z: NEAR + tub.site("edge").translation.z,
    };
    const placed: IAutoMovieMotionHumanProp = HumanObject.prop("tub", tub, {
      at,
      yaw: 180,
      fixed: true,
    });
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
      tub,
      { at, yaw: 180 },
      "seat",
    );
    const bath: HumanPerformance = stage(
      body,
      [placed],
      composeHumanBathing.intoTub(
        HumanChain.subject("a"),
        "tub",
        "bottom",
        seat,
      ),
    );
    assertTakeClean(`${fit} into the tub`, bath);
    const over: IAutoMovieMotionHumanSegment = bath.segments("a")[0]!;
    const landed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      bath.bones("a", over.end);
    const floor: number = tub.site("bottom").translation.y;
    TestValidator.predicate(
      `${fit}: both feet land on the tub's floor`,
      (["left", "right"] as const).every((side: AutoMovieHumanSide): boolean =>
        HumanFoot.sockets(body, landed, side).some(
          (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            Math.abs(socket.point.y - floor) <= HumanFoot.BEARING,
        ),
      ),
    );
    TestValidator.equals(
      `${fit}: the bather sits in the tub`,
      bath.segments("a").at(-1)!.name,
      "sit",
    );
    TestValidator.predicate(
      `${fit}: landing on a surface the feet cannot lie on is refused`,
      ((): boolean => {
        try {
          stage(
            body,
            [placed],
            HumanChain.subject("a").act("stepOver", {
              obstacle: "tub",
              onto: { prop: "tub", point: "top" },
            }),
          ).bones("a", 1);
          return false;
        } catch (error: unknown) {
          return error instanceof HumanRefusal;
        }
      })(),
    );

    // Out again: standing on the tub's floor facing the apron, the bather
    // steps over it from inside onto a mat on the floor outside.
    const mat: Archetype<
      createExerciseMat.Affordance,
      createExerciseMat.Dimension
    > = createExerciseMat();
    const outside: IAutoMovieMotionHumanProp = HumanObject.prop("mat", mat, {
      at: { x: 0, y: 0, z: NEAR - MAT },
      yaw: 90,
      fixed: true,
    });
    const out: HumanPerformance = stage(
      body,
      [placed, outside],
      composeHumanBathing.outOfTub(HumanChain.subject("a"), "tub", {
        prop: "mat",
        point: "surface",
      }),
      // The middle of the well: the tub stands turned, its local +Z toward the bather.
      { x: 0, y: floor, z: at.z - tub.site("bottom").translation.z },
      180,
    );
    assertTakeClean(`${fit} out of the tub`, out);
    const stepped: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      out.bones("a", out.segments("a")[0]!.end);
    const top: number = mat.site("surface").translation.y;
    TestValidator.predicate(
      `${fit}: both feet land on the mat outside the tub`,
      (["left", "right"] as const).every((side: AutoMovieHumanSide): boolean =>
        HumanFoot.sockets(body, stepped, side).some(
          (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            Math.abs(socket.point.y - top) <= HumanFoot.BEARING &&
            socket.point.z < NEAR,
        ),
      ),
    );

    const tap: Archetype<createTap.Affordance, createTap.Dimension> =
      createTap();
    const shower: HumanPerformance = stage(
      body,
      [
        HumanObject.prop("tap", tap, {
          at: { x: 0.3, y: 1.0, z: 0.4 },
          yaw: 180,
          fixed: true,
        }),
      ],
      composeHumanBathing.shower(HumanChain.subject("a"), {
        kind: "prop",
        subject: "tap",
        point: "lever",
      }),
    );
    assertTakeClean(`${fit} shower`, shower);
    const scrubs: IAutoMovieMotionHumanSegment[] = shower
      .segments("a")
      .filter(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "touch",
      );
    const regions: readonly [AutoMovieHumanSide, string][] = [
      ["right", "crown"],
      ["right", "face"],
      ["right", "forearmLeft"],
      ["left", "forearmRight"],
    ];
    TestValidator.predicate(
      `${fit}: every scrub reaches its region`,
      scrubs.length === regions.length &&
        regions.every(([side, region], i: number): boolean => {
          const segment: IAutoMovieMotionHumanSegment = scrubs[i]!;
          const t: number =
            segment.start +
            segment.plan.duration *
              segment.plan.events.find(
                (event: IAutoMovieMotionEvent): boolean =>
                  event.name === "ready",
              )!.share;
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            shower.bones("a", t);
          const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"]["crown"] =
            body.surfaces.regions[region as "crown"];
          return (
            Vector3.distance(
              AutoMovieMotionHumanTouchEffector.point(
                body,
                bones,
                side,
                touchEffectors.TABLE.palm,
              ),
              resolveAutoMovieHumanoidSurfaces.place(
                frame,
                bones.get(frame.bone)!,
              ).point,
            ) <= TOUCH
          );
        }),
    );
  }
}

/** One performer `a`, at the origin facing +Z unless placed, with props. */
function stage(
  body: IAutoMovieMotionHumanBody,
  props: IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
  at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  yaw: number = 0,
): HumanPerformance {
  return new HumanPerformance({
    seed: "bathing",
    performers: [
      {
        subject: "a",
        body,
        at,
        yaw,
        proficiency: { level: "trained" },
      },
    ],
    props,
    composition: chain.node,
  });
}
