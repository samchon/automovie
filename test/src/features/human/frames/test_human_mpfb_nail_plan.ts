import assert from "node:assert/strict";

import { FamilyConicMpfbNails as Nails } from "../../../reference-conics/FamilyConicMpfbNails";

/**
 * An independent anatomical manifest of the two views at every bilateral digit.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the inspection site's own catalog and direction declarations.
 * @evidence contracts/development/testing.md#independent-expectations The literal digit inventory has five fingers and five toes on each side. A Cartesian frame gives a closed-form lateral vector via its cross product.
 * @evidence contracts/development/testing.md#distinguishing-cases A repeated thumb cannot substitute for an absent toe, and reflected dorsal directions give opposite lateral views.
 * @evidence contracts/development/testing.md#execution-ownership This test uses no external mesh, renderer or fixture files.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both the anatomical inventory and the view convention being observed.
 */
export function test_human_mpfb_nail_plan(): void {
  const names: string[] = [
    "finger.thumb",
    "finger.index",
    "finger.middle",
    "finger.ring",
    "finger.pinky",
    "toe.big",
    "toe.index",
    "toe.middle",
    "toe.ring",
    "toe.little",
  ];
  const groups = (["l", "r"] as const).map((side) => ({
    side,
    digits: names.map((name) => ({ name })),
  }));
  const sites: Nails.ISite[] = Nails.sites(groups);
  assert.deepEqual(
    sites.map(({ side, digit }): string => `${side}.${digit}`),
    [
      ...names.map((name): string => `l.${name}`),
      ...names.map((name): string => `r.${name}`),
    ],
  );
  const frames = sites.flatMap(({ side, digit }) =>
    Nails.views({
      origin: [0, 0, 0],
      distal: [1, 0, 0],
      dorsal: [0, side === "l" ? 1 : -1, 0],
    }).map(({ name, back, up }) => ({ name, back, up, side, digit })),
  );
  assert.equal(frames.length, 40);
  for (const frame of frames) {
    const sign: number = frame.side === "l" ? 1 : -1;
    const side: number = frame.name === "lateral" ? -sign : 0;
    assert.equal(frame.back[0] || 0, 0);
    assert.equal(frame.back[1] || 0, frame.name === "dorsal" ? sign : 0);
    assert.equal(frame.back[2] || 0, side);
    assert.deepEqual(frame.up, [1, 0, 0]);
  }
  assert.throws(
    () =>
      Nails.sites([
        groups[0]!,
        {
          ...groups[1]!,
          digits: [...groups[1]!.digits.slice(0, -1), { name: "finger.thumb" }],
        },
      ]),
    /Missing nail site r\.toe\.little/,
  );
}
