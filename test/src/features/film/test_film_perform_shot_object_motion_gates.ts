import type {
  IAutoMovieAuthoringDiagnostic,
  IAutoMovieCompiledDefinedShot,
} from "@automovie/engine";
import {
  IAutoMovieClip,
  IAutoMovieNode,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { HINGE } from "../internal/HINGE";
import { IDoorShotProps } from "../internal/IDoorShotProps";
import { compileDoorShot } from "../internal/compileDoorShot";
import { createDoorPropSpec as doorSpec } from "../internal/createDoorPropSpec";
import { swingClip } from "../internal/swingClip";
import { yQuat } from "../internal/yQuat";

/**
 * Compiles the existing door fixture and projects all diagnostic path/fact text, or the compiled sentinel; authored profiles and addresses supply the owning gate expectations.
 */
function refusal(props: IDoorShotProps): string {
  const compiled: IAutoMovieCompiledDefinedShot = compileDoorShot(props);
  return compiled.success === true
    ? "compiled"
    : compiled.diagnostics
        .map(
          (diagnostic: IAutoMovieAuthoringDiagnostic): string =>
            `${diagnostic.path} ${diagnostic.fact}`,
        )
        .join(" | ");
}

/**
 * Rejects the compiled sentinel and checks all authored diagnosis fragments from refusal; it distinguishes located admission explanations without an independent numerical profile solver.
 */
function refusedWith(
  clips: readonly IAutoMovieClip[],
  ...fragments: readonly string[]
): boolean {
  const facts: string = refusal({ objectMotions: clips });
  return (
    facts !== "compiled" &&
    fragments.every((fragment: string): boolean => facts.includes(fragment))
  );
}

/**
 * Compiles authored object clips and asserts the admission reason for missing addresses, competing authority, artifact defects and profile breaches, including rotation violations absent from both endpoint keys; valid neighbouring angles and interpolation modes prove legal motion remains admitted.
 *
 * Scenarios:
 * 1. Admit reserved dictionary spellings as prop identities.
 * 2. Refuse interior quaternion peaks for spherical and near-angle interpolation, including short loops; admit step, exact bound and later-authority neighbours.
 * 3. Refuse unstaged nodes, absent joints, performing actors and excessive hinge travel; admit the adjacent in-range hinge.
 * 4. Refuse out-of-shot keys, spline/pointer tracks and duplicate clip ids.
 * 5. Refuse baked channel/id conflicts while admitting the same node's untouched scale channel.
 * 6. Refuse lowered identity collisions and absent/refused prop joints, while preserving staged set pieces and equivalent duplicate registrations.
 * 7. Ignore an unrelated rest breach, report one driven channel's repeated breach once and refuse an unsupported opacity path.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles authored object clips and asserts the admission reason for missing addresses, competing authority, artifact defects and profile breaches, including rotation violations absent from both endpoint keys; valid neighbouring angles and interpolation modes prove legal motion remains admitted.
 * @evidence contracts/testing.md#independent-expectations Scene identities and profile component bounds are authored by the fixture. Symmetric Y rotations have w=cos(half-angle) at both keys and w=1 at their identity midpoint, so a maximum strictly between those values must refuse linear rotation; step holds the endpoint value and a maximum of one is legal without deriving expected values from the extrema helper.
 * @evidence contracts/testing.md#distinguishing-cases Covers the listed identity, authority, clock, track and travel refusals with in-range swing, untouched-channel, legal set-piece and interpolation neighbours. The two symmetric-angle families distinguish spherical and near-angle normalized interpolation, including short loops and later equal-start authority. Exactly-once counting concerns one driven channel; nonlinear drivers and arbitrary quaternion paths are outside these authored cases.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit entry owns its mutation cases and numerical compilation assertions; portable shared door fixtures call engine source without a renderer, process or dynamic scenario registration.
 */
export function test_film_perform_shot_object_motion_gates(): void {
  for (const id of ["constructor", "__proto__", "toString"]) {
    const prop: IAutoMoviePropSpec = doorSpec();
    prop.node = id;
    prop.model.id = id;
    TestValidator.equals(
      `reserved dictionary spelling ${id} still lowers its joint`,
      refusal({
        props: [prop],
        extraSet: [
          { node: "indexedDoor", model: id, position: { x: 2, y: 0, z: 0 } },
        ],
        objectMotions: [swingClip("indexed-swing", "indexedDoor/hinge", 20)],
      }),
      "compiled",
    );
  }
  for (const [degrees, bound] of [
    [90, 0.8],
    [1, 0.99999],
  ] as const) {
    const spec: IAutoMoviePropSpec = doorSpec();
    if (spec.articulation === null)
      throw new Error("Door fixture must articulate");
    spec.articulation.profile.drivers = [];
    spec.articulation.profile.limits = [
      {
        channel: { kind: "node", node: "pivot", path: "rotation" },
        min: null,
        max: [null, null, null, bound],
      },
    ];
    const clip: IAutoMovieClip = swingClip(
      `symmetric-${degrees}`,
      HINGE,
      -degrees,
      { times: [0, 2], values: [...yQuat(-degrees), ...yQuat(degrees)] },
    );
    TestValidator.predicate(
      `linear rotation ${degrees} refuses its internal w peak`,
      refusal({ props: [spec], objectMotions: [clip] }).includes(
        `drives "node:${HINGE}:rotation" past the travel profile "door-profile"`,
      ),
    );
    TestValidator.predicate(
      `short repeated rotation ${degrees} retains the same internal refusal`,
      refusal({
        props: [spec],
        objectMotions: [
          {
            ...clip,
            duration: 0.001,
            loop: true,
            tracks: [{ ...clip.tracks[0]!, times: [0, 0.001] }],
          },
        ],
      }).includes("past the travel profile"),
    );
    TestValidator.equals(
      `step rotation ${degrees} stays at legal endpoints`,
      refusal({
        props: [spec],
        objectMotions: [
          { ...clip, tracks: [{ ...clip.tracks[0]!, interpolation: "step" }] },
        ],
      }),
      "compiled",
    );
    spec.articulation.profile.limits[0]!.max = [null, null, null, 1];
    TestValidator.equals(
      `linear rotation ${degrees} permits the exact component boundary`,
      refusal({ props: [spec], objectMotions: [clip] }),
      "compiled",
    );
    spec.articulation.profile.limits[0]!.max = [null, null, null, bound];
    TestValidator.equals(
      `later equal-start authority hides the rotation ${degrees} peak`,
      refusal({
        props: [spec],
        objectMotions: [clip, swingClip(`cover-${degrees}`, HINGE, -degrees)],
      }),
      "compiled",
    );
  }
  TestValidator.predicate(
    "a node this shot never staged is refused",
    refusedWith(
      [swingClip("ghost", "sideGate", 20)],
      "neither a staged scene node nor a lowered prop articulation joint",
    ),
  );
  TestValidator.predicate(
    "a joint the staged prop does not declare is refused",
    refusedWith(
      [swingClip("ghost", "frontDoor/latch", 20)],
      "neither a staged scene node nor a lowered prop articulation joint",
    ),
  );

  TestValidator.predicate(
    "a performing actor's node is refused",
    refusedWith(
      [swingClip("shove", "knightA", 20)],
      "is driven by this shot's performance",
    ),
  );

  TestValidator.predicate(
    "a swing past the declared travel is refused, naming the profile",
    refusedWith(
      [swingClip("slam", HINGE, 150)],
      `drives "node:${HINGE}:rotation"`,
      'profile "door-profile"',
    ),
  );
  TestValidator.equals(
    "the adjacent swing one degree inside the same travel compiles",
    refusal({ objectMotions: [swingClip("open", HINGE, 109)] }),
    "compiled",
  );

  TestValidator.predicate(
    "a key past the shot's own clock is refused",
    refusedWith(
      [swingClip("late", HINGE, 20, { times: [9] })],
      "must land inside the shot's own clock of 0..2s",
    ),
  );

  TestValidator.predicate(
    "a spline track is refused",
    refusedWith(
      [
        swingClip("eased", HINGE, 20, {
          interpolation: "cubicspline",
          times: [0],
          values: [...new Array(12).fill(0)],
        }),
      ],
      "interpolates step or linear",
    ),
  );

  TestValidator.predicate(
    "two authored clips sharing one id are refused",
    refusedWith(
      [swingClip("swing", HINGE, 20), swingClip("swing", "hall/panel", 20)],
      "duplicates $input.objectMotions[0].id",
    ),
  );

  TestValidator.predicate(
    "a pointer track is still refused on this field",
    refusedWith(
      [
        {
          id: "dim",
          name: null,
          duration: 2,
          loop: false,
          tracks: [
            {
              channel: {
                kind: "pointer",
                pointer: "/lights/sun/intensity",
                valueType: "scalar",
              },
              times: [0],
              values: [0.5],
              interpolation: "linear",
            },
          ],
        },
      ],
      'channel kind must be "node"',
    ),
  );

  TestValidator.predicate(
    "a channel a baked follow already drives is refused",
    refusedWith(
      [swingClip("spin", "torch", 20)],
      'object motion channel "node:torch:rotation" is already driven',
    ),
  );
  TestValidator.equals(
    "the same node's untouched channel is not refused with it",
    refusal({
      objectMotions: [
        {
          ...swingClip("lift", "torch", 0),
          tracks: [
            {
              channel: { kind: "node", node: "torch", path: "scale" },
              times: [0],
              values: [2, 2, 2],
              interpolation: "linear",
            },
          ],
        },
      ],
    }),
    "compiled",
  );

  TestValidator.predicate(
    "an id a baked clip already carries is refused",
    refusedWith(
      [swingClip("attach:torch", HINGE, 20)],
      "collides with a clip this shot baked",
    ),
  );

  TestValidator.predicate(
    "a joint whose lowered id collides with a staged node is named",
    refusal({
      objectMotions: [swingClip("swing", HINGE, 20)],
      extraSet: [
        { node: HINGE, model: "slab", position: { x: 5, y: 0, z: 0 } },
      ],
    }).includes(`the lowered scene carries ${HINGE} twice`),
  );

  TestValidator.equals(
    "a shot registering no prop still turns its staged pieces",
    refusal({
      objectMotions: [swingClip("panel-swing", "hall/panel", 30)],
      props: undefined,
    }),
    "compiled",
  );
  TestValidator.predicate(
    "and the joint of the prop it no longer carries is refused",
    refusal({
      objectMotions: [swingClip("swing", HINGE, 20)],
      props: undefined,
    }).includes(
      "neither a staged scene node nor a lowered prop articulation joint",
    ),
  );

  TestValidator.predicate(
    "a prop the forge refuses lowers no joint",
    refusal({
      objectMotions: [swingClip("swing", HINGE, 20)],
      // A prop whose model id no longer equals its node breaks the staging
      // join `forgeProp` gates, so nothing of it reaches the scene graph.
      props: [{ ...doorSpec(), model: { ...doorSpec().model, id: "other" } }],
    }).includes(
      "neither a staged scene node nor a lowered prop articulation joint",
    ),
  );
  TestValidator.equals(
    "equivalent duplicate registrations preserve the legal swing",
    refusal({
      objectMotions: [swingClip("swing", HINGE, 109)],
      props: [
        doorSpec(),
        // The second registration has the same profile and admits the same
        // swing; this case observes equivalent duplication only.
        doorSpec(),
      ],
    }),
    "compiled",
  );

  // A door whose hinge already stands a quarter turn the wrong way at rest,
  // which is outside the travel its own profile declares.
  const restBreached: () => IAutoMoviePropSpec = (): IAutoMoviePropSpec => {
    const spec: IAutoMoviePropSpec = doorSpec();
    return {
      ...spec,
      articulation: {
        ...spec.articulation!,
        nodes: spec.articulation!.nodes.map(
          (node: IAutoMovieNode): IAutoMovieNode =>
            node.id === "hinge"
              ? {
                  ...node,
                  transform: {
                    ...node.transform,
                    rotation: { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
                  },
                }
              : node,
        ),
      },
    };
  };
  TestValidator.equals(
    "a prop resting outside its own travel does not refuse another node's turn",
    refusal({
      objectMotions: [swingClip("panel-swing", "hall/panel", 30)],
      props: [restBreached()],
    }),
    "compiled",
  );
  TestValidator.equals(
    "one channel breaching at several keys is refused exactly once",
    refusal({
      objectMotions: [
        {
          ...swingClip("slam", HINGE, 150),
          tracks: [
            {
              channel: { kind: "node", node: HINGE, path: "rotation" },
              times: [0, 1],
              values: [...yQuat(150), ...yQuat(150)],
              interpolation: "linear",
            },
          ],
        },
      ],
    }).split("past the travel profile").length - 1,
    1,
  );

  TestValidator.predicate(
    "a node path the pipeline never writes is refused",
    refusedWith(
      [
        {
          ...swingClip("fade", HINGE, 0),
          tracks: [
            {
              channel: {
                kind: "node",
                node: HINGE,
                path: "opacity",
              } as unknown as IAutoMovieClip["tracks"][number]["channel"],
              times: [0],
              values: [0.5],
              interpolation: "linear",
            },
          ],
        },
      ],
      "clip track channel path must be one of",
    ),
  );
}
