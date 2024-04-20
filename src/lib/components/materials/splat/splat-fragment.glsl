varying vec2 vUv;
uniform sampler2D textures[4];
uniform sampler2D blendTexture;
uniform float colors[9];
uniform float noiseOffset;
uniform float useNoise;
uniform float useColors;
uniform float repeat;

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float normalise(float value, float min, float max) {
    return (value - min) / (max - min);
}

float clampNoise(float noiseTex, float clampAmount, float blurAmount) {
    float clampedNoise = (noiseTex > clampAmount) ? 1.0 : 0.0;
    clampedNoise += (noiseTex > clampAmount - blurAmount && noiseTex < clampAmount) ? normalise(noiseTex, clampAmount - blurAmount, clampAmount) : 0.0;
    return clampedNoise;
}

void main() {

    float scale = 0.0;
    float noiseScale = 50.0;

    float blurAmount = 0.01;
    vec4 blendMap = texture2D(blendTexture, vUv);

    vec2 uv = vUv;
    uv = uv * repeat;
    vec2 center = vUv / 0.2;
    center = (1.0 - scale) * (vUv - 0.5) + 0.5;

    // smooth out texture
    vec2 smooth_uv = repeat * vUv;
    vec4 duv = vec4(dFdx(smooth_uv), dFdy(smooth_uv));
    vec4 texture1 = textureGrad(textures[0], uv, duv.xy, duv.zw);
    vec4 texture2 = textureGrad(textures[1], uv, duv.xy, duv.zw);
    vec4 texture3 = textureGrad(textures[2], uv, duv.xy, duv.zw);

    // colors
    if(useColors == 1.0) {
        texture1 = vec4(colors[0], colors[1], colors[2], 1.0);
        texture2 = vec4(colors[3], colors[4], colors[5], 1.0);
        texture3 = vec4(colors[6], colors[7], colors[8], 1.0);
    }

    // texture
    vec4 tex = (smoothstep(0.00, 1.00, blendMap.r)) * texture1;
    vec4 tex2 = (smoothstep(0.00, 1.00, blendMap.g)) * texture2;
    vec4 tex3 = (smoothstep(0.00, 1.00, blendMap.b)) * texture3;

    vec4 finalOutput = tex + tex2 + tex3;

    // noise 
    float f = snoise(vec3(noiseScale * vUv, noiseOffset));
    f = 1.5 + 0.3 * f;

    if(useNoise == 1.0) {
        float clampAmount = 0.49;
        blendMap.r = clampNoise(f * blendMap.r, clampAmount, blurAmount);
        blendMap.g = clampNoise(f * blendMap.g, clampAmount, blurAmount);
        blendMap.b = clampNoise(f * blendMap.b, clampAmount, blurAmount);

        vec4 tex = (smoothstep(0.00, 1.00, blendMap.r)) * texture1;
        vec4 tex2 = (smoothstep(0.00, 1.00, blendMap.g)) * texture2;
        vec4 tex3 = (smoothstep(0.00, 1.00, blendMap.b)) * texture3;

        finalOutput = mix(tex, tex2, tex2.a);
        finalOutput = mix(finalOutput, tex3, tex3.a);
    }

    gl_FragColor = finalOutput;

    #include <tonemapping_fragment>
    #include <colorspace_fragment> 
}