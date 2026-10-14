import { IAutoMovieForgedProp } from "../../../../packages/engine/src/film/IAutoMovieForgedProp";
import { IAutoMovieClip, IAutoMoviePropArticulation } from "@automovie/interface";
import { IAutoMovieResolveOutput } from "../../../../packages/engine/src/resolve/IAutoMovieResolveOutput";
import { IAutoMovieResolveViolation } from "../../../../packages/engine/src/resolve/IAutoMovieResolveViolation";
import { forgeProp } from "../../../../packages/engine/src/film/forgeProp";
import { resolveFrame } from "../../../../packages/engine/src/resolve/resolveFrame";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose } from "../internal/predicates";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
/** Quat values for a rotation of `deg` about +Y. */
function yQuat (deg: number): number[] {
  const half: number = (deg * Math.PI) / 360;
  return [0, Math.sin(half), 0, Math.cos(half)];
}

function swing (deg: number): IAutoMovieClip { return ({
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
}); }

function basisX (m: number[]): [number, number, number] { return [m[0]!, m[1]!, m[2]!]; }

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
 *    follows the hinge (the declared copy driver drives).
 * 2. An over-limit 150° swing clamps to exactly the 110° unit quaternion, the
 *    hinge's world X basis lands at `(cos110°, 0, −sin110°)`, with the
 *    violations tagged by the forged profile's id.
 *
 * @evidence contracts/testing.md#behavioral-verification Feeds the forged articulation into resolveFrame; an in-range rotation produces no violations and copied world orientation, while an over-range rotation reports the authored profile and clamps to the supported boundary.
 * @evidence contracts/testing.md#independent-expectations Y-axis rotation maps +X to (cos(angle),0,-sin(angle)); the fixture's sin55/cos55 component bounds clamp a 150-degree key to the unit 110-degree endpoint. Trigonometric expected bases and nclose predicates are independent of the resolver output, while this case proves no visual door appearance.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the same forged graph and copy driver while changing 90-degree legal travel to 150-degree excess; both no-violation and profile-tagged refusal outcomes are required. Graph admission and scene placement composition belong to the paired forge gates and scene integration tests.
 * @evidence contracts/testing.md#execution-ownership The runner discovers this synchronous test; it owns two portable numerical forge/resolve cases over authored data and starts no renderer or external host.
 */
export function test_film_forge_prop_door (): void {
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
  const mirrorX: [number, number, number] = basisX(open.world.get("handleMirror")!);
  TestValidator.equals(
    "declared driver mirrors the hinge",
    namedFacts([
      ["mirrorLeftPlusX", () : boolean => nclose(mirrorX[0], 0)],
      ["mirrorFacesMinusZ", () : boolean => nclose(mirrorX[2], -1)],
    ]),
    { mirrorLeftPlusX: true, mirrorFacesMinusZ: true },
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
      ["overSwingRefused", () : boolean => slammed.violations.length > 0],
      [
        "taggedByForgedProfile",
        () : boolean => slammed.violations.every((v: IAutoMovieResolveViolation) : boolean => v.profile === "door-profile"),
      ],
    ]),
    { overSwingRefused: true, taggedByForgedProfile: true },
  );
  const cos110: number = Math.cos((110 * Math.PI) / 180);
  const sin110: number = Math.sin((110 * Math.PI) / 180);
  const slammedX: [number, number, number] = basisX(slammed.world.get("hinge")!);
  TestValidator.equals(
    "over-swing clamps to exactly 110°",
    namedFacts([
      ["ncloseSlammedXCos110", () : boolean => nclose(slammedX[0], cos110)],
      ["ncloseSlammedX", () : boolean => nclose(slammedX[1], 0)],
      ["ncloseSlammedXSin110", () : boolean => nclose(slammedX[2], -sin110)],
    ]),
    {
      ncloseSlammedXCos110: true,
      ncloseSlammedX: true,
      ncloseSlammedXSin110: true,
    },
  );
}
