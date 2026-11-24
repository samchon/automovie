import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "@automovie/archetypes";
import {
  Quaternion,
  Transform,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieModelPart,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanButton,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { button } = AutoMovieMotionHumanOperate;

/** Sites on the assembled panel, including the slider carrying the button. */
type Site = "rim" | "opening" | "slide" | "center" | "push";

/** Panel thickness and opening half-width, metres. */
const PANEL: number = 0.004;
const HALF: number = 0.018;

/** Start offset and diameter of the moving box in the passage plane, metres. */
const ABOVE: number = 0.025;
const WIDE: number = 0.014;
const TALL: number = 0.006;
const TRAVEL: number = 2 * ABOVE;
const RADIUS: number = Math.hypot(WIDE / 2, WIDE / 2, TALL / 2);

/**
 * A fixed garment holds the button after the working thumb pushes it through.
 *
 * Scenarios:
 * 1. A fitted thumb and opposing index finger follow the moving button and
 *    stationary rim. Actual model geometry clears the panel, passes within
 *    the hole and stays closed when the two hands release.
 * 2. A slider that moves the button alongside the opening is refused even
 *    though its available travel would cross the panel plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual garment geometry, hand contacts and counterexample.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public performance and the model part transforms driven by its published state and measures the displayed digits.
 * @evidence contracts/development/testing.md#independent-expectations Compares the translated button's authored box extents against the panel's faces and aperture and measures fingertip distances within the keyed-contact limit of 2 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases The off-center trajectory crosses the same plane and uses the same travel, but misses the hole. Separate moving and static contacts check both hands without reading the action's target callbacks.
 * @evidence contracts/development/testing.md#execution-ownership A motion feature test on one polygon-man body, with actual authored part bindings and no external host.
 */
export function test_motion_operate_button(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const side: number = Math.sign(shoulder.x);
  const at: IAutoMovieVector3 = {
    x: 0,
    y: body.measure.shoulderHeight - body.measure.upperArm,
    z: shoulder.z + 0.8 * body.measure.forearm,
  };
  const params: IAutoMovieMotionHumanButton = {
    garment: "garment",
    opening: "opening",
    rim: "rim",
    button: "center",
    contact: "push",
    travel: TRAVEL,
    radius: RADIUS,
    thickness: PANEL,
    duration: 0.45,
  };
  const run = (model: AutoMovieArchetype<Site, never>): HumanPerformance =>
    new HumanPerformance({
      seed: "button through aperture",
      laws: [button],
      performers: [
        {
          subject: "actor",
          body,
          at: Vector3.create(0, 0, 0),
          yaw: 0,
          proficiency: { level: "elite" },
        },
      ],
      props: [
        HumanObject.prop(params.garment, model, {
          position: at,
          rotation: Quaternion.identity(),
          fixed: true,
        }),
      ],
      composition: HumanChain.subject("actor").registered("button", params)
        .node,
    });

  const model: AutoMovieArchetype<Site, never> = garment(side, 0);
  const performance: HumanPerformance = run(model);
  const scene: IAutoMovieMotionHumanSegment = performance.segments("actor")[0]!;
  const event = (name: string): number =>
    scene.start +
    scene.plan.duration *
      scene.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share;
  const start: number = event("strokeStart");
  const end: number = event("strokeEnd");
  const after: number = scene.start + scene.plan.duration;

  TestValidator.predicate(
    "the whole button starts above the panel",
    center(model, performance, start).y - TALL / 2 > PANEL / 2,
  );
  TestValidator.predicate(
    "the whole button clears the panel and remains there when the hands leave",
    center(model, performance, end).y + TALL / 2 < -PANEL / 2 &&
      center(model, performance, after).y + TALL / 2 < -PANEL / 2,
  );

  const rim: IAutoMovieVector3 = Vector3.add(
    at,
    Vector3.create(-side * 0.025, PANEL / 2, 0),
  );
  for (const share of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const seconds: number = start + (end - start) * share;
    const moved: IAutoMovieVector3 = center(model, performance, seconds);
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("actor", seconds);
    TestValidator.predicate(
      `the model's button fits inside the clear opening at ${share}`,
      Math.abs(moved.x - side * 0.025) + WIDE / 2 < HALF &&
        Math.abs(moved.z) + WIDE / 2 < HALF &&
        (share !== 0.5 || Math.abs(moved.y) < PANEL / 2),
    );
    TestValidator.predicate(
      `the thumb follows the upper face at ${share}`,
      Vector3.length(
        Vector3.subtract(
          tip(body, bones, "thumbTipRight"),
          Vector3.add(at, { ...moved, y: moved.y + TALL / 2 }),
        ),
      ) <= 0.002,
    );
    TestValidator.predicate(
      `the opposite index braces the rim at ${share}`,
      Vector3.length(Vector3.subtract(tip(body, bones, "indexTipLeft"), rim)) <=
        0.002,
    );
  }

  let refused: boolean = false;
  try {
    run(garment(side, 2 * HALF)).segments("actor");
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.message.includes("clear");
  }
  TestValidator.predicate(
    "a button crossing at the wrong lateral offset is refused",
    refused,
  );
}

/** Four fixed strips bound actual open space, with one separately articulated button. */
function garment(
  side: number,
  offset: number,
): AutoMovieArchetype<Site, never> {
  const x: number = side * 0.025;
  const v: typeof Vector3.create = Vector3.create;
  const aperture: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    v(1, 0, 0),
    90,
  );
  const slide: IAutoMovieQuaternion = Quaternion.fromAxisAngle(v(0, 0, 1), -90);
  return new AutoMovieArchetypeBuilder<Site, never>({
    material: "fabric",
    name: "button crossing fixture",
    draw: new AutoMovieArchetypeDrawSession<never>(
      "button-fixture",
      {},
      undefined,
    ),
  })
    .box("left-panel", v(0.08, PANEL, 0.1), v(x - HALF - 0.04, 0, 0))
    .box("right-panel", v(0.08, PANEL, 0.1), v(x + HALF + 0.04, 0, 0))
    .box("near-panel", v(2 * HALF, PANEL, 0.032), v(x, 0, -HALF - 0.016))
    .box("far-panel", v(2 * HALF, PANEL, 0.032), v(x, 0, HALF + 0.016))
    .box("button-disc", v(WIDE, TALL, WIDE), v(x + offset, ABOVE, 0))
    .affordance({
      id: "opening",
      kind: "aperture",
      extent: null,
      width: 2 * HALF,
      height: 2 * HALF,
      frame: {
        ...Transform.identity(),
        translation: v(x, 0, -HALF),
        rotation: aperture,
      },
    })
    .affordance({
      id: "rim",
      kind: "surface",
      extent: null,
      frame: { ...Transform.identity(), translation: v(-x, PANEL / 2, 0) },
    })
    .affordance({
      id: "slide",
      kind: "slider",
      extent: null,
      parts: ["button-disc"],
      travel: TRAVEL,
      frame: { ...Transform.identity(), rotation: slide },
    })
    .affordance({
      id: "center",
      kind: "surface",
      extent: null,
      rides: "slide",
      frame: { ...Transform.identity(), translation: v(x + offset, ABOVE, 0) },
    })
    .affordance({
      id: "push",
      kind: "surface",
      extent: null,
      rides: "slide",
      frame: {
        ...Transform.identity(),
        translation: v(x + offset, ABOVE + TALL / 2, 0),
      },
    })
    .build(0.1);
}

/** Read the actual posed mesh part, using the performance's authored articulation state. */
function center(
  model: AutoMovieArchetype<Site, never>,
  performance: HumanPerformance,
  seconds: number,
): IAutoMovieVector3 {
  return model
    .articulate(performance.state("garment", seconds))
    .parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "button-disc",
    )!.transform!.translation;
}

/** Resolve one actual fingertip on the displayed bones. */
function tip(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  region: "thumbTipRight" | "indexTipLeft",
): IAutoMovieVector3 {
  const surface: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  return resolveAutoMovieHumanoidSurfaces.place(
    surface,
    bones.get(surface.bone)!,
  ).point;
}
