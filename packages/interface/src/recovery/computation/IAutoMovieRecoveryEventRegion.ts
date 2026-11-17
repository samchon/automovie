
/**
 * Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in original face order. The implicit cell is that face's barycentric domain intersected with the closed scalar interval; no source triangle array or generated mesh is returned. Source and returned private addresses must be discarded before engine publication. Original source edges share declared incidence; cut edges remain face occurrences, so coincident or parallel cut edges are not welded. Raw and canonical incidence are explicit alternatives, not assumed equivalent. Plane strata require one external owner when adjacent slabs are combined. Connectivity/topology never establishes a regular or event chart: every component remains unclassified, with all unsupported evidence retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Borrowed physical positions in the registered millimetre frame; indices in triangles address this array. Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
 * @evidence contracts/development/design.md#principled-representation Borrowed physical positions in the registered millimetre frame; indices in triangles address this array.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
 */

export namespace IAutoMovieRecoveryEventRegion {
/**
 * Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in original face order. The implicit cell is that face's barycentric domain intersected with the closed scalar interval; no source triangle array or generated mesh is returned. Source and returned private addresses must be discarded before engine publication. Original source edges share declared incidence; cut edges remain face occurrences, so coincident or parallel cut edges are not welded. Raw and canonical incidence are explicit alternatives, not assumed equivalent. Plane strata require one external owner when adjacent slabs are combined. Connectivity/topology never establishes a regular or event chart: every component remains unclassified, with all unsupported evidence retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#principled-representation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (source: IAutoMovieRecoveryEventRegion.Source) => (query: IAutoMovieRecoveryEventRegion.Query) => IAutoMovieRecoveryEventRegion.Result;


/**
 * Source within recovery event region. Borrowed physical positions in the registered millimetre frame; indices in triangles address this array.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Borrowed physical positions in the registered millimetre frame; indices in triangles address this array. Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
 * @evidence contracts/development/design.md#principled-representation Borrowed physical positions in the registered millimetre frame; indices in triangles address this array.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
 */
export interface Source {
 
 /** Borrowed physical positions in the registered millimetre frame; indices in triangles address this array. */
verticesMm: readonly IAutoMovieRecoveryEventRegion.V[];
 
 /** Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. */
triangles: readonly IAutoMovieRecoveryEventRegion.Triangle[];
 
 /** One in-range canonical connectivity index per original vertex; this does not move source coordinates. */
canon: Int32Array;
 
 /** Finite scalar projections aligned with source vertices, in the same units as query levels. */
heights: readonly number[];
 
 /** Selects raw source addresses or caller-declared canonical connectivity; equal coordinates alone do not select an equivalence. */
incidence: "raw" | "canonical";
}


/**
 * Query within recovery event region. Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm. Upper physical sweep coordinate in registered millimetres; paired with the strictly smaller beforeMm.
 * @evidence contracts/development/design.md#principled-representation Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export interface Query {
 
 /** Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm. */
beforeMm: number;
 
 /** Upper physical sweep coordinate in registered millimetres; paired with the strictly smaller beforeMm. */
afterMm: number;
 
 /** Strictly increasing original face indices covering the operation's complete scalar overlap interval; omission, where allowed, scans all faces. */
candidates: readonly number[];
 
 /** Declared boundary observations and their component membership; ambiguous or missing membership remains explicit. */
ports: readonly IAutoMovieRecoveryEventRegion.Port[];
}


/**
 * Returned coefficient or observation state from RecoveryEventRegion. Every observed source-topology or port-membership failure, retained without repairing source incidence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Selects raw source addresses or caller-declared canonical connectivity; equal coordinates alone do not select an equivalence. Closed scalar query bounds [before,after] in registered millimetres.
 * @evidence contracts/development/design.md#principled-representation Closed scalar query bounds [before,after] in registered millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Selects raw source addresses or caller-declared canonical connectivity; equal coordinates alone do not select an equivalence.
 */
export interface Result {
 
 /** Selects raw source addresses or caller-declared canonical connectivity; equal coordinates alone do not select an equivalence. */
incidence: IAutoMovieRecoveryEventRegion.Source["incidence"];
 
 /** Closed scalar query bounds [before,after] in registered millimetres. */
boundsMm: [number, number];
 
 /** Candidate inclusion is the caller's closed-overlap premise, not independently certified here. */
  coverage: {
 
   /** Number of caller-supplied face candidates visited by this closed-interval query. */
candidateFaces: number;
 
   /** Supplied candidates with no cell in the requested closed scalar interval. */
outsideCandidates: number;
 
   /** Caller-premise means the observer does not scan omitted faces to certify candidate completeness. */
completeness: "caller-premise";
  };
 
 /** Observed boundary-node identities in traversal order; repeated physical positions retain separate incidence when declared. */
nodes: IAutoMovieRecoveryEventRegion.Node[];
 
 /** Explicit original-to-canonical incidence aliases; no proximity matching is inferred. */
aliases: {
 /** Original observed node identity before applying the selected incidence equivalence. */
rawNode: string;
 /** Declared connectivity identity, independent of physical coordinate equality. */
incidenceId: string }[];
 
 /** Observed source cells in query-local index order; source-face addresses remain acquisition metadata. */
cells: IAutoMovieRecoveryEventRegion.Cell[];
 
 /** Directed halfedge occurrences retained in actual source-cell traversal order. */
occurrences: IAutoMovieRecoveryEventRegion.Occurrence[];
 
 /** Observed two-cell components or their query-local ordinals; lower-dimensional contacts do not merge them. */
components: IAutoMovieRecoveryEventRegion.Component[];
 
 /** Lower-dimensional source cells and their incident two-cell components, retained without inventing a cap. */
contacts: {
 /** Query-local index into the observed cells array. */
cell: number;
 /** Component ordinals meeting this lower-dimensional contact; contact does not merge their two-cell sheets. */
touchingComponents: number[] }[];
 
 /** Declared boundary observations and their component membership; ambiguous or missing membership remains explicit. */
ports: {
 
   /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
id: string;
 
   /** Saved observation address for this port; the discriminant separates closed/open curves, contacts and named boundaries. */
reference: IAutoMovieRecoveryEventRegion.PortReference;
 
   /** Observed source cells in query-local index order; source-face addresses remain acquisition metadata. */
cells: number[];
 
   /** Observed two-cell components or their query-local ordinals; lower-dimensional contacts do not merge them. */
components: number[];
 
   /** Directed halfedge occurrences retained in actual source-cell traversal order. */
occurrences: string[];
 
   /** Closed outcome discriminator; unavailable or ambiguous arms retain diagnostics instead of fabricated successful data. */
status: "unique-component" | "contact-only" | "ambiguous" | "missing";
  }[];
 
 /** Every observed source-topology or port-membership failure, retained without repairing source incidence. */
issues: IAutoMovieRecoveryEventRegion.Issue[];
}


/**
 * V within recovery event region. Its referenced contract retains the same units, ordering and absence semantics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#principled-representation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type V = readonly [number, number, number];


/**
 * Triangle within recovery event region. Its referenced contract retains the same units, ordering and absence semantics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#principled-representation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type Triangle = readonly [number, number, number];


/**
 * Port within recovery event region. Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. Saved observation address for this port; the discriminant separates closed/open curves, contacts and named boundaries.
 * @evidence contracts/development/design.md#principled-representation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity.
 */
export interface Port {
 
 /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
id: string;
 
 /** Saved observation address for this port; the discriminant separates closed/open curves, contacts and named boundaries. */
reference: IAutoMovieRecoveryEventRegion.PortReference;
 
 /** Source-boundary role: before or after scalar plane, or an actual physical source boundary. */
side: "before" | "after" | "physical";
 
 /** Exact cut-segment faces, rather than an unqualified endpoint-star superset. */
  faces: readonly number[];
 
 /** Original source endpoint addresses of physical boundary edges, when supplied. */
  edges?: readonly (readonly [number, number])[];
}


/**
 * Node within recovery event region. Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. Declared connectivity identity, independent of physical coordinate equality.
 * @evidence contracts/development/design.md#principled-representation Original source vertex ordinals supporting this symbolic observed node.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity.
 */
export interface Node {
 
 /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
id: string;
 
 /** Declared connectivity identity, independent of physical coordinate equality. */
incidenceId: string;
 
 /** Original source vertex ordinals supporting this symbolic observed node. */
vertices: readonly number[];
 
 /** Node coordinate in the immutable registered scalar chart, in millimetres for recovery observations. */
scalar: number;
}


/**
 * Cell within recovery event region. Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate. Original source-triangle ordinal, preserved through observation and subdivision.
 * @evidence contracts/development/design.md#principled-representation Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate.
 */
export interface Cell {
 
 /** Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate. */
id: number;
 
 /** Original source-triangle ordinal, preserved through observation and subdivision. */
face: number;
 
 /** Dimension in the source triangle's reference domain, independently of geometric rank. */
  dimension: 0 | 1 | 2;
 
 /** Exact affine rank of the original face, not the physical dimension of a contact cell. */
  sourceGeometryRank: 0 | 1 | 2;
 
 /** Whether the source cell varies through the interval, lies on an interior or endpoint plane, or is a boundary contact. */
scalarKind:
    | "varying"
    | "flat-interior"
    | "flat-before"
    | "flat-after"
    | "boundary-contact";
 
 /** One plane registry must own on-plane faces/contacts when adjacent query results are combined. */
  stratum:
    | {
 /** Closed representation discriminator selecting the corresponding observation or result arm. */
kind: "open-slab";
 /** Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm. */
beforeMm: number;
 /** Upper physical sweep coordinate in registered millimetres; paired with the strictly smaller beforeMm. */
afterMm: number }
    | {
 /** Closed representation discriminator selecting the corresponding observation or result arm. */
kind: "plane";
 /** Signed section-plane coordinate along the registered unit sweep axis, in millimetres. */
coordinateMm: number };
 
 /** Observed boundary-node identities in traversal order; repeated physical positions retain separate incidence when declared. */
nodes: string[];
 
 /** Query-local component ordinal; null, where allowed, means the cell has no two-dimensional component. */
component: number | null;
 
 /** Relative face reorientation for a qualified orientable sheet, never an outward-normal claim. */
  orientationFlip: boolean | null;
}


/**
 * Occurrence within recovery event region. Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. Query-local index into the observed cells array.
 * @evidence contracts/development/design.md#principled-representation Query-local index into the observed cells array.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity.
 */
export interface Occurrence {
 
 /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
id: string;
 
 /** Query-local index into the observed cells array. */
cell: number;
 
 /** Original source-triangle ordinal, preserved through observation and subdivision. */
face: number;
 
 /** Identity of the directed source incidence at this edge's start. */
from: string;
 
 /** Identity of the directed source incidence at this edge's end. */
to: string;
 
 /** Declared undirected edge identity; halfedge occurrences retain their own direction and source-face ownership. */
edge: string;
 
 /** Source-boundary role: before or after scalar plane, or an actual physical source boundary. */
side: "before" | "after" | "physical";
 
 /** True when this halfedge follows an actual source boundary rather than a scalar cut. */
physicalBoundary: boolean;
 
 /** Query-local component ordinal; null, where allowed, means the cell has no two-dimensional component. */
component: number;
}


/**
 * Component within recovery event region. Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate. Observed source cells in query-local index order; source-face addresses remain acquisition metadata.
 * @evidence contracts/development/design.md#principled-representation Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate.
 */
export interface Component {
 
 /** Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate. */
id: number;
 
 /** Observed source cells in query-local index order; source-face addresses remain acquisition metadata. */
cells: number[];
 
 /** Original source-face indices retained as incidence support; these never become generated mesh indices. */
faces: number[];
 
 /** Always unclassified: topology observations do not themselves authorize an engine chart. */
classification: "unclassified";
 
 /** Topology of the relative two-cell sheet; lower-dimensional contacts remain separate evidence. */
  topology: {
 
   /** Actual vertex population of this generated run or observed component. */
vertices: number;
 
   /** Distinct edge-incidence population used in the component's Euler accounting. */
edges: number;
 
   /** Two-cell face population used in the observed component's Euler accounting. */
faces: number;
 
   /** Euler characteristic V-E+F of the relative sheet, or null when its topology cannot be qualified. */
euler: number | null;
 
   /** Whether the observed local incidence meets the owning operation's manifold checks; no embedding claim follows. */
manifold: boolean;
 
   /** Whether face parity admits coherent orientation, or null when the sheet cannot be qualified. */
orientable: boolean | null;
 
   /** Whether original face directions already agree across the admitted adjacency. */
inputOrientationConsistent: boolean;
 
   /** Number of closed boundary cycles in the observed relative sheet. */
boundaryCycles: number;
 
   /** Genus derived only for a qualified connected orientable sheet, otherwise null. */
genus: number | null;
  };
 
 /** Halfedge occurrence and traversal direction; no coordinate or arbitrary seam closure is added. */
  cycles: {
 
   /** Directed halfedge occurrences retained in actual source-cell traversal order. */
occurrences: {
 /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
id: string;
 /** Traversal orientation relative to the stored occurrence: +1 forward and -1 backward. */
direction: 1 | -1 }[];
 
   /** Observed boundary-node identities in traversal order; repeated physical positions retain separate incidence when declared. */
nodes: string[];
 
   /** Whether traversal follows a qualified coherent sheet orientation or remains explicitly unqualified. */
orientation: "coherent" | "unqualified";
  }[];
 
 /** Boundary incidence identities whose traversal could not be qualified as a simple cycle. */
unresolvedBoundary: string[];
 
 /** Indices into the query result's issues array for this component. */
issueIds: number[];
}


/**
 * PortReference within recovery event region. Its referenced contract retains the same units, ordering and absence semantics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#principled-representation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type PortReference =
  | {
 /** Closed representation discriminator selecting the corresponding observation or result arm. */
kind: "closed" | "open";
 /** Saved-section ordinal in the input observation sequence. */
section: number;
 /** Curve ordinal in the addressed saved closed/open section population. */
curve: number }
  | {
 /** Closed representation discriminator selecting the corresponding observation or result arm. */
kind: "contact";
 /** Saved-section ordinal in the input observation sequence. */
section: number;
 /** Contact-observation ordinal in the addressed saved section. */
observation: number }
  | {
 /** Closed representation discriminator selecting the corresponding observation or result arm. */
kind: "boundary";
 /** Caller-assigned stable semantic identity retained in generated coefficient and observation records. */
name: string };


/**
 * Issue within recovery event region. Diagnostic category produced by the topology observer; it carries no automatic repair instruction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Diagnostic category produced by the topology observer; it carries no automatic repair instruction. Original source-face indices retained as incidence support; these never become generated mesh indices.
 * @evidence contracts/development/design.md#principled-representation Observed source cells in query-local index order; source-face addresses remain acquisition metadata.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original source-face indices retained as incidence support; these never become generated mesh indices.
 */
export interface Issue {
 
 /** Diagnostic category produced by the topology observer; it carries no automatic repair instruction. */
code: IAutoMovieRecoveryEventRegion.IssueCode;
 
 /** Original source-face indices retained as incidence support; these never become generated mesh indices. */
faces: number[];
 
 /** Observed source cells in query-local index order; source-face addresses remain acquisition metadata. */
cells: number[];
 
 /** Directed halfedge occurrences retained in actual source-cell traversal order. */
occurrences: string[];
 
 /** Declared boundary observations and their component membership; ambiguous or missing membership remains explicit. */
ports: string[];
}


/**
 * IssueCode within recovery event region. Its referenced contract retains the same units, ordering and absence semantics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#principled-representation Prepare private scalar-clipped source-cell ownership and boundary incidence observations. Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeRecoverySourceSlabs, RecoveryAtlasObservationSource, RecoveryEventRegion share IAutoMovieRecoveryEventRegion's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type IssueCode =
  | "collapsed-declared-incidence"
  | "duplicate-face-occurrence"
  | "source-geometry-rank-below-two"
  | "flat-source-face"
  | "repeated-cell-incidence-vertex"
  | "nonmanifold-edge-incidence"
  | "nonmanifold-source-edge"
  | "nonmanifold-vertex-link"
  | "boundary-is-not-a-simple-cycle"
  | "orientation-parity-obstruction"
  | "input-face-directions-inconsistent"
  | "point-contact-between-edge-components"
  | "port-ambiguous-ownership"
  | "port-missing-ownership"
  | "overlapping-port-boundary-claims";
}

