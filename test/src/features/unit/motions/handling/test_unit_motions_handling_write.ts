import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWrite,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  poseBones,
  resolveHumanPosture,
  stand,
  write,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/** Each edge of the traced right angle, metres. */
const EDGE: number = 0.01;

/** The allowed writing-tip miss, metres: 1 mm (#3446). */
const BOUND: number = 0.001;

/**
 * `write.plan` traces a polyline with the working point of a held tool on a
 * surface: the tip comes onto the surface's origin by `strokeStart`.
 *
 * Scenario, the average man standing at the origin facing +Z, holding a pen in
 * a right fist whose nib lies a hand's length below the grip socket, a sheet
 * fixed with its origin at that nib and its surface frame turned a quarter
 * about +Y and moved 0.01 m along +X; tracing 0.01 m edges of a right angle in
 * 0.6 s: at `strokeStart` the nib, carried by the hand at the pen's grip
 * offset, lies on the sheet's origin within 1 mm.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_write(): Promise<void> {
  // Plans the writing arm on the whole body: the rig, the arm chain and the hand.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const initial: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const carrying: IAutoMovieMotionHumanPosture = {
    ...initial,
    joints: { ...initial.joints, ...HumanHand.shape("right", "fist") },
  };
  const placed = poseBones(body, resolveHumanPosture(body, carrying));
  const wrist: IAutoMovieResolvedBone = placed.get("rightHand")!;
  const tip: IAutoMovieVector3 = { x: 0, y: -body.measure.hand, z: 0 };
  const grip: IAutoMovieVector3 = HumanHand.frame(
    body,
    placed,
    "right",
    "grip",
  ).point;
  const start: IAutoMovieVector3 = Vector3.add(grip, tip);
  const pen: IAutoMovieMotionHumanProp = {
    subject: "pen",
    frame: { position: grip, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      {
        id: "nib",
        kind: "surface",
        frame: { ...Transform.identity(), translation: tip },
        extent: null,
      },
    ],
  };
  const paper: IAutoMovieMotionHumanProp = {
    subject: "paper",
    fixed: true,
    frame: { position: start, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      {
        id: "sheet",
        kind: "surface",
        frame: {
          ...Transform.identity(),
          translation: { x: EDGE, y: 0, z: 0 },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
        },
        extent: null,
      },
    ],
  };
  // The pen's grip offset: its frame in the right hand's.
  const inverse = Quaternion.inverse(wrist.worldRotation);
  const offset: IAutoMovieRigidTransform = {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(grip, wrist.worldPosition),
    ),
    rotation: inverse,
  };
  const params: IAutoMovieMotionHumanWrite = {
    tool: "pen",
    tip: "nib",
    on: "paper",
    surface: "sheet",
    stroke: [
      [0, 0],
      [0, -EDGE],
      [-EDGE, -EDGE],
    ],
    duration: 0.6,
  };
  const plan: IAutoMovieMotionHumanActionPlan = write.plan(
    motionActionContext(body, params, {
      posture: carrying,
      props: [pen, paper],
      holds: { right: "pen" },
      carried: { right: offset },
    }),
  );
  const at: number =
    plan.duration *
    plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === "strokeStart",
    )!.share;
  const hand: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, plan.posture(at)),
  ).get("rightHand")!;
  const nib: IAutoMovieVector3 = Vector3.add(
    hand.worldPosition,
    Quaternion.rotateVector(
      hand.worldRotation,
      Vector3.add(
        offset.position,
        Quaternion.rotateVector(offset.rotation, tip),
      ),
    ),
  );
  const surface: IAutoMovieVector3 = Vector3.add(start, {
    x: EDGE,
    y: 0,
    z: 0,
  });
  TestValidator.predicate(
    "on the sheet",
    Vector3.distance(nib, surface) <= BOUND,
  );
  // The pen stays in the hand through the trace and the return.
  TestValidator.predicate(
    "the pen held throughout",
    (plan.holds ?? []).some(
      (h) => h.side === "right" && h.prop === "pen" && h.from === 0,
    ),
  );
}
