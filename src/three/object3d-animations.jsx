
import THREE from "three";

import SoundManager from '../audio/sound-manager';
import { GameWorld as GameWorld, GameClock as GameClock } from '../game-world';
import * as THREEUtils from './three-utils';

export const NOT_STARTED = Symbol('notStartedState');
export const UNDERWAY    = Symbol('underwayState');
export const COMPLETE    = Symbol('completeState');

// These define how the queue deals with various
// animation types.
const queueBehavior = {
  KeepNewest    : Symbol( 'keepNewestAnimBehavior' ),
  Single        : Symbol( 'singleAnimBehavior' ),
  Undef         : Symbol( 'undefAnimBehavior')
};

export const animTypes = {
  Fade          : Symbol( 'fadeAnimationType'),
  Movement      : Symbol( 'movementAnimationType'),
  Undef         : Symbol( 'undefAnimationType'),
  toString      : function( value ) {
    switch( value ) {
      case animTypes.Fade:
        return "Fade";
      case animTypes.Movement:
        return "Movement";
      case animTypes.Undef:
        return "Undef";
      default:
        return "Unknown";
    }
  }
};

class Object3dAnimation {
  constructor( object3d, callback ) {
    if( callback !== undefined &&
        typeof callback !== 'function' ) {
      throw "Callback must be a function!";
    }

    this.animType = animTypes.Undef;
    this.queueBehavior = queueBehavior.Undef;
    this.callback = callback;

    this.object3d = object3d;
    this.state = NOT_STARTED;
    this.startTime = 0;
  }

  step() {
    if( this.state === NOT_STARTED ) {
      this.animationStarted();
      this.state = UNDERWAY;
      this.startTime = GameClock.getElapsedTime();
    }
  }

  animationStarted() {

  }

  animationCompleted( sendCallback = true ) {
    if( sendCallback &&
      this.callback !== undefined ) {
      this.callback();
    }
  }
}

export class MovementAnimation extends Object3dAnimation {

  constructor( object3d, startPosition, endPosition, speedSq, soundID, callback ) {
    super( object3d, callback );

    this.animType = animTypes.Movement;
    this.queueBehavior = queueBehavior.Single;

    this.startPosition = startPosition.clone();
    this.endPosition = endPosition.clone();
    this.speedSq = speedSq;
    this.soundID = soundID;
    this.playingSoundID = null;

    this.journeyDistanceSq = startPosition.distanceToSquared( endPosition );
  }

  step() {
    super.step();

    if( this.journeyDistanceSq < 10 ) {
      this.state = COMPLETE;
    } else if( this.state === UNDERWAY ) {
      let alpha = ( this.speedSq * ( GameClock.getElapsedTime() - this.startTime ) ) / this.journeyDistanceSq;
      if( alpha >= 1 ) {
        this.state = COMPLETE;
      } else {
        let newPos = new THREE.Vector3().lerpVectors( this.startPosition, this.endPosition, alpha );
        this.object3d.position.set( newPos.x, newPos.y, newPos.z );
      }
    }

    if( this.state === COMPLETE ) {
      this.animationCompleted();
    }
  }

  animationStarted() {
    super.animationStarted();
    this.playingSoundID = SoundManager.playSoundWithIdAndTime( this.soundID, 0, 0.5 );
  }

  animationCompleted( sendCallback = true ) {
    super.animationCompleted( sendCallback );
    SoundManager.stopSoundWithId( this.playingSoundID );
  }
}

export class FadeAnimation extends Object3dAnimation {
  constructor( object3d, callback ) {
    super( object3d, callback );

    this.animType = Fade.Movement;
    this.queueBehavior = queueBehavior.KeepNewest;
  }

  step() {

  }
}

export class AnimationQueue {
  constructor() {
    this.queue = [];
    this.isMoving = false;
  }

  get length() {
    return this.queue.length;
  }

  clear() {
    this.queue.length = 0;
  }

  add( anim ) {
    if( !( anim instanceof Object3dAnimation ) ) {
      throw "Anim must be of type Object3dAnimation!";
    }

    if( anim.queueBehavior === queueBehavior.KeepNewest ) {
      // Remove other animations of this type.
      for( let i = this.queue.length - 1; i >= 0; --i ) {
        if( this.queue[i].animType === anim.animType ) {
          this.queue.splice( i, 1 );
        }
      }
    }
    this.queue.push( anim );
  }

  removeOfType( animType ) {
    for( let i = this.queue.length - 1; i >= 0; --i ) {
      if( this.queue[i].animType === animType ) {
        this.queue[i].animationCompleted( false /*no callback*/ );
        this.queue.splice( i, 1 );
      }
    }

    if( animType === animTypes.Movement ) {
      this.isMoving = false;
    }
  }

  step() {
    if( this.queue.length === 0 ) {
      return;
    }

    // Assume we aren't moving.
    this.isMoving = false;

    let processedTypes = new Set(),
        culledAnimations = [];

    let anim = null;
    for( let i = 0; i < this.queue.length; ++i ) {
      anim = this.queue[i];
      if( anim.state === COMPLETE ) {
        culledAnimations.push( i );
      } else if( !( anim.queueBehavior === queueBehavior.Single &&
                    processedTypes.has( anim.animType ) ) ) {
        anim.step();
        processedTypes.add( anim.animType );
        if( anim instanceof MovementAnimation ) {
          this.isMoving = true;
        }
      }
    }
    // Clean up the queue.
    culledAnimations.forEach( function ( element ) {
      this.queue.splice( element, 1 );
    }, this );
  }
}