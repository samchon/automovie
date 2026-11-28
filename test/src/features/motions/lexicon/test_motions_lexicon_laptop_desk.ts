import {
  AutoMovieArchetypeKeyboard,
  AutoMovieArchetypeLaptop,
  AutoMovieArchetypeSeat,
  AutoMovieArchetypeTable,
} from "@automovie/archetypes";
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** Contact tolerance from the staged typing case, metres. */
const CONTACT: number = 0.01;

/**
 * A seated typist opens a closed laptop and then types on its fixed deck.
 *
 * Two desk positions preserve the named chair support and keyboard frame. The
 * right hand follows the lid through opening and releases it before typing. The
 * laptop stays on the desk throughout. The saved fixed-lid keyboard refuses the
 * same native hinge request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the chair, hinge motion, supporting desk, typed continuation and fixed-lid refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes public Chain and Performance calls through stock props, samples the displayed grip and index fingers at played instants, and reads seat contacts, laptop position and hinge state.
 * @evidence contracts/development/testing.md#independent-expectations Compares the carried lid with the displayed grip on its release clock, checks original support and rest contact frames directly, and uses the 19.05 mm keyboard pitch and 4 mm key travel for F and J.
 */
export async function test_motions_lexicon_laptop_desk(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const seatHeight: number =
    body.measure.ankleHeight + body.measure.shank - body.measure.thighRadius;
  const chair = AutoMovieArchetypeSeat.create({
    kind: "office",
    seatHeight,
    seatWidth: 0.5,
    seatDepth: 0.485,
    armHeight: 0.2,
  });
  const desk = AutoMovieArchetypeTable.create({
    kind: "desk",
    height: 0.74,
    depth: 0.65,
  });
  const laptop = AutoMovieArchetypeLaptop.create({ model: "air13" });
  const closed: number = laptop.affordance("hinge").travel!;
  const chairAt = {
    at: { x: 0, y: 0, z: -chair.affordance("seat").frame.translation.z },
    yaw: 0,
    fixed: true,
  } satisfies IAutoMovieMotionHumanObject.Placement;
  const seat = AutoMovieMotionHumanObject.seat(chair, chairAt, "seat", "chair");
  const stagedChair = AutoMovieMotionHumanObject.prop("chair", chair, chairAt);
  const chain = AutoMovieMotionHumanChain.subject("actor")
    .sit({ seat, hold: 0.3 }, "sit")
    .operate(
      {
        kind: {
          kind: "hinge",
          at: { kind: "prop", subject: "laptop", point: "lid" },
          swing: -closed,
        },
        hand: "right",
        manner: { pace: 0.7 },
      },
      "opening",
    )
    .typeText({ keyboard: "laptop", text: "fj" }, "typing");
  const take = (props: IAutoMovieMotionHumanProp[]) =>
    new AutoMovieMotionHumanPerformance({
      seed: "desk rehearsal",
      performers: [
        {
          subject: "actor",
          body,
          at: { x: 0, y: 0, z: 0.13 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props,
      composition: chain.node,
    });
  const top = desk.affordance("top");
  const desktop = (z: number): IAutoMovieMotionHumanProp =>
    AutoMovieMotionHumanObject.prop("desk", desk, {
      at: { x: 0, y: 0, z: z + 0.17 },
      yaw: 180,
      fixed: true,
    });
  const base = (z: number): IAutoMovieMotionHumanObject.Placement => ({
    at: { x: 0, y: top.frame.translation.y, z },
    yaw: 180,
    fixed: true,
  });

  for (const z of [0.0284, -0.0316]) {
    const computer = AutoMovieMotionHumanObject.prop(
      "laptop",
      laptop,
      base(z),
      undefined,
      undefined,
      [{ articulation: "hinge", start: 0, duration: 0, travel: () => closed }],
    );
    const scene = take([stagedChair, desktop(z), computer]);
    const open = scene.instant({ of: "opening", event: "strokeEnd" });
    const relax = scene.instant({ of: "opening", event: "relax" });
    const firstKey = scene.instant({ of: "typing", event: "press1" });
    const secondKey = scene.instant({ of: "typing", event: "press2" });
    const before = scene.site("laptop", "homeRow", 0);
    const lid = scene.site("laptop", "lid", open);
    const point = (
      frame: IAutoMovieHumanoidSurfaces.IFrame,
      seconds: number,
    ): IAutoMovieVector3 =>
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
        frame,
        scene.bones("actor", seconds).get(frame.bone)!,
      ).point;
    const [sit, operate, typing] = scene.segments("actor");
    TestValidator.predicate(
      "chair support lasts through the opening and typing",
      [sit!, operate!, typing!].every((segment) =>
        segment.plan.contacts.some(
          (window) =>
            window.part === "seat" &&
            window.support.kind === "prop" &&
            window.support.subject === "chair" &&
            window.support.point === "seat" &&
            window.to === 1,
        ),
      ),
    );
    TestValidator.predicate(
      "the operated grip releases before typing on the same film clock",
      open <= relax &&
        relax < firstKey &&
        firstKey < secondKey &&
        operate!.plan.contacts.some(
          (window) =>
            window.kind === "grip" &&
            window.part === "rightHand" &&
            window.support.kind === "prop" &&
            window.support.subject === "laptop" &&
            window.support.carries === false,
        ) &&
        vclose(
          point(body.surfaces.sockets.gripRight, open),
          lid.position,
          CONTACT,
        ) &&
        !vclose(
          point(body.surfaces.sockets.gripRight, firstKey),
          lid.position,
          CONTACT,
        ),
    );
    TestValidator.predicate(
      "the lid stays open and the keyboard deck stays above its support",
      scene.state("laptop", 0).hinge === closed &&
        scene.state("laptop", open).hinge === 0 &&
        scene.state("laptop", secondKey).hinge === 0 &&
        scene.site("laptop", "lid", 0).position.y + 0.15 < lid.position.y &&
        vclose(
          scene.site("laptop", "lid", secondKey).position,
          lid.position,
          1e-9,
        ) &&
        vclose(
          scene.site("laptop", "homeRow", secondKey).position,
          before.position,
          1e-9,
        ) &&
        vclose(
          scene.prop("laptop", secondKey).position,
          computer.frame.position,
          1e-9,
        ) &&
        computer.frame.position.y ===
          scene.site("desk", "top", secondKey).position.y,
    );
    // On the home row, F and J are each 1.5 key pitches from its centre.
    for (const [clock, region, sign] of [
      [firstKey, "indexTipLeft", 1],
      [secondKey, "indexTipRight", -1],
    ] as const) {
      TestValidator.predicate(
        `${region} presses its selected key`,
        vclose(
          point(body.surfaces.regions[region], clock),
          {
            x: before.position.x + sign * 1.5 * 0.01905,
            y: before.position.y - 0.004,
            z: before.position.z,
          },
          CONTACT,
        ),
      );
    }
  }

  const fixed = AutoMovieArchetypeKeyboard.create({
    kind: "laptop",
    model: "air13",
  });
  let refused: boolean = false;
  try {
    take([
      stagedChair,
      desktop(0.0284),
      AutoMovieMotionHumanObject.prop("laptop", fixed, base(0.0284)),
    ]);
  } catch (error: unknown) {
    refused =
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "affordance" &&
      error.axis === "kind" &&
      error.value === "hinge";
  }
  TestValidator.predicate("fixed lid has no admitted hinge drive", refused);
}
