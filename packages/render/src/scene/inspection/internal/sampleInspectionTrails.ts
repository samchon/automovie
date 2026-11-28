import type {
  IAutoMovieInspectionTrail,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderMotionTrailSource } from "../../../draw/IAutoMovieRenderMotionTrailSource";
import { AutoMovieRenderInspectionPath } from "../../AutoMovieRenderInspectionPath";
import { MAXIMUM_INSPECTION_TRAIL_SAMPLES } from "./MAXIMUM_INSPECTION_TRAIL_SAMPLES";
import { matchInspectionPath } from "./matchInspectionPath";

const MAXIMUM_TRACKS: number = 64;
const STILL: number = 1e-6;

/*
 * Read the selected paths after each awaited placement. The seek may return
 * the actual playback occurrence. Occurrence, object and ancestor changes
 * and missing samples end the current segment. An explicit supported remount
 * can continue inside one uninterrupted occurrence.
 */
export async function sampleInspectionTrails(props: {
  scene: THREE.Scene;
  patterns: readonly string[];
  times: readonly number[];
  seek: (seconds: number) => Promise<number | null>;
  current?: () => boolean;
  interrupted?: (before: number, after: number) => boolean;
  inspect?: (
    path: string,
    object: THREE.Object3D,
    origin: THREE.Vector3,
  ) => sampleInspectionTrails.IRead;
}): Promise<IAutoMovieInspectionTrail[]> {
  if (props.patterns.length === 0) return [];
  if (
    props.times.length === 0 ||
    props.times.some((time) => !Number.isFinite(time) || time < 0)
  )
    throw new Error(
      "Trail times must be one or more finite nonnegative seconds",
    );
  if (props.times.length > MAXIMUM_INSPECTION_TRAIL_SAMPLES)
    throw new Error(
      "A trail can request at most " +
        MAXIMUM_INSPECTION_TRAIL_SAMPLES +
        " samples",
    );
  const times: number[] = [...props.times].sort((a, b) => a - b);
  const tracks: ITrack[] = selectTracks(props.scene, props.patterns);
  const at: THREE.Vector3 = new THREE.Vector3();
  let scope: number | null = null;
  let previousSecond: number | undefined;
  for (const seconds of times) {
    if (props.current?.() === false) return [];
    const nextScope: number | null = await props.seek(seconds);
    if (props.current?.() === false) return [];
    props.scene.updateMatrixWorld(true);
    const boundary: boolean =
      scope !== nextScope ||
      (previousSecond !== undefined &&
        props.interrupted?.(previousSecond, seconds) === true);
    let missing: Map<string, ITrack> | undefined;
    for (const track of tracks) {
      if (
        track.object !== undefined &&
        stillPlacedAtPath(props.scene, track.object, track.path)
      )
        continue;
      track.object = undefined;
      (missing ??= new Map()).set(track.path, track);
    }
    scope = nextScope;
    previousSecond = seconds;
    if (missing !== undefined)
      props.scene.traverse((object: THREE.Object3D): void => {
        if (missing.size === 0) return;
        const path: string = AutoMovieRenderInspectionPath.pathOf({
          root: props.scene,
          object,
        });
        const track: ITrack | undefined = missing.get(path);
        if (track === undefined) return;
        track.object = object;
        missing.delete(path);
      });
    for (const track of tracks) {
      if (track.object === undefined) {
        track.active = undefined;
        track.previous = undefined;
        track.placed = undefined;
        continue;
      }
      at.setFromMatrixPosition(track.object.matrixWorld);
      if (
        !Number.isFinite(at.x) ||
        !Number.isFinite(at.y) ||
        !Number.isFinite(at.z)
      ) {
        track.active = undefined;
        track.previous = undefined;
        track.placed = undefined;
        continue;
      }
      const reading: sampleInspectionTrails.IRead | undefined = props.inspect?.(
        track.path,
        track.object,
        at,
      );
      const remounted: boolean =
        track.placed !== track.object ||
        !sameAncestors(track.object, track.parents);
      if (
        track.active !== undefined &&
        (boundary ||
          track.active.motion?.route?.id !== reading?.route?.id ||
          track.previous?.supportFrame !== reading?.supportFrame ||
          (remounted &&
            (nextScope === null ||
              !compatibleRemount(
                track.active.positions,
                at,
                track.previous,
                reading,
              ))))
      )
        track.active = undefined;
      if (track.active === undefined) {
        track.active = {
          times: [],
          positions: [],
          ...(reading === undefined
            ? {}
            : {
                motion: {
                  ...(reading.route === undefined
                    ? {}
                    : { route: reading.route }),
                  samples: [],
                },
              }),
        };
        track.segments.push(track.active);
      }
      if (remounted) track.parents = ancestors(track.object);
      track.placed = track.object;
      track.previous = reading;
      track.active.times.push(seconds);
      track.active.positions.push(at.x, at.y, at.z);
      if (reading !== undefined)
        track.active.motion?.samples.push(reading.sample);
    }
  }
  return tracks.flatMap(({ path, segments }) =>
    segments.map(({ times, positions, motion }): IAutoMovieInspectionTrail => {
      const source = motion === undefined ? {} : { motion };
      for (let k: number = 3; k < positions.length; k += 3)
        if (
          Math.hypot(
            positions[k]! - positions[0]!,
            positions[k + 1]! - positions[1]!,
            positions[k + 2]! - positions[2]!,
          ) > STILL
        )
          return { path, times, positions, stationary: false, ...source };
      return { path, times, positions, stationary: true, ...source };
    }),
  );
}

/* Both sampled nodes must occupy the same supported anchor at this handoff. */
function compatibleRemount(
  positions: readonly number[],
  origin: THREE.Vector3,
  previous: sampleInspectionTrails.IRead | undefined,
  current: sampleInspectionTrails.IRead | undefined,
): boolean {
  const k: number = positions.length - 3;
  const before = previous?.sample.support;
  const after = current?.sample.support;
  return (
    previous?.compatibleRemount !== undefined &&
    previous.compatibleRemount === current?.compatibleRemount &&
    previous.route === current.route &&
    previous.supportFrame !== undefined &&
    previous.supportFrame === current.supportFrame &&
    before?.status === "observed" &&
    after?.status === "observed" &&
    before.path === after.path &&
    before.gap === 0 &&
    after.gap === 0 &&
    before.slip === 0 &&
    after.slip === 0 &&
    samePoint(previous.supportAnchor, current.supportAnchor) &&
    samePoint(before.local, after.local) &&
    positions[k] === origin.x &&
    positions[k + 1] === origin.y &&
    positions[k + 2] === origin.z
  );
}

function samePoint(
  left: IAutoMovieVector3 | undefined,
  right: IAutoMovieVector3 | undefined,
): boolean {
  return (
    left !== undefined &&
    right !== undefined &&
    left.x === right.x &&
    left.y === right.y &&
    left.z === right.z
  );
}

/* Resolve the shallowest match of each pattern and share overlapping paths. */
function selectTracks(
  scene: THREE.Scene,
  patterns: readonly string[],
): ITrack[] {
  const first: Map<string, THREE.Object3D> = new Map();
  scene.traverse((object: THREE.Object3D): void => {
    const path: string = AutoMovieRenderInspectionPath.pathOf({
      root: scene,
      object,
    });
    if (!first.has(path)) first.set(path, object);
  });
  const selected: Map<string, ITrack> = new Map();
  for (const pattern of patterns) {
    let matches: boolean = false;
    for (const [path, object] of first) {
      if (!matchInspectionPath(path, pattern)) continue;
      matches = true;
      const names: string[] = path === "" ? [] : path.split("/");
      if (
        names.some((_name, depth) =>
          matchInspectionPath(names.slice(0, depth).join("/"), pattern),
        )
      )
        continue;
      if (!selected.has(path))
        selected.set(path, {
          path,
          object,
          active: undefined,
          parents: [],
          placed: undefined,
          previous: undefined,
          segments: [],
        });
      if (selected.size > MAXIMUM_TRACKS)
        throw new Error(
          "A trail can select at most " + MAXIMUM_TRACKS + " scene paths",
        );
    }
    if (!matches)
      throw new Error('Trail pattern "' + pattern + '" matches no object');
  }
  return [...selected.values()];
}

interface ITrack {
  path: string;
  object: THREE.Object3D | undefined;
  active: ISegment | undefined;
  parents: readonly THREE.Object3D[];
  placed: THREE.Object3D | undefined;
  previous: sampleInspectionTrails.IRead | undefined;
  segments: ISegment[];
}

interface ISegment {
  times: number[];
  positions: number[];
  motion?: {
    route?: IAutoMovieInspectionTrail.IAuthoredRoute;
    samples: IAutoMovieInspectionTrail.ISample[];
  };
}

export namespace sampleInspectionTrails {
  /* The result owns numeric evidence and borrows the current support identity. */
  export interface IRead {
    route: IAutoMovieInspectionTrail.IAuthoredRoute | undefined;
    supportFrame: THREE.Object3D | undefined;
    supportAnchor?: IAutoMovieVector3;
    compatibleRemount?: IAutoMovieRenderMotionTrailSource.ICompatibleRemount;
    sample: IAutoMovieInspectionTrail.ISample;
  }
}

function stillPlacedAtPath(
  scene: THREE.Scene,
  object: THREE.Object3D,
  path: string,
): boolean {
  for (
    let next: THREE.Object3D | null = object;
    next !== null;
    next = next.parent
  )
    if (next === scene)
      return (
        AutoMovieRenderInspectionPath.pathOf({ root: scene, object }) === path
      );
  return false;
}

function ancestors(object: THREE.Object3D): THREE.Object3D[] {
  const parents: THREE.Object3D[] = [];
  for (
    let parent: THREE.Object3D | null = object.parent;
    parent !== null;
    parent = parent.parent
  )
    parents.push(parent);
  return parents;
}

function sameAncestors(
  object: THREE.Object3D,
  parents: readonly THREE.Object3D[],
): boolean {
  let parent: THREE.Object3D | null = object.parent;
  for (const expected of parents) {
    if (parent !== expected) return false;
    parent = parent.parent;
  }
  return parent === null;
}
