import {
  createPaper,
  createPen,
  createToothbrush,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

const { write } = AutoMovieMotionHumanOperate;

/** Position a model's contact in the world from its displayed prop frame. */
const place = (
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, point));

/**
 * A seeded pen and brush carry their own working points through the public actor choreography.
 *
 * Scenarios:
 * 1. Take up the pen and write a 10 mm stroke on a fixed paper sheet. Read the rendered pen's actual working point at both ends of the stroke.
 * 2. Take up the toothbrush and bring its bristle face to the actor's mouth. Read the displayed bristles and actual posed mouth frame at the contact.
 * 3. The tool keeps its modeled grip relative to the same wrist during the activity.
 * 4. A folded map has an articulation and is refused as the stationary writing surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which props, contacts, phases and bounds are checked.
 * @evidence contracts/development/testing.md#behavioral-verification Builds actual named models, executes public pickup, write and hand-to-face, and samples the prop and performer frames.
 * @evidence contracts/development/testing.md#independent-expectations The paper's fixed world plane and authored stroke endpoints constrain the writing tip within the existing 1 mm writing bound. The posed mouth and bristle face meet within the existing 10 mm skin allowance. The held pose preserves the prop's wrist-local grip within 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases A planar endpoint trace on a rigid sheet differs from a face contact on a moving body. Both compare actual contact during work against pickup. The same writing placement rejects a genuinely articulated map.
 * @evidence contracts/development/testing.md#execution-ownership Uses in-memory public films and one canonical body with no capture host.
 */
export function test_motion_operate_tools_personal_motion(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bench: number = body.measure.waistHeight;
  const right: number = -body.measure.shoulderHalfWidth;
  const cast: IAutoMovieMotionHumanPerformer[] = [
    {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
  ];

  const pen: ReturnType<typeof createPen> = createPen({}, 0);
  const paper: ReturnType<typeof createPaper> = createPaper({}, 0);
  const paperAt: IAutoMovieVector3 = { x: right, y: bench, z: 0.45 };
  const penProp: IAutoMovieMotionHumanProp = HumanObject.prop("pen", pen, {
    at: { x: right - 0.07, y: bench, z: 0.3 },
    yaw: 0,
  });
  /** Stage the writing action against the produced paper format. */
  const writeOn = (
    surface: ReturnType<typeof createPaper>,
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.film(
      new HumanPerformance({
        seed: "catalogue-pen",
        performers: cast,
        laws: [write],
        props: [
          penProp,
          HumanObject.prop("paper", surface, {
            at: paperAt,
            yaw: 0,
            fixed: true,
          }),
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "pen", handle: "grip", hand: "right" })
          .registered("write", {
            tool: "pen",
            tip: "face",
            on: "paper",
            surface: "face",
            stroke: [
              [0, 0],
              [0.01, 0],
            ],
            duration: 0.6,
          }).node,
      }),
    );
  const writing: motionHumanLaw.IFilm = writeOn(paper);

  const brush: ReturnType<typeof createToothbrush> = createToothbrush({}, 0);
  const grooming: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "catalogue-brush",
    cast,
    HumanChain.subject("a")
      .pickUp({ prop: "brush", handle: "grip", hand: "right" })
      .handToFace({
        prop: "brush",
        point: "face",
        hand: "right",
        kind: "brushTeeth",
      }),
    [
      HumanObject.prop("brush", brush, {
        at: { x: right, y: bench, z: 0.3 },
        yaw: 0,
      }),
    ],
  );

  for (const [event, offset] of [
    ["strokeStart", 0],
    ["strokeEnd", 0.01],
  ] as const) {
    const seconds: number = motionHumanLaw.event(writing, event);
    const tip: IAutoMovieVector3 = place(
      writing.performance.prop("pen", seconds),
      pen.site("face").translation,
    );
    const expected: IAutoMovieVector3 = {
      x: paperAt.x + offset,
      y: paperAt.y + paper.dimensions.thickness!,
      z: paperAt.z,
    };
    const miss: number = Vector3.distance(tip, expected);
    TestValidator.predicate(
      `pen tip reaches ${event} within 1 mm (${miss * 1000} mm)`,
      miss <= 0.001,
    );
  }

  const atMouth: number = motionHumanLaw.event(grooming, "atMouth");
  const bristles: IAutoMovieVector3 = place(
    grooming.performance.prop("brush", atMouth),
    brush.site("face").translation,
  );
  const mouth: IAutoMovieMotionHumanBody["surfaces"]["regions"]["mouth"] =
    body.surfaces.regions.mouth;
  const lips: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    mouth,
    grooming.bones("a", atMouth).get(mouth.bone)!,
  ).point;
  const miss: number = Vector3.distance(bristles, lips);
  TestValidator.predicate(
    `the brush face reaches the posed mouth within the skin allowance (${miss * 1000} mm)`,
    miss <= HumanVerdicts.SKIN,
  );

  for (const [subject, film, grip, end] of [
    [
      "pen",
      writing,
      pen.site("grip").translation,
      motionHumanLaw.event(writing, "strokeEnd"),
    ],
    ["brush", grooming, brush.site("grip").translation, atMouth],
  ] as const) {
    /** Read the modeled grip centre in the posed right wrist's frame. */
    const local = (seconds: number): IAutoMovieVector3 => {
      const wrist: IAutoMovieResolvedBone = film
        .bones("a", seconds)
        .get("rightHand")!;
      const point: IAutoMovieVector3 = place(
        film.performance.prop(subject, seconds),
        grip,
      );
      return Quaternion.rotateVector(
        Quaternion.inverse(wrist.worldRotation),
        Vector3.subtract(point, wrist.worldPosition),
      );
    };
    const captured: number = motionHumanLaw.event(film, "gripClosed");
    const slip: number = Vector3.distance(local(captured), local(end));
    TestValidator.predicate(
      `${subject} preserves its local grip within 1 mm (${slip * 1000} mm)`,
      slip <= 0.001,
    );
  }

  let refusal: unknown;
  try {
    writeOn(createPaper({ format: "foldedMap" }, 0));
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "a genuinely articulated paper surface is refused",
    refusal instanceof HumanRefusal &&
      refusal.kind === "affordance" &&
      refusal.axis === "on",
  );
}
