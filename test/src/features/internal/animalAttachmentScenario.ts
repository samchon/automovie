import type {
  AutoMovieArchetype,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRide,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalAttachmentObserver as observe } from "./animalAttachmentObserver";
import { nclose } from "./nclose";

/**
 * Exercise one successful real ride through attachment, solid contact and
 * replay.
 *
 * @param animal Actual source model, captured before the ride is prepared.
 * @param prepare The public ride call; refusal is a failed positive scenario.
 * @param clock Independent period and fore/hind support durations in seconds.
 * @param label Complete producer/cohort/gait/lead identity.
 * @param findings Whole-round failure collector shared by the scenario owner.
 * @param handContacts Explicit trunk-carried hand origins whose actual rods
 *   span to the moving head.
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual source ownership, independent clocks, exact event and microsecond-neighbor samples, geometric precision, solid support and unordered/alias replay; positive refusals are never counted as success.
 * @evidence contracts/development/implementation.md#principled-implementation Samples exact touchdown/liftoff and both sides, independent off-grid stance/swing times and film endpoints. The independent observer checks actual attachments/solids; stance footprints hold world X/Z and actual soles touch the floor. Query-order and returned-record mutation are relational ownership checks rather than physical-motion oracles.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Capture source, prepare one actual ride, form bounded event neighborhoods, observe all geometry/contact concerns, inspect support windows and replay in reverse order after mutating one returned sample.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not drop unsupported positive cases, substitute a static pose, loosen a refusal into success, replace a foreign method or infer expected clocks from the selected implementation table.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four selected touchdown windows contribute a bounded number of requested times; each actual pose and observer costs O(P+A), and serialization stores only those bounded results. No wall-clock performance assertion or frame sweep is used.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One prepared ride and the same observed time map serve geometry, contact and replay checks; expected period/support values are supplied independently by the test scenario.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All models, maps and returned samples are scenario-local; only caller-owned diagnostic strings escape, without a process, renderer, cache or global state.
 */
export function animalAttachmentScenario<Id extends string, D extends string>(
  animal: AutoMovieArchetype<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
  prepare: () => AutoMovieArchetypeRide.IRide<
    Id,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  >,
  clock: animalAttachmentScenario.IClock,
  label: string,
  findings: string[],
  handContacts: readonly string[] = [],
): void {
  try {
    const source: string = JSON.stringify(animal);
    const ride: AutoMovieArchetypeRide.IRide<
      Id,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    > = prepare();
    const epsilon: number = 1e-6;
    const times: Set<number> = new Set([
      0,
      ride.duration,
      0.137,
      ride.duration - 0.137,
    ]);
    const windows: {
      limb: AutoMovieArchetypeQuadrupedBody.Limb;
      touch: number;
      lift: number;
      early: number;
      late: number;
      swing: number;
    }[] = [];
    for (const limb of [
      "leftFore",
      "rightFore",
      "leftHind",
      "rightHind",
    ] as const) {
      const on: readonly { seconds: number; label: string }[] =
        ride.instants.filter(
          (instant: { seconds: number; label: string }): boolean =>
            instant.label === `${limb}On` &&
            instant.seconds > clock.period &&
            instant.seconds < ride.duration - epsilon,
        );
      truth(`${limb} has a complete actual stride`, on.length >= 2);
      if (on.length < 2) continue;
      near(
        `${limb} independent actual period`,
        on[1]!.seconds - on[0]!.seconds,
        clock.period,
        1e-9,
      );
      const touch: number = on[0]!.seconds;
      const support: number = limb.endsWith("Fore")
        ? clock.foreStance
        : clock.hindStance;
      const lift: number = touch + support;
      const early: number = touch + 0.317 * support;
      const late: number = touch + 0.733 * support;
      const swing: number = lift + (clock.period - support) / 2;
      truth(
        `${limb} complete inspected support/swing`,
        touch + clock.period < ride.duration - epsilon,
      );
      windows.push({ limb, touch, lift, early, late, swing });
      for (const event of [touch, lift])
        for (const shift of [-epsilon, 0, epsilon]) times.add(event + shift);
      times.add(early);
      times.add(late);
      times.add(swing);
    }
    const observed: Map<
      number,
      ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Limb, observe.IFoot>
    > = new Map();
    const snapshots: Map<number, string> = new Map();
    let headMoved: boolean = false;
    const sourceHead: IAutoMovieModelPart = animal.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "head",
    )!;
    const ordered: number[] = [...times].sort(
      (a: number, b: number): number => a - b,
    );
    for (const time of ordered) {
      const sample: ReturnType<typeof ride.at> = ride.at(time);
      const feet: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Limb,
        observe.IFoot
      > = observe(animal, sample, `${label}@${time}`, findings, handContacts);
      observed.set(time, feet);
      snapshots.set(time, JSON.stringify(sample));
      for (const [limb, foot] of feet)
        truth(
          `${time}/${limb} whole solid clears floor (${foot.soleY})`,
          foot.soleY >= -1e-9,
        );
      for (const contact of animal.affordances) {
        if (contact.id !== "lead") continue;
        const actual: IAutoMovieTransform = ride.frame(contact.id as Id, time);
        const held: IAutoMovieTransform = sample.archetype.affordances.find(
          (posed: { id: string }): boolean => posed.id === contact.id,
        )!.frame;
        const expected: IAutoMovieTransform["translation"] = AutoMovieEngineVector3.add(
          sample.placement.translation,
          AutoMovieEngineQuaternion.rotateVector(sample.placement.rotation, held.translation),
        );
        near(
          `${time} public lead frame meets actual physical held run`,
          AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(actual.translation, expected)),
          0,
          1e-9,
        );
      }
      const head: IAutoMovieModelPart = sample.archetype.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === "head",
      )!;
      const a: IAutoMovieTransform["rotation"] = sourceHead.transform!.rotation;
      const b: IAutoMovieTransform["rotation"] = head.transform!.rotation;
      headMoved ||=
        Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w) < 1 - 1e-8;
    }
    for (const window of windows) {
      const a: observe.IFoot = foot(window.early, window.limb);
      const b: observe.IFoot = foot(window.late, window.limb);
      for (const time of [
        window.touch,
        window.touch + epsilon,
        window.early,
        window.late,
        window.lift - epsilon,
        window.lift,
      ])
        near(
          `${time}/${window.limb} actual sole supports`,
          foot(time, window.limb).soleY,
          0,
          1e-9,
        );
      near(`${window.limb} planted world X`, a.point.x, b.point.x, 1e-3);
      near(`${window.limb} planted world Z`, a.point.z, b.point.z, 1e-3);
      const swing: observe.IFoot = foot(window.swing, window.limb);
      truth(
        `${window.limb} actual solid lifts during swing`,
        swing.soleY > 1e-5,
      );
      for (const event of [window.touch, window.lift]) {
        const before: observe.IFoot = foot(event - epsilon, window.limb);
        const after: observe.IFoot = foot(event + epsilon, window.limb);
        truth(
          `${window.limb} continuous across ${event}`,
          Math.hypot(
            after.point.x - before.point.x,
            after.point.y - before.point.y,
            after.point.z - before.point.z,
          ) < 1e-3,
        );
      }
    }
    if (clock.headMustMove === true)
      truth("authored nonzero nod moves actual head", headMoved);

    // Reversed seeking observes ownership, independently of physical expectations.
    for (const time of [...ordered].reverse())
      truth(
        `unordered seek ${time}`,
        JSON.stringify(ride.at(time)) === snapshots.get(time),
      );
    const time: number = ordered[Math.floor(ordered.length / 2)]!;
    const mutable: ReturnType<typeof ride.at> = ride.at(time);
    const part: IAutoMovieModelPart = mutable.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === "trunk",
    )!;
    part.transform!.translation.x += 100;
    part.transform!.rotation.z += 0.3;
    part.transform!.scale.y += 0.5;
    mutable.placement.translation.y += 200;
    if (mutable.archetype.affordances[0] !== undefined)
      mutable.archetype.affordances[0].frame.translation.x += 300;
    truth(
      "returned-record mutation cannot rewrite replay",
      JSON.stringify(ride.at(time)) === snapshots.get(time),
    );
    truth(
      "preparation, queries and output mutation preserve source bytes",
      JSON.stringify(animal) === source,
    );

    /** All inspected support times were explicitly requested above. */
    function foot(
      at: number,
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): observe.IFoot {
      const value: observe.IFoot | undefined = observed.get(at)?.get(limb);
      if (value === undefined)
        throw new Error(`Missing independent observation ${at}/${limb}`);
      return value;
    }

    /** Project numeric assertions retain the independent nclose comparison. */
    function near(
      id: string,
      actual: number,
      expected: number,
      tolerance: number,
    ): void {
      truth(
        `${id}: ${actual}, expected ${expected}`,
        nclose(actual, expected, tolerance),
      );
    }

    /**
     * Gather every geometry concern instead of stopping at the first detached
     * limb.
     */
    function truth(id: string, condition: boolean): void {
      try {
        TestValidator.predicate(`${label}: ${id}`, condition);
      } catch (error) {
        findings.push(String(error));
      }
    }
  } catch (error) {
    findings.push(
      `${label}: required positive ride/observation failed: ${String(error)}`,
    );
  }
}

/**
 * Independent public-source clocks and an explicit authored nod observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members state seconds, complete-stride versus fore/hind contact duration, and the positive actual-head motion required only by authored nod scenarios.
 * @evidence contracts/development/design.md#principled-representation Three independent scalar durations describe the constant-speed test cases; no gait-selection output or producer proportion supplies these expectations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only inputs consumed by this scenario helper are represented; actual animals, rides, contacts and limb names retain their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No expected pose, unsupported-success flag, physiological bound or wall-clock budget is encoded.
 */
export namespace animalAttachmentScenario {
  /**
   * Literal source contact durations or explicitly authored clocks, all
   * seconds.
   */
  export interface IClock {
    /** One complete stride. */
    period: number;
    /** Fore-foot stance duration within that stride. */
    foreStance: number;
    /** Hind-foot stance duration within that stride. */
    hindStance: number;
    /** A declared authored nod must produce actual head rotation when true. */
    headMustMove?: boolean;
  }
}
