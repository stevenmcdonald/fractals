(function() {

var BurningShipApp = angular.module('BurningShipApp', []);

BurningShipApp.controller('BurningShipCtrl', function($scope) {

	var canvas = document.getElementById('fractal-canvas');

	$scope.ships = [
		{
			text: 'Whole ship',
			val: {
	            center: {
	                x: 0.45,
	                y: 0.5
	            },
	            range: 1.7
	        }
        },
        {
            text: 'First small ship',
            val: {
	            center: {
	                x: 1.755,
	                y: 0.03
	            },
	            range: 0.04
	        }
        },
        {
            text: 'Second small ship',
            val: {
	            center: {
	                x: 1.625,
	                y: 0.035
	            },
	            range: 0.04
	        }
        },
        {
            text: 'Tiny ship 1',
            val: {
	            center: {
	                x: 1.941,
	                y: 0.004
	            },
	            range: 0.005
	        }
        },
        {
            text: 'Tiny ship 2',
            val: {
	            center: {
	                x: 1.861,
	                y: 0.005
	            },
	            range: 0.008
	        }
        }
	];

	$scope.itr = 88;
	$scope.center_range_select = $scope.ships[4].val;

	$scope.center = {
		x: 0,
		y: 0
	};
	$scope.range = 3;

	$scope.$watch('center_range_select', function(newVal) {
		if(newVal) {
			console.log("setting center_range... ", newVal);
			$scope.center.x = newVal.center.x;
			$scope.center.y = newVal.center.y;
			$scope.range = newVal.range;
			$scope.start();
		}
	});

	$scope.start = function() {
		console.log('starting...');
		window.scm.BurningShipFractal.startWorker({
			canvas: canvas,
			itr:    $scope.itr,
			center: $scope.center,
			range:  $scope.range
		});
	};

	$scope.start();

	// pure JS save image
	var saveButton = document.getElementById('save-image');
    saveButton.addEventListener('click', function() {
        var dataURL = document.getElementById('fractal-canvas').toDataURL("image/png");
        var timestamp = new Date().getTime();
        saveButton.href = dataURL;
        saveButton.download = 'burning-ship-fractal-'+timestamp+'.png';
    });

});


})();