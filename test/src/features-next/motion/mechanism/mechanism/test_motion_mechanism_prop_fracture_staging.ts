import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPropFracture,
  IAutoMovieMotionHumanStand,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { qclose } from "../../../../features/internal/qclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * A staged breakaway replaces scenery at the hit and keeps its remainder on
 * its carrier. A detached panel flies in world space and rests on the floor.
 *
 * Scenarios:
 * 1. A split below the fixture's authored threshold leaves it intact.
 * 2. The original is visible before the hit. At the hit the replacement
 *    shares the intact model's frame and the event names the same target.
 * 3. The remainder keeps following a carrier that continues to move. The
 *    detached panel retains the quarter-turn after the carrier turns back.
 *    Its speed follows from the authored momentum and its one-kilogram mass.
 * 4. The panel's bottom is on the floor after its analytic flight time.
 *    Seeking backwards after the landing recovers the same airborne frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a breakaway archetype and a freely released foam token through HumanPerformance, then prepares the replacement from the performance's actual first hit and samples the event and both models.
 * @evidence contracts/development/testing.md#independent-expectations The panel's front face is at world Z=-0.5 m, which the token reaches after 0.25 s at 2 m/s from Z=-1 m. The two equal-volume boxes share 2 kg. The fixture rotates local +X to world -Z, and the detached collider's bottom starts 2 m above the floor. The standard gravity of 9.80665 m/s² from the 3rd CGPM fixes both vertical drop and landing time.
 * @evidence contracts/development/testing.md#distinguishing-cases Below-threshold budget versus fracture, intact versus replacement, carried versus detached and airborne versus settled, with out-of-order frame reads.
 * @evidence contracts/development/testing.md#execution-ownership Reuses one shared Human body fixture and plans one stand with a free launch. Six replacement reads use the prepared scene and require no arm trajectory.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the four scenarios and their geometric and physical premises.
 */
export function test_motion_mechanism_prop_fracture_staging(): void {
  type Piece = AutoMovieArchetype<never, never>;
  const builder: AutoMovieArchetypeBuilder<never, never> =
    new AutoMovieArchetypeBuilder<never, never>({
      draw: new AutoMovieArchetypeDrawSession<never>(
        "stage-panel",
        {},
        undefined,
        {},
      ),
      name: "stage panel",
      material: "wood",
    });
  builder.box("frame", { x: 1, y: 2, z: 1 }, { x: 0, y: 1, z: 0 });
  builder.box("panel", { x: 1, y: 2, z: 1 }, { x: 1, y: 1, z: 0 });
  builder.fracture([{ id: "panel", parts: ["panel"] }]);
  const model: Piece = builder.build(2, { outcome: { fracture: 3 } });
  const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const carrier: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform => ({
    position: { x: 0.5 + Math.max(0, seconds - 0.6), y: 2, z: 1 },
    rotation: seconds <= 0.6 ? yaw : identity,
  });
  const release: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "releaseFoamToken",
      plan(
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan {
        return {
          ...AutoMovieMotionHumanStance.stand.plan(context),
          launches: [
            {
              prop: "foam-token",
              seconds: 0.25,
              point: { x: 0.5, y: 3, z: -1 },
              velocity: { x: 0, y: 0, z: 2 },
            },
          ],
        };
      },
    };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "stage-panel",
    laws: [release],
    performers: [
      {
        subject: "operator",
        body: motionHumanBody("m-average"),
        at: { x: -3, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("operator").registered("releaseFoamToken", {
      hold: 3,
      sway: 0,
    }).node,
    props: [
      HumanObject.prop("scenery", model, carrier(0), carrier),
      {
        subject: "foam-token",
        frame: { position: { x: 0.5, y: 3, z: -1 }, rotation: identity },
        points: {},
      },
    ],
  });
  const hit: IAutoMovieInteractionEvent | undefined =
    performance.hits("scenery")[0];
  if (hit === undefined)
    throw new Error("The foam token did not reach the panel.");
  TestValidator.predicate(
    "the token reaches the panel at 0.5 s",
    nclose(hit.time, 0.5),
  );
  const request: IAutoMovieMotionHumanPropFracture.IRequest<Piece> = {
    subject: "scenery",
    hit: hit.id,
    model,
    budget: { energy: 3, momentum: { x: 2, y: 0, z: 0 } },
  };

  TestValidator.predicate(
    "a budget below the fixture threshold leaves the prop intact",
    performance.fracture({
      ...request,
      budget: { ...request.budget, energy: 2 },
    }) === null,
  );
  const fracture: IAutoMovieMotionHumanPropFracture.IPlan<Piece> | null =
    performance.fracture(request);
  if (fracture === null) throw new Error("The declared panel did not break.");
  const initial:
    | readonly IAutoMovieMotionHumanPropFracture.IPlaced<Piece>[]
    | null = fracture.at(hit.time);
  TestValidator.predicate(
    "the split replaces the original at the observed hit's exact second",
    fracture.at(0) === null &&
      fracture.contact.time === hit.time &&
      fracture.contact.kind === "contact" &&
      fracture.contact.target === "scenery" &&
      initial?.length === 2 &&
      initial.every(
        (piece: IAutoMovieMotionHumanPropFracture.IPlaced<Piece>): boolean =>
          vclose(piece.frame.position, { x: 0.5, y: 2, z: 1 }),
      ),
  );

  const sample:
    | readonly IAutoMovieMotionHumanPropFracture.IPlaced<Piece>[]
    | null = fracture.at(hit.time + 0.25);
  const partialFall: number = (9.80665 * 0.25 ** 2) / 2;
  TestValidator.predicate(
    "the remainder keeps its carrier and the panel follows its own world flight",
    sample?.[0]?.fragment === null &&
      sample[0].model.parts[0]?.id === "frame" &&
      vclose(sample[0].frame.position, { x: 0.65, y: 2, z: 1 }) &&
      qclose(sample[0].frame.rotation, identity) &&
      sample[1]?.fragment === "panel" &&
      sample[1].model.parts[0]?.id === "panel" &&
      qclose(sample[1].frame.rotation, yaw) &&
      vclose(sample[1].frame.position, { x: 0.5, y: 2 - partialFall, z: 0.5 }),
  );

  const landing: number = Math.sqrt(4 / 9.80665);
  const rest: IAutoMovieMotionHumanPropFracture.IPlaced<Piece> | undefined =
    fracture.at(2)?.[1];
  const later: IAutoMovieMotionHumanPropFracture.IPlaced<Piece> | undefined =
    fracture.at(3)?.[1];
  const sought: IAutoMovieMotionHumanPropFracture.IPlaced<Piece> | undefined =
    fracture.at(hit.time + 0.25)?.[1];
  TestValidator.predicate(
    "the landed panel stays on the floor and seeks do not alter its flight",
    rest !== undefined &&
      later !== undefined &&
      sought !== undefined &&
      vclose(rest.frame.position, { x: 0.5, y: 0, z: 1 - 2 * landing }) &&
      vclose(later.frame.position, rest.frame.position) &&
      vclose(sought.frame.position, { x: 0.5, y: 2 - partialFall, z: 0.5 }),
  );
}
