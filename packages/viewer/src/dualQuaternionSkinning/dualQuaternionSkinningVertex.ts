/**
 * Replace a vertex shader's linear blend skinning with dual quaternion
 * skinning, the formula `skinAutoMovieMesh` evaluates in the engine.
 *
 * Three's bone matrix for joint `j` is `G P_j R_j^-1`, with `G` the model's
 * world placement at draw time, and its attached bind gives
 * `bindMatrixInverse = (G T)^-1` for the part transform `T`. The shader
 * therefore blends `K_j = bindMatrixInverse * boneMatrix_j * bindMatrix =
 * T^-1 P_j R_j^-1 T`, which cancels `G` and stays rigid for a rigid or
 * uniformly scaled `T`. Each `K_j` becomes a unit dual quaternion through
 * Shepperd's matrix-to-quaternion method; the four are aligned to the hemisphere
 * of the largest weight (the lowest slot on a tie), summed by weight, divided by
 * the length of the rotation part and applied to the morphed position. Normals
 * and tangents turn by the blended rotation alone. The result is already in the
 * part's frame, so no `bindMatrixInverse` follows.
 *
 * The blend is computed once after `skinbase_vertex` and read by the normal and
 * position chunks, so depth and distance shaders, which skip the normal chunk,
 * still skin their positions. A shader missing the skinning parameter, base or
 * position chunk is refused rather than left on linear skinning.
 *
 * @evidence contracts/common.md#principled-implementation Dual quaternion skinning (Kavan et al. 2008) over joint transforms conjugated by Three's attached bind matrices, which cancels the world placement exactly; rigidity premises a uniform part scale, which model admission enforces, and Shepperd's branches keep the matrix-to-quaternion division away from zero.
 * @evidence contracts/common.md#clear-and-simple-design Source transformation only: three chunk replacements plus helper functions beside Three's skinning parameters, while registration and program keys stay with the patch owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing required chunks throw instead of silently drawing linear skinning; the skinning normal chunk is optional only because depth shaders legitimately omit it.
 * @evidence contracts/common.md#meaningful-documentation States the matrix identity that cancels the placement, the blend, the pivot rule, the frame of the result, the shared blend across chunks and the refusal.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of string replacements over S shader bytes; on the GPU each skinned vertex does eight 4x4 products and four matrix-to-quaternion conversions, constant per vertex.
 * @evidence contracts/performance.md#reuse-equivalent-work The blended dual quaternion is computed once per vertex and shared by the normal, tangent and position chunks; identical source text lets the material's stable key reuse one program.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only strings are created and returned; no uniform, texture or program is acquired.
 */
export const dualQuaternionSkinningVertex: (vertexShader: string) => string = (
  vertexShader: string,
): string => {
  for (const marker of REQUIRED)
    if (!vertexShader.includes(marker))
      throw new Error(
        `Dual quaternion skinning needs the ${marker} chunk in the vertex shader.`,
      );
  return vertexShader
    .replace(
      "#include <skinning_pars_vertex>",
      `#include <skinning_pars_vertex>\n${PARS}`,
    )
    .replace("#include <skinbase_vertex>", `#include <skinbase_vertex>\n${BASE}`)
    .replace("#include <skinnormal_vertex>", NORMAL)
    .replace("#include <skinning_vertex>", POSITION);
};

const REQUIRED: readonly string[] = [
  "#include <skinning_pars_vertex>",
  "#include <skinbase_vertex>",
  "#include <skinning_vertex>",
];

const PARS: string = /* glsl */ `
#ifdef USE_SKINNING

	vec4 automovieRotationQuaternion( const in mat3 m ) {
		float trace = m[ 0 ][ 0 ] + m[ 1 ][ 1 ] + m[ 2 ][ 2 ];
		if ( trace > 0.0 ) {
			float s = 0.5 / sqrt( trace + 1.0 );
			return vec4( ( m[ 1 ][ 2 ] - m[ 2 ][ 1 ] ) * s, ( m[ 2 ][ 0 ] - m[ 0 ][ 2 ] ) * s, ( m[ 0 ][ 1 ] - m[ 1 ][ 0 ] ) * s, 0.25 / s );
		}
		if ( m[ 0 ][ 0 ] > m[ 1 ][ 1 ] && m[ 0 ][ 0 ] > m[ 2 ][ 2 ] ) {
			float s = 2.0 * sqrt( 1.0 + m[ 0 ][ 0 ] - m[ 1 ][ 1 ] - m[ 2 ][ 2 ] );
			return vec4( 0.25 * s, ( m[ 1 ][ 0 ] + m[ 0 ][ 1 ] ) / s, ( m[ 2 ][ 0 ] + m[ 0 ][ 2 ] ) / s, ( m[ 1 ][ 2 ] - m[ 2 ][ 1 ] ) / s );
		}
		if ( m[ 1 ][ 1 ] > m[ 2 ][ 2 ] ) {
			float s = 2.0 * sqrt( 1.0 + m[ 1 ][ 1 ] - m[ 0 ][ 0 ] - m[ 2 ][ 2 ] );
			return vec4( ( m[ 1 ][ 0 ] + m[ 0 ][ 1 ] ) / s, 0.25 * s, ( m[ 2 ][ 1 ] + m[ 1 ][ 2 ] ) / s, ( m[ 2 ][ 0 ] - m[ 0 ][ 2 ] ) / s );
		}
		float s = 2.0 * sqrt( 1.0 + m[ 2 ][ 2 ] - m[ 0 ][ 0 ] - m[ 1 ][ 1 ] );
		return vec4( ( m[ 2 ][ 0 ] + m[ 0 ][ 2 ] ) / s, ( m[ 2 ][ 1 ] + m[ 1 ][ 2 ] ) / s, 0.25 * s, ( m[ 0 ][ 1 ] - m[ 1 ][ 0 ] ) / s );
	}

	vec4 automovieQuaternionProduct( const in vec4 a, const in vec4 b ) {
		return vec4( a.w * b.xyz + b.w * a.xyz + cross( a.xyz, b.xyz ), a.w * b.w - dot( a.xyz, b.xyz ) );
	}

	void automovieJointDualQuaternion( const in mat4 bone, out vec4 rotation, out vec4 dual ) {
		mat4 joint = bindMatrixInverse * bone * bindMatrix;
		rotation = automovieRotationQuaternion( mat3( joint ) );
		dual = 0.5 * automovieQuaternionProduct( vec4( joint[ 3 ].xyz, 0.0 ), rotation );
	}

	void automovieBlendDualQuaternion( const in mat4 bx, const in mat4 by, const in mat4 bz, const in mat4 bw, const in vec4 weights, out vec4 blendRotation, out vec4 blendDual ) {
		vec4 rx; vec4 dx; automovieJointDualQuaternion( bx, rx, dx );
		vec4 ry; vec4 dy; automovieJointDualQuaternion( by, ry, dy );
		vec4 rz; vec4 dz; automovieJointDualQuaternion( bz, rz, dz );
		vec4 rw; vec4 dw; automovieJointDualQuaternion( bw, rw, dw );
		vec4 pivot = rx;
		float best = weights.x;
		if ( weights.y > best ) { best = weights.y; pivot = ry; }
		if ( weights.z > best ) { best = weights.z; pivot = rz; }
		if ( weights.w > best ) { best = weights.w; pivot = rw; }
		float wx = dot( rx, pivot ) < 0.0 ? - weights.x : weights.x;
		float wy = dot( ry, pivot ) < 0.0 ? - weights.y : weights.y;
		float wz = dot( rz, pivot ) < 0.0 ? - weights.z : weights.z;
		float ww = dot( rw, pivot ) < 0.0 ? - weights.w : weights.w;
		blendRotation = wx * rx + wy * ry + wz * rz + ww * rw;
		blendDual = wx * dx + wy * dy + wz * dz + ww * dw;
		float norm = length( blendRotation );
		blendRotation /= norm;
		blendDual /= norm;
	}

	vec3 automovieRotate( const in vec4 q, const in vec3 v ) {
		return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
	}

#endif
`;

const BASE: string = /* glsl */ `
#ifdef USE_SKINNING

	vec4 automovieSkinRotation;
	vec4 automovieSkinDual;
	automovieBlendDualQuaternion( boneMatX, boneMatY, boneMatZ, boneMatW, skinWeight, automovieSkinRotation, automovieSkinDual );

#endif
`;

const NORMAL: string = /* glsl */ `
#ifdef USE_SKINNING

	objectNormal = automovieRotate( automovieSkinRotation, objectNormal );

	#ifdef USE_TANGENT

		objectTangent = automovieRotate( automovieSkinRotation, objectTangent );

	#endif

#endif
`;

const POSITION: string = /* glsl */ `
#ifdef USE_SKINNING

	transformed = automovieRotate( automovieSkinRotation, transformed ) + 2.0 * ( automovieSkinRotation.w * automovieSkinDual.xyz - automovieSkinDual.w * automovieSkinRotation.xyz + cross( automovieSkinRotation.xyz, automovieSkinDual.xyz ) );

#endif
`;
