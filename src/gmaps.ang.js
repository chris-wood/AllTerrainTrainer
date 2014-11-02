// Google maps stuff
var elevator;
var map;
var chart;
var polyline;
var songs;
var elevations;
var pathLength;

// The following path marks a general path from Mt.
// Whitney, the highest point in the continental United
// States to Badwater, Death Valley, the lowest point.
var whitney = new google.maps.LatLng(36.578581, -118.291994);
var lonepine = new google.maps.LatLng(36.606111, -118.062778);
var owenslake = new google.maps.LatLng(36.433269, -117.950916);
var beattyjunction = new google.maps.LatLng(36.588056, -116.943056);
var panamintsprings = new google.maps.LatLng(36.339722, -117.467778);
var badwater = new google.maps.LatLng(36.23998, -116.83171);

var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var haight = new google.maps.LatLng(37.7699298, -122.4469157);
var ucsf = "UCSF, CA";
var ucsfAddress;
var oceanBeach = new google.maps.LatLng(37.7683909618184, -122.51089453697205);

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

function initialize() {
  var mapOptions = {
    zoom: 8,
    center: haight,
    mapTypeId: 'terrain'
  }
  directionsDisplay = new google.maps.DirectionsRenderer();

  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  directionsDisplay.setMap(map);

  // Create an ElevationService.
  elevator = new google.maps.ElevationService();

  // Draw the path, using the Visualization API and the Elevation service.
  // drawPath();
}

function getLatLong(address){
    var geo = new google.maps.Geocoder;

    geo.geocode({'address':address},function(results, status){
            if (status == google.maps.GeocoderStatus.OK) {
              ucsfAddress = results[0].geometry.location;
              drawPath();
            } else {
              alert("Geocode was not successful for the following reason: " + status);
            }

     });
}

function drawPath() {

  var pathRequest = {
      origin: haight,

      destination: oceanBeach,

      waypoints : [
        {
          location:ucsfAddress,
          stopover:false
        }
      ],

      // Note that Javascript allows us to access the constant
      // using square brackets and a string value as its
      // "property."
      travelMode: google.maps.TravelMode["BICYCLING"]
  };
  directionsService.route(pathRequest, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);

      var path = response.routes[0].overview_path; // array
      pathLength = google.maps.geometry.spherical.computeLength(path);
      console.log("Path length: " + pathLength);

      // Create a PathElevationRequest object using this array.
      // Ask for 256 samples along that path.
      var pathRequest = {
        'path': path,
        'samples': 256
      }
      elevator.getElevationAlongPath(pathRequest, plotElevation); 
    }
  });
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
  if (status != google.maps.ElevationStatus.OK) {
    console.log("raw");
    return;
  }
  elevations = results;

  // Create a new chart in the elevation_chart DIV.
  chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));

  console.log("extracting elevations");

  // Extract the elevation samples from the returned results
  // and store them in an array of LatLngs.
  var elevationPath = [];
  for (var i = 0; i < results.length; i++) {
    elevationPath.push(elevations[i].location);
  }

  // Display a polyline of the elevation path.
  var pathOptions = {
    path: elevationPath,
    strokeColor: '#0000CC',
    opacity: 0.4,
    map: map
  }
  polyline = new google.maps.Polyline(pathOptions);

  // Extract the data from which to populate the chart.
  // Because the samples are equidistant, the 'Sample'
  // column here does double duty as distance along the
  // X axis.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sample');
  data.addColumn('number', 'Elevation');
  for (var i = 0; i < results.length; i++) {
    data.addRow(['', elevations[i].elevation]);
  }

  // Draw the chart using the data within its DIV.
  document.getElementById('elevation_chart').style.display = 'block';
  chart.draw(data, {
    height: 150,
    legend: 'none',
    titleY: 'Elevation (m)'
  });

  // Fetch the angular scope and invoke the fetch songs thingy
  angular.element(document.getElementById('main-div')).scope().fetchSongs(pathLength, elevations);
}

google.maps.event.addDomListener(window, 'load', initialize);

// Dashboard module and controller definitions
app = angular.module('gmap-app', []);
var appController = function($scope, $http, $document, $location) {

  // TODO: how to form this query from the Google Maps stuff?
  $scope.songs = [];
  $scope.fetchSongs = function(pathLength, elevations) {

    console.log(pathLength + "m");
    console.log(elevations);

    songs = $http.get('http://developer.echonest.com/api/v4/song/search?api_key=D3MGKE6ZLQXWAKSPY&style=rock&min_danceability=0.65&min_tempo=140&results=5').
    success(function(data, status, headers, config) {
      // this callback will be called asynchronously
      // when the response is available
      console.log(data); 
      $scope.songs = data.response.songs;
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.renderPathAndSongs = function() {
    getLatLong(ucsf);
  } 

  // genres
    $scope.genres = ['rock', 'hiphop', 'dubstep'];
    
    // selected genres
    $scope.selection = [];
    
    // toggle selection for a given fruit by name
    $scope.toggleSelection = function toggleSelection(genreName) {
      var idx = $scope.selection.indexOf(genreName);
      
      // is currently selected
      if (idx > -1) {
        $scope.selection.splice(idx, 1);
      }
      
      // is newly selected
      else {
        $scope.selection.push(genreName);
      }
    };

};
app.controller('appController', appController);