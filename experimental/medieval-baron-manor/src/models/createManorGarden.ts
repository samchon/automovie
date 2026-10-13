import type { createManorCraft } from "./manor-craft";

type CraftWriter = Parameters<typeof createManorCraft>[0];

interface GardenWriter extends CraftWriter { bevel: ReturnType<typeof createManorCraft>["bevel"]; }

interface GardenGroup { id: string; material: string; faces: number[][][]; grainAxis?: number[]; }

// Bounded deterministic botanical/masonry craft. No raster proxies or randomness.
/** Writes the manor's fixed garden masonry and botanical geometry through the supplied craft callbacks, preserving source part identities and deterministic dimensions. */
export function createManorGarden({box,mesh,beam,finish,polyhedron,revolve,extrude,V,Q,bevel,registerMechanism}: GardenWriter): void {
 const pond: number[]=[-1.70,2.35],tree: number[]=[1.65,3.65],groups: GardenGroup[] = [];
 // Independent stones, stems and leaves keep addressable source identities.
 const add: (id: string, material: string, faces: number[][][], grainAxis?: number[]) => number=(id: string,material: string,faces: number[][][],grainAxis?: number[]): number =>groups.push({id,material,faces,grainAxis});
 const flush: (id: string, level: number, role: string) => void=(id: string,level: number,role: string): void =>{for(const g of groups)mesh(g.id,polyhedron(g.faces.map((f: number[][]): import("@automovie/interface").IAutoMovieVector3[] =>f.map(V))),[0,0,0],g.material,undefined,{grainAxis:g.grainAxis});groups.length=0;finish(id,level,role);};
 const noise: (k: number) => number=(k: number): number =>(Math.sin(k*127.1+73.7)*43758.5453)%1;
 const stone: (id: string, p: number[], s: number[], seed?: number, mat?: string) => void=(id: string,p: number[],s: number[],seed: number=1,mat: string='stone'): void =>{
  const rings: number[][]=[[-.45,.78],[0,1],[.43,.78]],rr: number[][][]=rings.map(([h,r]: number[],level: number): number[][] =>Array.from({length:9},(_: unknown,i: number): number[] =>{const a: number=i*Math.PI*2/9+seed*.71,v: number=1+noise(seed+i*13)*.18;return[p[0]+Math.cos(a)*s[0]*r*v/2,p[1]+(h+noise(seed+i*5+level*31)*.06)*s[1],p[2]+Math.sin(a)*s[2]*r*v/2];})),f: number[][][]=[];
  for(let i: number=1;i<8;i++){f.push([rr[0][0],rr[0][i],rr[0][i+1]],[rr[2][0],rr[2][i+1],rr[2][i]]);}
  for(let k: number=0;k<2;k++)for(let i: number=0;i<9;i++){const j: number=(i+1)%9;f.push([rr[k][i],rr[k+1][i],rr[k+1][j]],[rr[k][i],rr[k+1][j],rr[k][j]]);}add(id,mat,f);
 };
 const twig: (id: string, a: number[], b: number[], r0: number, r1: number, mat?: string) => void=(id: string,a: number[],b: number[],r0: number,r1: number,mat: string='bark'): void =>{
  const d: number[]=b.map((v: number,i: number): number =>v-a[i]),l: number=Math.hypot(...d),n: number[]=d.map((v: number): number =>v/l),u: number[]=Math.abs(n[1])<.9?[n[2],0,-n[0]]:[0,n[2],-n[1]],ul: number=Math.hypot(...u);for(let i: number=0;i<3;i++)u[i]/=ul;
  const v: number[]=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],ring: (p: number[], r: number) => number[][]=(p: number[],r: number): number[][] =>Array.from({length:9},(_: unknown,i: number): number[] =>p.map((c: number,j: number): number =>c+r*(u[j]*Math.cos(i*Math.PI*2/9)+v[j]*Math.sin(i*Math.PI*2/9)))),aa: number[][]=ring(a,r0),bb: number[][]=ring(b,r1),f: number[][][]=[aa.toReversed(),bb];
  for(let i: number=0;i<9;i++)f.push([aa[i],aa[(i+1)%9],bb[(i+1)%9],bb[i]]);add(id,mat,f,n);
 };
 const leaf: (id: string, p: number[], angle: number, len: number, w: number, tilt?: number, mat?: string) => void=(id: string,p: number[],angle: number,len: number,w: number,tilt: number=0,mat: string='leaves'): void =>{
  const c: number=Math.cos(angle),s: number=Math.sin(angle),q: (u: number, v: number, h: number) => number[]=(u: number,v: number,h: number): number[] =>[p[0]+c*u-s*v,p[1]+h+u*tilt,p[2]+s*u+c*v],edge: number[][]=[[0,0],[.16,-.30],[.42,-.50],[.70,-.41],[.91,-.19],[1,0],[.91,.19],[.70,.41],[.42,.50],[.16,.30]].map(([u,v]: number[]): number[] =>q(u*len,v*w,.016*Math.sin(u*Math.PI)-len*.24*u*u)),mid: number[]=q(len*.46,0,.018-len*.24*.46**2),f: number[][][]=[];
  // One manifold sheet; the material owns visibility from either side.
  for(let i: number=0;i<edge.length;i++){const j: number=(i+1)%edge.length;f.push([edge[i],edge[j],mid]);}add(id,mat,f);
 };
 const circle: (cx: number, cz: number, r: number, n?: number) => { x: number; y: number; }[]=(cx: number,cz: number,r: number,n: number=48): { x: number; y: number; }[] =>Array.from({length:n},(_: unknown,i: number): { x: number; y: number; } =>({x:cx+r*Math.cos(i*2*Math.PI/n),y:cz+r*Math.sin(i*2*Math.PI/n)}));
 mesh('site-earth',extrude({outer:[{x:-11.5,y:-8.5},{x:11.5,y:-8.5},{x:11.5,y:10.5},{x:-11.5,y:10.5}],holes:[circle(pond[0], pond[1],1.3952380952380952)],depth:.60}),[0,-.30,0],'soil',Q([1,0,0],Math.PI/2));
 mesh('pond-excavation-bearing',revolve({profile:[{x:0,y:-.60},{x:1.3952380952380952,y:-.60},{x:1.3952380952380952,y:0},{x:1.30,y:-.4},{x:0,y:-.4}],segments:48}),[pond[0],0,pond[1]],'soil');
 // Low ground vegetation only outside the occupied building and central approach.
 for(let k: number=0;k<850;k++){
  const x: number=-10.4+20.8*((k*.61803398875)%1),z: number=-7.4+17*((k*.41421356237)%1);
  if(Math.abs(x)<7.9&&z<6.35||Math.abs(x-.1)<.75&&z>4||Math.hypot(x-pond[0],z-pond[1])<1.65)continue;
  for(let j: number=0;j<3;j++)leaf('ground-grass-'+k+'-'+j,[x,0,z],k+j*2.1,.12+(k%5)*.02,.017,1.1,'herbs');
 }flush('site',-1,'site');
 const path: number[][]=[[-.15,-.1],[.95,-.1],[.95,4.275],[3.2,4.275],[3.2,5.125],[.95,5.125],[.65,9.4],[-.45,9.4],[-.15,5.125],[-3.2,5.125],[-3.2,4.275],[-.15,4.275]];
 mesh('garden-path-union',extrude({outer:path.map(([x,y]: number[]): { x: number; y: number; } =>({x,y})),depth:.036}),[0,.018,0],'gravel',Q([1,0,0],Math.PI/2));
 for(let i: number=0;i<path.length;i++){
  const a: number[]=path[i],b: number[]=path[(i+1)%path.length],len: number=Math.hypot(b[0]-a[0],b[1]-a[1]);
  // Leave the step, gallery junctions and gate approach open.
  if(len<1||Math.abs(a[0]-b[0])>.001&&(Math.abs(a[1])<.2||a[1]>9.3))continue;
  for(let k: number=0;k<Math.floor(len/.28);k++){const t: number=(k+.5)/Math.floor(len/.28),x: number=a[0]+(b[0]-a[0])*t,z: number=a[1]+(b[1]-a[1])*t;if(z<1.08)continue;stone('path-edge-'+i+'-'+k,[x,.064,z],[.24,.12,.24],i*100+k,k%3?'stone':'stoneLight');}
 }
 for(let k: number=0;k<1700;k++){
  const x: number=-3.15+6.3*((k*.61803398875)%1),z: number=.98+8.35*((k*.41421356237)%1),shift: number=z<=5.125?.30:.30*(9.4-z)/(9.4-5.125),on: boolean=x>-.43+shift&&x<.63+shift||z>4.295&&z<5.105;
  if(!on)continue;stone('gravel-'+k,[x,.038,z],[.028+(k%3)*.009,.012,.024],k,k%4?'gravel':'stoneLight');
 }flush('garden-paths',-1,'garden');
 for(const [i,x,z,w,d]of [[0,1.95,1.9,1.8,1.3],[1,-1.5,5.55,1.3,.65]]){
  bevel('bed-earth-'+i,[w,.09,d],[x,.045,z],'soil',undefined,.035);
  for(let k: number=0;k<22;k++){
   const px: number=x+w*((k*.61803398875)%1-.5)*.87,pz: number=z+d*((k*.41421356237)%1-.5)*.83,h: number=.20+(k%5)*.052,end: number[]=[px+.035,.09+h,pz];twig('herb-'+i+'-'+k,[px,.09,pz],end,.009,.003,'herbs');
   for(let j: number=1;j<=5;j++)for(const side of [-1,1])leaf('herb-leaf-'+i+'-'+k+'-'+j+'-'+side,[px+j*.006,.09+h*j/6,pz],k*.9+j*.8+side*Math.PI/2,k%3===1?.08:.11,k%3===1?.068:.038,.1,k%3?'herbs':'leafLight');
   if(k%3===0)for(let j: number=0;j<4;j++){const p: number[]=[end[0]+Math.cos(j*1.7)*.024,end[1]+j*.015,end[2]+Math.sin(j*1.7)*.024];twig('flower-pedicel-'+i+'-'+k+'-'+j,end,p,.003,.002,'herbs');stone('herb-flower-'+i+'-'+k+'-'+j,p,[.034,.038,.034],k+j,'flower');}
  }
 }flush('herb-beds',-1,'garden');
 mesh('pond-lined-basin',revolve({profile:[{x:0,y:-.4},{x:1.30,y:-.4},{x:1.40,y:.02},{x:1.30,y:.04},{x:1.20,y:-.06},{x:1.03,y:-.36},{x:0,y:-.36}],segments:64}),[pond[0],0,pond[1]],'stoneDark',undefined,{projected:true});
 for(let i: number=0;i<29;i++){const a: number=i*Math.PI*2/29,r: number=1.30+noise(i)*.025;stone('pond-rim-'+i,[pond[0]+r*Math.cos(a),.063+noise(i+1)*.017,pond[1]+r*Math.sin(a)],[.27+noise(i+2)*.025,.17+noise(i+3)*.055,.27+noise(i+4)*.025],i,i%3?'stone':'stoneLight');}
 mesh('pond-water',revolve({profile:[{x:0,y:-.36},{x:1.03,y:-.36},{x:1.20,y:-.06},{x:1.215,y:-.045},{x:0,y:-.045}],segments:48}),[pond[0],0,pond[1]],'water');
 for(let i: number=0;i<18;i++){const a: number=i*.45,r: number=.85+(i%3)*.08,x: number=pond[0]+Math.cos(a)*r,z: number=pond[1]+Math.sin(a)*r;if(i%2===0){
  twig('pond-reed-root-'+i,[x,-.375,z],[x,-.07,z],.018,.012,'herbs');
  for(let j: number=0;j<4;j++)leaf('pond-reed-'+i+'-'+j,[x,-.07,z],a+j*.5,.32+(j%2)*.13,.026,1.5,'herbs');
 }else{
  twig('pond-lily-stalk-'+i,[x,-.375,z],[x,-.045,z],.005,.004,'herbs');
  const center: number[]=[x,-.045,z],edge: number[][]=Array.from({length:18},(_: unknown,j: number): number[] =>{const t: number=.25+j*(Math.PI*2-.5)/17;return[x+.069*Math.cos(t),-.044+.001*Math.sin(j),z+.061*Math.sin(t)];}),f: number[][][]=[];for(let j: number=0;j<17;j++)f.push([center,edge[j+1],edge[j]]);add('pond-lily-'+i,'leafDark',f);
 }}
 for(let i: number=0;i<36;i++){const a: number=i*.7,r: number=.25+(i%9)*.08;stone('submerged-stone-'+i,[pond[0]+Math.cos(a)*r,-.33,pond[1]+Math.sin(a)*r],[.12,.06,.09],i,'stoneDark');}
 flush('pond',-1,'garden');
 const trunk: number[][]=[[tree[0],-.02,tree[1]],[tree[0]-.06,1.10,tree[1]+.02],[tree[0]-.17,2.25,tree[1]-.08],[tree[0]-.06,3.45,tree[1]+.04]],radii: number[]=[.18,.127,.091,.036];
 // Common rings at the bends form one closed trunk; perpendicular segment
 // caps previously left an exposed wedge at each change of direction.
 const trunkRings: number[][][]=trunk.map((p: number[],k: number): number[][] =>Array.from({length:9},(_: unknown,j: number): number[] =>[p[0]+radii[k]*Math.cos(j*Math.PI*2/9),p[1],p[2]+radii[k]*Math.sin(j*Math.PI*2/9)])),trunkFaces: number[][][]=[trunkRings[0].toReversed(),trunkRings[trunkRings.length-1]];
 for(let k: number=0;k<3;k++)for(let j: number=0;j<9;j++){const n: number=(j+1)%9;trunkFaces.push([trunkRings[k][j],trunkRings[k][n],trunkRings[k+1][n]],[trunkRings[k][j],trunkRings[k+1][n],trunkRings[k+1][j]]);}add('trunk-continuous','bark',trunkFaces.map((f: number[][]): number[][] =>f.toReversed()),[0,1,0]);
 const leader: number[]=[tree[0]+.19,4.30,tree[1]-.09];twig('trunk-leader',trunk[3],leader,.036,.003);
 for(let k: number=0;k<10;k++){const t: number=(k+.5)/10,p: number[]=trunk[3].map((v: number,j: number): number =>v+(leader[j]-v)*t);leaf('leader-leaf-'+k,p,k*2.399963,.12,.065,-.20+(k%4)*.15);}
 for(let i: number=0;i<5;i++){const a: number=i*1.27,len: number=.40+.11*(i%3),mid: number[]=[tree[0]+Math.cos(a)*len*.48,.065,tree[1]+Math.sin(a)*len*.48],tip: number[]=[tree[0]+Math.cos(a+.12)*len,-.018,tree[1]+Math.sin(a+.12)*len];twig('root-neck-'+i,[tree[0],.15,tree[1]],mid,.075,.038);twig('root-tip-'+i,mid,tip,.038,.010);}
 for(let i: number=0;i<8;i++){
  const a: number=i*2.399963,segment: 1 | 2=i<3?1:2,t0: number=i<3?.15+i*.15:(i-3)*.15,fork: number[]=trunk[segment].map((v: number,k: number): number =>v+(trunk[segment+1][k]-v)*t0),end: number[]=[tree[0]+Math.cos(a)*(1.26+(i%2)*.10),3.30+(i%3)*.40,tree[1]+Math.sin(a)*(1.26+(i%2)*.10)],elbow: number[]=fork.map((v: number,k: number): number =>v+(end[k]-v)*.48+(k===1?.06:k===2?.06*Math.sin(i):0));
  twig('bough-base-'+i,fork,elbow,.062-.003*i,.034);twig('bough-tip-'+i,elbow,end,.034,.003);
  for(let j: number=0;j<16;j++){
   const t: number=(j+.4)/16,start: number[]=j<7?fork.map((v: number,k: number): number =>v+(elbow[k]-v)*(j+.5)/7):elbow.map((v: number,k: number): number =>v+(end[k]-v)*(j-6.5)/9),ta: number=a+(j%2?1:-1)*(.7+j*.09),reach: number=.22+.10*(1-t),tip: number[]=[start[0]+Math.cos(ta)*reach,start[1]+.04+(j%3)*.06,start[2]+Math.sin(ta)*reach];twig('twig-'+i+'-'+j,start,tip,.010,.003);
   for(let k: number=0;k<13;k++){
    const u: number=(k+.5)/13,p: number[]=start.map((v: number,q: number): number =>v+(tip[q]-v)*u),la: number=ta+k*2.399963;leaf('apple-leaf-'+i+'-'+j+'-'+k,p,la,.11+(k%3)*.017,.070,-.38+((i*3+j+k)%7)*.12,['leaves','leafLight','leafDark'][(i+j+k)%3]);
   }
   if((i+j)%5===0){const p: number[]=[tip[0],tip[1]-.025,tip[2]];twig('fruit-stalk-'+i+'-'+j,tip,[p[0],p[1]-.014,p[2]],.003,.002);mesh('apple-'+i+'-'+j,revolve({profile:[{x:0,y:-.085},{x:.025,y:-.083},{x:.043,y:-.055},{x:.042,y:-.023},{x:.022,y:-.005},{x:0,y:-.012}],segments:20}),p,'appleRed');}
  }
 }flush('apple-tree',-1,'garden');
 const weave: (id: string, a: number[], b: number[]) => void=(id: string,a: number[],b: number[]): void =>{
  const len: number=Math.hypot(b[0]-a[0],b[1]-a[1]),dx: number=(b[0]-a[0])/len,dz: number=(b[1]-a[1])/len,nx: number=-dz,nz: number=dx,n: number=Math.ceil(len/.24);
  for(let i: number=0;i<=n;i++){const u: number=len*i/n;twig(id+'-stake-'+i,[a[0]+dx*u,-.16,a[1]+dz*u],[a[0]+dx*u,.72+(i%3)*.025,a[1]+dz*u],.026,.017);}
  for(let row: number=0;row<8;row++)for(let i: number=0;i<n;i++){
   const u: number=len*i/n,v: number=len*(i+1)/n,sa: 1 | -1=(i+row)%2?1:-1;
   // Curved withe stations wrap the stakes; row parity already alternates.
   for(let j: number=0;j<6;j++){
    // Keep the woven row in compressed contact with its tapered stakes.
    // The prior 37mm offset left every row 0.4–6.1mm from the actual stake mesh.
    const at: (t: number) => number[]=(t: number): number[] =>{const along: number=u+(v-u)*t,offset: number=.027*sa*Math.cos(Math.PI*t);return[a[0]+dx*along+nx*offset,.10+row*.073,a[1]+dz*along+nz*offset];};
    twig(id+'-withe-'+row+'-'+i+'-'+j,at(j/6),at((j+1)/6),.013,.012,'bark');
   }
  }
 };
 weave('fence-front-west',[-9,8.25],[-.55,8.25]);weave('fence-front-east',[.75,8.25],[9,8.25]);weave('fence-west',[-9,.15],[-9,8.25]);weave('fence-east',[9,8.25],[9,.15]);
 for(const x of [-.55,.75])bevel('gate-post-'+x,[.11,.90,.11],[x,.45,8.25],'oak',undefined,.015);
 // Open outward to the south; the west-hinged leaf clears the 1.19m passage.
 const pivot: number[]=[-.49,0,8.25],point: (x: number, y: number, z: number) => number[]=(x: number,y: number,z: number): number[] =>[pivot[0]+x,y,pivot[2]+z];
 for(let i: number=0;i<7;i++)beam('gate-leaf-upright-'+i,point(.05+i*.18,.09,0),point(.05+i*.18,.76,0),.037,'oak');
 for(const yy of [.19,.61])beam('gate-leaf-rail-'+yy,point(0,yy,0),point(1.18,yy,0),.055,'oakLight');beam('gate-leaf-brace',point(.025,.18,.03),point(1.16,.62,.03),.039,'oak');
 for(const yy of [.19,.61]){
  mesh('gate-pintle-'+yy,revolve({profile:[{x:0,y:0},{x:.017,y:0},{x:.017,y:.02},{x:.009,y:.02},{x:.009,y:.14},{x:0,y:.14}],segments:20}),point(0,yy-.07,0),'iron');
  beam('gate-fixed-anchor-'+yy,[-.55,yy-.060,8.25],point(0,yy-.060,0),.020,'iron');
  mesh('gate-leaf-knuckle-'+yy,revolve({profile:[{x:.010,y:0},{x:.017,y:0},{x:.017,y:.10},{x:.010,y:.10},{x:.010,y:0}],segments:20}),point(0,yy-.05,0),'iron');
  beam('gate-leaf-hinge-strap-'+yy,point(0,yy,.016),point(.30,yy,.024),.018,'iron');
  for(const xx of [.05,.14,.25])bevel('gate-leaf-rivet-'+yy+'-'+xx,[.013,.013,.030],point(xx,yy,.019),'ironWarm',undefined,.002);
 }
 beam('gate-leaf-latch',point(.99,.60,-.033),point(1.23,.60,-.033),.020,'iron');beam('gate-leaf-latch-grip',point(1.08,.60,-.034),point(1.08,.55,-.045),.016,'iron');box('gate-keeper',[.06,.06,.022],[.75,.60,8.215],'iron');
 flush('garden-fence',-1,'garden-boundary');
 registerMechanism({id:'garden-gate',parent:'garden-fence',prefix:'gate-leaf-',level:-1,pivot,restAngle:0,axis:[0,1,0],travel:-Math.PI*.46,kind:'gate',default:1});
}
