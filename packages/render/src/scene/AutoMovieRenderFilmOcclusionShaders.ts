/**
 * The GLSL ES 3.00 programs of the film's ambient occlusion: the horizon search
 * and its depth-aware blur, both drawn as one full-frame quad over the depth
 * and view-space normal prepass at the beauty raster.
 *
 * `occlusion` is ground-truth-based ambient occlusion (Jimenez, Wu, Pesce and
 * Jarabo 2016, "Practical real-time strategies for accurate indirect
 * occlusion"). Each pixel reconstructs its view-space position from depth and
 * takes four slice directions, rotated by its cell of a 4 × 4 Bayer pattern and
 * by the golden angle times the accumulation sample index. Along each slice it
 * steps eight times per side out to `uRadius` metres projected to the screen,
 * keeps the highest horizon among samples nearer than the radius, and adds the
 * slice's closed-form cosine-weighted visibility, which
 * `sliceVisibility` states on the CPU. `blur` averages the 4 × 4 block
 * the pattern repeats over, keeping only neighbours whose view depth lies
 * within 5 % of the pixel's, so every rotation contributes once and edges stay
 * sharp. Every fragment reads only its own block of texels and the uniforms of
 * this draw, never an earlier frame.
 */
export const AutoMovieRenderFilmOcclusionShaders: {
  /** The horizon search, writing visibility in red. */
  readonly occlusion: string;

  /** The 4 × 4 depth-aware blur of the visibility. */
  readonly blur: string;
} = {
  occlusion: /* glsl */ `precision highp float;
precision highp int;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform mat4 uProjection;
uniform mat4 uInverseProjection;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uSample;
in vec2 vUv;
out vec4 outColor;
const float PI = 3.141592653589793;
vec3 viewAt( vec2 uv ) {
	float depth = texture( tDepth, uv ).r;
	vec4 p = uInverseProjection * vec4( uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0 );
	return p.xyz / p.w;
}
float bayer( ivec2 pixel ) {
	int x = pixel.x & 3;
	int y = pixel.y & 3;
	int m[16] = int[16]( 0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5 );
	return float( m[ x + 4 * y ] ) / 16.0;
}
void main() {
	float depth = texture( tDepth, vUv ).r;
	if ( depth >= 1.0 ) { outColor = vec4( 1.0 ); return; }
	vec3 p = viewAt( vUv );
	vec3 n = normalize( texture( tNormal, vUv ).xyz * 2.0 - 1.0 );
	vec3 v = uProjection[ 3 ][ 3 ] == 1.0 ? vec3( 0.0, 0.0, 1.0 ) : normalize( - p );
	float scale = uProjection[ 3 ][ 3 ] == 1.0 ? 1.0 : 1.0 / max( - p.z, 1e-6 );
	float pixels = uProjection[ 1 ][ 1 ] * uRadius * scale * 0.5 * uResolution.y;
	float turn = bayer( ivec2( gl_FragCoord.xy ) ) + uSample * 2.399963229728653 / PI;
	float visibility = 0.0;
	for ( int slice = 0; slice < 4; ++ slice ) {
		float phi = PI * ( float( slice ) + turn ) / 4.0;
		vec2 direction = vec2( cos( phi ), sin( phi ) );
		vec3 along = vec3( direction, 0.0 );
		vec3 ortho = along - dot( along, v ) * v;
		vec3 axis = normalize( cross( along, v ) );
		vec3 projected = n - axis * dot( n, axis );
		float length_ = length( projected );
		float cosN = clamp( dot( projected, v ) / max( length_, 1e-6 ), -1.0, 1.0 );
		float angleN = sign( dot( ortho, projected ) ) * acos( cosN );
		float high = cos( angleN + PI / 2.0 );
		float low = cos( angleN - PI / 2.0 );
		for ( int step_ = 0; step_ < 8; ++ step_ ) {
			vec2 offset = direction * pixels * ( float( step_ ) + 0.5 ) / 8.0 / uResolution;
			vec3 d0 = viewAt( vUv + offset ) - p;
			vec3 d1 = viewAt( vUv - offset ) - p;
			float l0 = length( d0 );
			float l1 = length( d1 );
			if ( l0 > 1e-6 && l0 < uRadius ) high = max( high, dot( d0, v ) / l0 );
			if ( l1 > 1e-6 && l1 < uRadius ) low = max( low, dot( d1, v ) / l1 );
		}
		float h0 = - acos( clamp( low, -1.0, 1.0 ) );
		float h1 = acos( clamp( high, -1.0, 1.0 ) );
		h0 = angleN + max( h0 - angleN, - PI / 2.0 );
		h1 = angleN + min( h1 - angleN, PI / 2.0 );
		float arc0 = ( cos( angleN ) + 2.0 * h0 * sin( angleN ) - cos( 2.0 * h0 - angleN ) ) / 4.0;
		float arc1 = ( cos( angleN ) + 2.0 * h1 * sin( angleN ) - cos( 2.0 * h1 - angleN ) ) / 4.0;
		visibility += length_ * ( arc0 + arc1 );
	}
	outColor = vec4( clamp( visibility / 4.0, 0.0, 1.0 ), 0.0, 0.0, 1.0 );
}
`,
  blur: /* glsl */ `precision highp float;
precision highp int;
uniform sampler2D tVisibility;
uniform sampler2D tDepth;
uniform mat4 uInverseProjection;
uniform vec2 uResolution;
in vec2 vUv;
out vec4 outColor;
float viewDepth( vec2 uv ) {
	float depth = texture( tDepth, uv ).r;
	vec4 p = uInverseProjection * vec4( uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0 );
	return - p.z / p.w;
}
void main() {
	float centre = viewDepth( vUv );
	float sum = 0.0;
	float weight = 0.0;
	for ( int y = -2; y < 2; ++ y )
		for ( int x = -2; x < 2; ++ x ) {
			vec2 uv = vUv + vec2( float( x ), float( y ) ) / uResolution;
			float w = abs( viewDepth( uv ) - centre ) <= 0.05 * abs( centre ) ? 1.0 : 0.0;
			sum += w * texture( tVisibility, uv ).r;
			weight += w;
		}
	outColor = vec4( weight > 0.0 ? sum / weight : texture( tVisibility, vUv ).r, 0.0, 0.0, 1.0 );
}
`,
};
