import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootBody,
  IAutoMovieHumanFootSectionJets,
  IAutoMovieHumanFootSectors,
  IAutoMovieHumanFootWebLine,
  IAutoMovieHumanLimbFrame,
  IAutoMovieLoftContract,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

import { AutoMovieHumanFootArc } from "./AutoMovieHumanFootArc";
import { AutoMovieHumanFootFan } from "./AutoMovieHumanFootFan";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";
import { AutoMovieHumanFootSectionJets } from "./AutoMovieHumanFootSectionJets";
import { AutoMovieHumanFootSectors } from "./AutoMovieHumanFootSectors";

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
  /** Control points of a body section. */
  export const ORDER: number = 256;

  /** A foot's body. */
  export function of(
    input: IAutoMovieHumanFootBody.IInput,
  ): IAutoMovieHumanFootBody.IBody {
    const line: IAutoMovieHumanFootWebLine.IWebLine = input.line;
    const guides: IAutoMovieHumanFootBody.IGuides = input.guides;
    const corner: number = AutoMovieHumanFootHeelCorner.height(input.frame);

    // A broken contract degrades and is recorded once per kind and place.
    const sink: IAutoMovieLoftContract.IDiagnostic[] = input.diagnostics ?? [];
    const recorded: Set<string> = new Set();
    const record = (contract: string, detail: string): void => {
      if (recorded.has(detail)) return;
      recorded.add(detail);
      sink.push({
        producer: input.producer ?? "foot",
        level: BASE_LEVEL,
        contract,
        detail,
      });
    };

    // The section at a station, or why its premise fails there.
    const attempt = (
      station: number,
      force: boolean,
    ): IAutoMovieHumanFootBody.ISection | string => {
      const frame: IAutoMovieLoftSectionFrame = AutoMovieHumanFootFan.plane(
        line,
        station,
      );
      const local = (p: AutoMovieVector3Tuple): Vec2 => {
        const r: AutoMovieVector3Tuple = G.sub(p, line.origin);

        return [G.dot(r, frame.v), G.dot(r, frame.u)];
      };
      const world = (q: Vec2): AutoMovieVector3Tuple =>
        G.plus(
          line.origin,
          G.plus(G.scale(frame.v, q[0]), G.scale(frame.u, q[1])),
        );
      const C: Vec2 = local(
        AutoMovieHumanFootGuide.at(guides.crest, line, station),
      );
      const X: Vec2 = local(
        AutoMovieHumanFootGuide.at(guides.lateral, line, station),
      );
      const El: Vec2 = local(
        AutoMovieHumanFootGuide.at(guides.contactLateral, line, station),
      );
      const Em: Vec2 = local(
        AutoMovieHumanFootGuide.at(guides.contactMedial, line, station),
      );
      const M: Vec2 = local(
        AutoMovieHumanFootGuide.at(guides.medial, line, station),
      );

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
          [C, X, El, Em, M]
            .map(
              (q: Vec2): string => `(${q[0].toFixed(1)}, ${q[1].toFixed(1)})`,
            )
            .join(" ")
        );

      // The guides' jets: what both arcs meeting at each point copy.
      const jets: IAutoMovieHumanFootSectionJets.IJets =
        AutoMovieHumanFootSectionJets.of({
          points: {
            crest: C,
            lateral: X,
            contactLateral: El,
            contactMedial: Em,
            medial: M,
          },
          heights: { lateral: world(El)[1], medial: world(Em)[1] },
          corner,
        });
      const sectors: IAutoMovieHumanFootSectors.ISectors =
        AutoMovieHumanFootSectors.join(
          AutoMovieHumanFootArc.pieces(
            AutoMovieHumanFootArc.BODY,
            jets,
            POINTS,
          ).map(AutoMovieHumanFootSectors.piece),
          SHARES,
          (detail: string): void =>
            record(
              "a cleft lies on the web ring",
              `${detail} at station ${station.toFixed(3)}`,
            ),
        );

      return {
        ring: Array.from(
          { length: ORDER },
          (_: unknown, m: number): AutoMovieVector3Tuple =>
            world(sectors.at((G.TWO_PI * m) / ORDER)),
        ),
        frame,
        at: (t: number): AutoMovieVector3Tuple => world(sectors.at(t)),
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
    const section = (station: number): IAutoMovieHumanFootBody.ISection => {
      const own: IAutoMovieHumanFootBody.ISection | string = attempt(
        station,
        false,
      );
      if (typeof own !== "string") return own;
      const step: number = line.end / SEARCH_STEPS;
      for (let k: number = 1; k <= SEARCH_STEPS; k++)
        for (const s of [station - k * step, station + k * step]) {
          if (s < 0 || s > line.end) continue;
          const near: IAutoMovieHumanFootBody.ISection | string = attempt(
            s,
            false,
          );
          if (typeof near !== "string") {
            record(
              "the five guide points stand in the section's order",
              `${own}; read at station ${s.toFixed(3)}`,
            );
            return near;
          }
        }
      record(
        "the five guide points stand in the section's order",
        `${own}; no station in order`,
      );
      return attempt(station, true) as IAutoMovieHumanFootBody.ISection;
    };
    const stations: number[] = [
      ...Array.from(
        { length: YAW_LAYERS },
        (_: unknown, i: number): number =>
          line.square * (i / YAW_LAYERS) ** YAW_GRADE,
      ),
      ...Array.from(
        { length: TURN_LAYERS },
        (_: unknown, i: number): number =>
          line.square + (line.end - line.square) * (i / (TURN_LAYERS - 1)),
      ),
    ];

    return {
      stations,
      fan: line,
      section,
      guide: (
        name: "crest" | "lateral" | "medial",
        station: number,
      ): AutoMovieVector3Tuple =>
        AutoMovieHumanFootGuide.at(guides[name], line, station),
      sample: (station: number): IAutoMovieHumanLimbFrame.ISample => {
        const s: IAutoMovieHumanFootBody.ISection = section(
          Math.min(line.end, Math.max(0, station)),
        );

        return { station, frame: s.frame, ring: s.ring };
      },
    };
  }
}

type Vec2 = AutoMovieVector2Tuple;

/*
 * Control points of each of the body's five pieces: dorsal-lateral,
 * lateral-plantar, the contact, the medial arch, dorsal-medial. Fixed, so every
 * guide stands at a fixed phase on every section.
 */
const SHARES: readonly number[] = [51, 46, 56, 52, 51];

/*
 * The body's construction level, the base envelope's (`construction-levels.md`).
 */
const BASE_LEVEL: number = 2;

/*
 * Steps over the stations' whole range a degraded section searches for its nearest valid station.
 */
const SEARCH_STEPS: number = 256;

/*
 * Layers of the yaw fan and the turn fan, and the grading toward the web ring. Convention.
 */
const YAW_LAYERS: number = 10;
const YAW_GRADE: number = 1.5;
const TURN_LAYERS: number = 28;

/*
 * Points of each piece before arclength resampling.
 */
const POINTS: number = 192;
