// Info: Test Cases
'use strict';

// Shared Dependencies
var Lib = {};

// Set Configrations
const http_config = {
  ///'TIMEOUT': 400, // small value shoud cause timeout
  'TIMEOUT': 3000, // In milliseconds (3 second). 0 means no timeout
  'USER_AGENT': 'Test App 1.0' // Not used by browser
};

// Simulate Browser Window
// For jQuery to work in Node, a window with a document is required.
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM('', { url: 'https://postman-echo.com/' });
const { document } = (new JSDOM('')).window;
global.document = document;

// Simulate FormData
const FormData = require('form-data'); // NodeJS implementation of Browser's FormData

// Dependencies
Lib.Jquery  = require('jquery')(window);
Lib.Utils = require('js-helper-utils');
Lib.Debug = require('js-helper-debug')(Lib);
Lib.Instance = require('js-helper-instance')(Lib);
const Http = require('js-helper-http-browser')(Lib, http_config);


////////////////////////////SIMILUTATIONS//////////////////////////////////////

function test_output(err, status, headers, data){ // Err, Result are from previous function

  if(err){ // If error
    Lib.Debug.log('HTTP Error:', err);
  }
  else{

    Lib.Debug.log('status:', status );
    Lib.Debug.log('headers:', JSON.stringify(headers) );
    Lib.Debug.log('data:', JSON.stringify(data) );

    // Write Output to file
    require('fs').writeFile('output.json', JSON.stringify(data), function(err){
      if(err){ return console.log(err); }
      console.log('The file was saved!');
    });

  }

}

///////////////////////////////////////////////////////////////////////////////


/////////////////////////////STAGE SETUP///////////////////////////////////////

/////////////////////////////STAGE SETUP///////////////////////////////////////

// Initialize 'instance'
var instance = Lib.Instance.initialize();

// Set test url
///const url = 'http://dummy.restapiexample.com/api/v1/employees'; // single value
///const url = 'https://jsonplaceholder.typicode.com/todos/1';
const url = 'https://postman-echo.com/post';

// Set dummy body data
var params = {
  'param1': 'yellow',
  'param2': 'red',
  'special': ['quick', 'brown', 'fox']
};


// Dummy Data for multipart Form
var fs = require('fs');
//var file_small = fs.createReadStream('dummy_data/4kb.png');
var file_small = fs.createReadStream('dummy_data/4kb.png');
var file_text = fs.createReadStream('dummy_data/payload.txt');
var file_large = fs.createReadStream('dummy_data/5mb.jpg');


var form = new FormData();
form.append('param1', 'yellow');
form.append('param2', 'red');
form.append('my_buffer', new Buffer(10), {contentType: 'plain/text'});
form.append('file1', file_small);
form.append('file2', file_text, {contentType: 'plain/text'});


///////////////////////////////////////////////////////////////////////////////



/////////////////////////////////TESTS/////////////////////////////////////////

/*
// GET Test
Http.fetchJSON(
  instance,
  test_output,
  url, //url
  'GET', // method
  params, // params
  { // Options
    'request_content_type': 'json' // response type
  }
);
*/



// POST File Upload Test
Http.fetchJSON(
  instance,
  test_output,
  url, //url
  'POST', // method
  form, // params
  { // Options
    'request_content_type': 'multipart', // Request Content Type
    'timeout': 30000 // Long Timeout
  }
);

///////////////////////////////////////////////////////////////////////////////
