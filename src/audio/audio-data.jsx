
export const AudioTypes = {
  checkerMove : Symbol( 'checkMoveAudioType' ),
  checkerStop : Symbol( 'checkerStopAudioType' ),
  gui         : Symbol( 'guiAudioType' )
};

export const assets = {
  checkerMove01: {
    path: './audio/checker-move-01.wav',
    type: AudioTypes.checkerMove
  },
  checkerMove02: {
    path: './audio/checker-move-02.wav',
    type: AudioTypes.checkerMove
  },
  checkerMove03: {
    path: './audio/checker-move-03.wav',
    type: AudioTypes.checkerMove
  },
  checkerMove04: {
    path: './audio/checker-move-04.wav',
    type: AudioTypes.checkerMove
  },
  checkerMove05: {
    path: './audio/checker-move-05.wav',
    type: AudioTypes.checkerMove
  },
  checkerMove06: {
    path: './audio/checker-move-06.wav',
    type: AudioTypes.checkerMove
  },
  checkerStop01: {
    path: './audio/checker-stop-01.wav',
    type: AudioTypes.checkerStop
  },
  checkerStop02: {
    path: './audio/checker-stop-02.wav',
    type: AudioTypes.checkerStop
  },
  checkerStop03: {
    path: './audio/checker-stop-03.wav',
    type: AudioTypes.checkerStop
  },
  guiTick01: {
    path: './audio/gui-tick-01.wav',
    type: AudioTypes.gui
  },
  guiTick02: {
    path: './audio/gui-tick-02.wav',
    type: AudioTypes.gui
  },
  guiTick03: {
    path: './audio/gui-tick-03.wav',
    type: AudioTypes.gui
  }
};

export function getSoundIdsByType( audioType ) {
  let soundIds = [];

  for( let id in assets ) {
    if( assets[id].type === audioType ) {
      soundIds.push( id );
    }
  }

/*  Object.getOwnPropertyNames( assets ).forEach( function( key ) {
    if( assets[key].type === audioType ) {
      soundIds.push( key );
    }
  } );*/
  return soundIds;
}