import{jsx as _jsx}from"react/jsx-runtime";import*as React from"react";import{addPropertyControls,ControlType}from"framer";/**
 * INTERACTIVE ASCII ORB
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */export default function AsciiOrb(props){const canvasRef=React.useRef(null);const mouseRef=React.useRef({x:-1e3,y:-1e3});// Configuration constants derived from props
const{orbRadius,particleCount,rotationSpeed,scatterRadius,scatterForce,fontSize,color,charSet}=props;React.useEffect(()=>{const canvas=canvasRef.current;const ctx=canvas.getContext("2d");let animationFrameId;let time=0;// Initialize particles on a sphere (Fibonacci Sphere algorithm for even distribution)
const particles=[];const phi=Math.PI*(3-Math.sqrt(5))// Golden angle
;for(let i=0;i<particleCount;i++){const y=1-i/(particleCount-1)*2// y goes from 1 to -1
;const radiusAtY=Math.sqrt(1-y*y)// radius at y
;const theta=phi*i;const x=Math.cos(theta)*radiusAtY;const z=Math.sin(theta)*radiusAtY;// Assign a random character from the set
const char=charSet[Math.floor(Math.random()*charSet.length)];particles.push({x,y,z,char});}const render=()=>{time+=rotationSpeed*.01;// Handle HiDPI screens
const dpr=window.devicePixelRatio||1;const rect=canvas.getBoundingClientRect();// Resize canvas only if needed to avoid flickering
if(canvas.width!==rect.width*dpr||canvas.height!==rect.height*dpr){canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;}// Clear canvas
ctx.clearRect(0,0,canvas.width,canvas.height);// Setup text styles
ctx.font=`${fontSize*dpr}px monospace`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=color;const centerX=canvas.width/2;const centerY=canvas.height/2;// Calculate base scale relative to canvas size
const baseScale=Math.min(canvas.width,canvas.height)*(orbRadius/200);// 1. Rotate and Project Points
const projectedParticles=particles.map(p=>{// Rotation Matrix (Y and X axis rotation)
let x=p.x;let y=p.y;let z=p.z;// Rotate around Y
const cosT=Math.cos(time);const sinT=Math.sin(time);const x1=x*cosT-z*sinT;const z1=z*cosT+x*sinT;// Rotate around X (tilted slightly)
const tilt=.5;const cosA=Math.cos(tilt);const sinA=Math.sin(tilt);const y2=y*cosA-z1*sinA;const z2=z1*cosA+y*sinA;// Perspective Projection
const zDist=2+z2// Camera distance
;const scale=baseScale/zDist*dpr;let screenX=centerX+x1*scale;let screenY=centerY+y2*scale;return{...p,screenX,screenY,scale,zDepth:z2};});// 2. Sort by depth (Z-buffering equivalent) so front chars are on top
projectedParticles.sort((a,b)=>b.zDepth-a.zDepth);// 3. Apply Interaction (Scatter) and Draw
// We need to account for DPR in mouse position
const mx=mouseRef.current.x*dpr;const my=mouseRef.current.y*dpr;const sRadius=scatterRadius*dpr;const sForce=scatterForce*dpr;projectedParticles.forEach(p=>{let finalX=p.screenX;let finalY=p.screenY;// Calculate distance to mouse
const dx=finalX-mx;const dy=finalY-my;const dist=Math.sqrt(dx*dx+dy*dy);// Scatter logic
if(dist<sRadius){const angle=Math.atan2(dy,dx);const force=(sRadius-dist)/sRadius;const moveDist=force*sForce;finalX+=Math.cos(angle)*moveDist;finalY+=Math.sin(angle)*moveDist;}// Opacity based on depth (fog)
const alpha=Math.max(.1,(1+p.zDepth)/2.5)// Simple depth shading
;ctx.globalAlpha=alpha;// Draw
ctx.fillText(p.char,finalX,finalY);});ctx.globalAlpha=1// Reset
;animationFrameId=requestAnimationFrame(render);};render();return()=>cancelAnimationFrame(animationFrameId);},[orbRadius,particleCount,rotationSpeed,scatterRadius,scatterForce,fontSize,color,charSet]);// Mouse Event Handlers
const handleMouseMove=e=>{const rect=e.currentTarget.getBoundingClientRect();mouseRef.current={x:e.clientX-rect.left,y:e.clientY-rect.top};};const handleMouseLeave=()=>{// Move mouse off-screen to reset scatter
mouseRef.current={x:-1e3,y:-1e3};};return /*#__PURE__*/_jsx("canvas",{ref:canvasRef,style:{width:"100%",height:"100%",cursor:"crosshair"},onMouseMove:handleMouseMove,onMouseLeave:handleMouseLeave});}// Sidebar Controls
addPropertyControls(AsciiOrb,{color:{type:ControlType.Color,title:"Color",defaultValue:"#000000"},charSet:{type:ControlType.String,title:"Characters",defaultValue:".:-i|=+*%O#@",description:"The characters used to build the sphere."},orbRadius:{type:ControlType.Number,title:"Size %",min:10,max:150,defaultValue:80},particleCount:{type:ControlType.Number,title:"Density",min:100,max:2e3,step:50,defaultValue:600},fontSize:{type:ControlType.Number,title:"Font Size",min:8,max:40,defaultValue:12},rotationSpeed:{type:ControlType.Number,title:"Spin Speed",min:-10,max:10,step:.1,defaultValue:1.5},scatterRadius:{type:ControlType.Number,title:"Scatter Radius",min:0,max:500,defaultValue:100},scatterForce:{type:ControlType.Number,title:"Scatter Force",min:0,max:500,defaultValue:80}});
export const __FramerMetadata__ = {"exports":{"default":{"type":"reactComponent","name":"AsciiOrb","slots":[],"annotations":{"framerContractVersion":"1","framerIntrinsicHeight":"400","framerIntrinsicWidth":"400"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./Orb.map