(function() {
        // Capture host references before any artifact code runs: Window.parent
        // is [Replaceable] (a top-level `var parent` in artifact code would
        // replace the accessor with a data property), and a top-level
        // `const crypto` would shadow the global — either would otherwise
        // silently break the bridge for artifacts that worked before.
        const realParent = window.parent;
        const cryptoObj = window.crypto;
        // crypto.randomUUID exists only in Secure Contexts; fall back to a
        // unique non-crypto id elsewhere (http://LAN-IP dev flows) —
        // uniqueness is what the bridge needs, unpredictability is
        // defense-in-depth on top of the source guards.
        const newRequestId =
          cryptoObj && typeof cryptoObj.randomUUID === "function"
            ? function () { return cryptoObj.randomUUID(); }
            : function () { return Date.now() + "-" + Math.random(); };
        const originalConsole = window.console;
        window.console = {
          log: (...args) => {
            originalConsole.log(...args);
            realParent.postMessage({ type: 'console', message: args.join(' ') }, '*');
          },
          error: (...args) => {
            originalConsole.error(...args);
            realParent.postMessage({ type: 'console', message: 'Error: ' + args.join(' ') }, '*');
          },
          warn: (...args) => {
            originalConsole.warn(...args);
            realParent.postMessage({ type: 'console', message: 'Warning: ' + args.join(' ') }, '*');
          }
        };

        // Bridge request ids are crypto-random (not sequential) so they
        // cannot be predicted by other frames in the tab.
        let callbacksMap = new Map();
        let streamControllers = new Map();
        
        window.claude = {
          complete: (prompt) => {
            return new Promise((resolve, reject) => {
              const id = newRequestId();
              callbacksMap.set(id, { resolve, reject });
              realParent.postMessage({ type: 'claudeComplete', id, prompt }, '*');
            });
          }
        };

        window.storage = {
          get: (key, shared = false) => {
            return new Promise((resolve, reject) => {
              const id = newRequestId();
              callbacksMap.set(id, { resolve, reject });
              realParent.postMessage({ type: 'storageGet', id, key, shared }, '*');
            });
          },
          set: (key, value, shared = false) => {
            return new Promise((resolve, reject) => {
              const id = newRequestId();
              callbacksMap.set(id, { resolve, reject });
              realParent.postMessage({ type: 'storageSet', id, key, value, shared }, '*');
            });
          },
          delete: (key, shared = false) => {
            return new Promise((resolve, reject) => {
              const id = newRequestId();
              callbacksMap.set(id, { resolve, reject });
              realParent.postMessage({ type: 'storageDelete', id, key, shared }, '*');
            });
          },
          list: (prefix, shared = false) => {
            return new Promise((resolve, reject) => {
              const id = newRequestId();
              callbacksMap.set(id, { resolve, reject });
              realParent.postMessage({ type: 'storageList', id, prefix, shared }, '*');
            });
          }
        };

        let pendingBlobs = new Map();
        URL.createObjectURL = (blob) => {
          // Store the blob and create an ID and URL for it
          const blobId = `blob-${Date.now()}-${Math.random()}`;
          pendingBlobs.set(blobId, blob);
          return `blob-request://${blobId}`;
        };

        URL.revokeObjectURL = (url) => {
          // Remove the blob from our store
          const blobId = url.replace("blob-request://", "");
          pendingBlobs.delete(blobId);
        };

        const getBlobFromURL = (url) => {
          const blobId = url.replace("blob-request://", "");
          return pendingBlobs.get(blobId);
        };

        // Override global fetch with streaming support
        window.fetch = (url, init = {}) => {
          return new Promise((resolve, reject) => {
            const id = newRequestId();
            const channelId = `fetch-${id}-${Date.now()}`;
            
            callbacksMap.set(id, { 
              resolve: (response) => {
                // Null-body statuses: Response(stream, {status: 204}) throws
                // per the Fetch spec, which would escape this resolver and
                // hang the artifact's await forever.
                if (response.status === 204 || response.status === 205 || response.status === 304) {
                  try {
                    resolve(new Response(null, {
                      status: response.status,
                      statusText: response.statusText,
                      headers: response.headers
                    }));
                  } catch (err) {
                    // Invalid statusText/header bytes can throw here too.
                    reject(new TypeError(
                      'Bridge fetch: unconstructable response (status ' + response.status + ')'
                    ));
                  }
                  return;
                }
                // Create a ReadableStream for the response body
                const stream = new ReadableStream({
                  start(controller) {
                    streamControllers.set(channelId, controller);
                  },
                  cancel() {
                    streamControllers.delete(channelId);
                  }
                });
                
                // Create and return the Response with the stream. Response()
                // requires status in [200, 599]; an opaque/no-cors fetch
                // forwards status 0, which would throw here and escape the
                // resolver, hanging the artifact's await. Surface it as a
                // network-error-shaped rejection instead.
                try {
                  resolve(new Response(stream, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                  }));
                } catch (err) {
                  streamControllers.delete(channelId);
                  reject(new TypeError(
                    'Bridge fetch: unconstructable response (status ' + response.status + ')'
                  ));
                }
              },
              reject,
              channelId
            });
            
            realParent.postMessage({
              type: 'proxyFetch',
              id,
              url,
              init,
              channelId
            }, '*');
          });
        };

        window.addEventListener('message', async (event) => {
          // Only the embedding parent may drive the bridge — sibling and
          // nested frames can also postMessage into this window.
          if (event.source !== realParent) return;
          if (event.data.type === 'takeScreenshot') {
            // Echo the request's nonce so the requester can correlate the
            // reply to ITS request — a reply without the expected nonce
            // (e.g. from a stale pre-remount artifact) is ignored upstream.
            const screenshotNonce = event.data.nonce;
            const rootElement = document.getElementById('artifacts-component-root-html');
            if (!rootElement) {
              realParent.postMessage({
                type: 'screenshotError',
                nonce: screenshotNonce,
                error: new Error('Root element not found'),
              }, '*');
              return;
            }
            // Catch CDN load failures (htmlToImage undefined) and toPng errors
            // so the parent always gets a response instead of hanging forever.
            try {
              const screenshot = await htmlToImage.toPng(rootElement, {
                imagePlaceholder:
                  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjePDgwX8ACOQDoNsk0PMAAAAASUVORK5CYII=",
              });
              realParent.postMessage({
                type: 'screenshotData',
                nonce: screenshotNonce,
                data: screenshot,
              }, '*');
            } catch (err) {
              realParent.postMessage({
                type: 'screenshotError',
                nonce: screenshotNonce,
                error: err instanceof Error ? err : new Error(String(err)),
              }, '*');
            }
          } else if (event.data.type === 'claudeComplete') {
            const callback = callbacksMap.get(event.data.id);
            if (!callback) return;
            if (event.data.error) {
              callback.reject(new Error(event.data.error));
            } else {
              callback.resolve(event.data.completion);
            }
            callbacksMap.delete(event.data.id);
          } else if (event.data.type === 'proxyFetchResponse') {
            const callback = callbacksMap.get(event.data.id);
            if (!callback) return;
            if (event.data.error) {
              callback.reject(new Error(event.data.error));
              callbacksMap.delete(event.data.id);
            } else {
              // Initial response with headers, status, etc.
              callback.resolve({
                status: event.data.status,
                statusText: event.data.statusText,
                headers: event.data.headers
              });
              // Don't delete the callback yet if streaming
              if (!event.data.body) {
                callbacksMap.delete(event.data.id);
              }
            }
          } else if (event.data.type === 'proxyFetchStream') {
            // Handle streaming data chunks
            const controller = streamControllers.get(event.data.channelId);
            if (controller) {
              if (event.data.error) {
                controller.error(new Error(event.data.error));
                streamControllers.delete(event.data.channelId);
              } else if (event.data.done) {
                controller.close();
                streamControllers.delete(event.data.channelId);
                // Clean up the callback
                const callback = Array.from(callbacksMap.entries()).find(
                  ([_, value]) => value.channelId === event.data.channelId
                );
                if (callback) {
                  callbacksMap.delete(callback[0]);
                }
              } else if (event.data.chunk) {
                controller.enqueue(new Uint8Array(event.data.chunk));
              }
            }
          } else if (event.data.type === 'storageGet') {
            const callback = callbacksMap.get(event.data.id);
            if (!callback) return;
            if (event.data.error) {
              callback.reject(new Error(event.data.error));
            } else {
              callback.resolve(event.data.result);
            }
            callbacksMap.delete(event.data.id);
          } else if (event.data.type === 'storageSet') {
            const callback = callbacksMap.get(event.data.id);
            if (!callback) return;
            if (event.data.error) {
              callback.reject(new Error(event.data.error));
            } else {
              callback.resolve(event.data.result);
            }
            callbacksMap.delete(event.data.id);
          } else if (event.data.type === 'storageDelete') {
            const callback = callbacksMap.get(event.data.id);
            if (!callback) return;
            if (event.data.error) {
              callback.reject(new Error(event.data.error));
            } else {
              callback.resolve(event.data.result);
            }
            callbacksMap.delete(event.data.id);
          } else if (event.data.type === 'storageList') {
            const callback = callbacksMap.get(event.data.id);
            if (!callback) return;
            if (event.data.error) {
              callback.reject(new Error(event.data.error));
            } else {
              callback.resolve(event.data.result);
            }
            callbacksMap.delete(event.data.id);
          }
        });

        const originalOpen = window.open;
        window.open = function (url) {
          realParent.postMessage({
            type: "openExternal",
            href: url,
          }, "*");
        };

        window.addEventListener('error', (event) => {
          realParent.postMessage({ type: 'console', message: 'Uncaught Error: ' + event.message }, '*');
        });
      })();

/* ── Niche toggle ── */
function tog(id,pill){
  var sec=document.getElementById('sec-'+id);
  var on=pill.classList.contains('on');
  if(on){pill.classList.remove('on');sec.classList.add('hidden');}
  else{pill.classList.add('on');sec.classList.remove('hidden');}
}

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    var t=document.querySelector(a.getAttribute('href'));
    if(t){window.scrollTo({top:t.getBoundingClientRect().top+window.pageYOffset-68,behavior:'smooth'});}
  });
});

/* ── Load profile photo ── */
async function loadPhoto(){
  var names=['Image 1.jpeg','Image 1.jpg','Image1.jpg','image1.jpg','image_1.jpg','yang.jpg','yang_montesa.jpg','photo.jpg','headshot.jpg','profile.jpg'];
  for(var n of names){
    try{
      var data=await window.fs.readFile(n);
      var bytes=new Uint8Array(data);
      var binary='';
      for(var i=0;i<bytes.length;i++){binary+=String.fromCharCode(bytes[i]);}
      var b64=btoa(binary);
      var src='data:image/jpeg;base64,'+b64;
      // About section photo
      var ap=document.getElementById('aboutPhoto');
      if(ap){ap.src=src;ap.style.display='block';document.getElementById('aboutPlaceholder').style.display='none';}
      // Hero graphic avatar
      var hg=document.getElementById('hgPhoto');
      if(hg){hg.src=src;hg.style.display='block';document.getElementById('hgInitials').style.display='none';}
      return;
    }catch(e){}
  }
}
loadPhoto();

/* ── Testimonial carousel ── */
var car=document.getElementById('tcarousel');
var cards=car.querySelectorAll('.tc');
var dotsEl=document.getElementById('carDots');
for(var i=0;i<cards.length;i++){
  (function(idx){
    var d=document.createElement('button');
    d.className='car-dot'+(idx===0?' active':'');
    d.addEventListener('click',function(){
      var w=cards[0].offsetWidth+22;
      car.scrollTo({left:idx*w,behavior:'smooth'});
    });
    dotsEl.appendChild(d);
  })(i);
}
function scrollTesti(dir){
  var w=cards[0].offsetWidth+22;
  car.scrollBy({left:dir*w,behavior:'smooth'});
}
car.addEventListener('scroll',function(){
  var w=cards[0].offsetWidth+22;
  var idx=Math.round(car.scrollLeft/w);
  document.querySelectorAll('.car-dot').forEach(function(d,i){d.classList.toggle('active',i===idx);});
});
var isDragging=false,startX,scrollStart;
car.addEventListener('mousedown',function(e){isDragging=true;startX=e.pageX;scrollStart=car.scrollLeft;car.style.cursor='grabbing';});
document.addEventListener('mouseup',function(){isDragging=false;car.style.cursor='';});
document.addEventListener('mousemove',function(e){if(!isDragging)return;car.scrollLeft=scrollStart-(e.pageX-startX);});

/* ══ EXPORT ZIP — globally declared on window ══ */
window.exportZip = function exportZip() {
  var btn = document.getElementById('exportZipBtn');
  if (btn) { btn.textContent = '⏳ Preparing…'; btn.disabled = true; }

  /* ── 1. Grab the full HTML of the current page ── */
  var rawHTML = document.documentElement.outerHTML;

  /* ── 2. Extract all <style> blocks → styles.css ── */
  var cssBlocks = [];
  var styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  var match;
  while ((match = styleRe.exec(rawHTML)) !== null) {
    cssBlocks.push(match[1]);
  }
  var cssContent = cssBlocks.join('\n\n');

  /* ── 3. Extract all inline <script> blocks → scripts.js ── */
  var jsBlocks = [];
  var scriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptRe.exec(rawHTML)) !== null) {
    var code = match[1].trim();
    if (code) jsBlocks.push(code);
  }
  var jsContent = jsBlocks.join('\n\n');

  /* ── 4. Build a clean index.html that links the extracted files ── */
  var cleanHTML = rawHTML
    /* remove all style blocks */
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    /* remove all inline script blocks */
    .replace(/<script(?![^>]*src)[^>]*>[\s\S]*?<\/script>/gi, '')
    /* inject stylesheet link right before </head> */
    .replace('</head>', '  <link rel="stylesheet" href="styles.css">\n</head>')
    /* inject script tag right before </body> */
    .replace('</body>', '  <script src="scripts.js"><\/script>\n</body>');

  /* ── 5. Pack into ZIP via JSZip ── */
  var zip = new JSZip();
  zip.file('index.html', cleanHTML);
  zip.file('styles.css', cssContent);
  zip.file('scripts.js', jsContent);

  zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'yang-virtual-solutions-portfolio.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

      if (btn) {
        btn.innerHTML = '✅ Downloaded!';
        btn.disabled = false;
        setTimeout(function() {
          btn.innerHTML = '<span style="font-size:1rem">⬇</span> Download ZIP';
        }, 2500);
      }
    })
    .catch(function(err) {
      console.error('ZIP export failed:', err);
      if (btn) { btn.textContent = '⚠ Error — try again'; btn.disabled = false; }
    });
};
