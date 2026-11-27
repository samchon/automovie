import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";
import { BED_BANDS } from "../constants/BED_BANDS";
import type { AutoMovieArchetypeBed } from "../AutoMovieArchetypeBed";

/*
 * The shorthand every construction uses.
 */
const v: typeof Vector3.create = Vector3.create;

/*
 * Bed linen.
 */
const LINEN: string = "#e7e3da";

/*
 * Painted steel.
 */
const FRAME: string = "#c9cdd2";

/*
 * Pine.
 */
const PINE: string = "#c8a77a";

/*
 * Lay the two long edges of a lying surface as seats facing out, as a plain bed
 * has them.
 * Parameter builder: The builder to fill.
 * Parameter width: The surface's width along `X`, metres.
 * Parameter length: Its length along `Z`, metres.
 * Parameter height: Its height, metres.
 */
function sides(
  builder: Builder,
  width: number,
  length: number,
  height: number,
): void {
  for (const [id, sign] of [
    ["leftSide", 1],
    ["rightSide", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "seat",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * width) / 2, height, 0),
        v(0, 1, 0),
        v(0, 0, -sign),
      ),
      extent: null,
      width: length,
      depth: width / 2,
    });
}

/*
 * How createBed builds the beds of care and of children: a hospital bed,
 * a crib and a bunk bed, each with its head toward `-Z` as every bed of the
 * producer has it.
 */
export namespace CareBedConstruction {
  /*
   * The construction sizes no source read gives, metres, each an estimate no
   * act reads and no band declares: `slat`, a crib slat's diameter; `bar`, a
   * top rail's or guardrail's diameter; `post`, a corner post's side; `base`,
   * the depth of the frame under a mattress.
   */
  export const ESTIMATES: Readonly<{
    slat: number;
    bar: number;
    post: number;
    base: number;
  }> = {
    slat: 0.02,
    bar: 0.03,
    post: 0.05,
    base: 0.03,
  };

  /*
   * A hospital bed's caster radius, metres: half the GoBed II sheet's 6 in
   * (15.2 cm) casters.
   */
  export const CASTER: number = 0.152 / 2;

  /*
   * A stretcher's caster radius, metres: half the Prime spec sheet's "Caster
   * diameter 8" (20 cm)"
   * (https://www.stryker.com/content/dam/stryker/acute-care/products/primeseries/resources/Prime%20Series%20Spec%20Sheet%20Mkt%20Lit-369.pdf).
   */
  export const PRIME_CASTER: number = 0.2 / 2;

  /*
   * Where a hospital bed's casters stand across it from the centre, as a share
   * of its patient surface's width: a construction estimate no act reads. The
   * GoBed II sheet gives its overall width only with the siderails up, which is
   * not the base's.
   */
  export const CASTER_SPREAD: number = 1 / 3;

  /*
   * The widest clear gap between a crib's slats, metres: 16 CFR 1508.4(a), 2
   * 3/8 in (6 cm).
   */
  export const SLAT_GAP: number = 0.06;

  /*
   * The least height of a bunk's guardrail above its mattress, metres: 16 CFR
   * 1513.3(a)(6), 5 in (130 mm).
   */
  export const GUARD: number = 0.13;

  /*
   * The widest gap a bunk's shorter guardrail may leave to a bed end, metres:
   * 16 CFR 1513.3(a)(3), 15 in (380 mm).
   */
  export const GUARD_GAP: number = 0.38;

  /*
   * A hospital bed: a base on four casters under the litter, the mattress on
   * it, and a siderail panel along each side whose top is a bar.
   *
   * `leftRail` and `rightRail` are the siderails' tops, bars whose `+Y` points
   * out from the bed; `surface` and the side seats are the plain bed's.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
   */
  export function hospital(builder: Builder, d: Drawn): void {
    const width: number = d.width!;
    const length: number = d.length!;
    const litter: number = d.litter!;
    const top: number = litter + d.thickness!;
    const outer: number = d.overallWidth!;
    const long: number = d.overallLength!;
    for (const [id, sx, sz] of [
      ["caster-1", 1, 1],
      ["caster-2", -1, 1],
      ["caster-3", 1, -1],
      ["caster-4", -1, -1],
    ] as const)
      builder.ball(
        id,
        CASTER,
        v(sx * width * CASTER_SPREAD, CASTER, sz * (long / 2 - CASTER)),
        { color: "#3a3d42" },
      );
    builder.box(
      "base",
      v(width, litter - 2 * CASTER, long),
      v(0, (litter + 2 * CASTER) / 2, 0),
      { color: FRAME },
    );
    builder.box(
      "mattress",
      v(width, d.thickness!, length),
      v(0, (litter + top) / 2, 0),
      { color: LINEN, density: 0.3 },
    );
    const railTop: number = top + d.rail!;
    const panel: number = (outer - width) / 2;
    for (const [id, part, sign] of [
      ["leftRail", "rail-left", 1],
      ["rightRail", "rail-right", -1],
    ] as const) {
      const x: number = (sign * (outer + width)) / 4;
      builder.box(
        part,
        v(panel, railTop - litter, length),
        v(x, (railTop + litter) / 2, 0),
        { color: FRAME },
      );
      builder.affordance({
        id,
        kind: "bar",
        symmetry: "half",
        frame: AutoMovieArchetypeFrame.facing(
          v(x, railTop, 0),
          v(sign, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        length,
      });
    }
    builder.affordance({
      id: "surface",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, 0)),
      extent: null,
      width,
      depth: length,
    });
    sides(builder, width, length, top);
  }

  /*
   * A hospital stretcher: a base on four casters under the litter and the
   * mattress on it, its siderails not built since no source read gives their
   * height.
   *
   * `surface` and the side seats are the plain bed's.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
   */
  export function gurney(builder: Builder, d: Drawn): void {
    const width: number = d.width!;
    const length: number = d.length!;
    const litter: number = d.litter!;
    const top: number = litter + d.thickness!;
    const long: number = d.overallLength!;
    for (const [id, sx, sz] of [
      ["caster-1", 1, 1],
      ["caster-2", -1, 1],
      ["caster-3", 1, -1],
      ["caster-4", -1, -1],
    ] as const)
      builder.ball(
        id,
        PRIME_CASTER,
        v(
          sx * (d.overallWidth! / 2 - PRIME_CASTER),
          PRIME_CASTER,
          sz * (long / 2 - PRIME_CASTER),
        ),
        { color: "#3a3d42" },
      );
    builder.box(
      "base",
      v(width, litter - 2 * PRIME_CASTER, long),
      v(0, (litter + 2 * PRIME_CASTER) / 2, 0),
      { color: FRAME },
    );
    builder.box(
      "mattress",
      v(width, d.thickness!, length),
      v(0, (litter + top) / 2, 0),
      { color: LINEN, density: 0.3 },
    );
    builder.affordance({
      id: "surface",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, 0)),
      extent: null,
      width,
      depth: length,
    });
    sides(builder, width, length, top);
  }

  /*
   * A full-size crib: its mattress on a support panel, four corner posts, a top
   * rail along each long side at the drawn height, and slats under each rail
   * and across each end no further apart than the regulation allows.
   *
   * The support lies the regulation's rail height below the rails' tops, at its
   * lowest setting. `leftRail` and `rightRail` are the long sides' top rails,
   * round bars a hand lifts a child over; `surface` is the mattress's top.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
   */
  export function crib(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const width: number = d.width!;
    const length: number = d.length!;
    const thick: number = d.thickness!;
    const rail: number = d.height!;
    const support: number = rail - d.rail!;
    const r: number = E.bar / 2;
    const x: number = width / 2 + r;
    const z: number = length / 2 + r;
    builder.box("support", v(width, 0.02, length), v(0, support - 0.01, 0), {
      color: FRAME,
    });
    builder.box(
      "mattress",
      v(width, thick, length),
      v(0, support + thick / 2, 0),
      { color: LINEN, density: 0.3 },
    );
    for (const [id, sx, sz] of [
      ["post-1", 1, 1],
      ["post-2", -1, 1],
      ["post-3", 1, -1],
      ["post-4", -1, -1],
    ] as const)
      builder.box(id, v(E.post, rail, E.post), v(sx * x, rail / 2, sz * z), {
        color: FRAME,
      });
    for (const [id, part, sign] of [
      ["leftRail", "rail-left", 1],
      ["rightRail", "rail-right", -1],
    ] as const) {
      builder.rod(
        part,
        r,
        v(sign * x, rail - r, -z),
        v(sign * x, rail - r, z),
        { color: FRAME },
      );
      builder.affordance({
        id,
        kind: "bar",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          v(sign * x, rail - r, 0),
          v(sign, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        length: 2 * z,
      });
    }

    // Slats: the centre spacing never exceeds a slat plus the regulation's clear gap, so no gap between neighbours does.
    const pitch: number = SLAT_GAP + E.slat;
    const alongSide: number = Math.ceil(length / pitch);
    const acrossEnd: number = Math.ceil(width / pitch);
    for (const sign of [1, -1] as const) {
      const tag: string = sign > 0 ? "a" : "b";
      for (let k: number = 0; k < alongSide; k++) {
        const at: number = -length / 2 + (length * (k + 0.5)) / alongSide;
        builder.rod(
          `slat-side-${tag}-${k + 1}`,
          E.slat / 2,
          v(sign * x, support, at),
          v(sign * x, rail - E.bar, at),
          { color: FRAME },
        );
      }
      for (let k: number = 0; k < acrossEnd; k++) {
        const at: number = -width / 2 + (width * (k + 0.5)) / acrossEnd;
        builder.rod(
          `slat-end-${tag}-${k + 1}`,
          E.slat / 2,
          v(at, support, sign * z),
          v(at, rail - E.bar, sign * z),
          { color: FRAME },
        );
      }
    }
    builder.affordance({
      id: "surface",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, support + thick, 0)),
      extent: null,
      width,
      depth: length,
    });
  }

  /*
   * A bunk bed: four corner posts to its height, the lower mattress resting at
   * the maker's clearance above the floor, the upper the maker's gap above it,
   * and a guardrail along each long side of the upper bed at least 5 in over
   * its thickest mattress, the `+X` one stopping the regulation's opening short
   * of the foot end, where the bed is climbed.
   *
   * `surface` and the side seats are the lower bed's; `upper` is the upper
   * mattress's top; `guard` the continuous `-X` guardrail's top, a bar.
   * Parameter builder: The builder to fill.
   * Parameter d: The drawn dimensions.
   */
  export function bunk(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const width: number = d.width!;
    const length: number = d.length!;
    const thick: number = d.thickness!;
    const x: number = d.overallWidth! / 2 - E.post / 2;
    const z: number = d.overallLength! / 2 - E.post / 2;
    const lower: number = d.clearance!;
    const upper: number = lower + d.gap!;
    const guard: number = upper + BED_BANDS.bunk.thickness!.maximum + GUARD;
    for (const [id, sx, sz] of [
      ["post-1", 1, 1],
      ["post-2", -1, 1],
      ["post-3", 1, -1],
      ["post-4", -1, -1],
    ] as const)
      builder.box(
        id,
        v(E.post, d.height!, E.post),
        v(sx * x, d.height! / 2, sz * z),
        { color: PINE, surface: "wood" },
      );
    for (const [level, y] of [
      ["lower", lower],
      ["upper", upper],
    ] as const) {
      builder.box(
        `base-${level}`,
        v(width, E.base, length),
        v(0, y - E.base / 2, 0),
        { color: PINE, surface: "wood" },
      );
      builder.box(
        `mattress-${level}`,
        v(width, thick, length),
        v(0, y + thick / 2, 0),
        { color: LINEN, density: 0.3 },
      );
    }
    const r: number = E.bar / 2;
    builder.rod("guard-left", r, v(-x, guard - r, -z), v(-x, guard - r, z), {
      color: PINE,
      surface: "wood",
    });
    builder.rod(
      "guard-right",
      r,
      v(x, guard - r, -z),
      v(x, guard - r, z - GUARD_GAP),
      { color: PINE, surface: "wood" },
    );
    builder.affordance({
      id: "guard",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(-x, guard - r, 0),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      length: 2 * z,
    });
    builder.affordance({
      id: "upper",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, upper + thick, 0)),
      extent: null,
      width,
      depth: length,
    });
    builder.affordance({
      id: "surface",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, lower + thick, 0)),
      extent: null,
      width,
      depth: length,
    });
    sides(builder, width, length, lower + thick);
  }
}

/*
 * The builder every construction fills.
 */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeBed.Affordance,
  AutoMovieArchetypeBed.Dimension
>;

/*
 * The drawn dimensions.
 */
type Drawn = Partial<Record<AutoMovieArchetypeBed.Dimension, number>>;
