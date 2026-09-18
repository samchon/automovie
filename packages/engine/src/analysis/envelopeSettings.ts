/** The canonical settings text one envelope study is digested against.  * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeLayer` declares one material thickness and conductivity used to calculate envelope thermal resistance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The layer record contributes one explicit `thickness / conductivity` resistance to a resolved assembly load path.
 * @author Samchon
 */
export const envelopeSettings = (
  request: IAutoMovieEnvelopeRequest,
  instant: IAutoMovieEnvironmentInstant | null,
): string =>
  JSON.stringify({
    context: request.context.id,
    instant,
    indoor: request.indoor,
    assemblies: request.assemblies.map((assembly) => ({
      id: assembly.id,
      boundary: assembly.boundary,
      layers: assembly.layers.map((layer) => ({
        id: layer.id,
        thickness: layer.thickness,
        conductivity: layer.conductivity,
      })),
      interiorFilm: assembly.interiorFilm,
      exteriorFilm: assembly.exteriorFilm,
      area: assembly.area,
      position: assembly.position,
    })),
    bridges: request.bridges.map((bridge) => ({
      id: bridge.id,
      assembly: bridge.assembly,
      linearTransmittance: bridge.linearTransmittance,
      length: bridge.length,
    })),
    targets: request.targets.map((target) => ({
      key: target.key,
      unit: target.unit,
      value: target.value,
      comparison: target.comparison,
    })),
  });
