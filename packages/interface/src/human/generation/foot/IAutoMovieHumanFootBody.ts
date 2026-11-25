import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLimbFrame } from "../IAutoMovieHumanLimbFrame";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootGuide } from "./IAutoMovieHumanFootGuide";
import type { IAutoMovieHumanFootWebLine } from "./IAutoMovieHumanFootWebLine";

/**
 * Foot guide inputs and station/phase readers for section rings and loft
 * samples.
 *
 * The interface package owns these declarations; AutoMovieHumanFootBody in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootBody {
  /** The five guides a section stands between. */
  export interface IGuides {
    /** The instep's crest. */
    crest: IAutoMovieHumanFootGuide.IGuide;

    /** The lateral border. */
    lateral: IAutoMovieHumanFootGuide.IGuide;

    /** The lateral edge of the plantar contact. */
    contactLateral: IAutoMovieHumanFootGuide.IGuide;

    /** The medial edge of the plantar contact. */
    contactMedial: IAutoMovieHumanFootGuide.IGuide;

    /** The medial border. */
    medial: IAutoMovieHumanFootGuide.IGuide;
  }

  /** What the body reads: the frame, the fan's axes and the five guides. */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** The fan's axes, levers and stations. */
    line: IAutoMovieHumanFootWebLine.IWebLine;

    /** The guides. */
    guides: IGuides;

    /** The list a degraded section records into; a part viewer may leave it out. */
    diagnostics?: IAutoMovieLoftContract.IDiagnostic[];

    /** The producer named in a diagnostic, such as `foot.left`. */
    producer?: string;
  }

  /** The body: its stations and the section at any station. */
  export interface IBody {
    /** The chain's layer stations, from the web ring to the ankle ring. */
    stations: number[];

    /** The section planes. */
    fan: IAutoMovieHumanFootWebLine.IWebLine;

    /** The section at a station as a loft sample. */
    sample: (station: number) => IAutoMovieHumanLimbFrame.ISample;

    /** The section at a station. */
    section: (station: number) => ISection;

    /** A guide's point at a station. */
    guide: (
      name: "crest" | "lateral" | "medial",
      station: number,
    ) => AutoMovieVector3Tuple;
  }

  /** A section: its ring at its fixed phases and its places across. */
  export interface ISection {
    /** World points at the section's fixed phases. */
    ring: AutoMovieVector3Tuple[];

    /** The section's plane. */
    frame: IAutoMovieLoftSectionFrame;

    /**
     * Phases on the upper and lower boundaries where the across coordinate is
     * `v`.
     */
    pinches: (v: number) => {
      /**
       * Upper boundary phase at the requested across coordinate, radians in the
       * section's fixed phase convention.
       */
      dorsal: number;
      /**
       * Lower boundary phase at the requested across coordinate, radians in the
       * section's fixed phase convention.
       */
      plantar: number;
    };

    /** Phase of the lateral border point. */
    lateral: number;

    /** Phase of the medial border point. */
    medial: number;

    /** A world point at a phase. */
    at: (t: number) => AutoMovieVector3Tuple;
  }
}
