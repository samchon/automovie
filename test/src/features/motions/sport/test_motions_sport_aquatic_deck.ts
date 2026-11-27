import { AutoMovieArchetypePoolEdge } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import { AutoMovieMotionHumanRefusal, aquatic } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";

/**
 * A finite deck ends before the authored receiving points.
 *
 * Scenarios:
 *
 * 1. A lifted victim cannot place its trunk on a deck 50 mm deep.
 * 2. An unaided swimmer cannot set either palm 120 mm behind a 50 mm deck.
 * 3. The native pool deck admits the same victim's receiving pose.
 */
export async function test_motions_sport_aquatic_deck(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const staged: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "pool",
    AutoMovieArchetypePoolEdge.create({ kind: "deckEdge" }),
    { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true },
  );
  const prop: IAutoMovieMotionHumanProp = {
    subject: staged.subject,
    frame: staged.frame,
    fixed: true,
    points: staged.points,
    affordances: staged.affordances?.map(
      (site: IAutoMovieAffordance): IAutoMovieAffordance =>
        site.id === "deckFace"
          ? {
              ...site,
              depth: 0.05,
              frame: { ...site.frame, translation: { x: 0, y: 0, z: -0.025 } },
            }
          : site,
    ),
  };
  for (const kind of ["liftedOut", "edgeExit"] as const) {
    const context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAquatic.IParams> =
      motionActionContext<IAutoMovieMotionHumanAquatic.IParams>(
        body,
        { kind, water: -0.2, support: "pool" },
        { at: { x: 0, y: -0.4, z: 0.3 }, yaw: 180, props: [prop] },
      );
    let error: unknown;
    try {
      aquatic.plan(context);
    } catch (caught: unknown) {
      error = caught;
    }
    TestValidator.predicate(
      `${kind} refuses an exhausted material footprint`,
      error instanceof AutoMovieMotionHumanRefusal &&
        error.axis === "support" &&
        error.reason.includes("deck"),
    );
  }
  const native: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAquatic.IParams> =
    motionActionContext<IAutoMovieMotionHumanAquatic.IParams>(
      body,
      {
        kind: "liftedOut",
        water: -0.2,
        support: "pool",
      },
      { at: { x: 0, y: -0.4, z: 0.3 }, yaw: 180, props: [staged] },
    );
  TestValidator.predicate(
    "the native deck admits the receiving pose",
    aquatic.plan(native).duration > 0,
  );
}
