import THREE from "three";

import SoundManager from './audio/sound-manager';
import Stats from './three/stats.min.js';
import { CheckerPath as CheckerPath, CheckerPathPoint as CheckerPathPoint } from './util/checker-path';
import { WindowResize as WindowResize } from './three/three.windowresize';

import * as ArrowDirectionType from './util/arrow-direction-type';
import * as AudioData from './audio/audio-data';
import * as Object3dAnimations from './three/object3d-animations';
import * as Object3dHelpers from './three/object3d-helpers';
import * as THREEUtils from './three/three-utils';

// using the old require syntax as I'm not sure how to import
// a module that needs to be invoked.
let OrbitControls = require('three-orbit-controls')(THREE);

// Used for timing animations.
export const GameClock = new THREE.Clock();

export default function GameWorld( sizeSquare ) {

  const boardHeight = 6,
        checkerHeight = 10;

  let camera = null,
      container = null,
      controls = null,
      scene = null,
      renderer = null,
      stats = null,
      windowResize = null;

  let boardImageName = 'images/board.jpg',
      arrowImageNames = [
        "images/arrow-up.png",
        "images/arrow-right.png",
        "images/arrow-down.png",
        "images/arrow-left.png"
      ];

  let moveSoundIDs = AudioData.getSoundIdsByType( AudioData.AudioTypes.checkerMove ),
      stopSoundIDs = AudioData.getSoundIdsByType( AudioData.AudioTypes.checkerStop );

  let materials = [],
      squareMaterialIndices = new THREEUtils.MaterialIndices( 0, 13 ), // Increasing the max will provide more square variety.
      arrowMaterialIndices = new THREEUtils.MaterialIndices( squareMaterialIndices.max + 1, squareMaterialIndices.max + arrowImageNames.length ),
      boardMaterialIndices = new THREEUtils.MaterialIndices( arrowMaterialIndices.max + 1 ),
      pathMaterialIndices = new THREEUtils.MaterialIndices( boardMaterialIndices.max + 1 ),
      pathEdgeColor = 0x00ff00;

  let squareSize = sizeSquare,
      boardSize = 5,
      squareInfos = [],
      currentPath = null;

  let checkerObject = null,
      checkerSpeedSq = ( squareSize * squareSize ); // How much of a square to cover per second, squared.

  let worldObjects = [],
      simObjects = [],
      debugObjects = [];

  let debugOn = false,
      isSimulationPlaying = false;

  let cameraSettings = {
    SCREEN_WIDTH    : window.innerWidth,
    SCREEN_HEIGHT   : window.innerHeight,
    VIEW_ANGLE      : 60,
    ASPECT          : window.innerWidth / window.innerHeight,
    NEAR            : 0.1,
    FAR             : 10000
  };

  let controlSettings = {
    MIN_POLAR_ANGLE : THREE.Math.degToRad( 10 ),
    MAX_POLAR_ANGLE : THREE.Math.degToRad( 60 )
  };

  init();

  function init() {

    // DOM CONTAINER
    container = document.createElement( 'div' );
    // We don't worry about sizing the container, it will size itself
    // to the size of the canvas.
    container.setAttribute( 'style',
      `position: absolute; top: 0px; left: 0px; z-index: -1`);
    document.body.appendChild( container );

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.PerspectiveCamera( cameraSettings.VIEW_ANGLE, cameraSettings.ASPECT, cameraSettings.NEAR, cameraSettings.FAR);
    scene.add( camera );
    camera.position.set( 0, 6 * squareSize, 7 * squareSize );
    camera.lookAt( scene.position );

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( cameraSettings.SCREEN_WIDTH, cameraSettings.SCREEN_HEIGHT );
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    renderer.physicallyBasedShading = true;

    container.appendChild( renderer.domElement );

    // CONTROLS
    controls = new OrbitControls( camera );
    controls.minPolarAngle  = controlSettings.MIN_POLAR_ANGLE;
    controls.maxPolarAngle  = controlSettings.MAX_POLAR_ANGLE;
    controls.rotateSpeed = 0.2;
    controls.minDistance = 2 * squareSize;
    controls.maxDistance = 11 * squareSize;
    controls.noPan = true;
    controls.noKeys = true;

    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    stats.domElement.style.visibility = 'hidden';
    container.appendChild( stats.domElement );

    // LIGHTS
    let light = new THREE.DirectionalLight(0xffffff);
    light.position.set( 0, 150, 100 );
    light.castShadow = true;
    scene.add( light );

    let light2 = new THREE.AmbientLight(0x444444);
    scene.add( light2 );

    // SKYBOX
    scene.add( createSkybox( true /* simple */ ) );

    loadMaterials();

    windowResize = new WindowResize( renderer, camera );

    // Create the checker, which we will reuse.
    checkerObject = Object3dHelpers.createCheckerMesh( squareSize );
    checkerObject.position.set( 0, checkerHeight, 0 );
    checkerObject.animationQueue = new Object3dAnimations.AnimationQueue();

    // Throwing in an arbitrary delay for the moment, to allow
    // time for the materials to load.
    setTimeout( function() {
      // Kick off the render loop.
      window.requestAnimationFrame( animate );
    }, 100 );
  }

  function loadMaterials() {
    // Init the arrays. We do this so that there is at least some valid
    // while the images are being loaded.
    // Make sure to add them to the materials array in the order that their indexes are arranged.
    // Currently this is squares, arrows, board, path.
    for( let i = 0; i < squareMaterialIndices.length; ++i ) {
      let mat = new THREE.MeshLambertMaterial( { color: i % 2 === 0 ? 0xffffff : 0xffD0D0, map: new THREE.Texture() } );
      mat.name = "square" + i + ( i % 2 === 0 ? " (even)" : " (odd)" );
      materials.push( mat );
    }
    for( let i = 0; i < arrowMaterialIndices.length; ++i ) {
      let mat = new THREE.MeshBasicMaterial( { color: 0xffffff, map: new THREE.Texture(), transparent: true } );
      mat.name = "arrow" + i;
      materials.push( mat );
    }
    for( let i = 0; i < boardMaterialIndices.length; ++i ) {
      let mat = new THREE.MeshLambertMaterial( { color: 0xB0B0B0, map: new THREE.Texture() } );
      mat.name = "board" + i;
      materials.push( mat );
    }
    for( let i = 0; i < pathMaterialIndices.length; ++i ) {
      let mat = new THREE.MeshBasicMaterial( { color: 0x80ff80, transparent: true } );
      mat.opacity = 0.75;
      mat.name = "path" + i;
      materials.push( mat );
    }

    // Now actually load the images
    let loader = new THREE.ImageLoader();

    // The board and squares share the same image
    loader.load( boardImageName, function( image ) {
      for( let i = boardMaterialIndices.min; i <= boardMaterialIndices.max; ++i ) {
        materials[i].map.image = image;
        materials[i].map.wrapS = materials[i].map.wrapT = THREE.RepeatWrapping;
        materials[i].map.repeat.set( 2, 2 );
        materials[i].map.needsUpdate = true;
      }

      let initSquareTexture = function( texture, image, index, flipY ) {
        texture.image = image;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 0.25, 0.25 );
        texture.offset.set( ( index / 2 ) * 0.1, ( index / 2 ) * 0.1 );
        texture.flipY = flipY;
        texture.needsUpdate = true;
      };

      for( let i = squareMaterialIndices.min; i <= squareMaterialIndices.max; ++i ) {
        // We flip every other texture, to create variety.
        initSquareTexture( materials[i].map, image, i, i % 2 === 0 );
      }
    } );

    let arrowIndex = arrowMaterialIndices.min;
    arrowImageNames.forEach( function ( element ) {
      loader.load( element, (
        function( index ) {
          return function( image ) {
            materials[index].map.image = image;
            materials[index].map.wrapS = materials[index].map.wrapT = THREE.RepeatWrapping;
            materials[index].map.needsUpdate = true;
          }
        } )( arrowIndex ) );
      arrowIndex++;
    } );
  }

  function createSkybox( simple ) {
    let skyBox = null;
    if( simple ) {
      let skyBoxGeometry = new THREE.BoxGeometry( 5000, 5000, 5000 );
      let skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x101010, side: THREE.BackSide } );
      skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    } else {
      let urlPrefix = './images/skybox/';
      let urls = [
        urlPrefix + 'posX.jpg', urlPrefix + 'negX.jpg',
        urlPrefix + 'posY.jpg', urlPrefix + 'negY.jpg',
        urlPrefix + 'posZ.jpg', urlPrefix + 'negZ.jpg'
      ];

      let materialArray = [];
      for( var i = 0; i < 6; ++i ) {
        materialArray.push( new THREE.MeshBasicMaterial( {
          map: THREE.ImageUtils.loadTexture( urls[i] ),
          side: THREE.BackSide
        } ) );
      }
      skyBox = new THREE.Mesh( new THREE.BoxGeometry( 5000, 5000, 5000 ),
               new THREE.MeshFaceMaterial( materialArray ) );
    }
    return skyBox;
  }

  function createNewBoard( size ) {
    if( size != undefined ) {
      boardSize = size;
    }

    stopSimulation();

    // Get rid of the old infos.
    squareInfos.length = 0;

    // Do an initial pass to create the square info array elements.
    let maxSquares = boardSize * boardSize;
    for( let i = 0; i < maxSquares; ++i ) {
      squareInfos.push( new SquareInfo( null, ArrowDirectionType.getRandom() ) );
    }
    // Do a second pass to link the infos and set the position
    let index = 0;
    let halfSquareSpace = ( boardSize * squareSize ) / 2;
    let halfSquareSize = squareSize / 2;
    for( let z = 0; z < boardSize; ++z ) {
      for( let x = 0; x < boardSize; ++x ) {
        // Calculate where the square will be positioned.
        squareInfos[index].position = new THREE.Vector3( x * squareSize - halfSquareSpace + halfSquareSize,
                                                         checkerHeight - 0.75,
                                                         z * -squareSize + halfSquareSpace - halfSquareSize );
        // console.log( `${index} x:${x} z:${z} - ${squareInfos[index].position.x}, ${squareInfos[index].position.y}, ${squareInfos[index].position.z} - ${squareInfos[index].direction.toString()}` );
        // get the index of the square the arrow points to.
        let targetIndex = null;
        switch( squareInfos[index].direction ) {
          case ArrowDirectionType.up:
            targetIndex = z + 1 >= boardSize ? null : index + boardSize;
            break;
          case ArrowDirectionType.right:
            targetIndex = x + 1 >= boardSize ? null : index + 1;
            break;
          case ArrowDirectionType.down:
            targetIndex = z === 0 ? null : index - boardSize;
            break;
          case ArrowDirectionType.left:
            targetIndex = x === 0 ? null : index - 1;
            break;
        }
        if( targetIndex >= 0 && targetIndex < maxSquares ) {
          squareInfos[index].targetIndex = targetIndex;
        }
        index++;
      }
    }

    destroySimObjects();
    destroyWorldObjects();

    addWorldObject( Object3dHelpers.createBoardMesh( squareSize, boardSize, boardHeight, materials[boardMaterialIndices.min] ) );
    addWorldObject( Object3dHelpers.createSquaresMesh( squareSize, boardSize, boardHeight, squareInfos, materials, squareMaterialIndices, arrowMaterialIndices ) );
  }

  function startNewSimulation() {
    if( squareInfos.length === 0 ) {
      throw "No square infos!";
    }

    //console.log( 'NEW SIMULATION' );

    // remove sim objects from the scene.
    stopSimulation();
    destroySimObjects();

    currentPath = new CheckerPath();
    // Get a random point to start at.
    let index = Math.floor( Math.random() * boardSize * boardSize );
    // Follow that point through to its end.
    while( true ) {
      if( index === null ) {
        break;
      } else if( currentPath.hasPoint( squareInfos[index].position ) ) {
        currentPath.isLoop = true;

        // Iterate over the currIndex array and try to find
        // the existing point. Going backwards because it is
        // likely an element at the end of the array.
        for( let i = currentPath.points.length - 1; i >= 0; --i ) {
          if( currentPath.points[i].squareInfo === squareInfos[index ] ) {
            currentPath.points[currentPath.points.length - 1].next = currentPath.points[i];
            break;
          }
        }
        break;
      }

      let point = new CheckerPathPoint();
      point.squareInfo = squareInfos[index];

      //console.log( `${index} ${squareInfos[index].targetIndex}` );

      currentPath.addPoint( point );

      index = squareInfos[index].targetIndex;
    }

    const markerInfo = {
      radius: squareSize / 4,
      height: squareSize / 20
    };

    const segmentInfo = {
      width: squareSize / 8,
      height: squareSize / 25
    };

    addSimObject(
      Object3dHelpers.createPathVisualizationMeshes( currentPath,
                                                     squareSize,
                                                     boardHeight,
                                                     segmentInfo.width,
                                                     segmentInfo.height,
                                                     markerInfo.radius,
                                                     markerInfo.height,
                                                     materials[pathMaterialIndices.min],
                                                     pathEdgeColor ) );

    let point = currentPath.jumpTo( false /* jump to beginning */);

    // ADD THE CHECKER
    checkerObject.animationQueue.clear();
    checkerObject.position.set( point.x,
                                checkerHeight,
                                point.z );
    addSimObject( checkerObject );
  }

  function addSimObject( object3d ) {
    const _add = function( object3d ) {
      scene.add( object3d );
      simObjects.push( object3d );
    };

    if( object3d instanceof Array ) {
      object3d.forEach( function( element ) {
        _add( element );
      } );
    } else {
      _add( object3d );
    }
  }

  function destroySimObjects() {
    simObjects.forEach( function( element ) {
      scene.remove( element );
    } );
    simObjects.length = 0;
  }

  function addWorldObject( object3d ) {
    scene.add( object3d );
    worldObjects.push( object3d );
  }

  function destroyWorldObjects() {
    worldObjects.forEach( function( element ) {
      scene.remove( element );
    } );
    worldObjects.length = 0;
  }

  function toggleDebug() {
    debugOn = !debugOn;
    if( debugOn ) {
      stats.domElement.style.visibility = 'visible';

      let axis = new THREE.AxisHelper( squareSize );
      axis.position.set( 0, checkerHeight, 0 );
      debugObjects.push( axis );
      scene.add( axis );

      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;

    } else {
      stats.domElement.style.visibility = 'hidden';
      debugObjects.forEach( function ( element ) {
        scene.remove( element );
      } );
      debugObjects.length = 0;

      controls.minPolarAngle = controlSettings.MIN_POLAR_ANGLE;
      controls.maxPolarAngle = controlSettings.MAX_POLAR_ANGLE;
    }
  }

  function movementAnimationComplete() {
    currentPath.advanceQueue();
    if( isSimulationPlaying ) {
      isSimulationPlaying = stepSimulation( false /* step forward */ );
    }
  }

  function jumpSimulation( jumpToEnd ) {
    stopSimulation();

    // Move the checker to the new position.
    let point = currentPath.jumpTo( jumpToEnd );
    checkerObject.position.set( point.x, point.y, point.z );

    SoundManager.playSoundWithIdAndTime( stopSoundIDs, 0, 0.5 );
  }

  function stepSimulation( isBackward ) {
    if( currentPath === null ) {
      // leave early here, because this is an error state.
      return false;
    }

    let willMove = true;
    let startPosition = null;
    let segment = currentPath.getNextSegment( isBackward );

    if( segment === null || segment === undefined ) {
      willMove = false;
    } else {
      startPosition = segment.start;
      if( !checkerObject.animationQueue.isMoving ) {
        startPosition = checkerObject.position;
        // see if we are "close enough" to the target point. If so,
        // just advance to the next one.
        if( startPosition.distanceToSquared( segment.end ) < 10 ) {
          // We're there! Go forward one more.
          currentPath.advanceQueue();
          segment = currentPath.getNextSegment( isBackward );
          if( segment === null ||
            segment === undefined ) {
            willMove = false;
          }
          startPosition = segment.start;
        }
      }
    }

    if( willMove ) {
      let anim = new Object3dAnimations.MovementAnimation( checkerObject,
                                                           startPosition,
                                                           segment.end,
                                                           checkerSpeedSq,
                                                           moveSoundIDs,
                                                           movementAnimationComplete );
      checkerObject.animationQueue.add( anim );
    } else if( !checkerObject.animationQueue.isMoving ) {
      SoundManager.playSoundWithIdAndTime( stopSoundIDs );
    }
    return willMove;
  }

  function stopSimulation() {
    if( currentPath === null ) {
      return;
    }

    isSimulationPlaying = false;

    checkerObject.animationQueue.removeOfType( Object3dAnimations.animTypes.Movement );
    currentPath.stopQueue();
  }

  function playSimulation() {
    isSimulationPlaying = true;
    stepSimulation( false /* step forward */ );
  }

  // Animation Loop Functions

  function animate( timestamp ) {
    requestAnimationFrame( animate );
    render( timestamp );
    update( timestamp );
  }

  function update( timestamp ) {
    if( debugOn ) {
      stats.update();
    }

    // Process the animation queue.
    simObjects.forEach( function( element ) {
      if( element.animationQueue === undefined ) {
        return;
      }
      element.animationQueue.step();
    }, this );
  }

  function render( timestamp ) {
    renderer.render( scene, camera );
  }

  return {
    toggleDebug:            toggleDebug,
    createNewBoard:         createNewBoard,
    startNewSimulation:     startNewSimulation,
    jumpSimulation:         jumpSimulation,
    stepSimulation:         stepSimulation,
    playSimulation:         playSimulation,
    stopSimulation:         stopSimulation
  };

}

class SquareInfo {
  constructor( position, direction ) {
    this.position = position;
    this.direction = direction;
    this.targetIndex = null;
  }
}