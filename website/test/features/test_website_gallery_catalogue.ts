import * as archetypes from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { GalleryArchetype } from "../../src/gallery/package/GalleryArchetype";
import { GalleryCatalogue } from "../../src/gallery/package/GalleryCatalogue";
import type { IGalleryCatalogue } from "../../src/gallery/structures/IGalleryCatalogue";

/**
 * The gallery's catalogue holds every producer and kind `@automovie/archetypes` exports, and each one builds.
 *
 * The expectation is read from the package's root entry here, not from the
 * catalogue: a producer is a function export named `create*`, and its
 * variants are the `KINDS` or `FRAMES` list it carries.
 *
 * Scenarios:
 * 1. The archetype subjects of the catalogue are exactly the package's `create*` function exports, so none is missing and none is invented.
 * 2. Each subject's variants are exactly its producer's `KINDS` or `FRAMES`, in the package's order; a producer with neither has no variant.
 * 3. Every subject in every variant builds through the gallery's own path into a model with at least one part, so each is reachable and not only listed.
 * 4. The catalogue's groups are the package's families, in its order, so a family a release adds is a group with no change to the site.
 */
export function test_website_gallery_catalogue(): void {
  const catalogue: IGalleryCatalogue = GalleryCatalogue.catalogue();
  const subjects: IGalleryCatalogue.ISubject[] = catalogue.groups.flatMap(
    (group: IGalleryCatalogue.IGroup): IGalleryCatalogue.ISubject[] =>
      group.subjects,
  );
  const listed: IGalleryCatalogue.ISubject[] = subjects;

  // 1. The package's producers, from its root entry.
  const exported: Record<string, unknown> = archetypes as unknown as Record<
    string,
    unknown
  >;
  const producers: string[] = Object.keys(exported)
    .filter(
      (name: string): boolean =>
        /^create[A-Z]/.test(name) && typeof exported[name] === "function",
    )
    .sort();
  TestValidator.equals(
    "the catalogue's archetypes are the package's producers",
    listed
      .map((subject: IGalleryCatalogue.ISubject): string => subject.id)
      .sort(),
    producers,
  );

  // 2. Each producer's variants.
  const findings: string[] = [];
  for (const subject of listed) {
    const producer: { KINDS?: unknown; FRAMES?: unknown } = exported[
      subject.id
    ] as { KINDS?: unknown; FRAMES?: unknown };
    const expected: unknown = producer.KINDS ?? producer.FRAMES ?? [];
    if (
      JSON.stringify(subject.variants.map((v): string => v.id)) !==
      JSON.stringify(expected)
    )
      findings.push(
        `${subject.id}: lists ${subject.variants.map((v): string => v.id).join(", ")} for ${JSON.stringify(expected)}`,
      );
  }
  TestValidator.equals("each subject lists its producer's kinds", findings, []);

  // 3. Every subject and variant builds.
  const unbuilt: string[] = [];
  for (const subject of listed)
    for (const variant of subject.variants.length === 0
      ? [""]
      : subject.variants.map((v): string => v.id))
      try {
        const built: GalleryArchetype.IBuilt = GalleryArchetype.build({
          subject: subject.id,
          variant,
          seed: "",
          state: {},
          affordances: true,
        });
        if (built.archetype.parts.length === 0)
          unbuilt.push(`${subject.id} ${variant}: no part`);
      } catch (error) {
        unbuilt.push(
          `${subject.id} ${variant}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
  TestValidator.equals("every subject and variant builds", unbuilt, []);

  // 4. The groups are the package's families.
  TestValidator.equals(
    "the groups are the package's families",
    catalogue.groups.map(
      (group: IGalleryCatalogue.IGroup): string => group.name,
    ),
    Object.keys(archetypes.ARCHETYPE_FAMILIES),
  );
}
