/**
 * Report every finish contradiction between a stack and the faces it presents.
 *
 * A finish is only a finish where it can be seen. Index zero presents the first
 * face and the final index the last one, so a finish anywhere else is either a
 * second coat over the finish beside it or a layer buried where nothing reaches
 * it; both are defects, and naming them apart is what tells the author whether
 * to delete a layer or move it.
  * @evidence requirements/interior/surface-assemblies.md#interior-surface-regions-layers `IAutoMovieAssemblyHost` represents the host dimension a build-up is measured against. This ensures each host region retains its ordered construction build-up and total thickness.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `IAutoMovieAssemblyHost` structures the host dimension a build-up is measured against for the system that resolves ordered construction layers into their host face regions.
 * @author Samchon
 */
export const appendFinishDefects = (
  assembly: IAutoMovieMaterialAssembly,
  collector: ViolationCollector,
  root: string,
): void => {
  const layers = assembly.layers;
  if (layers.length === 0) return;
  const last = layers.length - 1;
  layers.forEach((layer, index) => {
    if (!layer.finish || index === 0 || index === last) return;
    const doubled = layers[index - 1]!.finish || layers[index + 1]!.finish;
    collector.push(
      "type",
      `${root}.layers[${index}].finish`,
      doubled
        ? `material layer "${layer.id}" lays a finish over the finish beside it`
        : `material layer "${layer.id}" is a finish buried between layers and reaches no exposed face`,
      layer.finish,
    );
  });
  const terminals = new Map<number, Array<"first" | "last">>();
  terminals.set(0, ["first"]);
  terminals.set(last, [...(terminals.get(last) ?? []), "last"]);
  for (const [index, faces] of terminals) {
    const layer = layers[index]!;
    const exposed = faces.filter((face) => assembly.faces[face] === "exposed");
    if (exposed.length > 0 && !layer.finish)
      collector.push(
        "type",
        `${root}.layers[${index}].finish`,
        `no finish presents the exposed ${exposed.join(" and ")} face; material layer "${layer.id}" is the layer that reaches it`,
        layer.finish,
      );
    if (exposed.length === 0 && layer.finish)
      collector.push(
        "type",
        `${root}.layers[${index}].finish`,
        `material layer "${layer.id}" spends a finish on the concealed ${faces.join(" and ")} face`,
        layer.finish,
      );
  }
};
