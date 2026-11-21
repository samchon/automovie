import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFloatBeside,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFloatBeside,
  HumanFrame,
  HumanLeadHorse,
  HumanMounted,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { equineFordRider } from "../internal/equineFordRider";
import { equineFordScene } from "../internal/equineFordScene";
import { equineLeadOut } from "../internal/equineLeadOut";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** How far a foot lifted out of its stirrup has left it: the ankle joint more than this from the stirrup's tread, metres, an authored bound beyond an ankle's height over a tread it stands on. */
const STIRRUP: number = 0.15;

/** The rider's head region kept over the water: the head bone's centre at least this far above it, metres, an authored margin for the jaw below the head joint. */
const HEAD: number = 0.12;

/** Seconds the slide off the saddle into the float takes. */
const SLIDE: number = 1.2;

/** The floating rider's trunk and leg bones, which must stay outside the horse's barrel; the near arm reaches in to the mane. */
const TRAILING: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftFoot",
  "rightFoot",
];

/**
 * A rider crosses a ford and a swimming crossing on a horse, seated or floating beside it, and leads it out on the far bank.
 *
 * Scenarios:
 * 1. Seated: while wading and climbing, the rider's seat socket stays within 10 mm of the saddle's seat, the left wrist holds the mane (within 0.7 hand lengths of it, slipping less than 10 mm, the vault spec's handle criterion) and the right palm stays within 10 mm of its rein's skin. While the horse swims, the seat and both holds stay, each ankle is more than 0.15 m from its stirrup's tread, and the head bone's centre is at least 0.12 m above the water. The figures change on the crossing's float and land seconds.
 * 2. Lead-out: at the halt on the dry top of the far bank the rider dismounts with the rise, walks to the horse's head and leads it out 6 m; through the lead's held interval the right palm stays within 10 mm of the lead rope's skin.
 * 3. Floating: at the float the rider slides off to the upstream right side: the hips start over the saddle and end outside the barrel's half width (its girth over 2π) on the horse's right. Afloat, the left palm stays on the mane (its centre within 10 mm of the mane's skin), the mouth region above the water, the trunk and legs outside the barrel on the right, and the knees alternate above each other, a flutter kick.
 * 4. A float on a blocked side is refused on `side`; a float whose water lies 1.5 m below the swimming horse's, leaving the mane above the arm's reach from the surface, is refused on `hold`.
 * 5. Both takes pass the shipped take verdicts: no tangle, jump, turn, reversal, skate, floor or unloaded fault.
 * The far bank's unreachable shelf is refused by the crossing itself, pinned by test_archetype_equine_ford.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted, rise, walk, lead and float laws on the public crossing and reads the displayed seat, palms, head, trunk and legs against the horse's moving saddle, mane, reins, lead, stirrups, barrel and the authored water; a rider left behind at a cut, a hand off its hold, a submerged head, a body inside the horse or an admitted blocked side fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; contacts are the horse's own affordances on the posed horse; the barrel is the horse's declared girth; the water is the scene's authored height.
 * @evidence contracts/development/testing.md#distinguishing-cases Seated and floating crossings, the lead-out, and two refusals beside the admitted float; the horse's own crossing belongs to test_archetype_equine_ford.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_ford_rider(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const issues: string[] = [];
  const attempt = (label: string, run: () => void): void => {
    try {
      run();
    } catch (error) {
      issues.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  attempt("seated", (): void => seated(body, issues));
  attempt("floating", (): void => floating(body, issues));
  TestValidator.equals(
    "the rider crosses seated or floating with the head out of the water and leads the horse out",
    issues,
    [],
  );
}

/** The rider beside the standing horse's saddle. */
function performer(
  staged: equineFordRider.IStage,
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPerformer {
  return {
    subject: "rider",
    body,
    at: HumanFrame.point(
      { origin: { ...staged.seat.at, y: 0 }, yaw: staged.seat.yaw },
      { x: 0.6, y: 0, z: -0.2 },
    ),
    yaw: staged.seat.yaw,
    proficiency: { level: "trained" },
  };
}

/** The take on the stage. */
function perform(
  staged: equineFordRider.IStage,
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed: "equine-ford-rider",
    props: [staged.prop],
    laws: [HumanRide.ride, HumanMounted, HumanLeadHorse, HumanFloatBeside],
    performers: [performer(staged, body)],
    composition: chain.node,
  });
}

/** The horse's declaration of a contact. */
function affordance(
  staged: equineFordRider.IStage,
  id: string,
): IAutoMovieAffordance {
  return staged.horse.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  )!;
}

/** A displayed point in the horse's frame at a film second. */
function horseLocal(
  staged: equineFordRider.IStage,
  point: IAutoMovieVector3,
  at: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieRigidTransform = staged.place(at);
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}

/** Scenarios 1, 2 and 5 for the seated crossing and the lead-out. */
function seated(body: IAutoMovieMotionHumanBody, issues: string[]): void {
  const rehearsed: equineFordRider.IStage = equineFordRider.stage();
  const { float, land, halt } = rehearsed;
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    equineFordRider.wading(rehearsed),
    {
      seat: "entered",
      transfer: 0.6,
      seconds: land - float - 0.6,
      supports: equineFordRider.SWIMMING,
    },
    {
      seat: "entered",
      transfer: 0.6,
      seconds: halt - land - 0.6,
      supports: equineFordRider.WADING,
    },
  ];
  const rope: IAutoMovieVector3 = rehearsed.part("lead", halt).translation;
  const stand: equineLeadOut.IStanding = equineLeadOut.standing(body, rope.y);
  const approach: IAutoMovieVector3 = {
    x: rope.x + stand.lateral,
    y: 0,
    z: rope.z + stand.forward,
  };
  const chain = (staged: equineFordRider.IStage): IAutoMovieMotionHumanChain =>
    equineFordRider
      .mount(staged, figures)
      .rise({})
      .walk({ to: approach, face: 0 })
      .walk({ to: { ...approach, z: approach.z + equineLeadOut.LENGTH } });
  const rehearsal: HumanPerformance = perform(
    rehearsed,
    body,
    chain(rehearsed),
  );
  const walking: IAutoMovieMotionHumanSegment = rehearsal
    .segments("rider")
    .at(-1)!;
  const span: number = walking.end - walking.start;
  const staged: equineFordRider.IStage = equineFordRider.stage(
    equineLeadOut.led(rehearsed, rehearsal, walking),
  );
  const film: HumanPerformance = perform(
    staged,
    body,
    chain(staged).over(
      (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        hand.registered("leadHorse", {
          on: "horse",
          side: "right",
          seconds: 0.79 * span,
          transition: 0.1 * span,
        }),
    ),
  );

  // 1. Seated through the crossing.
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  let grasped: IAutoMovieVector3 | undefined;
  const instants: readonly [number, string][] = [
    [float - 1.5, "wading"],
    [(float + land) / 2, "swimming"],
    [land - 1.2, "swimming"],
    [land + 2.5, "climbing"],
    [(land + halt) / 2, "climbing"],
  ];
  for (const [at, phase] of instants) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", at);
    const saddle: IAutoMovieTransform = staged.part("seat", at);
    const seat: number = Math.abs(
      Quaternion.rotateVector(
        Quaternion.inverse(saddle.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", at),
          saddle.translation,
        ),
      ).y,
    );
    if (!(seat <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: seat ${(seat * 1000).toFixed(1)} mm from the saddle`,
      );
    // The mane is held as the vault spec holds a handle: the wrist within 0.7 hand lengths of it, not slipping.
    const mane: IAutoMovieTransform = staged.part("mane", at);
    const wrist: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(mane.rotation),
      Vector3.subtract(
        bones.get("leftHand")!.worldPosition,
        mane.translation,
      ),
    );
    grasped ??= wrist;
    const slip: number =
      Vector3.length(wrist) > 0.7 * body.measure.hand
        ? Infinity
        : Vector3.distance(wrist, grasped);
    if (!(slip <= TOLERANCE))
      issues.push(`${phase} ${at.toFixed(2)}: left hand ${slip} m off the mane`);
    const held: number = equineFordRider.rein(
      body,
      bones,
      "right",
      staged.part("rightRein", at),
      affordance(staged, "rightRein"),
    );
    if (!(held <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: right palm ${(held * 1000).toFixed(1)} mm from rightRein`,
      );
    if (phase === "swimming") {
      for (const side of ["left", "right"] as const) {
        const foot: number = Vector3.distance(
          bones.get(`${side}Foot`)!.worldPosition,
          staged.part(`${side}Stirrup`, at).translation,
        );
        if (!(foot > STIRRUP))
          issues.push(
            `${phase} ${at.toFixed(2)}: the ${side} foot stays ${foot} m from its stirrup`,
          );
      }
      const head: number =
        bones.get("head")!.worldPosition.y - equineFordScene.WATER;
      if (!(head >= HEAD))
        issues.push(
          `${phase} ${at.toFixed(2)}: head only ${head} m above the water`,
        );
    }
  }

  // 2. The lead held through its interval.
  const lead: IAutoMovieMotionHumanSegment = film.overlays("rider")[0]!;
  const window: IAutoMovieMotionHumanContactWindow =
    lead.plan.contacts.find(
      (contact: IAutoMovieMotionHumanContactWindow): boolean =>
        contact.part === "rightHand",
    )!;
  const duration: number = lead.end - lead.start;
  for (let i: number = 0; i <= 12; i++) {
    const at: number =
      lead.start +
      duration * (window.from + ((window.to - window.from) * i) / 12);
    const miss: number = equineFordRider.rein(
      body,
      film.bones("rider", at),
      "right",
      staged.part("lead", at),
      affordance(staged, "lead"),
    );
    if (!(miss <= TOLERANCE))
      issues.push(
        `lead ${at.toFixed(2)}: right palm ${(miss * 1000).toFixed(1)} mm from the lead`,
      );
  }

  // 5. The take's verdicts.
  assertTakeClean("the seated crossing and lead-out", film);
}

/** Scenarios 3, 4 and 5 for the floating crossing. */
function floating(body: IAutoMovieMotionHumanBody, issues: string[]): void {
  const staged: equineFordRider.IStage = equineFordRider.stage();
  const { float, land } = staged;
  const take = (
    change: Partial<IAutoMovieMotionHumanFloatBeside>,
  ): HumanPerformance =>
    perform(
      staged,
      body,
      equineFordRider
        .mount(staged, [equineFordRider.wading(staged)])
        .registered("floatBeside", {
          on: "horse",
          side: "right",
          hold: "mane",
          water: { surface: equineFordScene.WATER },
          blocked: ["left"],
          seconds: land - float,
          transition: SLIDE,
          ...change,
        } satisfies IAutoMovieMotionHumanFloatBeside),
    );
  const film: HumanPerformance = take({});
  const barrel: number = staged.horse.dimensions.girth! / (2 * Math.PI);
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  const hips = (at: number): number =>
    horseLocal(staged, film.bones("rider", at).get("hips")!.worldPosition, at)
      .x;

  // 3. The slide off to the right, then the float.
  if (!(Math.abs(hips(float)) < barrel))
    issues.push(`slide ${float.toFixed(2)}: the hips start ${hips(float)} m off the saddle`);
  if (!(hips(float + SLIDE) < -barrel))
    issues.push(
      `slide ${(float + SLIDE).toFixed(2)}: the hips end ${hips(float + SLIDE)} m across, inside the barrel's ${barrel} m`,
    );
  const kicks: number[] = [];
  for (const at of [
    float + SLIDE + 0.5,
    (float + land) / 2,
    land - 0.3,
  ]) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", at);
    const miss: number = equineFordRider.bar(
      body,
      bones,
      "left",
      staged.part("mane", at),
      affordance(staged, "mane"),
    );
    if (!(miss <= TOLERANCE))
      issues.push(
        `float ${at.toFixed(2)}: left palm ${(miss * 1000).toFixed(1)} mm from the mane`,
      );
    const mouth: number =
      HumanSignature.region(reader, "mouth", at).y - equineFordScene.WATER;
    if (!(mouth > 0))
      issues.push(`float ${at.toFixed(2)}: mouth ${mouth} m under the water`);
    for (const bone of TRAILING) {
      const across: number = horseLocal(
        staged,
        bones.get(bone)!.worldPosition,
        at,
      ).x;
      if (!(across < -barrel))
        issues.push(
          `float ${at.toFixed(2)}: ${bone} ${across} m across, inside the barrel's ${barrel} m`,
        );
    }
  }
  for (let i: number = 0; i < 8; i++) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", float + SLIDE + 1 + 0.2 * i);
    kicks.push(
      bones.get("leftLowerLeg")!.worldPosition.y -
        bones.get("rightLowerLeg")!.worldPosition.y,
    );
  }
  if (!(kicks.some((d: number): boolean => d > 0) && kicks.some((d: number): boolean => d < 0)))
    issues.push(`float: the knees never alternate (${kicks.join(", ")})`);

  // 4. Refusals.
  const refuses = (
    label: string,
    axis: string,
    change: Partial<IAutoMovieMotionHumanFloatBeside>,
  ): void => {
    let refusal: unknown = null;
    try {
      take(change).bones("rider", float + SLIDE + 0.5);
    } catch (error) {
      refusal = error;
    }
    if (!(refusal instanceof HumanRefusal && refusal.axis === axis))
      issues.push(`${label} must refuse on ${axis}; got ${String(refusal)}`);
  };
  refuses("a float on the blocked left", "side", {
    side: "left",
    blocked: ["left"],
  });
  refuses("a float 1.5 m under the horse's water", "hold", {
    water: { surface: equineFordScene.WATER - 1.5 },
  });

  // 5. The take's verdicts.
  assertTakeClean("the floating crossing", film);
}
