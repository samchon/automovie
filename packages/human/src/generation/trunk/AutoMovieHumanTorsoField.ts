import type { IAutoMovieConstructionProfileSource as Profile } from "@automovie/engine";

import { AutoMovieHumanTorsoCollar } from "./AutoMovieHumanTorsoCollar";
import type { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";
import { AutoMovieHumanTorsoRegion } from "./AutoMovieHumanTorsoRegion";
import { AutoMovieHumanTorsoWall } from "./AutoMovieHumanTorsoWall";
import type { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";

/** The whole original torso formula and its actual Point0/phase/physical2 capabilities. */
export namespace AutoMovieHumanTorsoField {
  /** Same-formula contributor readings; these are source values, not new generating curves. */
  export interface IContributors {
    /** Regional wall contributor in calibration-mm XZ. */
    readonly body: Profile.Vector;

    /** Shared native neck contributor in that identical physical plane. */
    readonly neck: Profile.Vector;

    /** Actual original collar weight and all of its partials. */
    readonly weight: AutoMovieHumanTorsoCollar.IReading;

    /** First phase derivative from the two original geometries, excluding the weight derivative. */
    readonly geometryPhase: Profile.Vector | null;

    /** First phase derivative from weight.t times the original XZ difference. */
    readonly weightPhase: Profile.Vector;
  }

  /** One shared formula, before any loft or atlas tessellation. */
  export interface IOutput extends Pick<
    Profile.ICurve,
    "point" | "phase" | "jet"
  > {
    /** Independently supplied phase capability of this actual formula. */
    phase(station: number, clock: number): Profile.IPhase | null;

    /** Read the actual two contributors and product-rule terms on a jointly supported plane. */
    contributors(station: number, clock: number): IContributors;

    /** Same caller-owned wall contributor. */
    readonly wall: AutoMovieHumanTorsoWall.IOutput;

    /** Same prepared regional AP envelopes and original material clocks. */
    readonly regions: readonly AutoMovieHumanTorsoRegion.IField[];

    /** Same actual neck and complete base-course ownership. */
    readonly collar: AutoMovieHumanTorsoCollar.IField;
  }

  /** Compose actual common-plane originals; requested derivatives follow the same source equation analytically. */
  export function create(
    plan: AutoMovieHumanTorsoPlan.IOutput,
    sections?: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane>,
  ): IOutput {
    const wall: AutoMovieHumanTorsoWall.IOutput =
      AutoMovieHumanTorsoWall.create(plan, sections);
    const collar: AutoMovieHumanTorsoCollar.IField =
      AutoMovieHumanTorsoCollar.create(plan.neckFamily, plan.collarStart);
    const regions: readonly AutoMovieHumanTorsoRegion.IField[] =
      plan.regions.map(
        (
          region: AutoMovieHumanTorsoPlan.IRegion,
        ): AutoMovieHumanTorsoRegion.IField => {
          const clock: number = wall.clock(
            region.apex[1],
            region.apex[2],
            region.outward,
          );
          const projection: number =
            region.outward *
            (region.apex[0] - wall.point(region.apex[1], clock)[0]);
          return AutoMovieHumanTorsoRegion.create(region, clock, projection);
        },
      );

    /** Regional AP control formula, independently of a neck or derivative demand. */
    const bodyPoint: (station: number, clock: number) => Profile.Vector = (
      station: number,
      clock: number,
    ): Profile.Vector => {
      const p: Profile.Vector = wall.point(station, clock);
      let x: number = p[0];
      for (const region of regions)
        x +=
          region.weight(station, p[1], clock) * (region.region.apex[0] - p[0]);
      return [x, p[1]];
    };

    /** Phase-only product rule does not require physical station2. */
    const bodyPhase: (
      station: number,
      clock: number,
    ) => Profile.IPhase | null = (
      station: number,
      clock: number,
    ): Profile.IPhase | null => {
      const base: Profile.IPhase | null = wall.phase(station, clock);
      if (base === null) return null;
      let x: number = base.p[0];
      let xt: number = base.t[0];
      let xtt: number | null = base.tt?.[0] ?? null;
      for (const region of regions) {
        const w: AutoMovieHumanTorsoRegion.IWeight = region.phase(
          station,
          base,
          clock,
        );
        const delta: number = region.region.apex[0] - base.p[0];
        x += w.p * delta;
        xt += w.t * delta - w.p * base.t[0];
        if (xtt === null || w.tt === null || base.tt === null) xtt = null;
        else xtt += w.tt * delta - 2 * w.t * base.t[0] - w.p * base.tt[0];
      }
      return {
        p: [x, base.p[1]],
        t: [xt, base.t[1]],
        tt: xtt === null || base.tt === null ? null : [xtt, base.tt[1]],
      };
    };

    /** Full chain rule for the same compact AP source; no numerical differentiation or absent zero jets. */
    const bodyJet: (station: number, clock: number) => Profile.IJet | null = (
      station: number,
      clock: number,
    ): Profile.IJet | null => {
      const base: Profile.IJet | null = wall.jet(station, clock);
      if (base === null) return null;
      const result: Profile.IJet = {
        p: [...base.p],
        s: [...base.s],
        t: [...base.t],
        ss: [...base.ss],
        st: [...base.st],
        tt: [...base.tt],
      };
      for (const region of regions) {
        const w: AutoMovieHumanTorsoRegion.ITotal = region.jet(
          station,
          base,
          clock,
        );
        const delta: number = region.region.apex[0] - base.p[0];
        result.p[0] += w.p * delta;
        result.s[0] += w.s * delta - w.p * base.s[0];
        result.t[0] += w.t * delta - w.p * base.t[0];
        result.ss[0] += w.ss * delta - 2 * w.s * base.s[0] - w.p * base.ss[0];
        result.st[0] +=
          w.st * delta - w.s * base.t[0] - w.t * base.s[0] - w.p * base.st[0];
        result.tt[0] += w.tt * delta - 2 * w.t * base.t[0] - w.p * base.tt[0];
      }
      return result;
    };
    return {
      wall,
      regions,
      collar,
      contributors(station: number, clock: number): IContributors {
        const weight: AutoMovieHumanTorsoCollar.IReading = collar.at(station, clock);
        const body: Profile.Vector = bodyPoint(station, clock);
        const neck: Profile.Vector = plan.neckFamily.curve.point(station, clock);
        const b: Profile.IPhase | null = bodyPhase(station, clock);
        const n: Profile.IPhase | null = plan.neckFamily.curve.phase?.(station, clock) ?? null;
        return { body, neck, weight,
          geometryPhase: b === null || n === null ? null : [
            (1 - weight.p) * b.t[0] + weight.p * n.t[0],
            (1 - weight.p) * b.t[1] + weight.p * n.t[1]],
          weightPhase: [weight.t * (neck[0] - body[0]), weight.t * (neck[1] - body[1])] };
      },
      point(station: number, clock: number): Profile.Vector {
        const w: AutoMovieHumanTorsoCollar.IReading = collar.at(station, clock);
        if (w.source === "neck")
          return plan.neckFamily.curve.point(station, clock);
        const body: Profile.Vector = bodyPoint(station, clock);
        if (w.source === "body") return body;
        const neck: Profile.Vector = plan.neckFamily.curve.point(
          station,
          clock,
        );
        return [
          body[0] + w.p * (neck[0] - body[0]),
          body[1] + w.p * (neck[1] - body[1]),
        ];
      },
      phase(station: number, clock: number): Profile.IPhase | null {
        const w: AutoMovieHumanTorsoCollar.IReading = collar.at(station, clock);
        if (w.source === "neck")
          return plan.neckFamily.curve.phase?.(station, clock) ?? null;
        const body: Profile.IPhase | null = bodyPhase(station, clock);
        if (body === null || w.source === "body") return body;
        const neck: Profile.IPhase | null =
          plan.neckFamily.curve.phase?.(station, clock) ?? null;
        if (neck === null) return null;
        const result: Profile.IPhase = {
          p: [...body.p],
          t: [...body.t],
          tt: body.tt === null || neck.tt === null ? null : [...body.tt],
        };
        for (const component of [0, 1] as const) {
          const delta: number = neck.p[component]! - body.p[component]!;
          result.p[component] += w.p * delta;
          result.t[component] +=
            w.t * delta + w.p * (neck.t[component]! - body.t[component]!);
          if (result.tt !== null && neck.tt !== null && body.tt !== null)
            result.tt[component] +=
              w.tt * delta +
              2 * w.t * (neck.t[component]! - body.t[component]!) +
              w.p * (neck.tt[component]! - body.tt[component]!);
        }
        return result;
      },
      jet(station: number, clock: number): Profile.IJet | null {
        const w: AutoMovieHumanTorsoCollar.IReading = collar.at(station, clock);
        if (w.source === "neck")
          return plan.neckFamily.curve.jet(station, clock);
        const body: Profile.IJet | null = bodyJet(station, clock);
        if (body === null || w.source === "body") return body;
        const neck: Profile.IJet | null = plan.neckFamily.curve.jet(
          station,
          clock,
        );
        if (neck === null) return null;
        const result: Profile.IJet = {
          p: [...body.p],
          s: [...body.s],
          t: [...body.t],
          ss: [...body.ss],
          st: [...body.st],
          tt: [...body.tt],
        };
        for (const component of [0, 1] as const) {
          const delta: number = neck.p[component]! - body.p[component]!;
          const ds: number = neck.s[component]! - body.s[component]!;
          const dt: number = neck.t[component]! - body.t[component]!;
          result.p[component] += w.p * delta;
          result.s[component] += w.s * delta + w.p * ds;
          result.t[component] += w.t * delta + w.p * dt;
          result.ss[component] +=
            w.ss * delta +
            2 * w.s * ds +
            w.p * (neck.ss[component]! - body.ss[component]!);
          result.st[component] +=
            w.st * delta +
            w.s * dt +
            w.t * ds +
            w.p * (neck.st[component]! - body.st[component]!);
          result.tt[component] +=
            w.tt * delta +
            2 * w.t * dt +
            w.p * (neck.tt[component]! - body.tt[component]!);
        }
        return result;
      },
    };
  }
}
