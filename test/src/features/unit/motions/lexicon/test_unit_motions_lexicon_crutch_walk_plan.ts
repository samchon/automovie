import { createAxillaryCrutch } from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanCrutchWalkPlan } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Two straight stations of 1.2 s, 0.3 m on each. */
const WALK: IAutoMovieMotionHumanCrutchWalk = {
  left: "leftCrutch",
  right: "rightCrutch",
  stations: [
    { x: 0, z: 0.3, seconds: 1.2 },
    { x: 0, z: 0.6, seconds: 1.2 },
  ],
  origin: { x: 0, y: 0, z: 0 },
};

/**
 * `HumanCrutchWalkPlan` walks on two crutches: an opening stance of a quarter
 * of the first station while the hands take the grips, then per station the
 * crutches' advance over its first third, the feet standing, and the body's
 * swing on the planted handgrips over the rest.
 *
 * The average man stands at the origin facing +Z, an axillary crutch fitted at
 * 0.77 of his stature in the tripod beside each foot, 0.15 m out and ahead.
 *
 * Scenarios:
 *
 * 1. Two 1.2 s stations last `0.3 + 2.4 = 2.7` s: `crutchReady` at 0.3 s, the
 *    crutches planting at 0.7 and 1.9 s and the feet landing at 1.5 and 2.7 s.
 * 2. Both hands grip their own crutch from the ready stance to the end.
 * 3. In the three-point gait the injured left foot bears only until the hands take
 *    the weight, never after the first swing begins; the sound right foot bears
 *    again after each swing.
 * 4. A swing-to gait lands both feet: the left foot bears after a swing too.
 * 5. A crutch whose tip is off the floor, or that declares no tip, is refused.
 */
export async function test_unit_motions_lexicon_crutch_walk_plan(): Promise<void> {
  // Whole body: the support law solves the stances over the full rig.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const crutch = (
    side: AutoMovieHumanSide,
    y: number = 0,
  ): IAutoMovieMotionHumanProp =>
    HumanObject.prop(
      side === "left" ? WALK.left : WALK.right,
      createAxillaryCrutch({ length: 0.77 * body.measure.stature }),
      {
        at: {
          x: body.rest.get(`${side}Foot`)!.x + (side === "left" ? 0.15 : -0.15),
          y,
          z: 0.15,
        },
        yaw: 0,
      },
    );
  const plan = (
    params: IAutoMovieMotionHumanCrutchWalk,
    props: readonly IAutoMovieMotionHumanProp[] = [
      crutch("left"),
      crutch("right"),
    ],
  ): IAutoMovieMotionHumanActionPlan =>
    HumanCrutchWalkPlan(motionActionContext(body, params, { props }));
  const walk: IAutoMovieMotionHumanActionPlan = plan(WALK);
  const at = (name: string): number =>
    walk.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * walk.duration;
  TestValidator.predicate(
    "the clock",
    nclose(walk.duration, 2.7, 1e-9) &&
      nclose(at("crutchReady"), 0.3, 1e-9) &&
      nclose(at("crutchPlant1"), 0.7, 1e-9) &&
      nclose(at("footLand1"), 1.5, 1e-9) &&
      nclose(at("crutchPlant2"), 1.9, 1e-9) &&
      nclose(at("footLand2"), 2.7, 1e-9),
  );
  const windows = (
    p: IAutoMovieMotionHumanActionPlan,
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
  ): IAutoMovieMotionHumanContactWindow[] =>
    p.contacts.filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === part && c.kind === kind,
    );
  TestValidator.predicate(
    "the hands on their crutches",
    (["left", "right"] as const).every((side: AutoMovieHumanSide): boolean =>
      windows(walk, `${side}Hand`, "grip").some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.support.kind === "prop" &&
          c.support.subject === `${side}Crutch` &&
          nclose(c.from * walk.duration, 0.3, 1e-9) &&
          c.to === 1,
      ),
    ),
  );
  const swing: number = at("crutchPlant1");
  TestValidator.predicate(
    "three-point",
    windows(walk, "leftFoot", "plant").every(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.to * walk.duration <= swing,
    ) &&
      windows(walk, "rightFoot", "plant").filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.from * walk.duration > swing,
      ).length === 2,
  );
  const swingTo: IAutoMovieMotionHumanActionPlan = plan({
    ...WALK,
    pattern: "swingTo",
  });
  TestValidator.predicate(
    "swing-to",
    windows(swingTo, "leftFoot", "plant").some(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.from * swingTo.duration > swing,
    ),
  );
  TestValidator.predicate(
    "a crutch off the floor",
    throwsError(() => plan(WALK, [crutch("left", 0.1), crutch("right")])),
  );
  const tipless: IAutoMovieMotionHumanProp = {
    ...crutch("left"),
    affordances: (crutch("left").affordances ?? []).filter(
      (a: IAutoMovieAffordance): boolean => a.id !== "tip",
    ),
  };
  TestValidator.predicate(
    "a crutch with no tip",
    throwsError(() => plan(WALK, [tipless, crutch("right")])),
  );
}
