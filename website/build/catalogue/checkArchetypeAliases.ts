import {
  Archetype,
  ArchetypeFrame,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { GalleryAddress } from "../../src/gallery/GalleryAddress";
import { GalleryArchetype } from "../../src/gallery/package/GalleryArchetype";
import { GalleryCatalogue } from "../../src/gallery/package/GalleryCatalogue";
import { PlaygroundAddress } from "../../src/playground/PlaygroundAddress";
import { PlaygroundObjects } from "../../src/playground/package/PlaygroundObjects";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SceneArchetype } from "../../src/scenes/package/SceneArchetype";

/** A version-two composition encoded by the original lz-string writer. */
const SAVED_LINK: string =
  "#c=N4IgbgpgTgzglgewHYgFwCYA0IYQgEzRwENJ8BaGAYwiQhGwAdoAzBKAW2hjQG0BdbBwCuAF2HEANj1QDsCAEYArCFVEzeoGMOWrRRSbRjkWcAB7io9JlAT5hNKESpXioiABEIYODQYgAazgkQlQQKmIuKGJ-XAIiAHZ-MzQARmwATzQABgA6AA5sAC80LBAM4gB3NABObIBfTC0dFTUiAjhRckliRlEERn9GW3tHZ1d3AGkIDIUEYihCbCCQg17+wew40JAk7BTUcnTytOLT8qq0-OzsUzN41FEoYQhG5t02sJhSAnJGAAtkNYQMM7A5oOMIG5PN5fMCVjsAUChgtIjJQJU4PhRP8crlsgljv8IHAAOb-fSoPKpACsxxxvgCdBgMjy2Wy+UaIAONxOVNyNLOh2OFWqqAALDT6vx6kA";

/** Check the site's saved links, seeded animal samples and restored objects. */
export function checkArchetypeAliases(): void {
  const catalogue = GalleryCatalogue.catalogue();
  const listed = catalogue.groups.flatMap((group) =>
    group.subjects.map((subject) => subject.id),
  );
  const animals = {
    horse: "createHorse",
    pony: "createPony",
    donkey: "createDonkey",
    mule: "createMule",
    dog: "createDog",
    cat: "createCat",
    ox: "createOx",
    camel: "createCamel",
    deer: "createDeer",
  } as const;
  const devices = [
    ["createDevice", "phone", "createPhone"],
    ["createDevice", "camera", "createCamera"],
    ["createDevice", "remote", "createRemote"],
    ["createDevice", "tablet", "createTablet"],
    ["createDevice", "walkieTalkie", "createRadio"],
    ["createKeyboard", "keyboard", "createDesktopKeyboard"],
    ["createKeyboard", "laptop", "createLaptop"],
  ] as const;
  for (const [legacy, variant, subject] of [
    ...Object.entries(animals).map(
      ([kind, id]) => ["createQuadruped", kind, id] as const,
    ),
    ...devices,
  ]) {
    assert.deepEqual(
      listed.filter((id) => id === subject),
      [subject],
    );
    assert(!listed.includes(legacy));
    assert.equal(typeof GalleryCatalogue.producer(legacy), "function");
    const request = GalleryAddress.decode(
      `?subject=${legacy}&variant=${variant}&seed=7&affordances=0&move.hinge=63`,
      catalogue,
    );
    assert.deepEqual(request, {
      subject,
      variant: "",
      seed: "7",
      state: { hinge: 63 },
      affordances: false,
    });
    assert.equal(
      new URLSearchParams(GalleryAddress.encode(request)).get("subject"),
      subject,
    );
  }
  assert.equal(
    GalleryAddress.decode("?subject=createQuadruped", catalogue).subject,
    "createHorse",
  );
  assert.equal(
    GalleryAddress.decode("?subject=createDoor&variant=hinged", catalogue)
      .variant,
    "hinged",
  );
  assert(
    Object.is(GalleryCatalogue.producer("createQuadruped"), createQuadruped),
  );

  for (const [kind, gait, speed] of [
    ["horse", "trot", 3.5],
    ["dog", "walk", 0.75],
  ] as const) {
    const request = {
      subject: "createQuadruped",
      variant: kind,
      seed: "7",
      state: {},
      affordances: true,
    };
    const legacy = GalleryArchetype.build(request).archetype;
    const named = GalleryArchetype.build(
      GalleryAddress.decode(GalleryAddress.encode(request), catalogue),
    ).archetype;
    assert.deepEqual(
      named.dimensions,
      legacy.dimensions,
      `${kind} seeded dimensions`,
    );
    assert.deepEqual(
      named.affordances,
      legacy.affordances,
      `${kind} rest contacts`,
    );
    assert(legacy.body !== null && named.body !== null);
    const course: rideQuadruped.ICourse = {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 9 }],
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
    };
    const oldRide = rideQuadruped(legacy as Archetype, course, gait);
    const newRide = rideQuadruped(named as Archetype, course, gait);
    assert.deepEqual(newRide.instants, oldRide.instants, `${kind} gait events`);
    const landings = newRide.instants.filter(
      (event) => event.label === "leftForeOn" && event.seconds > 0,
    );
    const landing = landings[0]!.seconds;
    const sample = newRide.at(landing);
    assert.deepEqual(
      sample.archetype.parts,
      oldRide.at(landing).archetype.parts,
      `${kind} posed rig at a forefoot landing`,
    );
    assert(
      Math.abs(
        terminalSole(
          sample.archetype.parts.find((part) => part.id === "leftForePastern")!,
          sample.placement,
        ),
      ) <= 0.001,
      `${kind} forefoot reaches the ground at landing`,
    );
    if (kind === "dog") {
      // Legacy seed "7" gives this tempo. Light et al. 2010 Table 1
      // supplies the pooled mean and standard deviation in seconds.
      const expected = 1.11 + 0.7686978130595332 * 0.13;
      assert(
        Math.abs(landings[1]!.seconds - landing - expected) <= 1e-9,
        "the seeded dog's actual stride uses its recorded tempo",
      );
    }
  }

  const dog = GalleryAddress.decode(
    "?subject=createQuadruped&variant=dog&seed=7",
    catalogue,
  );
  const collared = {
    mass: 22,
    collar: {
      width: 0.02,
      thickness: 0.003,
      leadLength: 0.6,
      leadRadius: 0.004,
    },
  };
  const oldLead = GalleryCatalogue.producer("createQuadruped")!(
    { ...collared, kind: "dog" },
    dog.seed,
  ).affordance("lead");
  const newLead = GalleryCatalogue.producer(dog.subject)!(
    collared,
    dog.seed,
  ).affordance("lead");
  assert.deepEqual(newLead, oldLead, "the named dog's lead retains its frame");

  const restored = PlaygroundAddress.decode(SAVED_LINK)!;
  assert.equal(PlaygroundAddress.encode(restored), SAVED_LINK);
  const savedObjects = restored.objects!;
  const names = ["createCamera", "createLaptop", "createPhone"] as const;
  const canonical: IPlaygroundComposition = {
    ...restored,
    version: 3,
    objects: savedObjects.map((object, index) => ({
      ...object,
      producer: names[index]!,
      kind: undefined,
    })),
  };
  const namedObjects = PlaygroundAddress.decode(
    PlaygroundAddress.encode(canonical),
  )!.objects!;
  const placed = PlaygroundObjects.props(savedObjects)!;
  const namedPlaced = PlaygroundObjects.props(namedObjects)!;
  assert.deepEqual(
    placed.map((prop) => prop.subject),
    ["lens-fixture", "edit-laptop", "saved-phone"],
  );
  assert.deepEqual(placed[0]!.frame.position, { x: 1, y: 0.8, z: 2 });
  assert(Math.abs(placed[0]!.frame.rotation.y - Math.SQRT1_2) <= 1e-9);
  assert(Math.abs(placed[0]!.frame.rotation.w - Math.SQRT1_2) <= 1e-9);
  assert.equal(placed[1]!.fixed, true);
  assert.deepEqual(placed[1]!.frame.position, { x: -1, y: 1, z: 1 });
  assert(Math.abs(placed[1]!.frame.rotation.y - 1) <= 1e-9);
  assert(Math.abs(placed[1]!.frame.rotation.w) <= 1e-9);
  const phone = SceneArchetype.model(savedObjects[2]!);
  assert(phone instanceof Archetype);
  assert.equal(phone.dimensions.width, 0.071);
  assert.equal(phone.dimensions.height, 0.151);
  assert.equal(phone.dimensions.thickness, 0.008);
  for (const [index, contact] of ["support", "homeRow", "screen"].entries()) {
    const oldProp = placed[index]!;
    const newProp = namedPlaced[index]!;
    assert.equal(newProp.subject, oldProp.subject);
    assert.deepEqual(newProp.frame, oldProp.frame);
    assert(oldProp.points[contact] !== undefined);
    assert.deepEqual(newProp.points[contact], oldProp.points[contact]);
    assert.deepEqual(
      SceneArchetype.model(namedObjects[index]!),
      SceneArchetype.model(savedObjects[index]!),
    );
  }
}

/** Lowest world point of the complete terminal rod, including its radius. */
function terminalSole(
  part: IAutoMovieModelPart,
  frame: IAutoMovieTransform,
): number {
  assert(part.transform && part.geometry.type === "primitive");
  const shape = part.geometry.shape;
  assert(shape.type === "capsule" || shape.type === "cylinder");
  const axis = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, part.transform.rotation),
    { x: 0, y: 1, z: 0 },
  );
  return (
    ArchetypeFrame.point(frame, part.transform.translation).y -
    (Math.abs(axis.y) * shape.height) / 2 -
    shape.radius * (shape.type === "capsule" ? 1 : Math.hypot(axis.x, axis.z))
  );
}
