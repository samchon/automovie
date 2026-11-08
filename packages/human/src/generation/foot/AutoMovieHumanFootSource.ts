import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";

/** Original native local position and its phase derivatives. */
type Phase = ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.phase>>;

/** Available total-order-two derivatives of that identical local field. */
type Jet = ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>>;

/**
 * A retained original view and its full native section owner, before lofting.
 *
 * @evidence contracts/common.md#principled-implementation Uses the public direct-source preparation and native Cartesian readers on the actual part; its own axis remains the world-frame authority.
 * @evidence contracts/common.md#clear-and-simple-design Separates full scalar/fullness preparation from station value and optional physical2 capabilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No deep import, section refit, realized geometry, zero-filled derivative or generic-girth fallback supplies a contact.
 * @evidence contracts/common.md#meaningful-documentation States mm/radian units, parent ownership and the difference between value availability and station derivatives.
 * @evidence contracts/performance.md#efficient-algorithms One O(n) original preparation and fixed-size native station preparation serve the bounded regional contacts.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller retains one original part and prepared full field for every local chord from that parent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A synchronous caller owns the preparations and closures; no global state, mesh or handle survives it.
 */
export namespace AutoMovieHumanFootSource {

  /** Call-owned scalar/fullness preparation; the original axis remains authoritative. */
  export interface ISource {

    /** Shared identity/frame metadata; a direct control owner retains no completed parent. Legacy complete adapters may carry the actual whole part. */
    part: Pick<IAutoMovieViewPart, "name" | "axis">;

    /** Actual native coefficients when prepared directly; absent for a region whose full parent is unrequested. */
    field?: AutoMovieLoftViewSource.ISource;

    /** Explicitly complete a regional owner's actual original, retaining its real failure; absent on direct controls. */
    complete?(): IComplete;

    /** Non-generating name when this owner also has a bounded regional capability. */
    name?: string;

    /** Identical axis shared by the retained interval and every full coupled result. */
    axis?: IAutoMovieViewPart["axis"];

    /** Explicit retained interval; reading it does not claim full-parent completion. */
    region?: IRegion;
  }

  /** Explicit complete-part adapter; direct regional/control consumers use only ISource. */
  export interface IComplete extends ISource {

    /** Actual completed original, obtained only by prepare or the explicit full resolver. */
    part: IAutoMovieViewPart;

    /** Actual native coefficients of that explicitly requested complete original. */
    field: AutoMovieLoftViewSource.ISource;
  }

  /** Bounded region with a real, explicit full-original completion capability. */
  export interface IRegional extends ISource {
    /** Complete and admit the actual coupled original, preserving its original failure. */
    complete(): IComplete;
  }

  /**
   * Consume original local scalars and their anatomical frame directly.
   * The shared coefficients, phase functions and physical2 availability are
   * the same definition the foot later publishes; no full parent is needed.
   */
  export function fromControls(prepared: AutoMovieHumanSiteControls.IOutput): ISource {
    const controls: AutoMovieHumanSiteControls.IControls | null = prepared.controls;
    if (controls === null)
      throw new Error("A foot contact needs admitted original controls: " + JSON.stringify(prepared.diagnostics));
    return {
      part: { name: controls.input.name, axis: controls.axis },
      name: controls.input.name,
      axis: controls.axis,
      field: controls.field(),
    };
  }

  /** The unchanged part of a generating family, without a substitute whole-parent declaration. */
  export interface IRegion {

    /** Name of the actual owning production family. */

    name: string;

    /** Same original axis retained by the full family. */

    axis: IAutoMovieViewPart["axis"];

    /** Closed physical station interval, calibration mm. */

    domain: readonly [
      number,
      number,
    ];

    /** Actual value and separately available physical2 within this interval. */ at(
      station: number,
    ): IStation;
  }

  /** One regular station's value capability and separately qualified physical derivatives. */
  export interface IStation {

    /** Original local phase function, in mm and radians. */
    phase: (phi: number) => Phase;

    /** Original physical-station total2, or explicit absence. */
    jet: ((phi: number) => Jet) | null;

    /** The original reason physical derivatives are unavailable. */
    unavailable: string | null;
  }

  /**
   * Prepare the actual direct source once; generic girth and failed sources remain failures.
   *
   * @evidence contracts/common.md#principled-implementation Admits the identical production part through ViewSource.create and retains its explicit failure.
   * @evidence contracts/common.md#clear-and-simple-design One owner record pairs the original part and native preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reconstruct a shape from four supports or a mesh.
   * @evidence contracts/common.md#meaningful-documentation Documents unsupported fullness and failed admission as construction errors.
   * @evidence contracts/performance.md#efficient-algorithms Delegates O(n) scalar preparation once without realizing a loft.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the preparation for all contacts in this definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The calling definition owns the finite result and releases it with that definition.
   */
  export function prepare(part: IAutoMovieViewPart): IComplete {
    const prepared: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    if (prepared === null)
      throw new Error(`${part.name}: direct original fullness is unavailable`);
    if (prepared.source === null)
      throw new Error(`${part.name}: ${JSON.stringify(prepared.diagnostics)}`);
    return { part, field: prepared.source };
  }

  /**
   * Read the complete native field without building a temporary loft or substituting missing jets.
   *
   * @evidence contracts/common.md#principled-implementation Separately requests values and actual physical2, then uses the public same-source native phase factories.
   * @evidence contracts/common.md#clear-and-simple-design A phase closure and optional jet closure expose only available capabilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original derivative refusal instead of inferring zero or widening cap support.
   * @evidence contracts/common.md#meaningful-documentation Names the absent-derivative reason beside the value capability.
   * @evidence contracts/performance.md#efficient-algorithms Fixed four-quarter preparation precedes each bounded station query.
   * @evidence contracts/performance.md#reuse-equivalent-work Both closures retain the same prepared original station inputs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns station closures; no query cache persists.
   */
  export function at(owner: ISource, station: number): IStation {
    if (owner.region !== undefined) return owner.region.at(station);
    if (owner.field === undefined)
      throw new Error("A direct original contact has no prepared native field");
    const values: AutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(owner.field, station);
    if (typeof values === "string") throw new Error(values);
    const jets: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftViewRead.jets(owner.field, station);
    return {
      phase: AutoMovieLoftSectionNative.phase(values),
      jet:
        typeof jets === "string" ? null : AutoMovieLoftSectionNative.jet(jets),
      unavailable: typeof jets === "string" ? jets : null,
    };
  }

  /**
   * Borrow a retained interval while keeping explicit full-parent demand truthful.
   *
   * @evidence contracts/common.md#principled-implementation Regional reads use the identical generating authority; complete explicitly resolves and admits the actual final parent instead of returning the uncoupled base.
   * @evidence contracts/common.md#clear-and-simple-design Name/frame metadata and bounded station capability are separate from the explicit full-source method.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed full resolver propagates and cannot select earlier geometry or a different source.
   * @evidence contracts/common.md#meaningful-documentation Regional availability is not complete-parent or proximal-contact success.
   * @evidence contracts/performance.md#efficient-algorithms Regional demand performs only its unchanged native reading; full admission occurs only on explicit full demand.
   * @evidence contracts/performance.md#reuse-equivalent-work One latest full-part identity retains its preparation; proximal-only changes retain the same regional authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one regional reference and at most one latest full preparation; replacement drops the old full record.
   */
  export function fromRegion(
    region: IRegion,
    resolve: () => IAutoMovieViewPart,
  ): IRegional {
    let retained: IComplete | undefined;
    const full: () => IComplete = (): IComplete => {
      const part: IAutoMovieViewPart = resolve();
      if (retained === undefined || retained.part !== part)
        retained = prepare(part);
      return retained;
    };
    const owner: IRegional = {
      name: region.name,
      axis: region.axis,
      region,
      part: { name: region.name, axis: region.axis },
      complete: full,
    };
    return owner;
  }
}
