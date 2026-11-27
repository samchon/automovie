import { AutoMovieEnginePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../../internal/PhysicalDisturbance";
import { PhysicalStepChoice as S } from "../../internal/PhysicalStepChoice";

/** Rounding of a shared displacement and of a least violation. */
const ROUNDING: number = 1e-9;

/** A chosen step. */
type Step = IAutoMoviePhysicalBalance.IResult["step"];

/**
 * Which limb `AutoMovieEnginePhysicalBalance.assess` steps, and how `retarget` keeps
 * a committed request: among capturing steps the one whose remaining supports
 * already hold the commanded centre of pressure (Pratt et al., M2V2, VII-A); a
 * diagonal pair when no capturing single step can be unloaded at once (Chen et
 * al. 2022, Section 2.1); past every capturing step the one leaving the capture
 * point least past its new support (Khadiv et al. 2017, III-B).
 *
 * Scenarios, a biped's feet and a four-support body's at (±0.25, ±0.35):
 *
 * 1. A four-support body steps a front foot, and after it lands the other front
 *    foot.
 * 2. With the commanded centre of pressure on the left foot the right steps, and
 *    the reverse.
 * 3. A right swing 0.1 s under way keeps its side however far left the capture
 *    point lies, and lands nearer than a fresh swing.
 * 4. Past every step's reach a front foot steps, not viable, though a rear foot's
 *    remaining supports hold the centre of pressure.
 * 5. `retarget`: an unloading request keeps its own limb, keeps nothing without
 *    one, and before unloading moves to the capturing step.
 * 6. Under a forward push bearing on the front edge the right front foot steps
 *    with the back left foot, both by one forward displacement; with the centre
 *    of pressure inside the three feet the left front foot leaves, it steps
 *    alone; a pair under way is planned again as that pair; past every
 *    capturing step the choice leaves the least violation, a pair exactly when
 *    the pair's is less.
 * 7. A pair's two steps are one landed swing phase; a step armed before the pair
 *    resolved overlaps it, one armed after does not; the divergence verdict
 *    reads a growing excursion, and leaves one or no landing to capture alone.
 */
export function test_engine_physics_physical_balance_step_choice(): void {
  const biped: IAutoMoviePhysicalSupportPatch[] = [
    S.foot("left", 0.05, 0.15, 0, 0.2),
    S.foot("right", -0.15, -0.05, 0, 0.2),
  ];
  const four: IAutoMoviePhysicalSupportPatch[] = [
    S.foot("frontLeft", 0.2, 0.3, 0.3, 0.4),
    S.foot("frontRight", -0.3, -0.2, 0.3, 0.4),
    S.foot("backLeft", 0.2, 0.3, -0.4, -0.3),
    S.foot("backRight", -0.3, -0.2, -0.4, -0.3),
  ];

  // 1. Front feet in turn.
  const ahead: IAutoMovieVector3 = { x: 0, y: 0, z: 0.45 };
  const first: Step = S.assess(four, ahead).step;
  const next: Step =
    first === undefined
      ? undefined
      : S.assess(four, ahead, { recent: first.bone }).step;
  TestValidator.predicate(
    "front feet in turn",
    first !== undefined &&
      first.bone.startsWith("front") &&
      next !== undefined &&
      next.bone.startsWith("front") &&
      next.bone !== first.bone,
  );

  // 2. The unloaded foot steps.
  const unloaded = (pressure: IAutoMovieVector3): string | undefined =>
    S.assess(biped, { x: 0.02, y: 0, z: 0.3 }, { pressure }).step?.bone;
  TestValidator.equals(
    "the unloaded foot",
    [unloaded({ x: 0.1, y: 0, z: 0.1 }), unloaded({ x: -0.1, y: 0, z: 0.1 })],
    ["right", "left"],
  );

  // 3. A swing under way.
  const inFlight = (elapsed: number, x: number): Step =>
    S.assess(
      biped,
      { x, y: 0, z: 0.3 },
      {
        unavailable: ["left"],
        swing: { ...S.SWING, ramp: 0, elapsed },
        force: true,
      },
    ).step;
  const kept: Step = inFlight(0.1, 0.3);
  const fresh: Step = inFlight(0, 0.02);
  const late: Step = inFlight(0.1, 0.02);
  TestValidator.predicate(
    "a swing under way",
    kept?.bone === "right" &&
      kept.target.x <= -0.1 + ROUNDING &&
      fresh !== undefined &&
      late !== undefined &&
      Math.hypot(late.target.x + 0.1, late.target.z - 0.1) <
        Math.hypot(fresh.target.x + 0.1, fresh.target.z - 0.1),
  );

  // 4. Past every reach.
  const beyond: Step = S.assess(
    four,
    { x: 0, y: 0, z: 3 },
    {
      pressure: { x: 0, y: 0, z: 0.38 },
    },
  ).step;
  TestValidator.predicate(
    "past every reach",
    beyond !== undefined &&
      beyond.viable === false &&
      beyond.bone.startsWith("front"),
  );

  // 5. retarget.
  const own: NonNullable<Step> = {
    bone: "front-right",
    target: { x: -0.4, y: 0, z: 0.8 },
    seconds: 0.3,
    viable: false,
  };
  const better: NonNullable<Step> = {
    bone: "front-left",
    target: { x: 0.4, y: 0, z: 0.8 },
    seconds: 0.3,
    viable: true,
  };
  TestValidator.equals(
    "retarget",
    [
      AutoMovieEnginePhysicalBalance.retarget({ unloading: true, own, best: better })
        ?.bone,
      AutoMovieEnginePhysicalBalance.retarget({ unloading: true, best: better }),
      AutoMovieEnginePhysicalBalance.retarget({ unloading: false, own, best: better })
        ?.bone,
    ],
    [own.bone, undefined, better.bone],
  );

  // 6. Pairs.
  const forward = (
    pressure: IAutoMovieVector3,
    extra: Partial<IAutoMoviePhysicalBalance.IAssessInput> = {},
  ): Step =>
    S.assess(four, { x: 0.02, y: 0, z: 0.42 }, { pressure, ...extra }).step;
  const moved = (
    bone: string,
    target: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const support = four.find((candidate) => candidate.bone === bone)!;
    return {
      x: target.x - support.position.x,
      y: 0,
      z: target.z - support.position.z,
    };
  };
  const paired: Step = forward({ x: 0, y: 0, z: 0.38 });
  const lead: IAutoMovieVector3 | undefined =
    paired === undefined ? undefined : moved(paired.bone, paired.target);
  const partner: IAutoMovieVector3 | undefined =
    paired?.pair === undefined
      ? undefined
      : moved(paired.pair.bone, paired.pair.target);
  const single: Step = forward({ x: -0.1, y: 0, z: 0.1 });
  const flying: Step = forward(
    { x: -0.1, y: 0, z: 0.1 },
    {
      pair: ["frontLeft", "backRight"],
      unavailable: ["frontRight", "backLeft"],
      swing: { ...S.SWING, ramp: 0, elapsed: 0.1 },
      force: true,
    },
  );
  TestValidator.predicate(
    "a diagonal pair",
    paired?.bone === "frontRight" &&
      paired.pair?.bone === "backLeft" &&
      paired.viable === true &&
      lead !== undefined &&
      partner !== undefined &&
      Math.hypot(lead.x - partner.x, lead.z - partner.z) < ROUNDING &&
      lead.z > 0 &&
      single?.bone === "frontLeft" &&
      single.pair === undefined &&
      flying?.bone === "frontLeft" &&
      flying.pair?.bone === "backRight",
  );
  const hopeless = (
    extra: Partial<IAutoMoviePhysicalBalance.IAssessInput> = {},
  ): Step =>
    forward(
      { x: 0, y: 0, z: 0.38 },
      { center: { x: 0.02, y: S.HEIGHT, z: 1.2 }, ...extra },
    );
  const bones: string[] = four.map((support) => support.bone);
  const best: Step = bones
    .map(
      (bone: string): Step =>
        hopeless({ unavailable: bones.filter((other) => other !== bone) }),
    )
    .filter((step: Step): boolean => step !== undefined)
    .sort((a, b) => (a!.violation ?? Infinity) - (b!.violation ?? Infinity))[0];
  const diagonalOf: Record<string, string> = {
    frontLeft: "backRight",
    backRight: "frontLeft",
    frontRight: "backLeft",
    backLeft: "frontRight",
  };
  const pairedAlone: Step =
    best === undefined
      ? undefined
      : hopeless({ pair: [best.bone, diagonalOf[best.bone]!], force: true });
  const least: number = Math.min(
    best?.violation ?? Infinity,
    pairedAlone?.violation ?? Infinity,
  );
  const chosen: Step = hopeless();
  TestValidator.predicate(
    "the least violation",
    chosen !== undefined &&
      chosen.viable === false &&
      Math.abs((chosen.violation ?? Infinity) - least) < ROUNDING &&
      (pairedAlone?.violation ?? Infinity) < (best?.violation ?? Infinity) ===
        (chosen.pair !== undefined),
  );

  // 7. Swing phases and divergence.
  const swung = (
    bone: string,
    start: number,
    resolved?: number,
  ): IAutoMoviePhysicalRecoveryState["steps"][number] => ({
    bone,
    kind: "swing",
    start,
    end: start + 0.3,
    from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
    to: { point: [0, 0.3], yaw: 0, pitch: 0, clearance: 0 },
    ...(resolved === undefined
      ? {}
      : { resolved: { seconds: resolved, status: "landed" as const } }),
  });
  const pair = [swung("frontLeft", 1, 1.3), swung("backRight", 1, 1.35)];
  const early = [...pair, swung("frontRight", 1.32, 1.6)];
  TestValidator.equals(
    "swing phases and divergence",
    [
      PhysicalDisturbance.phases(pair).length,
      PhysicalDisturbance.landed(pair),
      PhysicalDisturbance.overlaps(pair).length,
      PhysicalDisturbance.overlaps(early).join(),
      PhysicalDisturbance.landed(early),
      PhysicalDisturbance.overlaps([...pair, swung("frontRight", 1.35, 1.6)])
        .length,
      PhysicalDisturbance.diverging([0.1, 0.2, 0.35]),
      PhysicalDisturbance.diverging([0.3, 0.1]),
      PhysicalDisturbance.diverging([0.2]),
      PhysicalDisturbance.diverging([]),
    ],
    [1, 1, 0, "1", 2, 0, true, false, true, true],
  );
}
