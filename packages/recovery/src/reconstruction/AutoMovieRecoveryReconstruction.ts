import type {
  AutoMovieRecoveryCurveData,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryAnalyticPublication,
  IAutoMovieRecoveryAnalyticDomainsRealizationOperation,
  IAutoMovieRecoveryAnnularChart,
  IAutoMovieRecoveryAtlasCompilation,
  IAutoMovieRecoveryChartPatchBudgetFailure,
  IAutoMovieRecoveryEventChartInput,
  IAutoMovieRecoveryEventCompilationPolicy,
  IAutoMovieRecoveryEventCurveArc,
  IAutoMovieRecoveryEventDomainCompilation,
  IAutoMovieRecoveryFieldComplex,
  IAutoMovieRecoveryFieldComplexInput,
  IAutoMovieRecoveryFieldComplexPolicy,
  IAutoMovieRecoveryInputHashes,
  IAutoMovieRecoveryNativeChartCompilation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryReconstructedModel,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoveryTensorFamiliesInput,
  IAutoMovieRecoveryTensorRealization,
} from "@automovie/interface";

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
}
