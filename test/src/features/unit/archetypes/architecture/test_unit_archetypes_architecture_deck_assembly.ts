import {
  AutoMovieArchetypeAssembly,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeSea,
  createCannon,
  createDeck,
} from "@automovie/archetypes";
import { Quaternion, Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A ship's deck is a standing support guarded as the guardrail standard asks,
 * carries a gun as an assembly, and rides a seeded swell with the gun fast on
 * it.
 *
 * Scenarios, on a Liberty ship's whole deck (`createDeck.REFERENCE`):
 *
 * 1. The deck passes `validateModel`, and each side's guardrail, read from its own
 *    parts, meets ISO 5480:2020 clause 5: the toprail's top at least 1 000 mm
 *    above the deck (5.1.1), the opening below the lowest course at most 230 mm
 *    (5.1.2) and between the courses above at most 380 mm (5.1.3), at least
 *    three courses (Load Line Convention regulation 25(3)), stanchions from end
 *    to end at most 1 500 mm apart (5.1.4) and of at least 60 mm x 15 mm flat
 *    bar (5.2), a toprail tube of at least 34 mm (5.3.1) and lower rails of at
 *    least 19 mm (5.3.3). 1b. The `deck` surface spans the beam less the two
 *    stanchions over the whole length, and each toprail contact is a bar of the
 *    34 mm tube along the stretch with its top at the toprail's height.
 * 2. A deck too narrow for its two stanchions, and one of no length, are refused
 *    at their fields.
 * 3. The deck and a field gun set amidships on it, its muzzle square to the left
 *    side as a gun trained abeam, form an assembly that passes `validateModel`
 *    and keeps the deck's walking surface and the gun's muzzle under their
 *    keys.
 * 4. Steaming its own length at a Liberty ship's 11 knots cruising speed (ASME's
 *    1984 landmark brochure, p. 4), already at it when the course begins and
 *    still at it when it ends, so no rate of speeding up or slowing, which no
 *    source read gives, enters the test, on a sea at the top of the WMO sea
 *    state code's slight band, 1.25 m significant height, running abeam: the
 *    deck heaves by the sea's elevation under its root, tilts no more than the
 *    steepest slope allows, and the gun's muzzle keeps its place in the deck's
 *    surface frame, within 1e-9; the same seed rides the same, and a calm sea
 *    of zero height leaves the deck on still water.
 */
export function test_unit_archetypes_architecture_deck_assembly(): void {
  const findings: string[] = [];
  const deck: ReturnType<typeof createDeck> = createDeck(createDeck.REFERENCE);

  // 1. Admitted, and guarded as the standard asks.
  if (!validateModel({ model: deck }).success)
    findings.push("the deck is not admitted");
  const ISO: Readonly<
    Record<
      | "height"
      | "lowest"
      | "opening"
      | "courses"
      | "spacing"
      | "breadth"
      | "thickness"
      | "toprail"
      | "rail",
      number
    >
  > = {
    height: 1,
    lowest: 0.23,
    opening: 0.38,
    courses: 3,
    spacing: 1.5,
    breadth: 0.06,
    thickness: 0.015,
    toprail: 0.034,
    rail: 0.019,
  };
  const EPSILON: number = 1e-9;
  const shape = (part: IAutoMovieModelPart): IAutoMoviePrimitiveShape => {
    if (part.geometry.type !== "primitive")
      throw new Error(`deck part ${part.id} is not a primitive`);
    return part.geometry.shape;
  };
  for (const side of ["left", "right"] as const) {
    const posts: IAutoMovieModelPart[] = deck.parts
      .filter((p: IAutoMovieModelPart): boolean =>
        p.id.startsWith(`stanchion-${side}-`),
      )
      .sort(
        (a: IAutoMovieModelPart, b: IAutoMovieModelPart): number =>
          a.transform!.translation.z - b.transform!.translation.z,
      );
    const length: number = createDeck.REFERENCE.length;
    if (
      posts.length < 2 ||
      Math.abs(posts[0]!.transform!.translation.z + length / 2) > EPSILON ||
      Math.abs(posts[posts.length - 1]!.transform!.translation.z - length / 2) >
        EPSILON
    )
      findings.push(`the ${side} stanchions do not run from end to end`);
    for (let k: number = 1; k < posts.length; k++) {
      const gap: number =
        posts[k]!.transform!.translation.z -
        posts[k - 1]!.transform!.translation.z;
      if (gap > ISO.spacing + EPSILON)
        findings.push(
          `the ${side} stanchions ${k - 1} and ${k} stand ${gap} m apart`,
        );
    }
    for (const post of posts) {
      const s: IAutoMoviePrimitiveShape = shape(post);
      if (
        s.type !== "box" ||
        s.width < ISO.breadth - EPSILON ||
        s.depth < ISO.thickness - EPSILON
      )
        findings.push(
          `the ${side} stanchion ${post.id} is no 60 x 15 mm flat bar`,
        );
    }
    const courses: { id: string; y: number; radius: number }[] = deck.parts
      .filter(
        (p: IAutoMovieModelPart): boolean =>
          p.id === `toprail-${side}` || p.id.startsWith(`rail-${side}-`),
      )
      .map(
        (p: IAutoMovieModelPart): { id: string; y: number; radius: number } => {
          const s: IAutoMoviePrimitiveShape = shape(p);
          if (s.type !== "cylinder")
            throw new Error(`deck course ${p.id} is not a bar`);
          return { id: p.id, y: p.transform!.translation.y, radius: s.radius };
        },
      )
      .sort((a: { y: number }, b: { y: number }): number => a.y - b.y);
    const top: { id: string; y: number; radius: number } =
      courses[courses.length - 1]!;
    if (courses.length < ISO.courses)
      findings.push(`the ${side} guardrail has ${courses.length} courses`);
    if (
      top.id !== `toprail-${side}` ||
      top.y + top.radius < ISO.height - EPSILON
    )
      findings.push(
        `the ${side} toprail's top stands ${top.y + top.radius} m above the deck`,
      );
    if (2 * top.radius < ISO.toprail - EPSILON)
      findings.push(`the ${side} toprail is ${2 * top.radius} m across`);
    if (courses[0]!.y - courses[0]!.radius > ISO.lowest + EPSILON)
      findings.push(
        `the ${side} opening below the lowest course is ${courses[0]!.y - courses[0]!.radius} m`,
      );
    for (let k: number = 1; k < courses.length; k++) {
      const opening: number =
        courses[k]!.y -
        courses[k]!.radius -
        (courses[k - 1]!.y + courses[k - 1]!.radius);
      if (opening > ISO.opening + EPSILON)
        findings.push(
          `the ${side} opening above ${courses[k - 1]!.id} is ${opening} m`,
        );
      if (2 * courses[k - 1]!.radius < ISO.rail - EPSILON)
        findings.push(
          `the ${side} rail ${courses[k - 1]!.id} is ${2 * courses[k - 1]!.radius} m across`,
        );
    }
  }

  // 1b. The contacts: the walking surface between the stanchions and each toprail a bar of the tube's size over the whole stretch.
  const walk: ReturnType<typeof deck.affordance> = deck.affordance("deck");
  if (
    Math.abs(walk.width! - (createDeck.REFERENCE.beam - 2 * ISO.breadth)) >
      EPSILON ||
    Math.abs(walk.depth! - createDeck.REFERENCE.length) > EPSILON
  )
    findings.push(`the deck surface is ${walk.width} by ${walk.depth} m`);
  for (const side of ["leftRail", "rightRail"] as const) {
    const rail: ReturnType<typeof deck.affordance> = deck.affordance(side);
    if (
      rail.kind !== "bar" ||
      Math.abs(rail.aperture! - ISO.toprail) > EPSILON ||
      Math.abs(rail.length! - createDeck.REFERENCE.length) > EPSILON ||
      Math.abs(rail.frame.translation.y + rail.aperture! / 2 - ISO.height) >
        EPSILON
    )
      findings.push(`the ${side} is not the toprail along the stretch`);
  }

  // 2. Refusals.
  for (const [field, params] of [
    ["beam", { ...createDeck.REFERENCE, beam: ISO.breadth }],
    ["length", { ...createDeck.REFERENCE, length: 0 }],
  ] as const) {
    let refused: string | null = null;
    try {
      createDeck(params);
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== field)
      findings.push(`a deck with a bad ${field} was refused at ${refused}`);
  }

  // 3. A gun amidships, trained abeam to the left.
  type Members = {
    deck: AutoMovieArchetypeAssembly.IMember<
      createDeck.Affordance,
      createDeck.Dimension
    >;
    gun: AutoMovieArchetypeAssembly.IMember<
      createCannon.Affordance,
      createCannon.Dimension
    >;
  };
  type Id = AutoMovieArchetypeAssembly.Ids<Members>;
  const ship: AutoMovieArchetypeAssembly<Members> =
    AutoMovieArchetypeAssembly.of<Members>("ship", "gun deck", {
      deck: {
        archetype: deck,
        placement: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      },
      gun: {
        archetype: createCannon({ kind: "fieldGun" }),
        placement: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    });
  if (!validateModel({ model: ship }).success)
    findings.push("the deck and its gun are not admitted");
  for (const id of ["deck/deck", "gun/muzzle"] as const)
    if (ship.affordances.every((a: { id: string }): boolean => a.id !== id))
      findings.push(`the assembly lacks ${id}`);

  // 4. Steaming on a swell; a knot is one international nautical mile, 1 852 m, an hour.
  const knots: number = 1852 / 3600;
  const cruise: number = 11 * knots;
  const length: number = createDeck.REFERENCE.length;
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length }],
    cruise,
    startSpeed: cruise,
    endSpeed: cruise,
  };
  const sea: AutoMovieArchetypeSea.IOptions = {
    height: 1.25,
    heading: 90,
    seed: 1035,
  };
  const still: AutoMovieArchetypeRide.IRide<Id, never> =
    AutoMovieArchetypeRide.along(ship, course);
  const floating: AutoMovieArchetypeRide.IRide<Id, never> =
    AutoMovieArchetypeSea.float(still, AutoMovieArchetypeSea.of(sea));
  const again: AutoMovieArchetypeRide.IRide<Id, never> =
    AutoMovieArchetypeSea.float(
      AutoMovieArchetypeRide.along(ship, course),
      AutoMovieArchetypeSea.of(sea),
    );
  const calm: AutoMovieArchetypeRide.IRide<Id, never> =
    AutoMovieArchetypeSea.float(
      still,
      AutoMovieArchetypeSea.of({ ...sea, height: 0 }),
    );
  const surface: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of(sea);
  const within = (seconds: number): IAutoMovieTransform => {
    const frame: IAutoMovieTransform = floating.frame("deck/deck", seconds);
    const muzzle: IAutoMovieTransform = floating.frame("gun/muzzle", seconds);
    const inverse: IAutoMovieTransform["rotation"] = Quaternion.inverse(
      frame.rotation,
    );
    return {
      translation: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(muzzle.translation, frame.translation),
      ),
      rotation: Quaternion.multiply(inverse, muzzle.rotation),
      scale: { x: 1, y: 1, z: 1 },
    };
  };
  const first: IAutoMovieTransform = within(0);
  for (let seconds: number = 0; seconds <= still.duration; seconds += 0.5) {
    const base: IAutoMovieTransform = still.at(seconds).placement;
    const moved: IAutoMovieTransform = floating.at(seconds).placement;
    const heave: number = moved.translation.y - base.translation.y;
    if (
      Math.abs(
        heave -
          surface.elevation(base.translation.x, base.translation.z, seconds),
      ) > EPSILON
    )
      findings.push(`the deck does not heave with the sea at ${seconds} s`);
    const tilt: number =
      2 *
      Math.acos(
        Math.min(
          1,
          Math.abs(
            moved.rotation.w * base.rotation.w +
              moved.rotation.x * base.rotation.x +
              moved.rotation.y * base.rotation.y +
              moved.rotation.z * base.rotation.z,
          ),
        ),
      );
    if (tilt > Math.SQRT2 * Math.atan(surface.steepest) + EPSILON)
      findings.push(`the deck tilts ${tilt} rad at ${seconds} s`);
    const now: IAutoMovieTransform = within(seconds);
    const drift: IAutoMovieVector3 = Vector3.subtract(
      now.translation,
      first.translation,
    );
    if (Math.hypot(drift.x, drift.y, drift.z) > EPSILON)
      findings.push(`the gun moves on the deck at ${seconds} s`);
    const twin: IAutoMovieTransform = again.at(seconds).placement;
    if (
      twin.translation.y !== moved.translation.y ||
      twin.rotation.w !== moved.rotation.w
    )
      findings.push(`one seed rode two ways at ${seconds} s`);
    const level: IAutoMovieTransform = calm.at(seconds).placement;
    if (
      level.translation.y !== base.translation.y ||
      Math.abs(level.rotation.w - base.rotation.w) > 1e-12
    )
      findings.push(`a calm sea moved the deck at ${seconds} s`);
  }
  TestValidator.equals(
    "a ship's deck is guarded, carries a gun and rides the swell",
    findings,
    [],
  );
}
