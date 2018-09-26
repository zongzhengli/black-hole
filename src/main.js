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
    var startTime = Date.now();

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var container = document.getElementById("container");
    container.appendChild(renderer.domElement);

    (new THREE.TextureLoader()).load("res/andromeda.jpg", function (texture) {
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

        var camera = new THREE.Camera();

        /*
        animate();
        /*/
        render();
        //*/

        function animate() {
            requestAnimationFrame(animate);
            render();
        }

        function render() {
            var elapsedSeconds = (Date.now() - startTime) / 1000.0;
            uniforms.time.value = elapsedSeconds;
            renderer.render(scene, camera);
        }
    });
}