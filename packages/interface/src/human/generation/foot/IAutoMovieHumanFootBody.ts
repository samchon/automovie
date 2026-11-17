import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLimbFrame } from "../IAutoMovieHumanLimbFrame";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootGuide } from "./IAutoMovieHumanFootGuide";
import type { IAutoMovieHumanFootWebLine } from "./IAutoMovieHumanFootWebLine";

/**
 * Foot guide inputs and station/phase readers for section rings and loft samples.
 *
 * The interface package owns these declarations; AutoMovieHumanFootBody in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Foot guide inputs and station/phase readers for section rings and loft samples. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IGuides, IInput, IBody, ISection declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IGuides, IInput, IBody, ISection separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanFootBody exchanges the named IGuides, IInput, IBody, ISection contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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

    /**
     * The section at a station as a loft sample.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The section at a station as a loft sample.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanFootBody and the callback provider must satisfy the documented sample contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanFootBody and its callback provider own the cost of each sample invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanFootBody and the callback provider determine when the inputs to sample describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanFootBody and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanFootBody.IBody.sample callable contract, without an implementation body. AutoMovieHumanFootBody and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootBody.IBody.sample declares only the invocation boundary; decomposition belongs to AutoMovieHumanFootBody and the callback provider.
     */
    sample: (station: number) => IAutoMovieHumanLimbFrame.ISample;

    /**
     * The section at a station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The section at a station.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanFootBody and the callback provider must satisfy the documented section contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanFootBody and its callback provider own the cost of each section invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanFootBody and the callback provider determine when the inputs to section describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanFootBody and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanFootBody.IBody.section callable contract, without an implementation body. AutoMovieHumanFootBody and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootBody.IBody.section declares only the invocation boundary; decomposition belongs to AutoMovieHumanFootBody and the callback provider.
     */
    section: (station: number) => ISection;

    /**
     * A guide's point at a station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation A guide's point at a station.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanFootBody and the callback provider must satisfy the documented guide contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanFootBody and its callback provider own the cost of each guide invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanFootBody and the callback provider determine when the inputs to guide describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanFootBody and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanFootBody.IBody.guide callable contract, without an implementation body. AutoMovieHumanFootBody and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootBody.IBody.guide declares only the invocation boundary; decomposition belongs to AutoMovieHumanFootBody and the callback provider.
     */
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
    frame: IAutoMovieLoftSectionFrame;

    /**
     * Phases on the upper and lower boundaries where the across coordinate is `v`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Phases on the upper and lower boundaries where the across coordinate is `v`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanFootBody and the callback provider must satisfy the documented pinches contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanFootBody and its callback provider own the cost of each pinches invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanFootBody and the callback provider determine when the inputs to pinches describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanFootBody and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanFootBody.ISection.pinches callable contract, without an implementation body. AutoMovieHumanFootBody and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootBody.ISection.pinches declares only the invocation boundary; decomposition belongs to AutoMovieHumanFootBody and the callback provider.
     */
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

    /**
     * A world point at a phase.
     *
     * @evidence contracts/development/common.md#meaningful-documentation A world point at a phase.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanFootBody and the callback provider must satisfy the documented at contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanFootBody and its callback provider own the cost of each at invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanFootBody and the callback provider determine when the inputs to at describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanFootBody and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanFootBody.ISection.at callable contract, without an implementation body. AutoMovieHumanFootBody and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootBody.ISection.at declares only the invocation boundary; decomposition belongs to AutoMovieHumanFootBody and the callback provider.
     */
    at: (t: number) => AutoMovieVector3Tuple;
  }
}
