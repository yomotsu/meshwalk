/**
 * @author mrdoob / http://mrdoob.com/
 */

function EventDispatcher(){}Object.assign(EventDispatcher.prototype,{addEventListener:function(i,e){void 0===this._listeners&&(this._listeners={});var t=this._listeners;void 0===t[i]&&(t[i]=[]),-1===t[i].indexOf(e)&&t[i].push(e)},hasEventListener:function(i,e){if(void 0===this._listeners)return!1;var t=this._listeners;return void 0!==t[i]&&-1!==t[i].indexOf(e)},removeEventListener:function(i,e){if(void 0!==this._listeners){var t=this._listeners[i];if(void 0!==t){var s=t.indexOf(e);-1!==s&&t.splice(s,1)}}},dispatchEvent:function(i){if(void 0!==this._listeners){var e=this._listeners[i.type];if(void 0!==e){i.target=this;for(var t=e.slice(0),s=0,n=t.length;s<n;s++)t[s].call(this,i)}}}});