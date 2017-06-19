var THREEx	= THREEx || {}

THREEx.dilateGeometry	= function(geometry, length){
	// gather vertexNormals from geometry.faces
	var vertexNormals	= new Array(geometry.vertices.length);
	geometry.faces.forEach(function(face){
		if( face instanceof THREE.Face4 ){
			vertexNormals[face.a]	= face.vertexNormals[0];
			vertexNormals[face.b]	= face.vertexNormals[1];
			vertexNormals[face.c]	= face.vertexNormals[2];
			vertexNormals[face.d]	= face.vertexNormals[3];		
		}else if( face instanceof THREE.Face3 ){
			vertexNormals[face.a]	= face.vertexNormals[0];
			vertexNormals[face.b]	= face.vertexNormals[1];
			vertexNormals[face.c]	= face.vertexNormals[2];
		}else	console.assert(false);
	});
	// modify the vertices according to vertextNormal
	geometry.vertices.forEach(function(vertex, idx){
		var vertexNormal = vertexNormals[idx];
		vertex.x	+= vertexNormal.x * length;
		vertex.y	+= vertexNormal.y * length;
		vertex.z	+= vertexNormal.z * length;
	});		
};

THREEx.GeometricGlowMesh	= function(mesh){
	var object3d	= new THREE.Object3D

	var geometry	= mesh.geometry.clone()
	THREEx.dilateGeometry(geometry, 0.01)
	var material	= THREEx.createAtmosphereMaterial()
	material.uniforms.glowColor.value	= new THREE.Color('cyan')
	material.uniforms.coeficient.value	= 1.1
	material.uniforms.power.value		= 1.4
	var insideMesh	= new THREE.Mesh(geometry, material );
	object3d.add( insideMesh );


	var geometry	= mesh.geometry.clone()
	THREEx.dilateGeometry(geometry, 0.1)
	var material	= THREEx.createAtmosphereMaterial()
	material.uniforms.glowColor.value	= new THREE.Color('cyan')
	material.uniforms.coeficient.value	= 0.1
	material.uniforms.power.value		= 1.2
	material.side	= THREE.BackSide
	var outsideMesh	= new THREE.Mesh( geometry, material );
	object3d.add( outsideMesh );

	// expose a few variable
	this.object3d	= object3d
	this.insideMesh	= insideMesh
	this.outsideMesh= outsideMesh
}