import { AutoMovieGravity, projectileAt } from "@automovie/engine";
import type { IAutoMovieProjectileState } from "@automovie/interface";

import {
  type Archetype,
  ArchetypeAssembly,
  type ArchetypeFracture,
  ArchetypeFrame,
} from "../core";
import { createDrinkware } from "../props";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/**
 * An actual empty beer bottle's declared break, followed briefly in free flight.
 * The producer declares its whole body as one fragment; this subject invents no
 * shard pattern. Remainder dynamics and impacts are not part of that fracture API.
 *
 * @returns One subject with an authored 1 s fracture instant and a 0.35 s flight window.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States empty-bottle threshold 40 J, authored momentum 0.2 kg m/s along X, initial height 1.2 m, one actual body fragment, retained remainder and the absence of fracture-work/impact/remainder dynamics.
 * @evidence contracts/development/implementation.md#principled-implementation The public broken call chooses actual producer fragments and p/M velocities. Engine projectileAt evolves those returned fragment velocities under standard gravity; one assembly preserves original shared coordinates and unchanged held remainder.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare one real bottle/break once; the subject returns the intact placed model before the event and an assembly of the actual remainder and publicly flown fragments afterward.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No surrogate shards, fixture-defined fracture sets, altered threshold, patched method, collision response or capture-only trajectory law replaces the producer/engine behavior.
 * @evidence contracts/development/implementation.md#efficient-algorithms One producer and split during preparation; each seek samples F constant-acceleration flights and merges the actual P part records in O(F+P) work, without retained frame history.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual split and per-fragment launch records are prepared once; all frames reuse the same source ownership and the engine's flight owner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The subject retains one source bottle, its actual pieces and F scalar launch records; temporary assemblies belong to callers, and no renderer/process/handle is started.
 */
export function archetypeCaptureBreakage(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const bottle: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "beerBottle",
    fill: 0,
  });
  const broken: ArchetypeFracture.IPieces<
    createDrinkware.Affordance,
    createDrinkware.Dimension
  > | null = bottle.broken({ energy: 40, momentum: { x: 0.2, y: 0, z: 0 } });
  if (broken === null || broken.fragments.length === 0)
    throw new RangeError(
      "The canonical empty bottle must expose its actual declared 40 J break",
    );
  const event: number = 1;
  const placement: ReturnType<typeof ArchetypeFrame.upright> =
    ArchetypeFrame.upright({ x: 0, y: 1.2, z: 0 });
  const fragments: readonly {
    piece: ArchetypeFracture.IPiece<
      createDrinkware.Dimension,
      createDrinkware.Affordance
    >;
    flight: Parameters<typeof projectileAt>[0];
  }[] = broken.fragments.map(
    (
      piece: ArchetypeFracture.IPiece<
        createDrinkware.Dimension,
        createDrinkware.Affordance
      >,
    ): {
      piece: ArchetypeFracture.IPiece<
        createDrinkware.Dimension,
        createDrinkware.Affordance
      >;
      flight: Parameters<typeof projectileAt>[0];
    } => ({
      piece,
      flight: {
        origin: { ...placement.translation },
        velocity: { ...piece.velocity },
        gravity: { x: 0, y: -AutoMovieGravity.STANDARD, z: 0 },
      },
    }),
  );
  return {
    "fracture-beer-bottle": {
      duration: event + 0.35,
      instants: [
        { seconds: 0, label: "intact" },
        { seconds: event, label: "fracture" },
        { seconds: event + 0.35, label: "free-flight-window-end" },
      ],
      members: [
        {
          name: "actual-bottle-fracture",
          at: (seconds: number): { archetype: Archetype } => {
            if (seconds < event)
              return {
                archetype: ArchetypeAssembly.of(
                  "capture-intact-bottle",
                  "Intact empty bottle",
                  {
                    bottle: { archetype: bottle, placement },
                  },
                ),
              };
            const members: Record<string, ArchetypeAssembly.IMember> = {};
            if (broken.remainder !== null)
              members.remainder = { archetype: broken.remainder, placement };
            for (const fragment of fragments) {
              const state: IAutoMovieProjectileState = projectileAt(
                fragment.flight,
                seconds - event,
              );
              members[`fragment-${fragment.piece.id}`] = {
                archetype: fragment.piece.archetype,
                placement: ArchetypeFrame.upright(state.position),
              };
            }
            return {
              archetype: ArchetypeAssembly.of(
                "capture-broken-bottle",
                "Actual declared bottle pieces",
                members,
              ),
            };
          },
        },
      ],
    },
  };
}
