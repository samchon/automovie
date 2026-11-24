import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";
import { ConstructionSplitCompose as C } from "../../../internal/construction/ConstructionSplitCompose";

/**
 * A composed split whose host is a composed split's child, as a palm that parts
 * from a wrist and is itself parted into fingers.
 *
 * Fixture: `f.0` and `f.2` about x = +-7.5 mm on a host of half extents 17 and
 * sqrt(81 - (7.5 cos b)^2) mm, `f.0` carrying a second composed split at its
 * far end (60 mm along its axis) into `g.0` and `g.1`, cylinders of radius 7 mm
 * 3.5 mm either side of its axis leaning 0.3 rad apart from it.
 *
 * Scenarios:
 *
 * 1. No diagnostic; the faces hold both splits' bands and children.
 * 2. The outer forks still stand at x = 0 within 1e-6 mm.
 * 3. The two sections of the fingers cross in `f.0`'s end plane on the line U = 0,
 *    so the inner seam plane is that line's plane through `f.0`'s axis and the
 *    inner forks stand where it meets `f.0`'s end ring: on the axis in the
 *    first section axis and 9 mm either side along the second, within 1e-6 mm.
 */
export function test_unit_engine_geometry_split_compose_nested(): void {
  const b: number = C.LEAN;
  const n: number = C.COLUMNS;
  const palm = (): IAutoMovieConstructionSplit =>
    C.split({
      lean: b,
      two: true,
      host: C.trunk(17, Math.sqrt(81 - (7.5 * Math.cos(b)) ** 2)),
    });
  const tip: C.V3 = [
    0.0075 + 0.06 * Math.sin(b),
    0,
    -0.03 - 0.06 * Math.cos(b),
  ];
  const twig = (name: string, side: number): IAutoMovieConstructionNode =>
    ConstructionShapes.part(
      name,
      {
        origin: {
          x: tip[0] + side * 0.0035 * Math.cos(b),
          y: 0,
          z: tip[2] + side * 0.0035 * Math.sin(b),
        },
        u: { x: Math.cos(b + side * 0.3), y: 0, z: Math.sin(b + side * 0.3) },
        v: { x: 0, y: 1, z: 0 },
      },
      ConstructionShapes.uniform(-0.012, 0.04, 8),
      (): [number, number, number, number] => [0.007, 0.007, 0.007, 0.007],
      "open",
    );
  const outer: IAutoMovieConstructionSplit = palm();
  const inner: IAutoMovieConstructionSplit = {
    type: "split",
    name: "split.inner",
    host: outer.children[0].part,
    hostFace: "f.0",
    hostEnd: "top",
    seam: [-1, 1],
    count: n,
    rows: 4,
    children: [
      {
        band: "band.g.0",
        part: twig("g.0", 1),
        partFace: "g.0",
        partEnd: "bottom",
        rail: C.RAIL / 1000,
        correspondence: "length",
      },
      {
        band: "band.g.1",
        part: twig("g.1", -1),
        partFace: "g.1",
        partEnd: "bottom",
        rail: C.RAIL / 1000,
        correspondence: "length",
      },
    ],
    compose: {
      frame: "host",
      plane: { point: [0, 0, 0], normal: [0, 0, 1] },
      round: 0.001,
    },
  };
  const nested = C.realize({
    ...outer,
    children: [{ ...outer.children[0], part: inner }, outer.children[1]],
  });
  TestValidator.equals("nested diagnostics", nested.diagnostics.length, 0);
  const faces: string[] = nested.body.faces.map(
    (f: { chain: string }): string => f.chain,
  );
  for (const name of [
    "band.f.0",
    "band.f.2",
    "band.g.0",
    "band.g.1",
    "g.0",
    "g.1",
    "f.0",
    "f.2",
    "trunk",
  ])
    TestValidator.predicate(`nested face ${name}`, faces.includes(name));
  let nestedPlane: number = 0;
  for (const k of [0, n / 2])
    nestedPlane = Math.max(
      nestedPlane,
      Math.abs(C.loop(nested, "band.f.0", k).p[0]!),
    );
  TestValidator.predicate("nested outer forks", nestedPlane <= 1e-6);
  for (const k of [0, n / 2]) {
    const p: readonly number[] = C.loop(nested, "band.g.0", k).p;
    TestValidator.predicate(
      `inner fork ${k}`,
      Math.hypot(
        p[0]! - 1000 * tip[0],
        Math.abs(p[1]!) - 9,
        p[2]! - 1000 * tip[2],
      ) <= 1e-6,
    );
  }
}
