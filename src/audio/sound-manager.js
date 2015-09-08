/**
 * Created by andrew on 3/28/15.
 */

import AudioBufferLoader from './audio-buffer-loader';

class SoundManager {

  constructor() {

  }

  static init( context ) {
    SoundManager.audioContext = context;
    SoundManager.audioSources = [];
    SoundManager.buffers = {};
  }

  static getAudioContext() {
    return SoundManager.audioContext;
  }

  static playSoundWithIdAndTime( id, time = 0, gain = 1 ) {
    let playId = null;

    if( id instanceof Array ) {
      playId = id[Math.floor( Math.random() * id.length )];
    } else {
      playId = id;
    }
    let buffer = SoundManager.buffers[playId];

    if( buffer &&
        SoundManager.audioContext ) {
      SoundManager.playSound( playId, buffer, time, gain );
    }

    return playId;
  }

  static playSound( id = '', buffer, time, gain ) {
    let source = SoundManager.audioContext.createBufferSource();
    source.buffer = buffer;
    source[source.start ? 'start' : 'noteOn']( time );

    let gainNode = SoundManager.audioContext.createGain();
    source.connect( gainNode );

    gainNode.connect( SoundManager.audioContext.destination );
    gainNode.gain.value = gain;
    gainNode.soundId = id;

    SoundManager.audioSources.push( gainNode );
  }
  
  static stopSoundWithId( id ) {
    let count = SoundManager.audioSources.length;

    for( let i = 0; i < count; i++ ) {
      let source = SoundManager.audioSources[i];
      if( source.soundId !== id ) {
        continue;
      }
      try {
        source.gain.exponentialRampToValueAtTime( 0.01, SoundManager.audioContext.currentTime + 0.25 );
      } catch( e ) {
        console.log( "error: " + e );
      }
    }
  }

  static stopAllSounds() {
    let count = SoundManager.audioSources.length;

    for( let i = 0; i < count; i++ ) {
      let source = SoundManager.audioSources[i];
      try {
        //source.stop();
        source.gain.linearRampToValueAtTime( 0, SoundManager.audioContext.currentTime + 0.25 );
      } catch( e ) {
        console.log( "error: " + e );
      }
    }
    SoundManager.audioSources = [];
  }

  static loadSounds( soundMap, callback ) {
    // Array-ify
    let names = [];
    let paths = [];

    for( let name in soundMap ) {
      let path = soundMap[name].path;
      names.push( name );
      paths.push( path );
      //console.log("loadSounds: " + name + ", " + path);
    }

    let bufferLoader = new AudioBufferLoader( SoundManager.audioContext, paths, function ( bufferList ) {
      for( let i = 0; i < bufferList.length; i++ ) {
        let buffer = bufferList[i];
        let name = names[i];
        //console.log("Adding buffer: " + name);
        SoundManager.buffers[name] = buffer;
      }
      if (callback) {
        callback();
      }
    } );

    bufferLoader.load();
  }
}

SoundManager.audioContext = null;
SoundManager.audioSources = null;
SoundManager.buffers = null;

export default SoundManager;

