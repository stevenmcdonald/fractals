(function() {
  'use strict';

  const BuddhaApp = angular.module('BuddhaApp', []);

  BuddhaApp.controller('BuddhaController', function($scope) {
    let editor;

    $scope.presets = {
      quick: {
        text: 'Quick',
        plots: 1,
        min_itr: 0,
        max_itr: 200,
        colormap: 'monochrome',
      },
      deep: {
        text: 'Deep',
        plots: 100,
        min_itr: 2000,
        max_itr: 20000,
        colormap: 'monochrome',
      },
      deeper: {
        text: 'Deeper',
        plots: 1000,
        min_itr: 10000,
        max_itr: 20000,
        colormap: 'monochrome',
      },
      slow: {
        text: 'Slow',
        plots: 10000,
        min_itr: 2000,
        max_itr: 20000,
        colormap: 'monochrome',
      },
    };

    $scope.min_itr = 1000;
    $scope.max_itr = 2000;

    $scope.plots = 100;
    // $scope.colormap = 'monochrome';

    const cm = $('#color-map');
    const presets = $('#preset-select2');

    $scope.numThreads = 2;

    $scope.running = false;

    $scope.start = function start() {
      $scope.running = true;
      const options = {
        plots: $scope.plots,
        min_itr: $scope.min_itr,
        max_itr: $scope.max_itr,
        canvas: document.getElementById('buddhabrot-canvas'),
        colormap: cm.select2('val'),
        threads: $scope.numThreads,
      };
      console.log('starting...', options);
      window.scm.Buddha.startBuddha(options);
    };

    $scope.findCurlies = function findCurlies() {
      $scope.running = true;
      const options = {
        curlies: $scope.plots,
        min_itr: $scope.min_itr,
        max_itr: $scope.man_itr,
      };
      window.scm.Buddha.startCurlies(options);
    };

    $scope.stop = function stop() {
      $scope.running = false;
      console.log('stopping...');
      window.scm.Buddha.stopBuddha();
    };

    window.scm.Buddha.doneCallback = function doneCallback() {
      $scope.running = false;
      $scope.$apply();
    };

    function applyPreset(p) {
      console.log({ p });
      $scope.plots = p.plots;
      $scope.min_itr = p.min_itr;
      $scope.max_itr = p.max_itr;
      $scope.colormap = p.colormap;
    }

    $scope.showCustomEditor = false;

    cm.select2().on('change', (e) => {
      $scope.colormap = e.val;
      console.log('colormap change: ', $scope.colormap);

      if ($scope.colormap === '__user') {
        if (!editor) { setupAce(); }
        $scope.showCustomEditor = true;
      } else {
        $scope.showCustomEditor = false;
        window.scm.Buddha.redraw($scope.colormap);
      }
      $scope.$apply();
    });

    $scope.redrawUserColorMap = () => {
      const code = editor.getValue();
      let userColorMap;

      try {
        userColorMap = eval(code);
      } catch (e) {
        console.log('user color map failed: ', e);
      }

      if (userColorMap) {
        if (typeof userColorMap !== 'function') {
          console.log('not a function');
        }
        try {
          console.log('userColorMap(0, 0): ' + userColorMap(0, 0));
          console.log('userColorMap(255, 1): ' + userColorMap(255, 1));
        } catch (e) {
          console.log('test failed: ' + e);
        }

        window.scm.Buddha.userColorMap = userColorMap;
        window.scm.Buddha.redraw('__user');
      }
    };

    presets.select2({ placeholder: 'presets' }).on('change', (e) => {
      console.log(e.val);
      const p = $scope.presets[e.val];
      applyPreset(p);
      $scope.$apply();
    });


    function setupAce() {
      editor = ace.edit('editor');
      editor.setTheme('ace/theme/monokai');
      editor.getSession().setMode('ace/mode/javascript');
    }

    const saveButton = document.getElementById('save-image');
    saveButton.addEventListener('click', () => {
      const dataURL = document.getElementById('buddhabrot-canvas').toDataURL('image/png');
      const timestamp = new Date().getTime();
      saveButton.href = dataURL;
      saveButton.download = `buddha-${timestamp}.png`;
    });
  });
}());
