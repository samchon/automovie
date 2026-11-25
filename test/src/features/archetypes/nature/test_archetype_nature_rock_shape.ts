import { createRock } from "@automovie/archetypes";
import { physicalHullFaces, physicalHullMass } from "@automovie/engine";
import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** One stone's measured hull. */
interface IStone {
  /** The produced stone. */
  stone: ReturnType<typeof createRock>;

  /** Its drawn diameter, metres. */
  diameter: number;

  /** The collider's corners in model metres. */
  points: IAutoMovieVector3[];

  /** The collider's hull. */
  hull: IAutoMoviePhysicalHullFaces.IHull;
}

/**
 * The default irregular stone is a seeded convex hull on a flat base whose X
 * extent is the drawn diameter, weighs its own volume of granite and carries
 * its contacts on its hull; the ball form keeps the earlier sphere.
 *
 * Scenarios:
 *
 * 1. For 64 seeds of each kind, the hull's X extent equals the drawn diameter
 *    within 1e-9 m, and no two hull vertices lie farther apart in plan.
 * 2. One hull face lies in y = 0 facing down, and the centroid's plan projection
 *    lies inside it at least 5 % of the diameter from its edge.
 * 3. The mass equals the hull volume times the drawn specific gravity times 1000
 *    within a relative 1e-12.
 * 4. A boulder's `top` is its highest hull vertex and its `side` lies on the hull
 *    within 1e-9 m; a cobble's `grip` aperture is its X extent.
 * 5. The same seed gives byte-identical parts, body and affordances; two seeds
 *    give different hull vertices.
 * 6. For seeds 0, 1 and 2, `form: "ball"` is one sphere of the drawn diameter on
 *    its lowest point at the origin, weighing pi d^3 / 6 of granite, with the
 *    earlier contacts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces stones through the public producer and measures their colliders, mass and affordance frames, which catches a hull scaled or turned wrong, a stone that rocks on a point or tips off its base, a mass from the wrong volume, contacts off the hull, an unseeded form and a ball form that changed.
 * @evidence contracts/development/testing.md#independent-expectations The diameter is the drawn dimension and the X extent is measured on the collider; the base, plan distances, volume and surface distances come from the engine's hull of the collider's corners, independent of the producer's cell; the 5 % margin is a stability requirement for a stone that rests on its base; the sphere's volume pi d^3 / 6 is worked by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds over 64 seeds each, both forms, a repeated seed against a different one; band coverage stays with `test_archetype_nature_rock_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_nature_rock_shape(): void {
  const findings: string[] = [];
  const measure: (
    kind: createRock.Kind,
    seed: number,
    form?: createRock.Form,
  ) => IStone = (
    kind: createRock.Kind,
    seed: number,
    form?: createRock.Form,
  ): IStone => {
    const stone: ReturnType<typeof createRock> = createRock(
      { kind, form },
      seed,
    );
    const shape: IAutoMoviePhysicalShape = stone.shapes()[0]!;
    const points: IAutoMovieVector3[] =
      shape.kind === "hull" ? shape.points : [];
    return {
      stone,
      diameter: stone.dimensions.diameter!,
      points,
      hull: physicalHullFaces(points),
    };
  };

  for (const kind of createRock.KINDS)
    for (let seed: number = 0; seed < 64; ++seed) {
      const { stone, diameter, points, hull }: IStone = measure(kind, seed);
      const label: string = `${kind}@${seed}`;
      if (points.length === 0) {
        findings.push(`${label}: not a hull`);
        continue;
      }

      // 1. The X extent is the diameter, and the largest plan distance.
      const extent: number = archetypeExtent(stone, "x").size;
      let span: number = 0;
      for (const a of hull.vertices)
        for (const b of hull.vertices)
          span = Math.max(span, Math.hypot(a.x - b.x, a.z - b.z));
      if (Math.abs(extent - diameter) > 1e-9 || span > diameter + 1e-9)
        findings.push(`${label}: extent ${extent}, plan span ${span}`);

      // 2. A flat base at y = 0 holding the centroid's projection.
      const mass: ReturnType<typeof physicalHullMass> =
        physicalHullMass(points);
      const base: IAutoMoviePhysicalHullFaces.IFace | undefined =
        hull.faces.find(
          (face: IAutoMoviePhysicalHullFaces.IFace): boolean =>
            face.normal.y < -1 + 1e-9 && Math.abs(face.offset) < 1e-9,
        );
      if (base === undefined) findings.push(`${label}: no base at y = 0`);
      else {
        const c: IAutoMovieVector3 = mass.centerOfMass;
        const loop: IAutoMovieVector3[] = base.loop;
        const sides: number[] = loop.map(
          (a: IAutoMovieVector3, i: number): number => {
            const b: IAutoMovieVector3 = loop[(i + 1) % loop.length]!;
            const length: number = Math.hypot(b.x - a.x, b.z - a.z);
            return (
              ((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) / length
            );
          },
        );
        const inward: number[] = sides.every((s: number): boolean => s >= 0)
          ? sides
          : sides.map((s: number): number => -s);
        if (Math.min(...inward) < 0.05 * diameter)
          findings.push(
            `${label}: centroid ${Math.min(...inward)} m from its base edge`,
          );
      }

      // 3. The mass is the hull's volume of the drawn granite.
      const expected: number = mass.volume * stone.dimensions.gravity! * 1000;
      if (Math.abs(stone.body.mass - expected) > 1e-12 * expected)
        findings.push(`${label}: mass ${stone.body.mass} against ${expected}`);

      // 4. The contacts on the hull.
      if (kind === "cobble") {
        if (Math.abs(stone.affordance("grip").aperture! - extent) > 1e-9)
          findings.push(`${label}: grip aperture off the X extent`);
      } else {
        const highest: number = Math.max(
          ...hull.vertices.map((p: IAutoMovieVector3): number => p.y),
        );
        const top: IAutoMovieVector3 =
          stone.affordance("top").frame.translation;
        const side: IAutoMovieVector3 =
          stone.affordance("side").frame.translation;
        const outside: number = Math.max(
          ...hull.faces.map(
            (face: IAutoMoviePhysicalHullFaces.IFace): number =>
              face.normal.x * side.x +
              face.normal.y * side.y +
              face.normal.z * side.z -
              face.offset,
          ),
        );
        if (Math.abs(top.y - highest) > 1e-12 || Math.abs(outside) > 1e-9)
          findings.push(`${label}: top or side off the hull`);
      }
    }

  // 5. Seeded identity.
  const bytes: (stone: ReturnType<typeof createRock>) => string = (
    stone: ReturnType<typeof createRock>,
  ): string =>
    JSON.stringify({
      parts: stone.parts,
      body: stone.body,
      affordances: stone.affordances,
    });
  const again: IStone = measure("boulder", 7);
  if (bytes(again.stone) !== bytes(measure("boulder", 7).stone))
    findings.push("the same seed changed the model");
  if (
    JSON.stringify(again.hull.vertices) ===
    JSON.stringify(measure("boulder", 8).hull.vertices)
  )
    findings.push("two seeds drew the same hull");

  // 6. The ball form.
  for (const kind of createRock.KINDS)
    for (const seed of [0, 1, 2]) {
      const stone: ReturnType<typeof createRock> = createRock(
        { kind, form: "ball" },
        seed,
      );
      const d: number = stone.dimensions.diameter!;
      const r: number = d / 2;
      const shape: IAutoMoviePhysicalShape = stone.shapes()[0]!;
      const near: (p: IAutoMovieVector3, q: IAutoMovieVector3) => boolean = (
        p: IAutoMovieVector3,
        q: IAutoMovieVector3,
      ): boolean => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < 1e-12;
      const contacts: boolean =
        kind === "cobble"
          ? near(stone.affordance("grip").frame.translation, {
              x: 0,
              y: r,
              z: 0,
            }) && stone.affordance("grip").aperture === d
          : near(stone.affordance("top").frame.translation, {
              x: 0,
              y: d,
              z: 0,
            }) &&
            near(stone.affordance("side").frame.translation, {
              x: 0,
              y: r,
              z: r,
            });
      const mass: number =
        (Math.PI / 6) * d ** 3 * stone.dimensions.gravity! * 1000;
      if (
        stone.shapes().length !== 1 ||
        shape.kind !== "sphere" ||
        Math.abs(shape.radius - r) > 1e-12 ||
        Math.abs(archetypeExtent(stone, "y").low) > 1e-12 ||
        Math.abs(stone.body.mass - mass) > 1e-12 * mass ||
        !contacts
      )
        findings.push(`${kind}@${seed}: the ball form changed`);
    }
  TestValidator.equals("irregular stones rest on their hull", findings, []);
}
