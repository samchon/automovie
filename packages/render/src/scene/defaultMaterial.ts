import * as THREE from "three";

/**
 * Neutral linear-gray rough dielectric used for a part without a material.
 * Caller owns this new material; no decoded texture or shader table is
 * acquired.
 */
export const defaultMaterial: () => THREE.MeshStandardMaterial =
  (): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.8, 0.8, 0.8),
      metalness: 0,
      roughness: 0.9,
    });
