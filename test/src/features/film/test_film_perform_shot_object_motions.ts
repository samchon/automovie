import type { IAutoMovieCompiledDefinedShot } from "../../../../packages/engine/src/film/IAutoMovieCompiledDefinedShot";
import type { IAutoMovieClip, IAutoMovieNode } from "@automovie/interface";
import type { IAutoMovieAuthoringDiagnostic } from "../../../../packages/engine/src/film/IAutoMovieAuthoringDiagnostic";
import { sceneToNodes } from "../../../../packages/engine/src/resolve/sceneToNodes";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
import { HINGE } from "../internal/HINGE";
import { swingClip } from "../internal/swingClip";
import { compileDoorShot } from "../internal/compileDoorShot";

/**
 * A source can turn a door, and the compiled shot carries the turn.
 *
 * Every entry on a compiled shot's `objectMotions` used to be baked by the
 * engine from a `launch` or an `attachTo`, so the two contracts that promise a
 * door swings on screen — a building opening's panel placements, a prop's
 * declared articulation — were both true of the record and unreachable from a
 * shot. This case is the reachability: the authored clip survives compilation,
 * addresses the joint the scene actually lowers, and the joint id is derivable
 * from the artifact rather than guessed.
 *
 * Scenarios:
 *
 * 1. A shot that authors nothing compiles with exactly the clips the engine baked
 *    for it, here the torch's follow: the field costs a shot that says nothing
 *    about its objects exactly what it cost before.
 * 2. A 90° swing over the prop's lowered hinge compiles, and the compiled shot
 *    carries that clip on `objectMotions` BESIDE the baked follow rather than
 *    instead of it, addressing the same node id `sceneToNodes` lowers the
 *    prop's hinge under.
 * 3. A staged set piece no prop registry mentions is drivable too: this is the
 *    building panel's own path (`<environment>/<element>`), so a swinging leaf
 *    and a swinging panel need one mechanism rather than two.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles the same staged duel with no authored motion, a prop-hinge rotation and a set-panel rotation; returned clip identities, channel addresses and sceneToNodes membership prove accepted authored motion survives beside the baked torch follow.
 * @evidence contracts/testing.md#independent-expectations Expected clip lists come from the authored registrations and the attachTo action's documented baked identity. Hinge identity follows placementChildNode's placement/joint contract; sceneToNodes is an integration observation of lowering rather than an independent geometry oracle, and this case proves no rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty authored clips, one articulated joint and a scene set piece with no prop registry entry. The paired object_motion_gates test owns invalid addresses, authority conflicts, travel violations and interpolated quaternion limits; no rejection assertions are removed here.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_perform_shot_object_motions; its helper compiles portable in-memory TypeScript data through defineShot and compileDefinedShot, and this function owns three cases without a browser, native renderer or external consumer.
 */
export function test_film_perform_shot_object_motions (): void {
  const silent: IAutoMovieCompiledDefinedShot = compileDoorShot();
  TestValidator.equals(
    "a shot that authors no object motion carries only what the engine baked",
    silent.success === true
      ? silent.source.shot.objectMotions.map((clip: IAutoMovieClip) : string => clip.id)
      : silent.diagnostics.map(
          (diagnostic: IAutoMovieAuthoringDiagnostic) : string => `${diagnostic.path} ${diagnostic.fact}`,
        ),
    ["attach:torch"],
  );

  const swung: IAutoMovieCompiledDefinedShot = compileDoorShot({
    objectMotions: [swingClip("door-swing", HINGE, 90)],
  });
  TestValidator.equals(
    "the authored swing reaches the compiled shot, beside the baked follow",
    swung.success === true
      ? swung.source.shot.objectMotions.map((clip: IAutoMovieClip) : (string | null)[] => [
          clip.id,
          clip.tracks[0]!.channel.kind === "node"
            ? clip.tracks[0]!.channel.node
            : null,
        ])
      : swung.diagnostics.map((diagnostic: IAutoMovieAuthoringDiagnostic) : string[] => [
          diagnostic.path,
          diagnostic.fact,
        ]),
    [
      ["attach:torch", "torch"],
      ["door-swing", HINGE],
    ],
  );
  TestValidator.equals(
    "the driven node is the one the compiled artifact lowers the hinge under",
    namedFacts([
      ["compiled", () : boolean => swung.success === true],
      [
        "lowersTheDrivenNode",
        () : boolean =>
          swung.success === true &&
          sceneToNodes({
            scene: swung.source.scene,
            props: { door: createDoorPropSpec() },
            allowPartialModels: true,
          })
            .map((node: IAutoMovieNode) : string => node.id)
            .includes(HINGE),
      ],
    ]),
    { compiled: true, lowersTheDrivenNode: true },
  );

  const panel: IAutoMovieCompiledDefinedShot = compileDoorShot({
    objectMotions: [swingClip("panel-swing", "hall/panel", 30)],
  });
  TestValidator.equals(
    "a staged set piece is drivable on the same channel",
    panel.success === true
      ? panel.source.shot.objectMotions.map((clip: IAutoMovieClip) : string => clip.id)
      : panel.diagnostics.map((diagnostic: IAutoMovieAuthoringDiagnostic) : string => diagnostic.fact),
    ["attach:torch", "panel-swing"],
  );
}
