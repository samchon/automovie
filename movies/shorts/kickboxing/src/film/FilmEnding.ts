import * as THREE from "three";

import type { AudioMix } from "../audio/AudioMix";
import type { createInspectionRing } from "../createInspectionRing";
import type { LabActor } from "../motion-lab/LabActor";
import type { LabActualMotion } from "../motion-lab/LabActualMotion";
import type { MotionAction } from "../motion/core/MotionAction";
import { KnockdownMotion } from "../motion/down/KnockdownMotion";
import type { FilmFinish } from "./FilmFinish";
import { FilmPlan } from "./FilmPlan";
import { FilmReferee } from "./FilmReferee";
import { FilmRoute } from "./FilmRoute";
import { FilmVictory } from "./FilmVictory";
import { inspectFilmFloorContacts } from "./inspectFilmFloorContacts";

/**
 * Actual post-contact collapse, neutral-corner separation, count and celebration.
 * @evidence contracts/common.md#implementation-and-ownership Consumes FilmFinish's witnessed displayed head contact and actual receiving entry/rates. One down module owns B while the unchanged finishing action returns A's kick, then independent supported travel reaches the actual far neutral corner. The male official uses the same actual actor host and source clock.
 * @evidence contracts/common.md#authoring-interface Film seconds150..180 retain the original action-local impact event. The count and rule timing belong to this production; Human owns no bout policy. Native support, finite-rate and floor receipts remain inspectable; source construction alone is not moving-picture or decoded-film acceptance.
 */
export class FilmEnding {
  /** Actual retained post-KO placements consumed by the same runtime timeline. */
  public readonly clips: {
    id: string;
    start: number;
    end: number;
    evaluate: (seconds: number) => void;
    audioEvents?: () => FilmPlan.Event[];
  }[] = [];
  /** Actual selected most-distant neutral destination. */
  public readonly neutral: MotionAction.Vec3;
  /** Independently supported male official, also used before the knockout. */
  public readonly referee: FilmReferee;
  /** Separate elapsed preparation phases; no GPU or encoding cost is included. */
  public readonly costs: {
    downEntryMeasurementMs: number;
    downPreparationMs: number;
    floorInspectionMs: number;
  } = { downEntryMeasurementMs: 0, downPreparationMs: 0, floorInspectionMs: 0 };
  /** Current supported step-and-turn placement beneath the upper celebration. */
  private readonly victory: FilmVictory;
  /** One actual original-surface receiving performance. */
  private readonly down: KnockdownMotion;
  /** Fixed h/h2 actual entry measurements for both arms and one body. */
  private readonly downEntry: Record<
    MotionAction.Side,
    LabActualMotion.Measurement
  >;
  /** Only observed first regional mat arrivals can authorize fall sounds. */
  private readonly floorReceipts: AudioMix.FloorContact[];

  /** Prepare the ending once from the actual witnessed finishing case. */
  public constructor(
    finish: Pick<
      FilmFinish,
      "knockout" | "evaluate" | "evaluateRecovery" | "knockdownEntry"
    >,
    private readonly actors: Record<FilmPlan.ActorId, LabActor>,
    private readonly layout: createInspectionRing.Layout,
  ) {
    if (!finish.knockout) throw new Error("No actual finishing impact exists");
    const pair: Record<"a" | "b", LabActor> = { a: actors.a, b: actors.b };
    finish.evaluate(FilmPlan.koSeconds);
    const entryStarted: number = performance.now();
    const loser: LabActor = this.actors.b;
    this.downEntry = finish.knockdownEntry();
    const rates: Map<
      LabActualMotion.Measurement["rates"][number]["channel"],
      LabActualMotion.Measurement["rates"][number]
    > = new Map(
      [...this.downEntry.left.rates, ...this.downEntry.right.rates].map(
        (
          rate: LabActualMotion.Measurement["rates"][number],
        ): [
          LabActualMotion.Measurement["rates"][number]["channel"],
          LabActualMotion.Measurement["rates"][number],
        ] => [rate.channel, rate],
      ),
    );
    for (const rate of [
      ...this.downEntry.left.rates,
      ...this.downEntry.right.rates,
    ])
      if (rates.get(rate.channel)!.degreesPerSecond !== rate.degreesPerSecond)
        throw new Error(
          "The same canonical body channel has inconsistent actual entry rates",
        );
    this.costs.downEntryMeasurementMs = performance.now() - entryStarted;
    const downStarted: number = performance.now();
    this.down = new KnockdownMotion({
      actorId: loser.id,
      entry: loser.constrained(),
      impact: finish.knockout.event,
      side: "right",
      duration: 30,
      timing: {
        buckling: 0.18,
        descent: 0.92,
        settle: 0.5,
        attemptStart: 8,
        attemptDuration: 5,
      },
      entryRates: [...rates.values()].map(
        (
          rate: LabActualMotion.Measurement["rates"][number],
        ): NonNullable<KnockdownMotion.Config["entryRates"]>[number] => ({
          channel: rate.channel,
          degreesPerSecond: rate.degreesPerSecond,
        }),
      ),
      context: {
        evaluatePose: loser.person.evaluate,
        points: loser.bodyPoints(),
        frame: { origin: loser.origin.toArray(), yawRadians: loser.yaw },
        floorY: this.layout.floorY,
      },
    });
    const down: KnockdownMotion = this.down;
    this.costs.downPreparationMs = performance.now() - downStarted;
    const falling: (seconds: number) => void = (seconds: number): void => {
      finish.evaluateRecovery(seconds);
      this.applyDown(down, seconds);
    };
    this.clips.push({
      id: "finishing-kick-return-and-collapse",
      start: 150,
      end: 151.8,
      evaluate: falling,
    });
    falling(151.8);
    this.actors.a.adopt();
    const fallen: MotionAction.Vec3 =
      this.actors.b.person.object.position.toArray();
    this.neutral = FilmEnding.farthestNeutral(this.layout, fallen);
    const destination: MotionAction.Vec3 = this.neutral;
    const winnerRoute: FilmRoute = new FilmRoute(
      this.actors.a,
      FilmRoute.displacement(this.actors.a, destination),
      5,
    );
    const winnerEntry: () => void = this.actors.a.checkpoint();
    this.clips.push({
      id: "neutral-corner-and-settled-loser",
      start: 151.8,
      end: 156.8,
      evaluate: (seconds: number): void => {
        winnerEntry();
        winnerRoute.evaluate(seconds - 151.8);
        this.applyDown(down, seconds);
      },
      audioEvents: (): FilmPlan.Event[] =>
        winnerRoute.audioEvents(151.8, "winner-neutral-corner"),
    });
    winnerRoute.evaluate(5);
    this.actors.a.adopt();
    const winnerHold: () => void = this.actors.a.checkpoint();
    const victoryBase: MotionAction.Sample = standing(this.actors.a, 156.8);
    winnerHold();
    this.holdWinner(victoryBase, FilmPlan.victory.start);
    this.applyDown(down, FilmPlan.victory.start);
    this.actors.a.adopt();
    this.victory = new FilmVictory(pair, layout, (seconds: number): void =>
      this.applyDown(down, seconds),
    );
    this.clips.push({
      id: "failed-ten-count-and-supported-celebration",
      start: 156.8,
      end: 180,
      evaluate: (seconds: number): void => {
        if (seconds >= FilmPlan.victory.start) this.victory.evaluate(seconds);
        else {
          winnerHold();
          this.holdWinner(victoryBase, seconds);
          this.applyDown(down, seconds);
        }
        if (
          seconds >= FilmPlan.countEnd &&
          (this.actors.b.person.point("hips")[1] > 0.65 ||
            this.actors.b.person.point("head")[1] > 1.05)
        )
          throw new Error(
            "The receiver is not visibly down when ten seconds expire",
          );
      },
      audioEvents: (): FilmPlan.Event[] => this.victory.audioEvents(),
    });
    this.referee = new FilmReferee(
      this.actors.referee,
      pair,
      destination,
      fallen,
    );
    const floorStarted: number = performance.now();
    this.floorReceipts = inspectFilmFloorContacts(
      this.actors.b,
      down,
      this.layout.floorY,
    );
    this.costs.floorInspectionMs = performance.now() - floorStarted;
  }
  /** Maintain actual corner restraint and centre attention until victory footwork starts. */
  private holdWinner(base: MotionAction.Sample, seconds: number): void {
    const sample: MotionAction.Sample = structuredClone(base);
    sample.elapsed = seconds;
    const toward: THREE.Vector3 = new THREE.Vector3(0, 1.1, 0)
      .sub(new THREE.Vector3(...this.actors.a.person.point("head")))
      .applyQuaternion(this.actors.a.person.object.quaternion.clone().invert());
    const yaw: number = Math.max(
      -35,
      Math.min(35, (Math.atan2(toward.z, toward.x) * 180) / Math.PI),
    );
    sample.pose.neck = {
      ...sample.pose.neck,
      atlantoAxial: { rotation: yaw * 0.7 },
    };
    sample.pose.head = {
      ...sample.pose.head,
      eyes: {
        left: { horizontal: yaw * 0.3 },
        right: { horizontal: yaw * 0.3 },
      },
    };
    this.actors.a.apply(sample);
    if (this.actors.a.support?.status !== "admitted")
      throw new Error("Winner neutral-corner support is unresolved", {
        cause: this.actors.a.inspect(),
      });
  }

  /** Apply the same observed-contact receiving module and require its actual whole-body support. */
  private applyDown(down: KnockdownMotion, seconds: number): void {
    this.actors.b.apply(down.sample(seconds - 150));
    if (this.actors.b.support?.status !== "admitted")
      throw new Error(
        "The articulated down track has unresolved actual support",
        { cause: this.actors.b.inspect() },
      );
  }

  /**
   * Select the genuinely farthest unassigned corner from the actual fallen root.
   * @evidence contracts/common.md#implementation-and-ownership Scans the same displayed ring's neutral holding points and maximizes horizontal squared distance from the actual fallen endpoint. No camera-side choice or hardcoded corner replaces that rule.
   * @evidence contracts/common.md#authoring-interface Input root and output destination are world metres. Ties retain descriptor order. The returned point still requires actual supported travel and complete-body clearance.
   */
  public static farthestNeutral(
    layout: createInspectionRing.Layout,
    fallen: MotionAction.Vec3,
  ): MotionAction.Vec3 {
    if (!fallen.every(Number.isFinite))
      throw new Error("A neutral corner requires a finite actual fallen root");
    const corners: createInspectionRing.Corner[] = layout.corners.filter(
      (corner: createInspectionRing.Corner): boolean =>
        corner.role === "neutral",
    );
    if (corners.length < 2)
      throw new Error("The actual ring has fewer than two neutral corners");
    const selected: createInspectionRing.Corner = corners.reduce(
      (
        best: createInspectionRing.Corner,
        corner: createInspectionRing.Corner,
      ): createInspectionRing.Corner =>
        Math.hypot(
          corner.holdingPoint[0] - fallen[0],
          corner.holdingPoint[2] - fallen[2],
        ) >
        Math.hypot(
          best.holdingPoint[0] - fallen[0],
          best.holdingPoint[2] - fallen[2],
        )
          ? corner
          : best,
    );
    return [...selected.holdingPoint];
  }

  /**
   * Read admitted actual regional floor arrivals for the same audio source run.
   * @evidence contracts/common.md#implementation-and-ownership Copies retained first hip/shoulder observations without another pose solve or planned timestamp replacement. Missing observed regions stay absent.
   * @evidence contracts/common.md#authoring-interface Seconds are absolute and the finite60Hz/native-contact tolerance remains in provenance. These receipts measure neither force nor listening acceptance.
   */
  public floorContacts(): AudioMix.FloorContact[] {
    return structuredClone(this.floorReceipts);
  }

  /**
   * Read actual preparation and finite tangent evidence separately from display cost.
   * @evidence contracts/common.md#implementation-and-ownership Reports the retained down module's preparation, both h/h2 provenance records, actual world velocity and regional contacts. No extra solve is run for inspection.
   * @evidence contracts/common.md#authoring-interface Root angular continuity is explicitly uncertified; finite secants and floor observations do not prove instantaneous impulse or continuous collision behavior.
   */
  public inspect(): object {
    return {
      neutral: [...this.neutral],
      costs: { ...this.costs },
      downPreparation: this.down.preparation,
      entry: {
        left: this.downEntry.left.provenance,
        right: this.downEntry.right.provenance,
        worldVelocity: this.downEntry.left.velocity,
        rootAngularContinuity: "not-certified",
      },
      floorContacts: this.floorContacts(),
      victory: this.victory.inspect(),
    };
  }
}

/** Preserve the actual two-foot ending rather than inserting another neutral guard. */
function standing(actor: LabActor, seconds: number): MotionAction.Sample {
  return {
    pose: structuredClone(actor.basePose),
    rootOffset: [0, 0, 0],
    support: {
      left: 0.5,
      right: 0.5,
      patches: [
        structuredClone(actor.patches.left.low),
        structuredClone(actor.patches.right.low),
      ],
    },
    effectors: [],
    phase: "idle",
    elapsed: seconds,
    progress: 0,
  };
}
