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
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanButton,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanRefusal,
  button,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/** Half the opening's side, metres. */
const HALF: number = 0.018;

/** How far the button stands above the panel, metres. */
const ABOVE: number = 0.025;

/** The button's width, metres. */
const WIDE: number = 0.014;

/** The button's thickness, metres. */
const TALL: number = 0.006;

/** The panel's thickness, metres. */
const PANEL: number = 0.004;

/** The button's travel through the opening, metres. */
const TRAVEL: number = 2 * ABOVE;

/**
 * How near the pushing thumb tip comes to the button's upper face, metres: 20
 * mm, the skin's 10 mm give plus 10 mm (`HumanSignature.CONTACT`).
 */
const CONTACT: number = 0.02;

/** The garment's named sites. */
type Site = "rim" | "opening" | "slide" | "center" | "push";

/**
 * `button.plan` passes a button through its buttonhole: the thumb pushes the
 * button's upper face through the opening over the stroke, `strokeStart` before
 * `strokeEnd`; a garment that is not articulated is refused.
 *
 * Scenario, the average man standing at the origin facing +Z, a minimal garment
 * held fixed ahead of his right hand: four panels bounding a 36 mm square
 * opening and a 14 mm button on a slider 25 mm above it, travelling 50 mm
 * through it, pushed over 0.45 s:
 *
 * 1. `strokeStart` precedes `strokeEnd`.
 * 2. At `strokeStart` the right thumb tip lies on the button's upper face, within
 *    20 mm.
 * 3. The same garment's sites on a prop with no articulated model are refused.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_button(): Promise<void> {
  // Plans the pushing hand and its digits on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const side: number = Math.sign(shoulder.x);
  const at: IAutoMovieVector3 = {
    x: 0,
    y: body.measure.shoulderHeight - body.measure.upperArm,
    z: shoulder.z + 0.8 * body.measure.forearm,
  };
  const model: AutoMovieArchetype<Site, never> = garment(side);
  const fixture: IAutoMovieMotionHumanProp = HumanObject.prop(
    "garment",
    model,
    { position: at, rotation: Quaternion.identity(), fixed: true },
  );
  const params: IAutoMovieMotionHumanButton = {
    garment: "garment",
    opening: "opening",
    rim: "rim",
    button: "center",
    contact: "push",
    travel: TRAVEL,
    radius: Math.hypot(WIDE / 2, WIDE / 2, TALL / 2),
    thickness: PANEL,
    duration: 0.45,
  };
  const plan: IAutoMovieMotionHumanActionPlan = button.plan(
    motionActionContext(body, params, { props: [fixture] }),
  );
  const event = (name: string): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  const start: number = event("strokeStart");
  const bones = poseBones(body, resolveHumanPosture(body, plan.posture(start)));
  const frame = body.surfaces.regions.thumbTipRight;
  const thumb: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    frame,
    bones.get(frame.bone)!,
  ).point;
  const face: IAutoMovieVector3 = Vector3.add(at, {
    x: side * 0.025,
    y: ABOVE + TALL / 2,
    z: 0,
  });
  TestValidator.predicate(
    "on the button",
    start < event("strokeEnd") && Vector3.distance(thumb, face) <= CONTACT,
  );
  // The button rides its slider down through the opening: none of its travel
  // at the stroke's start, all of it at the end, and half way, where its
  // centre (25 mm above the panel less the travel) lies within the panel.
  const drive = plan.drives?.find((d) => d.articulation === "slide");
  const end: number = event("strokeEnd");
  TestValidator.predicate(
    "through the opening",
    drive !== undefined &&
      Math.abs(drive.travel(start)) <= 1e-6 &&
      Math.abs(drive.travel(end) - TRAVEL) <= 1e-6 &&
      Math.abs(ABOVE - drive.travel((start + end) / 2)) < PANEL / 2,
  );
  let refused: boolean = false;
  try {
    button.plan(
      motionActionContext(body, params, {
        props: [
          {
            subject: "garment",
            fixed: true,
            frame: { position: at, rotation: Quaternion.identity() },
            points: {},
            affordances: model.affordances,
          },
        ],
      }),
    );
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal;
  }
  TestValidator.predicate("no articulated garment", refused);
}

/**
 * Four fixed strips bounding open space, with one separately articulated button
 * on a slider above the opening.
 *
 * @param side Which side of the midline the button stands, by the right
 *   shoulder's sign.
 * @returns The garment.
 */
function garment(side: number): AutoMovieArchetype<Site, never> {
  const x: number = side * 0.025;
  const v: typeof Vector3.create = Vector3.create;
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
    .box("button-disc", v(WIDE, TALL, WIDE), v(x, ABOVE, 0))
    .affordance({
      id: "opening",
      kind: "aperture",
      extent: null,
      width: 2 * HALF,
      height: 2 * HALF,
      frame: {
        ...Transform.identity(),
        translation: v(x, 0, -HALF),
        rotation: Quaternion.fromAxisAngle(v(1, 0, 0), 90),
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
      frame: {
        ...Transform.identity(),
        rotation: Quaternion.fromAxisAngle(v(0, 0, 1), -90),
      },
    })
    .affordance({
      id: "center",
      kind: "surface",
      extent: null,
      rides: "slide",
      frame: { ...Transform.identity(), translation: v(x, ABOVE, 0) },
    })
    .affordance({
      id: "push",
      kind: "surface",
      extent: null,
      rides: "slide",
      frame: {
        ...Transform.identity(),
        translation: v(x, ABOVE + TALL / 2, 0),
      },
    })
    .build(0.1);
}
