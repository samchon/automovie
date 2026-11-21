import {
  ArchetypeFrame,
  EquineFord,
  type EquineFordPlan,
  type QuadrupedFooting,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSeated,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanHand,
  HumanMounted,
  HumanObject,
  HumanPerformance,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { equineFordScene } from "../internal/equineFordScene";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 4;

/** Seconds of the ordinary ride that settles the seat in the saddle before the mounted figures, as the mounted specs stage it. */
const SETTLE: number = 3;

/** The level near bank the rider mounts on, metres along +Z before the ford descends. */
const BANK: number = 3;

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** How far a foot lifted out of its stirrup has left it: the ankle joint more than this from the stirrup's tread, metres, an authored bound beyond an ankle's height over a tread it stands on. */
const STIRRUP: number = 0.15;

/** The rider's head region kept over the water: the head bone's centre at least this far above it, metres, an authored margin for the jaw below the head joint. */
const HEAD: number = 0.12;

/**
 * A rider stays on a horse through a ford and a swimming crossing: seated in the stirrups while wading, the left hand on the mane and the right on its rein throughout, the feet out of the stirrups while the horse swims, then back in the stirrups on the far bank.
 *
 * Scenarios:
 * 1. While wading and climbing, the rider's seat socket stays within 10 mm of the saddle's seat and the left wrist within 0.7 hand lengths of the mane and slipping less than 10 mm against it (the vault spec's handle criterion) and the right within 10 mm of its rein's skin.
 * 2. While the horse swims, the seat stays within 10 mm of the saddle, the left wrist keeps its hold on the mane and the right palm stays on its rein, each ankle is more than 0.15 m from its stirrup's tread, and the head bone's centre at least 0.12 m above the water plane read from the crossing's own water height.
 * 3. The rider is carried through the crossing's two cuts on one clock: the mounted figures change at the crossing's float and land seconds.
 * The rider mounts on a level bank before the ford descends; sitting onto a saddle already pitched on the grade leaves the seat 25 mm off it, a sit-law matter left to its owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law on the public crossing and reads the displayed seat, palms and head against the horse's moving saddle, mane, rein, stirrups and the authored water; a rider left behind at a cut, a hand off its hold or a submerged head fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; contacts are the saddle's own affordances on the posed horse; the water is the scene's authored height.
 * @evidence contracts/development/testing.md#distinguishing-cases Wading, swimming and climbing figures on one clock; the horse's own crossing belongs to test_archetype_equine_ford.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_ford_rider(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
    8,
  );
  const level: number =
    equineFordScene.WATER - equineFordScene.IMMERSION - 0.95 * 1.65;
  const authored: EquineFordPlan.IParams = equineFordScene.params(level - 0.05);
  // The rider mounts on a level bank before the ford descends at 0.08.
  const crossing: EquineFordPlan.IClip<string, string> = EquineFord(horse, {
    ...authored,
    footing: {
      planes: authored.footing.planes.flatMap(
        (plane: QuadrupedFooting.IPlane): QuadrupedFooting.IPlane[] =>
          plane.id === "ford"
            ? [
                {
                  ...plane,
                  id: "bank",
                  z: [plane.z[0], BANK],
                  slope: { x: 0, z: 0 },
                },
                {
                  ...plane,
                  origin: { x: 0, y: 0, z: BANK },
                  z: [BANK, plane.z[1]],
                  slope: { x: 0, z: -0.08 },
                },
              ]
            : [plane],
      ),
    },
    entry: {
      ...authored.entry,
      legs: [
        { kind: "straight", length: BANK },
        {
          kind: "straight",
          length: equineFordScene.FLOAT_AT - BANK,
          rise: -0.08 * (equineFordScene.FLOAT_AT - BANK),
        },
      ],
    },
  });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const local = (at: number): number =>
    Math.max(0, Math.min(crossing.duration, at - WAIT));
  const place = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = crossing.sample(local(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform => {
    const sample: EquineFordPlan.ISample<string, string> = crossing.sample(
      local(at),
    );
    return ArchetypeFrame.compose(
      sample.placement,
      sample.archetype.affordance(id).frame,
    );
  };
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    crossing.sample(0).archetype,
    place(0),
  );
  const reins: IAutoMovieMotionHumanMounted.ISupports = {
    leftFoot: "leftStirrup",
    rightFoot: "rightStirrup",
    leftHand: "mane",
    rightHand: "rightRein",
  };
  const swimming: IAutoMovieMotionHumanMounted.ISupports = {
    leftHand: "mane",
    rightHand: "rightRein",
  };
  const sat: number = 0.5;
  const { float, land } = crossing.events;
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    {
      seat: "entered",
      transfer: 0.4,
      seconds: WAIT + float - sat - SETTLE - 0.4,
      supports: reins,
    },
    {
      seat: "entered",
      transfer: 0.6,
      seconds: land - float - 0.6,
      supports: swimming,
    },
    {
      seat: "entered",
      transfer: 0.6,
      seconds: crossing.duration - land - 0.6,
      supports: reins,
    },
  ];
  const issues: string[] = [];
  let film: HumanPerformance | undefined;
  try {
    film = new HumanPerformance({
      seed: "equine-ford-rider",
      props: [
        HumanObject.prop(
          "horse",
          crossing.sample(0).archetype,
          place(0),
          place,
          part,
        ),
      ],
      laws: [HumanRide.ride, HumanMounted],
      performers: [
        {
          subject: "rider",
          body,
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            { x: 0.6, y: 0, z: -0.2 },
          ),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("rider")
        .sit({ seat, seconds: sat })
        .registered("ride", {
          on: "horse",
          seconds: SETTLE,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "mane", right: "rightRein" },
        })
        .registered("mounted", { on: "horse", frame: "seat", figures }).node,
    });
  } catch (error) {
    issues.push(
      `rider: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (film !== undefined) {
    const affordance = (id: string): IAutoMovieAffordance =>
      horse.affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      )!;
    const palm = (
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      side: "left" | "right",
      id: string,
      at: number,
    ): number => {
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const actual: IAutoMovieVector3 = Vector3.add(
        hand.worldPosition,
        Quaternion.rotateVector(
          hand.worldRotation,
          HumanHand.offset(body, side, "palm").point,
        ),
      );
      const contact: IAutoMovieTransform = part(id, at);
      return Vector3.distance(
        actual,
        Vector3.addScaled(
          contact.translation,
          Quaternion.rotateVector(contact.rotation, { x: 0, y: 1, z: 0 }),
          (affordance(id).aperture ?? 0) / 2,
        ),
      );
    };
    let grasped: IAutoMovieVector3 | undefined;
    const grasp = (
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      at: number,
    ): number => {
      const frame: IAutoMovieTransform = part("mane", at);
      const wrist: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(
          bones.get("leftHand")!.worldPosition,
          frame.translation,
        ),
      );
      grasped ??= wrist;
      return Vector3.length(wrist) > 0.7 * body.measure.hand
        ? Infinity
        : Vector3.distance(wrist, grasped);
    };
    const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
      film,
      "rider",
      body,
      0,
    );
    const seatGap = (at: number): number => {
      const frame: IAutoMovieTransform = part("seat", at);
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", at),
          frame.translation,
        ),
      );
      return Math.abs(local.y);
    };
    const instants: readonly [number, string][] = [
      [WAIT + float - 1.5, "wading"],
      [WAIT + (float + land) / 2, "swimming"],
      [WAIT + land - 1.2, "swimming"],
      [WAIT + land + 2.5, "climbing"],
    ];
    for (const [at, phase] of instants) {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones("rider", at);
      const seated: number = seatGap(at);
      if (!(seated <= TOLERANCE))
        issues.push(
          `${phase} ${at.toFixed(2)}: seat ${(seated * 1000).toFixed(1)} mm from the saddle`,
        );
      for (const side of ["left", "right"] as const) {
        const held: string = side === "left" ? "mane" : "rightRein";
        // The mane is held as the vault spec holds a handle: the wrist within 0.7 hand lengths of it, not slipping.
        const hold: number =
          side === "left" ? grasp(bones, at) : palm(bones, side, held, at);
        if (!(hold <= TOLERANCE))
          issues.push(
            `${phase} ${at.toFixed(2)}: ${side} palm ${(hold * 1000).toFixed(1)} mm from ${held}`,
          );
        const foot: number = Vector3.distance(
          bones.get(`${side}Foot`)!.worldPosition,
          part(`${side}Stirrup`, at).translation,
        );
        if (phase === "swimming" && !(foot > STIRRUP))
          issues.push(
            `${phase} ${at.toFixed(2)}: the ${side} foot stays ${foot} m from its stirrup`,
          );
      }
      if (phase === "swimming") {
        const head: number =
          bones.get("head")!.worldPosition.y - equineFordScene.WATER;
        if (!(head >= HEAD))
          issues.push(
            `${phase} ${at.toFixed(2)}: head only ${head} m above the water`,
          );
      }
    }
  }
  TestValidator.equals(
    "the rider crosses the ford seated, holding on and with the head out of the water",
    issues,
    [],
  );
}
