import type { HumanReferenceCurveGeometry } from "./HumanReferenceCurveGeometry";
import type { HumanReferenceCurveQuality } from "./HumanReferenceCurveQuality";

/**
 * The records of the private reference curve pack as its files store them:
 * the horizontal-section index and region files, and the f1 limb-section
 * index and station files. Two families: horizontal sections along +Y
 * (`sections/<region>/*.json`, listed by `index.json`) and, for f1, sections
 * normal to the limb and digit bones (`limbs/<bone>/*.json`, listed by
 * `limbs/index.json`).
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 * Each curve carries the pack's quality audit.
 */
export namespace HumanReferenceCurvePack {
  /** One curve of a section with its identity in the source. */
  export interface ILoop {
    /** `closed`: a loft loop; `open`: an open fitted arc from the section report. */
    kind: "closed" | "open";

    /** Ordinal among the section's loops of the same kind in the source. */
    ordinal: number;

    /** Region label (horizontal sections) or bone (limb sections). */
    region: string;

    /** Recovery's winding of a closed loop; null for an open arc. */
    winding: number | null;

    /** Recovery's fit diagnostics for the curve. */
    fit: Record<string, unknown> | null;

    /** The fitted curve. */
    curve: HumanReferenceCurveGeometry.ICurve;

    /** The pack's quality audit of the curve. */
    quality: HumanReferenceCurveQuality.IQuality;
  }

  /** One horizontal section, holding the loops of the requested regions. */
  export interface ISection {
    /** Section ordinal in the source. */
    index: number;

    /** Section height y, mm. */
    coordinateMm: number;

    /** Loops of the section in the requested regions. */
    loops: ILoop[];
  }

  /** One region file of the horizontal sections, as listed by the index. */
  export interface IFile {
    /** Path relative to the person's pack directory. */
    file: string;

    /** Region of every curve in the file. */
    region: string;

    /** First section ordinal held. */
    firstSection: number;

    /** Last section ordinal held. */
    lastSection: number;

    /** Height of the first section held, mm. */
    fromMm: number;

    /** Height of the last section held, mm. */
    toMm: number;

    /** Curves held. */
    curves: number;

    /** Spans held. */
    spans: number;

    /** File size, bytes. */
    bytes: number;
  }

  /** A horizontal region file as written by the pack. */
  export interface IRegionFile {
    /** The sections the file holds, in height order. */
    sections: IRegionSection[];
  }

  /** One section's curves within a region file. */
  export interface IRegionSection {
    /** Section ordinal in the source. */
    index: number;

    /** Section height y, mm. */
    coordinateMm: number;

    /** The section's curves of this file's region. */
    curves: ILoop[];
  }

  /** One section's entry in the index; `loops` rows follow `IIndex.loopColumns`. */
  export interface ISectionEntry {
    /** Section ordinal. */
    index: number;

    /** Section height y, mm. */
    coordinateMm: number;

    /** `complete` when the section has no diagnostics, open arcs, topology gap or missed fit. */
    status: "complete" | "partial";

    /** Closed loop count. */
    closedLoops: number;

    /** Open arc count. */
    openArcs: number;

    /** Span count over both kinds. */
    spans: number;

    /** Whether the section lies inside a Recovery topology gap. */
    inTopologyGap: boolean;

    /** Recovery's section diagnostics. */
    diagnostics: string[];

    /** Isolated contact points, mm. */
    isolatedContactsMm: HumanReferenceCurveGeometry.V3[];

    /** Curve count per region. */
    regions: Record<string, number>;

    /** Curve count per audit status. */
    quality: Partial<Record<HumanReferenceCurveQuality.Status, number>>;

    /** One row per curve, closed loops first, columns as `IIndex.loopColumns` (the last is the curve's `IQuality`). */
    loops: unknown[][];
  }

  /** A person's horizontal-section index. */
  export interface IIndex {
    /** Reference alias. */
    id: string;

    /** Provenance: source file, hash, producer, policy and summary. */
    source: Record<string, unknown>;

    /** Frame and units. */
    frame: Record<string, unknown>;

    /** Region labelling method, landmarks and counts. */
    labelling: Record<string, unknown>;

    /** Column names of the `ISectionEntry.loops` rows. */
    loopColumns: string[];

    /** Region files. */
    files: IFile[];

    /** Every section of the source, in order. */
    sections: ISectionEntry[];

    /** The quality audit. */
    quality: HumanReferenceCurveQuality.IAudit;
  }

  /** A filter over the horizontal sections. */
  export interface IQuery {
    /** Audit statuses kept; `ok` alone when absent. */
    quality?: HumanReferenceCurveQuality.Filter;

    /** Lowest section height kept, mm. */
    fromMm?: number;

    /** Highest section height kept, mm. */
    toMm?: number;

    /** Regions kept; all when absent. */
    region?: string | readonly string[];

    /** Curve kind kept; both when absent. */
    kind?: "closed" | "open";
  }

  /** One station of a limb family: a plane normal to a bone and its loops. */
  export interface IStation {
    /** Station ordinal within its family. */
    station: number;

    /** Signed distance of the plane along its normal from the frame origin, mm. */
    coordinateMm: number;

    /** Distance along the family's normal from its first station, mm. */
    stationMm: number;

    /** A point of the plane (on the bone axis), mm. */
    originMm: HumanReferenceCurveGeometry.V3;

    /** In-plane axis u. */
    u: HumanReferenceCurveGeometry.V3;

    /** In-plane axis v. */
    v: HumanReferenceCurveGeometry.V3;

    /** Plane normal, v x u. */
    normal: HumanReferenceCurveGeometry.V3;

    /** Loops the source dropped as not winding round the origin. */
    others: number | null;

    /** Recovery's diagnostics for the station's plane. */
    diagnostics: string[];

    /** Isolated contact points, mm. */
    isolatedContactsMm: HumanReferenceCurveGeometry.V3[];

    /** The kept loops and the plane's open arcs. */
    loops: ILoop[];
  }

  /** One pack file of a limb family. */
  export interface ILimbFile {
    /** Path relative to the person's `limbs/` directory. */
    file: string;

    /** Ordinal of the first station the file holds; -1 when the family has no station. */
    firstStation: number;

    /** Ordinal of the last station the file holds, inclusive. */
    lastStation: number;

    /** File size in bytes, so a caller can bound what it reads. */
    bytes: number;
  }

  /** The index's summary of one limb station, without its curves. */
  export interface IStationRow {
    /** Station ordinal within its family, as in `IStation.station`. */
    station: number;

    /** Signed distance of the plane from the frame origin along its normal, mm, rounded to 0.001. */
    coordinateMm: number;

    /**
     * Distance of this station's origin from the family's first origin along
     * the first station's normal, mm. Meaningful only for a parallel family;
     * joints and keys planes differ in normal.
     */
    stationMm: number;

    /** The plane's origin (a point of the bone or trunk axis), mm, rounded to 0.001. */
    originMm: HumanReferenceCurveGeometry.V3;

    /** Unit plane normal, v x u of the source frame, rounded to 1e-6. */
    normal: HumanReferenceCurveGeometry.V3;

    /** Loops the source dropped as not winding round the origin; null when the source did not count them. */
    others: number | null;

    /** Number of Recovery diagnostics reported for this plane; the texts are in the station's file. */
    diagnostics: number;

    /**
     * One row per loop, columns as `ILimbIndex.loopColumns`; perimeter, area
     * and centroid are measured in the plane's (u, v) chart, and the last
     * column is the loop's `IQuality`.
     */
    loops: unknown[][];
  }

  /** One limb family file listed by the limb index. */
  export interface ILimbFamily {
    /** Family name, the source file name without extension. */
    name: string;

    /** Bone or module the family belongs to. */
    bone: string;

    /** Source file under `test/.shots/f1/body-sections`. */
    source: string;

    /** SHA-256 of the source file's bytes. */
    sourceSha256: string;

    /** Family kind: stations, root, joints, heads, keys or horizontal. */
    kind: string;

    /** Station count. */
    stations: number;

    /** Curve count. */
    curves: number;

    /** Span count. */
    spans: number;

    /** Pack files holding the stations, in station order. */
    files: ILimbFile[];

    /** The source's own fields (status, policy, planes, crop, rule, root links), curves replaced by their paths. */
    meta: Record<string, unknown>;

    /** The source's diagnostics. */
    diagnostics: string[];

    /** One summary row per station, so a family can be scanned without reading its files. */
    stationRows: IStationRow[];
  }

  /** A source file without curves, copied unchanged into the pack. */
  export interface IRecord {
    /** Source file name without extension. */
    name: string;

    /** `planes` for a plane list the observer was asked to cut, else the record's kind (such as `terminal`). */
    kind: string;

    /** Source path under `test/.shots/f1/body-sections`. */
    source: string;

    /** Copy's path relative to the person's `limbs/` directory. */
    file: string;

    /** Number of planes in a plane list; null for any other record. */
    planes: number | null;
  }

  /** The limb-section index. */
  export interface ILimbIndex {
    /** Reference alias. */
    id: string;

    /** Column names of the `stationRows[].loops` rows. */
    loopColumns: string[];

    /** Families in the pack. */
    families: ILimbFamily[];

    /** Source files without curves (plane lists, terminal records), copied under `limbs/records/`. */
    records: IRecord[];

    /** The quality audit. */
    quality: HumanReferenceCurveQuality.IAudit;
  }

  /** A station file of a limb family as written by the pack. */
  export interface IStationFile {
    /** The stations the file holds, in station order. */
    stations: IStation[];
  }

  /** A filter over one limb family's stations. */
  export interface IStationQuery {
    /** First station kept. */
    from?: number;

    /** Last station kept. */
    to?: number;

    /** Audit statuses kept; `ok` alone when absent. */
    quality?: HumanReferenceCurveQuality.Filter;
  }
}
