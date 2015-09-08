import THREE from "three";

import { CheckerPath as CheckerPath, CheckerPathPoint as CheckerPathPoint } from '../util/checker-path';

import * as ArrowDirectionType from '../util/arrow-direction-type';
import * as THREEUtils from './three-utils';

export function createBoardMesh( squareSize, boardSize, boardHeight, boardMaterial ) {
  let boardLength = ( squareSize + 2 ) * boardSize;
  let boardPoints = [];
  boardPoints.push( new THREE.Vector3( 0,               0, 0 ) );
  boardPoints.push( new THREE.Vector3( 0,               0, boardHeight ) );
  boardPoints.push( new THREE.Vector3( boardLength - 5, 0, boardHeight ) );
  boardPoints.push( new THREE.Vector3( boardLength,     0, boardHeight - 5 ) );
  boardPoints.push( new THREE.Vector3( boardLength,     0, 0 ) );
  boardPoints.push( new THREE.Vector3( 0,               0, 0 ) );

  let boardGeo = new THREE.LatheGeometry( boardPoints, 4 );
  THREEUtils.flipGeometryFaces( boardGeo );

  let boardMesh = new THREE.Mesh( boardGeo, boardMaterial );
  boardMesh.castShadow = true;
  boardMesh.receiveShadow = true;

  //boardMesh.add( new THREE.AxisHelper( 20 ) );

  THREEUtils.rotateGeometryX( boardMesh.geometry, -THREEUtils.radian );
  THREEUtils.rotateGeometryY( boardMesh.geometry, -THREEUtils.radian / 2 );

  return boardMesh;
}

export function createSquaresMesh( squareSize, boardSize, boardHeight, squareInfos, materialsArray, squareMaterialIndices, arrowMaterialIndices ) {
  // Create the square prototype
  let squarePrototype = new THREE.Mesh( THREEUtils.createQuad( squareSize, squareSize ) );

  // Internal helper function
  let createSquareArray = function( prototype, boardSize, squareSize ) {
    //console.log( 'CREATE SQUARE ARRAY' );
    let arr = [];
    let yPos = 0,
        xPos = 0;
    for( let y = 0; y < boardSize; ++y ) {
      xPos = 0;
      for( let x = 0; x < boardSize; ++x ) {
        let mesh = prototype.clone();
        //mesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( xPos, 0, yPos ) );
        //console.log( `${x},${y} - ${xPos},${yPos}` );
        mesh.position.set( xPos, yPos, 0 );
        arr.push( mesh );
        xPos += squareSize;
      }
      yPos += squareSize;
    }
    return arr;
  };

  let squareMeshes = createSquareArray( squarePrototype, boardSize, squareSize );

  let arrowSize = squareSize / 4,
      arrowOffset = 5;

  let arrowPrototype = new THREE.Mesh( THREEUtils.createQuad( arrowSize, arrowSize ) );
  // Move the arrow prototype to be in the lower left corner.
  arrowPrototype.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( squareSize - arrowSize - arrowOffset, arrowOffset, 0.5 ) );

  let arrowMeshes = createSquareArray( arrowPrototype, boardSize, squareSize );

  // Combine our meshes.
  let combinedGeometry = new THREE.Geometry();

  let materialIndex = squareMaterialIndices.min;
  let isEven = boardSize % 2 === 0;

  // Add the squares first.
  for( let i = 0; i < squareMeshes.length; ++i ) {
    // Figure out the material index.
    let isNewRow = ( i % boardSize ) === 0;
    //let isOddRow = ( i / boardSize % 2 ) === 1;
    if( isEven && isNewRow ) {
      materialIndex += 2;
    } else {
      materialIndex++;
    }
    if( materialIndex >= squareMaterialIndices.length ) {
      materialIndex -= squareMaterialIndices.length;
    }
    if( materialIndex < squareMaterialIndices.min ) {
      materialIndex = squareMaterialIndices.min;
    }
    squareMeshes[i].updateMatrix();
    combinedGeometry.merge( squareMeshes[i].geometry, squareMeshes[i].matrix, materialIndex );
  }

  // Now add the arrows.
  for( let i = 0; i < arrowMeshes.length; ++i ) {
    arrowMeshes[i].updateMatrix();
    let matIndex = arrowMaterialIndices.min + ArrowDirectionType.getValue( squareInfos[i].direction );
    combinedGeometry.merge( arrowMeshes[i].geometry, arrowMeshes[i].matrix, matIndex );
  }

  combinedGeometry.mergeVertices();

  let meshCombined = new THREE.Mesh( combinedGeometry, new THREE.MeshFaceMaterial( materialsArray ) );
  //meshCombined.add( new THREE.AxisHelper( 20 ) );
  meshCombined.receiveShadow = true;

  THREEUtils.centerGeometryOnAxis( meshCombined.geometry );
  THREEUtils.rotateGeometryX( meshCombined.geometry, -THREEUtils.radian );

  meshCombined.position.set( 0, boardHeight + 1.5, 0 );

  return meshCombined;
}

export function createCheckerMesh( squareSize ) {
  // Create the checker.
  let checkerSize = squareSize / 2 * 0.75;
  let checkerHeight = 2.5;
  let ridgeSize = checkerSize * 0.2;
  let checkerPoints = [];
  checkerPoints.push( new THREE.Vector3( 0,                       0, checkerHeight ) );
  checkerPoints.push( new THREE.Vector3( checkerSize - ridgeSize, 0, checkerHeight ) );
  checkerPoints.push( new THREE.Vector3( checkerSize - ridgeSize, 0, checkerHeight + ridgeSize ) );
  checkerPoints.push( new THREE.Vector3( checkerSize,             0, checkerHeight + ridgeSize ) );
  checkerPoints.push( new THREE.Vector3( checkerSize,             0, 0 ) );
  checkerPoints.push( new THREE.Vector3( 0,                       0, 0 ) );

  // Need to get a more interesting material for the future.
  let material = new THREE.MeshLambertMaterial( { color: 0xFF4040 } );

  let geo = new THREE.LatheGeometry( checkerPoints, 24 );
  THREEUtils.flipGeometryFaces( geo );

  let mesh = new THREE.Mesh( geo, material );
  mesh.castShadow = mesh.receiveShadow = true;

  THREEUtils.rotateGeometryX( mesh.geometry, -THREEUtils.radian );

  mesh.simObject = true;

  return mesh;
}

export function createPathVisualizationMeshes( path, squareSize, boardHeight, segmentHeight, segmentWidth, markerRadius, markerHeight, pathMaterial, pathEdgeColor ) {

  // Initialize pathBSP with the starting marker.
  let pathBSP = createPathMarkerBSP( path.points.cursor.position, markerRadius, markerHeight, path.points.cursor.direction );

  let BSPs = [];

  for( let i = 0; i < path.points.length; ++i ) {
    let point = path.points[i];
    if( i === path.points.length - 1 ) {
      if( !path.isLoop ) {
        // Draw the exit.
        let directionalVector = new THREE.Vector3();
        switch( point.direction ) {
          case ArrowDirectionType.up:
            directionalVector.x = squareSize;
            break;
          case ArrowDirectionType.right:
            directionalVector.z = squareSize;
            break;
          case ArrowDirectionType.down:
            directionalVector.x = -squareSize;
            break;
          case ArrowDirectionType.left:
            directionalVector.z = -squareSize;
            break;
        }
        directionalVector.add( point.position );
        BSPs.push( createPathExitBSP( point.position, directionalVector, segmentHeight, segmentWidth * 2 ) );
      } else if( point !== point.next.previous ) {
        BSPs.push( createPathSegmentBSP( point.position, point.next.position, segmentHeight, segmentWidth ) );
      }
    } else {
      BSPs.push( createPathSegmentBSP( point.position, point.next.position, segmentHeight, segmentWidth ) );
      BSPs.push( createPathMarkerBSP( point.next.position, markerRadius, markerHeight, point.direction ) );
    }
  }

  // Combine all the BSPs we've generated.
  for( let i = 0; i < BSPs.length; ++i ) {
    pathBSP = pathBSP.union( BSPs[i] );
  }

  let mesh = new THREE.Mesh( pathBSP.toGeometry(), pathMaterial );
  mesh.geometry.computeFaceNormals();

  let meshEdges = new THREE.EdgesHelper( mesh, pathEdgeColor );
  meshEdges.material.linewidth = 2;

  // In following walking the path, we changed the current
  // point. Reset it back to the beginning.
  path.reset();

  return [ mesh, meshEdges ];
}

function createPathMarkerBSP( position, markerRadius, markerHeight, direction ) {
  let geo = new THREE.CylinderGeometry( markerRadius, markerRadius, markerHeight, 16 );
  THREEUtils.moveGeometry( geo, position );
  return new ThreeBSP( geo );
}

function createPathSegmentBSP( startPosition, endPosition, segmentHeight, segmentWidth ) {
  let distanceVector = new THREE.Vector3( endPosition.x - startPosition.x,
    endPosition.y - startPosition.y,
    endPosition.z - startPosition.z );
  let radians = Math.atan2( distanceVector.x, distanceVector.z );
  let length = distanceVector.length();

  let geo = new THREE.BoxGeometry( segmentWidth, segmentHeight, length );

  let newOrigin = THREEUtils.getGeometryMidPoint( geo );
  newOrigin.z = geo.boundingBox.max.z;

  THREEUtils.moveGeometry( geo, newOrigin );
  THREEUtils.rotateGeometryZ( geo, -THREEUtils.radian );
  THREEUtils.rotateGeometryY( geo, radians );
  THREEUtils.moveGeometry( geo, startPosition );

  return new ThreeBSP( geo );
}

function createPathExitBSP( position, directional, segmentHeight, segmentWidth ) {
  const headSize = 10;

  let distanceVector = new THREE.Vector3( directional.x - position.x,
    directional.y - position.y,
    directional.z - position.z );
  let radians = Math.atan2( distanceVector.x, distanceVector.z );
  let length = distanceVector.length();

  let shape = new THREE.Shape();
  shape.moveTo( 0,                 0 );
  shape.lineTo( 0,                 segmentWidth );
  shape.lineTo( length - headSize, segmentWidth );
  shape.lineTo( length - headSize, segmentWidth + headSize );
  shape.lineTo( length,            0 );
  shape.lineTo( length - headSize, -segmentWidth - headSize );
  shape.lineTo( length - headSize, -segmentWidth );
  shape.lineTo( 0,                 -segmentWidth );
  shape.lineTo( 0,                 0 );

  // FIX ME: For some reason extruded geo seems to be 4x the thickness of the BoxGeo
  let geo = new THREE.ExtrudeGeometry( shape, { amount: segmentHeight / 4, bevelEnabled: false, bevelThickness: 0, bevelSize: 0 } );

  let newOrigin = THREEUtils.getGeometryMidPoint( geo );
  newOrigin.x = geo.boundingBox.min.x;

  THREEUtils.moveGeometry( geo, newOrigin );
  THREEUtils.rotateGeometryX( geo, -THREEUtils.radian );
  THREEUtils.rotateGeometryY( geo, radians );

  THREEUtils.moveGeometry( geo, position );

  return new ThreeBSP( geo );
}