import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineDraft,
  type AutoMovieArchetypeEquineDraftPlan,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createCart,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineFordScene } from "../../internal/equineFordScene";

/** A take's sample. */
type Sample = AutoMovieArchetypeEquineDraftPlan.ISample<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension,
  createCart.Affordance,
  createCart.Dimension
>;

/** A take. */
type Take = AutoMovieArchetypeEquineDraftPlan.ITake<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension,
  createCart.Affordance,
  createCart.Dimension
>;

/**
 * A harnessed horse backs into a cart's shafts, is hooked to it, draws it through a turn and up a grade, brakes into the breeching, is unhooked and walks out, leaving the cart standing.
 *
 * Scenarios:
 * 1. The stages run in order on the horse's own clock: connection, pull, brake, release, depart.
 * 2. While the horse stands in the shafts, including through a 60 degree turn, the cart's coupling stays on the horse's hitch, read from both posed models; before the connection and after the walk out the cart stands still where it was coupled, and the horse ends the 4 m walk out at least 3.6 m from it.
 * 3. The traces are absent while backing in and after unhooking; hooked at a stand and while braking they hang slack, sagging the authored 8 cm below the chord at the middle; while pulling they run straight from the collar's points of draft to the single tree's ends, read from the posed parts.
 * 4. While the traces are hooked or unhooked at a stand, every hoof stays where it stood.
 * 5. On level ground and on a 0.05 grade the cart's two wheels touch the authored plane under their axle.
 * 6. A cart fitted to another horse and a horse without a driving harness are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public take and reads its posed horse and cart parts, contacts and laid traces; a detached coupling, a cart that drifts while parked, a trace off its ends or in the wrong state, a sliding hoof at a stand or a floating wheel is caught.
 * @evidence contracts/development/testing.md#independent-expectations Trace ends are computed from the posed draft balls and single-tree bar, the coupling from both models' affordances, wheels from their cylinders against the scene's authored planes, the sag from the authored parameter; none is read from the take's planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Each stage and both its boundaries, level against graded ground, a straight against a turn, the admitted cart against a mis-fitted one and a harnessed horse against a saddled one; pack loads belong to test_archetype_equine_pack.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_draft(): void {
  const horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = createHorse({ tack: "harness", withersHeight: 1.72, tempo: 0 }, 4);
  const cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension> =
    createCart({ kind: "cart", withersHeight: 1.72 }, 4);
  const issues: string[] = [];
  const base: AutoMovieArchetypeEquineDraftPlan.IParams = {
    start: { x: 0, z: 0, heading: 0 },
    approach: 3,
    connect: 1.5,
    pull: [
      { kind: "straight", length: 5 },
      { kind: "turn", radius: 10, angle: 60 },
      { kind: "straight", length: 5 },
    ],
    release: 1.5,
    depart: [{ kind: "straight", length: 4 }],
    cruise: 1.3,
    acceleration: 0.6,
    deceleration: 0.6,
    sag: 0.08,
  };
  const level: Take = AutoMovieArchetypeEquineDraft(horse, cart, base);
  inspect("level", level, null);

  const ramp: AutoMovieArchetypeQuadrupedFooting.IScene = {
    planes: [
      {
        id: "low",
        origin: { x: 0, y: 0, z: 0 },
        x: [-10, 10],
        z: [-20, 1],
        slope: { x: 0, z: 0 },
      },
      {
        id: "grade",
        origin: { x: 0, y: 0, z: 1 },
        x: [-10, 10],
        z: [1, 9],
        slope: { x: 0, z: 0.05 },
      },
      {
        id: "high",
        origin: { x: 0, y: 0.4, z: 9 },
        x: [-10, 10],
        z: [9, 40],
        slope: { x: 0, z: 0 },
      },
    ],
  };
  const graded: Take = AutoMovieArchetypeEquineDraft(horse, cart, {
    ...base,
    pull: [
      { kind: "straight", length: 4 },
      { kind: "straight", length: 8, rise: 0.4 },
      { kind: "straight", length: 5 },
    ],
    footing: ramp,
  });
  inspect("grade", graded, ramp);

  refuses("mis-fitted cart", "cart", () =>
    AutoMovieArchetypeEquineDraft(
      horse,
      createCart({ kind: "cart", withersHeight: 1.6 }, 4),
      base,
    ),
  );
  refuses("saddled horse", "tack", () =>
    AutoMovieArchetypeEquineDraft(
      createHorse({ tack: "saddle", withersHeight: 1.72 }, 4),
      cart,
      base,
    ),
  );
  TestValidator.equals(
    "the draft take's hitch, traces, hooves and wheels",
    issues,
    [],
  );

  /** Read one take's stages, coupling, traces, hooves and wheels. */
  function inspect(
    label: string,
    take: Take,
    scene: AutoMovieArchetypeQuadrupedFooting.IScene | null,
  ): void {
    const { connect, pull, brake, release, depart } = take.events;
    if (
      !(
        0 < connect &&
        connect < pull &&
        pull < brake &&
        brake < release &&
        release < depart &&
        depart < take.duration
      )
    )
      issues.push(
        `${label}: stages out of order ${JSON.stringify(take.events)}`,
      );
    const parked: IAutoMovieTransform = take.at(connect).placement;
    const left: IAutoMovieTransform = take.at(depart).placement;
    let turned: boolean = false;
    for (let seconds: number = 0; seconds <= take.duration; seconds += 0.5) {
      const sample: Sample = take.at(seconds);
      const expected: AutoMovieArchetypeEquineDraftPlan.Stage =
        seconds < connect
          ? "approach"
          : seconds < pull
            ? "connection"
            : seconds < brake
              ? "pull"
              : seconds < release
                ? "brake"
                : seconds < depart
                  ? "release"
                  : "depart";
      if (sample.stage !== expected)
        issues.push(
          `${label} ${seconds}: stage ${sample.stage}, expected ${expected}`,
        );
      const hitch: IAutoMovieVector3 = world(sample.horse, "hitch");
      const coupling: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.cart.affordance("coupling").frame,
      ).translation;
      const standing: boolean = seconds >= connect && seconds < depart;
      if (standing && Vector3.distance(hitch, coupling) > 1e-9)
        issues.push(
          `${label} ${seconds}: coupling ${Vector3.distance(hitch, coupling)} m off the hitch`,
        );
      if (
        standing &&
        Math.abs(AutoMovieArchetypeFrame.axis(sample.placement, "z").x) > 0.3
      )
        turned = true;
      if (!standing) {
        const still: IAutoMovieTransform = seconds < connect ? parked : left;
        if (
          Vector3.distance(still.translation, sample.placement.translation) >
          1e-9
        )
          issues.push(`${label} ${seconds}: the parked cart moved`);
      }
      traces(label, seconds, sample, expected);
      wheels(label, seconds, sample, scene);
    }
    const end: Sample = take.at(take.duration);
    const away: number = Vector3.distance(
      world(end.horse, "hitch"),
      AutoMovieArchetypeFrame.compose(
        end.placement,
        end.cart.affordance("coupling").frame,
      ).translation,
    );
    if (!(away > 0.9 * 4))
      issues.push(
        `${label}: the horse ends ${away} m from the parked cart, not the 4 m it walked out`,
      );
    if (label === "level" && !turned)
      issues.push("the coupled turn was not observed");
    for (const [from, to] of [
      [connect, pull],
      [release, depart],
    ] as const)
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const id: string = AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
        const a: IAutoMovieVector3 = part(
          take.at(from + 1e-3).horse,
          id,
        ).translation;
        const b: IAutoMovieVector3 = part(
          take.at(to - 1e-3).horse,
          id,
        ).translation;
        if (Vector3.distance(a, b) > 1e-8)
          issues.push(
            `${label}: ${limb} moves ${Vector3.distance(a, b)} m at a stand`,
          );
      }
  }

  /** The traces' presence, state and ends. */
  function traces(
    label: string,
    seconds: number,
    sample: Sample,
    stage: AutoMovieArchetypeEquineDraftPlan.Stage,
  ): void {
    const hooked: boolean =
      stage === "connection" || stage === "pull" || stage === "brake";
    if (!hooked) {
      if (sample.traces.length !== 0)
        issues.push(`${label} ${seconds}: traces laid while ${stage}`);
      return;
    }
    if (sample.traces.length !== 2) {
      issues.push(
        `${label} ${seconds}: ${sample.traces.length} traces while ${stage}`,
      );
      return;
    }
    const tree: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      sample.placement,
      sample.cart.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === "single-tree",
      )!.transform!,
    );
    const spread: number = localDraft();
    const along: IAutoMovieVector3 = Quaternion.rotateVector(tree.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    for (const [k, side] of (["left", "right"] as const).entries()) {
      const trace: AutoMovieArchetypeRide.ILineState = sample.traces[k]!;
      const collar: IAutoMovieVector3 = part(
        sample.horse,
        `draft-${side}`,
      ).translation;
      const end: IAutoMovieVector3 = Vector3.add(
        tree.translation,
        Vector3.scale(along, (k === 0 ? 1 : -1) * spread),
      );
      const first: IAutoMovieVector3 = trace.points[0]!;
      const last: IAutoMovieVector3 = trace.points.at(-1)!;
      if (
        Vector3.distance(first, collar) > 1e-9 ||
        Vector3.distance(last, end) > 1e-9
      )
        issues.push(
          `${label} ${seconds}: the ${side} trace leaves the collar or the single tree`,
        );
      if (stage === "pull") {
        if (trace.points.length !== 2)
          issues.push(`${label} ${seconds}: a drawn trace bends`);
        continue;
      }
      const middle: IAutoMovieVector3 =
        trace.points[(trace.points.length - 1) / 2]!;
      const chord: IAutoMovieVector3 = Vector3.lerp(first, last, 0.5);
      if (
        Math.abs(chord.y - middle.y - 0.08) > 1e-9 ||
        Math.hypot(chord.x - middle.x, chord.z - middle.z) > 1e-9
      )
        issues.push(
          `${label} ${seconds}: the slack ${side} trace sags ${chord.y - middle.y} m`,
        );
    }
  }

  /** The draft ball's lateral offset in the horse's own model. */
  function localDraft(): number {
    return horse.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === "draft-left",
    )!.transform!.translation.x;
  }

  /** Both wheels touch the authored plane under the axle. */
  function wheels(
    label: string,
    seconds: number,
    sample: Sample,
    scene: AutoMovieArchetypeQuadrupedFooting.IScene | null,
  ): void {
    const ids: readonly string[] = sample.cart.parts
      .map((p: IAutoMovieModelPart): string => p.id)
      .filter((id: string): boolean => id.startsWith("wheel-"));
    if (ids.length !== 2)
      issues.push(`${label}: the cart has ${ids.length} wheels`);
    for (const id of ids) {
      const wheel: IAutoMovieModelPart = sample.cart.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === id,
      )!;
      const centre: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
        sample.placement,
        wheel.transform!,
      ).translation;
      const plane: AutoMovieArchetypeQuadrupedFooting.IPlane =
        scene === null
          ? {
              id: "floor",
              origin: { x: 0, y: 0, z: 0 },
              x: [-1e3, 1e3],
              z: [-1e3, 1e3],
              slope: { x: 0, z: 0 },
            }
          : scene.planes.find(
              (p: AutoMovieArchetypeQuadrupedFooting.IPlane): boolean =>
                centre.z >= p.z[0] && centre.z < p.z[1],
            )!;
      const gap: number = equineFordScene.separation(
        wheel,
        sample.placement,
        plane,
      );
      if (Math.abs(gap) > 1e-9)
        issues.push(
          `${label} ${seconds}: ${id} stands ${gap} m off ${plane.id}`,
        );
    }
  }

  /** An emitted part's world frame in a ride sample. */
  function part(
    sample: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    id: string,
  ): IAutoMovieTransform {
    return AutoMovieArchetypeFrame.compose(
      sample.placement,
      sample.archetype.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === id,
      )!.transform!,
    );
  }

  /** A contact's world point in a ride sample. */
  function world(
    sample: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    id: AutoMovieArchetypeEquine.Affordance,
  ): IAutoMovieVector3 {
    return AutoMovieArchetypeFrame.compose(
      sample.placement,
      sample.archetype.affordance(id).frame,
    ).translation;
  }

  /** A typed refusal on the named axis. */
  function refuses(label: string, axis: string, build: () => unknown): void {
    let error: unknown = null;
    try {
      build();
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof AutoMovieArchetypeRefusal && error.axis === axis))
      issues.push(
        `${label}: expected a refusal on ${axis}, got ${String(error)}`,
      );
  }
}
