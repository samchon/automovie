import { describeRecoveryDomains as describeRecoveryDomainsImplementation } from "./internal/describeRecoveryDomains";
import { describeRecoveryNamedDomains as describeRecoveryNamedDomainsImplementation } from "./internal/describeRecoveryNamedDomains";

import { type AutoMovieRecoveryCurveData, type IAutoMovieBicubicAtlasGeometry, type IAutoMovieRecoveryAnalyticPublication, type IAutoMovieRecoveryAnalyticDomainsRealizationOperation, type IAutoMovieRecoveryAnnularChart, type IAutoMovieRecoveryAtlasCompilation, type IAutoMovieRecoveryChartPatchBudgetFailure, type IAutoMovieRecoveryEventChartInput, type IAutoMovieRecoveryEventCompilationPolicy, type IAutoMovieRecoveryEventCurveArc, type IAutoMovieRecoveryEventDomainCompilation, type IAutoMovieRecoveryFieldComplex, type IAutoMovieRecoveryFieldComplexInput, type IAutoMovieRecoveryFieldComplexPolicy, type IAutoMovieRecoveryInputHashes, type IAutoMovieRecoveryNativeChartCompilation, type IAutoMovieRecoveryOptions, type IAutoMovieRecoveryReconstructedModel, type IAutoMovieRecoveryResult, type IAutoMovieRecoveryTensorFamiliesInput, type IAutoMovieRecoveryTensorRealization, type IAutoMovieReconstructRecovery, type IAutoMovieRecoveryDomainsDescriptionOperation, type IAutoMovieRecoveryNamedDomainsDescriptionOperation } from "@automovie/interface";

import { reconstructRecovery as reconstructRecoveryImplementation } from "./internal/reconstructRecovery";

import {
  applyRecoveryAnalyticPublication as applyPublication,
} from "./internal/applyRecoveryAnalyticPublication";
import {
  assembleRecoveryFieldComplex as assembleComplex,
} from "./internal/assembleRecoveryFieldComplex";
import {
  compileRecoveryAtlas as compileAtlasOperation,
} from "./internal/compileRecoveryAtlas";
import {
  compileRecoveryEventDomain as compileEventDomainOperation,
} from "./internal/compileRecoveryEventDomain";
import {
  compileRecoveryNativeNamedChart as compileNativeChart,
} from "./internal/compileRecoveryNativeNamedChart";
import {
  prepareRecoveryAnnularChart as prepareAnnularChartOperation,
} from "./internal/prepareRecoveryAnnularChart";
import {
  realizeRecoveryAnalyticDomains as realizeAnalyticDomainsOperation,
} from "./internal/realizeRecoveryAnalyticDomains";
import {
  realizeRecoveryTensorFamilies as realizeTensorFamiliesOperation,
} from "./internal/realizeRecoveryTensorFamilies";
import {
  reconstructRecoveryModel as reconstructModelOperation,
} from "./internal/reconstructRecoveryModel";

/**
 * Public operations for compiling coefficient charts and reconstructing saved
 * recovery records. Inputs and results use the canonical interface contracts;
 * the namespace is an API container and is not itself callable.
 */
export namespace AutoMovieRecoveryReconstruction {
  /**
   * Bind an analytic coefficient extension to its original saved curve and
   * continuation artifacts. Supply the hashes already established by the
   * caller's byte verification. Replacement curves use millimetres. A hash,
   * identity or ownership conflict throws before publishing a replacement set.
   */
  export function applyAnalyticPublication(
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
    publication: IAutoMovieRecoveryAnalyticPublication,
    hashes: IAutoMovieRecoveryInputHashes,
  ): IAutoMovieRecoveryTensorFamiliesInput {
    return applyPublication(bundle, publication, hashes);
  }

  /**
   * Assemble named native Coons charts into connected coefficient components.
   * A complete native cubic owns each boundary identity, while its endpoint
   * names own their original values. Conflicting incidents remain local
   * diagnostics. Supply explicit assembly budgets.
   */
  export function assembleFieldComplex(
    input: IAutoMovieRecoveryFieldComplexInput,
    policy: IAutoMovieRecoveryFieldComplexPolicy,
  ): IAutoMovieRecoveryFieldComplex {
    return assembleComplex(input, policy);
  }

  /**
   * Compiles a saved bicubic atlas into recipe and generated metre geometry.
   *
   * The recipe model retains the supplied coefficient authority. The
   * generated model contains the Engine mesh when triangles were emitted. Its
   * receipt transfers the native counts, primitive ranges, completeness and
   * approximation qualification. Those two flags describe separate outcomes.
   */
  export function compileAtlas(
    geometry: IAutoMovieBicubicAtlasGeometry,
  ): IAutoMovieRecoveryAtlasCompilation {
    return compileAtlasOperation(geometry);
  }

  /**
   * Compile four named oriented cubic sides into a normalized bicubic Coons
   * domain. Coordinates use millimetres. Require exact matching corner
   * coefficients and unchanged native parents. Insufficient patch capacity
   * returns an incomplete result with required count.
   */
  export function compileEventDomain(
    input: IAutoMovieRecoveryEventChartInput,
    policy: IAutoMovieRecoveryEventCompilationPolicy,
  ):
    | IAutoMovieRecoveryChartPatchBudgetFailure
    | IAutoMovieRecoveryEventDomainCompilation {
    return compileEventDomainOperation(input, policy);
  }

  /**
   * Compile one named chart while retaining its complete native boundary
   * owners and the oriented intervals used by each patch. The tensor partition
   * belongs to this chart. An incomplete local compile remains incomplete.
   */
  export function compileNativeNamedChart(
    input: IAutoMovieRecoveryEventChartInput,
    policy: IAutoMovieRecoveryEventCompilationPolicy,
  ):
    | IAutoMovieRecoveryChartPatchBudgetFailure
    | IAutoMovieRecoveryNativeChartCompilation {
    return compileNativeChart(input, policy);
  }

  /**
   * Bind two named closed paths to one shared periodic seam. Keep the full
   * three-dimensional millimetre paths and the explicit seam identity.
   * Incompatible path or endpoint authority throws.
   */
  export function prepareAnnularChart(
    bottom: IAutoMovieRecoveryEventCurveArc,
    top: IAutoMovieRecoveryEventCurveArc,
    id: string,
  ): IAutoMovieRecoveryAnnularChart {
    return prepareAnnularChartOperation(bottom, top, id);
  }

  /**
   * Realize admitted named analytic domains from saved curve coefficients and
   * a continuation graph. Preserve each finite result, including a partial
   * atlas with explicit omissions. If a claim is invalid or repeated, leave
   * that domain with its original saved operator.
   */
  export function realizeAnalyticDomains(
    bundle: Parameters<
      IAutoMovieRecoveryAnalyticDomainsRealizationOperation.Operation
    >[0],
    graph?: Parameters<
      IAutoMovieRecoveryAnalyticDomainsRealizationOperation.Operation
    >[1],
  ): ReturnType<
    IAutoMovieRecoveryAnalyticDomainsRealizationOperation.Operation
  > {
    return realizeAnalyticDomainsOperation(bundle, graph);
  }

  /**
   * Realize declared ordinary curve families as Engine analytic tensors.
   * Source coefficients and endpoint ownership are in millimetres. Convert
   * generated controls and endpoint values together to metres. Incompatible or
   * conflicting ownership remains explicit.
   */
  export function realizeTensorFamilies(
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
  ): IAutoMovieRecoveryTensorRealization {
    return realizeTensorFamiliesOperation(bundle);
  }

  /**
   * Reconstruct a saved cubic bundle using the declared legacy reconstruction
   * operator. Hermite curves use their saved phase widths when converted to
   * Bernstein. Unsupported coverage produces `partial`; input refusal,
   * callback failure and cooperative cancellation publish diagnostics without
   * a generated model.
   */
  export function reconstructModel(
    input:
      | IAutoMovieRecoveryTensorFamiliesInput
      | AutoMovieRecoveryCurveData<IAutoMovieRecoveryTensorFamiliesInput, "hermite">,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryReconstructedModel> {
    return reconstructModelOperation(input, options);
  }

  /**
   * Describe how declared domain identities map to the actual reconstruction
   * result. Preserve the original group ordering. Match legacy ranges only
   * through unique exact saved scalar brackets. Unobserved or ambiguous
   * ownership remains unknown.
   */
  export function describeDomains(input: Parameters<IAutoMovieRecoveryDomainsDescriptionOperation.Operation>[0], result: Parameters<IAutoMovieRecoveryDomainsDescriptionOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryDomainsDescriptionOperation.Operation> {
    return describeRecoveryDomainsImplementation(input, result);
  }

  /**
   * Map planned named domains to unique actual reports with the same name. A
   * missing or repeated name leaves admission and generation unknown. Keep all
   * original reports and geometry in the reconstruction result.
   */
  export function describeNamedDomains(input: Parameters<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation>[0], result: Parameters<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation> {
    return describeRecoveryNamedDomainsImplementation(input, result);
  }
  /**
   * Generate ordinary tensor families and remaining curve-only event or legacy
   * domains from a saved bundle. Keep saved inputs immutable. An admitted
   * tensor group is emitted by its tensor owner. Tolerance deficits and
   * unsupported incidence remain distinguished in the returned work and
   * coverage receipts.
   */
  export function reconstructRecovery(
    bundle: Parameters<IAutoMovieReconstructRecovery.Operation>[0],
    options: Parameters<IAutoMovieReconstructRecovery.Operation>[1] = {},
  ): ReturnType<IAutoMovieReconstructRecovery.Operation> {
    return reconstructRecoveryImplementation(bundle, options);
  }

}
