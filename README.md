# QuicheJS
A small library allowing you to easily cache static resources in Cache API or localStorage and serve them locally, instead of fetching them from the network every time.

By using QuicheJS, you can significantly reduce your app/website bandwidth usage and in the same time greatly improve the loading time.

The library is especially effective for projects built with frameworks that generate large bundles, such as _Angular_, _React_, _Vue_, etc.

Internet browsers do their best to cache resources, QuicheJS outperforms them and gives you full control over cached items.

The name is a combination of the words **_Quick_** and **_Cache_**:

**Qui**`ck`  + `Ca`**che** _==_ **Quiche**

<br /><br /><br /><br />

# Performance

The performance difference between using static resources from a live server compared to cached ones is staggering.

For testing purposes a few HTML documents were created, ranging from a total assets size between 500 KB to 20 MB. Results show unprecedented performance boost from using QuicheJS - the larger the static resources pool is, the higher the performance boost.

> **NOTE**
>
> 1. The only difference between each benchmark is the total amount of resources and the total size. All tests were performed using the same:
> - laptop
> - internet connection
> - web browser
> - web server
> 2. The results are the averages of 100 loads for each test

Here are the results of the benchmarks:

#### 500KB benchmark
- Resources: `4`
- Total size of resources: `500KB`
> |                        	| **-QuicheJS** 	| **+QuicheJS cache** 	|
> |------------------------	|:-------------:	|:-------------------:	|
> | Load time              	|          107ms 	|                ~30ms 	|
> | Time to full render   	|     **110ms.** 	|            **~30ms** 	|

---

<br />

#### 1MB benchmark
- Resources: `12`
- Total size of resources: `1MB`
> |                        	| **-QuicheJS** 	| **+QuicheJS cache** 	|
> |------------------------	|:-------------:	|:-------------------:	|
> | Load time              	|          129ms  |                ~41ms 	|
> | Time to full render   	|     **134ms.** 	|            **~41ms** 	|

---

<br />

#### 5MB benchmark
- Resources: `20`
- Total size of resources: `5MB`
> |                        	| **-QuicheJS** 	| **+QuicheJS cache** 	|
> |------------------------	|:-------------:	|:-------------------:	|
> | Load time              	|          490ms  |                44ms 	|
> | Time to full render   	|     **500ms.**  |            **45ms** 	|

---

<br />

#### 10MB benchmark
- Resources: `27`
- Total size of resources: `10MB`
> |                        	| **-QuicheJS** 	| **+QuicheJS cache** 	|
> |------------------------	|:-------------:	|:-------------------:	|
> | Load time              	|         1070ms  |                48ms 	|
> | Time to full render   	|    **1182ms.**  |            **50ms** 	|

---

<br />

#### 20MB benchmark
- Resources: `33`
- Total size of resources: `20MB`
> |                        	| **-QuicheJS** 	| **+QuicheJS cache** 	|
> |------------------------	|:-------------:	|:-------------------:	|
> | Load time              	|         1910ms  |                51ms 	|
> | Time to full render   	|    **2486ms.**  |            **54ms** 	|

<br /><br /><br /><br />

# Getting Started
QuicheJS is really easy and simple, requiring minimal configuration.

To use `QuicheJS`, you need to import the library into your project and just run the method you want:

```html
<script src='https://cdn.jsdelivr.net/gh/DinomNet/QuicheJS@main/dist/quiche.min.js'></script>
<script>
// Optional configuration parameters
let quiche_cfg={
  'debug':true,
  'storage': 'ls'
};

let quiche=QuicheJS(quiche_cfg);
</script>
```

<br />

#### `Load()` example
```javascript
// Load cached items by adding them to the DOM tree
quiche.load(
  [
    // jQuery library from Google CDN
    {
      'type': 'js',
      'url': 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js'
    }
  ]
);
```

<br />

#### `Cache()` *(pre-load)* example
```javascript
// Download and cache items, without adding them to the DOM tree
quiche.cache(
  [
    // Cache images you will need
    {
      'type': 'img',
      'url': 'https://yavuzceliker.github.io/sample-images/image-1.jpg'
    }
  ]
);
```

<br />

You can tweak the configuration parameters per your liking, by directly passing the options as an object parameter. This is optional, you don't have to touch it unless you want to. For more information about **Supported Options**, please refer to the [Configuration section](#configuration).

<br />

> You can also load QuicheJS directly from cache. You can find an example in [this section](#load-quichejs-from-cache)


<br /><br /><br /><br />


# How it works
To start using `QuicheJS` pass an array of static resources to either the `load()` method, or `cache`, depending on whether you want the resources directly rendered or cached/preloaded. For more information, please check the [Loading resources examples](#loading-resources-examples).

Once you've done that, `QuicheJS` will take care of the rest.

<br />

> The following breakdown of the programming logic asumes the default configuration parameters. Tweaking the parameters would likely result in a slightly different behaviour.

During initialisation, `QuicheJS` will check if the device is online and connected to the Internet. This is done via quick headers request to Google. It is necessary as it allows faster resource loading on offline devices (it eliminates the need to check the versions of each resource).

For each resource passed to the `load()` method, `QuicheJS` will:


### 1. Check if the item has been previously cached
> *If cached copy is not found:*
> - Download the item
> - Save it in the selected storage
> - Render the item by adding it to the DOM tree
> - End the iteration and process the next item

### 2. Get the version of the item available online (if client is online)
> This is done by sending a HEAD request to the resource and parsing `Last-Modified` and `ETag` headers


### 3. Compare if the local and live versions are the same
> *Same version - no update necessary*
> - Render the item from cache by adding it to the DOM tree
> - End the iteration and process the next item

> *Different versions, have to update*
> - Download the item
> - Save it in the selected storage
> - Render the item by adding it to the DOM tree
> - End the iteration and process the next item

---

<br />

**NB*
The programming logic of `cache()` and `load()` is the same, but `cache()` doesn't do the rendering actions.

<br /><br /><br /><br />

# Configuration
You can tweak the configuration parameters of `QuicheJS` to better suit the needs of your project.

<br />

###  Currently supported options

#### **debug**
Used when you want to debug what the library does
> - Data type: `boolean`
> - Default: `false`

<br />

#### **onlineCheckTimeout**
Timeout, in miliseconds, for checking the live version of a resource (a.k.a. request timeout)
> - Data type: `integer`
> - Default: `1500`

<br />

#### **checkForUpdates**
Should QuicheJS check the live version of each resource
> - Data type: `boolean`
> - Default: `true`

<br />

#### **storage**
Which Storage should be used for caching items - localStorage or Cache API.
 
You can keep more data in Cache API than in localStorage, but it is arguably slower.

> Rule of thumb: If the project uses less than 5MB of assets - use localStorage. For everying else - Cache API.

> - Data type: `string`
> - Expected: `cache` || `local` || `localStorage` || `ls`
> - Default: `cache`

<br />

#### **namespace**
The namespace to be used for storing the cached items. 

This is useful when you use the same storage type for other things besides cached resources. The namespace can help you make the difference between the cached items and your own data.

> - Data type: `string`
> - Default: `quiche`

---

#### Example configuration
```javascript
let q=Quiche({
  'debug': true,
  'onlineCheckTimeout': 5000,
  'checkForUpdates': false,
  'storage': 'local',
  'namespace': 'MyAwesomeProject'
});
```


<br /><br /><br /><br />

# Supported methods
`QuicheJS` is a simple to use library and the learning curve isn't steep. There are **7** methods in total:

- [`load()`](#load)
- [`cache()`](#cache)
- [`get()`](#get)
- [`render()`](#render)
- [`update()`](#update)
- [`updateAll()`](#updateall)
- [`clearAll()`](#clearall)

Below you can find short summary on what each method does and an example how to use it.

<br />

### load()
As the name suggests, with this method you can load cached static resources and add them to the DOM tree.

> If any of the resources are not cached - they will be downloaded and cached for future use.

To use `load()` you have to supply an array of objects containing the type of the resource, and it's URL.

The method supports only the types:
- CSS
- JS
- Font
> Note: For other types you should do `cache()` to store items, and then `get()` to manually process and render them per your needs.


> `load()` is an async method with no expected return. It would return data only if there are errors.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

/* Load 3 items:
 * - Reset stylesheet
 * - jQuery
 * - MonaSans font
*/
quiche.load(
  [
    // normalize.css by github.com/necolas
    {
        'type': 'css',
        'url': 'https://necolas.github.io/normalize.css/8.0.1/normalize.css'
    },

    // jQuery library from Google CDN
    {
        'type': 'js',
        'url': 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js'
    },

    // MonaSans Medium
    {
        'type': 'font'
        'name': 'MonaSans-Medium',
        'url': 'https://github.com/github/mona-sans/raw/refs/heads/main/fonts/webfonts/MonaSans-Medium.woff'
    }
  ]
);
```
This example gets a CSS file, jQuery, and MonaSans, from storage and directly adds them to the DOM tree.
> If the resources are not cached yet, they are downloaded and cached first.

If you try this example of `load()` you will:
- see the CSS rules applied to the document
- have access to jQuery
- have the MonaSans font available for your styling needs

<br />

> **IMPORTANT NOTE**
> 
> Font files require `name` property to be set to allow you to define additional parameters to the font family later, via your own CSS.


---

<br />

### cache()

Often preloading resources is preferred to allow for better user experience. With the `cache()` method you can get all the static resources you need right from the start. This way they can be directly loaded from cache when you need them.

If you are using `QuicheJS` inside of an app or PWA, with `cache()` you can easily and quickly make your app fully offline capable.

The `cache()` method works just like the `load()` method, minus the rendering part. Invoking it is also identical to `load()`

> `cache()` is an async method with no expected return. It would return data only if there are errors.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

// Ensure 2 images are cached
quiche.cache(
  [
    {
        'type': 'img',
        'url': 'https://yavuzceliker.github.io/sample-images/image-1.jpg'
    },
    {
        'type': 'img',
        'url': 'https://yavuzceliker.github.io/sample-images/image-2.jpg'
    }
  ]
);
```
This example ensures you have the two specified images stored in cache.

> If the resources are not already cached, they will be downloaded and cached so you can use them when you need them.

<br />

> **IMPORTANT NOTE**
>
> Saving items in storage is one thing, fetching them when needed is another.
> Refer to the [`get()`](#get) and [`render()`](#render) methods for more information how to work with your cached resources.

---

<br />

### get()

With the `get()` method you can quickly fetch the contents of a cached resource. If the resource you are trying to work with is not found in the storage the method will return `false`.

The method can be invoked only for a single resource.

> `get()` is an async method which returns textual resources as string, or binary data as a blob.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

// Fetch the contents of jQuery
let Cached_jQuery=quiche.get('https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');
```
The value of the `Cached_jQuery` variable would be the contents of the jQuery library, if the library has been already cached, and `false` if there is no cache for the requested resource.

---

<br />

### render()

Sometimes you might need a single static resource added to the DOM tree. With the `render()` method you can directly render an item you have fetched from cache, with the `get()` method.

The method supports only the types:
- CSS
- JS
- Font
> **Notes**
> 1. For other types you should do `cache()` to store items, and then `get()` to manually process and render them per your needs.
> 2. If you need to render more than a single resource, you should use `load()`

> `render()` is a sync method with no expected return. It would return data only if there are errors.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

// Fetch the contents of jQuery
let Cached_jQuery=quiche.get('https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');

quiche.render({
  'type': 'js',
  'content': Cached_jQuery
});
```
This example retrieves the contents of previously cached jQuery library, and adds it to the DOM tree, allowing you to use jQuery in the document.

---

<br />

### update()

In situations where you'd like to force a single update check on a resource, you can use `update()` to do so.

Once the `update()` method is invoked, `QuicheJS` will query the live server to check the headers of the current live file and compare it with the cached copy. In case the headers differ the file from the server will be downloaded and cached.

> `update()` is an async method with no expected return. It would return data only if there are errors.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

// Check if jQuery's library has been updated
quiche.update('https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');
```

With this example, if the jQuery library file has been updated on the CDN, `QuicheJS` will download and update the cached item.

> **IMPORTANT NOTE**
>
> When resources are updated, if they are already rendered (part of the DOM tree), the update resource will not be applied automatically to the DOM tree.
>
> If you need updates to be reflected in the DOM tree immediately, you will need to write the programming logic for this.

---

<br />

### updateAll()

The `updateAll()` method checks all cached resources for any newer versions and updates the cached items.

> `updateAll()` is an async method with no expected return. It would return data only if there are errors.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

// Check every cached resouce for a newer version
quiche.updateAll();
```

---

<br />

### clearAll()

With `clearAll()` you can remove all items cached by `QuicheJS`, retaining any items you might've stored in the same storage.

By default the method looks for items stored in all storages, but you can specify which storage you'd like to clear.

> Supported options:
> - cache
> - local
> - all (*default*)

> `clearAll()` is an async method with no expected return. It would return data only if there are errors.

##### Example
```javascript
// Initiate Quiche
let quiche=Quiche();

// Clear all items cached by QuicheJS, in any storage
// quiche.clearAll();

// Clear all items cached by QuicheJS in localStorage
quiche.clearAll('local');
```

---

<br /><br /><br /><br />

# Loading resources examples

The easiest way to load resources and directly have them available in your DOM tree is the `load()` method.

The first time the code runs on the device, it will download the files and store them before rendering. All following loads of the document on the device will result in the library getting the contents of the items directly from cache.

```javascript
// Initiate QuicheJS
let quiche=QuicheJS();

// Add the static resources you need to the DOM tree of the document
quiche.load(
  [
    {
        'type': 'js',
        'url': 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js'
    },
    {
        'type': 'js',
        'url': 'https://cdn.jsdelivr.net/npm/google-analytics-js@0.1.2/gajs.min.js'
    }
  ]
);
```
> This example will get jQuery and Google Analytics cached and added to the DOM tree.

---

<br />

> **IMPORTANT NOTE**
> 
> If you are adding lots of images to a document renderd on device with lower memory, you might run into memory issues.
> 
> For apps with different pages and large amount of images it is recommended to offload images you no longer need kept in memory. You can achieve this with a programming logic like this:

```javascript
// Global array to keep track of loaded images
let loadedImages=[];

q.get('https://fonts.gstatic.com/s/i/productlogos/gleaf_dual_tone/v1/192px.svg').then(img=>{
  // Create an HTML element for the image
  let imageEl = document.createElement('img');
  imageEl.src = URL.createObjectURL(img);

  // Add the image element to the DOM tree
  document.body.appendChild(imageEl);

  // Add each loaded image to the global array to keep a record of it
  loadedImages.push(imageEl);
});

// ...

// Later on, when the images are no longer needed, offload them to free up memory
loadedImages.forEach(function(imgEl, key){
  URL.revokeObjectURL(imgEl.src);
  imgEl.remove();
  delete(loadedImages[key]);
});
```

# Recommended usage
You can even cache the `QuicheJS` library, allowing your app to solely rely on offline resources.

There are various ways to achieve this, but you can consider the following method *The Recommended Approach* for doing this, just replace the demo resources with your own:

```javascript
<script>
  function Load_My_Resources(){
    var q=QuicheJS({
      'debug':true,
      'checkForUpdates': false,
      'storage': 'cache'
    });

    q.cache([
      {'type':'img', 'url': 'https://yavuzceliker.github.io/sample-images/image-2.jpg'},
      {'type':'js', 'url':'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js'}
    ]);

    q.load([
      {'type':'css', 'url': 'https://necolas.github.io/normalize.css/8.0.1/normalize.css'},
      {
        'type':'font',
        'url': 'https://github.com/github/mona-sans/raw/refs/heads/main/fonts/webfonts/MonaSans-Medium.woff',
        'name':'MonaSans-Medium'
      }
    ]);
  }

  // Load QuicheJS from cache
  async function Load_QuicheJS(){

    // Try to get QuicheJS from localStorage
    var quicheLS=localStorage.getItem('Quiche.js');
    if(quicheLS){
      // Try to parse QuicheJS
      var parsed=JSON.parse(quicheLS);
      if(typeof parsed=='string'){
        // Create a script tag to the head of the document for QuicheJS
        var s=document.createElement('script');
        s.innerHTML=parsed;
        document.head.appendChild(s);

        console.log('QuicheJS loaded from LocalStorage');
        return;
      }
    }

    // If the programming logic reached this, we need to download QuicheJS
    try{
      console.log('Local copy of QuicheJS was not found. Downloading it ...');
      var url='https://cdn.jsdelivr.net/gh/DinomNet/QuicheJS@main/dist/quiche.min.js';
      return await fetch(url).then((r)=>{
        if(!r.ok){throw new Error(`HTTP error on ${url}! status: ${r.status}`);}

        return r.text().then(code=>{
          localStorage.setItem('Quiche.js', JSON.stringify(code));

          // Create a script tag to the head of the document for QuicheJS
          var s=document.createElement('script');
          s.innerHTML=code;
          document.head.appendChild(s);

          console.log('Library downloaded and saved.');
        });
      });
    }
    catch(e){console.error(e);}
  }

  Load_QuicheJS().then(()=>{
    Load_My_Resources();
  });
</script>
```

<br /><br /><br /><br />

# Contributions and Issues
If you can help improve the code, or make it easier for others to use, please submit a PR with your suggestion. You can rest assure that all submissions will be carefully and thoroughly revised and considered.

**Any and all contributions are welcome and encouraged!**

In case you encounter any problems, or you have questions unanswered in this document - open up an issue and ask away, don't be shy 😌.

---

<br /><br /><br /><br />

```
If this library has helped you, please consider leaving a ⭐️ on the repo.
It would be much appreciated!


Happy caching! 🥰
```
