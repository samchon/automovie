import type { FilmPlan } from "./FilmPlan";

/**
 * The film's independently owned route and official-travel intentions.
 * @evidence contracts/common.md#implementation-and-ownership This small plan owner retains the same actor IDs, world destinations and authored intervals formerly beside the exchanges. Each explicitly typed Step is checked before freezing; actual native routes and landing receipts remain runtime-owned.
 * @evidence contracts/common.md#authoring-interface Returns immutable film-second/local-metre intentions. A destination label requires the actual ring and fallen actor to resolve it; this collection supplies neither an achieved path nor physical admission.
 */
export namespace FilmSteps {
  /**
   * Build the same explicit independent route intentions before any runtime fitting.
   * @evidence contracts/common.md#implementation-and-ownership Typed collection admission preserves actor, tuple and destination discriminants before immutable map operations. Original route timing and ownership are unchanged.
   * @evidence contracts/common.md#authoring-interface Returns owned frozen plan rows. The runtime resolves world destinations and actual supported geometry; this builder neither moves actors nor creates footstep receipts.
   */
  export function build(): readonly Readonly<FilmPlan.Step>[] {
    const steps: FilmPlan.Step[] = [
      {
        id: "opening-a",
        actorId: "a",
        start: 0,
        end: 0.8,
        displacement: [0.12, 0, 0.025],
      },
      {
        id: "opening-b",
        actorId: "b",
        start: 0,
        end: 0.8,
        displacement: [0.08, 0, -0.015],
      },
      ...Array.from(
        { length: 9 },
        (_: unknown, index: number): FilmPlan.Step[] => {
          const actorId: "a" | "b" = index % 3 === 0 ? "b" : "a";
          return [
            {
              id: `angle-${index + 1}`,
              actorId,
              start: (index + 1) * 15,
              end: (index + 1) * 15 + 0.7,
              displacement: [
                index % 2 === 0 ? -0.055 : 0.045,
                0,
                index % 2 === 0 ? 0.075 : -0.065,
              ],
            },
          ];
        },
      ).flat(),
      {
        id: "winner-neutral-corner",
        actorId: "a",
        start: 151.8,
        end: 156.8,
        displacement: [0, 0, 0],
        destination: "farthest-neutral-corner",
      },
      {
        id: "referee-start-retreat",
        actorId: "referee",
        start: 0.8,
        end: 2.4,
        displacement: [-0.25, 0, -0.3],
      },
      ...Array.from(
        { length: 4 },
        (_: unknown, index: number): FilmPlan.Step => ({
          id: `referee-angle-${index + 1}`,
          actorId: "referee",
          start: (index + 1) * 30,
          end: (index + 1) * 30 + 1.2,
          displacement: [0.08, 0, index % 2 === 0 ? 0.18 : -0.16],
        }),
      ),
      {
        id: "referee-approach",
        actorId: "referee",
        start: 150,
        end: 156.8,
        displacement: [0, 0, 0],
        destination: "fallen-fighter",
      },
    ];
    return Object.freeze(
      steps.map(
        (value: FilmPlan.Step): Readonly<FilmPlan.Step> =>
          Object.freeze({
            ...value,
            displacement: Object.freeze([
              ...value.displacement,
            ]) as unknown as FilmPlan.Point,
          }),
      ),
    );
  }
}
