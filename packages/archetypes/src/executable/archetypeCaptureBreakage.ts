import { AutoMovieGravity, projectileAt } from "@automovie/engine";
import type { IAutoMovieProjectileState } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  type AutoMovieArchetypeFracture,
  AutoMovieArchetypeFrame,
} from "../core";
import { createDrinkware } from "../props";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/**
 * An empty beer bottle's declared break, followed briefly in free flight. The
 * producer declares its whole body as one fragment; this subject invents no
 * shard pattern. Remainder dynamics and impacts are not part of that fracture
 * API.
 *
 * @returns One subject with an authored 1 s fracture instant and a 0.35 s
 *   flight window.
 */
export function archetypeCaptureBreakage(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const bottle: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "beerBottle",
    fill: 0,
  });
  const broken: AutoMovieArchetypeFracture.IPieces<
    createDrinkware.Affordance,
    createDrinkware.Dimension
  > | null = bottle.broken({ energy: 40, momentum: { x: 0.2, y: 0, z: 0 } });
  if (broken === null || broken.fragments.length === 0)
    throw new RangeError(
      "The canonical empty bottle must expose its actual declared 40 J break",
    );
  const event: number = 1;
  const placement: ReturnType<typeof AutoMovieArchetypeFrame.upright> =
    AutoMovieArchetypeFrame.upright({ x: 0, y: 1.2, z: 0 });
  const fragments: readonly {
    piece: AutoMovieArchetypeFracture.IPiece<
      createDrinkware.Dimension,
      createDrinkware.Affordance
    >;
    flight: Parameters<typeof projectileAt>[0];
  }[] = broken.fragments.map(
    (
      piece: AutoMovieArchetypeFracture.IPiece<
        createDrinkware.Dimension,
        createDrinkware.Affordance
      >,
    ): {
      piece: AutoMovieArchetypeFracture.IPiece<
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
          at: (seconds: number): { archetype: AutoMovieArchetype } => {
            if (seconds < event)
              return {
                archetype: AutoMovieArchetypeAssembly.of(
                  "capture-intact-bottle",
                  "Intact empty bottle",
                  {
                    bottle: { archetype: bottle, placement },
                  },
                ),
              };
            const members: Record<string, AutoMovieArchetypeAssembly.IMember> =
              {};
            if (broken.remainder !== null)
              members.remainder = { archetype: broken.remainder, placement };
            for (const fragment of fragments) {
              const state: IAutoMovieProjectileState = projectileAt(
                fragment.flight,
                seconds - event,
              );
              members[`fragment-${fragment.piece.id}`] = {
                archetype: fragment.piece.archetype,
                placement: AutoMovieArchetypeFrame.upright(state.position),
              };
            }
            return {
              archetype: AutoMovieArchetypeAssembly.of(
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
