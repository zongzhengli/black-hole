(function() {
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
})();

function initWebGL(vertexShader, fragmentShader) {
    var CAMERA_DELTA_FACTOR = {
        x: 0.002,
        y: -0.002,
    }
    var CAMERA_SMOOTHING_FACTOR = 0.1;

    var startTime = Date.now();

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var container = $("#container");
    container.append(renderer.domElement);

    var mouse = null;
    container.on("mousemove touchmove", function(event) {
        var x = event.clientX || event.touches[0].pageX;
        var y = event.clientY || event.touches[0].pageY;
        mouse = {
            current: { x: x, y: y },
            initial: (mouse && mouse.initial) || { x: x, y: y },
        };
    });

    (new THREE.TextureLoader()).load("res/andromeda.jpg", function (texture) {
        var uniforms = {
            time: { type: "f", value: 1.0 },
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

        animate();

        function animate() {
            requestAnimationFrame(animate);
            updateCamera();
            render();
        }

        function render() {
            var elapsedSeconds = (Date.now() - startTime) / 1000.0;
            uniforms.time.value = elapsedSeconds;
            renderer.render(scene, camera);
        }

        function updateCamera() {
            if (mouse === null) {
                return;
            }
            var x = (mouse.current.x - mouse.initial.x) * CAMERA_DELTA_FACTOR.x;
            var y = (mouse.current.y - mouse.initial.y) * CAMERA_DELTA_FACTOR.y;
            uniforms.camera_delta.value.x +=
                (x - uniforms.camera_delta.value.x) * CAMERA_SMOOTHING_FACTOR;
            uniforms.camera_delta.value.y +=
                (y - uniforms.camera_delta.value.y) * CAMERA_SMOOTHING_FACTOR;
        }
    });
}
