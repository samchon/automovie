import type { FallingMasonry } from "../../entities/props/falling-masonry/FallingMasonry";
import { TrainingCourt } from "../../entities/sets/training-court/TrainingCourt";
import { ShieldTrack } from "../../interactions/duelling/ShieldTrack";
import { SpellTrack } from "../../interactions/duelling/SpellTrack";
import { MasonryTrack } from "../../interactions/physics/MasonryTrack";
import type { StageMount } from "../../interactions/staging/StageMount";
import { DuelEffects } from "./DuelEffects";

/**
 * The consequences a film hands to `StageMount.mount({ effects })`: for a
 * duel, every spell's streak and impact flash, every shield's surface and,
 * on the training court with a cap, the failing masonry with its clearance
 * audit as findings. A film without casts or a cap gets nothing drawn.
 *
 * ```ts
 * StageMount.mount({ set, students, props: [cap, ...], camera, composition, duration: 60, effects: StageEffects.duel({ cap, seed: "look-at-me-duel" }) });
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md#outcomes Streak outcomes from the table.
 * @evidence docs/research/physics/falling-masonry.md#clearance The audit as findings.
 * @evidence contracts/development/behaviors.md#relational-goals Consequences follow computed outcomes only.
 * @evidence contracts/development/common.md#meaningful-documentation States what each builder draws.
 */
export namespace StageEffects {
  /**
   * The duel's consequences.
   *
   * @param options The cap prop, when the film has one, and the film seed for the fragments.
   * @returns The effects builder.
   */
  export function duel(options: { cap?: FallingMasonry; seed: string }): (resolved: StageMount.IResolved) => StageMount.IEffect[] {
    return (resolved: StageMount.IResolved): StageMount.IEffect[] => {
      const spells: SpellTrack.ITrack = SpellTrack.resolve(resolved.world, resolved.schedule);
      const shields: ShieldTrack.IShield[] = ShieldTrack.resolve(resolved.schedule);
      const court: TrainingCourt | undefined = resolved.world.set instanceof TrainingCourt ? resolved.world.set : undefined;
      const masonry: MasonryTrack | undefined = court && options.cap ? MasonryTrack.resolve(court, resolved.schedule, spells, options.seed, options.cap.id) : undefined;
      const effects: DuelEffects = new DuelEffects(spells, shields, masonry, options.cap);
      return [
        {
          object: effects.object,
          place: (seconds: number): void => effects.place(seconds),
          findings: masonry ? masonry.audit(resolved.performance, [...resolved.world.students.keys()]) : [],
          dispose: (): void => effects.dispose(),
        },
      ];
    };
  }
}
