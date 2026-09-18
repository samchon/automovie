import { IAutoMovieMaterialAssembly, IAutoMovieMaterialLayer } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAssemblyBreak } from "./IAutoMovieAssemblyBreak";
import { IAutoMovieAssemblyContinuity } from "./IAutoMovieAssemblyContinuity";
import { IAutoMovieAssemblyJunction } from "./IAutoMovieAssemblyJunction";
import { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";

/**
 * Report which construction roles survive a junction between two build-ups.
 *
 * Two walls meeting at a corner are two build-ups on one measuring line, and
 * the question a junction asks is not whether they look alike but whether each
 * role reaches across. A role both sides declare is continuous, and the signed
 * spans say whether it actually lines up or merely exists on both sides — an
 * insulation layer that ends where the next one begins is a thermal bridge, and
 * a barrier that stops at a corner is a leak.
 *
 * Roles are matched as declared: the caller decides what a role name means, and
 * a build-up that spends the same role over several layers has those layers
 * summed and spanned together rather than silently reduced to the first one.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-region-composition `matchAutoMovieAssemblyJunction` reports which construction roles survive a junction between two build-ups. This ensures adjacent regions join, overlap, or break by declared construction rules.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region `matchAutoMovieAssemblyJunction` performs auto movie assembly junction matching when the engine resolves ordered construction layers into their host face regions.
 * @evidence requirements/building-exterior/materials-and-assemblies.md#building-exterior-joints-drainage `matchAutoMovieAssemblyJunction` measures aligned and broken construction-role spans at an assembly junction as its layer-joint contribution without claiming flashing or rainwater drainage.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-material-joint-opening-wrap `matchAutoMovieAssemblyJunction` reports the exact role-span alignment and break state used by the envelope joint and opening-wrap contract.
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity `matchAutoMovieAssemblyJunction` determines which adjacent envelope-layer roles remain continuous and which break across the validated junction.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant `matchAutoMovieAssemblyJunction` contributes the deterministic layer-junction continuity measurement without claiming an exterior-only open-edge policy.
 * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-intersections `matchAutoMovieAssemblyJunction` measures aligned construction-role spans and explicit breaks where two wall assemblies meet.
 * @evidence requirements/building-exterior/facades-and-walls.md#building-facade-interior-boundary `matchAutoMovieAssemblyJunction` compares the declared layer-role depths shared by room-side and exterior-side assemblies without claiming facade completeness.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-facade-interior-failures The junction result contributes the shared assembly-thickness and broken-role subset of facade/interior compatibility failures.
 */
export const matchAutoMovieAssemblyJunction = (props: {
  left: IAutoMovieResolvedAssembly;
  right: IAutoMovieResolvedAssembly;
  /** Greatest metre gap between two spans still counted as aligned. */
  tolerance: number;
}): IAutoMovieAssemblyJunction => {
  if (!Number.isFinite(props.tolerance) || props.tolerance < 0)
    throw new Error("junction tolerance must be a finite number >= 0");
  const left = rolesOf(props.left);
  const right = rolesOf(props.right);
  const continuous: IAutoMovieAssemblyContinuity[] = [];
  const broken: IAutoMovieAssemblyBreak[] = [];
  for (const [role, span] of left) {
    const other = right.get(role);
    if (other === undefined) {
      broken.push({ role, side: "left", thickness: span.thickness });
      continue;
    }
    const overlap =
      Math.min(span.max, other.max) - Math.max(span.min, other.min);
    continuous.push({
      role,
      left: { min: span.min, max: span.max },
      right: { min: other.min, max: other.max },
      overlap,
      aligned: overlap >= -props.tolerance,
    });
  }
  for (const [role, span] of right)
    if (!left.has(role))
      broken.push({ role, side: "right", thickness: span.thickness });
  return { continuous, broken };
};

/**
 * Report every finish contradiction between a stack and the faces it presents.
 *
 * A finish is only a finish where it can be seen. Index zero presents the first
 * face and the final index the last one, so a finish anywhere else is either a
 * second coat over the finish beside it or a layer buried where nothing reaches
 * it; both are defects, and naming them apart is what tells the author whether
 * to delete a layer or move it.
 */
const appendFinishDefects = (
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

/**
 * Refuse a wrapping layer that sits behind a layer stopping at the jamb.
 *
 * Lining an opening is a run that starts at a face: a layer cannot turn the
 * corner into the reveal if the layer in front of it already ended there. A
 * buried wrap would otherwise be counted into the finished opening size and
 * quietly narrow a door nothing actually lines.
 */
const appendWrapDefects = (
  layers: readonly IAutoMovieMaterialLayer[],
  collector: ViolationCollector,
  root: string,
): void => {
  const lead = leadingRun(layers, (layer) => layer.wrapsOpening);
  const tail = Math.min(
    trailingRun(layers, (layer) => layer.wrapsOpening),
    layers.length - lead,
  );
  layers.forEach((layer, index) => {
    if (!layer.wrapsOpening) return;
    if (index < lead || index >= layers.length - tail) return;
    collector.push(
      "type",
      `${root}.layers[${index}].wrapsOpening`,
      `material layer "${layer.id}" wraps an opening from behind a layer that stops at the jamb`,
      layer.wrapsOpening,
    );
  });
};

const leadingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[count]!)) count += 1;
  return count;
};

const trailingRun = <T>(
  items: readonly T[],
  match: (item: T) => boolean,
): number => {
  let count = 0;
  while (count < items.length && match(items[items.length - 1 - count]!))
    count += 1;
  return count;
};

const rolesOf = (
  assembly: IAutoMovieResolvedAssembly,
): Map<string, { min: number; max: number; thickness: number }> => {
  const roles = new Map<
    string,
    { min: number; max: number; thickness: number }
  >([]);
  for (const layer of assembly.layers) {
    const min = Math.min(layer.start, layer.end);
    const max = Math.max(layer.start, layer.end);
    const previous = roles.get(layer.role);
    if (previous === undefined)
      roles.set(layer.role, { min, max, thickness: layer.thickness });
    else
      roles.set(layer.role, {
        min: Math.min(previous.min, min),
        max: Math.max(previous.max, max),
        thickness: previous.thickness + layer.thickness,
      });
  }
  return roles;
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-empty`, value);
};

const above = (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value !== null && (!Number.isFinite(value) || value <= limit))
    collector.push(
      "range",
      path,
      `${label} must be a finite number > ${limit}, but was ${value}`,
      value,
    );
};

const atLeast = (
  value: number | null,
  limit: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value !== null && (!Number.isFinite(value) || value < limit))
    collector.push(
      "range",
      path,
      `${label} must be a finite number >= ${limit}, but was ${value}`,
      value,
    );
};

const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};

const rolesOf = (
  assembly: IAutoMovieResolvedAssembly,
): Map<string, { min: number; max: number; thickness: number }> => {
  const roles = new Map<
    string,
    { min: number; max: number; thickness: number }
  >([]);
  for (const layer of assembly.layers) {
    const min = Math.min(layer.start, layer.end);
    const max = Math.max(layer.start, layer.end);
    const previous = roles.get(layer.role);
    if (previous === undefined)
      roles.set(layer.role, { min, max, thickness: layer.thickness });
    else
      roles.set(layer.role, {
        min: Math.min(previous.min, min),
        max: Math.max(previous.max, max),
        thickness: previous.thickness + layer.thickness,
      });
  }
  return roles;
};
