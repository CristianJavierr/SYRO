import{defineShader,ControlType}from"framer";export default defineShader({title:"Pixels",fragment:`
void main() {
    float cssResX = u_resolution.x / u_pixelRatio;
    float cssResY = u_resolution.y / u_pixelRatio;
    float aspect = cssResX / cssResY;

    ivec2 texSizeI = textureSize(u_texture, 0);
    vec2 texSize = vec2(texSizeI);
    float textureAspect = texSize.x / texSize.y;

    vec2 coverScale = vec2(1.0);
    vec2 coverOffset = vec2(0.0);
    if (aspect > textureAspect) {
        float s = aspect / textureAspect;
        coverScale = vec2(1.0, 1.0 / s);
        coverOffset = vec2(0.0, (1.0 - coverScale.y) * 0.5);
    } else {
        float s = textureAspect / aspect;
        coverScale = vec2(1.0 / s, 1.0);
        coverOffset = vec2((1.0 - coverScale.x) * 0.5, 0.0);
    }

    // Pixel grid in CSS pixels (DPR-independent)
    float cellsY = u_pixels;
    vec2 cellCount = vec2(cellsY * aspect, cellsY);
    vec2 coord = v_uv * cellCount;
    vec2 normalizedSize = 1.0 / cellCount;

    // Stagger
    float colStagger = mod(floor(coord.x), 2.0) * u_stagger;
    vec2 subcoord = coord * vec2(3.0, 1.0);
    float subIdx = mod(floor(subcoord.x), 3.0);
    float subStagger = subIdx * u_stagger;

    // Offset UV with full stagger
    vec2 offsetUV = v_uv;
    offsetUV.y += (colStagger + subStagger) * normalizedSize.y;
    vec2 cellCenter = normalizedSize * (floor(offsetUV / normalizedSize) + 0.5);

    // Chromatic aberration
    //float ca = u_aberration / cssResX;
    float ca = u_aberration * normalizedSize.x;

    vec2 sampleR = (cellCenter + vec2(-ca, 0.0)) * coverScale + coverOffset;
    vec2 sampleG = cellCenter * coverScale + coverOffset;
    vec2 sampleB = (cellCenter + vec2(ca, 0.0)) * coverScale + coverOffset;

    sampleR.y = 1.0 - sampleR.y;
    sampleG.y = 1.0 - sampleG.y;
    sampleB.y = 1.0 - sampleB.y;

    sampleR = clamp(sampleR, vec2(0.0), vec2(1.0));
    sampleG = clamp(sampleG, vec2(0.0), vec2(1.0));
    sampleB = clamp(sampleB, vec2(0.0), vec2(1.0));

    vec4 colR = texelFetch(u_texture, clamp(ivec2(sampleR * texSize), ivec2(0), texSizeI - 1), 0);
    vec4 colG = texelFetch(u_texture, clamp(ivec2(sampleG * texSize), ivec2(0), texSizeI - 1), 0);
    vec4 colB = texelFetch(u_texture, clamp(ivec2(sampleB * texSize), ivec2(0), texSizeI - 1), 0);

    // Hue rotation
    float h = u_hueShift;
    vec3 k = vec3(0.57735);

    float cR = cos(-h), sR = sin(-h);
    mat3 hueRotR = mat3(
        cR + k.x*k.x*(1.0-cR), k.x*k.y*(1.0-cR) - k.z*sR, k.x*k.z*(1.0-cR) + k.y*sR,
        k.y*k.x*(1.0-cR) + k.z*sR, cR + k.y*k.y*(1.0-cR), k.y*k.z*(1.0-cR) - k.x*sR,
        k.z*k.x*(1.0-cR) - k.y*sR, k.z*k.y*(1.0-cR) + k.x*sR, cR + k.z*k.z*(1.0-cR)
    );
    float cB = cos(h), sB = sin(h);
    mat3 hueRotB = mat3(
        cB + k.x*k.x*(1.0-cB), k.x*k.y*(1.0-cB) - k.z*sB, k.x*k.z*(1.0-cB) + k.y*sB,
        k.y*k.x*(1.0-cB) + k.z*sB, cB + k.y*k.y*(1.0-cB), k.y*k.z*(1.0-cB) - k.x*sB,
        k.z*k.x*(1.0-cB) - k.y*sB, k.z*k.y*(1.0-cB) + k.x*sB, cB + k.z*k.z*(1.0-cB)
    );

    colR.rgb = hueRotR * colR.rgb;
    colB.rgb = hueRotB * colB.rgb;

    vec3 color = vec3(colR.r, colG.g, colB.b);

    // Sub-pixel bevel border
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec2 cellOffset = vec2(0.0, colStagger + subStagger);
    vec2 subCellUV = fract(subcoord + cellOffset) * 2.0 - 1.0;
    float borderAmount = u_border - luma * 0.25;
    vec2 border = 1.0 - subCellUV * subCellUV * borderAmount;
    float mask = border.x * border.y;

    // AA based on CSS pixels per cell
    float pixelsPerCell = cssResY / cellsY * u_pixelRatio * 2.;
    float aaRange = smoothstep(2.0, 8.0, pixelsPerCell) * 0.95;
    float maskStrength = smoothstep(0.0, aaRange, mask);

    color *= maskStrength;

    fragColor = vec4(color, 1.0);
}
`,propertyControls:{texture:{type:ControlType.ResponsiveImage,title:"Image",defaultValue:"data:framer/asset-reference,HcsbdkJggvMaJ0BVy56SIVkBUA.png?originalFilename=Zoom.png&width=2560&height=1440"},pixels:{type:ControlType.Number,title:"Pixels",defaultValue:28,min:8,max:128,step:1},stagger:{type:ControlType.Number,title:"Stagger",defaultValue:0,min:0,max:1,step:.01},border:{type:ControlType.Number,title:"Border",defaultValue:0,min:0,max:1,step:.01},aberration:{type:ControlType.Number,title:"Aberration",defaultValue:0,min:0,max:20,step:.5},hueShift:{type:ControlType.Number,title:"Hue Shift",defaultValue:0,min:-1,max:1,step:.01}}});
export const __FramerMetadata__ = {"exports":{"default":{"type":"shader","name":null,"annotations":{"framerContractVersion":"1"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./ImagePixels.map