import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
} from "@automovie/engine";
import type {
  IAutoMovieHumanFootSource,
  IAutoMovieHumanSiteControls,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

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
  /**
   * Consume original local scalars and their anatomical frame directly.
   * The shared coefficients, phase functions and physical2 availability are
   * the same definition the foot later publishes; no full parent is needed.
   */
  export function fromControls(
    prepared: IAutoMovieHumanSiteControls.IOutput,
  ): IAutoMovieHumanFootSource.ISource {
    const controls: IAutoMovieHumanSiteControls.IControls | null =
      prepared.controls;
    if (controls === null)
      throw new Error(
        "A foot contact needs admitted original controls: " +
          JSON.stringify(prepared.diagnostics),
      );
    return {
      part: { name: controls.input.name, axis: controls.axis },
      name: controls.input.name,
      axis: controls.axis,
      field: controls.field(),
    };
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
  export function prepare(
    part: IAutoMovieViewPart,
  ): IAutoMovieHumanFootSource.IComplete {
    const prepared: IAutoMovieLoftViewSource.IResult | null =
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
  export function at(
    owner: IAutoMovieHumanFootSource.ISource,
    station: number,
  ): IAutoMovieHumanFootSource.IStation {
    if (owner.region !== undefined) return owner.region.at(station);
    if (owner.field === undefined)
      throw new Error("A direct original contact has no prepared native field");
    const values: IAutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(owner.field, station);
    if (typeof values === "string") throw new Error(values);
    const jets: IAutoMovieLoftViewRead.IJets | string =
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
   * @evidence contracts/performance.md#reuse-equivalent-work A complete request prepares the actual resolved part once; all local reads share the independently prepared regional authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The regional reader retains only the original regional authority and resolver. Each complete result belongs to its caller.
   */
  export function fromRegion(
    region: IAutoMovieHumanFootSource.IRegion,
    resolve: IAutoMovieHumanFootSource.FromRegionResolve,
  ): IAutoMovieHumanFootSource.IRegional {
    const owner: IAutoMovieHumanFootSource.IRegional = {
      name: region.name,
      axis: region.axis,
      region,
      part: { name: region.name, axis: region.axis },
      complete: (): IAutoMovieHumanFootSource.IComplete => prepare(resolve()),
    };
    return owner;
  }
}
