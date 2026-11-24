/**
 * GLSL ES 3.00 forms of the engine's procedural lattice functions, for any
 * material shader patch that reads them: `autoMoviePcg3d`, the lattice words
 * `autoMovieProceduralCell` under a key from `autoMovieProceduralKey`, the
 * improved gradient noise `autoMovieProceduralNoise`, its four-octave sum
 * `autoMovieProceduralFractal` and the cellular distances
 * `autoMovieProceduralCells`.
 *
 * Each function mirrors the engine function of the same name step for step:
 * integer hashing is exact modulo 2³² in `uint`, `uint(int)` keeps a negative
 * lattice coordinate's bit pattern as JavaScript's `>>> 0` does, and only the
 * float arithmetic rounds to 32 bits. An include guard lets several patches on
 * one material (the procedural surface and #4083's wear) splice it once.
 */
export const AUTOMOVIE_PROCEDURAL_NOISE_GLSL: string = /* glsl */ `
#ifndef AUTOMOVIE_PROCEDURAL_NOISE
#define AUTOMOVIE_PROCEDURAL_NOISE
uvec3 autoMoviePcg3d( uvec3 v ) {
	v = v * 1664525u + 1013904223u;
	v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
	v ^= v >> 16u;
	v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
	return v;
}
uvec3 autoMovieProceduralKey( uint seed, uint salt ) {
	return autoMoviePcg3d( uvec3( seed, salt, 0x9E3779B9u ) );
}
uvec3 autoMovieProceduralCell( uvec3 key, ivec3 cell ) {
	return autoMoviePcg3d( uvec3( cell ) ^ key );
}
float autoMovieProceduralGrad( uvec3 key, ivec3 cell, vec3 offset ) {
	uint h = autoMovieProceduralCell( key, cell ).x & 15u;
	float a = h < 8u ? offset.x : offset.y;
	float b = h < 4u ? offset.y : ( h == 12u || h == 14u ? offset.x : offset.z );
	return ( ( h & 1u ) == 0u ? a : -a ) + ( ( h & 2u ) == 0u ? b : -b );
}
float autoMovieProceduralNoise( uint seed, uint salt, vec3 q ) {
	uvec3 key = autoMovieProceduralKey( seed, salt );
	vec3 base = floor( q );
	ivec3 c = ivec3( base );
	vec3 f = q - base;
	vec3 s = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 );
	float x00 = mix( autoMovieProceduralGrad( key, c, f ), autoMovieProceduralGrad( key, c + ivec3( 1, 0, 0 ), f - vec3( 1.0, 0.0, 0.0 ) ), s.x );
	float x10 = mix( autoMovieProceduralGrad( key, c + ivec3( 0, 1, 0 ), f - vec3( 0.0, 1.0, 0.0 ) ), autoMovieProceduralGrad( key, c + ivec3( 1, 1, 0 ), f - vec3( 1.0, 1.0, 0.0 ) ), s.x );
	float x01 = mix( autoMovieProceduralGrad( key, c + ivec3( 0, 0, 1 ), f - vec3( 0.0, 0.0, 1.0 ) ), autoMovieProceduralGrad( key, c + ivec3( 1, 0, 1 ), f - vec3( 1.0, 0.0, 1.0 ) ), s.x );
	float x11 = mix( autoMovieProceduralGrad( key, c + ivec3( 0, 1, 1 ), f - vec3( 0.0, 1.0, 1.0 ) ), autoMovieProceduralGrad( key, c + ivec3( 1, 1, 1 ), f - vec3( 1.0, 1.0, 1.0 ) ), s.x );
	return clamp( mix( mix( x00, x10, s.y ), mix( x01, x11, s.y ), s.z ), -1.0, 1.0 );
}
float autoMovieProceduralFractal( uint seed, vec3 q ) {
	float sum = 0.0;
	float frequency = 1.0;
	float amplitude = 1.0;
	for ( int octave = 0; octave < 4; ++ octave ) {
		sum += amplitude * autoMovieProceduralNoise( seed, uint( 1 + octave ), q * frequency );
		frequency *= 2.0;
		amplitude *= 0.5;
	}
	return sum / 1.875;
}
vec2 autoMovieProceduralCells( uint seed, vec3 q ) {
	uvec3 key = autoMovieProceduralKey( seed, 16u );
	vec3 base = floor( q );
	ivec3 c = ivec3( base );
	float f1 = 1e30;
	float f2 = 1e30;
	for ( int i = -1; i <= 1; ++ i )
		for ( int j = -1; j <= 1; ++ j )
			for ( int k = -1; k <= 1; ++ k ) {
				ivec3 cell = c + ivec3( i, j, k );
				vec3 feature = vec3( cell ) + vec3( autoMovieProceduralCell( key, cell ) ) * ( 1.0 / 4294967296.0 );
				float d = length( feature - q );
				if ( d < f1 ) { f2 = f1; f1 = d; }
				else if ( d < f2 ) f2 = d;
			}
	return vec2( f1, f2 );
}
#endif
`;
