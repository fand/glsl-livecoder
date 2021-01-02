#version 300 es
/*{
  frameskip: 1,
}
*/

precision highp float;
precision highp int;

out vec4 FragColor;
uniform vec2 resolution;
uniform float time;

float rnd(vec2 x)
{
    int n = int(x.x * 40.0 + x.y * 6400.0);
    n = (n << 13) ^ n;
    return 1.0 - float( (n * (n * n * 15731 + 789221) + \
             1376312589) & 0x7fffffff) / 1073741824.0;
}

void main(){
  vec2 uv = gl_FragCoord.xy;
  vec2 foo = vec2(rnd(uv + time), rnd(uv * time));
  float rng = rnd(foo);
  FragColor = vec4(vec3(rng), 1.);
}
