import * as THREE from "three";

/** Decode one project texture asset. Host-owned: the viewer has no I/O. */
export type IAutoMovieTextureLoader = (asset: string) => Promise<THREE.Texture>;
