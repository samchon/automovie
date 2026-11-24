import {
  createStagePoleBladeProp,
  createStageWeaponProp,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieChain,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The pole-blade display marks a profile can expose. */
type Mark = "tip" | "edge" | "rear" | "side-edge";

/** The two shaft grips the beat holds. */
type Grip = "grip-lower" | "grip-upper";

/** A grip and the hand that holds it through the beat. */
type Hold = readonly [grip: Grip, hand: AutoMovieHumanoidBone];

/** The display height every profile is staged at, metres. */
const HEIGHT: number = 0.72;

/** The two selected contacts and their hands. */
const HOLDS: readonly Hold[] = [
  ["grip-lower", "rightHand"],
  ["grip-upper", "leftHand"],
];

/** The least separation between two screen marks on a different part of the blade, metres: 4 percent of the staged 0.72 m display, about one hand's width on a medium shot. */
const APART: number = 0.03;

/** The least separation between an edge and its rear across the blade, metres: half the narrowest profile's 2 × 0.02 × 0.72 m width. */
const WIDTH: number = 0.01;

/** The largest gap between a holding hand's colliders and the shaft, metres: the 10 mm grip bound the catalogue contact tests use. */
const CONTACT: number = 0.01;

/** One placed hand collider group, as the collider reader returns it. */
type HandPart = ReturnType<
  ReturnType<typeof HumanColliders.preparePlaced>
>[number];

/**
 * Every pole-blade display profile keeps its two selected grips in the
 * hands through a public figure-eight take and shows tip, edge and rear
 * marks a camera can tell apart.
 *
 * Scenarios:
 * 1. The saved `createStageWeaponProp` and the named `createStagePoleBladeProp`
 *    build the same model for each profile at three seeds.
 * 2. Each profile is picked up by `grip-lower` in the right hand and
 *    `grip-upper` in the left and carried through the figure-eight beat. At
 *    five times across the beat each hand's colliders stay within 10 mm of
 *    the shaft and the lower hand stays below the upper. The lead hand's wrist
 *    stays within its grip's handle length; the support hand may slide, as a
 *    figure-eight's guiding hand does, but stays on the shaft.
 * 3. At those times the tip is at least 30 mm from every other mark, the side
 *    blade's `side-edge` at least 30 mm from its main edge, and the edge and
 *    rear at least 10 mm apart, facing away from each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profiles, the replay comparison, the two held contacts and the mark separations read in the take.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public stage-prop beat through HumanPerformance and reads the displayed prop frame, the posed hand colliders and the wrist frames.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm hand gap is the grip bound the catalogue contact tests use, and the slide allowance is each grip's own authored handle length; a round power grip may roll about the shaft, so no rotation is pinned. Marks on different parts of the blade are at least 30 mm apart, 4 percent of the staged 0.72 m display; an edge and its rear across the blade are at least 10 mm apart, half the narrowest profile's width, and face opposite ways.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all four profiles, the side blade's extra mark, both hands and five beat times; a profile whose marks coincided or whose grip slipped would fail.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on the scenario runner with a prepared polygon body and the public prop, chain and performance readers.
 */
export function test_motion_stage_fight_stage_polearm_marks(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const hands: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(
      body,
      new Set(
        [...HumanColliders.bones(body)].filter(
          (bone: AutoMovieHumanoidBone): boolean =>
            /^(right|left)(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone),
        ),
      ),
    );
  for (const kind of createStagePoleBladeProp.KINDS) {
    for (const seed of [undefined, 0, "film"])
      TestValidator.equals(
        `${kind} replays the saved recipe at seed ${String(seed)}`,
        JSON.stringify(
          createStagePoleBladeProp({ kind, height: HEIGHT }, seed),
        ),
        JSON.stringify(createStageWeaponProp({ kind, height: HEIGHT }, seed)),
      );

    const model: ReturnType<typeof createStagePoleBladeProp> =
      createStagePoleBladeProp({ kind, height: HEIGHT });
    const performance: HumanPerformance = beat(body, model);
    const segment: IAutoMovieMotionHumanSegment | undefined = performance
      .segments("carrier")
      .find(
        (entry: IAutoMovieMotionHumanSegment): boolean =>
          entry.law.name === "stageProp",
      );
    if (segment === undefined) throw new Error(`${kind} has no stage beat`);
    const times: number[] = [0, 0.25, 0.5, 0.75, 1].map(
      (u: number): number =>
        segment.entryTime + u * (segment.end - segment.entryTime),
    );

    const shaft: IAutoMoviePhysicalShape = model
      .shapes()
      .find((shape: IAutoMoviePhysicalShape): boolean => shape.id === "shaft")!;
    const along: Map<Grip, number[]> = new Map();
    for (const [grip, hand] of HOLDS) {
      const side: string = hand.startsWith("right") ? "right" : "left";
      const gaps: number[] = [];
      const places: number[] = [];
      for (const time of times) {
        const prop: IAutoMovieRigidTransform = performance.prop("shaft", time);
        gaps.push(
          Math.min(
            ...hands(performance.bones("carrier", time))
              .filter((part: HandPart): boolean => part.bone.startsWith(side))
              .flatMap((part: HandPart): number[] =>
                part.shapes.map((shape: IAutoMoviePhysicalShape): number =>
                  physicalShapePairDistance(part.pose, shape, prop, shaft),
                ),
              ),
          ),
        );
        places.push(
          inFrame(prop, handFrame(performance, hand, time)).position.y,
        );
      }
      along.set(grip, places);

      // The lead hand stays at its grip; the support hand may slide along the
      // shaft as a figure-eight's guiding hand does, but never off it.
      const handle: number = model.affordance(grip).length!;
      const shaftTop: number = model.affordance("shaft").length!;
      TestValidator.predicate(
        `${kind} keeps the ${hand} closed on ${grip} through the beat`,
        gaps.every((gap: number): boolean => gap <= CONTACT) &&
          places.every((place: number): boolean =>
            grip === "grip-lower"
              ? Math.abs(place - places[0]!) <= handle
              : place > 0 && place < shaftTop,
          ),
      );
    }
    TestValidator.predicate(
      `${kind} keeps the lower grip below the upper through the beat`,
      along
        .get("grip-lower")!
        .every(
          (lower: number, i: number): boolean =>
            lower < along.get("grip-upper")![i]!,
        ),
    );

    const marks: Mark[] = ["tip", "edge", "rear"];
    if (kind === "sideBlade") marks.push("side-edge");
    for (const time of times) {
      const world: Map<Mark, IAutoMovieRigidTransform> = new Map(
        marks.map((mark: Mark): [Mark, IAutoMovieRigidTransform] => [
          mark,
          place(performance.prop("shaft", time), model.affordance(mark).frame),
        ]),
      );
      const gap: (a: Mark, b: Mark) => number = (a: Mark, b: Mark): number =>
        Vector3.distance(world.get(a)!.position, world.get(b)!.position);

      // The tip stands apart from every other mark, the side blade's edge from
      // the main edge; the edge and its rear share the blade's width and are
      // told apart by facing away from each other.
      TestValidator.predicate(
        `${kind} shows separate ${marks.join(", ")} marks at ${time.toFixed(2)} s`,
        marks.every(
          (mark: Mark): boolean => mark === "tip" || gap("tip", mark) >= APART,
        ) &&
          (!marks.includes("side-edge") || gap("edge", "side-edge") >= APART) &&
          gap("edge", "rear") >= WIDTH &&
          -0.5 >
            Vector3.dot(normal(world.get("edge")!), normal(world.get("rear")!)),
      );
    }
  }
}

/** Stage one profile in the figure-eight beat, held at its two grips. */
function beat(
  body: IAutoMovieMotionHumanBody,
  model: ReturnType<typeof createStagePoleBladeProp>,
): HumanPerformance {
  const lower: number = model.affordance("grip-lower").frame.translation.y;
  const upper: number = model.affordance("grip-upper").frame.translation.y;
  const shaft: IAutoMovieMotionHumanProp = HumanObject.prop("shaft", model, {
    at: { x: -(lower + upper) / 2, y: 1.11, z: 0.29 },
    yaw: 0,
  });
  const enrolled: IAutoMovieMotionHumanChain = HumanChain.subject("carrier")
    .stand()
    .pickUp({ prop: "shaft", handle: "grip-lower", hand: "right", lift: 0 })
    .pickUp({ prop: "shaft", handle: "grip-upper", hand: "left", lift: 0 });
  const composition: IAutoMovieChain = AutoMovieMotionHumanStageFight.stageProp(
    enrolled,
    { beat: "figureEight", prop: "shaft", support: "grip-upper" },
    "shaft-display",
  );
  return new HumanPerformance({
    seed: "exercise-stage-polearm-marks",
    performers: [
      {
        subject: "carrier",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: composition.node,
    laws: [AutoMovieMotionHumanStageFight.HumanStageProp],
    props: [
      {
        ...shaft,
        frame: {
          ...shaft.frame,
          rotation: { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
        },
      },
    ],
  });
}

/** A displayed hand's world frame. */
function handFrame(
  performance: HumanPerformance,
  hand: AutoMovieHumanoidBone,
  time: number,
): IAutoMovieRigidTransform {
  const bone: NonNullable<
    ReturnType<ReturnType<HumanPerformance["bones"]>["get"]>
  > = performance.bones("carrier", time).get(hand)!;
  return { position: bone.worldPosition, rotation: bone.worldRotation };
}

/** A model-local frame carried by a displayed prop frame into the world. */
function place(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieTransform,
): IAutoMovieRigidTransform {
  return {
    position: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local.translation),
    ),
    rotation: Quaternion.multiply(frame.rotation, local.rotation),
  };
}

/** Express a world frame in another world frame. */
function inFrame(
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  const inverse: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
    parent.rotation,
  );
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(child.position, parent.position),
    ),
    rotation: Quaternion.multiply(inverse, child.rotation),
  };
}

/** A surface mark's outward normal, its frame's `+Y`, in the world. */
function normal(frame: IAutoMovieRigidTransform): IAutoMovieVector3 {
  return Quaternion.rotateVector(frame.rotation, { x: 0, y: 1, z: 0 });
}
