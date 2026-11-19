import type {
  IAutoMovieHumanBonePlacement,
  IAutoMovieHumanSkeleton,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  buildPolygonShotActor,
  renderAutoMovieFilmFrame,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";
import { createHumanPolygonFixture } from "../internal/createHumanPolygonFixture";
import { vclose } from "../internal/vclose";

/**
 * Samples presentation cues through the actual polygon mesh world matrices.
 *
 * Scenarios:
 *
 * 1. A bend starts from the live pose and uses the posed forearm's local axes and joint pivot to carry the hand.
 * 2. A detaching forearm and hand start where the moving actor was at the exact fractional cue time. They translate and turn in shot world, then hold. Layer source frame 17 supplies the midpoint at 4 fps.
 * 3. The other actor's cue has no effect. The unaffected head and the attached arm continue moving with the actor while existing meshes and buffers survive forward and reverse seeks.
 * 4. A malformed live placement or staging frame at a different source time is refused while attached and detached parts retain their last displayed positions.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds through buildPolygonShotActor and seeks through drawLayer, including film pass preparation. It probes registered Three meshes and compares mesh and geometry identities. The checks distinguish wrong cue subject, pivot, frame, release pose, interpolation and seek history.
 * @evidence contracts/development/testing.md#independent-expectations The actor's positive Y quarter-turn maps (x,y,z) to (z,y,-x). The forearm's positive Z quarter-turn maps its X axis to body Y, so the bend turns the hand offset from body Z to body X. The detachment turns a shot-world -Z offset toward -X while moving its pivot along shot-world X. The probes use these rigid-transform relations without testing silhouette quality.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers bend onset and completion, pre-release live motion, fractional release, intermediate and clamped detach, a foreign subject, unaffected branches and revisits in both directions. Missing and nonnumeric components distinguish malformed source data from admitted placements. Construction and disposal refusal belong to test_viewer_human_polygon.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory drawing and the existing portable compositor fixture exercise the render layer without a display context.
 * @evidence contracts/development/common.md#meaningful-documentation Names the sampled phases, coordinate frames, subject scope and seek behavior.
 */
export function test_render_polygon_body_presentation(): void {
  const input: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed"> =
    createHumanPolygonFixture();
  const quarter: number = Math.SQRT1_2;
  const release: number = 3.25;
  let malformed:
    | "sparse position"
    | "pose rotation"
    | "actor rotation"
    | undefined;
  const { drawing, drawLayer }: ReturnType<typeof buildPolygonShotActor> =
    buildPolygonShotActor({
      opening: input,
      subject: "hero",
      frameRate: { numerator: 4, denominator: 1 },
      shot: {
        id: "shot",
        polygonBodyCues: [
          {
            subject: "hero",
            kind: "bend",
            bone: "leftLowerArm",
            at: 1,
            duration: 1,
            rotation: { x: quarter, y: 0, z: 0, w: quarter },
          },
          {
            subject: "hero",
            kind: "detach",
            bone: "rightLowerArm",
            at: release,
            duration: 2,
            rotation: { x: 0, y: quarter, z: 0, w: quarter },
            translation: { x: 2, y: 0, z: 0 },
          },
          {
            subject: "other",
            kind: "detach",
            bone: "head",
            at: 0,
            duration: 1,
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            translation: { x: 10, y: 0, z: 0 },
          },
        ],
      },
      poseAt: (
        seconds: number,
      ): Pick<IAutoMovieHumanSkeleton.IOutput, "posed"> => ({
        posed: input.posed.map(
          (
            placement: IAutoMovieHumanBonePlacement,
          ): IAutoMovieHumanBonePlacement => {
            switch (placement.bone) {
              case "leftLowerArm":
                return {
                  ...placement,
                  position: [2, 0, 0],
                  rotation: [0, 0, quarter, quarter],
                };
              case "leftHand":
                return { ...placement, position: [2, 0, 1] };
              case "rightLowerArm":
                return { ...placement, position: [seconds, 0, 0] };
              case "rightHand": {
                const hand: IAutoMovieHumanBonePlacement = {
                  ...placement,
                  position: [seconds + 1, 0, 0],
                  rotation: [...placement.rotation],
                };
                if (malformed === "sparse position")
                  Reflect.deleteProperty(hand.position, "2");
                if (malformed === "pose rotation")
                  Reflect.set(hand.rotation, "3", String(hand.rotation[3]));
                return hand;
              }
              default:
                return placement;
            }
          },
        ),
      }),
      actorFrameAt: (seconds: number): IAutoMovieRigidTransform => {
        const frame: IAutoMovieRigidTransform = {
          position: { x: 0, y: seconds, z: 0 },
          rotation: { x: 0, y: quarter, z: 0, w: quarter },
        };
        if (malformed === "actor rotation")
          Reflect.set(frame.rotation, "x", null);
        return frame;
      },
    });
  const actor: THREE.Group = new THREE.Group();
  actor.position.set(2, -3, 1);
  actor.quaternion.set(0, -quarter, 0, quarter);
  actor.add(drawing.object);
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();

  try {
    const hand: THREE.Mesh = drawing.parts.get("rightHand")!;
    const geometry: THREE.BufferGeometry = hand.geometry;
    const vertices: ReturnType<THREE.BufferGeometry["getAttribute"]> =
      geometry.getAttribute("position");

    /** Read an actual mesh point in shot world after a seek. */
    const probe: (
      bone: string,
      expected: [number, number, number],
      localX?: number,
    ) => boolean = (
      bone: string,
      expected: [number, number, number],
      localX: number = 0,
    ): boolean =>
      vclose(
        new THREE.Vector3(localX, 0, 0).applyMatrix4(
          drawing.parts.get(bone)!.matrixWorld,
        ),
        new THREE.Vector3(...expected),
      );

    const defects: string[] = [];
    TestValidator.predicate(
      "timed polygon drawing is available",
      drawing.drawAt !== undefined,
    );

    // Start after release, then revisit both sides of the boundary in both directions.
    for (const seconds of [6, 0.5, 1, 2, 3, release, 4.25, 5.25, 3, 6]) {
      const layer = { shot: "shot", sourceFrame: seconds * 4, weight: 1 };
      if (seconds === 4.25)
        renderAutoMovieFilmFrame(
          host.renderer,
          [layer],
          "depth",
          (): void => {
            if (!probe("rightLowerArm", [1, release, -release]))
              defects.push(
                "film pass observes the layer before actor preparation",
              );
          },
          drawLayer,
        );
      else drawLayer(layer);

      // Rotation about the live left forearm pivot carries the hand and its axes.
      const leftMatches: boolean =
        seconds <= 1
          ? probe("leftHand", [1, seconds, -2])
          : probe("leftHand", [0, seconds, -3]) &&
            probe("leftHand", [-1, seconds, -3], 1);
      if (!probe("leftLowerArm", [0, seconds, -2]) || !leftMatches)
        defects.push(`left bend at ${seconds}`);

      // Until release the right hand tracks both actor and source pose.
      const pivot: [number, number, number] =
        seconds < release
          ? [0, seconds, -seconds]
          : [Math.min(seconds - release, 2), release, -release];
      const rightHand: [number, number, number] =
        seconds <= release
          ? [0, seconds, -seconds - 1]
          : seconds === 4.25
            ? [1 - quarter, release, -release - quarter]
            : [1, release, -release];
      if (!probe("rightLowerArm", pivot) || !probe("rightHand", rightHand))
        defects.push(`right release at ${seconds}`);
      if (seconds >= 5.25 && !probe("rightHand", [0, release, -release], 1))
        defects.push(`right release orientation at ${seconds}`);

      if (!probe("head", [0, seconds + 1.6, 0]))
        defects.push(`foreign subject at ${seconds}`);
      if (
        drawing.parts.get("rightHand") !== hand ||
        hand.geometry !== geometry ||
        geometry.getAttribute("position") !== vertices
      )
        defects.push(`mesh identity at ${seconds}`);
    }
    for (const invalid of [
      "sparse position",
      "pose rotation",
      "actor rotation",
    ] as const) {
      malformed = invalid;
      let refused: unknown;
      try {
        drawLayer({ shot: "shot", sourceFrame: 17, weight: 1 });
      } catch (error) {
        refused = error;
      }
      if (
        !(refused instanceof Error) ||
        !probe("rightHand", [1, release, -release]) ||
        !probe("head", [0, 7.6, 0])
      )
        defects.push(`invalid ${invalid} changed or reached the display`);
    }
    TestValidator.equals(
      "polygon presentation after arbitrary seeks",
      defects,
      [],
    );
  } finally {
    drawing.dispose();
  }
}
