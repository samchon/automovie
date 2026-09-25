/**
 * Deterministic metre-valued mesh assembly for the temple's bounded objects.
 * Each named part collects its own triangles so later materials can bind to
 * stable surface identities. The builder owns no placement or finish choice.
 */
import type { IAutoMovieMesh, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

type Point = IAutoMovieVector3;
type Buffer = { positions: number[]; indices: number[]; uvs: number[] };
const point = (x: number, y: number, z: number): Point => ({ x, y, z });

export class ObjectMesh {
  private readonly parts = new Map<string, Buffer>();

  private buffer(name: string): Buffer {
    let result = this.parts.get(name);
    if (result === undefined) {
      result = { positions: [], indices: [], uvs: [] };
      this.parts.set(name, result);
    }
    return result;
  }

  private polygon(name: string, vertices: readonly Point[], coordinates?: readonly (readonly [number, number])[]): void {
    const buffer = this.buffer(name);
    const first = buffer.positions.length / 3;
    for (const vertex of vertices) buffer.positions.push(vertex.x, vertex.y, vertex.z);
    const a = vertices[0]!, b = vertices[1]!, c = vertices[2]!;
    const nx = (b.y-a.y)*(c.z-a.z)-(b.z-a.z)*(c.y-a.y);
    const ny = (b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z);
    const nz = (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    const projected = (v: Point): readonly [number, number] => {
      if (Math.abs(ny) >= Math.abs(nx) && Math.abs(ny) >= Math.abs(nz))
        return ny >= 0 ? [v.x, -v.z] : [v.x, v.z];
      if (Math.abs(nx) >= Math.abs(nz)) return nx >= 0 ? [-v.z, v.y] : [v.z, v.y];
      return nz >= 0 ? [v.x, v.y] : [-v.x, v.y];
    };
    for (let i = 0; i < vertices.length; ++i) {
      const [u, v] = coordinates?.[i] ?? projected(vertices[i]!);
      buffer.uvs.push(u, v);
    }
    for (let i = 1; i < vertices.length - 1; ++i) buffer.indices.push(first, first + i, first + i + 1);
  }

  /** Box and revolved profiles are authored inside first; emit their outside face. */
  private outwardPolygon(name: string, vertices: readonly Point[], coordinates?: readonly (readonly [number, number])[]): void {
    this.polygon(name, [...vertices].reverse(), coordinates === undefined ? undefined : [...coordinates].reverse());
  }

  box(name: string, x: number, y: number, z: number, width: number, height: number, depth: number): this {
    if (!(width > 0 && height > 0 && depth > 0)) throw new Error(`${name}: 상자 치수는 양수여야 합니다.`);
    const a = x - width / 2, b = x + width / 2;
    const c = y, d = y + height, e = z - depth / 2, f = z + depth / 2;
    const v = point;
    this.outwardPolygon(name, [v(a,c,e),v(a,c,f),v(b,c,f),v(b,c,e)]);
    this.outwardPolygon(name, [v(a,d,e),v(b,d,e),v(b,d,f),v(a,d,f)]);
    this.outwardPolygon(name, [v(a,c,f),v(a,d,f),v(b,d,f),v(b,c,f)]);
    this.outwardPolygon(name, [v(b,c,e),v(b,d,e),v(a,d,e),v(a,c,e)]);
    this.outwardPolygon(name, [v(a,c,e),v(a,d,e),v(a,d,f),v(a,c,f)]);
    this.outwardPolygon(name, [v(b,c,f),v(b,d,f),v(b,d,e),v(b,c,e)]);
    return this;
  }

  frustum(name: string, x: number, z: number, bottom: number, top: number, lowerRadius: number, upperRadius: number, segments = 16): this {
    if (!(top > bottom && lowerRadius > 0 && upperRadius > 0 && segments >= 3)) throw new Error(`${name}: 원뿔대 입력 오류`);
    const low: Point[] = [], high: Point[] = [];
    for (let i = 0; i < segments; ++i) {
      const angle = 2 * Math.PI * i / segments;
      low.push(point(x + lowerRadius * Math.cos(angle), bottom, z - lowerRadius * Math.sin(angle)));
      high.push(point(x + upperRadius * Math.cos(angle), top, z - upperRadius * Math.sin(angle)));
    }
    this.polygon(name, [...low].reverse());
    this.polygon(name, high);
    for (let i = 0; i < segments; ++i) {
      const next = (i + 1) % segments;
      const angle0 = 2*Math.PI*i/segments, angle1 = 2*Math.PI*(i+1)/segments;
      const rise = Math.hypot(top-bottom, upperRadius-lowerRadius);
      this.polygon(name, [low[i]!, low[next]!, high[next]!, high[i]!],
        [[lowerRadius*angle0,0],[lowerRadius*angle1,0],
          [upperRadius*angle1,rise],[upperRadius*angle0,rise]]);
    }
    return this;
  }

  /** Open vessel: outside profile rises, inside profile returns to a closed floor. */
  vessel(name: string, x: number, z: number, outside: readonly (readonly [number, number])[], inside: readonly (readonly [number, number])[], segments = 16): this {
    const profile = [...outside, ...inside];
    if (profile.length < 4) throw new Error(`${name}: 용기 단면 부족`);
    const ring = (height: number, radius: number): Point[] => Array.from({ length: segments }, (_, i) => {
      const angle = 2 * Math.PI * i / segments;
      return point(x + radius * Math.cos(angle), height, z - radius * Math.sin(angle));
    });
    const rings = profile.map(([height, radius]) => ring(height, radius));
    const lengthFromBottom = (profilePoints: readonly (readonly [number, number])[]): number[] => {
      const lengths = [0];
      for (let i=1;i<profilePoints.length;++i)
        lengths.push(lengths[i-1]! + Math.hypot(profilePoints[i]![0]-profilePoints[i-1]![0],
          profilePoints[i]![1]-profilePoints[i-1]![1]));
      return lengths;
    };
    const outerLength = lengthFromBottom(outside);
    const innerReverse = lengthFromBottom([...inside].reverse()).reverse();
    const arcLength = [...outerLength, ...innerReverse];
    for (let j = 0; j < rings.length - 1; ++j) {
      const a = rings[j]!, b = rings[j + 1]!;
      for (let i = 0; i < segments; ++i) {
        const next = (i + 1) % segments;
        const angle0 = 2*Math.PI*i/segments, angle1 = 2*Math.PI*(i+1)/segments;
        this.polygon(name, [a[i]!, a[next]!, b[next]!, b[i]!],
          [[profile[j]![1]*angle0,arcLength[j]!],[profile[j]![1]*angle1,arcLength[j]!],
            [profile[j+1]![1]*angle1,arcLength[j+1]!],[profile[j+1]![1]*angle0,arcLength[j+1]!]]);
      }
    }
    this.polygon(name, [...rings[0]!].reverse());
    this.polygon(name, rings[rings.length - 1]!);
    return this;
  }

  rod(name: string, from: Point, to: Point, radius: number, segments = 8, uStart = 0): this {
    const dx = to.x-from.x, dy = to.y-from.y, dz = to.z-from.z;
    const length = Math.hypot(dx,dy,dz);
    if (!(length > 0 && radius > 0)) throw new Error(`${name}: 막대 입력 오류`);
    const axis = point(dx/length,dy/length,dz/length);
    const seed = Math.abs(axis.y) < 0.9 ? point(0,1,0) : point(1,0,0);
    const ux = axis.y*seed.z-axis.z*seed.y, uy = axis.z*seed.x-axis.x*seed.z, uz = axis.x*seed.y-axis.y*seed.x;
    const uLength = Math.hypot(ux,uy,uz);
    const u = point(ux/uLength,uy/uLength,uz/uLength);
    const v = point(axis.y*u.z-axis.z*u.y,axis.z*u.x-axis.x*u.z,axis.x*u.y-axis.y*u.x);
    const ring = (center: Point): Point[] => Array.from({ length: segments }, (_, i) => {
      const angle = 2*Math.PI*i/segments;
      return point(center.x+radius*(u.x*Math.cos(angle)+v.x*Math.sin(angle)),
        center.y+radius*(u.y*Math.cos(angle)+v.y*Math.sin(angle)),
        center.z+radius*(u.z*Math.cos(angle)+v.z*Math.sin(angle)));
    });
    const a = ring(from), b = ring(to);
    this.polygon(name, [...a].reverse()); this.polygon(name,b);
    for (let i=0;i<segments;++i) {
      const next=(i+1)%segments;
      const v0 = 2*Math.PI*radius*i/segments, v1 = 2*Math.PI*radius*(i+1)/segments;
      this.polygon(name,[a[i]!,a[next]!,b[next]!,b[i]!],
        [[uStart,v0],[uStart,v1],[uStart+length,v1],[uStart+length,v0]]);
    }
    return this;
  }

  loop(name: string, x: number, y: number, z: number, radius: number, thickness: number, plane: "xz" | "xy" | "yz" = "xz", segments = 16): this {
    const path = Array.from({ length: segments+1 }, (_, i) => {
      const angle = 2*Math.PI*i/segments;
      return plane === "xz" ? point(x+radius*Math.cos(angle),y,z+radius*Math.sin(angle))
        : plane === "xy" ? point(x+radius*Math.cos(angle),y+radius*Math.sin(angle),z)
        : point(x,y+radius*Math.cos(angle),z+radius*Math.sin(angle));
    });
    let distance = 0;
    for (let i=0;i<segments;++i) {
      this.rod(name,path[i]!,path[i+1]!,thickness,6,distance);
      distance += Math.hypot(path[i+1]!.x-path[i]!.x,path[i+1]!.y-path[i]!.y,
        path[i+1]!.z-path[i]!.z);
    }
    return this;
  }

  model(id: string, name: string): IAutoMovieModel {
    if (this.parts.size === 0) throw new Error(`${id}: 부재가 없습니다.`);
    return {
      id, name, origin: "generated", skeleton: null, body: null, asset: null, materials: [],
      parts: [...this.parts].map(([part, buffer]) => {
        const mesh: IAutoMovieMesh = { positions: buffer.positions, indices: buffer.indices, normals: null, uvs: buffer.uvs, skin: null };
        return { id: part, name: null, material: null, attachedBone: null, transform: null,
          geometry: { type: "mesh" as const, mesh } };
      }),
    };
  }
}
