uniform float time;
uniform vec2 resolution;
uniform sampler2D texture;

// const float PI = 3.14159265359;

struct Ray {
    vec4 origin;
    vec4 direction;
};

mat4 translate(vec3 t) {
    return mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        t.x, t.y, t.z, 1
    );
}

mat4 scale(float x, float y, float z) {
    return mat4(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    );
}

/*
 * Adapted from polyroots.cpp by James Painter
 */
int quadratic_roots(float a, float b, float c, out float r1, out float r2) {
    if (a == 0.0) {
        if (b == 0.0) {
            return 0;
        }  
        r1 = -c / b;
        return 1;
    }
    float d = b * b - 4.0 * a * c;
    if (d < 0.0) {
        return 0;
    } 
    float q = -0.5 * (b + sign(b) * sqrt(d));
    r1 = q / a;
    r2 = q == 0.0 ? r1 : c / q;
    return 2;
}

bool sphere(Ray ray, float radius, out vec4 p)  {
    float a = dot(ray.direction, ray.direction);
    float b = dot(ray.direction, ray.origin) * 2.0;
    float c = dot(ray.origin, ray.origin) - radius * radius;

    float r1, r2;
    int num_roots = quadratic_roots(a, b, c, r1, r2);

    if (num_roots == 0) {
        return false;
    }
    float t = num_roots == 1 ? r1 : max(r1, r2);
    p = ray.origin + t * ray.direction;
    return true;
}


vec4 background(vec4 lookfrom, Ray ray) {
    Ray local;
    local.direction = ray.direction;

    vec4 p;
    sphere(ray, 5000.0, p);

    float y1 = 280.0 * sin(p.x / 700.0 + 500.0) - 400.0;
    float y2 = 220.0 * sin(p.x / 550.0 - 300.0) - 50.0;
    float y3 = 160.0 * sin(p.x / 400.0 + 120.0) + 350.0;
    float y4 = 120.0 * sin(p.x / 300.0 + 150.0) + 500.0;
    float y5 = 80.0 * sin(p.x / 200.0 + 90.0) + 700.0;

    if (p.y < y1) return vec4(0.04, 0.23, 0.23, 1.0);
    if (p.y < y2) return vec4(0.07, 0.35, 0.35, 1.0);
    if (p.y < y3) return vec4(0.09, 0.49, 0.48, 1.0);
    if (p.y < y4) return vec4(0.14, 0.65, 0.64, 1.0);
    if (p.y < y5) return vec4(0.28, 0.78, 0.78, 1.0);
    return vec4(0.51, 0.85, 0.85, 1.0);
}


void main() {
    /*
    float x = mod(time + gl_FragCoord.x, 20.0) < 10.0 ? 1.0 : 0.0;
    float y = mod(time + gl_FragCoord.y, 20.0) < 10.0 ? 1.0 : 0.0;
    gl_FragColor = vec4(vec3(min(x, y)), 1.0);
    /*/

    mediump vec2 coord = vec2(gl_FragCoord.x / resolution.x, gl_FragCoord.y / resolution.y);

    //*
    // T1
    float d = 100.0;
    mat4 T1 = translate(vec3(-0.5 * resolution.x, -0.5 * resolution.y, d));

    // S2
    float fovy = 50.0;
    float theta = radians(fovy);
    float h = 2.0 * d * tan(0.5 * theta);
    mat4 S2 = translate(vec3(-h / resolution.y, -h / resolution.y, 1.0));

    // R3
    vec3 eye = vec3(0.0, 0.0, 1.0);
    vec3 view = vec3(0.0, 0.0, -1.0);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec4 lookfrom = vec4(eye, 1.0);
    vec3 w = normalize(view);
    vec3 u = normalize(cross(up, w));
    vec3 v = cross(w, u);
    mat4 R3 = mat4(vec4(u, 0.0), vec4(v, 0.0), vec4(w, 0.0), vec4(0.0, 0.0, 0.0, 1.0));

    // T4
    mat4 T4 = translate(vec3(lookfrom));

    vec4 pk = vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 1.0);
    vec4 pworld = T4 * R3 * S2 * T1 * pk;

    Ray ray;
    ray.origin = lookfrom;
    ray.direction = pworld - lookfrom;

    vec4 color = background(lookfrom, ray);
    gl_FragColor = color;

    /*/
    mediump vec4 sample = texture2D(texture, coord);
    gl_FragColor = sample;
    //*/
}
