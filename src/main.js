(function() {
    $.when(loadVertexShader(), loadFragmentShader())
        .done(function(vertexShader, fragmentShader) {
            initWebGL(vertexShader[0], fragmentShader[0]);
        });

    function loadVertexShader() {
        return $.ajax({
            url : "src/vertex_shader.js",
            dataType: "text",
        });
    }

    function loadFragmentShader() {
        return $.ajax({
            url : "src/fragment_shader.js",
            dataType: "text",
        });
    }
})();

function initWebGL(vertexShader, fragmentShader) {
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var startTime = Date.now();

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var container = document.getElementById("container");
    container.appendChild(renderer.domElement);

    var camera = new THREE.Camera();
    camera.position.z = 1;

    var texture = (new THREE.TextureLoader()).load("res/horsehead.jpg");

    var uniforms = {
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2() },
        texture: { type: "t", value: texture },
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

    animate();

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        var elapsedMilliseconds = Date.now() - startTime;
        var elapsedSeconds = elapsedMilliseconds / 1000.0;
        uniforms.time.value = 60.0 * elapsedSeconds;
        renderer.render(scene, camera);
    }
}