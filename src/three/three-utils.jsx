"use strict";

import THREE from "three";

import * as ThreeCSG from "./ThreeCSG";

export const radian = Math.PI / 2;

export function centerGeometryOnAxis( geometry ) {
  moveGeometry( geometry, getGeometryMidPoint( geometry ) );
}

export function getGeometryMidPoint( geometry ) {
  geometry.computeBoundingBox();
  return new THREE.Vector3()
    .lerpVectors( geometry.boundingBox.max, geometry.boundingBox.min, 0.5 )
    .negate();
}

export function moveGeometry( geometry, translation ) {
  geometry.applyMatrix(
    new THREE.Matrix4().makeTranslation( translation.x, translation.y, translation.z ) );
}

export function flipGeometryFaces( geometry ) {
  for ( let i = 0; i < geometry.faces.length; i ++ ) {
    let face = geometry.faces[ i ];
    let temp = face.a;
    face.a = face.c;
    face.c = temp;
  }

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  let faceVertexUvs = geometry.faceVertexUvs[ 0 ];
  for ( let i = 0; i < faceVertexUvs.length; i ++ ) {
    let temp = faceVertexUvs[ i ][ 0 ];
    faceVertexUvs[ i ][ 0 ] = faceVertexUvs[ i ][ 2 ];
    faceVertexUvs[ i ][ 2 ] = temp;
  }

  geometry.uvsNeedUpdate = true;
}

export function rotateGeometryX( geometry, radians ) {
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( radians ) );
}

export function rotateGeometryY( geometry, radians ) {
  geometry.applyMatrix( new THREE.Matrix4().makeRotationY( radians ) );
}

export function rotateGeometryZ( geometry, radians ) {
  geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( radians ) );
}

export function createQuad( width, height ) {
  let quad = new THREE.Shape();

  quad.moveTo( 0,     0 );
  quad.lineTo( 0,     height );
  quad.lineTo( width, height );
  quad.lineTo( width, 0 );
  quad.lineTo( 0,     0 );

  let quadGeo = new THREE.ShapeGeometry( quad );
  fixQuadUVs( quadGeo );

  return quadGeo;
}

export function fixQuadUVs( quadGeo ) {
  // by default, shapes use the extrude geometry UVGenerator.
  // We are going to iterate over the UV array and set values
  // greater than 1 to 1.
  for( let t = 0; t < quadGeo.faceVertexUvs.length; ++t ) {
    for( let u = 0; u < quadGeo.faceVertexUvs[t].length; ++u ) {
      for( let v = 0; v < quadGeo.faceVertexUvs[t][u].length; ++v ) {
        let uv = quadGeo.faceVertexUvs[t][u][v];
        if( uv.x > 0 ) { uv.x = 1 }
        if( uv.y > 0 ) { uv.y = 1 }
      }
    }
  }
  quadGeo.uvsNeedUpdate = true;
}

export function vectorToString( value ) {
  return `x: ${value.x} y: ${value.y} z: ${value.z}`;
}

export class MaterialIndices {
  constructor( minIndex, maxIndex ) {
    this.min = minIndex;
    if( maxIndex === undefined ) {
      this.max = this.min;
    } else {
      this.max = maxIndex;
    }

    if( this.max < this.min ) {
      throw "Max index must be greater than min index!";
    }
  }

  get length() {
    return this.max - this.min + 1;
  }
}