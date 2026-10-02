import { measureAutoMovieMeshCrossings } from "@automovie/engine";

/**
 * Measure source-relative orientation reversals and newly intersecting pairs
 * for both face-support fault APIs. Input arrays are caller owned, in metres
 * in one shared frame, with one unchanged triangle topology. Triangle identities
 * are offsets into that topology, not positions or material-region indices.
 *
 * Ordered pair identities distinguish inherited crossings from new ones even
 * when another pair disappears. Normals use Float64 cross products: a negative
 * dot product is a reversal relative to the source; zero does not certify
 * positive triangle area. The engine's 1e-9 interior tolerance is dimensionless
 * in segment and triangle interpolation coordinates, not a world-space distance.
 * Coplanar pairs and pairs inside the contact set are
 * excluded, so neither this measure nor its callers certify that whole tissue.
 *
 * @evidence contracts/common.md#principled-implementation One orientation calculation and ordered source-pair set comparison supply both reports. Removing a source pair cannot cancel another new pair. Shared topology and frame are preconditions; zero normal dots and explicit contact/coplanar exclusions do not certify a complete valid surface.
 * @evidence contracts/common.md#clear-and-simple-design This owner computes the common measurements; faceSupportFaults aggregates defect counts and faceSupportFaultTriangles accumulates affected offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads numerical inputs without document, photograph or fixture conditions; engine queries receive copied arrays and no caller array is mutated.
 * @evidence contracts/common.md#meaningful-documentation States units, identity meaning, source comparison, numerical tolerance and the classes left outside the measure.
 * @evidence contracts/modeling.md#spatial-conventions Source/result positions are metres in one caller frame and returned identities are offsets into their common triangle topology.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This geometric measurement defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels This measurement consumes no form channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This measurement emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries This measurement constructs no shared boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation This measurement owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This measurement carries no anatomical value or tissue model.
 * @evidenceExclude contracts/anatomy.md#permitted-range This measurement admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This measurement exposes no input through which a caller shapes a human form.
 */
export function measureFaceSupportFaults(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  contact?: ReadonlySet<number>;
}): { turned: number[]; crossings: [number, number][] } {
  return {
    turned: turnedTriangles(props),
    crossings: newCrossingPairs(
      props,
      new Set(props.triangles),
      props.contact ?? new Set<number>(),
    ),
  };
}

/**
 * Compare unnormalized triangle normals in the shared source/result frame.
 * A negative dot product names a reversal relative to the source; zero is the
 * boundary and does not certify an area-degenerate triangle. This is one
 * orientation owner for both fault APIs, not an anatomical validity predicate.
 */
function turnedTriangles(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
}): number[] {
  const { indices: I, triangles } = props;
  const normal = (P: readonly number[], t: number) => {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    return [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
  };
  return triangles.filter((t) => {
    const [a, b] = [normal(props.source, t), normal(props.positions, t)];
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]! < 0;
  });
}

/**
 * New crossing identities, shared by the count and triangle-report APIs.
 * Removing an old crossing cannot cancel a different new crossing: a pair's
 * ordered triangle offsets identify it independently of the aggregate count.
 * Source and result have the same topology, as both callers require.
 */
function newCrossingPairs(
  props: {
    source: readonly number[];
    positions: readonly number[];
    indices: readonly number[];
  },
  support: ReadonlySet<number>,
  contact: ReadonlySet<number>,
): [number, number][] {
  const before = new Set(
    crossingPairs(props.source, props.indices, support, contact).map((pair) =>
      pair.join(),
    ),
  );
  return crossingPairs(props.positions, props.indices, support, contact).filter(
    (pair) => !before.has(pair.join()),
  );
}

/** The crossing pairs themselves, each ordered, lower triangle first. */
function crossingPairs(
  P: readonly number[],
  I: readonly number[],
  support: ReadonlySet<number>,
  contact: ReadonlySet<number>,
): [number, number][] {
  const mesh = {
    positions: P.slice(),
    indices: I.slice(),
    normals: null,
    uvs: null,
    skin: null,
  };
  const seen = new Set<string>();
  const pairs: [number, number][] = [];
  for (const crossing of measureAutoMovieMeshCrossings(mesh, mesh, {
    allPairs: true,
    interiorTolerance: 1e-9,
  })) {
    if (crossing.coplanar) continue;
    const [a, b] = [crossing.triangle * 3, crossing.other * 3].sort(
      (one, other) => one - other,
    );
    if (!support.has(a) && !support.has(b)) continue;
    if (contact.has(a) && contact.has(b)) continue;
    const key = `${a}/${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([a, b]);
  }
  return pairs;
}
