/** One envelope metric, resolved against the request's declared targets.  * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeLayer` declares one material thickness and conductivity used to calculate envelope thermal resistance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The layer record contributes one explicit `thickness / conductivity` resistance to a resolved assembly load path.
 * @author Samchon
 */
export const metric = (
  request: IAutoMovieEnvelopeRequest,
  warnings: IAutoMovieAnalysisWarning[],
  props: {
    key: string;
    unit: string;
    value: number | null;
    gap?: IAutoMovieAnalysisMetricGap;
    status?: "unsupported" | "not-run";
  },
): IAutoMovieAnalysisMetric =>
  autoMovieAnalysisMetric({
    key: props.key,
    unit: props.unit,
    value: props.value,
    targets: request.targets,
    warnings,
    gap: props.gap,
    status: props.status,
  });
