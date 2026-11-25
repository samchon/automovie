import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCrutchWalk,
  HumanFoot,
  crutchWalkCourse,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** An upright crutch's rotation. */
const UPRIGHT: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A raised, level floor in world metres. */
const HEIGHT: number = 0.4;

/** The crutch is staged from a modeled origin 5 cm above its tip. */
const TIP: IAutoMovieVector3 = { x: 0, y: -0.05, z: 0 };

/** A short, straight crutch advance. */
const WALK: IAutoMovieMotionHumanCrutchWalk = {
  left: "left-crutch",
  right: "right-crutch",
  pattern: "swingTo",
  stations: [{ x: 0, z: 0.16, seconds: 0.6 }],
};

/** The local points supplied by the two named affordances. */
const GRIP: IAutoMovieVector3 = { x: 0, y: 0.79, z: 0 };

/** One crutch and its displayed track on the raised floor. */
function prop(
  side: AutoMovieHumanSide,
  slip: number,
): IAutoMovieMotionHumanProp {
  const site = (
    id: "grip" | "tip",
    kind: "handle" | "surface",
    translation: IAutoMovieVector3,
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation,
      rotation: UPRIGHT,
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  });
  const frame: IAutoMovieRigidTransform = {
    position: {
      x: side === "left" ? 0.32 : -0.32,
      y: HEIGHT - TIP.y + slip,
      z: 0.19,
    },
    rotation: UPRIGHT,
  };
  return {
    subject: WALK[side],
    frame,
    motion: HumanCrutchWalk.track(frame, WALK, side, 0, TIP),
    points: {
      grip: { point: GRIP, normal: { x: 1, y: 0, z: 0 } },
      tip: { point: TIP, normal: { x: 0, y: 1, z: 0 } },
    },
    affordances: [site("grip", "handle", GRIP), site("tip", "surface", TIP)],
  };
}

/**
 * A crutch walk compares the named tips with the floor of its entering body.
 *
 * Scenarios:
 *
 * 1. Admit both tips at the same height as the raised body and keep the
 *    load-bearing foot raised.
 * 2. Refuse a crutch whose tip hovers above that same floor.
 */
export async function test_motions_lexicon_crutch_raised_support(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (slip: number): IAutoMovieMotionHumanActionPlan =>
    HumanCrutchWalk.plan(
      motionActionContext(body, WALK, {
        at: { x: 0, y: HEIGHT, z: 0 },
        props: [prop("left", 0), prop("right", slip)],
      }),
    );
  const admitted: IAutoMovieMotionHumanActionPlan = plan(0);
  const sound: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, admitted.posture(admitted.duration)),
  ).get("rightFoot")!;
  TestValidator.predicate(
    "the sound foot stays on the raised floor at the landing",
    nclose(
      HumanFoot.point(body, "right", "sole", {
        ankle: sound.worldPosition,
        rotation: sound.worldRotation,
      }).y,
      HEIGHT,
      HumanFoot.BEARING,
    ),
  );
  TestValidator.error("a hovering tip is refused", () => plan(0.03));
}

/**
 * The default station pivot preserves the staged tip's full world point.
 *
 * Scenarios:
 *
 * 1. With a tip-rooted crutch on a raised floor, use its nonzero world height.
 * 2. An explicit entry-station origin overrides that tip.
 * 3. At a half-turn plus 16 cm of travel, a root 10 cm to one side of its tip ends
 *    10 cm to the other side while the displayed tip travels straight.
 */
export function test_motions_lexicon_crutch_raised_support_pivot(): void {
  const staged: IAutoMovieRigidTransform = {
    position: { x: 0.32, y: HEIGHT, z: 0.19 },
    rotation: UPRIGHT,
  };
  const origin: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  TestValidator.predicate(
    "the staged tip is the default pivot",
    vclose(crutchWalkCourse.pivot(staged, WALK), staged.position, 0),
  );
  TestValidator.predicate(
    "an authored origin overrides the default pivot",
    vclose(crutchWalkCourse.pivot(staged, { ...WALK, origin }), origin, 0),
  );
  const offset: IAutoMovieVector3 = { ...TIP, x: 0.1 };
  const modeled: IAutoMovieRigidTransform = {
    ...staged,
    position: { ...staged.position, y: HEIGHT - TIP.y },
  };
  const read: ReturnType<typeof HumanCrutchWalk.track> = HumanCrutchWalk.track(
    modeled,
    { ...WALK, stations: [{ ...WALK.stations[0]!, turn: 180 }] },
    "left",
    0,
    offset,
  );
  const landed: IAutoMovieRigidTransform = read(3);
  TestValidator.predicate(
    "the offset tip is the pivot of the displayed prop",
    vclose(landed.position, { x: 0.52, y: 0.45, z: 0.35 }, 1e-12) &&
      vclose(read(0).position, modeled.position, 0) &&
      vclose(read(3).position, landed.position, 0),
  );
}
