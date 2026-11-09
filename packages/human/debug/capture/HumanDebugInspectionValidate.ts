import * as THREE from "three";
import { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import { placeHumanDebugCamera } from "../page/placeHumanDebugCamera";
import type { IHumanDebugInspectionPlan as P } from "./IHumanDebugInspectionPlan";

/** Protocol and intended-camera checks, not anatomical thresholds or a replacement renderer. */
export namespace HumanDebugInspectionValidate {
  /** Camera input/output round trips tolerate floating-point conversion only, in metres/radians. */
  const EPSILON: number = 1e-8;

  /** Maximize projected box area, then extent, among three named axes; this is visibility, not anatomy. */
  export function direction(box: P.Frame): P.Camera {
    const extent: number[] = box.max.map((value: number, index: number): number => value - box.min[index]!);
    const choices: { camera: P.Camera; a: number; b: number }[] = [
      { camera: "front", a: extent[1]!, b: extent[2]! },
      { camera: "left", a: extent[0]!, b: extent[1]! },
      { camera: "top", a: extent[0]!, b: extent[2]! },
    ];
    let best: typeof choices[number] = choices[0]!;
    for (const choice of choices)
      if (choice.a * choice.b > best.a * best.b || choice.a * choice.b === best.a * best.b && Math.hypot(choice.a, choice.b) > Math.hypot(best.a, best.b)) best = choice;
    return best.camera;
  }

  /** Compile named degrees and metre bounds; explicit placement also models the URL mm round trip. */
  export function camera(row: P.Row, frame: P.Frame | undefined, explicit: boolean = true): { query: Record<string, string>; expected: Record<string, unknown> | null } {
    const angles: readonly [number, number] = HUMAN_DEBUG_CAMERAS[row.camera];
    const query: Record<string, string> = { camera: row.camera, az: String(angles[0]), el: String(angles[1]), ortho: "0", fov: "30" };
    if (frame === undefined) return { query, expected: null };
    const box: THREE.Box3 = new THREE.Box3(new THREE.Vector3(...point(frame.min)), new THREE.Vector3(...point(frame.max)));
    const azimuth: number = THREE.MathUtils.degToRad(angles[0]);
    const elevation: number = THREE.MathUtils.degToRad(angles[1]);
    const placement: Record<string, unknown> = placeHumanDebugCamera(new THREE.PerspectiveCamera(30), azimuth, elevation, box, 1, null, null);
    const target: number[] = point(placement.target);
    const position: number[] = point(placement.position);
    query.target = target.map((value: number): number => value * 1000).join(",");
    query.dist = String(Math.hypot(...position.map((value: number, index: number): number => value - target[index]!)) * 1000);
    const look: THREE.Vector3 = explicit
      ? new THREE.Vector3(...point(query.target.split(",").map((value: string): number => Number(value)))).divideScalar(1000)
      : new THREE.Vector3(...point(target));
    const beforeOrbit: THREE.Vector3 = explicit
      ? look.clone().addScaledVector(new THREE.Vector3(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation)), Number(query.dist) / 1000)
      : new THREE.Vector3(...point(position));
    const offset: THREE.Vector3 = beforeOrbit.sub(look);

    // Stage.frame/follow run OrbitControls.update with its original +Y-up orbit basis. Use the same
    // public Spherical pole guard after the actual floating-point position/target subtraction.
    offset.setFromSpherical(new THREE.Spherical().setFromVector3(offset).makeSafe());
    const observed: THREE.Vector3 = look.clone().add(offset).sub(look);
    placement.position = look.clone().add(offset).toArray();
    placement.target = look.toArray();
    placement.azimuth = Math.atan2(observed.z, observed.x);
    placement.elevation = Math.asin(Math.max(-1, Math.min(1, observed.y / observed.length())));
    return { query, expected: placement };
  }

  /** Read the existing visible-curve bounds; no mesh inverse fit or arbitrary person coordinates. */
  export function bounds(receipt: P.Receipt): P.Frame {
    const region: { min?: unknown; max?: unknown } = (receipt.snapshot.camera?.region ?? {}) as { min?: unknown; max?: unknown };
    const min: number[] = point(region.min);
    const max: number[] = point(region.max);
    if (!max.some((value: number, index: number): boolean => value > min[index]!)) throw new Error("Visible source framing has empty bounds");
    return { min, max };
  }

  /** Union reference and whole-source boxes so one whole camera admits both. */
  export function union(a: P.Frame, b: P.Frame): P.Frame {
    return { min: a.min.map((value: number, index: number): number => Math.min(value, b.min[index]!)), max: a.max.map((value: number, index: number): number => Math.max(value, b.max[index]!)) };
  }

  /** Check the intended direction as well as matched pass placement and exact visible identities. */
  export function frame(row: P.Row, receipt: P.Receipt, box: P.Frame | undefined, size: number): string[] {
    const snapshot: P.Receipt["snapshot"] = receipt.snapshot;
    if (snapshot.subject === null || snapshot.subject.person !== "f1") throw new Error("The requested f1 subject is unavailable");
    if (snapshot.canvas.width !== size || snapshot.canvas.height !== size || /swiftshader|llvmpipe|software/i.test(snapshot.canvas.gpu)) throw new Error("The requested hardware canvas was not drawn");
    if (receipt.cache !== "new-requested-frame") throw new Error("A new requested frame was not returned");
    const actual: Record<string, unknown> = snapshot.camera ?? {};
    if (typeof actual.azimuth !== "number" || !Number.isFinite(actual.azimuth) || typeof actual.elevation !== "number" || !Number.isFinite(actual.elevation)) throw new Error("Actual camera has unavailable angular metadata");
    const expected: Record<string, unknown> = camera(row, box ?? bounds(receipt), box !== undefined).expected!;
    const angular: (a: unknown, b: number) => number = (a: unknown, b: number): number => Math.abs(Math.atan2(Math.sin(Number(a) - b), Math.cos(Number(a) - b)));
    if (angular(actual.azimuth, Number(expected.azimuth)) > EPSILON || angular(actual.elevation, Number(expected.elevation)) > EPSILON)
      throw new Error("Actual camera direction differs from intended named " + row.camera + " after the existing OrbitControls pole guard; URL angles are degrees, snapshot angles are radians");
    if (actual.projection !== "perspective" || Number(actual.fov) !== 30 || Number(actual.aspect) !== 1) throw new Error("Actual camera projection differs from the plan");
    for (const field of ["position", "target", "up"])
      if (point(actual[field]).some((value: number, index: number): boolean => Math.abs(value - point(expected[field])[index]!) > EPSILON))
        throw new Error("Actual camera " + field + " differs from the single intended placement");
    if (box !== undefined) fits(actual, box);
    const raw: boolean = row.stage.startsWith("raw-");
    if (raw) fits(actual, bounds(receipt));
    const final: boolean = row.stage === "final-clay";
    const expectedPiece: string = row.piece ?? "source.parts:tree";
    if (!final && (raw ? snapshot.subject.piece !== expectedPiece : !(snapshot.subject.piece ?? "").startsWith("reference:"))) throw new Error("Unexpected producer subject");
    const provenance: Record<string, unknown> = snapshot.provenance ?? {};
    if (raw && provenance.selection !== (expectedPiece === "source.parts:tree" ? "production-tree" : "part-name-globs")) throw new Error("Raw display did not preserve its actual requested source selection");
    if (final && provenance.producer !== "AutoMovieHuman.prepare") throw new Error("Final clay is not ordinary prepared output");
    const wanted: string[] = row.curveIds ?? snapshot.inventory.curves.filter((id: string): boolean => row.names.some((name: string): boolean => HumanDebugPattern.matches(id, [(raw ? "" : "view.") + name + "/*"], "human.construction.")));
    const references: string[] = row.stage === "original-sections" ? snapshot.inventory.curves.filter((id: string): boolean => id.startsWith("human.construction.reference.")) : [];
    if (row.stage === "original-sections" && references.length === 0) throw new Error("Reference section-curve support is unavailable");
    const scopedInventory: boolean = row.stage === "inventory" && row.names.length !== 0;
    const visible: string[] = row.stage === "reference" || row.stage === "inventory" && !scopedInventory || row.stage === "raw-clay" || final ? [] : [...wanted, ...references];
    if (visible.length !== snapshot.shown.curves.length || visible.some((id: string): boolean => !snapshot.shown.curves.includes(id))) throw new Error("Shown curve IDs differ from the complete intended selection");
    if ((scopedInventory || row.stage === "framing" || row.stage === "original" || row.stage === "original-sections" || row.stage === "raw-curves" || row.stage === "raw-overlay") && wanted.length === 0) throw new Error("The requested curve selection is empty");
    if ((scopedInventory || row.stage === "framing" || row.stage === "raw-curves" || row.stage === "original-sections") && snapshot.shown.parts.length !== 0) throw new Error("Curves-only pass contains a surface");
    if ((row.stage === "original" || row.stage === "reference" || row.stage === "inventory" && !scopedInventory) && !snapshot.shown.parts.some((id: string): boolean => id.startsWith("human.skin.reference."))) throw new Error("Reference clay is unavailable in this comparison");
    if (row.stage === "raw-clay" || row.stage === "raw-overlay") {
      const parts: string[] = snapshot.inventory.parts.filter((id: string): boolean => row.names.some((name: string): boolean => HumanDebugPattern.matches(id, [name + "/*"], "human.skin.")));
      if (parts.length === 0 || parts.length !== snapshot.shown.parts.length || parts.some((id: string): boolean => !snapshot.shown.parts.includes(id))) throw new Error("Raw surfaces differ from the selected actual chains");
    }
    if (raw)
      for (const name of row.names)
        if (!snapshot.inventory.curves.some((id: string): boolean => id.startsWith("human.construction." + name + "/"))) throw new Error("Raw loft is unavailable for " + name);
    return ["PNG digest", "fixed source", "actual named direction", "degrees-to-radians", box === undefined ? "automatic visible-bounds probe" : "explicit ROI placement and frustum", "visible IDs", "producer stage", "hardware canvas", "unreviewed geometry"];
  }

  /** Validate framing against the declared measured ROI in the actual perspective camera. */
  function fits(cameraRecord: Record<string, unknown>, box: P.Frame): void {
    const position: THREE.Vector3 = new THREE.Vector3(...point(cameraRecord.position));
    const forward: THREE.Vector3 = new THREE.Vector3(...point(cameraRecord.target)).sub(position).normalize();
    const right: THREE.Vector3 = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(...point(cameraRecord.up))).normalize();
    const up: THREE.Vector3 = new THREE.Vector3().crossVectors(right, forward).normalize();
    const tangent: number = Math.tan(Number(cameraRecord.fov) * Math.PI / 360);
    for (const x of [box.min[0]!, box.max[0]!])
      for (const y of [box.min[1]!, box.max[1]!])
        for (const z of [box.min[2]!, box.max[2]!]) {
          const p: THREE.Vector3 = new THREE.Vector3(x, y, z).sub(position);
          const depth: number = p.dot(forward);
          if (!(depth >= Number(cameraRecord.near)) || !(depth <= Number(cameraRecord.far)) || Math.abs(p.dot(right)) > depth * tangent + EPSILON || Math.abs(p.dot(up)) > depth * tangent + EPSILON)
            throw new Error("Intended visible-source ROI does not fit the actual camera");
        }
  }

  /** Require actual finite metre vectors before any conversion. */
  function point(value: unknown): [number, number, number] {
    if (!Array.isArray(value) || value.length !== 3 || !value.every((item: unknown): boolean => typeof item === "number" && Number.isFinite(item))) throw new Error("Expected a finite camera/bounds triple");
    return value as [number, number, number];
  }
}
