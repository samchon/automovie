import { TestValidator } from "@nestia/e2e";

import { GalleryAddress } from "../../src/gallery/GalleryAddress";
import type { IGalleryCatalogue } from "../../src/gallery/structures/IGalleryCatalogue";
import type { IGalleryRequest } from "../../src/gallery/structures/IGalleryRequest";

/**
 * A gallery address reproduces the request it was written from, and an address the catalogue cannot serve falls back to something it can.
 *
 * Scenarios:
 * 1. A request with a variant, a seed, hidden affordances and two moved articulations reads back equal after being written as a query.
 * 2. A query naming a subject the catalogue lacks opens the catalogue's first subject in its first variant.
 * 3. A query naming a variant its subject lacks opens that subject's first variant, keeping the subject.
 * 4. An articulation at rest is left out of the query, and a `move.` value that is not a number is ignored.
 */
export function test_website_gallery_address(): void {
  const catalogue: IGalleryCatalogue = {
    groups: [
      {
        name: "human",
        subjects: [
          {
            id: "human",
            label: "Polygon man",
            group: "human",
            variantKey: "body",
            variants: [
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
          },
        ],
      },
      {
        name: "architecture",
        subjects: [
          {
            id: "createDoor",
            label: "Door",
            group: "architecture",
            variantKey: "kind",
            variants: [
              { id: "hinged", label: "hinged" },
              { id: "sliding", label: "sliding" },
            ],
          },
        ],
      },
    ],
  };

  // 1. Round trip.
  const request: IGalleryRequest = {
    subject: "createDoor",
    variant: "sliding",
    seed: "scene-3/door",
    state: { hinge: 70, latch: 12.5 },
    affordances: false,
  };
  TestValidator.equals(
    "a request reads back equal",
    GalleryAddress.decode(GalleryAddress.encode(request), catalogue),
    request,
  );

  // 2. An unknown subject.
  TestValidator.equals(
    "an unknown subject opens the first one",
    GalleryAddress.decode("?subject=createNothing&variant=x", catalogue),
    { subject: "human", variant: "a", seed: "", state: {}, affordances: true },
  );

  // 3. An unknown variant.
  TestValidator.equals(
    "an unknown variant opens the subject's first one",
    GalleryAddress.decode("?subject=createDoor&variant=revolving", catalogue),
    {
      subject: "createDoor",
      variant: "hinged",
      seed: "",
      state: {},
      affordances: true,
    },
  );

  // 4. Rest and malformed travel.
  TestValidator.equals(
    "an articulation at rest is not written",
    GalleryAddress.encode({ ...request, state: { hinge: 0 } }).includes(
      "move.",
    ),
    false,
  );
  TestValidator.equals(
    "a travel that is not a number is ignored",
    GalleryAddress.decode(
      "?subject=createDoor&variant=hinged&move.hinge=wide&move.latch=3",
      catalogue,
    ).state,
    { latch: 3 },
  );
}
