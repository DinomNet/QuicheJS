/**
 * QuicheJS by Dinom
 * Version: v1.0.3
 * Official Repository: https://github.com/DinomNet/QuicheJS/
 * 
 * MIT License
 * 
 * Copyright (c) 2024, github.com/Chefaroon
 * 
 * Permission is hereby granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

!(function(_global,undefined){
	function QuicheJS(opts){
		// Private variables
			var __={
				'cache':false, // Used if Cache API is supported and selected
				'online':false,
				'support':{
					'ls':false,
					'cache':false
				},
				'networkChecked':false,
				'loading':false,
				'loaded':false
			};

		// Public options
			var cfg={
				'debug': false,
				'onlineCheckTimeout': 1500, // 1.5 seconds
				'checkForUpdates': true, // Should QuicheJS check each resource for updates
				'storage': 'cache', // Preferred storage type. Supported: 'cache', 'local'/'localStorage' (localStorage)
				'namespace': 'quiche' // Namespace to be used for storing data
			};

		// Private methods
			function invalidOptions(){
				console.error('Invalid options passed to QuicheJS constructor.');
				console.warn('QuicheJS uses an object for options. Please check the documentation for supported options');
				return;
			}

			// Function to normalize storage option and ensure it is set to a supported value
			function normalizeStorageVar(){
				var s=cfg.storage.toLowerCase();
				if(['local','localstorage', 'ls'].includes(s)){cfg.storage='local';}

				if(!['cache','local'].includes(cfg.storage)){
					console.error('Invalid storage option passed to QuicheJS constructor.');

					if(__.support.cache){
						console.warn('Defaulting storage to "cache"');
						cfg.storage='cache';
						return;
					}

					if(__.support.ls){
						console.warn('Defaulting storage to "localStorage"');
						cfg.storage='local';
						return;
					}
				}
			}

			function parsePasssedOptions(opts){
				// Ensure opts is an object and it is not empty
				if(typeof opts!=='object'||Object.keys(opts).length<1){return invalidOptions();}

				for(var o in opts){
					if(!cfg.hasOwnProperty(o)){
						return invalidOptions();
					}
					cfg[o]=opts[o];
				}

				// Normalize storage option
				normalizeStorageVar();
			}

			// Check if Cache API is supported
			function Cache_Supported(){
				try{return 'caches' in window;}
				catch(e){return false;}
			}

			// Check if LocalStorage is supported
			function LS_Supported(){
				try{
					localStorage.setItem('lstest', 'lstest');
					localStorage.removeItem('lstest');
					return true;
				}
				catch(e){return false;}
			}

			// Check if device is online
			async function isOnline(){
				// Once triggered, no need to check again
				__.networkChecked=true;

				// If updates are disabled, no need to check online state
				if(cfg.checkForUpdates===false){return true;}

				if(!navigator||!navigator.onLine){return false;}

				let requestController=new AbortController();
				let timeoutID=setTimeout(()=>requestController.abort(), cfg.onlineCheckTimeout);
				try{
					let resp=await Promise.race([
						fetch("https://www.google.com/generate_204",{
							method:"HEAD",
							mode:"no-cors",
							cache:"no-store",
							signal:requestController.signal
						})
					]);
					clearTimeout(timeoutID);
					return resp.type==='opaque'||resp.ok;
				}
				catch(e){return false;}
			}

			// Open Cache API stores
			async function initCacheAPI(){
				__.cache={
					'file': await caches.open(cfg.namespace+'_files'),
					'tag': await caches.open(cfg.namespace+'_tags'),
					'label_file': cfg.namespace+'_files',
					'label_tag': cfg.namespace+'_tags',
				};
			}

			async function constructor(opts){
				// Set a breakpoint to allow code to await QuicheJS to be fully loaded
				__.loading=new Promise((r)=>{this.__LoadingProcess=r;});

				// If options are passed - attempt to parse them
				if(opts){parsePasssedOptions(opts);}

				__.support.cache=Cache_Supported();
				__.support.ls=LS_Supported();

				if(!__.support.ls && !__.support.cache){
					console.error('Both LocalStorage and Cache API are not supported on this device. QuicheJS cannot be used.');
					return false;
				}

				// If Cache API is selected and supported - Directly prepare Cache object
				if(cfg.storage==='cache' && __.support.cache){await initCacheAPI();}

				// Check if device is online
				try{
					if(await isOnline()){
						__.online=true;
						return true;
					}

					if(cfg.debug){console.warn('Online check timed out. Device is offline');}
					return false;
				}
				finally{
					if(cfg.debug){
						console.log("QuicheJS loaded: \n\t"+
							'Debug:', cfg.debug,
							"\n\t"+
							'LocalStorage support:', __.support.ls,
							"\n\t"+
							'Cache API support:', __.support.cache,
							"\n\t"+
							'Device online: ', __.online,
							"\n\t"+
							'Check for updates: ', cfg.checkForUpdates,
							"\n\t"+
							'Storage: ', cfg.storage,
							"\n\t"+
							'Namespace: ', cfg.namespace
						);
					}

					__.loaded=true;
					// Resolve the Loading Promise to allow waiting functions to proceed
					this.__LoadingProcess();
				}
			};

			// Generate SHA-256 hash from a string
			async function sha256(s){
				return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
			}

			// Function creating elements in the DOM, using an object with {type, content, name* (font) }
			function renderItem(item){
				switch(item.type){
					case 'js':
						var s=document.createElement('script');
						s.innerHTML=item.content;
						document.head.appendChild(s);
						break;

					case 'css':
						var s=document.createElement('style');
						s.innerHTML=item.content;
						document.head.appendChild(s);
						break;

					case 'font':
						var fontURL=URL.createObjectURL(item.content);
						var s=document.createElement('style');
						s.innerHTML=`@font-face{font-family: "${item.name}";src: url(${fontURL});}`;
						document.head.appendChild(s);
						break;

					default:
						if(cfg.debug){
							console.error('Resource type "'+item.type+'" cannot be directly rendered. Consider using get() instead.');
						}
				}
			}

			// Namespace a resource
			function NamespaceIt(n){return cfg.namespace+'::'+n;}

			// Check Cache/localStorage for resource, returns hash of the version
			async function check(res){
				switch(cfg.storage){
					case 'local':
						// Check localStorage for the item and its version
						var item=localStorage.getItem(NamespaceIt(res));
						var v=JSON.parse(localStorage.getItem(NamespaceIt(res)+'::V'));
						if(item && v && v.hasOwnProperty('ver') ){return v.ver;}

						return false;
					case 'cache':
						// Check Cache API for the item and its version
						var item=await __.cache.file.match(res);
						var v=await __.cache.tag.match(res);
						if(v && v.status==200){
							v=await v.text();
							if(v){v=JSON.parse(v);}
						}
						if(item && v && v.hasOwnProperty('ver')){return v.ver;}

						return false;
				}
			}

			// Fetch headers of an item and return its SHA256 hash
			async function getHeadersHash(url){
				try{
					let f=await fetch(url,{method:'HEAD'});
					if(!f.ok){throw new Error(`HTTP error! status: ${f.status}`);}
	
					return sha256(f.headers.get('Last-Modified')+f.headers.get('ETag')).then(h=>{
						return h;
					});
				}
				catch(e){
					console.error('Error checking headers for '+url+':', e);
					return false;
				}
			}

			// Download an item and return its SHA256 hash along with its content
			async function download(url, type){
				if(cfg.debug){console.log('Downloading '+url);}
				try{
					let f=await fetch(url);
					if(!f.ok){
						console.error('HTTP error downloading '+url);
						throw new Error(`HTTP error! status: ${f.status}`);
					}

					switch(type){
						case 'js':
						case 'css':
						case 'text':
							var file=await f.text();
							break;
						case 'font':
						case 'img':
						case 'blob':
							var file=await f.blob();
							break;
					}

					return{
						'hash':await sha256(f.headers.get('Last-Modified')+f.headers.get('ETag')),
						'file':file
					}
				}
				catch(e){
					console.error('Error downloading '+url+':', e);
					return false;
				}
			}

			// Convert string/binary/etc to safe JSON
			function serialize(d){
				if(d instanceof Blob){
					return d.arrayBuffer().then(buffer=>{
						return JSON.stringify({'__blob':true, 'type':d.type, 'data':Array.from(new Uint8Array(buffer))});
					});
				}

				return JSON.stringify(d,(k,v)=>{
					if(v instanceof ArrayBuffer){return new Uint8Array(v);}
					return v;
				});
			}

			// Convert data back to original format
			function unserialize(d){
				const parsed=JSON.parse(d);
				if(parsed.__blob){
					return new Blob([new Uint8Array(parsed.data)],{'type':parsed.type});
				}

				return JSON.parse(d,(k,v)=>{
					if(Array.isArray(v)&&v.every(x=>typeof x==='number')){return new Uint8Array(v).buffer;}
					return v;
				});
			}

			// Store item in Cache/localStorage, returns content and type
			async function store(res, content, version, type){
				switch(cfg.storage){
					case 'local':
						localStorage.setItem(
							NamespaceIt(res),
							await serialize(content)
						);
						localStorage.setItem(
							NamespaceIt(res+'::V'),
							JSON.stringify({'type':type, 'ver':version})
						);
					break;
					case 'cache':
						await __.cache.file.put(res, new Response(content, {
							'headers': {'type': (typeof content==='string')?'text':'blob'}
						}));
						await __.cache.tag.put(res,
							new Response(JSON.stringify({'type':type,'ver':version}))
						);
						break;
				}
				return {'content': content, 'type': type};
			}

			// Shorthand function to download and store an item
			// Used by cache() and load()
			// Returns {content, type} object
			async function downloadAndStore(url, type){
				return await download(url, type).then(({hash, file})=>{
					// Ensure download was successful to avoid creating empty cache objects
					if(!hash || !file){return false;}

					return store(url, file, hash, type).then((s)=>{
						if(cfg.debug){console.log('Downloaded and stored. Version: '+hash);}
						return s;
					});
				});
			}

			// Retrieve items from Cache/localStorage
			async function getFromStorage(url){
				switch(cfg.storage){
					case 'local':
						// Check localStorage for the item and its version
						var item=localStorage.getItem(NamespaceIt(url));
						var v=JSON.parse(localStorage.getItem(NamespaceIt(url)+'::V'));
						if(item && v && v.hasOwnProperty('type')){
							return {
								'type': v.type,
								'content': await unserialize(item)
							};
						}

						return false;
					case 'cache':
						// Check Cache API for the item and its version
						var item=await __.cache.file.match(url);
						var v=await __.cache.tag.match(url);
						if(v && v.status==200){
							v=await v.text();
							if(v){v=JSON.parse(v);}
						}
						if(item && v && v.hasOwnProperty('type')){
							switch(item.headers.get('type')){
								case 'text':
									var file=await item.text();
									break;
								case 'blob':
									var file=await item.blob();
									break;
								default:
									console.error('no header found');
							}
							return{
								'type': v.type,
								'content': file
							};
						}
						return false;
				}
			}

			// Clean Cache storage
			async function cleanCacheStorage(){
				await caches.delete(__.cache.label_tag);
				await caches.delete(__.cache.label_file);
				await initCacheAPI();
			}

			// Clean localStorage
			function cleanLocalStorage(){
				// Remove items from localStorage starting with cfg.namespace+'::'
				for(var i=0;i<localStorage.length;i++){
					var k=localStorage.key(i);
					if(k.startsWith(cfg.namespace+'::')){localStorage.removeItem(k);}
				}
			}

		// Public Methods
			async function load(list){
				if(!Array.isArray(list)){
					console.error('load() requires an array of at least one object.');
					return false;
				}

				// Ensure the library has loaded before proceeding
				if(!__.loaded){await __.loading;}

				// Keep track of resource promises
				let resThreads=[];

				for(let item of list){
					if(cfg.debug){console.log('Processing '+item.url);}

					// Ensure item has URL and Type
					if(!item.hasOwnProperty('url')||!item.hasOwnProperty('type')){
						console.error('Resource list must be an array of objects with defined URL and Type.');
						continue;
					}

					// Ensure item Type is supported
					if(!['js','css','font'].includes(item.type)){
						console.error('Resource type '+item.type+' cannot be loaded via load(). You should use cache() instead.');
						continue;
					}

					// If Type is a font, ensure it has a name
					if(item.type=='font' && !item.hasOwnProperty('name')){
						console.error('Font resources require "name" property to be defined.');
						continue;
					}

					if(cfg.debug){console.log('Loading '+item.url+' ...');}

					// Split each resource in a separate thread
					resThreads.push(new Promise(async (resolveThread)=>{

						// Check if resource is in storage
						var storedVersion=await check(item.url).then(storedVersion=>{return storedVersion;});
						
						// Cache not found
						if(!storedVersion){
							if(cfg.debug){console.log('Cache not found, downloading ...');}

							// Not found in storage, attempt to download it
							if(!__.online){
								console.error('Device is Offline, cannot download. Terminating ...');
								return false;
							}
							downloadAndStore(item.url, item.type).then((r)=>{
								// Pass name to renderItem if it is a font
								if(item.type=='font' && item.hasOwnProperty('name')){r.name=item.name;}

								renderItem(r);
								resolveThread();
							});
							// Continue with next resource
							return;
						}

						// If updates are enabled
						if(cfg.checkForUpdates){
							if(!__.online){
								if(cfg.debug){console.log('Device is Offline, skipping update check.');}
								getFromStorage(item.url).then((r)=>{
									// Pass name to renderItem if it is a font
									if(item.type=='font' && item.hasOwnProperty('name')){r.name=item.name;}
			
									renderItem(r);
									resolveThread();
								})
								// Continue with next resource
								return;
							}

							// Get version of live resource
							var liveVersion=await getHeadersHash(item.url).then(liveVersion=>{return liveVersion;});

							// Compare versions
							if(storedVersion===liveVersion){
								if(cfg.debug){console.log('Cached version is up-to-date.');}
								getFromStorage(item.url).then((r)=>{
									// Pass name to renderItem if it is a font
									if(item.type=='font' && item.hasOwnProperty('name')){r.name=item.name;}
			
									renderItem(r);
									resolveThread();
								})
								// Continue with next resource
								return;
							}

							if(cfg.debug){console.log('Versions mismatch, updating ...');}

							// Attempt to download and store it
							downloadAndStore(item.url, item.type).then((r)=>{
								if(cfg.debug){console.log('Updated to the latest version.');}

								// Pass name to renderItem if it is a font
								if(item.type=='font' && item.hasOwnProperty('name')){r.name=item.name;}

								renderItem(r);
								resolveThread();
							});
							// Continue with next resource
							return;
						}

						// Directly try to load and render the item
						getFromStorage(item.url).then((r)=>{
							// Pass name to renderItem if it is a font
							if(item.type=='font' && item.hasOwnProperty('name')){r.name=item.name;}

							renderItem(r);
							resolveThread();
						})
					}));
				};

				// Wait for all threads to complete before returning, ensuring all resources are loaded
				return await Promise.all(resThreads);
			}

			// Function to ensure resource is downloaded and stored in cache (accepts URL string or Array)
			async function cache(list){
				if(!Array.isArray(list)){
					console.error('cache() requires an array of at least one object.');
					return false;
				}

				// Ensure the library has loaded before proceeding
				if(!__.loaded){await __.loading;}

				for(let item of list){
					if(!item.hasOwnProperty('url')||!item.hasOwnProperty('type')){
						console.error('Resource list must be an array of objects with defined URL and Type.');
						continue;
					}

					if(cfg.debug){console.log('Caching '+item.url);}

					// Check if resource is in storage
					var storedVersion=await check(item.url).then(storedVersion=>{return storedVersion;});
					if(!storedVersion && cfg.debug){console.log('No stored version');}

					// Not found in storage, attempt to download it
					if(!storedVersion){
						if(!__.online){
							console.error('Resource is not cached but the Device is Offline - cannot download.');
							continue;
						}
						if(cfg.debug){console.log('Downloading ...');}
						downloadAndStore(item.url, item.type).then(()=>{
							if(cfg.debug){console.log('Latest version downloaded and cached.');}
						});
						continue;
					}

					if(cfg.checkForUpdates){
						if(!__.online){
							console.warn('Resource cached but the Device is Offline - cannot check for updates.');
							continue;
						}

						// Check if resource is up-to-date
						var liveVersion=await getHeadersHash(item.url).then(liveVersion=>{return liveVersion;});

						if(storedVersion===liveVersion){
							if(cfg.debug){console.log('Cached version is up-to-date.');}
							continue;
						}

						if(cfg.debug){console.log('Versions mismatch, updating ...');}

						downloadAndStore(item.url, item.type).then(()=>{
							if(cfg.debug){console.log('Updated to the latest version.');}
						});
					}

					if(cfg.debug){console.log(item.url+' is ready');}
				}
			}

			// Retrieve item from Cache/localStorage and directly return the content
			async function get(res){
				var item=await getFromStorage(res);
				if(item && item.hasOwnProperty('content')){return item.content;}

				return false;
			}

			// Check specific resource for updates
			// Requires an object {type, url}
			async function update(item){
				if(typeof item!=='object' || !item.hasOwnProperty('type') || !item.hasOwnProperty('url')){
					console.error('update() requires an object with Type and URL properties.');
					return false;
				}

				// Get the update state so we can revert back to it once done
				var initialUpdateState=cfg.checkForUpdates;

				// Enable updates to force cache() to check live version
				cfg.checkForUpdates=true;

				await cache([item]);

				// Revert back to initial state
				cfg.checkForUpdates=initialUpdateState;
			}

			// Check all cached static resources for updates
			async function updateAll(){
				// Ensure the library has loaded before proceeding
				if(!__.loaded){await __.loading;}

				// Ignore update request if device is offline
				if(!__.online){
					console.warn('Device is Offline - cannot check for updates.');
					return false;
				}

				// Get the update state so we can revert back to it once done
				var initialUpdateState=cfg.checkForUpdates;

				switch(cfg.storage){
					case 'local':
						// Crawl localStorage keys and update each resource individually
						for(var i=0;i<localStorage.length;i++){
							var k=localStorage.key(i);
							if(k.startsWith(cfg.namespace+'::')&&k.endsWith('::V')){
								// Get item URL from the key by stripping the prefix and suffix
								var url=k.replace(new RegExp('^' + cfg.namespace + '::|::V$','g'), '');
								var c=JSON.parse(localStorage.getItem(k));

								var liveVersion=await getHeadersHash(url).then(liveVersion=>{return liveVersion;});
								if(c.ver===liveVersion){
									if(cfg.debug){console.log('Cached version is up-to-date.');}
									continue;
								}

								if(cfg.debug){console.log('Versions mismatch, updating ...');}

								downloadAndStore(url, c.type).then(()=>{
									if(cfg.debug){console.log('Updated to the latest version.');}
								})
							}
						}

						break;
					case 'cache':
						for(let item of await __.cache.tag.keys()){
							var tag=JSON.parse(
								await __.cache.tag.match(item.url).then((r)=>{return r.text();})
							);

							// Check if resource is up-to-date
							var liveVersion=await getHeadersHash(item.url).then(liveVersion=>{return liveVersion;});
							if(tag.ver===liveVersion){
								if(cfg.debug){console.log('Cached version is up-to-date.');}
								continue;
							}

							if(cfg.debug){console.log('Versions mismatch, updating ...');}

							downloadAndStore(item.url, tag.type).then(()=>{
								if(cfg.debug){console.log('Updated to the latest version.');}
							});
						}
						break;
				}

				// Revert back to initial state
				cfg.checkForUpdates=initialUpdateState;
			}
		
			// Function to clear all cached static resources
			// If the optional parameter is passed ('cache', 'local') it will clear only that storage
			// If the parameter is not passed - all possible storages will be cleared by this.namespace
			async function clearAll(storage){
				var store='all';

				if(storage){
					if(!['cache','local','ls','localStorage'].includes(storage.toLowerCase())){
						console.error('Invalid storage type passed to clearAll().');
						return false;
					}
					store=storage.toLowerCase();
				}

				switch(store){
					case 'cache':
						await cleanCacheStorage();
						break;
					case 'local':
					case 'ls':
					case 'localStorage':
						cleanLocalStorage();
						break;
					case 'all':
						await cleanCacheStorage();
						cleanLocalStorage();
						break;
				}
			}

		// Construct the library
		constructor(opts);

		// Export the publicly accessible methods
		return{
			'debug': cfg.debug,
			'onlineCheckTimeout': cfg.onlineCheckTimeout,
			'checkForUpdates': cfg.checkForUpdates,
			'storage': cfg.storage,
			'namespace': cfg.namespace,

			'load': load,
			'cache': cache,
			'render': renderItem,
			'get': get,
			'update': update,
			'updateAll': updateAll,
			'clearAll': clearAll
		}
	}

	// Node module
	if(typeof module!=='undefined' && module.exports){module.exports=QuicheJS;}
	// AMD module
	else if(typeof define==='function' && define.amd){define(function(){return QuicheJS;});}
	// Browser
	else{_global['QuicheJS']=QuicheJS;}
}(typeof window!=='undefined'?window:this));