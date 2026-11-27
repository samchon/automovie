import { describeRecoveryDomains as describeRecoveryDomainsImplementation } from "./internal/describeRecoveryDomains";
import { describeRecoveryNamedDomains as describeRecoveryNamedDomainsImplementation } from "./internal/describeRecoveryNamedDomains";

import { type AutoMovieRecoveryCurveData, type IAutoMovieBicubicAtlasGeometry, type IAutoMovieRecoveryAnalyticPublication, type IAutoMovieRecoveryAnalyticDomainsRealizationOperation, type IAutoMovieRecoveryAnnularChart, type IAutoMovieRecoveryAtlasCompilation, type IAutoMovieRecoveryChartPatchBudgetFailure, type IAutoMovieRecoveryEventChartInput, type IAutoMovieRecoveryEventCompilationPolicy, type IAutoMovieRecoveryEventCurveArc, type IAutoMovieRecoveryEventDomainCompilation, type IAutoMovieRecoveryFieldComplex, type IAutoMovieRecoveryFieldComplexInput, type IAutoMovieRecoveryFieldComplexPolicy, type IAutoMovieRecoveryInputHashes, type IAutoMovieRecoveryNativeChartCompilation, type IAutoMovieRecoveryOptions, type IAutoMovieRecoveryReconstructedModel, type IAutoMovieRecoveryResult, type IAutoMovieRecoveryTensorFamiliesInput, type IAutoMovieRecoveryTensorRealization, type IAutoMovieReconstructRecovery, type IAutoMovieRecoveryDomainsDescriptionOperation, type IAutoMovieRecoveryNamedDomainsDescriptionOperation } from "@automovie/interface";

import { reconstructRecovery as reconstructRecoveryImplementation } from "./internal/reconstructRecovery";

import {
  applyAutoMovieRecoveryAnalyticPublication as applyPublication,
} from "./internal/applyAutoMovieRecoveryAnalyticPublication";
import {
  assembleAutoMovieRecoveryFieldComplex as assembleComplex,
} from "./internal/assembleAutoMovieRecoveryFieldComplex";
import {
  compileAutoMovieRecoveryAtlas as compileAtlasOperation,
} from "./internal/compileAutoMovieRecoveryAtlas";
import {
  compileAutoMovieRecoveryEventDomain as compileEventDomainOperation,
} from "./internal/compileAutoMovieRecoveryEventDomain";
import {
  compileAutoMovieRecoveryNativeNamedChart as compileNativeChart,
} from "./internal/compileAutoMovieRecoveryNativeNamedChart";
import {
  prepareAutoMovieRecoveryAnnularChart as prepareAnnularChartOperation,
} from "./internal/prepareAutoMovieRecoveryAnnularChart";
import {
  realizeAutoMovieRecoveryAnalyticDomains as realizeAnalyticDomainsOperation,
} from "./internal/realizeAutoMovieRecoveryAnalyticDomains";
import {
  realizeAutoMovieRecoveryTensorFamilies as realizeTensorFamiliesOperation,
} from "./internal/realizeAutoMovieRecoveryTensorFamilies";
import {
  reconstructAutoMovieRecoveryModel as reconstructModelOperation,
} from "./internal/reconstructAutoMovieRecoveryModel";

/**
 * Public operations for compiling coefficient charts and reconstructing saved
 * recovery records. Inputs and results use the canonical interface contracts;
 * the namespace is an API container and is not itself callable.
 */
export namespace AutoMovieRecoveryReconstruction {
  /** Bind a source-free analytic publication to the saved bundle and hashes. */
  export function applyAnalyticPublication(
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
    publication: IAutoMovieRecoveryAnalyticPublication,
    hashes: IAutoMovieRecoveryInputHashes,
  ): IAutoMovieRecoveryTensorFamiliesInput {
    return applyPublication(bundle, publication, hashes);
  }

  /** Assemble named native-parent charts under the supplied finite policy. */
  export function assembleFieldComplex(
    input: IAutoMovieRecoveryFieldComplexInput,
    policy: IAutoMovieRecoveryFieldComplexPolicy,
  ): IAutoMovieRecoveryFieldComplex {
    return assembleComplex(input, policy);
  }

  /** Compile a bicubic coefficient atlas into recipe and generated models. */
  export function compileAtlas(
    geometry: IAutoMovieBicubicAtlasGeometry,
  ): IAutoMovieRecoveryAtlasCompilation {
    return compileAtlasOperation(geometry);
  }

  /** Compile declared cubic chart sides into a piecewise event-domain atlas. */
  export function compileEventDomain(
    input: IAutoMovieRecoveryEventChartInput,
    policy: IAutoMovieRecoveryEventCompilationPolicy,
  ):
    | IAutoMovieRecoveryChartPatchBudgetFailure
    | IAutoMovieRecoveryEventDomainCompilation {
    return compileEventDomainOperation(input, policy);
  }

  /** Compile a chart while retaining native cubic owners and partial intervals. */
  export function compileNativeNamedChart(
    input: IAutoMovieRecoveryEventChartInput,
    policy: IAutoMovieRecoveryEventCompilationPolicy,
  ):
    | IAutoMovieRecoveryChartPatchBudgetFailure
    | IAutoMovieRecoveryNativeChartCompilation {
    return compileNativeChart(input, policy);
  }

  /** Bind two closed paths to a shared periodic annular seam. */
  export function prepareAnnularChart(
    bottom: IAutoMovieRecoveryEventCurveArc,
    top: IAutoMovieRecoveryEventCurveArc,
    id: string,
  ): IAutoMovieRecoveryAnnularChart {
    return prepareAnnularChartOperation(bottom, top, id);
  }

  /** Admit saved analytic-domain ownership and retain finite native results. */
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

  /** Generate the admitted ordinary tensor families from a saved bundle. */
  export function realizeTensorFamilies(
    bundle: IAutoMovieRecoveryTensorFamiliesInput,
  ): IAutoMovieRecoveryTensorRealization {
    return realizeTensorFamiliesOperation(bundle);
  }

  /** Reconstruct saved cubic and domain coefficients without source geometry. */
  export function reconstructModel(
    input:
      | IAutoMovieRecoveryTensorFamiliesInput
      | AutoMovieRecoveryCurveData<IAutoMovieRecoveryTensorFamiliesInput, "hermite">,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryReconstructedModel> {
    return reconstructModelOperation(input, options);
  }

  /**
   * Bind declared saved-domain identities to actual returned ownership records.
   * The legacy explicit planner retains original group order and appends
   * diagnostics. Exact unique scalar brackets map its ranges to original declared
   * interval ordinals. Missing admission observations and ambiguous per-group
   * analytic ranges stay unknown. No mesh position, normal or triangle is changed
   * by this record assembly.
   */
  export function describeDomains(input: Parameters<IAutoMovieRecoveryDomainsDescriptionOperation.Operation>[0], result: Parameters<IAutoMovieRecoveryDomainsDescriptionOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryDomainsDescriptionOperation.Operation> {
    return describeRecoveryDomainsImplementation(input, result);
  }

  /**
   * Bind planned named domains only to unique actual reports with the same
   * identity. Repeated or missing names keep admission and generation unknown,
   * even if an operator report exists at the same array ordinal. All original
   * reports and geometry stay in the reconstruction result, including unbound
   * observations.
   */
  export function describeNamedDomains(input: Parameters<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation>[0], result: Parameters<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation> {
    return describeRecoveryNamedDomainsImplementation(input, result);
  }
  /**
   * Generate saved ordinary tensor families and retained curve-only event or
   * legacy domains. Delegated groups have one tensor owner and are not also tiled
   * by the contour operator. Shared analytic end-curve coefficients are admitted
   * before engine dispatch; their polygonal conformity and transverse continuity
   * remain independently unqualified. The contour engine shares each retained
   * generating boundary across incident slabs. Unmet fitting tolerances and
   * strip-quality failures remain visible and unqualified. An actual missing
   * incidence or unrepresentable primitive remains a local gap rather than a
   * quality warning. Optional work observation changes timing records only; saved
   * generating inputs are immutable.
   */
  export function reconstructRecovery(
    bundle: Parameters<IAutoMovieReconstructRecovery.Operation>[0],
    options: Parameters<IAutoMovieReconstructRecovery.Operation>[1] = {},
  ): ReturnType<IAutoMovieReconstructRecovery.Operation> {
    return reconstructRecoveryImplementation(bundle, options);
  }

}
