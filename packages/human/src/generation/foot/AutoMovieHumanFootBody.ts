import type { AutoMovieLoftContract, AutoMovieLoftFrame } from "@automovie/engine";
import type { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import { AutoMovieHumanFootFan } from "./AutoMovieHumanFootFan";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";
import { AutoMovieHumanFootSectionJets } from "./AutoMovieHumanFootSectionJets";
import { AutoMovieHumanFootSectors } from "./AutoMovieHumanFootSectors";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;
type Vec2 = G.Vec2;

/**
 * The foot's body from the web ring to the ankle ring, composed of its pieces.
 *
 * Every section lies in the fan's plane at its station ({@link AutoMovieHumanFootFan})
 * and is five pieces between five guides ({@link AutoMovieHumanFootGuide}), each
 * guide owning the jet at its point (place; tangent across the plane at the
 * crest and the contact edges, along its up axis at the borders; curvature from
 * {@link AutoMovieHumanFootSectionJets}): the dorsal-lateral piece, the lateral
 * border's plantar piece, the sole's contact, the medial arch and the
 * dorsal-medial piece of {@link AutoMovieHumanFootArc.BODY}. Each piece
 * owns a fixed share of the section's control points ({@link AutoMovieHumanFootSectors}).
 */
export namespace AutoMovieHumanFootBody {
  /** The five guides a section stands between. */
  export interface IGuides {
    /** The instep's crest. */
    crest: AutoMovieHumanFootGuide.IGuide;

    /** The lateral border. */
    lateral: AutoMovieHumanFootGuide.IGuide;

    /** The lateral edge of the plantar contact. */
    contactLateral: AutoMovieHumanFootGuide.IGuide;

    /** The medial edge of the plantar contact. */
    contactMedial: AutoMovieHumanFootGuide.IGuide;

    /** The medial border. */
    medial: AutoMovieHumanFootGuide.IGuide;
  }

  /** What the body reads: the frame, the fan's axes and the five guides. */
  export interface IInput {
    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** The fan's axes, levers and stations. */
    line: AutoMovieHumanFootWebLine.IWebLine;

    /** The guides. */
    guides: IGuides;

    /** The list a degraded section records into; a part viewer may leave it out. */
    diagnostics?: AutoMovieLoftContract.IDiagnostic[];

    /** The producer named in a diagnostic, such as `foot.left`. */
    producer?: string;
  }

  /** The body: its stations and the section at any station. */
  export interface IBody {
    /** The chain's layer stations, from the web ring to the ankle ring. */
    stations: number[];

    /** The section planes. */
    fan: AutoMovieHumanFootWebLine.IWebLine;

    /** The section at a station as a loft sample. */
    sample: (station: number) => AutoMovieHumanLimbFrame.ISample;

    /** The section at a station. */
    section: (station: number) => ISection;

    /** A guide's point at a station. */
    guide: (name: "crest" | "lateral" | "medial", station: number) => Vec3;
  }

  /** A section: its ring at its fixed phases and its places across. */
  export interface ISection {
    /** World points at the section's fixed phases. */
    ring: Vec3[];

    /** The section's plane. */
    frame: AutoMovieLoftFrame.IFrame;

    /** Phases on the upper and lower boundaries where the across coordinate is `v`. */
    pinches: (v: number) => { dorsal: number; plantar: number };

    /** Phase of the lateral border point. */
    lateral: number;

    /** Phase of the medial border point. */
    medial: number;

    /** A world point at a phase. */
    at: (t: number) => Vec3;
  }

  /** Control points of a body section. */
  export const ORDER: number = 256;

  /** A foot's body. */
  export function of(input: IInput): IBody {
    const line: AutoMovieHumanFootWebLine.IWebLine = input.line;
    const guides: IGuides = input.guides;
    const corner: number = AutoMovieHumanFootHeelCorner.height(input.frame);

    // A broken contract degrades and is recorded once per kind and place.
    const sink: AutoMovieLoftContract.IDiagnostic[] = input.diagnostics ?? [];
    const recorded: Set<string> = new Set();
    const record = (contract: string, detail: string): void => {
      if (recorded.has(detail)) return;
      recorded.add(detail);
      sink.push({ producer: input.producer ?? "foot", level: BASE_LEVEL, contract, detail });
    };

    // The section at a station, or why its premise fails there.
    const attempt = (station: number, force: boolean): ISection | string => {
      const frame: AutoMovieLoftFrame.IFrame = AutoMovieHumanFootFan.plane(line, station);
      const local = (p: Vec3): Vec2 => {
        const r: Vec3 = G.sub(p, line.origin);

        return [G.dot(r, frame.v), G.dot(r, frame.u)];
      };
      const world = (q: Vec2): Vec3 => G.plus(line.origin, G.plus(G.scale(frame.v, q[0]), G.scale(frame.u, q[1])));
      const C: Vec2 = local(AutoMovieHumanFootGuide.at(guides.crest, line, station));
      const X: Vec2 = local(AutoMovieHumanFootGuide.at(guides.lateral, line, station));
      const El: Vec2 = local(AutoMovieHumanFootGuide.at(guides.contactLateral, line, station));
      const Em: Vec2 = local(AutoMovieHumanFootGuide.at(guides.contactMedial, line, station));
      const M: Vec2 = local(AutoMovieHumanFootGuide.at(guides.medial, line, station));

      // Premise of the pieces: the five points stand in the order the
      // section runs; a section whose guides cross is not built here.
      const ordered: boolean =
        M[0] < C[0] &&
        C[0] < X[0] &&
        M[0] < Em[0] &&
        Em[0] <= El[0] + 1e-6 &&
        El[0] < X[0] &&
        El[1] < X[1] &&
        X[1] < C[1] &&
        Em[1] < M[1] &&
        M[1] < C[1];
      if (!ordered && !force)
        return (
          `guide points out of order at station ${station.toFixed(3)}: ` +
          [C, X, El, Em, M].map((q: Vec2): string => `(${q[0].toFixed(1)}, ${q[1].toFixed(1)})`).join(" ")
        );

      // The guides' jets: what both arcs meeting at each point copy.
      const jets: AutoMovieHumanFootSectionJets.IJets = AutoMovieHumanFootSectionJets.of({
        points: { crest: C, lateral: X, contactLateral: El, contactMedial: Em, medial: M },
        heights: { lateral: world(El)[1], medial: world(Em)[1] },
        corner,
      });
      const sectors: AutoMovieHumanFootSectors.ISectors = AutoMovieHumanFootSectors.join(
        AutoMovieHumanFootArc.pieces(AutoMovieHumanFootArc.BODY, jets, POINTS).map(AutoMovieHumanFootSectors.piece),
        SHARES,
        (detail: string): void => record("a cleft lies on the web ring", `${detail} at station ${station.toFixed(3)}`),
      );

      return {
        ring: Array.from({ length: ORDER }, (_: unknown, m: number): Vec3 => world(sectors.at((G.TWO_PI * m) / ORDER))),
        frame,
        at: (t: number): Vec3 => world(sectors.at(t)),
        lateral: sectors.start(1),
        medial: sectors.start(4),

        // The upper boundary (medial point, crest, lateral point) and the
        // lower one are graphs over the across coordinate.
        pinches: (v: number): { dorsal: number; plantar: number } => ({
          dorsal: sectors.find(v, v >= C[0] ? [0] : [4]),
          plantar: sectors.find(v, [1, 2, 3]),
        }),
      };
    };

    // A section whose guide points fall out of order degrades to the
    // nearest station, searched outward, whose points stand in order; with
    // none, the pieces are drawn on the points as they stand.
    const section = (station: number): ISection => {
      const own: ISection | string = attempt(station, false);
      if (typeof own !== "string") return own;
      const step: number = line.end / SEARCH_STEPS;
      for (let k: number = 1; k <= SEARCH_STEPS; k++)
        for (const s of [station - k * step, station + k * step]) {
          if (s < 0 || s > line.end) continue;
          const near: ISection | string = attempt(s, false);
          if (typeof near !== "string") {
            record("the five guide points stand in the section's order", `${own}; read at station ${s.toFixed(3)}`);
            return near;
          }
        }
      record("the five guide points stand in the section's order", `${own}; no station in order`);
      return attempt(station, true) as ISection;
    };
    const stations: number[] = [
      ...Array.from({ length: YAW_LAYERS }, (_: unknown, i: number): number => line.square * (i / YAW_LAYERS) ** YAW_GRADE),
      ...Array.from(
        { length: TURN_LAYERS },
        (_: unknown, i: number): number => line.square + (line.end - line.square) * (i / (TURN_LAYERS - 1)),
      ),
    ];

    return {
      stations,
      fan: line,
      section,
      guide: (name: "crest" | "lateral" | "medial", station: number): Vec3 =>
        AutoMovieHumanFootGuide.at(guides[name], line, station),
      sample: (station: number): AutoMovieHumanLimbFrame.ISample => {
        const s: ISection = section(Math.min(line.end, Math.max(0, station)));

        return { station, frame: s.frame, ring: s.ring };
      },
    };
  }
}

/**
 * Control points of each of the body's five pieces: dorsal-lateral,
 * lateral-plantar, the contact, the medial arch, dorsal-medial. Fixed, so every
 * guide stands at a fixed phase on every section.
 */
const SHARES: readonly number[] = [51, 46, 56, 52, 51];

/** The body's construction level, the base envelope's (`construction-levels.md`). */
const BASE_LEVEL: number = 2;

/** Steps over the stations' whole range a degraded section searches for its nearest valid station. */
const SEARCH_STEPS: number = 256;

/** Layers of the yaw fan and the turn fan, and the grading toward the web ring. Convention. */
const YAW_LAYERS: number = 10;
const YAW_GRADE: number = 1.5;
const TURN_LAYERS: number = 28;

/** Points of each piece before arclength resampling. */
const POINTS: number = 192;
