var CAMERA_FACTOR = {
    x: 0.002,
    y: 0.002,
    z: 0.01,
};
var CAMERA_SMOOTHNESS = 0.1;
var CAMERA_Z_BOUNDS = {
    min: -1600.0,
    max: 4000.0,
};

$.when(loadVertexShader(), loadFragmentShader())
    .done(function(vertexShader, fragmentShader) {
        initWebGL(vertexShader[0], fragmentShader[0]);
    });

function loadVertexShader() {
    return $.ajax({
        url : "src/shader.vert",
        dataType: "text",
    });
}

function loadFragmentShader() {
    return $.ajax({
        url : "src/shader.frag",
        dataType: "text",
    });
}

function initWebGL(vertexShader, fragmentShader) {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var container = $("div.container");
    container.append(renderer.domElement);

    showLoadingText("Loading textures");

    (new THREE.TextureLoader()).load("res/andromeda.jpg", function (texture) {
        var uniforms = {
            resolution: { type: "v2", value: new THREE.Vector2() },
            texture: { type: "t", value: texture },
            camera_delta: { type: "v4", value: new THREE.Vector4() },
        };
        uniforms.resolution.value.x = window.innerWidth;
        uniforms.resolution.value.y = window.innerHeight;

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });

        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);

        var scene = new THREE.Scene();
        scene.add(mesh);

        var camera = new THREE.Camera();
        var mouse = getMouse(container);

        hideLoadingScreen();
        renderLoop(renderer, scene, camera, uniforms, mouse);
    });
}

function renderLoop(renderer, scene, camera, uniforms, mouse) {
    requestAnimationFrame(function () {
        renderLoop(renderer, scene, camera, uniforms, mouse);
    });
    updateCamera(uniforms, mouse);
    renderFrame(renderer, scene, camera);
}

function renderFrame(renderer, scene, camera) {
    renderer.render(scene, camera);
}

function updateCamera(uniforms, mouse) {
    var x = (mouse.x - 0.5 * window.innerWidth) * CAMERA_FACTOR.x;
    var y = -(mouse.y - 0.5 * window.innerHeight) * CAMERA_FACTOR.y;
    var z = mouse.z * CAMERA_FACTOR.z;
    uniforms.camera_delta.value.x +=
        (x - uniforms.camera_delta.value.x) * CAMERA_SMOOTHNESS;
    uniforms.camera_delta.value.y +=
        (y - uniforms.camera_delta.value.y) * CAMERA_SMOOTHNESS;
    uniforms.camera_delta.value.z +=
        (z - uniforms.camera_delta.value.z) * CAMERA_SMOOTHNESS;
}

function getMouse(container) {
    var mouse = {
        x: 0.5 * window.innerWidth,
        y: 0.5 * window.innerHeight,
        z: 0.0,
    };
    container.on("mousemove", function(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });
    container.on("touchmove", function(event) {
        mouse.x = event.touches[0].pageX;
        mouse.y = event.touches[0].pageY;
    });
    container.on("wheel", function(event) {
        mouse.z += event.originalEvent.deltaY;
        mouse.z = Math.max(mouse.z, CAMERA_Z_BOUNDS.min);
        mouse.z = Math.min(mouse.z, CAMERA_Z_BOUNDS.max);
    });
    return mouse;
}

function showLoadingText(text) {
    $("div.loading p").text(text);
}

function hideLoadingScreen() {
    $("div.loading").hide();
}