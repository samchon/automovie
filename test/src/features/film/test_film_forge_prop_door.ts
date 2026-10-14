import {
  IAutoMovieClip,
  IAutoMoviePropArticulation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieForgedProp } from "@automovie/engine";
import { forgeProp } from "@automovie/engine";
import { IAutoMovieResolveOutput } from "@automovie/engine";
import { IAutoMovieResolveViolation } from "@automovie/engine";
import { resolveFrame } from "@automovie/engine";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
import { namedFacts, nclose } from "../internal/predicates";

/**
 * Quaternion components for a declared degree turn about +Y.
 *
 * The standard half-angle sine/cosine formula constructs authored clip input
 * independently of resolveFrame; the owning test derives expected world bases.
 */
function yQuat(deg: number): number[] {
  const half: number = (deg * Math.PI) / 360;
  return [0, Math.sin(half), 0, Math.cos(half)];
}

/**
 * Build the original one-key hinge rotation clip without sampling it.
 *
 * The owner contrasts 90-degree and 150-degree authored turns. Interpolation
 * between keys and looping are outside this one-key fixture.
 */
function swing(deg: number): IAutoMovieClip {
  return {
    id: "swing",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "hinge", path: "rotation" },
        times: [0],
        values: yQuat(deg),
        interpolation: "linear",
      },
    ],
  };
}

/**
 * Read the column-major world matrix's local X basis.
 *
 * Indexes zero through two are observed output; the owning test derives the
 * expected components separately from Y-axis rotation trigonometry.
 */
function basisX(m: number[]): [number, number, number] {
  return [m[0]!, m[1]!, m[2]!];
}

/**
 * The authored-data-to-executable-constraint round trip: a door forged by
 * forgeProp, not hand-assembled, drives resolveFrame, and the constraint the
 * author declared as data clamps and reports while the declared driver drives.
 * This is the #603 promise made whole: an agent ships a spec, the engine
 * enforces it.
 *
 * Scenarios:
 *
 * 1. The forged spec passes the gates, and its articulation feeds resolveFrame
 *    directly: an in-range 90° swing produces no violations and the mirror node
 *    has the expected X/Z components of its world X basis.
 * 2. An over-limit 150° swing clamps to the 110° endpoint within `1e-6`, the
 *    hinge's world X basis lands at `(cos110°, 0, −sin110°)`, with the
 *    violations tagged by the forged profile's id.
 *
 * @evidence contracts/testing.md#behavioral-verification Feeds the forged articulation into resolveFrame; an in-range rotation produces no violations and the mirror's expected world X-basis X/Z components, while an over-range rotation reports the authored profile and has the hinge's expected three-component endpoint basis.
 * @evidence contracts/testing.md#independent-expectations Y-axis rotation maps +X to (cos(angle),0,-sin(angle)); the fixture's sin55/cos55 component bounds clamp a 150-degree key to the unit 110-degree endpoint. Trigonometric expected bases and nclose predicates are independent of the resolver output, while this case proves no visual door appearance.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the same forged graph and copy driver while changing 90-degree legal travel to 150-degree excess; both no-violation and profile-tagged refusal outcomes are required. Graph admission and scene placement composition belong to the paired forge gates and scene integration tests.
 * @evidence contracts/testing.md#execution-ownership The runner discovers this synchronous test; it owns two portable numerical forge/resolve cases over authored data and starts no renderer or external host.
 */
export function test_film_forge_prop_door(): void {
  const forged: IAutoMovieForgedProp = forgeProp(createDoorPropSpec());
  TestValidator.equals("the door forges", forged.success, true);
  if (forged.success !== true) return;

  const articulation: IAutoMoviePropArticulation = forged.prop.articulation!;
  const open: IAutoMovieResolveOutput = resolveFrame({
    nodes: articulation.nodes,
    clip: swing(90),
    limits: [],
    profiles: [
      { profile: articulation.profile, binding: articulation.binding },
    ],
    seconds: 0,
  });
  TestValidator.equals("90° swing passes", open.violations.length, 0);
  const mirrorX: [number, number, number] = basisX(
    open.world.get("handleMirror")!,
  );
  TestValidator.predicate(
    "declared driver mirrors the hinge",
    (): boolean => nclose(mirrorX[0], 0) && nclose(mirrorX[2], -1),
  );

  const slammed: IAutoMovieResolveOutput = resolveFrame({
    nodes: articulation.nodes,
    clip: swing(150),
    limits: [],
    profiles: [
      { profile: articulation.profile, binding: articulation.binding },
    ],
    seconds: 0,
  });
  TestValidator.equals(
    "over-swing violations tagged by the forged profile",
    namedFacts([
      ["overSwingRefused", (): boolean => slammed.violations.length > 0],
      [
        "taggedByForgedProfile",
        (): boolean =>
          slammed.violations.every(
            (v: IAutoMovieResolveViolation): boolean =>
              v.profile === "door-profile",
          ),
      ],
    ]),
    { overSwingRefused: true, taggedByForgedProfile: true },
  );
  const cos110: number = Math.cos((110 * Math.PI) / 180);
  const sin110: number = Math.sin((110 * Math.PI) / 180);
  const slammedX: [number, number, number] = basisX(
    slammed.world.get("hinge")!,
  );
  TestValidator.predicate(
    "over-swing clamps to the 110° basis within 1e-6",
    (): boolean =>
      nclose(slammedX[0], cos110) &&
      nclose(slammedX[1], 0) &&
      nclose(slammedX[2], -sin110),
  );
}
