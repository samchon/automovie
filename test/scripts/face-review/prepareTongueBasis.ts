import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { solveLinear } from "./faceAnthropometrySolve";

/**
 * The tongue revision of the connected face basis: under every shape
 * channel the tongue moves as the mandibular arch moves.
 *
 * The tongue's body rides the mandible (genioglossus and geniohyoid arise on
 * its inner surface), and the basis already binds every tongue vertex to the
 * jaw for articulation. The source's shape targets did not: a retruded
 * mandible (`jawPrognathism` below -0.55) left the resting tongue in front
 * of the lower incisors, which the builder refuses; the chin's height drew
 * the tongue 10 mm down with the teeth still; the mouth's forward position
 * moved the teeth 7.3 mm and the tongue 10.3. For each shape endpoint the
 * motion of the dentition's vertices bound to `owner` at full weight (the
 * mandibular arch) is fitted by least squares with an affine map, which
 * carries a translation, a rotation and the arch's scaling alike, and the
 * tongue's rows become that map at each tongue vertex, times the vertex's
 * own binding weight; an endpoint that does not move the arch leaves the
 * tongue still, and one that moves the tongue alone is the tongue's own and
 * is left as it is. The maxillary arch, the skull's, never moves the
 * tongue.
 * The receipt records each fit's largest residual, where the arch does not
 * move as one body. Every document must build on the revision. Documents
 * and controls are restamped; nothing else changes. Pure.
 */
export function prepareTongueBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  dentition: string;
  tongue: string;
  owner: string;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    endpoints: {
      endpoint: string;
      residual: number;
      before: number;
      after: number;
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A tongue revision needs a distinct revision.");
  const dentition = basis.surfaces.find((one) => one.id === input.dentition);
  const tongue = basis.surfaces.find((one) => one.id === input.tongue);
  if (dentition === undefined || tongue === undefined)
    throw new Error("The basis lacks the dentition or the tongue surface.");
  const weights = (surface: typeof tongue) => {
    const own = new Map<number, number>();
    const rows =
      surface.attachments?.find((one) => one.owner === input.owner)?.rows ?? [];
    for (let i = 0; i < rows.length; i += 2) own.set(rows[i]!, rows[i + 1]!);
    return own;
  };
  const arch = [...weights(dentition)]
    .filter(([, weight]) => weight === 1)
    .map(([vertex]) => vertex);
  if (arch.length < 4)
    throw new Error(`The dentition has no arch bound to ${input.owner}.`);
  const bound = weights(tongue);
  const at = (positions: readonly number[], vertex: number) =>
    [0, 1, 2].map((k) => positions[3 * vertex + k]!);
  const largest = (rows: readonly number[]) => {
    let most = 0;
    for (let i = 0; i < rows.length; i += 4)
      most = Math.max(
        most,
        Math.hypot(rows[i + 1]!, rows[i + 2]!, rows[i + 3]!),
      );
    return most;
  };
  // The normal matrix of the arch's rest positions, shared by every fit.
  const rest = arch.map((vertex) => [...at(dentition.positions, vertex), 1]);
  const normal = [0, 1, 2, 3].map((p) =>
    [0, 1, 2, 3].map((q) => rest.reduce((sum, x) => sum + x[p]! * x[q]!, 0)),
  );
  const names = [
    ...new Set(
      basis.channels
        .filter((one) => one.kind === "shape")
        .flatMap((one) => [one.positive, one.negative])
        .filter((one): one is string => one !== null),
    ),
  ];
  const endpoints = names.flatMap((name) => {
    if (
      basis.surfaces.every(
        (one) => one === tongue || (one.targets[name] ?? []).length === 0,
      )
    )
      return [];
    const moved = new Map<number, number[]>();
    const rows = dentition.targets[name] ?? [];
    for (let i = 0; i < rows.length; i += 4)
      moved.set(rows[i]!, [rows[i + 1]!, rows[i + 2]!, rows[i + 3]!]);
    const before = largest(tongue.targets[name] ?? []);
    const still = arch.every((vertex) =>
      (moved.get(vertex) ?? [0, 0, 0]).every((d) => d === 0),
    );
    if (still) {
      delete tongue.targets[name];
      return before === 0
        ? []
        : [{ endpoint: name, residual: 0, before, after: 0 }];
    }
    // One least-squares affine map per axis: displacement = a . [x, 1].
    const map = [0, 1, 2].map((axis) =>
      solveLinear(
        normal,
        [0, 1, 2, 3].map((p) =>
          arch.reduce(
            (sum, vertex, i) =>
              sum + rest[i]![p]! * (moved.get(vertex)?.[axis] ?? 0),
            0,
          ),
        ),
      ),
    );
    const apply = (x: readonly number[]) =>
      map.map((a) => a[0]! * x[0]! + a[1]! * x[1]! + a[2]! * x[2]! + a[3]!);
    const residual = Math.max(
      ...arch.map((vertex, i) => {
        const fit = apply(rest[i]!);
        const d = moved.get(vertex) ?? [0, 0, 0];
        return Math.hypot(...[0, 1, 2].map((k) => d[k]! - fit[k]!));
      }),
    );
    const next: number[] = [];
    for (const [vertex, weight] of [...bound].sort((x, y) => x[0] - y[0])) {
      const d = apply(at(tongue.positions, vertex)).map((v) => v * weight);
      if (d.some((v) => v !== 0)) next.push(vertex, ...d);
    }
    tongue.targets[name] = next;
    return [{ endpoint: name, residual, before, after: largest(next) }];
  });
  basis.id = input.revision;
  const build = createHumanFaceBasisBuilder(basis);
  const documents = input.documents.map((one) => {
    const next = { ...structuredClone(one), basis: input.revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents,
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: { source: input.basis.id, revision: input.revision, endpoints },
  };
}
