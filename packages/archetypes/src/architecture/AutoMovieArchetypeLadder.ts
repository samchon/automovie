import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeLadderData } from "./internal/AutoMovieArchetypeLadderData";

/** Creates upright or leaning ladders with numbered rung and rail grips. */
export namespace AutoMovieArchetypeLadder {
/**
 * Creates an aluminium ladder with the feet at floor height and rung grips
 * facing the climber's approach from `+Z`.
 *
 * A `fixed` ladder rises vertically. A `leaning` ladder rises toward `-Z`
 * at 75.522? from the floor. Numbered rungs start one spacing above the feet,
 * and the two rails extend one spacing beyond the final rung.
 *
 * @param params Required kind, optional count, ID and fixed dimensions.
 *   Omitting the count gives ten rungs.
 * @param seed Draws omitted dimensions within the chosen kind. Without a seed
 *   each takes its band midpoint.
 * @returns The ladder with body mass equal to `mass` times `rungs`.
 * @throws {AutoMovieArchetypeRefusal} If the kind is unknown, the rung count
 *   is not an integer from 2 to 30, or a fixed dimension is invalid.
 */
export function create(
  params: AutoMovieArchetypeLadder.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLadder.Affordance, AutoMovieArchetypeLadder.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLadder.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLadder.Dimension>(
      "ladder",
      AutoMovieArchetypeLadder.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeLadder.Kind = ArchetypeDraw.choice(
    "ladder",
    "kind",
    params.kind,
    AutoMovieArchetypeLadder.KINDS,
  );
  const requested: number = params.rungs ?? 10;
  const rungNumbers: number[] = Array.from(
    { length: Math.min(requested, AutoMovieArchetypeLadder.RUNGS) },
    (_: unknown, index: number): number => index + 1,
  );
  const rungs: number = rungNumbers.length;
  if (rungs < 2 || rungs !== requested)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "ladder",
      axis: "rungs",
      value: requested,
      feasible: {
        kind: "range",
        minimum: 2,
        maximum: AutoMovieArchetypeLadder.RUNGS,
        unit: "",
      },
      reason: `a ladder has 2 to ${AutoMovieArchetypeLadder.RUNGS} rungs, not ${requested}`,
      fix: "give a whole number of rungs",
    });
  const d: Record<AutoMovieArchetypeLadder.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeLadder.BANDS[kind],
    AutoMovieArchetypeLadder.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLadder.Affordance,
    AutoMovieArchetypeLadder.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "aluminium",
    id: params.id,
    name: `${kind} ladder`,
    draw,
  });

  // The ladder's own line: up, tilted back toward the wall at -Z by the pitch from the floor.
  const pitch: number = d.pitch * AutoMovieArchetypeUnits.DEGREE;
  const along: IAutoMovieVector3 = AutoMovieEngineVector3.create(
    0,
    Math.sin(pitch),
    -Math.cos(pitch),
  );
  const out: IAutoMovieVector3 = AutoMovieEngineVector3.create(
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
    const foot: IAutoMovieVector3 = AutoMovieEngineVector3.create(
      sign * (d.width / 2 + radius),
      0,
      0,
    );
    builder.rod(
      `rail-${side}`,
      radius,
      foot,
      AutoMovieEngineVector3.add(foot, AutoMovieEngineVector3.scale(along, length)),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: `${side}Rail`,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.add(foot, AutoMovieEngineVector3.scale(along, length / 2)),
        out,
        along,
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length,
    });
  }
  for (const k of rungNumbers) {
    const at: IAutoMovieVector3 = AutoMovieEngineVector3.scale(along, k * d.spacing);
    builder.rod(
      `rung-${k}`,
      radius,
      AutoMovieEngineVector3.add(at, AutoMovieEngineVector3.create(-d.width / 2, 0, 0)),
      AutoMovieEngineVector3.add(at, AutoMovieEngineVector3.create(d.width / 2, 0, 0)),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: `rung${k}`,
      kind: "bar",
      materialPart: `rung-${k}`,
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(at, out, AutoMovieEngineVector3.create(1, 0, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: d.width,
    });
  }
  return builder.build(d.mass * rungs);
}

  /** `fixed` selects vertical rails. `leaning` tilts the rails toward `-Z`. */
  export type Kind = "fixed" | "leaning";

  /** Accepted ladder kinds in the order `fixed`, `leaning`. */
  export const KINDS: readonly Kind[] = ["fixed", "leaning"];

  /** Maximum number of rungs per ladder, 30. The minimum is 2. */
  export const RUNGS: number = 30;

  /**
   * Names round power-grip contacts for climbing.
   *
   * `rung1` through `rung<rungs>` run across the ladder along `+X` and each
   * targets its own drawn cylinder. `leftRail` at `+X` and `rightRail` at
   * `-X` run uphill along their rail axes.
   */
  export type Affordance = `rung${number}` | "leftRail" | "rightRail";

  /**
   * Measurements of rung spacing, grips, pitch and weight.
   *
   * `spacing` is rung separation along the ladder, `width` the clear distance
   * between the rails, and `rungDiameter` the diameter shared by rungs and
   * rails, all in metres. `pitch` is in degrees above horizontal and `mass` is
   * kilograms per rung.
   */
  export type Dimension =
    | "spacing"
    | "width"
    | "rungDiameter"
    | "pitch"
    | "mass";

  /**
   * Metres for rung lengths, degrees for `pitch`, and kilograms per rung for `mass`.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    spacing: "m",
    width: "m",
    rungDiameter: "m",
    pitch: "degrees",
    mass: "kg",
  };

  /**
   * Selects the ladder kind and optionally fixes rung count, ID and dimensions.
   *
   * Use the chosen kind's `BANDS` for fixed settings. The kind sets the pitch
   * through a band with equal endpoints.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Required choice of upright `fixed` or tilted `leaning` geometry. */
    kind: Kind;

    /** Integer rung count from 2 through 30. Defaults to 10. */
    rungs?: number;

    /** Scene-unique model ID. Defaults to `ladder`. */
    id?: string;
  }

  /**
   * Inclusive bands for each ladder kind.
   *
   * Both use 0.25?0.36 m spacing and 0.025?0.035 m diameter. `fixed` takes
   * 0.41?0.50 m width, 90? pitch and 1.5?3 kg per rung. `leaning` takes
   * 0.29?0.41 m width, arccos(0.25) in degrees and 0.8?1.5 kg per rung.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    fixed: {
      spacing: AutoMovieArchetypeBand.metres(
        0.25,
        0.36,
        `${AutoMovieArchetypeLadderData.OSHA}(b)(2), rungs 10 to 14 in (25 to 36 cm) apart`,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.41,
        0.5,
        `${AutoMovieArchetypeLadderData.OSHA}(b)(4), fixed ladder rungs at least 16 in (41 cm) clear; the upper end is an estimate`,
        true,
      ),
      rungDiameter: AutoMovieArchetypeBand.metres(0.025, 0.035, AutoMovieArchetypeLadderData.RUNG, true),
      pitch: AutoMovieArchetypeBand.of(
        "degrees",
        90,
        90,
        `${AutoMovieArchetypeLadderData.OSHA}(d)(11), a fixed ladder's pitch is at most 90 degrees from the horizontal`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1.5,
        3,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    leaning: {
      spacing: AutoMovieArchetypeBand.metres(
        0.25,
        0.36,
        `${AutoMovieArchetypeLadderData.OSHA}(b)(2), rungs 10 to 14 in (25 to 36 cm) apart`,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.29,
        0.41,
        `${AutoMovieArchetypeLadderData.OSHA}(b)(4), portable ladder rungs at least 11.5 in (29 cm) clear; the upper end is the fixed ladder's minimum`,
        true,
      ),
      rungDiameter: AutoMovieArchetypeBand.metres(0.025, 0.035, AutoMovieArchetypeLadderData.RUNG, true),
      pitch: AutoMovieArchetypeBand.of(
        "degrees",
        AutoMovieArchetypeLadderData.QUARTER,
        AutoMovieArchetypeLadderData.QUARTER,
        "29 CFR 1926.1053(b)(5)(i), the foot a quarter of the working length from the wall (https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1053); the angle is the arccosine of one quarter, about 75.5 degrees",
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.8,
        1.5,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}
