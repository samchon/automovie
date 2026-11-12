import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
  type IArchetypeBand,
} from "../core";

/** The ladder regulation. */
const OSHA: string =
  "29 CFR 1910.23 (https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.23)";

/** The pitch of a ladder whose foot stands a quarter of its length from the wall, degrees: the arccosine of one quarter. */
const QUARTER: number = (Math.acos(0.25) * 180) / Math.PI;

/** A rung's diameter, which the regulation does not give. */
const RUNG: string =
  "no rung diameter is given by 29 CFR 1910.23 or 1926.1053; the 25 to 35 mm of a round rung, not read at a source";

/**
 * A ladder: fixed upright to a wall, or leaning against one.
 *
 * The ladder's foot is on the floor at the origin and it is climbed facing `-Z`, toward the wall. A fixed ladder is upright; a leaning one tilts back toward the wall at the pitch its bands give, its foot a quarter of its length out. Each rung is a `bar` named `rung1` upward, and each side rail a `bar` along the ladder.
 *
 * @param params The kind, the number of rungs and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The ladder.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a number of rungs that is not a whole number from 2 to 30.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ladder's foot, the way it is climbed, its tilt and how rungs are named.
 * @evidence contracts/development/implementation.md#principled-implementation Rungs at one drawn spacing along the ladder's own line, which is upright or tilted by the pitch; a leaning ladder's pitch is fixed by the quarter-length rule of 29 CFR 1926.1053(b)(5)(i), whose arccosine of one quarter is 75.5 degrees.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the count, draw the dimensions, lay the two rails and the rungs along one direction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No feet, hooks or cage.
 * @evidence contracts/development/implementation.md#efficient-algorithms One rod per rung and two rails.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLadder(
  params: createLadder.IParams,
  seed?: number | string,
): Archetype<createLadder.Affordance, createLadder.Dimension> {
  const kind: createLadder.Kind = ArchetypeDraw.choice(
    "ladder",
    "kind",
    params.kind,
    createLadder.KINDS,
  );
  const rungs: number = params.rungs ?? 10;
  if (!Number.isInteger(rungs) || rungs < 2 || rungs > createLadder.RUNGS)
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "ladder",
      axis: "rungs",
      value: rungs,
      feasible: {
        kind: "range",
        minimum: 2,
        maximum: createLadder.RUNGS,
        unit: "",
      },
      reason: `a ladder has 2 to ${createLadder.RUNGS} rungs, not ${rungs}`,
      fix: "give a whole number of rungs",
    });
  const d: Record<createLadder.Dimension, number> = ArchetypeDraw.dimensions(
    "ladder",
    createLadder.BANDS[kind],
    seed,
    params,
    createLadder.BANDS,
  );
  const builder: ArchetypeBuilder<
    createLadder.Affordance,
    createLadder.Dimension
  > = new ArchetypeBuilder({
    archetype: "ladder",
    id: params.id,
    name: `${kind} ladder`,
    dimensions: d,
  });

  // The ladder's own line: up, tilted back toward the wall at -Z by the pitch from the floor.
  const pitch: number = (d.pitch * Math.PI) / 180;
  const along: IAutoMovieVector3 = Vector3.create(
    0,
    Math.sin(pitch),
    -Math.cos(pitch),
  );
  const out: IAutoMovieVector3 = Vector3.create(
    0,
    Math.cos(pitch),
    Math.sin(pitch),
  );
  const length: number = (rungs + 1) * d.spacing;
  const radius: number = d.rungDiameter / 2;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const foot: IAutoMovieVector3 = Vector3.create(
      sign * (d.width / 2 + radius),
      0,
      0,
    );
    builder.rod(
      `rail-${side}`,
      radius,
      foot,
      Vector3.add(foot, Vector3.scale(along, length)),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: `${side}Rail`,
      kind: "bar",
      frame: ArchetypeFrame.facing(
        Vector3.add(foot, Vector3.scale(along, length / 2)),
        out,
        along,
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length,
    });
  }
  for (let k: number = 1; k <= rungs; k++) {
    const at: IAutoMovieVector3 = Vector3.scale(along, k * d.spacing);
    builder.rod(
      `rung-${k}`,
      radius,
      Vector3.add(at, Vector3.create(-d.width / 2, 0, 0)),
      Vector3.add(at, Vector3.create(d.width / 2, 0, 0)),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: `rung${k}`,
      kind: "bar",
      frame: ArchetypeFrame.facing(at, out, Vector3.create(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: d.width,
    });
  }
  return builder.build(d.mass * rungs);
}

/**
 * Companion types and bands of {@link createLadder}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A template literal type closes the rung ids over any count; one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rung spacing, width and diameter and the pitch a climbing act reads (#3371, #3363).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rung's frame faces out of the ladder's plane on the climber's side, so a hand and a foot use the same contact.
 */
export namespace createLadder {
  /** The kinds of ladder. */
  export type Kind = "fixed" | "leaning";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fixed", "leaning"];

  /** The most rungs a ladder may have. An estimate, not read at a source: a bound on the model's size, not a regulation's. */
  export const RUNGS: number = 30;

  /**
   * The affordance ids:
   *
   * - `rung1` to `rung<rungs>`: each rung from the bottom up, a bar across the ladder.
   * - `leftRail`, `rightRail`: the side rails on `+X` and `-X`, each a bar along the ladder.
   */
  export type Affordance = `rung${number}` | "leftRail" | "rightRail";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `spacing`: from one rung to the next along the ladder; the first rung is one spacing from the foot.
   * - `width`: the clear width of a rung between the rails.
   * - `rungDiameter`: a rung's and a rail's round section.
   * - `pitch`: the ladder's angle from the floor, degrees.
   * - `mass`: kilograms per rung.
   */
  export type Dimension =
    | "spacing"
    | "width"
    | "rungDiameter"
    | "pitch"
    | "mass";

  /** The parameters: the kind, the count, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which ladder. */
    kind: Kind;

    /** How many rungs, 2 to 30; 10 when absent. */
    rungs?: number;

    /** The model's id, unique in a scene; `ladder` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    fixed: {
      spacing: ArchetypeBand.metres(
        0.25,
        0.36,
        `${OSHA}(b)(2), rungs 10 to 14 in apart`,
      ),
      width: ArchetypeBand.metres(
        0.41,
        0.5,
        `${OSHA}(b)(4), fixed ladder rungs at least 16 in (41 cm) clear; the upper end is an estimate`,
        true,
      ),
      rungDiameter: ArchetypeBand.metres(0.025, 0.035, RUNG, true),
      pitch: ArchetypeBand.of(
        "degrees",
        90,
        90,
        `${OSHA}(d)(11), a fixed ladder's pitch is at most 90 degrees from the horizontal`,
      ),
      mass: ArchetypeBand.of("kg", 1.5, 3, ArchetypeBand.TYPICAL_MASS, true),
    },
    leaning: {
      spacing: ArchetypeBand.metres(
        0.25,
        0.36,
        `${OSHA}(b)(2), rungs 10 to 14 in apart`,
      ),
      width: ArchetypeBand.metres(
        0.29,
        0.41,
        `${OSHA}(b)(4), portable ladder rungs at least 11.5 in (29 cm) clear; the upper end is the fixed ladder's minimum`,
        true,
      ),
      rungDiameter: ArchetypeBand.metres(0.025, 0.035, RUNG, true),
      pitch: ArchetypeBand.of(
        "degrees",
        QUARTER,
        QUARTER,
        "29 CFR 1926.1053(b)(5)(i), the foot a quarter of the working length from the wall (https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1053); the angle is the arccosine of one quarter, about 75.5 degrees",
      ),
      mass: ArchetypeBand.of("kg", 0.8, 1.5, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
