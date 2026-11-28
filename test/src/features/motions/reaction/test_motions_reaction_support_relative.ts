import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerturb,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { poseBones } from "../../../../../packages/motions/src/posture/internal/poseBones";
import { resolveHumanPosture } from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { perturb } from "../../../../../packages/motions/src/reaction/internal/perturb";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";

/** The reaction starts after a complete support sample history. */
const START: number = 1;

/** Tolerance above roundoff from the support's measured derivatives. */
const ROUNDING: number = 1e-7;

/** The stock body's contact fit tolerance, metres. */
const PLANT: number = 0.005;

/**
 * An absorbed reaction keeps both feet on their actual bearing material.
 *
 * The fixture admits an ordinary rest body on still ground, a coasting surface
 * and an accelerating surface at the same displayed onset pose. An explicit
 * small impulse on fixed ground gives a separate directed response.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names fixed, coasting, accelerating, applied-impulse and unsupported-outcome cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real response law on a stored pose, its entered feet and a named support site with a closed-form path. Reads the emitted events, contacts and displayed root.
 * @evidence contracts/development/testing.md#independent-expectations A uniform change of frame cannot change the relative stance. Positive support acceleration gives a relative shift opposite that acceleration, while a positive external impulse shifts the fixed-ground body forward.
 */
export async function test_motions_reaction_support_relative(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPerturb.IParams> =
    motionActionContext(body, { outcome: "absorb" }, { start: START });
  const floor: IAutoMovieMotionHumanActionPlan = perturb.plan(context);
  const floorPeak: number = peak(floor);
  const still: number = floor.posture(floorPeak).root.z;
  const coasting = (): IAutoMovieMotionHumanActionPlan =>
    perturb.plan(deck(context, 1.71, 0));
  const quiet: IAutoMovieMotionHumanActionPlan = coasting();
  const time: number = peak(quiet);
  for (const local of [time, 0, time, quiet.duration]) {
    TestValidator.predicate(
      `relative root follows the uniform support at ${local}`,
      Math.abs(quiet.posture(local).root.z - still - 1.71 * local) <= ROUNDING,
    );
    const foot: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(body, quiet.posture(local)),
    ).get("leftFoot")!;
    TestValidator.predicate(
      `the displayed left ankle stays on its material at ${local}`,
      Math.abs(
        foot.worldPosition.z - context.entry.feet.left.ankle.z - 1.71 * local,
      ) <= PLANT,
    );
  }
  TestValidator.predicate(
    "the plants keep the precise named bearing surface",
    quiet.contacts.length === 2 &&
      quiet.contacts.every(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.kind === "plant" &&
          contact.support.kind === "prop" &&
          contact.support.subject === "deck" &&
          contact.support.point === "boarding-surface",
      ),
  );

  const accel: number = 0.25;
  const pushedByDeck: IAutoMovieMotionHumanActionPlan = perturb.plan(
    deck(context, 1.71, accel),
  );
  const acceleratedPeak: number = peak(pushedByDeck);
  const relative: number =
    pushedByDeck.posture(acceleratedPeak).root.z -
    still -
    (1.71 * acceleratedPeak + (accel * acceleratedPeak ** 2) / 2);
  TestValidator.predicate(
    "accelerating support causes a backward relative response",
    relative < -ROUNDING,
  );

  const pushed: IAutoMovieMotionHumanActionPlan = perturb.plan({
    ...context,
    forces: () => [
      {
        kind: "impulse",
        subject: context.subject,
        at: "abdomen",
        seconds: START,
        impulse: { x: 0, y: 0, z: body.massModel.mass * 0.06 },
      },
    ],
  });
  TestValidator.predicate(
    "an external push moves the fixed-ground body forward",
    pushed.posture(peak(pushed)).root.z > still + ROUNDING,
  );
  let refused: boolean = false;
  try {
    perturb.plan({ ...context, params: { outcome: "fall" } });
  } catch (error: unknown) {
    refused =
      error instanceof AutoMovieMotionHumanRefusal && error.axis === "outcome";
  }
  TestValidator.predicate("an unsupported forced fall is refused", refused);
}

/** Wrap a fixed pose with a named rigid support's onset velocity and path. */
function deck(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPerturb.IParams>,
  velocity: number,
  acceleration: number,
): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPerturb.IParams> {
  const fixed: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const supports: IAutoMovieMotionHumanEntryState.ISupport[] = (
    ["leftFoot", "rightFoot"] as const
  ).map(
    (part): IAutoMovieMotionHumanEntryState.ISupport => ({
      part,
      kind: "plant",
      support: { kind: "prop", subject: "deck", point: "boarding-surface" },
    }),
  );
  return {
    ...context,
    entry: {
      ...context.entry,
      supports,
      velocity: {
        ...context.entry.velocity,
        linear: { x: 0, y: 0, z: velocity },
      },
    },
    prop: (): IAutoMovieMotionHumanPropReader => ({
      prop: { subject: "deck", frame: fixed, points: {} },
      frame: (): IAutoMovieRigidTransform => fixed,
      site: (point: string, seconds: number): IAutoMovieRigidTransform => {
        TestValidator.equals(
          "uses the named bearing site",
          point,
          "boarding-surface",
        );
        const t: number = seconds - START;
        return {
          ...fixed,
          rotation: AutoMovieEngineQuaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            90,
          ),
          position: {
            x: 0,
            y: 0,
            z: velocity * t + (acceleration * t * t) / 2,
          },
        };
      },
    }),
  };
}

/** The settled controller names its peak on its own clock. */
function peak(plan: IAutoMovieMotionHumanActionPlan): number {
  return plan.events.find(({ name }) => name === "peak")!.share * plan.duration;
}
