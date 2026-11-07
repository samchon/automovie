import type {
  AutoMoviePhysicsCache as Cache,
  AutoMoviePhysicalPlayback as Playback,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import type { BoutFootsteps } from "../../src/motion/footwork/BoutFootsteps";
import type { boutPlaybackFootsteps } from "../../src/physics/boutPlaybackFootsteps";

/** Explicit contact-ledger inputs for the film's portable audio adapter tests; these records never claim to have been computed by native physics. */
export namespace BoutFootfallFixtures {
  /** One analytic 1 kg sphere foot, a visible flight from 0.1 to 0.5 seconds, measured native contacts and a separately delayed recovery confirmation. */
  export function create(): {
    input: Parameters<typeof boutPlaybackFootsteps>[0];
    step: BoutFootsteps.Step;
    receipt: Receipt;
    recovery: Playback["recovery"][string];
    geometric: Receipt[];
  } {
    const shape: P.IShape = {
      id: "sole",
      material: "skin",
      kind: "sphere",
      radius: 0.05,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    };
    const profile: P = {
      id: "audio-unit-foot",
      mass: 1,
      centerOfMass: { x: 0, y: 0, z: 0 },
      provenance: "Synthetic audio adapter fixture",
      materials: [
        { id: "skin", friction: 0, restitution: 0, compliance: 0, damping: 0 },
      ],
      joints: [],
      segments: [
        {
          bone: "leftMidfoot",
          mass: 1,
          centerOfMass: { x: 0, y: 0, z: 0 },
          inertia: { x: 0.001, y: 0.001, z: 0.001 },
          inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
          neutral: shape.transform,
          shapes: [shape],
        },
      ],
    };
    const step: BoutFootsteps.Step = {
      side: "left",
      kind: "swing",
      start: 0.1,
      end: 0.45,
      from: { ball: [0, 0], yaw: 0, heel: 0, lift: 0 },
      to: { ball: [0.1, 0], yaw: 0, heel: 0, lift: 0 },
    };
    const receipt: Receipt = {
      id: "unit-floor",
      source: "solver",
      seconds: 0,
      endSeconds: 1,
      a: { body: "a", bone: "leftMidfoot", shape: "sole", material: "skin" },
      b: { body: "floor", bone: "floor", shape: "floor", material: "floor" },
      point: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: -1, z: 0 },
      impulse: 8,
      separation: -0.0001,
      compression: 0.0001,
      samples: [0, 0.1, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(
        (seconds: number): NonNullable<Receipt["samples"]>[number] => ({
          seconds,
          duration: 0.1,
          point: { x: 0, y: 0, z: 0 },
          normal: { x: 0, y: -1, z: 0 },
          impulse: 1,
          separation: -0.0001,
          compression: 0.0001,
        }),
      ),
    };
    /** The displayed sphere is entirely airborne during the independently specified flight. */
    function at(seconds: number): Cache.IFrame {
      const state: Cache.ISegment = {
        position: {
          x: 0,
          y: seconds > 0.1 && seconds < 0.5 ? 0.15 : 0.05,
          z: 0,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
      };
      return {
        seconds,
        bodies: {
          a: { leftMidfoot: state },
          b: { leftMidfoot: state },
          referee: { leftMidfoot: state },
        },
      };
    }
    const input: Parameters<typeof boutPlaybackFootsteps>[0] = {
      profiles: { a: profile, b: profile, referee: profile },
      contacts: [receipt],
      recovery: {},
      at,
      startSeconds: 0,
      duration: 1,
      rate: 10,
      mode: "simulated",
    };
    const recovery: Playback["recovery"][string] = {
      last: "supported",
      steps: [
        {
          bone: "leftMidfoot",
          kind: "swing",
          start: 0.1,
          end: 0.3,
          from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
          to: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
          resolved: { seconds: 0.6, status: "landed" },
        },
      ],
      offsets: {},
      landings: [
        { bone: "leftMidfoot", seconds: 0.6, position: { x: 0, y: 0, z: 0 } },
      ],
    };
    const geometric: Receipt[] = [
      {
        ...receipt,
        id: "geometric-before",
        source: "geometric",
        impulse: null,
        samples: undefined,
        endSeconds: 0.1,
      },
      {
        ...receipt,
        id: "geometric-landing",
        source: "geometric",
        impulse: null,
        samples: undefined,
        seconds: 0.5,
      },
    ];
    return { input, step, receipt, recovery, geometric };
  }
}
