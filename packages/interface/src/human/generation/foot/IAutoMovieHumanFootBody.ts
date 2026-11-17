import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftFrame } from "../../../construction/IAutoMovieLoftFrame";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLimbFrame } from "../IAutoMovieHumanLimbFrame";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootGuide } from "./IAutoMovieHumanFootGuide";
import type { IAutoMovieHumanFootWebLine } from "./IAutoMovieHumanFootWebLine";

/** Type contracts exchanged by AutoMovieHumanFootBody; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootBody {
  /** The five guides a section stands between.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The five guides a section stands between.
   * @evidence contracts/development/design.md#principled-representation `crest`: The instep's crest. `lateral`: The lateral border. `contactLateral`: The lateral edge of the plantar contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootKnots.guides. Also types AutoMovieHumanFootConstruction.guides, AutoMovieHumanFootBody.guides.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `crest`, `lateral`, `contactLateral`, `contactMedial`, `medial`; callers supply the complete record.
   */
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

  /** What the body reads: the frame, the fan's axes and the five guides.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the body reads: the frame, the fan's axes and the five guides.
   * @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `line`: The fan's axes, levers and stations. `guides`: The guides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootBody.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `diagnostics`: The list a degraded section records into; a part viewer may leave it out. `producer`: The producer named in a diagnostic, such as `foot.left`.
   */
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

  /** The body: its stations and the section at any station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The body: its stations and the section at any station.
   * @evidence contracts/development/design.md#principled-representation `stations`: The chain's layer stations, from the web ring to the ankle ring. `fan`: The section planes. `sample`: The section at a station as a loft sample.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootBody.of. Read by AutoMovieHumanFootBodyChain.of, AutoMovieHumanFootMalleolus.of, AutoMovieHumanFootWebRing.of. Also types AutoMovieHumanFootConstruction.body, AutoMovieHumanFootMalleolusWindow.body.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stations`, `fan`, `sample`, `section`, `guide`; callers supply the complete record.
   */
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

  /** A section: its ring at its fixed phases and its places across.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section: its ring at its fixed phases and its places across.
   * @evidence contracts/development/design.md#principled-representation `ring`: World points at the section's fixed phases. `frame`: The section's plane. `pinches`: Phases on the upper and lower boundaries where the across coordinate is `v`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanFootBody.own, AutoMovieHumanFootBody.near.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `ring`, `frame`, `pinches`, `lateral`, `medial`, `at`; callers supply the complete record.
   */
  export interface ISection {
    /** World points at the section's fixed phases. */
    ring: AutoMovieVector3Tuple[];

    /** The section's plane. */
    frame: IAutoMovieLoftFrame.IFrame;

    /** Phases on the upper and lower boundaries where the across coordinate is `v`. */
    pinches: (v: number) => {
      /** Upper boundary phase at the requested across coordinate, radians in the section's fixed phase convention. */
      dorsal: number;
      /** Lower boundary phase at the requested across coordinate, radians in the section's fixed phase convention. */
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
