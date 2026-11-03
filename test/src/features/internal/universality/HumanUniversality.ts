import { AutoMovieHumanBodyLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanOralCavity } from "../../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { AutoMovieHumanLoftAperture } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftAperture } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanCurveCollapse } from "../curves/HumanCurveCollapse";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

type V3 = [number, number, number];
type ISurface = AutoMovieHumanBodySurface.IOutput;

/**
 * Whether one construction serves every person (the universality gate): each
 * person built stage by stage along the public path `AutoMovieHuman` takes,
 * the body law, the skin with the lips' refinement box, and the oral cavity's
 * rim, each stage's outcome kept, so a failure names its stage, its message
 * and the person's inputs that lie outside the passing people's range.
 *
 * The rim is read in the rim's own terms (`AutoMovieHumanOralCavity.rim`):
 * the skin's open edges whose two ends lie on the mouth's outline, or on a
 * closed seam's line a hair off it, grouped into connected components, each
 * with its edge count, whether it closes, its lateral range, its height range
 * against the contact line, its signed distance to the outline, and whether
 * it reaches the commissures.
 */
export namespace HumanUniversality {
  /** One person's stages. */
  export interface IPerson {
    /** Person. */
    person: string;

    /** The first stage that threw, or null when every stage passed. */
    failed: "body law" | "skin" | "oral rim" | null;

    /** The thrown message, or empty. */
    message: string;

    /** The collapse box rows of the body's chains that fail. */
    flung: HumanAnatomyAudit.IRow[];

    /** The rim's components and the seam's measures, when the skin was built. */
    rim: string[];
  }

  /** One person built once per process. */
  export function person(name: string): IPerson {
    return people.read(name, (): IPerson => {
      const params: IAutoMovieHumanParameters = HumanPeople.params(name);
      let law: AutoMovieHumanBodyLaw.IOutput;
      try {
        law = AutoMovieHumanBodyLaw.calibrate(params);
      } catch (error) {
        return { person: name, failed: "body law", message: (error as Error).message, flung: [], rim: [] };
      }
      const flung: HumanAnatomyAudit.IRow[] = law.body.chains
        .filter((c: IAutoMovieHumanLoftChain): boolean => HumanCurveCollapse.CHAINS.test(c.name))
        .map((c: IAutoMovieHumanLoftChain, k: number): HumanAnatomyAudit.IRow => HumanCurveCollapse.boxed(name, law.body.stature, c, k))
        .filter((r: HumanAnatomyAudit.IRow): boolean => r.value > 0);
      let surface: ISurface;
      try {
        surface = AutoMovieHumanBodySurface.generate(law.body, [lipsBox(law)]);
      } catch (error) {
        return { person: name, failed: "skin", message: (error as Error).message, flung, rim: [] };
      }
      const opening: IAutoMovieHumanLoftAperture | undefined = law.body.apertures.find((a: IAutoMovieHumanLoftAperture): boolean => a.name === "mouth");
      const rim: string[] = opening === undefined ? ["no mouth aperture"] : components(surface, opening, law);
      try {
        if (opening !== undefined) AutoMovieHumanOralCavity.rim(surface.mesh, opening);
      } catch (error) {
        return { person: name, failed: "oral rim", message: (error as Error).message, flung, rim };
      }
      return { person: name, failed: null, message: "", flung, rim };
    });
  }

  /** The box 3 mm round the lips' boundary that `AutoMovieHuman` refines the skin in. */
  export function lipsBox(law: AutoMovieHumanBodyLaw.IOutput): [V3, V3] {
    const ends: V3[] = law.vermilion.spans.flatMap((s: { start: V3; end: V3 }): V3[] => [s.start, s.end]);
    const lo: V3 = [0, 1, 2].map((k: number): number => Math.min(...ends.map((p: V3): number => p[k]!)) - 3) as V3;
    const hi: V3 = [0, 1, 2].map((k: number): number => Math.max(...ends.map((p: V3): number => p[k]!)) + 3) as V3;
    return [lo, hi];
  }

  /** The rim's open-edge components in the rim's own terms, one line each, then the seam and the head's layer spacing near stomion. */
  export function components(surface: ISurface, aperture: IAutoMovieHumanLoftAperture, law: AutoMovieHumanBodyLaw.IOutput): string[] {
    const mesh: ISurface["mesh"] = surface.mesh;
    const P: number[] = mesh.positions;
    const I: number[] = mesh.indices;
    const count: number = P.length / 3;
    const outline: AutoMovieHumanLoftAperture.IOutline = AutoMovieHumanLoftAperture.outline(aperture, AutoMovieHumanLoftAperture.polyline(aperture));
    const seam: IAutoMovieHumanLoftAperture["seam"] = aperture.seam;
    const point: (v: number) => V3 = (v: number): V3 => [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
    const line: (z: number) => number = (z: number): number => {
      if (seam === undefined) return NaN;
      const n: number = seam.contact.length - 1;
      const u: number = Math.min(1, Math.abs(z) / seam.width) * n;
      const i: number = Math.min(n - 1, Math.floor(u));
      return seam.contact[i]! + (u - i) * (seam.contact[i + 1]! - seam.contact[i]!);
    };
    const near: (v: number) => boolean = (v: number): boolean => {
      const p: V3 = point(v);
      return seam !== undefined
        ? Math.abs(Math.abs(p[1] - line(p[2])) - seam.closed) < 1e-6 && Math.abs(AutoMovieHumanLoftAperture.signed(outline, p, 1)) < 1
        : Math.abs(AutoMovieHumanLoftAperture.signed(outline, p, 1)) < 0.15;
    };
    const directed: Set<number> = new Set();
    for (let t: number = 0; t < I.length; t += 3) for (let i: number = 0; i < 3; i++) directed.add(I[t + i]! * count + I[t + ((i + 1) % 3)]!);
    const next: Map<number, number> = new Map();
    for (let t: number = 0; t < I.length; t += 3)
      for (let i: number = 0; i < 3; i++) {
        const u: number = I[t + i]!;
        const v: number = I[t + ((i + 1) % 3)]!;
        if (!directed.has(v * count + u) && near(u) && near(v)) next.set(u, v);
      }

    // Components of the edge map, walked forward from each unvisited start.
    const seen: Set<number> = new Set();
    const out: string[] = [];
    for (const start of next.keys()) {
      if (seen.has(start)) continue;
      const loop: number[] = [];
      let v: number | undefined = start;
      while (v !== undefined && !seen.has(v)) {
        seen.add(v);
        loop.push(v);
        v = next.get(v);
      }
      const closed: boolean = v === start;
      const pts: V3[] = loop.map(point);
      const range: (f: (p: V3) => number) => string = (f: (p: V3) => number): string => `${Math.min(...pts.map(f)).toFixed(2)}..${Math.max(...pts.map(f)).toFixed(2)}`;
      const commissure: boolean = seam !== undefined && pts.some((p: V3): boolean => Math.abs(Math.abs(p[2]) - seam.width) <= 1);
      out.push(
        `component ${out.length}: ${loop.length} edges, ${closed ? "closed" : "open"}; z ${range((p: V3): number => p[2])}; y - contact ${range((p: V3): number => p[1] - line(p[2]))}; to outline ${range((p: V3): number => AutoMovieHumanLoftAperture.signed(outline, p, 1))}; commissure ${commissure ? "yes" : "no"}`,
      );
    }
    if (seam !== undefined) out.push(`seam: half width ${seam.width.toFixed(2)}, closed offset ${seam.closed.toExponential(2)}, contact ${seam.contact.map((c: number): string => c.toFixed(2)).join(" ")}`);

    // The head chains' layer spacing within 3 mm of stomion, the contact line's midline height.
    const stomion: number = seam === undefined ? NaN : seam.contact[0]!;
    for (const name of ["head.lower", "head.middle"]) {
      const c: IAutoMovieHumanLoftChain | undefined = law.body.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === name);
      const ys: number[] = (c?.layers ?? []).map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y).filter((y: number): boolean => Math.abs(y - stomion) <= 3);
      out.push(`${name} layers within 3 mm of stomion (${stomion.toFixed(2)}): ${ys.map((y: number): string => y.toFixed(3)).join(" ") || "none"}; gaps ${ys.slice(1).map((y: number, i: number): string => (y - ys[i]!).toFixed(3)).join(" ") || "-"}`);
    }
    return out;
  }

  /** Every numeric input leaf of a parameter object, by dotted path. */
  export function leaves(value: unknown, prefix: string = "", out: Map<string, number> = new Map()): Map<string, number> {
    if (typeof value === "number") out.set(prefix, value);
    else if (value !== null && typeof value === "object") for (const [k, v] of Object.entries(value as Record<string, unknown>)) leaves(v, prefix === "" ? k : `${prefix}.${k}`, out);
    return out;
  }
}

/** Every person's stages, built once per process. */
const people: HumanOnce<HumanUniversality.IPerson> = new HumanOnce();
