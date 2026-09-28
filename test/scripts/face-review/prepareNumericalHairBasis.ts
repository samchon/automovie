import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { assertHumanFaceBasis } from "@automovie/human/face/basis/assertHumanFaceBasis";
import { createHash } from "node:crypto";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];

/**
 * Attach pinned, shared scalp correspondence to an owned facial basis revision.
 * The offline migration supplies metadata extracted from the neutral CC0 mesh;
 * no personal document, portrait or guide participates in this operation. Exact
 * little-endian buffer hashes prevent triangle ordinals from silently following
 * a different neutral or connectivity. The real builder then checks domains and
 * closed collision topology before the candidate is returned. Closure triangles
 * use resident vertices and remain query-only metadata. The caller must rebind
 * numerical documents/control maps and verify deformed states before publication.
 */
export function prepareNumericalHairBasis(props: {
  basis: IAutoMovieHumanFaceBasis;
  metadata: {
    basis: string;
    surface: string;
    neutralFloat64LESha256: string;
    topologyUint32LESha256: string;
    hairDomains: NonNullable<Surface["hairDomains"]>;
    hairContactClosure: number[];
  };
  revision: string;
}): IAutoMovieHumanFaceBasis {
  assertHumanFaceBasis(props.basis);
  const { basis, metadata, revision } = structuredClone(props);
  if (
    revision.trim() === "" ||
    revision === basis.id ||
    metadata.basis !== basis.id
  )
    throw new Error(
      "Numerical hair preparation requires its pinned source and a distinct revision.",
    );
  const surface = basis.surfaces.find((item) => item.id === metadata.surface);
  if (surface === undefined)
    throw new Error("The pinned scalp surface is absent.");
  const positions = Buffer.alloc(surface.positions.length * 8);
  surface.positions.forEach((value, index) =>
    positions.writeDoubleLE(value, index * 8),
  );
  const indices = Buffer.alloc(surface.indices.length * 4);
  surface.indices.forEach((value, index) =>
    indices.writeUInt32LE(value, index * 4),
  );
  if (
    createHash("sha256").update(positions).digest("hex") !==
      metadata.neutralFloat64LESha256 ||
    createHash("sha256").update(indices).digest("hex") !==
      metadata.topologyUint32LESha256
  )
    throw new Error(
      "Pinned scalp correspondence differs from the neutral surface buffers.",
    );
  if (
    surface.hairDomains !== undefined ||
    surface.hairContactClosure !== undefined
  )
    throw new Error(
      "The source already contains numerical hair correspondence.",
    );
  surface.hairDomains = metadata.hairDomains;
  surface.hairContactClosure = metadata.hairContactClosure;
  basis.id = revision;
  createHumanFaceBasisBuilder(basis);
  return basis;
}
