import { TestValidator } from "@nestia/e2e";

import { GalleryArchetype } from "../../src/gallery/package/GalleryArchetype";
import { GalleryCatalogue } from "../../src/gallery/package/GalleryCatalogue";
import type { IGalleryCatalogue } from "../../src/gallery/structures/IGalleryCatalogue";
import type { IGalleryView } from "../../src/gallery/structures/IGalleryView";

/**
 * A seed redraws the dimensions the gallery lists, each inside its band.
 *
 * Scenarios:
 * 1. For every archetype and variant under eight seeds, every listed dimension lies inside the band listed beside it.
 * 2. For every archetype and variant with at least one band wider than a point, two of the eight seeds list a different value for some dimension, so the seed control changes what is shown.
 * 3. Every dimension the producer records appears in the gallery's dimension list, including derived values.
 * 4. Each articulation the gallery offers a slider for builds at both ends of the travel it lists, so the slider cannot ask for a refused state.
 */
export function test_website_gallery_seed(): void {
  const outside: string[] = [];
  const unchanged: string[] = [];
  const unlisted: string[] = [];
  const refused: string[] = [];
  const subjects: IGalleryCatalogue.ISubject[] =
    GalleryCatalogue.catalogue().groups.flatMap(
      (group: IGalleryCatalogue.IGroup): IGalleryCatalogue.ISubject[] =>
        group.subjects,
    );

  for (const subject of subjects)
    for (const variant of subject.variants.length === 0
      ? [""]
      : subject.variants.map((v): string => v.id)) {
      const name: string = `${subject.id} ${variant}`.trim();
      const drawn: Set<string> = new Set();
      let free: boolean = false;
      let rest: Omit<IGalleryView, "grid"> | null = null;
      for (let seed: number = 1; seed <= 8; seed++) {
        const { archetype, view }: GalleryArchetype.IBuilt =
          GalleryArchetype.build({
            subject: subject.id,
            variant,
            seed: String(seed),
            state: {},
            affordances: true,
          });
        rest = view;
        const listed: Set<string> = new Set(
          view.dimensions.map(
            (dimension: IGalleryView.IDimension): string => dimension.name,
          ),
        );
        for (const dimension of Object.keys(archetype.dimensions))
          if (!listed.has(dimension))
            unlisted.push(`${name} seed ${seed}: ${dimension}`);
        for (const dimension of view.dimensions) {
          if (dimension.maximum > dimension.minimum) free = true;

          // A drawn value may differ from its band's end by float error only.
          if (
            dimension.value < dimension.minimum - 1e-9 ||
            dimension.value > dimension.maximum + 1e-9
          )
            outside.push(
              `${name} seed ${seed}: ${dimension.name} ${dimension.value} outside ${dimension.minimum} to ${dimension.maximum}`,
            );
        }
        drawn.add(
          JSON.stringify(
            view.dimensions.map(
              (d: IGalleryView.IDimension): number => d.value,
            ),
          ),
        );
      }
      if (free && drawn.size < 2) unchanged.push(name);

      for (const affordance of rest?.affordances ?? []) {
        if (affordance.travel === null) continue;
        for (const travel of [
          affordance.travel.minimum,
          affordance.travel.maximum,
        ])
          try {
            GalleryArchetype.build({
              subject: subject.id,
              variant,
              seed: "8",
              state: { [affordance.id]: travel },
              affordances: true,
            });
          } catch (error) {
            refused.push(
              `${name}: ${affordance.id} at ${travel}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
      }
    }

  TestValidator.equals("every dimension lies inside its band", outside, []);
  TestValidator.equals("a seed changes a listed dimension", unchanged, []);
  TestValidator.equals("every recorded dimension is listed", unlisted, []);
  TestValidator.equals("each slider's ends build", refused, []);
}
