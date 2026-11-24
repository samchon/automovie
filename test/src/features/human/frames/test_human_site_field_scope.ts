import { AutoMovieHumanSiteControls } from "@automovie/human";
import type {
  IAutoMovieHumanSectionSite,
  IAutoMovieHumanSectionSource,
  IAutoMovieHumanSiteControls,
} from "@automovie/interface";
import assert from "node:assert/strict";

/**
 * A regional scalar read borrows the identical declaration and a host tape
 * borrows only the original result of its complete numeric tuple.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares two scoped tape declarations and borrows their admitted native field.
 * @evidence contracts/development/testing.md#independent-expectations A circle of radius 10 mm has a girth of 20 pi mm and the field owns the specified interval from 0 to 40 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases An unchanged tape borrows its exact original result. Changing a tape or preparing a different scalar declaration cannot replace the original.
 * @evidence contracts/development/testing.md#execution-ownership Uses two analytic circular sites and prepares no loft, mesh or body.
 * @evidence contracts/development/common.md#meaningful-documentation Names the numeric and declaration authority checked at each boundary.
 */
export function test_human_site_field_scope(): void {
  const site = (name: string, station: number): IAutoMovieHumanSectionSite => ({
    site: name,
    station,
    edges: [10, 10, -10, -10],
    fullness: { girth: 20 * Math.PI },
  });
  const input: IAutoMovieHumanSectionSource = {
    name: "scope.circle",
    axis: {
      type: "straight",
      origin: { x: 0, y: 0, z: 0 },
      u: { x: 1, y: 0, z: 0 },
      v: { x: 0, y: 0, z: 1 },
    },
    sites: [site("lower", 0), site("upper", 40)],
    order: 16,
    samples: 16,
    gap: 10,
  };
  const original: IAutoMovieHumanSiteControls.IControls | null =
    AutoMovieHumanSiteControls.prepare(input).controls;
  assert.ok(original !== null);
  assert.equal(original.tapes.length, 2);
  const updated: IAutoMovieHumanSiteControls.IControls | null =
    AutoMovieHumanSiteControls.prepare(
      {
        ...input,
        sites: [
          { ...input.sites[0]!, fullness: { girth: 20 * Math.PI + 1 } },
          input.sites[1]!,
        ],
      },
      original.tapes,
    ).controls;
  assert.ok(updated !== null);
  assert.notEqual(updated.tapes[0], original.tapes[0]);
  assert.equal(updated.tapes[1], original.tapes[1]);
  assert.equal(original.tapes[0]!.girth, 20 * Math.PI);
  assert.equal(updated.tapes[0]!.girth, 20 * Math.PI + 1);

  const field: IAutoMovieHumanSiteControls.IField =
    AutoMovieHumanSiteControls.native(input.name, original.scalars);
  assert.deepEqual(field.source.domain, [0, 40]);
  assert.equal(
    AutoMovieHumanSiteControls.native(input.name, original.scalars, field),
    field,
  );
  assert.throws(
    () => AutoMovieHumanSiteControls.native(input.name, updated.scalars, field),
    /belongs to another scalar declaration/,
  );
}
