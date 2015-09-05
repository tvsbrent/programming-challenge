"use strict";

import THREE from "three";

import CheckerPath from './util/checker-path';
import Rectangle from './util/rectangle';
import * as ArrowDirectionType from './util/arrow-direction-type';

export default class GameOverlay {

  constructor( boardGutterRect, boardRectangle, squareSize ) {
    this.container = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.screenWidth = 0;
    this.screenHeight = 0;
    this.squareSize = 0;

    this.gameObjects = [];

    this.debugOn = false;
    this.debugObjects = [];

    this.currentPath = null;

    this.boardRectangle = null;

    this.segmentMaterial = null;

    this.capMaterial = null;

    this.checker = null;

    // We are making the render function a member variable, so
    // that we can permanently bind the "this" reference to,
    // well, this. Otherwise, we are having to bind it each
    // time we call requestAnimationFrame, which is resulting
    // in a new function object.
    this.render = ( function( timestamp ) {
      requestAnimationFrame( this.render );
      this.renderer.render( this.scene, this.camera );
    } ).bind( this );

    this.init( boardGutterRect, boardRectangle, squareSize );
  }

  init( boardGutterRect, boardRectangle, squareSize ) {

    this.screenWidth = boardGutterRect.width;
    this.screenHeight = boardGutterRect.height;
    this.squareSize = squareSize;

    this.boardRectangle = boardRectangle;

    this.camera = new THREE.OrthographicCamera( - this.screenWidth / 2, this.screenWidth / 2, this.screenHeight / 2, - this.screenHeight / 2, 1, 10 );
    this.camera.position.z = 10;

    let light = new THREE.PointLight( 0xffffff, 0.8, 5, 2 );
    this.camera.add( light );

    this.scene = new THREE.Scene();

    // Create our container element and position it.
    this.container = document.createElement('div');
    // We don't worry about sizing the container, it will size itself
    // to the size of the canvas.
    this.container.setAttribute( 'style',
      `position: absolute; top: ${boardGutterRect.x}px; left: ${boardGutterRect.y}px; z-index: 10`);
    document.body.appendChild( this.container );

    // renderer
    this.renderer = new THREE.WebGLRenderer( { alpha: true } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.screenWidth, this.screenHeight );
    this.container.appendChild( this.renderer.domElement );

    // Initialize some objects we'll use repeatedly.
    this.segmentMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide, transparent: true } );
    this.segmentMaterial.opacity = 0.5;

    this.capMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );

    let checkerMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, side: THREE.DoubleSide } );
    checkerMaterial.emissive = new THREE.Color( 0xC0C0ff );

    let shape = new THREE.Shape();
    shape.moveTo( 0, 0 );
    shape.absarc( 0, 0, this.squareSize * 0.375, 0, Math.PI*2.1, false );

    this.checker = GameOverlay.createMeshFromShape( shape, new THREE.Vector3( 0, 0, 0 ), 0, checkerMaterial );

    // Kick off the render loop.
    requestAnimationFrame( this.render );
  }

  update( boardGutterRect, boardRectangle ) {

    this.screenWidth = boardGutterRect.width;
    this.screenHeight = boardGutterRect.height;

    this.boardRectangle = boardRectangle;

    this.renderer.setSize( this.screenWidth, this.screenHeight );

    // Update the frustrum of the orthographic camera.
    this.camera.left = - this.screenWidth / 2;
    this.camera.right = this.screenWidth / 2;
    this.camera.top = this.screenHeight / 2;
    this.camera.bottom = - this.screenHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  initSimulation( checkerPath ) {

    if( this.currentPath != null ) {
      return;
    }

    this.currentPath = checkerPath;

    // Update all the positions to Local Space
    this.currentPath.points.forEach( function ( value, index, arr ) {
      value.position = this.convertToBoardSpace( value.position );
    }, this );

/*    let texture1 = new THREE.ImageUtils.loadTexture( 'images/checker.png', undefined, ( function( texture ) {
*//*      let material1 = new THREE.SpriteMaterial( { map: texture } );
      let mesh1 = new THREE.Sprite( material1 );

      let newPos = checkerPath.points.current.position;
      mesh1.position.set( newPos.x, newPos.y, newPos.z );
      mesh1.scale.set( squareSize * 0.75, squareSize * 0.75, 1.0 );*//*

    } ).bind( this ) );*/

    this.addGameObject( GameOverlay.createPathCap( checkerPath.points.current.position, this.squareSize / 4, this.capMaterial ) );

    this.checker.position.set( checkerPath.points.current.position.x, checkerPath.points.current.position.y, checkerPath.points.current.position.z + 0.5 );
    this.scene.add( this.checker );

/*    checkerPath.points.forEach( function( value, index, arr ) {
      if( value.nextPoint != null ) {
        this.addGameObject( GameOverlay.createPathSegment( value.position,
                                                           value.nextPoint.position,
                                                           this.segmentMaterial ) );
        this.addGameObject( GameOverlay.createPathCap( value.nextPoint.position, this.squareSize / 6, capMaterial ) );
      } else {
        if( !checkerPath.isLoop ) {
          let directionalVector = null;
          const magnitude = this.squareSize;
          switch( value.direction ) {
            case ArrowDirectionType.up:
              directionalVector = new THREE.Vector3( 0, magnitude, 0 );
              break;
            case ArrowDirectionType.right:
              directionalVector = new THREE.Vector3( magnitude, 0, 0 );
              break;
            case ArrowDirectionType.down:
              directionalVector = new THREE.Vector3( 0, -magnitude, 0 );
              break;
            case ArrowDirectionType.left:
              directionalVector = new THREE.Vector3( -magnitude, 0, 0 );
              break;
          }
          directionalVector.add( value.position );

          this.addGameObject( GameOverlay.createPathExit( value.position,
                                                          directionalVector,
                                                          this.segmentMaterial ) );
        }
      }
    }, this );*/
  }

  advanceSimulation() {
    let path = this.currentPath;
    if( path.points.current === null ) {
      return;
    }

    if( !path.points.current.segmentDrawn ) {
      this.drawSegment( path.points.current, path.isLoop );
    }

    if( !path.points.current.nextPoint !== null ) {
      // Advance the current point.
      path.points.current = path.points.current.nextPoint;
      // Move the checker to the new current point.
      this.checker.position.set( path.points.current.position.x, path.points.current.position.y, path.points.current.position.z + 0.5 );
    }
  }

  drawSegment( checkerPathPoint, isLoop ) {
    if( checkerPathPoint.nextPoint === null ) {
      if( !isLoop ) {
        // Draw the exit.
        let directionalVector = null;
        const magnitude = this.squareSize;
        switch( checkerPathPoint.direction ) {
          case ArrowDirectionType.up:
            directionalVector = new THREE.Vector3( 0, magnitude, 0 );
            break;
          case ArrowDirectionType.right:
            directionalVector = new THREE.Vector3( magnitude, 0, 0 );
            break;
          case ArrowDirectionType.down:
            directionalVector = new THREE.Vector3( 0, -magnitude, 0 );
            break;
          case ArrowDirectionType.left:
            directionalVector = new THREE.Vector3( -magnitude, 0, 0 );
            break;
        }
        directionalVector.add( checkerPathPoint.position );
        this.addGameObject(
          GameOverlay.createPathExit( checkerPathPoint.position,
                                      directionalVector,
                                      this.segmentMaterial ) );
      }
    } else {
      // Draw a regular path segment.
      this.addGameObject(
        GameOverlay.createPathSegment( checkerPathPoint.position,
                                       checkerPathPoint.nextPoint.position,
                                       this.segmentMaterial ) );
      this.addGameObject(
        GameOverlay.createPathCap( checkerPathPoint.nextPoint.position,
                                   this.squareSize / 6,
                                   this.capMaterial ) );
    }

    checkerPathPoint.segmentDrawn = true;
  }

  resetSimulation() {
    this.currentPath = null;

    this.scene.remove( this.checker );

    this.gameObjects.forEach( ( function( element, index, array ) {
      this.scene.remove( element );
    } ).bind( this ) );
    this.gameObjects.length = 0;
  }

  convertToBoardSpace( position ) {
    return new THREE.Vector3( -( this.boardRectangle.width / 2 ) + position.x, ( this.boardRectangle.height / 2 ) - position.y, position.z )
  }

  toggleDebug() {
    this.debugOn = !this.debugOn;

    if( this.debugOn ) {
      let lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );

      let halfWidth = this.screenWidth / 2;
      let halfHeight = this.screenHeight / 2;

      let line = GameOverlay.createDebugLine( new THREE.Vector3( -halfWidth, 0, 0 ), new THREE.Vector3( halfWidth, 0, 0 ), lineMaterial );
      this.addDebugObject( line );

      line = GameOverlay.createDebugLine( new THREE.Vector3( 0, -halfHeight, 0 ), new THREE.Vector3( 0, halfHeight, 0 ), lineMaterial );
      this.addDebugObject( line );
    } else {
      this.debugObjects.forEach( ( function( element, index, array ) {
        this.scene.remove( element );
      } ).bind( this ) );
      this.debugObjects.length = 0;
    }
  }

  addGameObject( object3d ) {
    this.scene.add( object3d );
    this.gameObjects.push( object3d );
  }

  addDebugObject( object3d ) {
    this.scene.add( object3d );
    this.debugObjects.push( object3d );
  }

  static createDebugLine( start, end, lineMaterial ) {
    let lineGeometry = new THREE.Geometry();
    let vertArray = lineGeometry.vertices;
    vertArray.push( start, end );
    lineGeometry.computeLineDistances();

    return new THREE.Line( lineGeometry, lineMaterial );
  }

  static createPathSegment( start, end, material ) {
    let relativeVector = new THREE.Vector3( end.x - start.x,
                                            end.y - start.y,
                                            0 );
    let radians = Math.atan2( relativeVector.y, relativeVector.x );
    let length = relativeVector.length();

    let offset = 10;

    let segment = new THREE.Shape();

    /*
    segment.moveTo( -offset,          -offset );
    segment.lineTo( -offset,           offset );
    segment.lineTo( length + offset,   offset );
    segment.lineTo( length + offset,  -offset );
    segment.lineTo( -offset,          -offset );
    */

    let radius = 5;

    segment.moveTo( -offset, -offset + radius );
    segment.lineTo( -offset,  offset - radius );
    segment.quadraticCurveTo( -offset, offset, -offset + radius, offset );
    segment.lineTo( length + offset - radius, offset );
    segment.quadraticCurveTo( length + offset, offset, length + offset, offset - radius );
    segment.lineTo( length + offset, -offset + radius );
    segment.quadraticCurveTo( length + offset, -offset, length + offset - radius, -offset );
    segment.lineTo( -offset + radius, -offset );
    segment.quadraticCurveTo( -offset, -offset, -offset, -offset + radius );

    let geometry = new THREE.ShapeGeometry( segment );
    let mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.DoubleSide } ) );
    mesh.position.set( start.x, start.y, start.z );
    mesh.rotation.set( 0, 0, radians );

    return GameOverlay.createMeshFromShape( segment, start, radians, material );
  }

  static createPathExit( start, end, material ) {
    let relativeVector = new THREE.Vector3( end.x - start.x,
                                            end.y - start.y,
                                            0 );
    let radians = Math.atan2( relativeVector.y, relativeVector.x );
    let length = relativeVector.length();

    let offset = 10;

    let segment = new THREE.Shape();
    segment.moveTo( -offset,              -offset );
    segment.lineTo( -offset,               offset );
    segment.lineTo( length,                offset );
    segment.lineTo( length,                offset * 2 );
    segment.lineTo( length + offset * 2,   0 );
    segment.lineTo( length,               -offset * 2 );
    segment.lineTo( length,               -offset );
    segment.lineTo( -offset,              -offset );

    let geometry = new THREE.ShapeGeometry( segment );
    let mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.DoubleSide } ) );
    mesh.position.set( start.x, start.y, start.z );
    mesh.rotation.set( 0, 0, radians );

    return GameOverlay.createMeshFromShape( segment, start, radians, material );
  }

  static createPathCap( position, radius, material ) {
    /*let shape = new THREE.Shape();
    shape.moveTo( 0, 0 );
    // I'm multiplying the end angle by 2.1, as with lower values, I was
    // seeing a missing triangle in the circle.
    shape.absarc( 0, 0, radius, 0, Math.PI * 2.1, false );*/

    let mesh = new THREE.Mesh( new THREE.CircleGeometry( radius, 24 ), material );
    mesh.position.set( position.x, position.y, position.z );
    return mesh;
  }

  static createMeshFromShape( shape, position, rotation, material ) {
    let geometry = new THREE.ShapeGeometry( shape );
    let mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( position.x, position.y, position.z );
    mesh.rotation.set( 0, 0, rotation ); // This is in radians.
    return mesh;
  }

  static createRotatedVector( x, y, z, radians ) {
    x = x * Math.cos( radians ) - y * Math.sin( radians );
    y = x * Math.sin( radians ) - y * Math.cos( radians );
    return new THREE.Vector3( x, y, z );
  };
}