import { type IPortraitComponent, buildPortraitHead } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { contactSeamFixture } from "../internal/contactSeamFixture";
import { humanFaceFixture } from "../internal/humanFaceFixture";
import { nclose } from "../internal/predicates";

/**
 * Head materialization must preserve the distinct reference colours of two
 * contacting skin samples while sharing their sealed normal field. A small
 * declared annulus isolates this contract from detailed anatomical builders.
 *
 * Scenarios:
 * 1. Closed current and open reference annuli have corresponding indices. The
 *    final head welds the contact, but packs both reference colours at one XYZ.
 * 2. A non-skin region in the same coloured assembly receives no skin RGB.
 */
export const test_subject_head_contact_colour = (): void => {
  const { host } = humanFaceFixture().basis;
  const component = (reference: boolean): IPortraitComponent => ({
    id: "contact-skin",
    fit: () => ({
      constraints: [],
      cutFaces: [],
      attach: (cage, _source, register) => {
        const strip = contactSeamFixture();
        const offset = cage.positions.length;
        const group = register("contact-skin", "skin");
        cage.groups[0] = register("other-material", "enamel");
        cage.positions.push(
          ...strip.positions.map((point, i) => [
            point[0],
            point[1] - (reference && i >= 9 ? 0.25 : 0),
            point[2] + 200,
          ]),
        );
        cage.indices.push(...strip.indices.map((id) => id + offset));
        cage.groups.push(...strip.groups.map(() => group));
        return {
          openings: [
            [0, 1, 2, 3, 4, 5].map((id) => id + offset),
            [6, 7, 8, 9, 10, 11].map((id) => id + offset),
          ],
          closures: [offset + 6],
          finish: () => [],
        };
      },
    }),
  });
  const head = buildPortraitHead(host, [component(false)], 0, [], {
    appearance: {
      host,
      components: [component(true)],
      sample: (p) => [1, 0.5 + p[1] / 1000, 0.5],
    },
  });
  const part = head.parts.find((part) => part.id === "contact-skin")!;
  if (part.geometry.type !== "mesh") throw new Error("Expected contact mesh.");
  const mesh = part.geometry.mesh;
  const green: number[] = [];
  const normals: number[][] = [];
  for (let i = 0; i < mesh.positions.length; i += 3)
    if (
      nclose(mesh.positions[i], -0.0007) &&
      nclose(mesh.positions[i + 2], 0.201)
    ) {
      green.push(mesh.colors![i + 1]);
      normals.push(mesh.normals!.slice(i, i + 3));
    }
  green.sort((a, b) => a - b);
  TestValidator.equals(
    "both reference sides remain represented",
    green.length,
    2,
  );
  TestValidator.predicate(
    "reference colours retained",
    nclose(green[0], 0.49975) && nclose(green[1], 0.5),
  );
  TestValidator.equals("one sealed normal", normals[0], normals[1]);
  const other = head.parts.find((part) => part.id === "other-material")!;
  if (other.geometry.type !== "mesh") throw new Error("Expected other mesh.");
  TestValidator.equals(
    "no skin colour on enamel",
    other.geometry.mesh.colors,
    undefined,
  );
};
