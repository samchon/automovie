import { Singleton } from "tstl";

import { AutoMovieHumanFootBody } from "../../../src/generation/foot/AutoMovieHumanFootBody";
import { AutoMovieHumanFootBones } from "../../../src/generation/foot/AutoMovieHumanFootBones";
import { AutoMovieHumanFootContactLateralGuide } from "../../../src/generation/foot/AutoMovieHumanFootContactLateralGuide";
import { AutoMovieHumanFootContactMedialGuide } from "../../../src/generation/foot/AutoMovieHumanFootContactMedialGuide";
import { AutoMovieHumanFootCrestForefoot } from "../../../src/generation/foot/AutoMovieHumanFootCrestForefoot";
import { AutoMovieHumanFootCrestGuide } from "../../../src/generation/foot/AutoMovieHumanFootCrestGuide";
import { AutoMovieHumanFootDorsalLateralArc } from "../../../src/generation/foot/AutoMovieHumanFootDorsalLateralArc";
import { AutoMovieHumanFootDorsalMedialArc } from "../../../src/generation/foot/AutoMovieHumanFootDorsalMedialArc";
import { AutoMovieHumanFootFan } from "../../../src/generation/foot/AutoMovieHumanFootFan";
import type { AutoMovieHumanFootFrame } from "../../../src/generation/foot/AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "../../../src/generation/foot/AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "../../../src/generation/foot/AutoMovieHumanFootHeelCorner";
import { AutoMovieHumanFootLateralBorder } from "../../../src/generation/foot/AutoMovieHumanFootLateralBorder";
import { AutoMovieHumanFootLateralGuide } from "../../../src/generation/foot/AutoMovieHumanFootLateralGuide";
import { AutoMovieHumanFootMedialArch } from "../../../src/generation/foot/AutoMovieHumanFootMedialArch";
import { AutoMovieHumanFootMedialGuide } from "../../../src/generation/foot/AutoMovieHumanFootMedialGuide";
import { AutoMovieHumanFootSectionJets } from "../../../src/generation/foot/AutoMovieHumanFootSectionJets";
import { AutoMovieHumanFootSoleContact } from "../../../src/generation/foot/AutoMovieHumanFootSoleContact";
import { AutoMovieHumanFootToeSection } from "../../../src/generation/foot/AutoMovieHumanFootToeSection";
import { AutoMovieHumanFootToeSpan } from "../../../src/generation/foot/AutoMovieHumanFootToeSpan";
import { AutoMovieHumanFootWebLine } from "../../../src/generation/foot/AutoMovieHumanFootWebLine";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";

/**
 * The fixed inputs of the left foot's pieces and the sampling they share.
 *
 * The inputs are the person's left foot dimensions (`extremities.feet.left`: foot length, breadth
 * and ankle height, mm) and what the foot's upstream pieces hand on: the frame and centres
 * (`AutoMovieHumanFootBones.of`), the fan axes (`AutoMovieHumanFootWebLine.of`) and the five
 * guides. They are built once per person and page load. Stations run from 0 at the web ring to
 * `line.end` at the ankle ring, in mm along the fan's axis.
 */
export namespace HumanDebugFootKit {
  /** The upstream data every foot piece reads. */
  export interface IFixed {
    /** Left foot dimensions, mm. */
    dimensions: AutoMovieHumanFootFrame.IDimensions;

    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** The centres and bones. */
    centres: AutoMovieHumanFootBones.ICentres;

    /** The fan's axes. */
    line: AutoMovieHumanFootWebLine.IWebLine;

    /** The five guides. */
    guides: AutoMovieHumanFootBody.IGuides;
  }

  /** The five section pieces between neighbouring guides. */
  export type Arc = "dorsalLateral" | "lateralPlantar" | "sole" | "arch" | "dorsalMedial";

  /**
   * The fixed inputs of a person's left foot.
   *
   * @param person The person; `extremities.feet.left` must be given.
   * @returns The inputs, built once per person.
   */
  export function fixed(person: IHumanDebugPerson): IFixed {
    let found: Singleton<IFixed> | undefined = CACHE.get(person.alias);
    if (found === undefined) {
      found = new Singleton((): IFixed => build(person));
      CACHE.set(person.alias, found);
    }
    return found.get();
  }

  /**
   * Evenly spaced stations from the web ring (0) to the ankle ring (`line.end`).
   *
   * @param f Fixed inputs.
   * @param count Station intervals.
   */
  export function stations(f: IFixed, count: number): number[] {
    return Array.from({ length: count + 1 }, (_: unknown, i: number): number => (f.line.end * i) / count);
  }

  /**
   * A guide sampled at 161 stations, mm.
   *
   * @param f Fixed inputs.
   * @param which The guide.
   */
  export function guide(f: IFixed, which: AutoMovieHumanFootGuide.IGuide): IHumanDebugDocument.Point[] {
    return stations(f, 160).map((s: number): IHumanDebugDocument.Point => AutoMovieHumanFootGuide.at(which, f.line, s));
  }

  /**
   * One section piece swept over the stations: at each station the five guide points in the fan
   * plane, their jets (`AutoMovieHumanFootSectionJets`) and the piece's own arc between its two.
   *
   * @param f Fixed inputs.
   * @param arc Which piece.
   * @param count Station intervals.
   * @returns Rows of 25 points, one per station, mm.
   */
  export function sweep(f: IFixed, arc: Arc, count: number = 80): IHumanDebugDocument.Point[][] {
    const corner: number = AutoMovieHumanFootHeelCorner.height(f.frame);
    return stations(f, count).map((s: number): IHumanDebugDocument.Point[] => {
      const plane: ReturnType<typeof AutoMovieHumanFootFan.plane> = AutoMovieHumanFootFan.plane(f.line, s);

      // Guide points as (v, u) coordinates in the station's fan plane about the fan origin.
      const at: (g: AutoMovieHumanFootGuide.IGuide) => [number, number] = (g: AutoMovieHumanFootGuide.IGuide): [number, number] => {
        const p: IHumanDebugDocument.Point = AutoMovieHumanFootGuide.at(g, f.line, s);
        const r: IHumanDebugDocument.Point = [p[0] - f.line.origin[0], p[1] - f.line.origin[1], p[2] - f.line.origin[2]];
        return [r[0] * plane.v[0] + r[1] * plane.v[1] + r[2] * plane.v[2], r[0] * plane.u[0] + r[1] * plane.u[1] + r[2] * plane.u[2]];
      };
      const world: (q: [number, number]) => IHumanDebugDocument.Point = (q: [number, number]): IHumanDebugDocument.Point => [
        f.line.origin[0] + plane.v[0] * q[0] + plane.u[0] * q[1],
        f.line.origin[1] + plane.v[1] * q[0] + plane.u[1] * q[1],
        f.line.origin[2] + plane.v[2] * q[0] + plane.u[2] * q[1],
      ];
      const points: AutoMovieHumanFootSectionJets.IPoints = {
        crest: at(f.guides.crest),
        lateral: at(f.guides.lateral),
        contactLateral: at(f.guides.contactLateral),
        contactMedial: at(f.guides.contactMedial),
        medial: at(f.guides.medial),
      };
      const jets: AutoMovieHumanFootSectionJets.IJets = AutoMovieHumanFootSectionJets.of({
        points,
        heights: { lateral: world(points.contactLateral)[1], medial: world(points.contactMedial)[1] },
        corner,
      });
      const row: [number, number][] =
        arc === "dorsalLateral"
          ? AutoMovieHumanFootDorsalLateralArc.of(jets.crest, jets.lateral, 24)
          : arc === "lateralPlantar"
            ? AutoMovieHumanFootLateralBorder.of(jets.lateral, jets.contactLateral, 24)
            : arc === "sole"
              ? AutoMovieHumanFootSoleContact.of(jets.contactLateral, jets.contactMedial, 24)
              : arc === "arch"
                ? AutoMovieHumanFootMedialArch.of(jets.contactMedial, jets.medial, 24)
                : AutoMovieHumanFootDorsalMedialArc.of(jets.medial, jets.crest, 24);
      return row.map(world);
    });
  }

  /**
   * The body from its sections alone (`AutoMovieHumanFootBody`), every fourth ring point, one ring per station.
   *
   * @param f Fixed inputs.
   * @param count Station intervals.
   */
  export function body(f: IFixed, count: number = 90): IHumanDebugDocument.Point[][] {
    const built: AutoMovieHumanFootBody.IBody = AutoMovieHumanFootBody.of({ frame: f.frame, line: f.line, guides: f.guides });
    return stations(f, count).map((s: number): IHumanDebugDocument.Point[] =>
      built.section(s).ring.filter((_: IHumanDebugDocument.Point, i: number): boolean => i % 4 === 0),
    );
  }

  /**
   * One toe swept along its line from its first own section to its cap by its span and section pieces.
   *
   * @param f Fixed inputs.
   * @param index Toe index, 0 for the hallux.
   * @returns 41 rings of 32 points, mm.
   */
  export function toe(f: IFixed, index: number): IHumanDebugDocument.Point[][] {
    const span: AutoMovieHumanFootToeSpan.IToe = AutoMovieHumanFootToeSpan.of({
      frame: f.frame,
      lines: f.centres.lines,
      index,
    });

    // Sections lie in the plane of the toe's horizontal lateral direction and world up.
    const side: IHumanDebugDocument.Point = [span.lateral[0], 0, span.lateral[2]];
    return Array.from({ length: 41 }, (_: unknown, i: number): IHumanDebugDocument.Point[] => {
      const s: number = span.first + ((span.cap - span.first) * i) / 40;
      const size: [number, number, number] = span.size(s);
      const c: IHumanDebugDocument.Point = [
        span.head[0] + span.tangent[0] * s,
        span.head[1] + span.tangent[1] * s,
        span.head[2] + span.tangent[2] * s,
      ];
      return AutoMovieHumanFootToeSection.of(size[0], size[1], size[2], 32).map(
        (q: [number, number]): IHumanDebugDocument.Point => [c[0] + side[0] * q[0], c[1] + q[1], c[2] + side[2] * q[0]],
      );
    });
  }

  /** Fixed inputs by person alias. */
  const CACHE: Map<string, Singleton<IFixed>> = new Map();

  /** Build a person's fixed inputs from its left foot dimensions. */
  function build(person: IHumanDebugPerson): IFixed {
    // Extremity dimensions are optional public inputs; a foot piece without them has no input.
    const foot: { footLength: number; footBreadth: number; ankleHeight: number } | undefined =
      person.parameters.extremities?.feet?.left;
    if (foot === undefined)
      throw new Error("Person " + person.alias + " carries no left foot dimensions (extremities.feet.left)");
    const dimensions: AutoMovieHumanFootFrame.IDimensions = {
      length: foot.footLength,
      breadth: foot.footBreadth,
      ankle: foot.ankleHeight,
    };
    const centres: AutoMovieHumanFootBones.ICentres = AutoMovieHumanFootBones.of(dimensions, 1);
    const frame: AutoMovieHumanFootFrame.IFrame = centres.frame;
    const line: AutoMovieHumanFootWebLine.IWebLine = AutoMovieHumanFootWebLine.of({
      frame,
      depth: AutoMovieHumanFootCrestForefoot.depth,
    });
    return {
      dimensions,
      frame,
      centres,
      line,
      guides: {
        crest: AutoMovieHumanFootCrestGuide.of(frame, line),
        lateral: AutoMovieHumanFootLateralGuide.of(frame, line),
        contactLateral: AutoMovieHumanFootContactLateralGuide.of(frame, line),
        contactMedial: AutoMovieHumanFootContactMedialGuide.of(frame, line),
        medial: AutoMovieHumanFootMedialGuide.of(frame, line),
      },
    };
  }
}
