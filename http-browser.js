// Info: Boilerplate library. Contains Functions for Outgoing HTTP(s) requests (For browsers only and not for NodeJS)
// TODO: multipart requests
'use strict';

// Shared Dependencies (Managed by Loader)
var Lib = {};

// Exclusive Dependencies
var CONFIG = require('./config'); // Loader can override it with Custom-Config


/////////////////////////// Module-Loader START ////////////////////////////////

  /********************************************************************
  Load dependencies and configurations
  @param {Set} shared_libs - Reference to libraries already loaded in memory by other modules
  @param {Set} config - Custom configuration in key-value pairs
  @return nothing
  *********************************************************************/
  const loader = function(shared_libs, config){

    // Shared Dependencies (Must be loaded in memory already)
    Lib.Utils = shared_libs.Utils;
    Lib.Debug = shared_libs.Debug;
    Lib.Jquery = shared_libs.Jquery;

    // Override default configuration
    if( !Lib.Utils.isNullOrUndefined(config) ){
      Object.assign(CONFIG, config); // Merge custom configuration with defaults
    }

  };

//////////////////////////// Module-Loader END /////////////////////////////////


///////////////////////////// Module Exports START /////////////////////////////
module.exports = function(shared_libs, config){

  // Run Loader
  loader(shared_libs, config);

  // Return Public Funtions of this module
  return HttpBrowser;

};//////////////////////////// Module Exports END //////////////////////////////


///////////////////////////Public Functions START//////////////////////////////
const HttpBrowser = { // Public functions accessible by other modules

  /********************************************************************
  Get JSON-Data from remote server using http(s) protocal.
​
  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished
​
  @param {String} url - Full URL without protocal
  @param {String} method - ENUM-String for request method (GET | POST | .. )
  @param {Map} params - (Optional) Params to be sent with this request
  @param {Set} options - Additional Service parameters for http request
    * @param {String} request_content_type - (Optional) Request Body data type. Default: urlencoded ('json' | 'urlencoded' | 'multipart')
    ​​* @param {String} [timeout] - (Optional) Override default config Timeout (in seconds)
​​    * @param {Boolean} [without_credentials] - (Optional) Override default config with_credentials (Used for External Domain hits which does not require Cookies and Auth)

  @return - Thru Callback
​
  @callback(error, response_status,  response_data) - Request Callback
  * @callback {Integer} response_status - HTTP Response code from server
  * @callback {Map} response_headers - Return headers from response in Key-value. All keys are converted into lower-case.
  * @callback {ArrayBuffer | String | Object | Blob | Document | Stream} response_data - Return data as per response type.
  *********************************************************************/
  fetchJSON: function(instance, cb, url, method, params, options){

    // Fetch JSON data from URL
    _HttpBrowser.fetch(
      instance, cb,
      url, method,
      params,
      options['request_content_type'],
      options['timeout'],
      options['without_credentials']
    );

  },

};///////////////////////////Public Functions END//////////////////////////////


//////////////////////////Private Functions START//////////////////////////////
var _HttpBrowser = { // Private functions accessible within this modules only

  /********************************************************************
  Get Data from remote server using http(s) protocal.
​
  @param {reference} instance - Request Instance object reference
  @param {Function} cb - Callback function to be invoked once async execution of this function is finished
​
  @param {String} url - Full URL without protocal
  @param {String} method - ENUM-String for request method (GET | POST | .. )
  @param {Set|FormData} params - (Optional) Params to be sent with this request
  @param {String} request_content_type - (Optional) Request Body data type. Default: urlencoded ('json' | 'urlencoded' | 'multipart')
​  @param {String} [timeout] - (Optional) Override default config Timeout (in seconds)
​​  @param {Boolean} [without_credentials] - (Optional) Override default config with_credentials

  @return - Thru Callback
​
  @callback(err, response_status, response_headers, response_data) - Request Callback
  * @callback {Error} err - In case of error
  * @callback {Integer} response_status - HTTP Response code from server
  * @callback {Map} response_headers - Return headers from response in Key-value. All keys are converted into lower-case.
  * @callback {ArrayBuffer | String | Object | Blob | Document | Stream} response_data - Return data as per response type.
  *********************************************************************/
  fetch: function(instance, cb, url, method, params, request_content_type, timeout, without_credentials){

    // Determine Default Service-Params
    let option_process_data;
    let option_content_type;
    var with_credentials = true;

    // Request Content-Type is 'json'
    if( request_content_type === 'json' ){
      option_process_data = true;
      option_content_type = 'application/json';
    }

    // Request Content-Type is 'multipart'
    // Ref: https://stackoverflow.com/a/24939229/1449954
    else if( request_content_type === 'multipart' ){
      option_process_data = false; // Tell jQuery not to process the data
      option_content_type = false; // Tell jQuery not to set contentType
      with_credentials = false; // Temporary hack to fix multipart request to S3.
    }

    // Request Content-Type is not set or unknown (Default)
    else{
      option_process_data = true; // Default. Transform Set into a query string, fitting to the default content-type "application/x-www-form-urlencoded"
      option_content_type = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    // Override Request
    if( without_credentials ){
      with_credentials = false;
    }

    Lib.Jquery.ajax({
      async: true,
      cache: false,
      timeout: Lib.Utils.fallback(timeout, CONFIG.TIMEOUT),
      url: url,
      type: method,
      data: params,
      processData: option_process_data,
      contentType: option_content_type,
      ///enctype: 'multipart/form-data',
      //dataType: 'json', // Do not specify. Default Intelligent Guess (xml, json, script, or html)
      crossDomain: true,
      jsonp: true,
      xhrFields: {
        withCredentials: with_credentials
      },
      /*xhr: function(){ // Attach Progress Function
        var xhr = Lib.Jquery.ajaxSettings.xhr();
        if(xhr.upload){ // Will be hit for each file
          xhr.upload.addEventListener('progress', _HttpBrowser.progressHandler, false);
        }
        xhr.addEventListener('progress', _HttpBrowser.progressHandler, false); // Will be hit for entire request
        return xhr;
      },*/
      success: function(
        data, // Response data
        text_status, // Returns a DOMString containing the response string returned by the HTTP server
        xhr // XHR response object
      ){

        cb(
          null, // No error
          xhr.status,
          xhr.getAllResponseHeaders(),
          (data) ? data : null // Null as data in case of no response-body);
        )

      },
      error: function(
        xhr, // XHR response object
        text_status, // Returns a DOMString containing the response string returned by the HTTP server
        //  Possible values for the second argument (besides null) are "timeout", "error", "abort", and "parsererror".
        error // When an HTTP error occurs, error receives the textual portion of the HTTP status,
      ){

        // Network Error
        if(xhr.status===0){
          return cb( Lib.Utils.error(CONFIG.NETWORK_ERROR) );
        }

        cb(
          null, // No error
          xhr.status,
          xhr.getAllResponseHeaders(),
          null // Null as data in case of no response-body);
        )

      }
    });

  },


  /********************************************************************
  Progress Handler
  TODO: Attach custom function
  Ref: https://stackoverflow.com/questions/19126994/what-is-the-cleanest-way-to-get-the-progress-of-jquery-ajax-request
​​
  @param {Object} event - XHR Event

  @return {Number} percentage - Percentage of request completed
  *********************************************************************/
  progressHandler: function(event){

    var total = event.total;
    var current_position = event.loaded || event.position;
    var current_percent = 0;
    if(event.lengthComputable){
      current_percent = Math.ceil(current_position / total * 100);
    }

    console.log('total %', total )
    console.log('current_percent %', current_percent )

  },

};//////////////////////////Private Functions END//////////////////////////////
