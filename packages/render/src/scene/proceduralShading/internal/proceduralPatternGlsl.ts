import type { IAutoMovieProceduralSurface } from "@automovie/interface";

/*
 * The GLSL function `float proceduralPatternImplementation( vec3 p )` of one
 * procedural kind, reading the uniforms `applyProceduralSurface` binds: the
 * seed `uProceduralSeed`, the feature size `uProceduralScale` and the axis
 * frame `uProceduralAlong`, `uProceduralAcross` and `uProceduralNormal`.
 *
 * Each body is the engine's `proceduralPatternImplementation` for that kind written
 * in GLSL over `AutoMovieRenderProceduralNoiseGlsl`, with the same constants and
 * the same operation order, so the value differs from the CPU reference only by
 * 32-bit float rounding. Only the material's own kind is compiled.
 */
export function proceduralPatternGlsl(
  kind: IAutoMovieProceduralSurface["kind"],
): string {
  return [
    "uniform uint uProceduralSeed;",
    "uniform float uProceduralScale;",
    "uniform vec3 uProceduralAlong;",
    "uniform vec3 uProceduralAcross;",
    "uniform vec3 uProceduralNormal;",
    "float autoMovieProceduralPattern( vec3 p ) {",
    "\tfloat s = uProceduralScale;",
    BODIES[kind],
    "}",
  ].join("\n");
}

/*
 * The function body of each kind.
 */
const BODIES: Record<IAutoMovieProceduralSurface["kind"], string> = {
  plaster:
    "\treturn clamp( 0.5 + 0.5 * autoMovieProceduralFractal( uProceduralSeed, p / s ), 0.0, 1.0 );",
  clay: "\treturn clamp( 0.5 + 0.5 * autoMovieProceduralFractal( uProceduralSeed, p / s ), 0.0, 1.0 );",
  stone: [
    "\tvec2 f = autoMovieProceduralCells( uProceduralSeed, p / s );",
    "\tfloat n = 0.5 + 0.5 * autoMovieProceduralFractal( uProceduralSeed, p / s );",
    "\treturn clamp( 0.75 * clamp( f.y - f.x, 0.0, 1.0 ) + 0.25 * n, 0.0, 1.0 );",
  ].join("\n"),
  wood: [
    "\tfloat radius = length( vec2( dot( uProceduralAcross, p ), dot( uProceduralNormal, p ) ) )",
    "\t\t+ 0.3 * s * autoMovieProceduralFractal( uProceduralSeed, p / ( 4.0 * s ) );",
    "\treturn clamp( 0.5 - 0.5 * cos( 6.283185307179586 * radius / s ), 0.0, 1.0 );",
  ].join("\n"),
  fabric: [
    "\tfloat a = dot( uProceduralAlong, p ) / s;",
    "\tfloat b = dot( uProceduralAcross, p ) / s;",
    "\tfloat fi = floor( b );",
    "\tfloat fj = floor( a );",
    "\tint i = int( fi );",
    "\tint j = int( fj );",
    "\tfloat warpSign = ( i & 1 ) == 0 ? 1.0 : -1.0;",
    "\tfloat weftSign = ( j & 1 ) == 0 ? 1.0 : -1.0;",
    "\tfloat warpProfile = sin( 3.141592653589793 * ( b - fi ) );",
    "\tfloat weftProfile = sin( 3.141592653589793 * ( a - fj ) );",
    "\tfloat warp = warpProfile * warpProfile * ( 0.5 + 0.5 * warpSign * sin( 3.141592653589793 * a ) )",
    "\t\t* ( 0.8 + 0.2 * float( autoMovieProceduralCell( autoMovieProceduralKey( uProceduralSeed, 32u ), ivec3( i, 0, 0 ) ).x ) * ( 1.0 / 4294967296.0 ) );",
    "\tfloat weft = weftProfile * weftProfile * ( 0.5 - 0.5 * weftSign * sin( 3.141592653589793 * b ) )",
    "\t\t* ( 0.8 + 0.2 * float( autoMovieProceduralCell( autoMovieProceduralKey( uProceduralSeed, 33u ), ivec3( j, 0, 0 ) ).x ) * ( 1.0 / 4294967296.0 ) );",
    "\treturn clamp( max( warp, weft ), 0.0, 1.0 );",
  ].join("\n"),
  brushedMetal: [
    "\tvec3 q = vec3( dot( uProceduralAlong, p ), 100.0 * dot( uProceduralAcross, p ), 100.0 * dot( uProceduralNormal, p ) ) / s;",
    "\treturn clamp( 0.5 + 0.5 * autoMovieProceduralFractal( uProceduralSeed, q ), 0.0, 1.0 );",
  ].join("\n"),
};
