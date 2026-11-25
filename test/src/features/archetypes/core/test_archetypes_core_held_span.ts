import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeSpan,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Covers the line projection's fixed quarter turn and metre-scale points. */
const SPAN_ROUNDING: number = 128 * Number.EPSILON;

/** A held run extends past its grips and aligns the hand's line axis. */
export function test_archetypes_core_held_span(): void {
  const hand: IAutoMovieAffordance = {
    id: "hand",
    kind: "rein",
    length: 1,
    frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 1, z: 0 }),
    extent: null,
  };
  const pin: IAutoMovieAffordance = {
    id: "pin",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 1, z: 3 }),
    extent: null,
  };
  const span: AutoMovieArchetypeSpan.ISpan = {
    id: "run",
    from: { affordance: hand.id, overhang: 0.5 },
    to: { affordance: pin.id, overhang: 0.25 },
    radius: 0.01,
    length: 4,
  };
  const line: IAutoMovieModelPart = {
    id: span.id,
    name: null,
    attachedBone: null,
    material: null,
    transform: null,
    geometry: {
      type: "primitive",
      shape: { type: "cylinder", radius: 0.1, height: 1 },
    },
  };
  const contacts: IAutoMovieAffordance[] = [hand, pin];
  TestValidator.equals(
    "both extensions are counted before consulting the slack threshold",
    AutoMovieArchetypeSpan.state("line", span, [], contacts),
    {
      from: { x: 0, y: 1, z: -0.5 },
      to: { x: 0, y: 1, z: 3.25 },
      length: 3.75,
      slack: true,
    },
  );
  const posed = AutoMovieArchetypeSpan.pose("line", [span], [line], contacts);
  TestValidator.predicate(
    "the grip stays fixed with X along the line and the cylinder centres between its ends",
    vclose(
      posed.affordances[0]!.frame.translation,
      hand.frame.translation,
      SPAN_ROUNDING,
    ) &&
      vclose(
        AutoMovieArchetypeFrame.axis(posed.affordances[0]!.frame, "x"),
        { x: 0, y: 0, z: 1 },
        SPAN_ROUNDING,
      ) &&
      vclose(
        posed.parts[0]!.transform!.translation,
        { x: 0, y: 1, z: 1.375 },
        SPAN_ROUNDING,
      ),
  );
  TestValidator.error(
    "a half metre of overhang is necessary for this grip",
    (): unknown =>
      AutoMovieArchetypeSpan.pose(
        "line",
        [{ ...span, from: { affordance: hand.id, overhang: 0.25 } }],
        [line],
        contacts,
      ),
  );

  const anchors = (left: number, right: number): IAutoMovieAffordance[] => [
    {
      ...hand,
      frame: AutoMovieArchetypeFrame.upright({ x: left, y: 0, z: 0 }),
    },
    {
      ...pin,
      frame: AutoMovieArchetypeFrame.upright({ x: right, y: 0, z: 0 }),
    },
  ];
  const maximum: number = Number.MAX_VALUE;
  const straight: AutoMovieArchetypeSpan.ISpan = {
    ...span,
    from: { affordance: hand.id },
    to: { affordance: pin.id },
  };
  TestValidator.equals(
    "a bare span may use the largest representable length",
    AutoMovieArchetypeSpan.state(
      "line",
      straight,
      [],
      anchors(-maximum / 2, maximum / 2),
    ).length,
    maximum,
  );
  for (const [declaration, at] of [
    [straight, anchors(-maximum, maximum)],
    [
      { ...straight, from: { affordance: hand.id, overhang: 2 ** 1023 } },
      anchors(0, 2 ** 1023),
    ],
  ] as const) {
    let refusal: unknown;
    try {
      AutoMovieArchetypeSpan.state("line", declaration, [], at);
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      "finite anchors can still imply an unrepresentable line",
      refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === straight.id &&
        refusal.value === Infinity,
    );
  }
}
