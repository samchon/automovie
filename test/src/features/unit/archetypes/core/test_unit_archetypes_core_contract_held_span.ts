import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeSpan,
} from "@automovie/archetypes";
import { Quaternion, Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeSpanObservation } from "../../../internal/archetypeSpanObservation";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Explicit semantic differences exercised by the hand/line fixture. */
interface Options {
  /** An absent hook extension retains the old origin-only anchor behavior. */
  hook?: boolean;
  /** Explicit physical extension, including zero and invalid negative cases. */
  overhang?: number;
  /** Actual model-space attachment point on the built target. */
  target?: IAutoMovieVector3;
}

/** Build the actual already-rotated target and its independent hand contact. */
function builder(
  options: Options = {},
): AutoMovieArchetypeBuilder<"hand", never> {
  const target: IAutoMovieVector3 = options.target ?? {
    x: 1.9,
    y: 1.2,
    z: 0.3,
  };
  const result: AutoMovieArchetypeBuilder<"hand", never> =
    new AutoMovieArchetypeBuilder<"hand", never>({
      name: "held line fixture",
      material: "steel",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "held-line",
        {},
        undefined,
      ),
    }).box(
      "target",
      { x: 0.6, y: 0.6, z: 0.8 },
      { x: target.x + 0.1, y: target.y - 0.2, z: target.z - 0.3 },
      { rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90) },
    );
  const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
    x: 0,
    y: 0,
    z: 0,
  });
  if (options.hook === true)
    result.affordance({ id: "hand", kind: "hook", frame, extent: null });
  else
    result.affordance({
      id: "hand",
      kind: "rein",
      frame,
      extent: null,
      symmetry: "round",
      grip: "power",
      aperture: 0.02,
      length: 0.4,
    });
  return result;
}

/** Use the public actual-part binding and actual physical span producer. */
function fixture(options: Options = {}): AutoMovieArchetype<"hand", never> {
  const current: AutoMovieArchetypeBuilder<"hand", never> = builder(options);
  const extension: number | undefined =
    options.overhang === undefined
      ? options.hook === true
        ? undefined
        : 0.2
      : options.overhang;
  const from: AutoMovieArchetypeSpan.End =
    extension === undefined
      ? { affordance: "hand" }
      : { affordance: "hand", overhang: extension };
  return current
    .span(
      "line",
      from,
      current.anchor("target", options.target ?? { x: 1.9, y: 1.2, z: 0.3 }),
      0.01,
      { color: "#333333" },
    )
    .build(2);
}

/**
 * A held line stays on both moving anchors with its complete physical grip run.
 *
 * Scenarios:
 * 1. An actual rotated target binds local (.2,.1,.3), then moves independently
 *    of the hand. The rod reaches literal (3.3,2.1,-1.2) after a quarter turn.
 * 2. The unchanged hand origin lies half a declared held run from the rod's
 *    near endpoint, its +X follows the real line and both half-runs fit.
 * 3. Exact occupied-run limits pass, adjacent insufficient lengths refuse;
 *    negative extension, missing/non-rigid carriers and conflicting
 *    shared line axes refuse without replacing methods or hiding an anchor.
 * 4. An explicit zero hook extension aligns its line; an absent extension
 *    preserves the old independent contact orientation. Reposing preserves
 *    original source bytes and rest mass, and new line geometry is independent.
 */
export function test_unit_archetypes_core_contract_held_span(): void {
  const findings: string[] = [];
  const original: AutoMovieArchetype<"hand", never> = fixture();
  const before: string = JSON.stringify({
    model: original,
    spans: original.spans,
  });
  const anchor: AutoMovieArchetypeSpan.End = original.spans[0]!.to;
  if (
    anchor.part !== "target" ||
    anchor.at === undefined ||
    !vclose(anchor.at, { x: 0.2, y: 0.1, z: 0.3 }, 1e-12)
  )
    findings.push("the span did not bind to the actual rotated target frame");
  const hand: IAutoMovieVector3 = { x: -1, y: 0.5, z: 0.25 };
  const target: IAutoMovieVector3 = { x: 3.3, y: 2.1, z: -1.2 };
  const moved: IAutoMovieModelPart[] = original.parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart =>
      part.id !== "target"
        ? part
        : {
            ...part,
            transform: {
              translation: { x: 3, y: 2, z: -1 },
              rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
              scale: { x: 1, y: 1, z: 1 },
            },
          },
  );
  const frames: Map<string, IAutoMovieTransform> = new Map([
    [
      "hand",
      {
        translation: hand,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 45),
        scale: { x: 1, y: 1, z: 1 },
      },
    ],
  ]);
  const posed: AutoMovieArchetype<"hand", never> = original.reposed(
    moved,
    frames,
  );
  const line: IAutoMovieModelPart = posed.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "line",
  )!;
  const ends: readonly [IAutoMovieVector3, IAutoMovieVector3] =
    archetypeSpanObservation.ends(line);
  const gap: IAutoMovieVector3 = Vector3.subtract(target, hand);
  const length: number = Math.hypot(gap.x, gap.y, gap.z);
  const axis: IAutoMovieVector3 = {
    x: gap.x / length,
    y: gap.y / length,
    z: gap.z / length,
  };
  const grip: IAutoMovieTransform = posed.affordance("hand").frame;
  if (
    !vclose(ends[1], target, 1e-12) ||
    !vclose(ends[0], Vector3.subtract(hand, Vector3.scale(axis, 0.2)), 1e-12)
  )
    findings.push("the physical rod left the actual head or complete held run");
  if (
    !vclose(grip.translation, hand, 1e-12) ||
    !nclose(
      Math.abs(Vector3.dot(AutoMovieArchetypeFrame.axis(grip, "x"), axis)),
      1,
      1e-12,
    ) ||
    !nclose(
      Vector3.dot(AutoMovieArchetypeFrame.axis(grip, "y"), axis),
      0,
      1e-12,
    )
  )
    findings.push(
      "the held frame moved its origin or left the physical line tangent",
    );
  if (
    !validateModel({ model: posed }).success ||
    posed.body.mass !== original.body.mass
  )
    findings.push(
      "a line pose changed rest mass or failed ordinary model admission",
    );
  if (
    line.geometry.type !== "primitive" ||
    line.geometry.shape.type !== "cylinder" ||
    !nclose(line.geometry.shape.height, length + 0.2, 1e-12) ||
    line.geometry.shape.radius !== 0.01
  )
    findings.push("the drawn line lost its physical length or radius");
  else line.geometry.shape.height += 1;
  const again: AutoMovieArchetype<"hand", never> = original.reposed(
    moved,
    frames,
  );
  if (
    !vclose(
      archetypeSpanObservation.ends(
        again.parts.find(
          (part: IAutoMovieModelPart): boolean => part.id === "line",
        )!,
      )[1],
      target,
      1e-12,
    ) ||
    JSON.stringify({ model: original, spans: original.spans }) !== before
  )
    findings.push(
      "a returned line mutation reached another query or its original source",
    );

  fixture({ target: { x: 0.2, y: 0, z: 0 } });
  for (const options of [
    { target: { x: 0.2 - 1e-4, y: 0, z: 0 } },
    { overhang: -0.01 },
  ])
    refused("invalid or incomplete held line", (): unknown => fixture(options));
  refused("missing actual anchor", (): unknown =>
    builder().anchor("missing", { x: 0, y: 0, z: 0 }),
  );
  const nonrigid: AutoMovieArchetypeBuilder<"hand", never> = builder();
  nonrigid.box(
    "invalid",
    { x: 0.1, y: 0.1, z: 0.1 },
    { x: 0, y: 0, z: 0 },
    { rotation: { x: 0, y: 0, z: 0, w: 2 } },
  );
  refused("non-rigid anchor carrier", (): unknown =>
    nonrigid.anchor("invalid", { x: 0, y: 0, z: 0 }),
  );
  const absent: AutoMovieArchetype<"hand", never> = fixture({ hook: true });
  const zero: AutoMovieArchetype<"hand", never> = fixture({
    hook: true,
    overhang: 0,
  });
  if (
    !vclose(
      AutoMovieArchetypeFrame.axis(absent.affordance("hand").frame, "x"),
      { x: 1, y: 0, z: 0 },
      1e-12,
    ) ||
    nclose(
      Math.abs(
        Vector3.dot(
          AutoMovieArchetypeFrame.axis(zero.affordance("hand").frame, "x"),
          {
            x: 1,
            y: 0,
            z: 0,
          },
        ),
      ),
      1,
      1e-6,
    )
  )
    findings.push(
      "zero and absent held declarations did not retain their different meanings",
    );
  const conflicting: AutoMovieArchetypeBuilder<"hand", never> = builder();
  conflicting
    .box("other", { x: 0.2, y: 0.2, z: 0.2 }, { x: 0, y: 0, z: 2 })
    .span(
      "first",
      { affordance: "hand", overhang: 0.2 },
      conflicting.anchor("target", { x: 1.9, y: 1.2, z: 0.3 }),
      0.01,
    )
    .span(
      "second",
      { affordance: "hand", overhang: 0.2 },
      { part: "other", at: { x: 0, y: 0, z: 0 } },
      0.01,
    );
  refused("incompatible shared grip", (): unknown => conflicting.build(2));
  TestValidator.equals(
    "physical held spans and independent carrier frames",
    findings,
    [],
  );

  /** Each malformed physical request must give the existing typed actionable refusal. */
  function refused(label: string, operation: () => unknown): void {
    try {
      operation();
      findings.push(`${label}: accepted`);
    } catch (error) {
      if (!(error instanceof AutoMovieArchetypeRefusal))
        findings.push(`${label}: ${String(error)}`);
    }
  }
}
