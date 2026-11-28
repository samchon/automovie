import { AutoMovieArchetypeDrinkware } from "@automovie/archetypes";
import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Metre rounding for the analytic cylinder and handle projections. */
const ROUNDING: number = 1e-9;

/** A 5 mm contact probe, posed independently of the vessel and its grip. */
const PROBE: IAutoMoviePhysicalShape = {
  id: "contact-probe",
  kind: "sphere",
  material: "test",
  radius: 0.005,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
};

/** The vessel lies in its own frame for a direct radial probe. */
const ORIGIN: IAutoMovieRigidTransform = PROBE.transform;

/** A recorded dimension band from the catalogue's vessel contact campaign. */
interface ISpan {
  /** Minimum allowed dimension, metres. */
  minimum: number;

  /** Maximum allowed dimension, metres. */
  maximum: number;

  /** Lowest value observed over the seeded population, metres. */
  low: number;

  /** Highest value observed over the seeded population, metres. */
  high: number;
}

/**
 * Pin the actual collider and affordance agreement for each of the 200 mug and
 * glass seeds from the catalogue contact sweep.
 *
 * Scenarios:
 * 1. The glass body measures 140–150 mm high and 83–89 mm across. The mug's
 *    body is 3.88 in high and 3.5 in across, and its hook bar is 8–16 mm.
 *    Each varying dimension spans at least 80 percent of its stated band.
 * 2. The power grip straddles the middle of the physical cylinder at its
 *    diameter, the lip lies on the upper +Z rim, and the hook wraps only the
 *    mug bar at its actual width. A glass exposes no hook handle.
 * 3. Opposite palm and thumb probes see the same signed clearance at the
 *    two radial support planes halfway up the cylinder.
 * 4. A 55 mm cup with a tall, thick handle retains the hook at the centre of
 *    the emitted bar when the lower stub is placed at the base.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the seeded band, radial contact, grip availability and short-cup bar centre witnesses.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public factory and observes emitted colliders, named affordances and signed distances to a sphere probe.
 * @evidence contracts/development/testing.md#independent-expectations Uses sourced body bands and measures the hook against the emitted bar. The shorter cup distinguishes the hook at the bar centre from one fixed at the vessel midpoint.
 */
export function test_archetypes_props_drinkware_contact_frames(): void {
  const failures: Map<string, string> = new Map();
  const kinds: readonly ("glass" | "mug")[] = ["glass", "mug"];
  for (const kind of kinds) {
    const spans: Record<"height" | "diameter", ISpan> = {
      height:
        kind === "glass"
          ? span(0.14, 0.15)
          : span(3.88 * 0.0254, 3.88 * 0.0254),
      diameter:
        kind === "glass"
          ? span(0.083, 0.089)
          : span(3.5 * 0.0254, 3.5 * 0.0254),
    };
    const bar: ISpan = span(0.008, 0.016);
    for (let seed: number = 0; seed < 200; ++seed) {
      const vessel: ReturnType<typeof AutoMovieArchetypeDrinkware.create> = AutoMovieArchetypeDrinkware.create(
        { kind },
        seed,
      );
      const shapes: IAutoMoviePhysicalShape[] = vessel.shapes();
      const height: number = archetypeExtent(shapes, "y", ["body"]).high;
      const radius: number = archetypeExtent(shapes, "z", ["body"]).high;
      const bodyGrip: IAutoMovieAffordance = vessel.affordance("body");
      const lip: IAutoMovieAffordance = vessel.affordance("lip");
      if (!admit(spans.height, height))
        failures.set(`${kind}/height`, `${kind}@${seed}: height ${height}`);
      if (!admit(spans.diameter, 2 * radius))
        failures.set(`${kind}/diameter`, `${kind}@${seed}: diameter ${2 * radius}`);
      if (
        bodyGrip.grip !== "power" ||
        bodyGrip.symmetry !== "round" ||
        bodyGrip.aperture === undefined ||
        !nclose(bodyGrip.aperture, 2 * radius, ROUNDING) ||
        !vclose(
          bodyGrip.frame.translation,
          { x: 0, y: height / 2, z: 0 },
          ROUNDING,
        ) ||
        bodyGrip.length === undefined ||
        !nclose(bodyGrip.length, height, ROUNDING)
      )
        failures.set(`${kind}/body`, `${kind}@${seed}: body grip misses its cylinder`);
      if (
        lip.kind !== "ledge" ||
        !vclose(lip.frame.translation, { x: 0, y: height, z: radius }, ROUNDING)
      )
        failures.set(`${kind}/lip`, `${kind}@${seed}: the lip misses the top rim`);

      const cylinder: IAutoMoviePhysicalShape | undefined = shapes.find(
        (shape: IAutoMoviePhysicalShape): boolean => shape.id === "body",
      );
      if (cylinder === undefined || !radialClearance(cylinder, radius, height))
        failures.set(
          `${kind}/contact`,
          `${kind}@${seed}: the cylinder's opposing support planes miss their contact probes`,
        );

      if (kind === "glass") {
        if (vessel.affordances.some((entry: IAutoMovieAffordance): boolean => entry.id === "handle"))
          failures.set("glass/handle", `glass@${seed}: unexpectedly declares a hook handle`);
      } else {
        const width: number = archetypeExtent(shapes, "z", ["handle"]).size;
        const handle: IAutoMovieAffordance = vessel.affordance("handle");
        if (
          !admit(bar, width) ||
          handle.grip !== "hook" ||
          handle.aperture === undefined ||
          !nclose(handle.aperture, width, ROUNDING)
        )
          failures.set("mug/handle", `mug@${seed}: the hook does not span its ${width} m bar`);
      }
    }

    for (const [axis, band] of Object.entries(spans))
      if (!spreads(band))
        failures.set(`${kind}/${axis}/spread`, `${kind} ${axis} does not span its sourced band`);
    if (kind === "mug" && !spreads(bar))
      failures.set("mug/bar/spread", "mug hook bars do not span their sourced band");
  }

  const cup: ReturnType<typeof AutoMovieArchetypeDrinkware.create> =
    AutoMovieArchetypeDrinkware.create({
      kind: "cup",
      handleDiameter: 0.016,
      handleLoop: AutoMovieArchetypeDrinkware.LOOP.handleLoop.maximum,
    });
  const cupBar: ReturnType<typeof archetypeExtent> = archetypeExtent(
    cup.shapes(),
    "y",
    ["handle"],
  );
  if (!nclose(cup.affordance("handle").frame.translation.y, (cupBar.low + cupBar.high) / 2, ROUNDING))
    failures.set("cup/handle", "the short cup hook misses the centre of its bar");

  TestValidator.equals("seeded vessel contact geometry", [...failures.values()], []);
}

/** Check the signed distance to a sphere on each radial support line. */
function radialClearance(
  cylinder: IAutoMoviePhysicalShape,
  radius: number,
  height: number,
): boolean {
  const directions: readonly number[] = [-1, 1];
  const clearances: readonly number[] = [-0.002, 0, 0.002];
  for (const direction of directions)
    for (const clearance of clearances) {
      const position: IAutoMovieRigidTransform = {
        position: {
          x: 0,
          y: height / 2,
          z: direction * (radius + 0.005 + clearance),
        },
        rotation: ORIGIN.rotation,
      };
      if (!nclose(
        AutoMovieEnginePhysics.physicalShapePairDistance(ORIGIN, cylinder, position, PROBE),
        clearance,
        ROUNDING,
      )) return false;
    }
  return true;
}

/** Start measuring a fixed source band. */
function span(minimum: number, maximum: number): ISpan {
  return { minimum, maximum, low: Infinity, high: -Infinity };
}

/** Include an in-band measurement in the observed span. */
function admit(band: ISpan, value: number): boolean {
  if (!(value >= band.minimum - ROUNDING && value <= band.maximum + ROUNDING))
    return false;
  band.low = Math.min(band.low, value);
  band.high = Math.max(band.high, value);
  return true;
}

/** Compare the populated span to the original 80-percent campaign bound. */
function spreads(band: ISpan): boolean {
  return band.high - band.low + ROUNDING >= 0.8 * (band.maximum - band.minimum);
}
