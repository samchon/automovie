import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A witness can flinch on a flying foam prop's contact with a moving piece
 * of scenery. The scheduler reads the contact from the already placed
 * launch action before the witness has a placed action or the film has a
 * finalized duration.
 *
 * The foam prop travels forward at 2 m/s from the release at 0.25 s. The
 * panel's near face begins at 0.9 m and travels forward at 0.25 m/s. At the
 * intersection of those two positions, the falling prop is within the face
 * height. The contact record and the flinch entry must fall within 1 µs of
 * that analytic time, a bound on the twenty-four contact bisections.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the placed release, the moving face, the witness cue and the independent time bound.
 * @evidence contracts/development/testing.md#behavioral-verification Places a real public flinch using a named flight hit filtered by target and prop, then reads the finished segment and hit. A missing cue before finalization or a frozen or wrongly clocked target fails.
 * @evidence contracts/development/testing.md#independent-expectations The intersection solves two authored forward position equations in film time. It uses no computed hit or displayed pose to construct its expected time, position or normal.
 * @evidence contracts/development/testing.md#distinguishing-cases A prop-to-prop hit on a moving face and its use before and after schedule finalization; the floor bounce timeline is covered separately.
 * @evidence contracts/development/testing.md#execution-ownership Creates one in-memory composition with one prepared human body used by two performers. No displayed pose sampling or host is required.
 */
export function test_motion_mechanism_prop_hit_sync(): void {
  const propSpeed: number = 2;
  const panelSpeed: number = 0.25;
  const panelCentre: number = 1;
  const panelDepth: number = 0.1;
  const launch: IAutoMovieMotionPropLaunch = {
    prop: "foam-ball",
    seconds: 0.25,
    point: { x: 0, y: 3, z: 0 },
    velocity: { x: 0, y: 0, z: propSpeed },
  };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieRigidTransform = {
    position: zero,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const panelAt = (seconds: number): IAutoMovieRigidTransform => ({
    rotation: identity.rotation,
    position: { x: 0, y: 2, z: panelCentre + panelSpeed * seconds },
  });
  const panel: IAutoMovieMotionHumanProp = {
    subject: "scenery-panel",
    frame: panelAt(0),
    motion: panelAt,
    points: {},
    shapes: [
      {
        kind: "box",
        id: "panel",
        material: "scenery",
        transform: identity,
        halfExtents: { x: 1, y: 1, z: panelDepth },
      },
    ],
  };
  const publish: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "stageFoamLaunch",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        launches: [launch],
      }),
    };
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const performance: HumanPerformance = new HumanPerformance({
    seed: "prop-hit-sync",
    laws: [publish],
    props: [
      panel,
      {
        subject: launch.prop,
        frame: { position: launch.point, rotation: identity.rotation },
        points: {},
      },
    ],
    performers: [
      {
        subject: "stagehand",
        body,
        at: { x: 4, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "witness",
        body,
        at: { x: -4, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieComposition.sequence(
      HumanChain.subject("stagehand").registered("stageFoamLaunch", {
        hold: 1,
      }).node,
      HumanChain.subject("witness")
        .flinch({})
        .sync({ hit: { on: panel.subject, by: launch.prop } }).node,
    ),
  });

  const expected: number =
    (panelCentre - panelDepth + propSpeed * launch.seconds) /
    (propSpeed - panelSpeed);
  const tolerance: number = 1e-6;
  const hits: readonly IAutoMovieInteractionEvent[] = performance.hits(
    panel.subject,
  );
  const reaction: IAutoMovieMotionHumanSegment | undefined = performance
    .segments("witness")
    .at(0);
  const hit: IAutoMovieInteractionEvent | undefined = hits[0];
  TestValidator.predicate(
    "the foam prop hits the moving front face once",
    hits.length === 1 &&
      hit !== undefined &&
      hit.kind === "hit" &&
      hit.object === launch.prop &&
      hit.normal?.z === -1 &&
      Math.abs(hit.time - expected) <= tolerance &&
      Math.abs(
        (hit.point?.z ?? Infinity) -
          (panelCentre - panelDepth + panelSpeed * expected),
      ) <=
        panelSpeed * tolerance,
  );
  TestValidator.predicate(
    "the witness's flinch enters on the analytic hit time",
    reaction?.name === "flinch" &&
      Math.abs(reaction.entryTime - expected) <= tolerance,
  );
}
