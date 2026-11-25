import { Quaternion, Transform } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWrite,
} from "@automovie/interface";
import { HumanRefusal, write } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `write.plan` admits a writing tool and its surface before any arm is moved:
 * the tool must be a carried tool apart from a stationary surface, so a tool
 * written onto itself, and a tool fixed in the scene, are refused on `on` as an
 * affordance.
 *
 * Scenarios, the average man holding a pen in his right hand over a fixed
 * sheet:
 *
 * 1. Writing with the pen on the pen is refused on `on`.
 * 2. Writing with a pen fixed in the scene is refused on `on`.
 * 3. A nib that rides a slider of the pen is refused on `tip`: it moves by a
 *    mechanism, not with the grip.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_write(): Promise<void> {
  // Reads the held pen and the sheet through the context of the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const surface = (id: string): IAutoMovieAffordance => ({
    id,
    kind: "surface",
    frame: Transform.identity(),
    extent: null,
  });
  const pen: IAutoMovieMotionHumanProp = {
    subject: "pen",
    frame: {
      position: { x: 0.2, y: 1, z: 0.3 },
      rotation: Quaternion.identity(),
    },
    points: {},
    affordances: [surface("nib")],
  };
  const paper: IAutoMovieMotionHumanProp = {
    subject: "paper",
    fixed: true,
    frame: {
      position: { x: 0.2, y: 0.9, z: 0.3 },
      rotation: Quaternion.identity(),
    },
    points: {},
    affordances: [surface("sheet")],
  };
  const refusal = (
    params: IAutoMovieMotionHumanWrite,
    tool: IAutoMovieMotionHumanProp,
  ): HumanRefusal | undefined => {
    try {
      write.plan(
        motionActionContext(body, params, {
          props: [tool, paper],
          holds: { right: "pen" },
        }),
      );
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  const params: IAutoMovieMotionHumanWrite = {
    tool: "pen",
    tip: "nib",
    on: "paper",
    surface: "sheet",
    stroke: [
      [0, 0],
      [0, -0.01],
    ],
    duration: 0.6,
  };
  const itself = refusal({ ...params, on: "pen", surface: "nib" }, pen);
  const fixed = refusal(params, { ...pen, fixed: true });
  // The nib riding a slider of the pen moves by a mechanism, not the grip.
  const riding: IAutoMovieAffordance[] = [
    { ...surface("nib"), rides: "slide" },
    { ...surface("slide"), kind: "slider", travel: 0.01 },
  ];
  const articulated = refusal(params, {
    ...pen,
    affordances: riding,
    articulate: (): IAutoMovieMotionHumanProp.IPosed => ({
      affordances: riding,
    }),
  });
  TestValidator.predicate(
    "the refusals",
    itself?.axis === "on" &&
      itself.kind === "affordance" &&
      fixed?.axis === "on" &&
      fixed.kind === "affordance" &&
      articulated?.axis === "tip" &&
      articulated.kind === "affordance",
  );
}
