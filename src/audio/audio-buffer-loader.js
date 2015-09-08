/**
 * Created by andrew on 3/28/15.
 */

class AudioBufferLoader {

  constructor(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = [];
    this.loadCount = 0;
  }

  loadBuffer(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var thisBufferLoader = this;

    request.onload = function () {
      // Asynchronously decode the audio file data in request.response
      //console.log("onLoad: " + index);
      thisBufferLoader.context.decodeAudioData(
        request.response,
        function (buffer) {
          if (!buffer) {
            console.error('error decoding file data: ' + url);
            return;
          }
          thisBufferLoader.bufferList[index] = buffer;
          if (++thisBufferLoader.loadCount == thisBufferLoader.urlList.length)
            thisBufferLoader.onload(thisBufferLoader.bufferList);
        },
        function (error) {
          console.error('decodeAudioData error', error);
        }
      );
    };

    request.onerror = function () {
      console.error('BufferLoader: XHR error');
    };

    request.send();
  }

  load() {
    for (var i = 0; i < this.urlList.length; ++i) {
      //console.log("load: " + this.urlList[i]);
      this.loadBuffer(this.urlList[i], i);
    }
  }
}

export default AudioBufferLoader;
