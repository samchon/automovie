import {
  AutoMovieArchetypeFrame,
  createAppliance,
  createCymbal,
  createDrumstick,
  createInstrument,
  createRailCarriage,
  createRailPlatform,
  createViolinBow,
  createZipperPouch,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Measure standalone platform and music contacts and verify linked motions on the pouch, piano and refrigerator.
 *
 * Scenarios:
 * 1. The parked carriage and platform have level boarding across a positive horizontal gap of at most three inches.
 * 2. The drumstick follows the 5A dimensions, and its grip and strike sites lie on an axial line outside its shaft.
 * 3. The cymbal edge sits at the plate rim, its bell is raised, and the violin bow spans the measured hair length with downward end contacts.
 * 4. The zipper moves its two pinch sites together above the fixed brace. Its seam starts opening beside the slider before the far pair and closes again at zero.
 * 5. The piano pedal descends about its hinge without moving a key. The refrigerator pull turns with its own door.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the public parts, local measurements and opened and reset states.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the platform support and ledge, measures the music props and poses the pouch, piano and refrigerator through their articulated contacts.
 * @evidence contracts/development/testing.md#independent-expectations Uses the documented three-inch boarding limit, Vic Firth 5A dimensions, the 16-inch cymbal rim and Birmingham City University bow 10.31 dimensions, then applies independent rigid translation and rotation to the contacts. Fabric and strike acoustics are outside this unit.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks positive boarding clearance, distinct strike and bow-hair sites, closed through reset travel on the zipper, and isolation of adjacent piano and refrigerator contacts.
 * @evidence contracts/development/testing.md#execution-ownership The exported unit runs on locally constructed archetypes without a renderer or host.
 */
export function test_archetype_catalogue_contacts(): void {
  const carriage: ReturnType<typeof createRailCarriage> = createRailCarriage();
  const platform: ReturnType<typeof createRailPlatform> = createRailPlatform({
    id: "station",
  });
  const edge: IAutoMovieVector3 = platform.site("platformEdge").translation;
  const threshold: IAutoMovieVector3 = carriage.site("threshold").translation;
  const thresholdHalfWidth: number =
    carriage.affordance("threshold").width! / 2;
  const gap: number = edge.x - (threshold.x + thresholdHalfWidth);

  TestValidator.predicate(
    "stationary deck and edge align with the carriage threshold",
    platform.id === "station" &&
      !platform.hasArticulations &&
      platform.affordance("platform").kind === "surface" &&
      platform.affordance("platformEdge").kind === "ledge" &&
      nclose(platform.site("platform").translation.y, edge.y) &&
      nclose(threshold.y, edge.y) &&
      gap > 0 &&
      gap <= 3 * 0.0254 &&
      nclose(platform.affordance("platform").width!, 11 * 0.3048) &&
      vclose(AutoMovieArchetypeFrame.axis(platform.site("platformEdge"), "x"), {
        x: 0,
        y: 0,
        z: 1,
      }),
  );

  const stick: ReturnType<typeof createDrumstick> = createDrumstick("stick");
  const grip: IAutoMovieVector3 = stick.site("grip").translation;
  const face: IAutoMovieVector3 = stick.site("face").translation;
  const diameter: number = 0.565 * 0.0254;
  TestValidator.predicate(
    "5A size and axial striking line outside the shaft",
    stick.id === "stick" &&
      nclose(archetypeExtent(stick, "y").size, 16 * 0.0254) &&
      nclose(archetypeExtent(stick, "x", ["shaft"]).size, diameter) &&
      nclose(stick.affordance("grip").aperture!, diameter) &&
      nclose(face.x, grip.x) &&
      nclose(face.z, grip.z) &&
      face.y > grip.y &&
      face.z > diameter / 2,
  );

  const cymbal: ReturnType<typeof createCymbal> = createCymbal();
  const edgeStrike: IAutoMovieVector3 = cymbal.site("edge").translation;
  const bellStrike: IAutoMovieVector3 = cymbal.site("bell").translation;
  const plate: ReturnType<typeof archetypeExtent> = archetypeExtent(
    cymbal,
    "z",
    ["plate"],
  );
  TestValidator.predicate(
    "edge and raised bell expose separate upward strike surfaces",
    nclose(plate.size, 16 * 0.0254) &&
      nclose(edgeStrike.z, plate.low) &&
      nclose(edgeStrike.y, archetypeExtent(cymbal, "y", ["plate"]).high) &&
      bellStrike.y > edgeStrike.y &&
      nclose(bellStrike.y, archetypeExtent(cymbal, "y", ["bell"]).high) &&
      nclose(bellStrike.z, 0),
  );

  const bow: ReturnType<typeof createViolinBow> = createViolinBow();
  const hairFrog: IAutoMovieVector3 = bow.site("hairFrog").translation;
  const hairTip: IAutoMovieVector3 = bow.site("hairTip").translation;
  const ribbon: ReturnType<typeof archetypeExtent> = archetypeExtent(bow, "x", [
    "ribbon",
  ]);
  TestValidator.predicate(
    "bow hair contacts lie at the measured ribbon endpoints facing the string",
    nclose(archetypeExtent(bow, "x").size, 0.745) &&
      nclose(ribbon.size, 0.649) &&
      nclose(hairFrog.x, ribbon.low) &&
      nclose(hairTip.x, ribbon.high) &&
      nclose(hairFrog.y, hairTip.y) &&
      nclose(hairTip.y, archetypeExtent(bow, "y", ["ribbon"]).low) &&
      vclose(AutoMovieArchetypeFrame.axis(bow.site("hairFrog"), "y"), {
        x: 0,
        y: -1,
        z: 0,
      }) &&
      vclose(AutoMovieArchetypeFrame.axis(bow.site("hairTip"), "y"), {
        x: 0,
        y: -1,
        z: 0,
      }),
  );
  const pouch: ReturnType<typeof createZipperPouch> = createZipperPouch();
  const stroke: number = pouch.affordance("zipper").travel!;
  const partial: ReturnType<typeof createZipperPouch> = pouch.articulate({
    zipper: stroke / 2,
  });
  const open: ReturnType<typeof createZipperPouch> = pouch.articulate({
    zipper: stroke,
  });
  const reset: ReturnType<typeof createZipperPouch> = open.articulate({
    zipper: 0,
  });

  for (const contact of ["thumb", "index", "brace"] as const) {
    const start: IAutoMovieVector3 = pouch.site(contact).translation;
    TestValidator.predicate(
      contact + " follows its owning part",
      vclose(open.site(contact).translation, {
        ...start,
        x: start.x + (contact === "brace" ? 0 : stroke),
      }) && vclose(reset.site(contact).translation, start),
    );
  }

  for (const side of [-1, 1] as const) {
    const first = `hinge-lip-0-${side}` as const;
    const last = `hinge-lip-3-${side}` as const;
    TestValidator.predicate(
      `seam side ${side} opens from the slider start and resets`,
      nclose(pouch.travel(first), 0) &&
        partial.travel(first) > 0 &&
        nclose(partial.travel(last), 0) &&
        open.travel(last) > 0 &&
        nclose(reset.travel(first), 0) &&
        nclose(reset.travel(last), 0),
    );
  }

  const piano: ReturnType<typeof createInstrument> = createInstrument({
    kind: "uprightPiano",
  });
  const pedal: IAutoMovieVector3 = piano.site("damperPedal").translation;
  const pivot: IAutoMovieVector3 = piano.site("damperPedalHinge").translation;
  const angle: number = piano.affordance("damperPedalHinge").travel!;
  const pressed: ReturnType<typeof createInstrument> = piano.articulate({
    damperPedalHinge: angle,
  });
  const theta: number = (angle * Math.PI) / 180;
  const lever: number = pedal.z - pivot.z;
  TestValidator.predicate(
    "the right pedal projects forward and rotates down without coupling to a key",
    pedal.x > 0 &&
      lever > 0 &&
      nclose(pivot.y, pedal.y) &&
      piano.affordance("damperPedal").kind === "pedal" &&
      vclose(pressed.site("damperPedal").translation, {
        x: pedal.x,
        y: pivot.y - lever * Math.sin(theta),
        z: pivot.z + lever * Math.cos(theta),
      }) &&
      vclose(pressed.site("key1").translation, piano.site("key1").translation),
  );

  const fridge: ReturnType<typeof createAppliance> = createAppliance({
    kind: "refrigerator",
  });
  const pull: IAutoMovieVector3 = fridge.site("fridgeHandle").translation;
  const hinge: IAutoMovieVector3 = fridge.site("fridgeDoor").translation;
  const turned: ReturnType<typeof createAppliance> = fridge.articulate({
    fridgeDoor: 90,
  });
  TestValidator.predicate(
    "the upper pull runs vertically on the free side and follows its own hinge",
    pull.x < hinge.x &&
      vclose(AutoMovieArchetypeFrame.axis(fridge.site("fridgeHandle"), "x"), {
        x: 0,
        y: 1,
        z: 0,
      }) &&
      vclose(turned.site("fridgeHandle").translation, {
        x: hinge.x + (pull.z - hinge.z),
        y: pull.y,
        z: hinge.z - (pull.x - hinge.x),
      }) &&
      vclose(
        turned.site("freezerHandle").translation,
        fridge.site("freezerHandle").translation,
      ),
  );
}
