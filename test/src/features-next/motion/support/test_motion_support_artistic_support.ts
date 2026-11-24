import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/** An invalid base assignment: a base absent from the scene, or one in the wrong role. */
type InvalidBases = "missing" | "wrong-role";

/** The existing 10 mm displayed support tolerance, metres. */
const CONTACT: number = 0.01;

/** The two named bases each offer the hand nearest the middle of the group. */
const SIDES = [
  { base: "left-base", hand: "right", foot: "left", sign: 1 },
  { base: "right-base", hand: "left", foot: "right", sign: -1 },
] as const;

/**
 * Two swimmers support a featured swimmer on actual palm-to-sole contacts
 * and then release to the shared water level.
 *
 * Scenarios:
 * 1. Play the assisted phrase through the real SDK at nonzero water height.
 *    Both bases and the flyer acquire and release on the same clock. Read
 *    the bases' palms and the flyer's forefeet throughout the active windows.
 * 2. Compare pelvis and chest heights to the water before, during and after
 *    elevation. Verify a gap returns after release, reverse scrub reproduces
 *    the contact, and translating the water translates the recovered take.
 * 3. Refuse a flyer with no bases and a named group member who never offers a
 *    suitable support palm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three roles, the medium, the real contact and the recovery checks.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates actual public pose frames and contact windows with real generated bodies, including the refusal on a live false support.
 * @evidence contracts/development/testing.md#independent-expectations Observes actual region and ball-of-foot points, with the shared 10 mm support bound. Height comparisons use the real water plane and the relative change authored for this figure. The named roles match World Aquatics Artistic Swimming Manual Group B.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes onset, held transfer and release, shifted and reverse samples, missing participants and unsuitable palm orientation.
 * @evidence contracts/development/testing.md#execution-ownership The discovered in-memory test runs three named polygon performers and checks public surface and contact output.
 */
export function test_motion_support_artistic_support(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const water: number = 0.41;
  const figure: HumanPerformance = stageArtistic(body, water);
  assertTakeClean("artistic support", figure);
  const primary: IAutoMovieMotionHumanSegment = figure.segments("flyer")[0]!;
  const acquire: number = time(primary, "supportAcquire");
  const peak: number = time(primary, "figure");
  const release: number = time(primary, "supportRelease");
  TestValidator.predicate(
    "capture and release bracket the actual elevated key",
    time(primary, "supportScull") < acquire &&
      acquire < peak &&
      peak < release &&
      release < time(primary, "return"),
  );

  const observations: string[] = [];
  let maxGap: number = 0;
  for (const { base, hand, foot } of SIDES) {
    const other: IAutoMovieMotionHumanSegment = figure.segments(base)[0]!;
    if (
      !nclose(time(other, "supportAcquire"), acquire) ||
      !nclose(time(other, "supportRelease"), release)
    )
      observations.push(base + " support beat differs from the flyer");
    const offer: IAutoMovieMotionHumanContactWindow | undefined =
      primary.plan.contacts.find(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === `${foot}Foot` &&
          window.kind === "bear" &&
          window.support.kind === "person" &&
          window.support.subject === base &&
          "region" in window.support &&
          window.support.region ===
            (hand === "left" ? "palmLeft" : "palmRight"),
      );
    if (
      offer === undefined ||
      !nclose(offer.from * primary.plan.duration + primary.start, acquire) ||
      !nclose(offer.to * primary.plan.duration + primary.start, release)
    )
      observations.push(base + " does not own the declared forefoot window");

    for (let frame: number = 0; frame <= 8; ++frame) {
      const at: number = acquire + ((release - acquire) * frame) / 8;
      const palm: ReturnType<typeof palmOf> = palmOf(
        figure,
        body,
        base,
        hand,
        at,
      );
      const actual: IAutoMovieVector3 = ballOf(figure, body, foot, at);
      const gap: number = Vector3.distance(palm.point, actual);
      if (!(palm.normal.y > 0.9 && palm.point.y < water && gap <= CONTACT))
        observations.push(
          base +
            " lacks upward submerged contact at " +
            at +
            " s (" +
            gap +
            " m)",
        );
      maxGap = Math.max(maxGap, gap);
    }
    const end: number = time(primary, "return");
    const gap: number = Vector3.distance(
      palmOf(figure, body, base, hand, end).point,
      ballOf(figure, body, foot, end),
    );
    if (!(gap > 0.08))
      observations.push(base + " did not separate in recovery");
  }
  TestValidator.equals(
    "synchronized displayed foot support (largest contact gap " +
      maxGap +
      " m)",
    observations,
    [],
  );

  const start: ReturnType<HumanPerformance["bones"]> = figure.bones("flyer", 0);
  const top: ReturnType<HumanPerformance["bones"]> = figure.bones(
    "flyer",
    peak,
  );
  const recovered: ReturnType<HumanPerformance["bones"]> = figure.bones(
    "flyer",
    figure.duration,
  );
  TestValidator.predicate(
    "pelvis and chest rise above the medium and return to layout",
    start.get("hips")!.worldPosition.y < water &&
      top.get("hips")!.worldPosition.y > water + 0.12 &&
      top.get("chest")!.worldPosition.y > water + 0.35 &&
      recovered.get("hips")!.worldPosition.y < water &&
      vclose(
        recovered.get("hips")!.worldPosition,
        start.get("hips")!.worldPosition,
        CONTACT,
      ) &&
      vclose(
        recovered.get("chest")!.worldPosition,
        start.get("chest")!.worldPosition,
        CONTACT,
      ),
  );
  TestValidator.predicate(
    "reverse scrub preserves the figure and the named support",
    vclose(
      figure.bones("flyer", peak).get("hips")!.worldPosition,
      top.get("hips")!.worldPosition,
    ) &&
      SIDES.every(({ base, hand, foot }): boolean =>
        vclose(
          palmOf(figure, body, base, hand, peak).point,
          ballOf(figure, body, foot, peak),
          CONTACT,
        ),
      ),
  );
  const higher: HumanPerformance = stageArtistic(body, water + 0.5);
  for (const subject of ["flyer", "left-base", "right-base"])
    TestValidator.predicate(
      subject + " uses the translated water plane",
      vclose(
        Vector3.subtract(
          higher.bones(subject, peak).get("hips")!.worldPosition,
          figure.bones(subject, peak).get("hips")!.worldPosition,
        ),
        { x: 0, y: 0.5, z: 0 },
        1e-6,
      ),
    );

  for (const invalid of ["missing", "wrong-role"] as const) {
    let caught: unknown;
    try {
      stageArtistic(body, water, invalid).bones("flyer", peak);
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      invalid + " bases are refused",
      caught instanceof HumanRefusal &&
        caught.kind === "participant" &&
        caught.axis === "bases",
    );
  }
}

/** Stage the same three actors at the given water height on one film clock. */
function stageArtistic(
  body: IAutoMovieMotionHumanBody,
  water: number,
  invalid?: InvalidBases,
): HumanPerformance {
  const beat: number = 0.23;
  const swimmers: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"] = [
    ...SIDES.map(({ base, sign }) => ({
      subject: base,
      body,
      at: { x: sign * 0.4, y: water, z: -0.2 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    {
      subject: "flyer",
      body,
      at: { x: 0, y: water, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
  ];
  const plan = (
    subject: string,
    params: Omit<
      IAutoMovieMotionHumanAquatic.IParams,
      "kind" | "phase" | "water"
    >,
  ): ReturnType<typeof HumanChain.subject> =>
    HumanChain.subject(subject).registered("aquatic", {
      kind: "artisticSwim",
      phase: beat,
      water,
      ...params,
    });
  return new HumanPerformance({
    seed: "artistic-group",
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers: swimmers,
    composition: {
      kind: "parallel",
      parts: [
        ...SIDES.map(
          ({ base, hand }) =>
            plan(base, {
              side: hand,
              role:
                invalid === "wrong-role" && base === "left-base"
                  ? "figure"
                  : "base",
            }).node,
        ),
        plan("flyer", {
          role: "flyer",
          ...(invalid === "missing"
            ? {}
            : { bases: ["left-base", "right-base"] as const }),
        }).node,
      ],
    },
  });
}

/** Convert one public action event share to its absolute film second. */
function time(segment: IAutoMovieMotionHumanSegment, event: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((value): boolean => value.name === event)!.share
  );
}

/** Read the swimmer's actual posed palm surface in world coordinates. */
function palmOf(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  base: string,
  side: AutoMovieHumanSide,
  seconds: number,
): ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> {
  const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["palmLeft"] =
    body.surfaces.regions[side === "left" ? "palmLeft" : "palmRight"];
  return resolveAutoMovieHumanoidSurfaces.place(
    region,
    film.bones(base, seconds).get(region.bone)!,
  );
}

/** Read the foot's actual underside point rather than the ankle bone. */
function ballOf(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  seconds: number,
): IAutoMovieVector3 {
  return HumanFoot.sockets(body, film.bones("flyer", seconds), side).find(
    (socket): boolean => socket.socket === "ball",
  )!.point;
}
