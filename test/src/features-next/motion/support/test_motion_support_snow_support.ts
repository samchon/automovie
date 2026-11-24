import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  createSki,
  createSnowboard,
} from "@automovie/archetypes";
import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";
import { vclose } from "../../../features/internal/vclose";

/** The Nordic pole model's planted tip and held grip. */
type PoleAffordance = "tip" | "grip";

/** Anatomical lateral, world vertical and equipment forward axes at entry. */
const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const Y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const Z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * Downhill skis and a snowboard change selected edges and slow to a stop.
 * A separate Nordic take adds a planted pole and the opposite ski stroke.
 *
 * Scenarios:
 * 1. Opposite alpine edge supports meet a sloped plane, with the rider
 *    changing lean and chest rotation at each edge and recovering at rest.
 * 2. A Nordic pole grip follows the placed shaft while its tip is planted
 *    and the opposite ski moves rearward before recovering. An absent grip is refused.
 * 3. The rider steps onto a still snowboard's bindings one foot at a time;
 *    the independently posed board's edge contacts then change while the
 *    rider remains attached to the deck throughout and reaches stillness.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the snow planes, equipment and movement branches.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed ski alignment, knee flexion and torso rotation, named pole placement and the moving snowboard decks and feet.
 * @evidence contracts/development/testing.md#independent-expectations Real modeled edge locations and the authored slope plane give clearance. Pellegrini et al. (2020, Figure 2, https://pubmed.ncbi.nlm.nih.gov/32439501/) distinguishes pole and opposite ski phases.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite edges are loaded before and after the flat passage. The Nordic pole and kick do not occur in the alpine glide. The snowboard transports a crosswise stance.
 * @evidence contracts/development/testing.md#execution-ownership In-memory production skis, snowboard, pole frame and Human performance.
 */
export function test_motion_support_snow_support(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("snow support", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    subject: "snow",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const snowGlide = (
    params: IAutoMovieMotionHumanSurface.ISnowGlideParams,
    props: IAutoMovieMotionHumanProp[] = [],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "snow-support",
      performers: [performer],
      laws: [AutoMovieMotionHumanRide.HumanSurface.snowGlide],
      props,
      composition: HumanChain.subject("snow").registered("snowGlide", params)
        .node,
    });
  const ski: ReturnType<typeof createSki> = createSki({}, 8);
  const before: ReturnType<HumanPerformance["bones"]> = snowGlide({
    duration: 1,
    speed: 1,
  }).bones("snow", 0);
  const stance: IAutoMovieVector3 = ski.affordance("stance").frame.translation;
  const pivots = (
    id: createSki.Affordance,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> => {
    const edge: IAutoMovieVector3 = ski.affordance(id).frame.translation;
    const offset: IAutoMovieVector3 = Vector3.subtract(edge, stance);
    const mount = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
      const foot: IAutoMovieResolvedBone = before.get(`${side}Foot`)!;
      return Quaternion.rotateVector(Quaternion.inverse(foot.worldRotation), {
        ...offset,
        y: -foot.worldPosition.y,
      });
    };
    return { left: mount("left"), right: mount("right") };
  };
  const downhill: number = 6;
  const slope: IAutoMovieQuaternion = Quaternion.fromAxisAngle(X, downhill);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(slope, Y);
  const inner: ReturnType<typeof pivots> = pivots("rightEdge");
  const outer: ReturnType<typeof pivots> = pivots("leftEdge");
  // The run descends a declared slope: the skis glide on its surface.
  const hill: IAutoMovieMotionHumanProp = {
    subject: "slope",
    fixed: true,
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: slope },
    points: {},
  };
  const alpine: HumanPerformance = snowGlide(
    {
      duration: 3.2,
      speed: 1.4,
      grade: downhill,
      slope: "slope",
      turn: 24,
      stop: true,
      edgeTransfer: {
        first: { degrees: 8, pivots: inner },
        next: { degrees: -8, pivots: outer },
        at: 1.6,
        counter: 13,
      },
    },
    [hill],
  );
  collectTakeClean(`${key} alpine turns`, alpine, failures);
  const findings: string[] = [];
  const check = (label: string, valid: boolean): void => {
    if (!valid) findings.push(label);
  };
  const samples: readonly (readonly [number, number])[] = [
    [0.8, 1],
    [1.6, 0],
    [2.4, -1],
  ];
  for (const [time, sideOfEdge] of samples) {
    const bones: ReturnType<HumanPerformance["bones"]> = alpine.bones(
      "snow",
      time,
    );
    const cant: number[] = [];
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const local: IAutoMovieVector3 = (sideOfEdge >= 0 ? inner : outer)[side];
      const floor: IAutoMovieVector3 = point(before.get(`${side}Foot`)!, local);
      const gap: number = Vector3.dot(
        normal,
        Vector3.subtract(point(foot, local), floor),
      );
      check(
        `${side} placed edge tracks the snow plane at ${time} s (${gap} m)`,
        Math.abs(gap) <= 0.015,
      );
      cant.push(
        Vector3.dot(normal, Quaternion.rotateVector(foot.worldRotation, X)),
      );
    }
    check(
      `skis show the selected cant at ${time} s (${cant.join(", ")})`,
      cant.every((tilt: number): boolean => {
        return sideOfEdge === 0
          ? Math.abs(tilt) < 0.04
          : sideOfEdge * tilt > 0.065;
      }),
    );
    const chest: IAutoMovieResolvedBone = bones.get("chest")!;
    const hips: IAutoMovieResolvedBone = bones.get("hips")!;
    const twist: number = Vector3.dot(
      Quaternion.rotateVector(
        Quaternion.multiply(
          Quaternion.inverse(hips.worldRotation),
          chest.worldRotation,
        ),
        Z,
      ),
      X,
    );
    if (sideOfEdge !== 0)
      check(
        `the chest counterturns on opposing edges (${twist})`,
        -sideOfEdge * twist > 0.075,
      );
  }
  const hipsAt = (film: HumanPerformance, at: number): IAutoMovieVector3 =>
    film.bones("snow", at).get("hips")!.worldPosition;
  check(
    "alpine descent advances and rests",
    hipsAt(alpine, 2.4).z > 1.8 &&
      Vector3.distance(hipsAt(alpine, 3.19), hipsAt(alpine, 3.2)) <= 0.001,
  );
  check(
    "the glider lowers through the edges and rises at rest",
    hipsAt(alpine, 0.8).y -
      (hipsAt(alpine, 0).y -
        hipsAt(alpine, 0.8).z * Math.tan((downhill * Math.PI) / 180)) <
      -0.04 &&
      Math.abs(
        hipsAt(alpine, 3.2).y -
          (hipsAt(alpine, 0).y -
            hipsAt(alpine, 3.2).z * Math.tan((downhill * Math.PI) / 180)),
      ) < 0.025,
  );

  // The model's pole rotates around the planted tip through the stroke.
  const tip: IAutoMovieVector3 = { x: 0.3, y: 0, z: 0.42 };
  const grip: IAutoMovieVector3 = { x: 0, y: 1.06, z: 0 };
  const model: AutoMovieArchetype<PoleAffordance, never> =
    new AutoMovieArchetypeBuilder<PoleAffordance, never>({
      material: "composite",
      name: "Nordic pole",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "nordic-pole",
        {},
        undefined,
      ),
    })
      .rod("shaft", 0.009, Vector3.create(0, 0, 0), { ...grip, y: 1.12 })
      .affordance({
        id: "tip",
        kind: "surface",
        frame: AutoMovieArchetypeFrame.facing(Vector3.create(0, 0, 0), {
          x: 0,
          y: -1,
          z: 0,
        }),
        extent: null,
      })
      .affordance({
        id: "grip",
        kind: "handle",
        frame: AutoMovieArchetypeFrame.facing(grip, X, Y),
        extent: null,
        symmetry: "round",
        grip: "power",
        aperture: 0.018,
        length: 0.12,
      })
      .build(0.2);
  const poleAt = (at: number): IAutoMovieRigidTransform => ({
    position: tip,
    rotation: Quaternion.fromAxisAngle(
      X,
      15 + 25 * minimumJerk.share((at - 0.5) / 0.6),
    ),
  });
  const pole: IAutoMovieMotionHumanProp = HumanObject.prop(
    "pole",
    model,
    poleAt(0),
    poleAt,
  );
  const stroke: NonNullable<
    IAutoMovieMotionHumanSurface.ISnowGlideParams["nordic"]
  > = {
    hand: "left",
    on: "pole",
    grip: "grip",
    window: [0.5, 1.1],
    kick: 0.24,
  };
  const skiStroke = (grip: string): HumanPerformance =>
    snowGlide(
      { duration: 2.2, speed: 1.15, stop: true, nordic: { ...stroke, grip } },
      [pole],
    );
  const nordic: HumanPerformance = skiStroke("grip");
  collectTakeClean(`${key} nordic stroke`, nordic, failures);
  for (const at of [0.5, 0.8, 1.1]) {
    const shown: IAutoMovieRigidTransform = nordic.prop("pole", at);
    const point = (id: PoleAffordance): IAutoMovieVector3 =>
      Vector3.add(
        shown.position,
        Quaternion.rotateVector(
          shown.rotation,
          model.affordance(id).frame.translation,
        ),
      );
    const hand: ReturnType<typeof HumanHand.frame> = HumanHand.frame(
      body,
      nordic.bones("snow", at),
      "left",
      "grip",
    );
    const shaft: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(point("grip"), point("tip")),
    );
    check(
      `the pole stays planted and the palm follows across its shaft at ${at} s`,
      pole.point === undefined &&
        Vector3.distance(tip, point("tip")) < 1e-8 &&
        Vector3.distance(hand.point, point("grip")) < 0.035 &&
        Vector3.dot(hand.normal, X) < -0.9 &&
        Math.abs(Vector3.dot(hand.forward, shaft)) > 0.9,
    );
  }
  let missing: unknown;
  try {
    skiStroke("missing");
  } catch (error) {
    missing = error;
  }
  check(
    "the standard pole refuses a missing grip by name",
    missing instanceof HumanRefusal &&
      missing.kind === "affordance" &&
      missing.axis === "nordic.grip",
  );
  const offset = (at: number): number => {
    const bones: ReturnType<HumanPerformance["bones"]> = nordic.bones(
      "snow",
      at,
    );
    return (
      bones.get("leftFoot")!.worldPosition.z -
      bones.get("rightFoot")!.worldPosition.z
    );
  };
  check(
    "the opposite ski slides back through the pole phase and returns",
    offset(1.1) - offset(0.5) > 0.19 &&
      Math.abs(offset(2.2) - offset(0.5)) < 0.02,
  );

  snowboard(performer, check, (board: HumanPerformance): void =>
    collectTakeClean(`${key} snowboard`, board, failures),
  );
  TestValidator.equals("snow support observations", findings, []);
}

/** Mount both feet on the real board bindings and ride a reciprocal bank. */
function snowboard(
  performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number],
  check: (label: string, valid: boolean) => void,
  verdicts: (take: HumanPerformance) => void,
): void {
  const board: ReturnType<typeof createSnowboard> = createSnowboard({}, 8);
  const binding: number = board.affordance("frontBinding").frame.translation.y;
  const grade: IAutoMovieQuaternion = Quaternion.fromAxisAngle(X, 4);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(grade, Y);
  // The rider stands beside the bindings and steps onto them one foot at a
  // time, the board still, before it starts to run.
  const entered: number = 0.2;
  const stepOn: number = 0.6;
  const mounted: number = entered + 2 * stepOn;
  const frame = (time: number): IAutoMovieRigidTransform => {
    const share: number = Math.min(1, Math.max(0, (time - mounted) / 2.6));
    const travel: number = 2.2 * minimumJerk.share(share);
    const first: boolean = share <= 0.5;
    const phase: number = first ? 2 * share : 2 * share - 1;
    const bank: number = (first ? 12 : -12) * Math.sin(Math.PI * phase) ** 2;
    const roll: IAutoMovieQuaternion = Quaternion.fromAxisAngle(Z, bank);
    const edge: IAutoMovieVector3 = board.affordance(
      bank > 0 ? "rightEdge" : "leftEdge",
    ).frame.translation;
    const height: number = -Quaternion.rotateVector(roll, edge).y;
    return {
      position: Quaternion.rotateVector(grade, { x: 0, y: height, z: travel }),
      rotation: Quaternion.multiply(grade, roll),
    };
  };
  // The ball of each boot lands toward the middle of its binding pad.
  // Both points stay inside the actual 120 mm pads.
  const footInPad = (
    name: createSnowboard.Affordance,
    shift: number,
  ): IAutoMovieMotionHumanProp["points"][string] => ({
    point: Vector3.add(board.affordance(name).frame.translation, {
      x: 0,
      y: 0,
      z: shift,
    }),
    normal: Y,
  });
  // Where each sole stands on the deck before stepping onto its binding: the
  // performer's own quiet stance, in the still board's frame.
  const ready: IAutoMovieVector3 = { x: 0, y: binding, z: 0 };
  const neutral: ReturnType<typeof motionHumanStance> = motionHumanStance(
    performer.body,
    ready,
    90,
  );
  const standing = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanProp["points"][string] => {
    const foot: IAutoMovieResolvedBone = neutral.get(`${side}Foot`)!;
    const placed: IAutoMovieRigidTransform = frame(0);
    const sole: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(placed.rotation),
      Vector3.subtract(
        HumanFoot.point(performer.body, side, "sole", {
          ankle: foot.worldPosition,
          rotation: foot.worldRotation,
        }),
        placed.position,
      ),
    );
    return { point: { ...sole, y: binding }, normal: Y };
  };
  const prop: IAutoMovieMotionHumanProp = {
    subject: "board",
    frame: frame(0),
    motion: frame,
    points: {
      front: footInPad("frontBinding", 0.035),
      rear: footInPad("rearBinding", -0.035),
      leftStand: standing("left"),
      rightStand: standing("right"),
    },
  };
  const performed: HumanPerformance = new HumanPerformance({
    seed: "snowboard-edge",
    performers: [{ ...performer, at: { x: 0, y: binding, z: 0 }, yaw: 90 }],
    props: [prop],
    laws: [AutoMovieMotionHumanRide.HumanSurface.boardRide],
    composition: HumanChain.subject("snow")
      .support({
        // A bearing foot never slides onto its binding: the feet first bear
        // where the rider stands, then each steps onto its pad in turn.
        stances: [
          {
            seconds: entered,
            contacts: [
              {
                part: "leftFoot",
                kind: "bear",
                target: { kind: "prop", subject: "board", point: "leftStand" },
              },
              {
                part: "rightFoot",
                kind: "bear",
                target: {
                  kind: "prop",
                  subject: "board",
                  point: "rightStand",
                },
              },
            ],
          },
          {
            seconds: stepOn,
            prefer: CROUCH,
            contacts: [
              {
                part: "leftFoot",
                kind: "bear",
                target: {
                  kind: "prop",
                  subject: "board",
                  point: "front",
                },
              },
              {
                part: "rightFoot",
                kind: "bear",
                target: {
                  kind: "prop",
                  subject: "board",
                  point: "rightStand",
                },
              },
            ],
          },
          {
            seconds: stepOn,
            prefer: CROUCH,
            contacts: [
              {
                part: "leftFoot",
                kind: "bear",
                target: {
                  kind: "prop",
                  subject: "board",
                  point: "front",
                },
              },
              {
                part: "rightFoot",
                kind: "bear",
                target: {
                  kind: "prop",
                  subject: "board",
                  point: "rear",
                },
              },
            ],
          },
        ],
      })
      .registered("boardRide", { on: "board", duration: 2.6 }).node,
  });
  verdicts(performed);
  const start: number = performed.segments("snow")[1]!.start;
  const read = (at: number): ReturnType<HumanPerformance["bones"]> =>
    performed.bones("snow", at);
  const inBoard = (at: number, p: IAutoMovieVector3): IAutoMovieVector3 => {
    const placed: IAutoMovieRigidTransform = frame(at);
    return Quaternion.rotateVector(
      Quaternion.inverse(placed.rotation),
      Vector3.subtract(p, placed.position),
    );
  };
  const times: readonly (readonly [number, createSnowboard.Affordance])[] = [
    [start + 0.65, "rightEdge"],
    [start + 1.95, "leftEdge"],
    [start + 2.6, "leftEdge"],
  ];
  for (const [at, edge] of times) {
    const placement: IAutoMovieRigidTransform = frame(at);
    const edgePoint: IAutoMovieVector3 = Vector3.add(
      placement.position,
      Quaternion.rotateVector(
        placement.rotation,
        board.affordance(edge).frame.translation,
      ),
    );
    const bones: ReturnType<HumanPerformance["bones"]> = read(at);
    check(
      `the snowboard's selected ${edge} stays on the snow at ${at} s`,
      Math.abs(Vector3.dot(normal, edgePoint)) < 0.001,
    );
    for (const side of ["left", "right"] as const) {
      const id: AutoMovieHumanoidBone = `${side}Foot`;
      const position: IAutoMovieVector3 = inBoard(
        at,
        bones.get(id)!.worldPosition,
      );
      check(
        `the ${side} snowboard foot stays deck-local at ${at} s`,
        vclose(
          position,
          inBoard(start, read(start).get(id)!.worldPosition),
          0.012,
        ),
      );
    }
  }
  const end: number = start + 2.6;
  check(
    "the snowboarder reaches stillness at the end of the banked ride",
    Vector3.distance(
      read(end - 0.02).get("hips")!.worldPosition,
      read(end).get("hips")!.worldPosition,
    ) < 0.013,
  );
}

/** The snowboarder's ready crouch on the deck: knees and hips bent, the trunk a little forward. */
const CROUCH: IAutoMovieMotionHumanSupport.IStance["prefer"] = {
  pitch: 6,
  roll: 0,
  joints: {
    leftUpperLeg: [20, 0, 0],
    rightUpperLeg: [20, 0, 0],
    leftLowerLeg: [30, 0, 0],
    rightLowerLeg: [30, 0, 0],
  },
};

/** Locate the physical contact in the displayed skeletal frame. */
function point(
  foot: IAutoMovieResolvedBone,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    foot.worldPosition,
    Quaternion.rotateVector(foot.worldRotation, local),
  );
}
