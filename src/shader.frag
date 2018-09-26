uniform float time;
uniform vec2 resolution;
uniform sampler2D texture;
uniform vec4 camera_delta;

const float PI = 3.14159265359;
const float POV_DEGREES = 50.0;
const float PROJECTION_DISTANCE = 1.0;
const float BACKGROUND_DISTANCE = 50.0;
const float SPEED_OF_LIGHT = 1.0;
const float BLACK_HOLE_RADIUS = 1.0;
const float STEP_SIZE_FACTOR = 0.02;
const int SIMULATION_STEPS = 200;
const vec3 EYE = vec3(0.0, 0.0, 20.0);

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

mat4 scale(vec3 s) {
    return mat4(
        s.x, 0, 0, 0,
        0, s.y, 0, 0,
        0, 0, s.z, 0,
        0, 0, 0, 1
    );
}

mat4 rotate_x_axis(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat4(
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
    );
}

mat4 rotate_y_axis(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat4(
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    );
}

void solve_quadratic(float a, float b, float c, out float r1, out float r2) {
    float d = b * b - 4.0 * a * c;
    float q = -0.5 * (b + sign(b) * sqrt(d));
    r1 = q / a;
    r2 = c / q;
}

vec4 intersect_sphere(Ray ray, float radius)  {
    float a = dot(ray.direction, ray.direction);
    float b = dot(ray.direction, ray.origin) * 2.0;
    float c = dot(ray.origin, ray.origin) - radius * radius;

    float r1, r2;
    solve_quadratic(a, b, c, r1, r2);
    float t = max(r1, r2);
    return ray.origin + t * ray.direction;
}

vec4 background(Ray ray) {
    vec4 p = intersect_sphere(ray, BACKGROUND_DISTANCE);

    // Get polar coordinates of intersection.
    float r = sqrt(p.x * p.x + p.z * p.z);
    float theta = atan(p.x / p.z);
    float z = p.y;

    /* Wave background for testing
    float y1 = 28.0 * sin(theta * 2.5 + 5.0) - 20.0;
    float y2 = 22.0 * sin(theta * 2.0 - 3.0) - 5.0;
    float y3 = 16.0 * sin(theta * 1.8 + 1.0) + 5.0;
    float y4 = 12.0 * sin(theta * 1.7 + 1.0) + 20.0;
    float y5 = 8.0 * sin(theta * 1.6 + 9.0) + 30.0;
    if (z < y1) return vec4(0.04, 0.23, 0.23, 1.0);
    if (z < y2) return vec4(0.07, 0.35, 0.35, 1.0);
    if (z < y3) return vec4(0.09, 0.49, 0.48, 1.0);
    if (z < y4) return vec4(0.14, 0.65, 0.64, 1.0);
    if (z < y5) return vec4(0.28, 0.78, 0.78, 1.0);
    return vec4(0.51, 0.85, 0.85, 1.0);
    /*/
    // Map polar coordinates to background image.
    vec2 coord = vec2(theta / PI + 0.5, z / (2.0 * BACKGROUND_DISTANCE) + 0.5);
    return texture2D(texture, coord);
    //*/
}

Ray compute_ray_for_current_pixel() {
    // Do some transforms to get world coordinates of pixel
    mat4 t1 = translate(vec3(-0.5 * resolution.x, -0.5 * resolution.y, PROJECTION_DISTANCE));

    float theta = radians(POV_DEGREES);
    float h = 2.0 * PROJECTION_DISTANCE * tan(0.5 * theta);
    mat4 s2 = scale(vec3(h / resolution.y, h / resolution.y, 1.0));

    vec3 up = vec3(0.0, 1.0, 0.0);
    vec4 look_from =
        rotate_y_axis(camera_delta.x) *
        rotate_x_axis(camera_delta.y) *
        vec4(EYE, 1.0);

    vec3 w = -normalize(vec3(look_from));
    vec3 u = normalize(cross(up, w));
    vec3 v = cross(w, u);
    mat4 r3 = mat4(vec4(u, 0.0), vec4(v, 0.0), vec4(w, 0.0), vec4(0.0, 0.0, 0.0, 1.0));

    mat4 t4 = translate(vec3(look_from));

    vec4 p_pixel = vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 1.0);
    vec4 p_world = t4 * r3 * s2 * t1 * p_pixel;

    Ray ray;
    ray.origin = look_from;
    ray.direction = p_world - look_from;
    return ray;
}

vec3 compute_force(vec3 position, float h2) {
    return -1.5 * h2 * position / pow(length(position), 5.0);
}

/*
 * Returns whether the object fell into the black hole.
 */
bool simulate_black_hole(inout vec3 position, inout vec3 velocity) {
    // Some constant needed to get geodesic equation to work
    float h2 = pow(length(cross(position, velocity)), 2.0);
    for (int i = 0; i < SIMULATION_STEPS; i++) {
        float r = length(position);
        if (r >= BACKGROUND_DISTANCE) {
            return false;
        }
        if (r <= BLACK_HOLE_RADIUS) {
            return true;
        }
        float step_size = r * r * STEP_SIZE_FACTOR;
        vec3 delta = velocity * step_size;
        // Fourth order Runge–Kutta integration
        vec3 k1 = step_size * compute_force(position, h2);
        vec3 k2 = step_size * compute_force(position + delta + 0.5 * k1, h2);
        vec3 k3 = step_size * compute_force(position + delta + 0.5 * k2, h2);
        vec3 k4 = step_size * compute_force(position + delta + k3, h2);
        position += delta;
        velocity += (k1 + 2.0 * (k2 + k3) + k4) / 6.0;
    }
    return false;
}

void main() {
    /*
    float x = mod(time + gl_FragCoord.x, 20.0) < 10.0 ? 1.0 : 0.0;
    float y = mod(time + gl_FragCoord.y, 20.0) < 10.0 ? 1.0 : 0.0;
    gl_FragColor = vec4(vec3(min(x, y)), 1.0);
    return;
    //*/

    Ray ray = compute_ray_for_current_pixel();

    //*
    vec3 position = vec3(ray.origin);
    vec3 velocity = SPEED_OF_LIGHT * normalize(vec3(ray.direction));
    if (simulate_black_hole(position, velocity)) {
        gl_FragColor = vec4(0.0);
        return;
    }
    ray.origin = vec4(position, 1.0);
    ray.direction = vec4(velocity, 0.0);
    //*/

    vec4 color = background(ray);
    gl_FragColor = color;
}
